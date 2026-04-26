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
import { err, ok, serviceUnavailable } from '@/lib/api-response'
import { getD1 } from '@/lib/cf-env'
import { b64urlDecode, hmacVerify } from '@/lib/owner-crypto'

export const prerender = false

// ─────────────────────────────────────────────────────────────────────────────
// Allowed outcome values (must match D1 CHECK constraint)

const VALID_OUTCOMES = new Set(['ok', 'session-locked', 'unwrap-failed', 'rate-limited', 'audit-write-failed'])

// Max clock skew: 1 hour in each direction
const MAX_SKEW_SECONDS = 3600

// ─────────────────────────────────────────────────────────────────────────────
// POST handler

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Check OWNER_DAEMON_KEY is configured
  const rawKey = process.env.OWNER_DAEMON_KEY
  if (!rawKey) {
    return serviceUnavailable('key-not-configured')
  }

  let keyBytes: Uint8Array
  try {
    keyBytes = b64urlDecode(rawKey)
  } catch {
    return serviceUnavailable('key-not-configured')
  }

  // 2. Read X-Daemon-Sig header
  const sig = request.headers.get('X-Daemon-Sig')
  if (!sig) {
    return err(401, 'bad-sig')
  }

  // 3. Read raw body (must sign over exact bytes)
  const rawBody = await request.text()

  // 4. Verify HMAC
  let valid: boolean
  try {
    valid = await hmacVerify(rawBody, sig, keyBytes)
  } catch {
    return err(401, 'bad-sig')
  }
  if (!valid) {
    return err(401, 'bad-sig')
  }

  // 5. Parse and validate body
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return err(400, 'bad-body', 'invalid JSON')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return err(400, 'bad-body', 'expected object')
  }

  const body = parsed as Record<string, unknown>

  // Required fields
  if (typeof body.ts !== 'number' || !Number.isInteger(body.ts)) {
    return err(400, 'bad-body', 'ts must be integer')
  }
  if (typeof body.agentUid !== 'string') {
    return err(400, 'bad-body', 'agentUid must be string')
  }
  if (typeof body.kdfVersion !== 'number' || !Number.isInteger(body.kdfVersion)) {
    return err(400, 'bad-body', 'kdfVersion must be integer')
  }
  if (typeof body.outcome !== 'string') {
    return err(400, 'bad-body', 'outcome must be string')
  }
  if (typeof body.callerSig !== 'string') {
    return err(400, 'bad-body', 'callerSig must be string')
  }

  // Validate outcome enum
  if (!VALID_OUTCOMES.has(body.outcome)) {
    return err(400, 'bad-body', `unknown outcome: ${body.outcome}`)
  }

  // Validate ts not too far in the future
  const nowSec = Math.floor(Date.now() / 1000)
  if (body.ts > nowSec + MAX_SKEW_SECONDS) {
    return err(400, 'ts-future-skew')
  }

  // 6. Insert into D1
  const db = await getD1(locals)
  if (!db) {
    return serviceUnavailable('d1-unavailable')
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
    return err(500, 'insert-failed')
  }

  // 7. 202 Accepted — daemon doesn't need more detail
  return ok({}, { status: 202 })
}

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: false, error: 'method-not-allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  })
}
