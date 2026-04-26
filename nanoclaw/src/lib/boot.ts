/**
 * boot.ts — Agent identity boot for nanoclaw workers.
 *
 * Usage (call before any signing operation in a request handler):
 *
 *   import { ensureAgentKeypair } from './lib/boot'
 *
 *   export default {
 *     async fetch(request: Request, env: Env, ctx: ExecutionContext) {
 *       const kp = await ensureAgentKeypair(env)   // throws AgentBootError if key unavailable
 *       // kp.signData(bytes) — ready for on-chain Sui tx signing
 *     }
 *   }
 *
 * Sequence:
 *   Cold start
 *     → loadAgentToken (POST /api/agents/:uid/unlock) — verifies HMAC + TTL
 *     → POST /api/agents/:uid/unwrap  — proxy to owner-Mac daemon; returns raw seed
 *     → Ed25519Keypair.fromSecretKey(seedBytes) — ready to sign
 *     → cache keypair in module-level var — all subsequent calls return cached
 *
 * Error caching:
 *   On AgentBootError, the error is cached in `bootError`. All subsequent calls
 *   re-throw the cached error WITHOUT hitting any endpoint again. This prevents
 *   a retry storm on every request hitting a failed isolate. Only a new isolate
 *   (cold start) will retry.
 *
 * /unwrap error contract:
 *   503 owner-locked        → AgentBootError('owner-offline') — Touch ID needed
 *   503 daemon-*            → AgentBootError('owner-offline') — daemon issue
 *   401                     → AgentBootError('bad-bearer')
 *   403                     → AgentBootError('bad-bearer')
 *   404                     → AgentBootError('no-wallet')
 *   502                     → AgentBootError('unknown')    — corrupted/KDF mismatch
 *   200 wrong-length seed   → AgentBootError('unknown')
 *
 * Env vars required:
 *   AGENT_UID          — e.g. "marketing:scout"
 *   AGENT_BEARER       — bearer minted by POST /api/agents/register (shown once)
 *   UNLOCK_SIGNING_KEY — base64url HMAC key shared with one.ie unlock endpoint
 *   ONE_HOST           — optional; defaults to "https://one.ie"
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { AgentBootError, loadAgentToken } from './agent-key-load'

// ─── Shared b64url decode ─────────────────────────────────────────────────────

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ─── Module-level cache ──────────────────────────────────────────────────────
// One entry per isolate. Cold starts always re-fetch; warm isolates skip fetch.

/** Live Ed25519 keypair, null until first successful boot. */
let bootedKeypair: Ed25519Keypair | null = null

/** Sui address derived from the booted keypair. */
let bootedAddress: string | null = null

/** Cached boot error — re-thrown on every call once set. Prevents retry storms. */
let bootError: AgentBootError | null = null

// ─── Public API ──────────────────────────────────────────────────────────────

interface BootEnv {
  AGENT_UID?: string
  AGENT_BEARER?: string
  UNLOCK_SIGNING_KEY?: string
  ONE_HOST?: string
}

/**
 * Ensures the agent Ed25519 keypair has been derived and cached for this
 * isolate. Call this at the top of any request handler that requires on-chain
 * Sui signing, BEFORE the signing operation.
 *
 * Returns the live Ed25519Keypair on success.
 * Throws AgentBootError on any boot failure (cached after first failure).
 */
