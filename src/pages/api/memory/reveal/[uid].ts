/**
 * GET /api/memory/reveal/:uid — Full memory card for an actor
 *
 * Returns all 6-dimension data for the given uid:
 * actor, hypotheses, highways, signals, groups, capabilities, frontier.
 *
 * Authorization: requires 'read-memory' permission (board+).
 *
 * GDPR Article 20 — data portability export.
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

  // Check authorization: validate API key and verify role has read-memory permission
  const auth = await validateApiKey(request)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = await getRoleForUser(auth.user)
  if (!roleCheck(role ?? 'agent', 'read_memory')) {
    return new Response(JSON.stringify({ error: 'Forbidden: requires read-memory permission (board+)' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const net = await getNet()
  const card = await net.reveal(uid)

  return new Response(JSON.stringify(card), {
    headers: { 'Content-Type': 'application/json' },
  })
}
