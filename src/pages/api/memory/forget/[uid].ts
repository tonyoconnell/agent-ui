/**
 * DELETE /api/memory/forget/:uid — Structural erasure for an actor
 *
 * Deletes all TypeDB records for uid (signals, paths, memberships,
 * capabilities, unit entity) and invalidates the edge KV cache.
 *
 * Authorization: requires 'delete-memory' permission (operator+).
 * BaaS tier gate: GDPR erasure is a World+ feature (Cycle 1 T-B1-06).
 *
 * GDPR Article 17 — right to erasure.
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { kvInvalidate } from '@/lib/edge'
import { shredGroup } from '@/lib/kek'
import { getUsage, recordCall } from '@/lib/metering'
import { getNet } from '@/lib/net'
import { roleCheck } from '@/lib/role-check'
import { checkApiCallLimit, tierAllows, tierLimitResponse } from '@/lib/tier-limits'
import { writeSilent } from '@/lib/typedb'

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const uid = params.uid
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check authorization: validate API key and verify role has delete-memory permission (operator+)
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = auth.role ?? (await getRoleForUser(auth.user))
  if (!roleCheck(role ?? 'agent', 'delete_memory')) {
    return new Response(JSON.stringify({ error: 'Forbidden: requires delete-memory permission (operator+)' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Tier gate: memoryForget is World+. Scaled from AuthContext.tier, no bearer-suffix hack.
  const tier = auth.tier ?? 'free'
  if (!tierAllows(tier, 'memoryForget')) {
    return new Response(
      JSON.stringify({
        error: `Forbidden: memory forget requires World+ tier (you have: ${tier})`,
        tier,
        required: 'world',
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
  await net.forget(uid)

  // Cascade personal group (belt-and-suspenders; persist.ts forget() also does this)
  const escPGid = `group:${uid}`.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  writeSilent(`match $g isa group, has gid "${escPGid}"; $m (group: $g) isa membership; delete $m isa membership;`)
  writeSilent(`match $g isa group, has gid "${escPGid}"; delete $g isa group;`)

  // Crypto-shred the personal group KEK so encrypted signals become unreadable
  await shredGroup(`group:${uid}`).catch(() => {})

  // E13: invalidate edge cache — paths, units, highways all change after erasure
  kvInvalidate('paths.json')
  kvInvalidate('units.json')
  kvInvalidate('highways.json')

  return new Response(null, { status: 204 })
}
