/**
 * POST /api/owner/daemon-audit
 *
 * Remote receiver for the owner-daemon's audit log shipping (V4).
 * The daemon posts a signed row here after every /unwrap call so that
 * the audit trail is mirrored off-device in append-only D1 storage.
 *
 * Auth: HMAC-SHA-256 over raw body bytes, key = OWNER_DAEMON_KEY env var
 * (base64url-decoded 32 bytes), header X-Daemon-Sig: <base64url>.
 *
 * Body: { ts, agentUid, kdfVersion, outcome, callerSig }
 * Returns: 202 { ok: true }
 */

import type { APIRoute } from 'astro'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

// ─────────────────────────────────────────────────────────────────────────────
// Crypto helpers (Web Crypto only)

const encoder = new TextEncoder()

function b64urlDecode(s: string): Uint8Array {
  const padded = s + '=='.slice((s.length % 4 || 4) - 2)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function verifyHmac(keyBytes: Uint8Array, sigB64url: string, body: string): Promise<boolean> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const sig = b64urlDecode(sigB64url)
  return crypto.subtle.verify('HMAC', key, sig, encoder.encode(body))
}

// ─────────────────────────────────────────────────────────────────────────────
// Allowed outcome values (must match D1 CHECK constraint)

const VALID_OUTCOMES = new Set(['ok', 'session-locked', 'unwrap-failed', 'rate-limited', 'audit-write-failed'])

// Max clock skew: 1 hour in each direction
const MAX_SKEW_SECONDS = 3600

// ─────────────────────────────────────────────────────────────────────────────
// Response helpers

function resp(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Check OWNER_DAEMON_KEY is configured
  const rawKey = process.env.OWNER_DAEMON_KEY
  if (!rawKey) {
    return resp({ ok: false, code: 'key-not-configured' }, 503)
  }

  let keyBytes: Uint8Array
  try {
    keyBytes = b64urlDecode(rawKey)
  } catch {
    return resp({ ok: false, code: 'key-not-configured' }, 503)
  }

  // 2. Read X-Daemon-Sig header
  const sig = request.headers.get('X-Daemon-Sig')
  if (!sig) {
    return resp({ ok: false, code: 'bad-sig' }, 401)
  }

  // 3. Read raw body (must sign over exact bytes)
  const rawBody = await request.text()

  // 4. Verify HMAC
  let valid: boolean
  try {
    valid = await verifyHmac(keyBytes, sig, rawBody)
  } catch {
    return resp({ ok: false, code: 'bad-sig' }, 401)
  }
  if (!valid) {
    return resp({ ok: false, code: 'bad-sig' }, 401)
  }

  // 5. Parse and validate body
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return resp({ ok: false, code: 'bad-body', reason: 'invalid JSON' }, 400)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return resp({ ok: false, code: 'bad-body', reason: 'expected object' }, 400)
  }

  const body = parsed as Record<string, unknown>

  // Required fields
  if (typeof body.ts !== 'number' || !Number.isInteger(body.ts)) {
    return resp({ ok: false, code: 'bad-body', reason: 'ts must be integer' }, 400)
  }
  if (typeof body.agentUid !== 'string') {
    return resp({ ok: false, code: 'bad-body', reason: 'agentUid must be string' }, 400)
  }
  if (typeof body.kdfVersion !== 'number' || !Number.isInteger(body.kdfVersion)) {
    return resp({ ok: false, code: 'bad-body', reason: 'kdfVersion must be integer' }, 400)
  }
  if (typeof body.outcome !== 'string') {
    return resp({ ok: false, code: 'bad-body', reason: 'outcome must be string' }, 400)
  }
  if (typeof body.callerSig !== 'string') {
    return resp({ ok: false, code: 'bad-body', reason: 'callerSig must be string' }, 400)
  }

  // Validate outcome enum
  if (!VALID_OUTCOMES.has(body.outcome)) {
    return resp({ ok: false, code: 'bad-body', reason: `unknown outcome: ${body.outcome}` }, 400)
  }

  // Validate ts not too far in the future
  const nowSec = Math.floor(Date.now() / 1000)
  if (body.ts > nowSec + MAX_SKEW_SECONDS) {
    return resp({ ok: false, code: 'ts-future-skew' }, 400)
  }

  // 6. Insert into D1
  const db = await getD1(locals)
  if (!db) {
    return resp({ ok: false, code: 'd1-unavailable' }, 503)
  }

  try {
    await db
      .prepare(
        `INSERT INTO owner_daemon_audit (ts, agent_uid, kdf_version, outcome, caller_sig)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(body.ts, body.agentUid, body.kdfVersion, body.outcome, body.callerSig)
      .run()
  } catch {
    return resp({ ok: false, code: 'insert-failed' }, 500)
  }

  // 7. 202 Accepted — daemon doesn't need more detail
  return resp({ ok: true }, 202)
}

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ error: 'method-not-allowed' }), {
    status: 405,
    headers: { Allow: 'POST' },
  })
}
