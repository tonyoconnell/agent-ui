/**
 * boot.ts — Agent identity boot for nanoclaw workers.
 *
 * Usage (call before any signing operation in a request handler):
 *
 *   import { ensureAgentSeed } from './lib/boot'
 *
 *   export default {
 *     async fetch(request: Request, env: Env, ctx: ExecutionContext) {
 *       await ensureAgentSeed(env)   // throws AgentBootError if key unavailable
 *       // ... handle request
 *     }
 *   }
 *
 * V1 LIMITATION: The token returned by loadAgentToken contains the AES-GCM
 * ciphertext still WRAPPED under the owner's WebAuthn-PRF-derived KEK. Until
 * the owner-Mac unwrap service ships (tracked in owner-todo §"Open carries" /
 * Gap 1 unwrap endpoint), the worker CANNOT derive the actual Ed25519 seed from
 * this token alone. What we CAN do in V1:
 *
 *   - Verify the token was minted correctly (HMAC sig + TTL)
 *   - Hold the verified ciphertextB64 in process memory
 *   - Block unauthenticated boots (fail closed on bad bearer / bad sig)
 *
 * The `bootedSeed` field is therefore a PLACEHOLDER: it stores the ciphertextB64
 * string cast to Uint8Array shape so call sites can pattern-match "seed is
 * available" vs "seed is not yet loaded". Actual Ed25519 signing is unblocked
 * when the unwrap service ships — at that point replace this placeholder with
 * a real `new Uint8Array(seed_bytes)` from the decrypted ciphertext.
 *
 * Sequence:
 *   Cold start → loadAgentToken (POST /api/agents/:uid/unlock) → verify HMAC
 *   → verify TTL → cache token in module-level var → all subsequent calls
 *   return the cached result (no re-fetch per request).
 *
 * Error caching:
 *   On AgentBootError, the error is cached in `bootError`. All subsequent calls
 *   re-throw the cached error WITHOUT hitting the unlock endpoint again. This
 *   prevents a retry storm on every request hitting a failed isolate. Only a
 *   new isolate (cold start) will retry.
 *
 * Env vars required:
 *   AGENT_UID          — e.g. "marketing:scout"
 *   AGENT_BEARER       — bearer minted by POST /api/agents/register (shown once)
 *   UNLOCK_SIGNING_KEY — base64url HMAC key shared with one.ie unlock endpoint
 *   ONE_HOST           — optional; defaults to "https://one.ie"
 */

import type { Env } from '../types'
import { AgentBootError, loadAgentToken, type UnlockToken } from './agent-key-load'

// ─── Module-level cache ──────────────────────────────────────────────────────
// One entry per isolate. Cold starts always re-fetch; warm isolates skip fetch.

/** Verified token from the last successful boot. Null until first boot. */
let bootedToken: UnlockToken | null = null

/**
 * V1 placeholder: ciphertextB64 stored as a marker that the boot completed.
 * Replace with `new Uint8Array(decrypted_seed)` once the unwrap service exists.
 *
 * IMPORTANT: This is NOT the raw Ed25519 seed. It is the wrapped ciphertext.
 * Using this value for signing will produce incorrect signatures. The unwrap
 * service (Gap 1 §unwrap endpoint) must ship before this can be used for real
 * Sui transaction signing.
 */
let bootedSeed: string | null = null // ciphertextB64 placeholder, not a real seed

/** Cached boot error — re-thrown on every call once set. Prevents retry storms. */
let bootError: AgentBootError | null = null

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Ensures the agent seed (V1: token ciphertext) has been fetched and verified
 * for this isolate. Call this at the top of any request handler that requires
 * agent identity, BEFORE performing any signing operation.
 *
 * Returns the ciphertextB64 placeholder on success.
 * Throws AgentBootError on any boot failure (cached after first failure).
 *
 * Next step (V2): replace the return type with `Uint8Array` (the raw seed) once
 * `src/pages/api/agents/[uid]/unwrap.ts` ships and this function can call it.
 */
export async function ensureAgentSeed(env: Env): Promise<string> {
  // Fast path: already booted (success)
  if (bootedSeed !== null) return bootedSeed

  // Fast path: already failed (cache the error, prevent retry storm)
  if (bootError !== null) throw bootError

  // Guard: if AGENT_UID or AGENT_BEARER are not provisioned, fail immediately
  // with a clear error rather than trying the unlock endpoint with empty values.
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

  try {
    const token = await loadAgentToken({
      ownerHost: env.ONE_HOST ?? 'https://one.ie',
      uid: env.AGENT_UID,
      bearer: env.AGENT_BEARER,
      unlockSigningKeyB64: env.UNLOCK_SIGNING_KEY,
      // 6 attempts: 1s + 2s + 4s + 8s + 16s + 32s = ~63s total before giving up.
      // Set lower in tests via fetchImpl override on loadAgentToken directly.
      maxAttempts: 6,
    })

    // V1: store the verified ciphertext as the "seed placeholder".
    // The actual unwrap (AES-GCM decrypt → raw seed → Ed25519Keypair) is
    // blocked on the owner-Mac unwrap service. Track: owner-todo §Gap 1 unwrap.
    bootedToken = token
    bootedSeed = token.ciphertextB64

    console.log(`[boot] agent ${env.AGENT_UID} token verified; address=${token.address}`)
    console.log('[boot] V1: ciphertext held; real Ed25519 seed available after unwrap service ships')

    return bootedSeed
  } catch (e) {
    if (e instanceof AgentBootError) {
      bootError = e
      throw bootError
    }
    // Wrap unexpected errors
    bootError = new AgentBootError(String(e), 'unknown')
    throw bootError
  }
}

/**
 * Returns the last successfully verified unlock token, or null if boot has not
 * completed. Useful for diagnostics (e.g. logging token.address).
 *
 * Do NOT use the token's ciphertextB64 for signing — it is the wrapped ciphertext,
 * not the raw seed. See the V1 limitation note at the top of this file.
 */
export function getBootedToken(): UnlockToken | null {
  return bootedToken
}

/**
 * Resets the module-level boot cache. ONLY for use in tests.
 * Calling this in production code is a security violation — it forces a re-fetch
 * that may reveal timing information or produce a retry storm.
 */
export function _resetBootCacheForTests(): void {
  bootedToken = null
  bootedSeed = null
  bootError = null
}
