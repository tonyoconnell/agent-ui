/**
 * DELETE /api/memory/forget/:uid — Structural erasure for an actor
 *
 * Deletes all TypeDB records for uid (signals, paths, memberships,
 * capabilities, unit entity) and invalidates the edge KV cache.
 *
 * Authorization: requires 'delete-memory' permission (operator+).
 *
 * GDPR Article 17 — right to erasure.
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, validateApiKey } from '@/lib/api-auth'
import { kvInvalidate } from '@/lib/edge'
import { getNet } from '@/lib/net'
import { roleCheck } from '@/lib/role-check'

export const DELETE: APIRoute = async ({ params, request }) => {
  const uid = params.uid
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check authorization: validate API key and verify role has delete-memory permission (operator+)
  const auth = await validateApiKey(request)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = await getRoleForUser(auth.user)
  if (!roleCheck(role ?? 'agent', 'delete_memory')) {
    return new Response(JSON.stringify({ error: 'Forbidden: requires delete-memory permission (operator+)' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const net = await getNet()
  await net.forget(uid)

  // E13: invalidate edge cache — paths, units, highways all change after erasure
  kvInvalidate('paths.json')
  kvInvalidate('units.json')
  kvInvalidate('highways.json')

  return new Response(null, { status: 204 })
}
