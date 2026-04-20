/**
 * POST /api/decay-cycle — Run one full decay cycle with before/after stats
 *
 * Asymmetric decay: strength 5%, resistance 10%.
 * From ant biology: success persists, failure forgives.
 *
 * BaaS metering (Cycle 1 T-B1-06): L3 feature — available on all tiers.
 * Authenticated callers are metered.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { checkApiCallLimit, tierLimitResponse } from '@/lib/tier-limits'
import { decay, readParsed } from '@/lib/typedb'

async function getDecayStats() {
  const edges = await readParsed(`
    match $e (source: $from, target: $to) isa path,
      has strength $s, has resistance $r;
    $from has uid $fid; $to has uid $tid;
    select $fid, $tid, $s, $r;
  `).catch(() => [])

  const avgStrength = edges.length ? edges.reduce((sum, e) => sum + ((e.s as number) || 0), 0) / edges.length : 0
  const avgResistance = edges.length ? edges.reduce((sum, e) => sum + ((e.r as number) || 0), 0) / edges.length : 0

  return {
    edges: edges.length,
    avgStrength: Math.round(avgStrength * 100) / 100,
    avgResistance: Math.round(avgResistance * 100) / 100,
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  // BaaS metering gate
  const db = await getD1(locals)
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (auth?.isValid) {
    const tier = auth.tier ?? 'free'
    const usage = await getUsage(db, auth.keyId)
    const gate = checkApiCallLimit(tier, usage)
    if (!gate.ok) return tierLimitResponse(gate)
    void recordCall(db, auth.keyId)
  }

  const body = (await request.json().catch(() => ({}))) as {
    trailRate?: number
    resistanceRate?: number
  }

  const trailRate = body.trailRate ?? 0.05
  const resistanceRate = body.resistanceRate ?? 0.2

  const before = await getDecayStats()
  await decay(trailRate, resistanceRate)
  const after = await getDecayStats()

  return new Response(
    JSON.stringify({
      before,
      after,
      decayed: { trailRate, resistanceRate },
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
