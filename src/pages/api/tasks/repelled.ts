/**
 * GET /api/tasks/repelled — Tasks with high alarm pheromone
 *
 * L4: alarm-pheromone >= 30 AND alarm > trail (inferred by TypeDB rule)
 */
import type { APIRoute } from 'astro'
import { read, parseAnswers } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const answers = await read(`
    match $t isa task, has repelled true,
      has tid $id, has name $name, has priority $p, has phase $ph;
    select $id, $name, $p, $ph;
  `)
  const rows = parseAnswers(answers)
  return new Response(JSON.stringify({ tasks: rows }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
