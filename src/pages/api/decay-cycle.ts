/**
 * POST /api/decay-cycle — Run one full decay cycle with before/after stats
 *
 * Asymmetric decay: strength 5%, resistance 10%.
 * From ant biology: success persists, failure forgives.
 */
import type { APIRoute } from 'astro'
import { decay, readParsed } from '@/lib/typedb'

async function getDecayStats() {
  const edges = await readParsed(`
    match $e (source: $from, target: $to) isa path,
      has strength $s, has resistance $r;
    $from has uid $fid; $to has uid $tid;
    select $fid, $tid, $s, $r;
  `).catch(() => [])

  const avgStrength = edges.length
    ? edges.reduce((sum, e) => sum + ((e.s as number) || 0), 0) / edges.length : 0
  const avgResistance = edges.length
    ? edges.reduce((sum, e) => sum + ((e.r as number) || 0), 0) / edges.length : 0

  return {
    edges: edges.length,
    avgStrength: Math.round(avgStrength * 100) / 100,
    avgResistance: Math.round(avgResistance * 100) / 100,
  }
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({})) as {
    trailRate?: number
    resistanceRate?: number
  }

  const trailRate = body.trailRate ?? 0.05
  const resistanceRate = body.resistanceRate ?? 0.20

  const before = await getDecayStats()
  await decay(trailRate, resistanceRate)
  const after = await getDecayStats()

  return new Response(JSON.stringify({
    before, after,
    decayed: { trailRate, resistanceRate },
    timestamp: new Date().toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } })
}
