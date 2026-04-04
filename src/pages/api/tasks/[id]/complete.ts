/**
 * POST /api/tasks/:id/complete — Mark task complete + reinforce trail
 *
 * On complete:
 *   - Status → "complete"
 *   - trail-pheromone += 5.0 on incoming trails
 *   - completions += 1 on incoming trails
 *
 * On fail (body.failed = true):
 *   - Status → "failed"
 *   - alarm-pheromone += 8.0 on incoming trails
 *   - failures += 1 on incoming trails
 */
import type { APIRoute } from 'astro'
import { write, writeSilent } from '@/lib/typedb'

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing task id' }), { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as { failed?: boolean }
  const failed = body.failed === true

  // Update task status
  const newStatus = failed ? 'failed' : 'complete'
  await write(`
    match $t isa task, has tid "${id}", has status $s;
    delete $s of $t;
    insert $t has status "${newStatus}";
  `)

  if (failed) {
    // Alarm: increase alarm-pheromone on incoming trails
    await writeSilent(`
      match
        $t isa task, has tid "${id}";
        $tr (destination-task: $t) isa trail,
          has alarm-pheromone $ap, has failures $f;
      delete $ap of $tr; delete $f of $tr;
      insert $tr has alarm-pheromone ($ap + 8.0), has failures ($f + 1);
    `)
  } else {
    // Reinforce: increase trail-pheromone on incoming trails
    await writeSilent(`
      match
        $t isa task, has tid "${id}";
        $tr (destination-task: $t) isa trail,
          has trail-pheromone $tp, has completions $c;
      delete $tp of $tr; delete $c of $tr;
      insert $tr has trail-pheromone ($tp + 5.0), has completions ($c + 1);
    `)
  }

  return new Response(JSON.stringify({ ok: true, tid: id, status: newStatus }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
