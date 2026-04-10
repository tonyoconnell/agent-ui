/**
 * PATCH /api/tasks/:tid — Update task status
 *
 * Body: { status: 'todo' | 'in_progress' | 'complete' | 'blocked' | 'failed' }
 *
 * Updates the task-status attribute in TypeDB.
 */
import type { APIRoute } from 'astro'
import { writeSilent } from '@/lib/typedb'

const VALID_STATUSES = new Set(['todo', 'in_progress', 'complete', 'blocked', 'failed'])

export const PATCH: APIRoute = async ({ params, request }) => {
  const { tid } = params
  if (!tid) {
    return new Response(JSON.stringify({ error: 'Missing task id' }), { status: 400 })
  }

  // Validate tid format (alphanumeric, hyphens only)
  if (!/^[a-zA-Z0-9_-]+$/.test(tid)) {
    return new Response(JSON.stringify({ error: 'Invalid task id format' }), { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as { status?: string }
  const { status } = body

  if (!status || !VALID_STATUSES.has(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status', valid: [...VALID_STATUSES] }), { status: 400 })
  }

  // Update task status in TypeDB
  const result = await writeSilent(`
    match $t isa task, has task-id "${tid}", has task-status $old;
    delete $old of $t;
    insert $t has task-status "${status}";
  `).catch((e) => ({ error: e.message }))

  if (result && typeof result === 'object' && 'error' in result) {
    // Task might not exist or have no status — try insert
    await writeSilent(`
      match $t isa task, has task-id "${tid}";
      insert $t has task-status "${status}";
    `).catch(() => {})
  }

  // Also update done flag if completing
  if (status === 'complete') {
    await writeSilent(`
      match $t isa task, has task-id "${tid}", has done $d;
      delete $d of $t;
      insert $t has done true;
    `).catch(() => {})
  } else if (status === 'todo' || status === 'in_progress') {
    await writeSilent(`
      match $t isa task, has task-id "${tid}", has done $d;
      delete $d of $t;
      insert $t has done false;
    `).catch(() => {})
  }

  return new Response(JSON.stringify({ ok: true, tid, status }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
