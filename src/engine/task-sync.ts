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
import { relayToGateway, wsManager } from '@/lib/ws-server'
import type { PersistentWorld } from './persist'
import type { Task } from './task-parse'

const UNIT_ID = 'builder'
const TASKS_PER_QUERY = 25
const BLOCKS_PER_QUERY = 50

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

/** Render insert block for one task — used inside a packed batch query */
function renderTaskInsert(task: Task, idx: number): string {
  const tags = [...new Set(task.tags)].map((t) => `has tag "${esc(t)}"`).join(', ')
  const nameEsc = esc(task.name).slice(0, 200)
  const contextStr = task.context?.length ? `has task-context "${esc(task.context.join(','))}",` : ''
  return `
    $t${idx} isa task,
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
    $s${idx} isa skill, has skill-id "${esc(task.id)}", has name "${nameEsc}",
      ${tags ? `${tags},` : ''} has price 0.0, has currency "SUI";
    (provider: $u, offered: $s${idx}) isa capability, has price 0.0;`
}

/** Insert a packed batch of tasks in one TypeDB round-trip */
async function insertTaskBatch(batch: Task[]): Promise<number> {
  if (batch.length === 0) return 0
  const inserts = batch.map((t, i) => renderTaskInsert(t, i)).join('\n')
  try {
    await write(`
      match $u isa unit, has uid "${UNIT_ID}";
      insert ${inserts}
    `)
    return batch.length
  } catch {
    // Packed query failed — fall back to per-task (isolates the bad row)
    let ok = 0
    for (const t of batch) {
      try {
        await write(`
          match $u isa unit, has uid "${UNIT_ID}";
          insert ${renderTaskInsert(t, 0)}
        `)
        ok++
      } catch {}
    }
    return ok
  }
}

/** Insert blocks relations — packed into multi-pair queries */
async function insertBlocks(tasks: Task[]): Promise<number> {
  const taskIds = new Set(tasks.map((t) => t.id))
  const pairs: Array<[string, string]> = []
  for (const task of tasks) {
    for (const blockedId of task.blocks) {
      if (taskIds.has(blockedId)) pairs.push([task.id, blockedId])
    }
  }

  let count = 0
  for (let i = 0; i < pairs.length; i += BLOCKS_PER_QUERY) {
    const batch = pairs.slice(i, i + BLOCKS_PER_QUERY)
    const matches = batch
      .map(
        ([blocker, blocked], j) =>
          `$a${j} isa task, has task-id "${esc(blocker)}"; $b${j} isa task, has task-id "${esc(blocked)}";`,
      )
      .join('\n')
    const inserts = batch.map((_, j) => `(blocker: $a${j}, blocked: $b${j}) isa blocks;`).join('\n')
    try {
      await write(`match ${matches} insert ${inserts}`)
      count += batch.length
    } catch {
      // Fall back: pair-by-pair
      for (const [blocker, blocked] of batch) {
        try {
          await write(`
            match $a isa task, has task-id "${esc(blocker)}";
                  $b isa task, has task-id "${esc(blocked)}";
            insert (blocker: $a, blocked: $b) isa blocks;
          `)
          count++
        } catch {}
      }
    }
  }
  return count
}

/** Sync all tasks to TypeDB. Returns counts. */
export async function syncTasks(tasks: Task[]): Promise<{ synced: number; blocks: number; errors: number }> {
  await ensureBuilder()

  // Skip tasks that already exist OR are currently claimed (status="active")
  const existingRows = await readParsed(`match $t isa task, has task-id $id; select $id;`).catch(() => [])
  const activeIds = new Set(existingRows.map((r) => r.id as string))

  let synced = 0
  let errors = 0

  // Insert tasks in packed batches (one TypeDB round-trip per batch)
  const pending = tasks.filter((t) => !activeIds.has(t.id))
  for (let i = 0; i < pending.length; i += TASKS_PER_QUERY) {
    const batch = pending.slice(i, i + TASKS_PER_QUERY)
    const ok = await insertTaskBatch(batch)
    synced += ok
    errors += batch.length - ok
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
  const completeMsg = { type: 'complete' as const, taskId, timestamp: Date.now() }
  wsManager.broadcast(completeMsg)
  relayToGateway(completeMsg)
}

/**
 * selfCheckoff — mark a task done, strengthen the pheromone path,
 * unblock dependents, and harden the phase if it's complete.
 *
 * Closure pattern: composes markTaskDone + net.mark + blockedBy query + enqueue.
 *
 * Returns { marked: 1, unblocked: [task-ids] }
 */
export async function selfCheckoff(
  taskId: string,
  net: PersistentWorld,
): Promise<{ marked: number; unblocked: string[] }> {
  // 1. Mark task done in TypeDB (durable write)
  await markTaskDone(taskId)

  // 2. Strengthen the path — depth signal on the builder loop
  net.mark(`loop→builder:${taskId}`, 5)

  // 3. Query tasks directly blocked by this task
  const blockedIds = await taskBlockers(taskId)

  // 4. For each blocked task: check if ALL of its blockers are now done.
  //    If yes → set status "open" and enqueue it for processing.
  const unblocked: string[] = []
  await Promise.all(
    blockedIds.map(async (tid) => {
      const stillBlocked = await readParsed(`
        match (blocker: $b, blocked: $t) isa blocks;
        $t isa task, has task-id "${esc(tid)}";
        $b has done false;
        select $b;
      `).catch(() => [])

      if (stillBlocked.length === 0) {
        // All blockers resolved — open and enqueue
        await writeSilent(`
          match $t isa task, has task-id "${esc(tid)}", has task-status $s;
          delete $s of $t;
          insert $t has task-status "open";
        `).catch(() => {})
        net.enqueue({ receiver: `builder:${tid}` })
        unblocked.push(tid)
      }
    }),
  )

  // 5. Check remaining open tasks in the same phase as taskId.
  //    If none remain → harden: promote highways to permanent knowledge.
  const phaseRows = await readParsed(`
    match $t isa task, has task-id "${esc(taskId)}", has task-phase $ph;
    select $ph;
  `).catch(() => [])

  if (phaseRows.length > 0) {
    const phase = phaseRows[0]?.ph as string
    const remaining = await readParsed(`
      match $t isa task, has task-phase "${esc(phase)}", has done false;
      select $t;
    `).catch(() => [])
    if (remaining.length === 0) {
      await net.know()
    }
  }

  // 6. Broadcast completion and unblock events via WebSocket + Gateway relay
  const completeMsg = { type: 'complete' as const, taskId, timestamp: Date.now() }
  wsManager.broadcast(completeMsg)
  relayToGateway(completeMsg)
  for (const unblockedId of unblocked) {
    const unblockMsg = { type: 'unblock' as const, taskId: unblockedId, unblockedBy: taskId, timestamp: Date.now() }
    wsManager.broadcast(unblockMsg)
    relayToGateway(unblockMsg)
  }

  return { marked: 1, unblocked }
}

/** Query what tasks are BLOCKED BY taskId (i.e. taskId blocks them) */
export async function taskBlockers(taskId: string): Promise<string[]> {
  const rows = await readParsed(`
    match (blocker: $a, blocked: $b) isa blocks;
    $a has task-id "${esc(taskId)}";
    $b has task-id $bid;
    select $bid;
  `).catch(() => [])
  return rows.map((r) => r.bid as string)
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
