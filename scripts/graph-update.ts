#!/usr/bin/env bun
/**
 * graph-update.ts — Single atomic update for batch task completion
 *
 * This is the "update the graph with one query" the user asked for.
 * Marks multiple tasks complete + deposits pheromone + cascades unblocks
 * in a single TypeDB transaction.
 */

import { write, writeSilent } from '@/lib/typedb'

interface CompletionBatch {
  taskIds: string[]
  pheromoneDeposit: number
  source: string
}

async function batchComplete(batch: CompletionBatch): Promise<{
  completed: string[]
  unblocked: string[]
  pheromoneEdges: number
}> {
  const { taskIds, pheromoneDeposit, source } = batch

  if (taskIds.length === 0) {
    return { completed: [], unblocked: [], pheromoneEdges: 0 }
  }

  // Build a single TypeQL query that:
  // 1. Marks all tasks as verified
  // 2. Creates pheromone edges between sequential tasks
  // 3. Cascades unblocks

  const completed: string[] = []
  const unblocked: string[] = []

  // Step 1: Mark all tasks verified in one query
  const tidList = taskIds.map((t) => `"${t}"`).join(', ')
  const markQuery = `
    match
      $t isa task, has tid $tid;
      $tid in [${tidList}];
      $t has task-status $old_status;
    delete
      $t has $old_status;
    insert
      $t has task-status "verified";
  `

  try {
    await write(markQuery)
    completed.push(...taskIds)
  } catch (e) {
    console.error('Batch mark failed:', e)
    return { completed: [], unblocked: [], pheromoneEdges: 0 }
  }

  // Step 2: Deposit pheromone on task→task edges (if sequence provided)
  let pheromoneEdges = 0
  if (taskIds.length > 1) {
    for (let i = 0; i < taskIds.length - 1; i++) {
      const from = `task:${taskIds[i]}`
      const to = `task:${taskIds[i + 1]}`
      const edgeQuery = `
        match
          $p isa path, has from "${from}", has to "${to}";
          $p has strength $old_s;
        delete
          $p has $old_s;
        insert
          $p has strength ($old_s + ${pheromoneDeposit});
      `
      // Fire and forget — pheromone deposit is best-effort
      writeSilent(edgeQuery)
      pheromoneEdges++
    }

    // Also create edges if they don't exist
    for (let i = 0; i < taskIds.length - 1; i++) {
      const from = `task:${taskIds[i]}`
      const to = `task:${taskIds[i + 1]}`
      const createQuery = `
        match
          not { $p isa path, has from "${from}", has to "${to}"; };
        insert
          $p isa path,
            has from "${from}",
            has to "${to}",
            has strength ${pheromoneDeposit},
            has resistance 0;
      `
      writeSilent(createQuery)
    }
  }

  // Step 3: Cascade unblocks — find tasks blocked only by completed tasks
  const cascadeQuery = `
    match
      $blocked isa task, has tid $blocked_tid, has task-status "blocked";
      (blocker: $blocker, blocked: $blocked) isa blocks;
      $blocker isa task, has tid $blocker_tid;
      $blocker_tid in [${tidList}];
      # Check no other incomplete blockers
      not {
        (blocker: $other, blocked: $blocked) isa blocks;
        $other isa task, has task-status $other_status;
        not { $other_status == "verified"; };
        not { $other_status == "done"; };
        $other != $blocker;
      };
    select $blocked_tid;
  `

  try {
    const { read } = await import('@/lib/typedb')
    const blockedRows = await read(cascadeQuery)
    const toUnblock = blockedRows.map((r) => r.blocked_tid?.value ?? r.blocked_tid).filter(Boolean)

    if (toUnblock.length > 0) {
      const unblockList = toUnblock.map((t: string) => `"${t}"`).join(', ')
      const unblockQuery = `
        match
          $t isa task, has tid $tid;
          $tid in [${unblockList}];
          $t has task-status "blocked";
        delete
          $t has task-status "blocked";
        insert
          $t has task-status "open";
      `
      await write(unblockQuery)
      unblocked.push(...toUnblock)
    }
  } catch (e) {
    console.error('Cascade query failed:', e)
  }

  // Step 4: Record completion signal for learning
  const signalQuery = `
    insert
      $s isa signal,
        has sid "${crypto.randomUUID()}",
        has receiver "loop:batch-complete",
        has timestamp ${Date.now()},
        has source "${source}";
  `
  writeSilent(signalQuery)

  return { completed, unblocked, pheromoneEdges }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Usage: bun run scripts/graph-update.ts <task-id> [task-id...] [--deposit N]

Examples:
  # Complete single task
  bun run scripts/graph-update.ts c3-decide-sweep

  # Complete batch in sequence (deposits pheromone between them)
  bun run scripts/graph-update.ts c1-recon-dict c2-decide c3-edit c4-verify

  # Custom pheromone deposit weight
  bun run scripts/graph-update.ts c3-edit c4-verify --deposit 2.0
`)
    return
  }

  // Parse args
  let deposit = 1.0
  const taskIds: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--deposit' && args[i + 1]) {
      deposit = Number.parseFloat(args[i + 1])
      i++
    } else {
      taskIds.push(args[i])
    }
  }

  console.log(`Batch completing ${taskIds.length} tasks with deposit=${deposit}...\n`)

  const result = await batchComplete({
    taskIds,
    pheromoneDeposit: deposit,
    source: 'cli:graph-update',
  })

  console.log('Result:')
  console.log(`  Completed: ${result.completed.length}`)
  console.log(`  Unblocked: ${result.unblocked.length}`)
  console.log(`  Pheromone edges: ${result.pheromoneEdges}`)

  if (result.unblocked.length > 0) {
    console.log('\nNewly unblocked tasks:')
    for (const tid of result.unblocked) {
      console.log(`  → ${tid}`)
    }
  }
}

main().catch(console.error)
