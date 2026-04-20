/**
 * /api/tasks/:id/assign — Preview or commit an agent assignment.
 *
 * GET  → returns top-3 unit matches for the task's tag set (no write).
 *        Used by TaskDrawer / QueueBar to show "best fit: @donal (0.82)".
 *
 * POST → picks the top match and atomically claims the task
 *        (task-status open → active, owner = best.uid). If the task has
 *        no taggable agents, falls back to CEO routing (stage 3).
 *
 * Neither endpoint throws — both return structured error payloads so the
 * caller can show a sensible fallback UI.
 */

import type { APIRoute } from 'astro'
import { pickBest, rankAgents } from '@/engine/match'
import { getNet } from '@/lib/net'
import { write } from '@/lib/typedb'

async function fetchTaskMeta(tid: string, origin: string): Promise<{ tags: string[]; status: string | null } | null> {
  // Reuse the /api/tasks shape — it already normalizes across legacy task and
  // new `thing` schemas, so we don't re-implement that here.
  try {
    const res = await fetch(`${origin}/api/tasks`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      tasks?: Array<{ id?: string; tid?: string; tags?: string[]; status?: string; task_status?: string }>
    }
    const row = data.tasks?.find((t) => (t.tid ?? t.id) === tid)
    if (!row) return null
    return {
      tags: row.tags ?? [],
      status: row.task_status ?? row.status ?? null,
    }
  } catch {
    return null
  }
}

export const GET: APIRoute = async ({ params, url }) => {
  const tid = (params as { id: string }).id
  if (!tid) return Response.json({ error: 'Missing task id' }, { status: 400 })

  const origin = url.origin
  const meta = await fetchTaskMeta(tid, origin)
  if (!meta) return Response.json({ error: 'Task not found', tid }, { status: 404 })
  if (meta.tags.length === 0) {
    return Response.json({ tid, status: meta.status, matches: [], reason: 'no-tags' })
  }

  const net = await getNet()
  const matches = await rankAgents(net, meta.tags, 3)

  return Response.json(
    {
      tid,
      status: meta.status,
      taskTags: meta.tags,
      matches,
      fallback: matches.length === 0 ? 'ceo' : null,
    },
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  )
}

export const POST: APIRoute = async ({ params, url }) => {
  const tid = (params as { id: string }).id
  if (!tid) return Response.json({ error: 'Missing task id' }, { status: 400 })

  const origin = url.origin
  const meta = await fetchTaskMeta(tid, origin)
  if (!meta) return Response.json({ error: 'Task not found', tid }, { status: 404 })
  if (meta.status !== 'open') {
    return Response.json({ error: 'Task is not open', tid, status: meta.status }, { status: 409 })
  }

  const net = await getNet()
  const owner = (await pickBest(net, meta.tags)) ?? 'ceo'

  // Atomic open → active with owner set. Mirrors claim.ts semantics but
  // without requiring a sessionId — assignment is server-chosen.
  const q = `
    match $t isa task, has task-id "${tid}", has task-status $s; $s = "open";
    delete $s of $t;
    insert $t has task-status "active", has owner "${owner}";
  `

  try {
    const result = await write(q)
    if (!result || result.length === 0) {
      return Response.json({ error: 'Already claimed', tid }, { status: 409 })
    }
    return Response.json({
      ok: true,
      tid,
      owner,
      routedBy: owner === 'ceo' ? 'fallback-ceo' : 'multi-tag-match',
      assignedAt: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Unknown error', tid }, { status: 500 })
  }
}
