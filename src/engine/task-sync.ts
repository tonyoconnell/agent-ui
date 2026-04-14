/**
 * TASK-SYNC — Write parsed tasks to TypeDB
 *
 * Creates task entities, skill entities (for capability routing),
 * and blocks relations. Pure TypeDB writes, no LLM.
 *
 * Each task also creates a matching skill so the existing
 * capability/pheromone routing system continues to work.
 */

import { readParsed, write, writeSilent } from '@/lib/typedb'
import type { Task } from './task-parse'

const UNIT_ID = 'builder'
const BATCH_SIZE = 10

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Ensure builder unit exists */
async function ensureBuilder() {
  await writeSilent(`
    insert $u isa unit, has uid "${UNIT_ID}", has name "Builder", has unit-kind "system",
      has tag "system", has status "active", has success-rate 0.5, has activity-score 0.0,
      has sample-count 0, has reputation 0.0, has balance 0.0, has generation 0;
  `)
}

/** Insert a single task entity into TypeDB */
async function insertTask(task: Task): Promise<void> {
  const tags = [...new Set(task.tags)].map((t) => `has tag "${esc(t)}"`).join(', ')
  const nameEsc = esc(task.name).slice(0, 200)

  // Insert task entity
  const contextStr = task.context?.length ? `has task-context "${esc(task.context.join(','))}",` : ''
  await writeSilent(`
    insert $t isa task,
      has task-id "${esc(task.id)}",
      has name "${nameEsc}",
      has task-status "${task.done ? 'done' : 'open'}",
      has task-value "${esc(task.value)}",
      has task-effort "${esc(task.effort)}",
      has task-wave "${esc(task.wave || 'W3')}",
      has task-phase "${esc(task.phase)}",
      has task-persona "${esc(task.persona)}",
      ${contextStr}
      has priority-score ${task.priority.toFixed(1)},
      has priority-formula "${esc(task.formula)}",
      has source-file "${esc(task.source)}",
      ${task.exit ? `has exit-condition "${esc(task.exit)}",` : ''}
      has done ${task.done},
      ${tags ? `${tags},` : ''}
      has created ${new Date().toISOString().replace('Z', '')};
  `)

  // Insert matching skill (for capability routing backward compat)
  await writeSilent(`
    insert $s isa skill, has skill-id "${esc(task.id)}", has name "${nameEsc}",
      ${tags ? `${tags},` : ''} has price 0.0, has currency "SUI";
  `)

  // Link skill to builder unit via capability
  await writeSilent(`
    match $u isa unit, has uid "${UNIT_ID}"; $s isa skill, has skill-id "${esc(task.id)}";
    insert (provider: $u, offered: $s) isa capability, has price 0.0;
  `)
}

/** Insert blocks relations between tasks */
async function insertBlocks(tasks: Task[]): Promise<number> {
  let count = 0
  const taskIds = new Set(tasks.map((t) => t.id))

  for (const task of tasks) {
    for (const blockedId of task.blocks) {
      if (!taskIds.has(blockedId)) continue // skip if blocked task doesn't exist
      await writeSilent(`
        match $a isa task, has task-id "${esc(task.id)}";
              $b isa task, has task-id "${esc(blockedId)}";
        insert (blocker: $a, blocked: $b) isa blocks;
      `)
      count++
    }
  }
  return count
}

/** Sync all tasks to TypeDB. Returns counts. */
export async function syncTasks(tasks: Task[]): Promise<{ synced: number; blocks: number; errors: number }> {
  await ensureBuilder()

  const activeQ = `match $t isa task, has task-id $id, has task-status "active"; select $id;`
  const activeRows = await readParsed(activeQ).catch(() => [])
  const activeIds = new Set(activeRows.map((r) => r.id as string))

  let synced = 0
  let errors = 0

  // Insert tasks in batches
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(batch.filter((t) => !activeIds.has(t.id)).map((t) => insertTask(t)))
    for (const r of results) {
      if (r.status === 'fulfilled') synced++
      else errors++
    }
  }

  // Insert blocks relations
  const blocks = await insertBlocks(tasks)

  return { synced, blocks, errors }
}

/** Mark a task as done in TypeDB */
export async function markTaskDone(taskId: string): Promise<void> {
  await write(`
    match $t isa task, has task-id "${esc(taskId)}", has done $d, has task-status $st;
    delete $d of $t; delete $st of $t;
    insert $t has done true, has task-status "done";
  `)
}

/** Load all tasks from TypeDB */
export async function loadTasks(): Promise<Task[]> {
  const rows = await readParsed(`
    match $t isa task,
      has task-id $id, has name $name, has done $done,
      has task-value $val, has task-effort $effort, has task-phase $phase, has task-persona $persona,
      has priority-score $priority, has priority-formula $formula,
      has source-file $source, has task-status $status;
    $t has task-wave $wave;
    select $id, $name, $done, $val, $effort, $wave, $phase, $persona, $priority, $formula, $source, $status;
  `).catch(() =>
    // Fallback without wave (backward compat for tasks created before wave field)
    readParsed(`
      match $t isa task,
        has task-id $id, has name $name, has done $done,
        has task-value $val, has task-effort $effort, has task-phase $phase, has task-persona $persona,
        has priority-score $priority, has priority-formula $formula,
        has source-file $source, has task-status $status;
      select $id, $name, $done, $val, $effort, $phase, $persona, $priority, $formula, $source, $status;
    `).catch(() => []),
  )

  // Load context per task (optional field)
  const contextRows = await readParsed(`
    match $t isa task, has task-id $id, has task-context $ctx;
    select $id, $ctx;
  `).catch(() => [])

  const contextMap: Record<string, string[]> = {}
  for (const r of contextRows) {
    contextMap[r.id as string] = (r.ctx as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // Get tags per task
  const tagRows = await readParsed(`
    match $t isa task, has task-id $id, has tag $tag;
    select $id, $tag;
  `).catch(() => [])

  const tagMap: Record<string, string[]> = {}
  for (const r of tagRows) {
    const id = r.id as string
    if (!tagMap[id]) tagMap[id] = []
    tagMap[id].push(r.tag as string)
  }

  // Get blocks per task
  const blockRows = await readParsed(`
    match (blocker: $a, blocked: $b) isa blocks;
    $a has task-id $aid; $b has task-id $bid;
    select $aid, $bid;
  `).catch(() => [])

  const blockMap: Record<string, string[]> = {}
  for (const r of blockRows) {
    const aid = r.aid as string
    if (!blockMap[aid]) blockMap[aid] = []
    blockMap[aid].push(r.bid as string)
  }

  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    done: r.done as boolean,
    value: r.val as Task['value'],
    effort: (r.effort as Task['effort']) || 'medium',
    wave: (r.wave as Task['wave']) || 'W3',
    phase: r.phase as Task['phase'],
    persona: r.persona as string,
    context: contextMap[r.id as string] || [],
    blocks: blockMap[r.id as string] || [],
    exit: '',
    tags: tagMap[r.id as string] || [],
    source: r.source as string,
    line: 0,
    priority: r.priority as number,
    formula: r.formula as string,
  }))
}
