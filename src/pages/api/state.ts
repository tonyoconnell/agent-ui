/**
 * GET /api/state — Full world state for UI rendering
 *
 * Returns: { units, edges, tasks, trails, highways, stats }
 * Everything the graph needs to render.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const [units, edges, tasks, trails] = await Promise.all([
    readParsed(`
      match $u isa unit,
        has uid $id, has name $name, has unit-kind $kind, has status $status;
      select $id, $name, $kind, $status;
    `),
    readParsed(`
      match $e (source: $from, target: $to) isa path,
        has strength $s, has alarm $a, has traversals $t, has revenue $r;
      $from has uid $fid; $to has uid $tid;
      select $fid, $tid, $s, $a, $t, $r;
    `),
    readParsed(`
      match $t isa task,
        has tid $id, has name $name, has status $status, has priority $p, has phase $phase;
      select $id, $name, $status, $p, $phase;
    `),
    readParsed(`
      match $tr (source-task: $from, destination-task: $to) isa trail,
        has trail-pheromone $tp, has alarm-pheromone $ap, has trail-status $ts;
      $from has tid $fid; $to has tid $tid;
      select $fid, $tid, $tp, $ap, $ts;
    `).catch(() => []),
  ])

  const highways = edges.filter((e: Record<string, unknown>) => (e.s as number) >= 50)
  const proven = units.filter((u: Record<string, unknown>) => u.status === 'proven')

  const stats = {
    units: units.length,
    proven: proven.length,
    tasks: tasks.length,
    ready: tasks.filter((t: Record<string, unknown>) => t.status === 'todo').length,
    highways: highways.length,
    totalRevenue: edges.reduce((sum: number, e: Record<string, unknown>) => sum + ((e.r as number) || 0), 0),
  }

  return new Response(JSON.stringify({ units, edges, tasks, trails, highways, stats }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
