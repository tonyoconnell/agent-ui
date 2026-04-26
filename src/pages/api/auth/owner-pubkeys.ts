/**
 * /api/auth/owner-pubkeys — Federation V4 owner public-key management.
 *
 * Manages COSE public keys in D1 `owner_pubkeys` (schema 0034).
 * Keys are published via /.well-known/owner-pubkey.json so federation peers
 * can verify bridge handshake assertions cryptographically.
 *
 * Replaces the env-var OWNER_PUBKEYS_JSON operator workflow — D1-backed means
 * keys can be rotated without a redeploy.
 *
 * Three verbs (owner-only):
 *   POST   register a new credential key
 *   GET    list active (non-revoked) keys
 *   DELETE soft-revoke by credId (sets revoked_at = unixepoch(), no row deletion)
 *
 * Auth: requires role==='owner' via resolveUnitFromSession + role-check.
 *
 * Judgment call — revoke semantics: append-only soft delete (revoked_at stamp)
 * rather than hard DELETE. This preserves the full audit trail; a key revoked
 * at time T can still be inspected for forensic purposes. The well-known
 * endpoint filters WHERE revoked_at IS NULL so peers never see revoked keys.
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { badRequest, err, forbidden, notFound, ok, serviceUnavailable, unauthorized } from '@/lib/api-response'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

// ─── Validation constants ─────────────────────────────────────────────────────

/** Minimum base64url-encoded length for a credential ID (~16-byte raw minimum). */
const CRED_ID_MIN_LEN = 22
/** Minimum base64url-encoded length for a COSE key (32-byte raw minimum). */
const PUB_KEY_MIN_B64_LEN = 43
const VALID_ALGS = new Set(['ES256', 'EdDSA', 'RS256'])

// ─── Request body shapes ──────────────────────────────────────────────────────

interface RegisterBody {
  credId?: string
  pubKey?: string
  alg?: string
}

interface RevokeBody {
  credId?: string
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

async function requireOwner(request: Request, locals?: App.Locals) {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return { error: unauthorized('no session') }
  if (auth.role !== 'owner') return { error: forbidden('forbidden', 'role must be owner') }
  return { auth }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const gate = await requireOwner(request, locals)
  if ('error' in gate) return gate.error

  const body = (await request.json().catch(() => ({}))) as RegisterBody

  if (!body.credId || typeof body.credId !== 'string' || body.credId.length < CRED_ID_MIN_LEN) {
    return badRequest(`credId must be a base64url string of at least ${CRED_ID_MIN_LEN} characters`)
  }

  if (!body.pubKey || typeof body.pubKey !== 'string') {
    return badRequest('pubKey required')
  }

  // Validate pubKey minimum byte length after base64url decode approximation.
  // Each base64url char encodes 6 bits; floor(len * 6 / 8) = approximate byte count.
  const approxBytes = Math.floor((body.pubKey.length * 6) / 8)
  if (approxBytes < 32) {
    return badRequest('pubKey too short — must be at least 32 bytes (base64url-encoded)')
  }

  // Validate pubKey encodes at least min length base64url
  if (body.pubKey.length < PUB_KEY_MIN_B64_LEN) {
    return badRequest('pubKey too short — must be a valid base64url-encoded COSE key')
  }

  const alg = body.alg ?? 'ES256'
  if (!VALID_ALGS.has(alg)) {
    return badRequest(`alg must be one of: ${[...VALID_ALGS].join(', ')}`)
  }

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  try {
    await db
      .prepare(
        `INSERT INTO owner_pubkeys (cred_id, pub_key, alg)
         VALUES (?, ?, ?)`,
      )
      .bind(body.credId, body.pubKey, alg)
      .run()
  } catch (e) {
    const msg = (e as Error).message
    if (/UNIQUE|conflict/i.test(msg)) {
      return err(409, 'already-registered', 'credId already exists')
    }
    return err(500, 'd1-failed', msg)
  }

  // Fetch the just-inserted row to return registeredAt from D1 (canonical timestamp).
  const row = await db
    .prepare(`SELECT registered_at AS registeredAt FROM owner_pubkeys WHERE cred_id = ?`)
    .bind(body.credId)
    .first<{ registeredAt: number }>()
    .catch(() => null)

  return ok({
    credId: body.credId,
    registeredAt: row?.registeredAt ?? Math.floor(Date.now() / 1000),
  })
}

export const GET: APIRoute = async ({ request, locals }) => {
  const gate = await requireOwner(request, locals)
  if ('error' in gate) return gate.error

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  const result = await db
    .prepare(
      `SELECT cred_id AS credId, pub_key AS pubKey, alg, registered_at AS registeredAt
         FROM owner_pubkeys
        WHERE revoked_at IS NULL
        ORDER BY registered_at`,
    )
    .all()
    .catch(() => null)

  return new Response(JSON.stringify({ ok: true, keys: result?.results ?? [] }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private',
    },
  })
}

export const DELETE: APIRoute = async ({ request, locals }) => {
  const gate = await requireOwner(request, locals)
  if ('error' in gate) return gate.error

  const body = (await request.json().catch(() => ({}))) as RevokeBody
  if (!body.credId || typeof body.credId !== 'string') return badRequest('credId required')

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  const now = Math.floor(Date.now() / 1000)

  // Check existence first (soft-delete means we can't use affected-rows as a 404 signal
  // reliably across all D1 driver versions — explicit lookup is clearer).
  const existing = await db
    .prepare(`SELECT cred_id FROM owner_pubkeys WHERE cred_id = ?`)
    .bind(body.credId)
    .first<{ cred_id: string }>()
    .catch(() => null)

  if (!existing) {
    return notFound('credId not found')
  }

  const result = await db
    .prepare(
      `UPDATE owner_pubkeys SET revoked_at = ?
        WHERE cred_id = ? AND revoked_at IS NULL`,
    )
    .bind(now, body.credId)
    .run()
    .catch((e) => ({ success: false, error: (e as Error).message }))

  if (!('success' in result) || !result.success) {
    return err(500, 'd1-failed')
  }

  return ok({ credId: body.credId, revokedAt: now })
}
