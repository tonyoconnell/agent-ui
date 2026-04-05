/**
 * GET /api/stats — World statistics
 *
 * Returns aggregate stats: units, skills, highways, revenue, signals.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  try {
    const [units, skills, edges, signals] = await Promise.all([
      readParsed(`
        match $u isa unit, has uid $id, has status $status;
        select $id, $status;
      `),
      readParsed(`
        match $sk isa skill, has skill-id $id; select $id;
      `).catch(() => []),
      readParsed(`
        match $e (source: $from, target: $to) isa path,
          has strength $s, has alarm $a, has revenue $r;
        $from has uid $fid; $to has uid $tid;
        select $fid, $tid, $s, $a, $r;
      `),
      readParsed(`
        match $s (sender: $from, receiver: $to) isa signal, has ts $ts;
        select $ts;
      `).catch(() => []),
    ])

    const highways = edges.filter((e) => (e.s as number) >= 50)
    const totalRevenue = edges.reduce((sum, e) => sum + ((e.r as number) || 0), 0)
    const gdp = highways.reduce((sum, e) => sum + ((e.r as number) || 0), 0)

    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
    const recentSignals = signals.filter(s => (s.ts as string) > oneHourAgo).length

    return new Response(JSON.stringify({
      units: {
        total: units.length,
        proven: units.filter((u) => u.status === 'proven').length,
        atRisk: units.filter((u) => u.status === 'at-risk').length,
      },
      skills: { total: skills.length },
      highways: { count: highways.length, totalEdges: edges.length },
      revenue: { total: totalRevenue, gdp },
      signals: { total: signals.length, recent: recentSignals },
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({
      error: 'Failed to fetch stats',
      units: { total: 0, proven: 0, atRisk: 0 },
      skills: { total: 0 },
      highways: { count: 0, totalEdges: 0 },
      revenue: { total: 0, gdp: 0 },
      signals: { total: 0, recent: 0 },
      timestamp: new Date().toISOString(),
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
