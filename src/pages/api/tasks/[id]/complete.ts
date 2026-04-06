/**
 * POST /api/tasks/:id/complete — Mark a signal outcome
 *
 * :id is a unit uid. body.failed = true for failure.
 * Updates the path pheromone (mark on success, warn on failure).
 * Updates the unit's success-rate and sample-count.
 */
import type { APIRoute } from 'astro'
import { write, writeSilent } from '@/lib/typedb'

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing unit id' }), { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as { failed?: boolean; from?: string }
  const failed = body.failed === true
  const from = body.from || 'loop'

  if (failed) {
    // Alarm the path
    await writeSilent(`
      match $from isa unit, has uid "${from}"; $to isa unit, has uid "${id}";
      $e (source: $from, target: $to) isa path, has resistance $r;
      delete $r of $e;
      insert $e has resistance ($r + 8.0);
    `)
  } else {
    // Reinforce the path
    await writeSilent(`
      match $from isa unit, has uid "${from}"; $to isa unit, has uid "${id}";
      $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + 5.0), has traversals ($t + 1);
    `)
  }

  // Update unit success-rate
  await writeSilent(`
    match $u isa unit, has uid "${id}", has success-rate $sr, has sample-count $sc;
    delete $sr of $u; delete $sc of $u;
    insert $u has success-rate (($sr * $sc + ${failed ? 0 : 1}) / ($sc + 1)),
                has sample-count ($sc + 1);
  `)

  // Mark task as done if success (task-id matches skill-id)
  if (!failed) {
    await writeSilent(`
      match $t isa task, has task-id "${id}", has done $d, has task-status $st;
      delete $d of $t; delete $st of $t;
      insert $t has done true, has task-status "done";
    `)
  }

  return new Response(JSON.stringify({ ok: true, unit: id, outcome: failed ? 'failed' : 'success' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
