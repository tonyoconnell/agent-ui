/**
 * GET /api/tasks/attractive — Tasks with strong inbound trail pheromone
 *
 * L4: ready + trail-pheromone >= 50 (inferred by TypeDB rule)
 */
import type { APIRoute } from 'astro'
import { read, parseAnswers } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const answers = await read(`
    match $t isa task, has attractive true,
      has tid $id, has name $name, has priority $p, has phase $ph;
    select $id, $name, $p, $ph;
  `)
  const rows = parseAnswers(answers)
  return new Response(JSON.stringify({ tasks: rows }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
