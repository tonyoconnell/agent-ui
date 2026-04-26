/**
 * GET /api/owner/audit?limit=50
 * Returns recent rows from owner_audit.
 * Owner-only.
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { badRequest, forbidden, ok, serviceUnavailable, unauthorized } from '@/lib/api-response'
import { getD1 } from '@/lib/cf-env'

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return unauthorized('no session')
  if (auth.role !== 'owner') return forbidden('forbidden', 'role must be owner')

  const url = new URL(request.url)
  const rawLimit = url.searchParams.get('limit')
  let limit = DEFAULT_LIMIT

  if (rawLimit !== null) {
    const parsed = parseInt(rawLimit, 10)
    if (Number.isNaN(parsed) || parsed < 1) {
      return badRequest('limit must be a positive integer')
    }
    limit = Math.min(parsed, MAX_LIMIT)
  }

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  const result = await db
    .prepare(
      `SELECT ts, action, sender, receiver, gate, decision
         FROM owner_audit
        ORDER BY ts DESC
        LIMIT ?`,
    )
    .bind(limit)
    .all()
    .catch(() => null)

  return ok({ rows: result?.results ?? [] })
}

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: false, error: 'method-not-allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  })
}
