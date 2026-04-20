/**
 * POST /api/sync/plan
 *
 * Compile a plan markdown file (e.g. `one/chairman.md`) + its sibling
 * `-todo.md` into the TypeDB thing-tree: plan → cycles → tasks + containment +
 * blocks relations. Called by `/sync <path>` when the file's frontmatter
 * declares `type: plan` or `status: (PLAN|SYNCED|RUNNING|CLOSED)`.
 *
 * Body: { path: string }  — repo-relative path, e.g. "one/chairman.md"
 * Returns: PlanSyncResult
 */

import { resolve } from 'node:path'
import type { APIRoute } from 'astro'
import { parsePlanAndTodo } from '@/engine/plan-parse'
import { syncPlan } from '@/engine/plan-sync'
import { createTask, getTask, updateTask } from '@/lib/tasks-store'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  let path: string
  try {
    const body = (await request.json()) as { path?: string }
    path = body.path ?? ''
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (!path) {
    return Response.json({ ok: false, error: 'path is required' }, { status: 400 })
  }

  // Resolve relative to the repo root (process.cwd() in dev/SSR).
  const abs = resolve(process.cwd(), path)

  const t0 = Date.now()
  let spec: Awaited<ReturnType<typeof parsePlanAndTodo>>['spec']
  let tasks: Awaited<ReturnType<typeof parsePlanAndTodo>>['tasks']
  try {
    const parsed = await parsePlanAndTodo(abs)
    spec = parsed.spec
    tasks = parsed.tasks
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: `parse failed: ${msg}`, stage: 'parse' }, { status: 500 })
  }
  const parseMs = Date.now() - t0

  if (!spec.slug) {
    return Response.json(
      { ok: false, error: 'plan missing slug (frontmatter.slug or filename)', stage: 'parse' },
      { status: 400 },
    )
  }

  const result = await syncPlan(spec, tasks)
  result.timing.parse = parseMs

  // Mirror tasks into the local tasks-store (.tasks.json) so the existing
  // `/api/tasks` endpoint surfaces them without a TypeDB fallback round-trip.
  // Idempotent: skip tids already in the store.
  let mirrored = 0
  for (const row of tasks) {
    if (getTask(row.tid)) continue
    const input: Parameters<typeof createTask>[0] = {
      tid: row.tid,
      name: row.name || row.tid,
      task_wave: row.wave,
      task_effort: row.effort ?? 0.3,
      task_value: row.wave === 'W2' || row.wave === 'W4' ? 0.8 : 0.5,
      tags: [spec.slug, `cycle-${row.cycleNumber}`, row.wave.toLowerCase(), ...row.tags],
      blocks: [...row.blocks],
      blocked_by: [...row.dependsOn],
    }
    if (row.exit) (input as { exit_condition?: string }).exit_condition = row.exit
    createTask(input)
    mirrored += 1
  }

  // Second pass: reconcile blocked_by across all plan tasks. createTask only
  // wires the back-edge if the blocked task already existed in the map at
  // creation time — so linear iteration misses every forward reference. Here
  // we rebuild blocked_by deterministically from the parsed graph.
  const allTids = new Set(tasks.map((t) => t.tid))
  const blockedByMap = new Map<string, Set<string>>()
  for (const row of tasks) {
    for (const blocked of row.blocks) {
      if (!allTids.has(blocked)) continue
      if (!blockedByMap.has(blocked)) blockedByMap.set(blocked, new Set())
      blockedByMap.get(blocked)!.add(row.tid)
    }
    // dependsOn: "A depends on B" → A.blocked_by includes B
    for (const blocker of row.dependsOn) {
      if (!allTids.has(blocker)) continue
      if (!blockedByMap.has(row.tid)) blockedByMap.set(row.tid, new Set())
      blockedByMap.get(row.tid)!.add(blocker)
    }
  }
  let reconciled = 0
  for (const [tid, blockers] of blockedByMap) {
    const existing = getTask(tid)
    if (!existing) continue
    const merged = Array.from(new Set([...existing.blocked_by, ...blockers]))
    if (merged.length !== existing.blocked_by.length) {
      updateTask(tid, { blocked_by: merged })
      reconciled += 1
    }
  }
  const augmented = { ...result, localMirror: mirrored, blockedByReconciled: reconciled }

  const status = result.ok ? 200 : 500
  return Response.json(augmented, { status })
}

/**
 * GET /api/sync/plan?path=one/chairman.md
 * Dry-run: parse the file(s) and return the structured output WITHOUT writing
 * to TypeDB. Useful for previewing what a sync would emit.
 */
export const GET: APIRoute = async ({ url }) => {
  const path = url.searchParams.get('path')
  if (!path) return Response.json({ ok: false, error: 'path query param required' }, { status: 400 })

  const abs = resolve(process.cwd(), path)
  try {
    const parsed = await parsePlanAndTodo(abs)
    return Response.json({
      ok: true,
      dryRun: true,
      spec: parsed.spec,
      tasks: parsed.tasks,
      taskCount: parsed.tasks.length,
      cycleCount: parsed.spec.cycleMeta.length,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: msg, stage: 'parse' }, { status: 500 })
  }
}
