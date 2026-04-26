/**
 * /api/auth/owner-key-versions — Owner-tier key rotation endpoint (Gap 4 §4.s2).
 *
 * Distinct from /api/auth/api-keys (which mints random api_xxx keys for
 * chairman/agent/general use). This endpoint manages the owner-PRF-derived
 * keys whose hash lives in D1 `owner_key` (schema 0028 + 0032).
 *
 * Caller flow:
 *   1. Browser computes deriveKey(prf, role, group, version) — owner-Mac
 *      only path; PRF never leaves the browser.
 *   2. Browser computes hashKey(rawKey) → stable bcrypt hash.
 *   3. Browser POSTs { keyHash, role, group, version, expiresAt? } here.
 *   4. Endpoint inserts D1 owner_key row.
 *
 * Three verbs:
 *   POST   register a new version
 *   GET    list active versions
 *   DELETE force-revoke (set expires_at = unixepoch())
 *
 * Auth: requires role==='owner' (gates via existing api-auth + role-check).
 * Spec: docs/key-rotation.md.
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { badRequest, err, forbidden, ok, serviceUnavailable, unauthorized } from '@/lib/api-response'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

interface RegisterBody {
  keyHash?: string
  address?: string
  role?: string
  group?: string
  version?: number
  expiresAt?: number | null
}

interface RevokeBody {
  keyHash?: string
}

async function requireOwner(request: Request, locals?: App.Locals) {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return { error: unauthorized('no session') }
  if (auth.role !== 'owner') return { error: forbidden('forbidden', 'role must be owner') }
  return { auth }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const gate = await requireOwner(request, locals)
  if ('error' in gate) return gate.error

  const body = (await request.json().catch(() => ({}))) as RegisterBody
  if (!body.keyHash || typeof body.keyHash !== 'string') return badRequest('keyHash required')
  if (!body.role || typeof body.role !== 'string') return badRequest('role required')
  if (!body.group || typeof body.group !== 'string') return badRequest('group required')
  if (!Number.isInteger(body.version) || (body.version as number) < 1) {
    return badRequest('version must be a positive integer')
  }
  if (
    body.expiresAt != null &&
    (typeof body.expiresAt !== 'number' || !Number.isFinite(body.expiresAt) || body.expiresAt < Date.now() / 1000)
  ) {
    return badRequest('expiresAt must be a unix-second in the future, or null')
  }

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  // Insert. ON CONFLICT (key_hash) → 409.
  try {
    await db
      .prepare(
        `INSERT INTO owner_key (key_hash, address, version, role, group_id, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(body.keyHash, body.address ?? '', body.version, body.role, body.group, body.expiresAt ?? null)
      .run()
  } catch (e) {
    const msg = (e as Error).message
    if (/UNIQUE|conflict/i.test(msg)) {
      return err(409, 'already-registered', 'keyHash exists')
    }
    return err(500, 'd1-failed', msg)
  }

  return ok({
    keyHash: body.keyHash,
    role: body.role,
    group: body.group,
    version: body.version,
    expiresAt: body.expiresAt ?? null,
  })
}

export const GET: APIRoute = async ({ request, locals }) => {
  const gate = await requireOwner(request, locals)
  if ('error' in gate) return gate.error

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  const now = Math.floor(Date.now() / 1000)
  const result = await db
    .prepare(
      `SELECT key_hash, address, version, role, group_id AS "group", issued_at, expires_at
         FROM owner_key
        WHERE expires_at IS NULL OR expires_at > ?
        ORDER BY issued_at DESC`,
    )
    .bind(now)
    .all()
    .catch(() => null)

  return ok({ versions: result?.results ?? [] })
}

export const DELETE: APIRoute = async ({ request, locals }) => {
  const gate = await requireOwner(request, locals)
  if ('error' in gate) return gate.error

  const body = (await request.json().catch(() => ({}))) as RevokeBody
  if (!body.keyHash || typeof body.keyHash !== 'string') return badRequest('keyHash required')

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  const now = Math.floor(Date.now() / 1000)
  const result = await db
    .prepare(`UPDATE owner_key SET expires_at = ? WHERE key_hash = ? AND (expires_at IS NULL OR expires_at > ?)`)
    .bind(now, body.keyHash, now)
    .run()
    .catch((e) => ({ success: false, error: (e as Error).message }))

  if (!('success' in result) || !result.success) {
    return err(500, 'd1-failed')
  }

  return ok({ keyHash: body.keyHash, expiresAt: now })
}
