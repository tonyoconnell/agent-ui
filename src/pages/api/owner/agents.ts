/**
 * GET /api/owner/agents
 * Returns all registered agents from agent_wallet.
 * Owner-only.
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { forbidden, ok, serviceUnavailable, unauthorized } from '@/lib/api-response'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return unauthorized('no session')
  if (auth.role !== 'owner') return forbidden('forbidden', 'role must be owner')

  const db = await getD1(locals)
  if (!db) return serviceUnavailable('d1-unavailable')

  const result = await db
    .prepare(
      `SELECT uid, address, kdf_version, created_at, expires_at
         FROM agent_wallet
        ORDER BY created_at DESC`,
    )
    .all()
    .catch(() => null)

  return ok({ agents: result?.results ?? [] })
}

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: false, error: 'method-not-allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  })
}
