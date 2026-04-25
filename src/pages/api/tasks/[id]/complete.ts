/**
 * POST /api/tasks/:id/complete — Mark/warn pheromone, write outcome to TypeDB, and broadcast via WS.
 */

import type { APIRoute } from 'astro'
import * as store from '@/lib/tasks-store'
import { writeSilent } from '@/lib/typedb'
import { relayToGateway, wsManager } from '@/lib/ws-server'

function triggerKvSync() {
  const syncUrl = import.meta.env.SYNC_WORKER_URL || 'https://one-sync.oneie.workers.dev'
  fetch(`${syncUrl}/sync`, { method: 'POST' }).catch(() => {})
}

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing task id' }), { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as { failed?: boolean; from?: string }
  const failed = body.failed === true
  const from = body.from || 'loop'

  // Update local store pheromone
  if (failed) {
    store.markPheromone(id, 'alarm', 8.0)
    store.updateTask(id, { task_status: 'failed' })
  } else {
    store.markPheromone(id, 'trail', 5.0)
    store.updateTask(id, { task_status: 'verified' })
    store.cascadeUnblock(id)
  }

  // Clear owner
  writeSilent(`
    match $t isa task, has task-id "${id}", has owner $o;
    delete $o of $t;
  `).catch(() => {})

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

  // Broadcast pheromone change to all connected TaskBoard instances
  const task = store.getTask(id)
  if (failed) {
    const msg = { type: 'warn' as const, tid: id, resistance: task?.resistance ?? 0 }
    wsManager.broadcast(msg)
    relayToGateway(msg)
  } else {
    const msg = { type: 'mark' as const, tid: id, strength: task?.strength ?? 0 }
    wsManager.broadcast(msg)
    relayToGateway(msg)
  }

  // Also broadcast the status change so other clients update immediately
  const completeMsg = { type: 'complete' as const, tid: id }
  wsManager.broadcast(completeMsg)
  relayToGateway(completeMsg)

  return new Response(JSON.stringify({ ok: true, tid: id, outcome: failed ? 'failed' : 'success' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
