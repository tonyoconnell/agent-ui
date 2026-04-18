/**
 * POST /api/tasks/:id/claim — Atomically claim an open task
 *
 * One match-delete-insert query: matches only when task-status is "open",
 * transitions to "active", stamps owner + claimed-at. If no rows returned,
 * the task is already claimed (409).
 */

import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request, params }) => {
  const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string }
  const id = (params as { id: string }).id

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing task id' }), { status: 400 })
  }
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), { status: 400 })
  }

  const iso = new Date().toISOString()

  // Atomic match-delete-insert: only succeeds if task is currently "open"
  const q = `match $t isa task, has task-id "${id}", has task-status $s; $s = "open"; delete $s of $t; insert $t has task-status "active", has owner "${sessionId}", has claimed-at "${iso}";`

  try {
    const result = await write(q)
    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Already claimed', tid: id }), { status: 409 })
    }
    return new Response(JSON.stringify({ ok: true, tid: id, owner: sessionId, claimedAt: iso }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
