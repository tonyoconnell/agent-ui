/**
 * POST /api/agents/:id/commend — CEO commend: boost success-rate + mark all paths
 *
 * Raises the agent's success-rate (capped at 0.95) and strengthens
 * all outgoing pheromone trails from this unit.
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ params }) => {
  const id = params.id
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

  // Boost success-rate (capped at 0.95)
  await write(`
    match $u isa unit, has uid "${id}", has success-rate $sr;
    let $new = min($sr + 0.1, 0.95);
    delete $sr of $u;
    insert $u has success-rate $new;
  `).catch(() => {
    // Unit may not have success-rate yet — set it
    return write(`
      match $u isa unit, has uid "${id}";
      insert $u has success-rate 0.6;
    `)
  })

  // Strengthen all outgoing paths from this unit
  await write(`
    match
      $u isa unit, has uid "${id}";
      $e (source: $u, target: $t) isa path, has strength $s;
    delete $s of $e;
    insert $e has strength ($s + 1.0);
  `).catch(() => {})

  return new Response(JSON.stringify({ ok: true, id, action: 'commend' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
