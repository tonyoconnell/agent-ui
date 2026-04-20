/**
 * GET /api/memory/frontier/:uid — Unexplored tag clusters for an actor
 *
 * Returns the tags the world knows about that this actor has never
 * touched via paths. Answers "what haven't we learned about you?"
 *
 * Authorization: requires 'discover' permission (any role).
 * BaaS tier gate: L7 feature — requires Scale+ tier (Cycle 1 T-B1-06).
 *
 * Used for proactive capability suggestions and coverage metrics.
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { getNet } from '@/lib/net'
import { roleCheck } from '@/lib/role-check'
import { checkApiCallLimit, tierAllows, tierLimitResponse } from '@/lib/tier-limits'

export const GET: APIRoute = async ({ params, request, locals }) => {
  const uid = params.uid
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check authorization: validate API key and verify role has discover permission (all roles)
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = auth.role ?? (await getRoleForUser(auth.user))
  if (!roleCheck(role ?? 'agent', 'discover')) {
    return new Response(JSON.stringify({ error: 'Forbidden: requires discover permission' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Tier gate: frontier is an L7 (Scale+) feature. Same policy as memoryReveal.
  const tier = auth.tier ?? 'free'
  if (!tierAllows(tier, 'memoryReveal')) {
    return new Response(
      JSON.stringify({
        error: `Forbidden: frontier discovery requires Scale+ tier (you have: ${tier})`,
        tier,
        required: 'scale',
        upgradeUrl: 'https://one.ie/pricing',
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Metering
  const db = await getD1(locals)
  const usage = await getUsage(db, auth.keyId)
  const callGate = checkApiCallLimit(tier, usage)
  if (!callGate.ok) return tierLimitResponse(callGate)
  void recordCall(db, auth.keyId)

  const net = await getNet()
  const tags = await net.frontier(uid)

  return new Response(JSON.stringify({ uid, frontier: tags }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
