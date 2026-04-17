/**
 * GET /api/memory/frontier/:uid — Unexplored tag clusters for an actor
 *
 * Returns the tags the world knows about that this actor has never
 * touched via paths. Answers "what haven't we learned about you?"
 *
 * Authorization: requires 'discover' permission (any role).
 *
 * Used for proactive capability suggestions and coverage metrics.
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, validateApiKey } from '@/lib/api-auth'
import { getNet } from '@/lib/net'
import { roleCheck } from '@/lib/role-check'

export const GET: APIRoute = async ({ params, request }) => {
  const uid = params.uid
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check authorization: validate API key and verify role has discover permission (all roles)
  const auth = await validateApiKey(request)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = await getRoleForUser(auth.user)
  if (!roleCheck(role ?? 'agent', 'discover')) {
    return new Response(JSON.stringify({ error: 'Forbidden: requires discover permission' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const net = await getNet()
  const tags = await net.frontier(uid)

  return new Response(JSON.stringify({ uid, frontier: tags }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
