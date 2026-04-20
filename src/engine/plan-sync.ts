/**
 * PLAN-SYNC — Compile a parsed PlanSpec + TaskRow[] into TypeDB.
 *
 * **Schema note (2026-04-20).** The canonical target per `one/template-plan.md`
 * is the `thing` tree (thing-type="plan|cycle|task" + containment relations)
 * defined in `src/schema/one.tql:52-116`. Prod TypeDB Cloud still runs the
 * pre-collapse schema (`unit`, `task`, `skill`, `hypothesis` — no `thing`,
 * no `containment`). Until the schema migration ships, we write via the legacy
 * `task` entity using the existing `syncTasks()` pipeline — same pheromone +
 * blocks semantics, fewer concepts. Migration to `thing` is a follow-up cycle.
 *
 * What we emit:
 *   - One `task` per TaskRow (task-id, name, task-status, task-wave, task-phase,
 *     task-effort, task-persona, tags — including plan-slug + cycle-N + wave).
 *   - Matching `skill` + `capability(builder → skill)` per task (lets the
 *     marketplace/discovery surface show plan tasks as pick-upable).
 *   - `blocks(blocker, blocked)` relations from both the `Blocks` column
 *     AND the `Depends on` column (flipping direction so "A depends on B"
 *     becomes B→A blocks).
 *
 * Plan-level metadata (goal, cycles-planned, escape, rubric weights, source
 * of truth, downstream pitch) stays in the markdown for now. When the `thing`
 * schema lands, a second pass will lift it into TypeDB.
 */

import type { PlanSpec, TaskRow } from './plan-parse'
import type { ParsedTask } from './task-parse'
import { syncTasks } from './task-sync'

export interface PlanSyncResult {
  ok: boolean
  planId: string
  cyclesDetected: number
  tasks: { attempted: number; synced: number; errors: number }
  blocks: { attempted: number; synced: number }
  tagged: number
  schemaNote: string
  timing: { parse: number; typedb: number }
}

/** Approximate ParsedTask.value from task wave: decide/verify tasks score higher. */
function inferValue(wave: TaskRow['wave']): ParsedTask['value'] {
  switch (wave) {
    case 'W2':
      return 'high' // decide tasks — highest leverage
    case 'W4':
      return 'high' // verify — gates the cycle
    case 'W3':
      return 'medium'
    case 'W1':
      return 'medium'
  }
}

/** Bucket the numeric effort (0..1) into the three-level ParsedTask.effort. */
function bucketEffort(n: number | undefined): ParsedTask['effort'] {
  const v = n ?? 0.3
  if (v < 0.25) return 'low'
  if (v < 0.5) return 'medium'
  return 'high'
}

/** Wave → persona mapping matches the template's wave table (Haiku/Opus/Sonnet roles). */
function inferPersona(wave: TaskRow['wave']): string {
  switch (wave) {
    case 'W1':
      return 'agent' // Haiku recon
    case 'W2':
      return 'ceo' // Opus decide
    case 'W3':
      return 'dev' // Sonnet edit
    case 'W4':
      return 'dev' // Sonnet verify
  }
}

/**
 * Map TaskRow[] → ParsedTask[], expanding `dependsOn` into reverse `blocks`
 * entries so `syncTasks()`'s `insertBlocks()` writes a complete dependency graph.
 */
function mapTasks(spec: PlanSpec, rows: TaskRow[]): ParsedTask[] {
  // Phase 1: build the base ParsedTask per row.
  const byId = new Map<string, ParsedTask>()
  for (const row of rows) {
    const taskTags = Array.from(new Set([spec.slug, `cycle-${row.cycleNumber}`, row.wave.toLowerCase(), ...row.tags]))
    byId.set(row.tid, {
      id: row.tid,
      name: row.name || row.tid,
      done: false,
      value: inferValue(row.wave),
      effort: bucketEffort(row.effort),
      wave: row.wave,
      phase: `C${row.cycleNumber}`,
      persona: inferPersona(row.wave),
      context: spec.sourceOfTruth.slice(0, 3),
      blocks: [...row.blocks],
      exit: row.exit,
      tags: taskTags,
      source: `one/${spec.slug}.md`,
      line: 0,
      priority: 0, // computed downstream by existing priority formula
      formula: `plan=${spec.slug},wave=${row.wave},cycle=${row.cycleNumber}`,
    })
  }

  // Phase 2: invert dependsOn. "A dependsOn B" means "B blocks A".
  for (const row of rows) {
    for (const blocker of row.dependsOn) {
      const blockerTask = byId.get(blocker)
      if (!blockerTask) continue // cite to a task outside the plan — skip
      if (!blockerTask.blocks.includes(row.tid)) blockerTask.blocks.push(row.tid)
    }
  }

  return Array.from(byId.values())
}

/**
 * Sync a plan + its tasks to TypeDB via the legacy `task` entity pipeline.
 * Returns a summary compatible with the old `thing`-tree result shape so the
 * route handler stays unchanged.
 */
export async function syncPlan(spec: PlanSpec, rows: TaskRow[]): Promise<PlanSyncResult> {
  const t0 = Date.now()
  const parsed = mapTasks(spec, rows)

  // Count attempted blocks before syncTasks() mutates nothing useful we can inspect.
  const attemptedBlocks = parsed.reduce((acc, t) => acc + t.blocks.length, 0)

  const { synced, blocks, errors } = await syncTasks(parsed)

  const typedbMs = Date.now() - t0

  return {
    ok: errors === 0,
    planId: spec.slug,
    cyclesDetected: spec.cycleMeta.length,
    tasks: { attempted: parsed.length, synced, errors },
    blocks: { attempted: attemptedBlocks, synced: blocks },
    tagged: spec.tags.length,
    schemaNote:
      'legacy task-entity write path (thing-tree migration pending; goal/cycles-planned/escape/rubric-weights remain in markdown)',
    timing: { parse: 0, typedb: typedbMs },
  }
}
