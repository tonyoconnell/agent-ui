/**
 * GET  /api/wallet/wrap/:credId — fetch server-held backup ciphertext (Firefox fallback restore)
 * DELETE /api/wallet/wrap/:credId — remove backup ciphertext (revoke flow)
 *
 * One row per (user_id, cred_id) in D1 `wallet_backups`.
 * The server copy is a fallback; the canonical copy lives in largeBlob.
 * See migrations/0021_wallet_backups.sql for schema.
 * See wallet-plan.md §B.2 for the Firefox fallback decision.
 *
 * Authorization: Better Auth session cookie, Sui session cookie, or Bearer API key.
 * Ownership is enforced by matching session uid to the stored user_id.
 */

import type { APIRoute } from 'astro'
import { getD1 } from '@/lib/cf-env'
import { resolveUnitFromSession } from '@/lib/api-auth'

// ──────────────────────────────────────────────────────────────────────────────
// GET — fetch backup
// ──────────────────────────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ request, params, locals }) => {
  const session = await resolveUnitFromSession(request, locals)
  if (!session.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const credId = params.credId
  if (!credId) {
    return new Response(JSON.stringify({ error: 'credId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = await getD1(locals)
  if (!db) {
    return new Response(JSON.stringify({ error: 'Storage unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const row = await db
    .prepare(
      'SELECT cred_id, iv, ciphertext, version FROM wallet_backups WHERE user_id = ? AND cred_id = ? LIMIT 1',
    )
    .bind(session.user, credId)
    .first<{ cred_id: string; iv: string; ciphertext: string; version: number }>()

  if (!row) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      credId: row.cred_id,
      iv: row.iv,
      ciphertext: row.ciphertext,
      version: row.version,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// DELETE — remove backup (revoke flow)
// ──────────────────────────────────────────────────────────────────────────────

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  const session = await resolveUnitFromSession(request, locals)
  if (!session.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const credId = params.credId
  if (!credId) {
    return new Response(JSON.stringify({ error: 'credId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = await getD1(locals)
  if (!db) {
    return new Response(JSON.stringify({ error: 'Storage unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await db
    .prepare('DELETE FROM wallet_backups WHERE user_id = ? AND cred_id = ?')
    .bind(session.user, credId)
    .run()

  return new Response(null, { status: 204 })
}
