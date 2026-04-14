/**
 * POST /api/tasks/:id/complete — Mark a signal outcome
 *
 * W4 Gate: Runs npm run verify before allowing mark.
 * Blocks if tests regress (deterministic sandwich POST check).
 *
 * :id is a task tid (e.g. "T-2"). body.failed = true for failure.
 * Updates pheromone in local store (fast), TypeDB (silent), and triggers KV sync.
 */

import { execSync } from 'node:child_process'
import type { APIRoute } from 'astro'
import * as store from '@/lib/tasks-store'
import { writeSilent } from '@/lib/typedb'
import { wsManager } from '@/lib/ws-server'

function triggerKvSync() {
  const syncUrl = import.meta.env.SYNC_WORKER_URL || 'https://one-sync.oneie.workers.dev'
  fetch(`${syncUrl}/sync`, { method: 'POST' }).catch(() => {})
}

function verifyBaseline(): { ok: boolean; error?: string } {
  try {
    execSync('npm run verify', { stdio: 'pipe', encoding: 'utf-8' })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: `W4 verification failed: ${message}. Blocking mark() to prevent pheromone corruption.`,
    }
  }
}

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing task id' }), { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as { failed?: boolean; from?: string; skipVerify?: boolean }
  const failed = body.failed === true
  const from = body.from || 'loop'
  const skipVerify = body.skipVerify === true

  // W4 Gate: Verify baseline before marking success
  // Blocking mark if tests regress (deterministic sandwich POST check)
  if (!failed && !skipVerify) {
    const verification = verifyBaseline()
    if (!verification.ok) {
      return new Response(
        JSON.stringify({
          error: verification.error,
          blocked: true,
          tid: id,
          reason: 'W4 verification failed',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  // Update local store pheromone
  if (failed) {
    store.markPheromone(id, 'alarm', 8.0)
    store.updateTask(id, { status: 'failed' })
  } else {
    store.markPheromone(id, 'trail', 5.0)
    store.updateTask(id, { status: 'complete' })
    store.cascadeUnblock(id)
  }

  // Clear owner + claimed-at
  writeSilent(`
    match $t isa task, has task-id "${id}", has owner $o, has claimed-at $c;
    delete $o of $t; delete $c of $t;
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
  wsManager.broadcast({
    type: failed ? 'warn' : 'mark',
    taskId: id,
    strength: task?.trailPheromone ?? 0,
    resistance: task?.alarmPheromone ?? 0,
    timestamp: Date.now(),
  })

  return new Response(JSON.stringify({ ok: true, tid: id, outcome: failed ? 'failed' : 'success' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
