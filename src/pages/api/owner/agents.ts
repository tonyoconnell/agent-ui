/**
 * GET /api/owner/agents
 * Returns all registered agents from agent_wallet.
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

export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return unauthorized('no session')
  if (auth.role !== 'owner') return forbidden('role must be owner')

  const db = await getD1(locals)
  if (!db) {
    return new Response(JSON.stringify({ error: 'd1-unavailable' }), { status: 503 })
  }

  const result = await db
    .prepare(
      `SELECT uid, address, kdf_version, created_at, expires_at
         FROM agent_wallet
        ORDER BY created_at DESC`,
    )
    .all()
    .catch(() => null)

  return Response.json({ agents: result?.results ?? [] })
}

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ error: 'method-not-allowed' }), {
    status: 405,
    headers: { Allow: 'GET' },
  })
}
