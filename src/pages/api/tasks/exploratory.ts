/**
 * GET /api/tasks/exploratory — Tasks with NO pheromone trail
 *
 * These need scouts — agents with exploration bias.
 * No trail exists. Someone needs to try this first.
 */
import type { APIRoute } from 'astro'
import { read, parseAnswers } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const answers = await read(`
    match $t isa task, has status "todo",
      has tid $id, has name $name, has priority $p, has phase $ph;
    not { $dep(dependent: $t, blocker: $b) isa dependency;
          $b isa task, has status $bs; not { $bs == "complete"; }; };
    not { $tr (destination-task: $t) isa trail; };
    select $id, $name, $p, $ph;
  `)
  const rows = parseAnswers(answers)
  return new Response(JSON.stringify({ tasks: rows }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
