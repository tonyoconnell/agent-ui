/**
 * GET /api/stats — World statistics
 *
 * Returns aggregate stats: units, tasks, highways, revenue.
 * Uses TypeDB queries against the one.tql schema.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  try {
    const [units, tasks, edges, signals] = await Promise.all([
      readParsed(`
        match $u isa unit, has uid $id, has status $status;
        select $id, $status;
      `),
      readParsed(`
        match $t isa task, has tid $id, has status $status, has priority $p;
        select $id, $status, $p;
      `),
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

    const totalUnits = units.length
    const provenUnits = units.filter((u) => u.status === 'proven').length
    const atRiskUnits = units.filter((u) => u.status === 'at_risk' || u.status === 'failing').length

    const totalTasks = tasks.length
    const readyTasks = tasks.filter((t) => t.status === 'todo').length
    const activeTasks = tasks.filter((t) => t.status === 'in_progress').length
    const completeTasks = tasks.filter((t) => t.status === 'complete').length

    const highways = edges.filter((e) => (e.s as number) >= 50)
    const totalRevenue = edges.reduce((sum, e) => sum + ((e.r as number) || 0), 0)

    // GDP: revenue from proven highways (strength >= 50)
    const gdp = highways.reduce((sum, e) => sum + ((e.r as number) || 0), 0)

    const totalSignals = signals.length
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
    const recentSignals = signals.filter(s => (s.ts as string) > oneHourAgo).length

    const stats = {
      units: {
        total: totalUnits,
        proven: provenUnits,
        atRisk: atRiskUnits,
      },
      tasks: {
        total: totalTasks,
        ready: readyTasks,
        active: activeTasks,
        complete: completeTasks,
      },
      highways: {
        count: highways.length,
        totalEdges: edges.length,
      },
      revenue: {
        total: totalRevenue,
        gdp,
      },
      signals: {
        total: totalSignals,
        recent: recentSignals,
      },
      timestamp: new Date().toISOString(),
    }

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch stats',
      units: { total: 0, proven: 0, atRisk: 0 },
      tasks: { total: 0, ready: 0, active: 0, complete: 0 },
      highways: { count: 0, totalEdges: 0 },
      revenue: { total: 0, gdp: 0 },
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
