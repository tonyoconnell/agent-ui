/**
 * PATCH /api/tasks/:tid — Update task status
 *
 * Body: { status: 'todo' | 'in_progress' | 'complete' | 'blocked' | 'failed' }
 *
 * Updates local store first (fast), then TypeDB (may fail), then triggers KV sync.
 */
import type { APIRoute } from 'astro'
import * as store from '@/lib/tasks-store'
import { writeSilent } from '@/lib/typedb'

const VALID_STATUSES = new Set(['todo', 'in_progress', 'complete', 'blocked', 'failed'])

function triggerKvSync() {
  const syncUrl = import.meta.env.SYNC_WORKER_URL || 'https://one-sync.oneie.workers.dev'
  fetch(`${syncUrl}/sync`, { method: 'POST' }).catch(() => {})
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const { tid } = params
  if (!tid) {
    return new Response(JSON.stringify({ error: 'Missing task id' }), { status: 400 })
  }

  // Validate tid format (alphanumeric, hyphens only)
  if (!/^[a-zA-Z0-9_-]+$/.test(tid)) {
    return new Response(JSON.stringify({ error: 'Invalid task id format' }), { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as { status?: string }
  const { status } = body

  if (!status || !VALID_STATUSES.has(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status', valid: [...VALID_STATUSES] }), { status: 400 })
  }

  // Update local store first (always works)
  const updated = store.updateTask(tid, { status: status as store.ProjectTask['status'] })

  // Cascade unblock if completing
  let unblocked: string[] = []
  if (status === 'complete') {
    unblocked = store.cascadeUnblock(tid)
  }

  // Also update TypeDB (may fail if not connected)
  writeSilent(`
    match $t isa task, has task-id "${tid}", has task-status $old;
    delete $old of $t;
    insert $t has task-status "${status}";
  `).catch(() => {})

  if (status === 'complete') {
    writeSilent(`
      match $t isa task, has task-id "${tid}", has done $d;
      delete $d of $t;
      insert $t has done true;
    `).catch(() => {})
  }

  // Trigger KV refresh (fire and forget)
  triggerKvSync()

  return new Response(JSON.stringify({ ok: true, tid, status, unblocked, found: !!updated }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
