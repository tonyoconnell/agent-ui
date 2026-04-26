/**
 * GET /api/owner/audit?limit=50
 * Returns recent rows from owner_audit.
 * Owner-only.
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

function unauthorized(reason: string) {
  return new Response(JSON.stringify({ error: 'unauthenticated', reason }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

function forbidden(reason: string) {
  return new Response(JSON.stringify({ error: 'forbidden', reason }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })
}

function badRequest(reason: string) {
  return new Response(JSON.stringify({ error: 'bad-input', reason }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return unauthorized('no session')
  if (auth.role !== 'owner') return forbidden('role must be owner')

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
  if (!db) {
    return new Response(JSON.stringify({ error: 'd1-unavailable' }), { status: 503 })
  }

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

  return Response.json({ rows: result?.results ?? [] })
}

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ error: 'method-not-allowed' }), {
    status: 405,
    headers: { Allow: 'GET' },
  })
}
