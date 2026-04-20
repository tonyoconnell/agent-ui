/**
 * GET /api/memory/reveal/:uid — Full memory card for an actor
 *
 * Returns all 6-dimension data for the given uid:
 * actor, hypotheses, highways, signals, groups, capabilities, frontier.
 *
 * Authorization: requires 'read-memory' permission (board+).
 * BaaS tier gate: L6 feature — requires Scale+ tier (Cycle 1 T-B1-06).
 *
 * GDPR Article 20 — data portability export.
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

  // Check authorization: validate API key and verify role has read-memory permission
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = auth.role ?? (await getRoleForUser(auth.user))
  if (!roleCheck(role ?? 'agent', 'read_memory')) {
    return new Response(JSON.stringify({ error: 'Forbidden: requires read-memory permission (board+)' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Tier gate: memoryReveal is Scale+. AuthContext.tier is populated from
  // developer_tiers via resolveUnitFromSession — no more bearer-suffix hack.
  const tier = auth.tier ?? 'free'
  if (!tierAllows(tier, 'memoryReveal')) {
    return new Response(
      JSON.stringify({
        error: `Forbidden: memory reveal requires Scale+ tier (you have: ${tier})`,
        tier,
        required: 'scale',
        upgradeUrl: 'https://one.ie/pricing',
      }),
      {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  // Metering
  const db = await getD1(locals)
  const usage = await getUsage(db, auth.keyId)
  const callGate = checkApiCallLimit(tier, usage)
  if (!callGate.ok) return tierLimitResponse(callGate)
  void recordCall(db, auth.keyId)

  const net = await getNet()
  const card = await net.reveal(uid)

  return new Response(JSON.stringify(card), {
    headers: { 'Content-Type': 'application/json' },
  })
}
