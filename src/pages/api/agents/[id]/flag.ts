/**
 * POST /api/agents/:id/flag — CEO flag: lower success-rate + warn all paths
 *
 * Lowers the agent's success-rate (floor 0.05) and increases resistance
 * on all outgoing pheromone trails (routing will avoid this unit).
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ params }) => {
  const id = params.id
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

  // Lower success-rate (floor at 0.05)
  await write(`
    match $u isa unit, has uid "${id}", has success-rate $sr;
    let $new = max($sr - 0.15, 0.05);
    delete $sr of $u;
    insert $u has success-rate $new;
  `).catch(() => {
    return write(`
      match $u isa unit, has uid "${id}";
      insert $u has success-rate 0.2;
    `)
  })

  // Increase resistance on all outgoing paths (routing avoids this unit)
  await write(`
    match
      $u isa unit, has uid "${id}";
      $e (source: $u, target: $t) isa path, has resistance $r;
    delete $r of $e;
    insert $e has resistance ($r + 2.0);
  `).catch(() => {})

  return new Response(JSON.stringify({ ok: true, id, action: 'flag' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
