/**
 * POST /api/tasks/:id/complete — Mark a signal outcome
 *
 * :id is a task tid (e.g. "T-2"). body.failed = true for failure.
 * Updates pheromone in local store (fast), TypeDB (silent), and triggers KV sync.
 */
import type { APIRoute } from 'astro'
import { writeSilent } from '@/lib/typedb'
import * as store from '@/lib/tasks-store'

function triggerKvSync() {
  const syncUrl = import.meta.env.SYNC_WORKER_URL || 'https://one-sync.oneie.workers.dev'
  fetch(`${syncUrl}/sync`, { method: 'POST' }).catch(() => {})
}

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing task id' }), { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as { failed?: boolean; from?: string }
  const failed = body.failed === true
  const from = body.from || 'loop'

  // Update local store pheromone
  if (failed) {
    store.markPheromone(id, 'alarm', 8.0)
    store.updateTask(id, { status: 'failed' })
  } else {
    store.markPheromone(id, 'trail', 5.0)
    store.updateTask(id, { status: 'complete' })
    store.cascadeUnblock(id)
  }

  // Update task status in TypeDB (using task-id, not unit uid)
  writeSilent(`
    match $t isa task, has task-id "${id}", has task-status $st;
    delete $st of $t;
    insert $t has task-status "${failed ? 'failed' : 'done'}";
  `).catch(() => {})

  if (!failed) {
    writeSilent(`
      match $t isa task, has task-id "${id}", has done $d;
      delete $d of $t;
      insert $t has done true;
    `).catch(() => {})
  }

  // Update pheromone on path from→task's unit (best-effort — from may not exist as a unit)
  if (failed) {
    writeSilent(`
      match $from isa unit, has uid "${from}"; $to isa skill, has skill-id "${id}";
      (provider: $to_unit, offered: $to) isa capability;
      $e (source: $from, target: $to_unit) isa path, has resistance $r;
      delete $r of $e;
      insert $e has resistance ($r + 8.0);
    `).catch(() => {})
  } else {
    writeSilent(`
      match $from isa unit, has uid "${from}"; $to isa skill, has skill-id "${id}";
      (provider: $to_unit, offered: $to) isa capability;
      $e (source: $from, target: $to_unit) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + 5.0), has traversals ($t + 1);
    `).catch(() => {})
  }

  // Trigger KV refresh (fire and forget)
  triggerKvSync()

  return new Response(JSON.stringify({ ok: true, tid: id, outcome: failed ? 'failed' : 'success' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
