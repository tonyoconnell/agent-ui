/**
 * POST /api/decay-cycle — Run one full decay cycle with before/after stats
 *
 * Asymmetric decay: strength 5%, alarm 10%.
 * From ant biology: success persists, failure forgives.
 */
import type { APIRoute } from 'astro'
import { decay, readParsed } from '@/lib/typedb'

async function getDecayStats() {
  const edges = await readParsed(`
    match $e (source: $from, target: $to) isa path,
      has strength $s, has alarm $a;
    $from has uid $fid; $to has uid $tid;
    select $fid, $tid, $s, $a;
  `).catch(() => [])

  const avgStrength = edges.length
    ? edges.reduce((sum, e) => sum + ((e.s as number) || 0), 0) / edges.length : 0
  const avgAlarm = edges.length
    ? edges.reduce((sum, e) => sum + ((e.a as number) || 0), 0) / edges.length : 0

  return {
    edges: edges.length,
    avgStrength: Math.round(avgStrength * 100) / 100,
    avgAlarm: Math.round(avgAlarm * 100) / 100,
  }
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({})) as {
    trailRate?: number
    alarmRate?: number
  }

  const trailRate = body.trailRate ?? 0.05
  const alarmRate = body.alarmRate ?? 0.20

  const before = await getDecayStats()
  await decay(trailRate, alarmRate)
  const after = await getDecayStats()

  return new Response(JSON.stringify({
    before, after,
    decayed: { trailRate, alarmRate },
    timestamp: new Date().toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } })
}
