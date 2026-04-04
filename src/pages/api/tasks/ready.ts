/**
 * GET /api/tasks/ready — Tasks with no incomplete blockers
 *
 * Uses TypeDB negation pattern (L4):
 * ready = todo AND NOT (has incomplete blocker)
 */
import type { APIRoute } from 'astro'
import { read, parseAnswers } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const phase = url.searchParams.get('phase')

  let tql = `
    match $t isa task, has status "todo",
      has tid $id, has name $name, has priority $p, has phase $ph, has task-type $tt;
    not { $dep(dependent: $t, blocker: $b) isa dependency;
          $b isa task, has status $bs; not { $bs == "complete"; }; };`

  if (phase) tql += `\n    $ph == "${phase}";`
  tql += '\n    select $id, $name, $p, $ph, $tt;'

  const answers = await read(tql)
  const rows = parseAnswers(answers)
  return new Response(JSON.stringify({ tasks: rows }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