export async function ensureAgentKeypair(env: BootEnv): Promise<Ed25519Keypair> {
  // Fast path: already booted (success)
  if (bootedKeypair !== null) return bootedKeypair

  // Fast path: already failed (cache the error, prevent retry storm)
  if (bootError !== null) throw bootError

  // Guard: fail immediately with a clear error for missing env vars
  if (!env.AGENT_UID) {
    bootError = new AgentBootError('AGENT_UID env var not set — provision via wrangler secret put AGENT_UID', 'unknown')
    throw bootError
  }
  if (!env.AGENT_BEARER) {
    bootError = new AgentBootError(
      'AGENT_BEARER env var not set — provision via wrangler secret put AGENT_BEARER',
      'unknown',
    )
    throw bootError
  }
  if (!env.UNLOCK_SIGNING_KEY) {
    bootError = new AgentBootError(
      'UNLOCK_SIGNING_KEY env var not set — provision via wrangler secret put UNLOCK_SIGNING_KEY',
      'unknown',
    )
    throw bootError
  }

  const ownerHost = (env.ONE_HOST ?? 'https://one.ie').replace(/\/$/, '')

  try {
    // Step 1: fetch + verify the unlock token (HMAC sig + TTL check)
    const token = await loadAgentToken({
      ownerHost,
      uid: env.AGENT_UID,
      bearer: env.AGENT_BEARER,
      unlockSigningKeyB64: env.UNLOCK_SIGNING_KEY,
      maxAttempts: 6,
    })

    // Step 2: call /unwrap — proxy to owner-Mac daemon — returns raw seed bytes
    const unwrapRes = await fetch(`${ownerHost}/api/agents/${encodeURIComponent(env.AGENT_UID)}/unwrap`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AGENT_BEARER}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })

    if (unwrapRes.status === 503) {
      const body = (await unwrapRes.json().catch(() => ({}))) as Record<string, unknown>
      const errCode = typeof body.error === 'string' ? body.error : 'owner-locked'
      throw new AgentBootError(`unwrap blocked: ${errCode} — owner Touch ID required`, 'owner-offline')
    }
    if (unwrapRes.status === 401) {
      throw new AgentBootError('bearer rejected at unwrap', 'bad-bearer')
    }
    if (unwrapRes.status === 403) {
      throw new AgentBootError('bearer-uid mismatch at unwrap', 'bad-bearer')
    }
    if (unwrapRes.status === 404) {
      throw new AgentBootError('no agent_wallet at unwrap', 'no-wallet')
    }
    if (!unwrapRes.ok) {
      throw new AgentBootError(`unwrap unexpected status ${unwrapRes.status}`, 'unknown')
    }

    const { seedB64 } = (await unwrapRes.json()) as { ok: true; seedB64: string }
    const seedBytes = b64urlDecode(seedB64)

    if (seedBytes.length !== 32) {
      throw new AgentBootError(`unwrap returned wrong-length seed: ${seedBytes.length}`, 'unknown')
    }

    const kp = Ed25519Keypair.fromSecretKey(seedBytes)
    bootedKeypair = kp
    bootedAddress = token.address

    // Zero the seed bytes — keypair has them internalized
    seedBytes.fill(0)

    console.log(`[boot] agent ${env.AGENT_UID} keypair ready; address=${token.address}`)

    return kp
  } catch (e) {
    bootError = e instanceof AgentBootError ? e : new AgentBootError(String(e), 'unknown')
    throw bootError
  }
}

/**
 * Returns the Sui address from the last successful boot, or null if boot has
 * not completed.
 */
export function getBootedAddress(): string | null {
  return bootedAddress
}

/**
 * Resets the module-level boot cache. ONLY for use in tests.
 * Calling this in production code is a security violation.
 */
export function _resetBootCacheForTests(): void {
  bootedKeypair = null
  bootedAddress = null
  bootError = null
}

// ─── Deprecated shim ─────────────────────────────────────────────────────────

/**
 * @deprecated Use ensureAgentKeypair() instead.
 *
 * V1 shim: calls ensureAgentKeypair and returns a dummy string so existing
 * call sites that pattern-match on "non-null string = booted" continue to
 * compile. The ciphertextB64 concept is gone; this now returns "keypair:ready"
 * if boot succeeds, indicating the keypair is live but not exposing the seed.
 *
 * Remove once all call sites migrate to ensureAgentKeypair().
 */
export async function ensureAgentSeed(env: BootEnv & { [key: string]: unknown }): Promise<string> {
  await ensureAgentKeypair(env as BootEnv)
  return 'keypair:ready'
}

/**
 * @deprecated Use getBootedAddress() instead.
 * Returns null — the UnlockToken is no longer cached separately from the keypair.
 */
export function getBootedToken(): null {
  return null
}
