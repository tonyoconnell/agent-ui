#!/usr/bin/env bun
/**
 * graph-view.ts — Single query view of full task graph
 *
 * Answers: "see all the graph with one query"
 * Shows: task topology, blocking edges, cascade impact
 */

import { read } from '@/lib/typedb'

interface TaskNode {
  taskId: string
  name: string
  status: string
  wave: string | null
  priority: number
  tags: string[]
}

interface BlockEdge {
  blocker: string
  blocked: string
}

async function fetchTasks(): Promise<TaskNode[]> {
  // Simple query: all tasks with core fields
  const rows = await read(`
    match $t isa task, has task-id $task-id, has name $name, has task-status $status;
    select $task-id, $name, $status;
  `)

  const tasks = new Map<string, TaskNode>()
  for (const row of rows) {
    const taskId = row['task-id']?.value ?? row['task-id']
    if (!taskId) continue
    tasks.set(taskId, {
      taskId,
      name: row.name?.value ?? row.name ?? taskId,
      status: row.status?.value ?? row.status ?? 'open',
      wave: null,
      priority: 0.5,
      tags: [],
    })
  }

  // Fetch waves separately
  try {
    const waveRows = await read(`
      match $t isa task, has task-id $task-id, has task-wave $wave;
      select $task-id, $wave;
    `)
    for (const row of waveRows) {
      const taskId = row['task-id']?.value ?? row['task-id']
      const wave = row.wave?.value ?? row.wave
      if (taskId && tasks.has(taskId)) {
        tasks.get(taskId)!.wave = wave
      }
    }
  } catch {
    // Some tasks may not have waves
  }

  // Fetch tags separately
  try {
    const tagRows = await read(`
      match $t isa task, has task-id $task-id, has tag $tag;
      select $task-id, $tag;
    `)
    for (const row of tagRows) {
      const taskId = row['task-id']?.value ?? row['task-id']
      const tag = row.tag?.value ?? row.tag
      if (taskId && tag && tasks.has(taskId)) {
        tasks.get(taskId)!.tags.push(tag)
      }
    }
  } catch {
    // Some tasks may not have tags
  }

  return Array.from(tasks.values())
}

async function fetchBlocks(): Promise<BlockEdge[]> {
  const rows = await read(`
    match
      $a isa task, has task-id $blocker;
      $b isa task, has task-id $blocked;
      (blocker: $a, blocked: $b) isa blocks;
    select $blocker, $blocked;
  `)

  return rows.map((row) => ({
    blocker: row.blocker?.value ?? row.blocker,
    blocked: row.blocked?.value ?? row.blocked,
  }))
}

function computeUnlocks(tasks: TaskNode[], edges: BlockEdge[]): Map<string, Set<string>> {
  const unlocks = new Map<string, Set<string>>()

  for (const task of tasks) {
    const reached = new Set<string>()
    const queue = [task.taskId]

    while (queue.length > 0) {
      const current = queue.shift()!
      for (const edge of edges) {
        if (edge.blocker === current && !reached.has(edge.blocked)) {
          reached.add(edge.blocked)
          queue.push(edge.blocked)
        }
      }
    }
    unlocks.set(task.taskId, reached)
  }

  return unlocks
}

async function main() {
  console.log('Fetching full task graph from TypeDB...\n')

  const [tasks, edges] = await Promise.all([fetchTasks(), fetchBlocks()])
  const unlocks = computeUnlocks(tasks, edges)

  console.log(`Graph: ${tasks.length} tasks, ${edges.length} block edges\n`)

  // Group by status
  const byStatus = new Map<string, number>()
  const byWave = new Map<string, number>()
  for (const t of tasks) {
    byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1)
    byWave.set(t.wave ?? 'null', (byWave.get(t.wave ?? 'null') ?? 0) + 1)
  }

  console.log('By status:', Object.fromEntries(byStatus))
  console.log('By wave:', Object.fromEntries(byWave))

  // Find tasks with most transitive unlocks
  const openTasks = tasks.filter((t) => t.status === 'open' || t.status === 'ready')
  const scored = openTasks.map((t) => ({
    task: t,
    unlockCount: unlocks.get(t.taskId)?.size ?? 0,
  }))
  scored.sort((a, b) => b.unlockCount - a.unlockCount)

  console.log('\nTop 15 tasks by cascade unlock potential:\n')
  console.log('Unlocks | Wave | Task')
  console.log(`--------|------|${'-'.repeat(60)}`)

  for (const { task, unlockCount } of scored.slice(0, 15)) {
    const wave = task.wave ?? 'W?'
    console.log(`${String(unlockCount).padStart(7)} | ${wave.padStart(4)} | ${task.name}`)
  }

  // Show what top task would unblock
  if (scored.length > 0 && scored[0].unlockCount > 0) {
    const top = scored[0]
    const wouldUnblock = unlocks.get(top.task.taskId)!
    console.log(`\nCompleting "${top.task.name}" would unblock ${wouldUnblock.size} tasks:`)
    for (const tid of Array.from(wouldUnblock).slice(0, 10)) {
      const t = tasks.find((x) => x.taskId === tid)
      console.log(`  → ${t?.name ?? tid}`)
    }
    if (wouldUnblock.size > 10) {
      console.log(`  ... and ${wouldUnblock.size - 10} more`)
    }
  }

  // Find root blockers (tasks that block others but aren't blocked themselves)
  const blockedTids = new Set(edges.map((e) => e.blocked))
  const blockerTids = new Set(edges.map((e) => e.blocker))
  const roots = tasks.filter((t) => blockerTids.has(t.taskId) && !blockedTids.has(t.taskId) && t.status !== 'verified')

  if (roots.length > 0) {
    console.log(`\nRoot blockers (block others, not blocked themselves):`)
    for (const t of roots.slice(0, 10)) {
      const count = unlocks.get(t.taskId)?.size ?? 0
      console.log(`  ${t.name} (unlocks ${count})`)
    }
  }
}

main().catch(console.error)
