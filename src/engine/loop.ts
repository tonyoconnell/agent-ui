/**
 * LOOP — The growth tick
 *
 * 8 phases. One function. The substrate does the work.
 *
 * SENSE → SELECT → EXECUTE → OUTCOME → UPDATE → DECAY → EVOLVE → CRYSTALLIZE
 */

import { readParsed, write, writeSilent } from '@/lib/typedb'
import type { ASI } from './asi'
import type { World } from './one'

type Complete = (prompt: string) => Promise<string>
type TaskRow = { id: string; name: string; tp?: number }

export type TickResult = {
  cycle: number
  phases: Record<string, unknown>
  previousTask: string | null
}

type TickState = { previousTask: string | null; cycle: number; lastDecay: number; lastEvolve: number; lastCrystallize: number }

const state: TickState = { previousTask: null, cycle: 0, lastDecay: 0, lastEvolve: 0, lastCrystallize: 0 }

// Weighted random: pick proportional to trail-pheromone (or uniform if no pheromone)
const weightedPick = (tasks: TaskRow[]): TaskRow | null => {
  if (!tasks.length) return null
  const weights = tasks.map(t => Math.max(1, (t.tp as number) || 1))
  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < tasks.length; i++) { r -= weights[i]; if (r <= 0) return tasks[i] }
  return tasks.at(-1)!
}

export const tick = async (world: World, orchestrator: ASI, complete: Complete): Promise<TickResult> => {
  const now = Date.now()
  state.cycle++
  const phases: Record<string, unknown> = {}

  // SENSE — what tasks are available? (include trail-pheromone for weighted selection)
  const [ready, attractive, exploratory] = await Promise.all([
    readParsed(`match $t isa task, has status "todo", has tid $id, has name $name, has priority $p;
      not { $dep(dependent: $t, blocker: $b) isa dependency; $b isa task, has status $bs; not { $bs == "complete"; }; };
      select $id, $name, $p;`).catch(() => []),
    readParsed(`match $t isa task, has attractive true, has tid $id, has name $name;
      $tr (destination-task: $t) isa trail, has trail-pheromone $tp;
      select $id, $name, $tp;`).catch(() => []),
    readParsed(`match $t isa task, has status "todo", has tid $id, has name $name;
      not { $dep(dependent: $t, blocker: $b) isa dependency; $b isa task, has status $bs; not { $bs == "complete"; }; };
      not { $tr (destination-task: $t) isa trail; };
      select $id, $name;`).catch(() => []),
  ])
  phases.sense = { ready: ready.length, attractive: attractive.length, exploratory: exploratory.length }

  // SELECT — weighted by trail-pheromone (attractive), random (exploratory), or uniform (ready)
  const pool = attractive.length ? attractive : exploratory.length ? exploratory : ready
  const task = weightedPick(pool as TaskRow[])
  phases.select = task ? { tid: task.id, name: task.name } : null

  if (task) {
    // Set task to in_progress
    await write(`
      match $t isa task, has tid "${task.id}", has status $s;
      delete $s of $t;
      insert $t has status "in_progress";
    `).catch(() => {})

    // EXECUTE — route through orchestrator
    const { agent, result } = await orchestrator.orchestrate(task.name, { tid: task.id }, state.previousTask || 'loop')
      .catch(() => ({ agent: 'none', result: undefined }))
    const success = result !== undefined
    phases.execute = { agent, success }

    // OUTCOME — complete the task through the task system (updates trail pheromone)
    await fetch(`/api/tasks/${task.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failed: !success }),
    }).catch(() => {})

    // UPDATE — mark path, revenue amplifies weight (L4: money IS pheromone)
    const edge = state.previousTask ? `${state.previousTask}→${task.id}` : null
    if (edge) {
      const price = await readParsed(
        `match $t isa task, has tid "${task.id}", has price $p; select $p;`
      ).then(r => (r[0]?.p as number) || 0).catch(() => 0)

      if (success) {
        world.mark(edge, 5 + price * 10)
        price > 0 && writeSilent(`
          match $e (source: $from, target: $to) isa path, has revenue $r;
                $from has uid "${state.previousTask}"; $to has uid "${task.id}";
          delete $r of $e; insert $e has revenue ($r + ${price});`)
      } else {
        world.warn(edge, 8)
      }
      phases.update = { edge, action: success ? 'reinforce' : 'alarm', revenue: price }
    }
    state.previousTask = success ? task.id : null
  }

  // DECAY — delegate to decay-auto gate (deduplicates with dashboard poll)
  if (now - state.lastDecay > 300_000) {
    await fetch('/api/decay-auto').catch(() => {})
    world.fade(0.05)
    state.lastDecay = now
    phases.decay = true
  }

  // EVOLVE — every 10 minutes: rewrite prompts, informed by knowledge (L6→L5)
  if (now - state.lastEvolve > 600_000) {
    const [struggling, confirmed] = await Promise.all([
      readParsed(`
        match $u isa unit, has uid $id, has system-prompt $sp, has success-rate $sr, has sample-count $sc, has generation $g;
        $sr < 0.50; $sc >= 20;
        select $id, $sp, $sr, $sc, $g;
      `).catch(() => []),
      readParsed(`match $h isa hypothesis, has statement $s, has hypothesis-status "confirmed"; select $s;`).catch(() => []),
    ])

    for (const u of struggling) {
      const relevant = confirmed.filter(h => (h.s as string).includes(u.id as string))
      const context = relevant.length
        ? `\n\nConfirmed findings about this agent:\n${relevant.map(h => `- ${h.s}`).join('\n')}`
        : ''
      const newPrompt = await complete(
        `Agent "${u.id}" has ${((u.sr as number) * 100).toFixed(0)}% success over ${u.sc} tasks (gen ${u.g}).${context}\n\nRewrite to improve:\n${u.sp}`
      ).catch(() => null)
      newPrompt && writeSilent(`
        match $u isa unit, has uid "${u.id}", has system-prompt $sp, has generation $g;
        delete $sp of $u; delete $g of $u;
        insert $u has system-prompt "${newPrompt.replace(/"/g, '\\"')}", has generation (${u.g} + 1);
      `)
    }
    state.lastEvolve = now
    phases.evolve = { evolved: struggling.length }
  }

  // CRYSTALLIZE — every hour: knowledge + hypotheses + frontiers (L6 + L7)
  if (now - state.lastCrystallize > 3_600_000) {
    const insights = world.crystallize()
    world.hypothesize(insights)
    world.explore()
    state.lastCrystallize = now
    phases.crystallize = { insights: insights.length }
  }

  return { cycle: state.cycle, phases, previousTask: state.previousTask }
}
