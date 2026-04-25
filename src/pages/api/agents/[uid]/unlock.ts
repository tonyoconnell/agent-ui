/**
 * POST /api/agents/[uid]/unlock — agent-bearer-authenticated wallet unlock.
 *
 * Owner-todo Gap 1, task 1.s6.
 *
 * The agent worker POSTs here with its own bearer in Authorization.
 * The endpoint:
 *   1. Validates the bearer and confirms it belongs to the uid in the URL path.
 *   2. Looks up the wrapped ciphertext from D1 `agent_wallet`.
 *   3. Mints a short-lived (60s) HMAC-SHA-256 signed unlock token containing
 *      the ciphertext fields.
 *   4. Returns the token to the agent worker.
 *
 * The worker takes the token, verifies the sig, and has what it needs to call
 * the eventual unwrap path (owner-Mac involvement — out of scope here; see
 * docs/agent-boot-unlock.md for the follow-on unwrap design).
 *
 * Response shape:
 *   { ciphertextB64, ivB64, kdfVersion, expiresAt, address, sig }
 *
 * Errors:
 *   401  invalid-bearer
 *   403  bearer-uid-mismatch
 *   404  no-agent-wallet
 *   500  d1-failed | hmac-failed | unlock-signing-key-missing
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

// ─── HMAC signing helpers ─────────────────────────────────────────────────────

function readUnlockSigningKey(): Uint8Array | null {
  const raw =
    (typeof process !== 'undefined' && process.env?.UNLOCK_SIGNING_KEY) ||
    (import.meta.env as Record<string, unknown>).UNLOCK_SIGNING_KEY
  if (typeof raw !== 'string' || !raw) return null
  // base64url-decode
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacSign(input: string): Promise<string> {
  const keyBytes = readUnlockSigningKey()
  if (!keyBytes) throw new Error('UNLOCK_SIGNING_KEY not configured')
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ─── Base64url encode raw bytes (ArrayBuffer or Uint8Array) ──────────────────

function bytesToBase64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ─── D1 row type ──────────────────────────────────────────────────────────────

interface AgentWalletRow {
  ciphertext: ArrayBuffer | Uint8Array
  iv: ArrayBuffer | Uint8Array
  kdf_version: number
  address: string
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, params }) => {
  // 1. Resolve bearer → uid
  const auth = await resolveUnitFromSession(request)
  if (!auth.isValid) {
    return Response.json({ ok: false, error: 'invalid-bearer' }, { status: 401 })
  }

  // 2. Compare resolved uid to path uid
  const pathUid = params?.uid
  if (!pathUid) {
    return Response.json({ ok: false, error: 'missing-uid' }, { status: 400 })
  }

  const callerUid = auth.actAs ?? auth.user
  if (callerUid !== pathUid) {
    return Response.json({ ok: false, error: 'bearer-uid-mismatch' }, { status: 403 })
  }

  // 3. Look up agent_wallet row
  let db: D1Database | null = null
  try {
    db = await getD1(undefined)
  } catch {
    return Response.json({ ok: false, error: 'd1-failed' }, { status: 500 })
  }

  if (!db) {
    return Response.json({ ok: false, error: 'd1-failed' }, { status: 500 })
  }

  let row: AgentWalletRow | null = null
  try {
    row = await db
      .prepare('SELECT ciphertext, iv, kdf_version, address FROM agent_wallet WHERE uid = ?')
      .bind(pathUid)
      .first<AgentWalletRow>()
  } catch {
    return Response.json({ ok: false, error: 'd1-failed' }, { status: 500 })
  }

  if (!row) {
    return Response.json({ ok: false, error: 'no-agent-wallet' }, { status: 404 })
  }

  // 4. Mint short-lived unlock token
  const ciphertextB64 = bytesToBase64url(row.ciphertext)
  const ivB64 = bytesToBase64url(row.iv)
  const kdfVersion = row.kdf_version
  const address = row.address
  const expiresAt = Math.floor(Date.now() / 1000) + 60

  // Canonical string for HMAC: fields joined by | in deterministic order
  const canonical = `${ciphertextB64}|${ivB64}|${kdfVersion}|${expiresAt}|${address}|${pathUid}`

  let sig: string
  try {
    sig = await hmacSign(canonical)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('UNLOCK_SIGNING_KEY not configured')) {
      return Response.json({ ok: false, error: 'unlock-signing-key-missing' }, { status: 500 })
    }
    return Response.json({ ok: false, error: 'hmac-failed' }, { status: 500 })
  }

  return Response.json({
    ciphertextB64,
    ivB64,
    kdfVersion,
    expiresAt,
    address,
    sig,
  })
}
