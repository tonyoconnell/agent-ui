/**
 * POST /api/tasks/import-roadmap — Import TODO.md into TypeDB (T-6)
 *
 * Self-hosts the roadmap: every phase = swarm, every task = task entity,
 * dependencies = dependency relations. Once loaded, /grow reads from TypeDB.
 */
import type { APIRoute } from 'astro'
import { write, writeSilent } from '@/lib/typedb'

interface RoadmapTask {
  tid: string
  name: string
  phase: string
  status: string
  priority: string
  taskType: string
  blockedBy: string[]
}

const ROADMAP: RoadmapTask[] = [
  // Phase 0: Tighten
  { tid: 'X-1', name: 'One schema', phase: 'tighten', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: [] },
  { tid: 'X-2', name: 'Kill entity service', phase: 'tighten', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['X-1'] },
  { tid: 'X-3', name: 'Converge vocabulary', phase: 'tighten', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['X-1'] },
  { tid: 'X-4', name: 'Mark lessons as reference', phase: 'tighten', status: 'complete', priority: 'P1', taskType: 'build', blockedBy: ['X-1'] },
  { tid: 'X-5', name: 'Revenue on trails', phase: 'tighten', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['X-2'] },
  { tid: 'X-6', name: 'Rename to world', phase: 'tighten', status: 'complete', priority: 'P1', taskType: 'build', blockedBy: ['X-1'] },
  // Phase 1: Wire
  { tid: 'W-1', name: 'TypeDB Cloud instance', phase: 'wire', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: [] },
  { tid: 'W-2', name: 'Cloudflare Worker proxy', phase: 'wire', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['W-1'] },
  { tid: 'W-3', name: 'TypeDB client lib', phase: 'wire', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['W-2'] },
  { tid: 'W-4', name: 'Persist layer', phase: 'wire', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['W-3'] },
  // Phase 2: Tasks
  { tid: 'T-1', name: 'Task API routes', phase: 'tasks', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['W-4'] },
  { tid: 'T-2', name: 'Task board UI', phase: 'tasks', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['T-1'] },
  { tid: 'T-3', name: 'Dependencies + negation', phase: 'tasks', status: 'complete', priority: 'P1', taskType: 'build', blockedBy: ['T-1'] },
  { tid: 'T-4', name: 'Pheromone reinforcement', phase: 'tasks', status: 'complete', priority: 'P1', taskType: 'build', blockedBy: ['T-1'] },
  { tid: 'T-5', name: 'Exploratory tasks panel', phase: 'tasks', status: 'complete', priority: 'P2', taskType: 'build', blockedBy: ['T-2'] },
  { tid: 'T-6', name: 'Self-host roadmap', phase: 'tasks', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['T-3', 'T-4'] },
  { tid: 'T-7', name: '/grow skill', phase: 'tasks', status: 'complete', priority: 'P0', taskType: 'build', blockedBy: ['T-6'] },
  // Phase 3: Onboard
  { tid: 'O-1', name: 'Seed world', phase: 'onboard', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['T-6'] },
  { tid: 'O-2', name: 'Signup flow', phase: 'onboard', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['O-1'] },
  { tid: 'O-3', name: 'Agent builder', phase: 'onboard', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['O-2'] },
  { tid: 'O-4', name: 'Discovery', phase: 'onboard', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['O-1'] },
  { tid: 'O-5', name: 'Profiles', phase: 'onboard', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['O-2'] },
  { tid: 'O-6', name: 'Eight personas', phase: 'onboard', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['O-2'] },
  { tid: 'O-7', name: 'Connect flow', phase: 'onboard', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['O-3', 'O-4'] },
  // Phase 4: Commerce
  { tid: 'C-1', name: 'x402 payment layer', phase: 'commerce', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['O-3'] },
  { tid: 'C-2', name: 'Service marketplace', phase: 'commerce', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['C-1'] },
  { tid: 'C-3', name: 'Revenue tracking', phase: 'commerce', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['C-1'] },
  { tid: 'C-4', name: 'Agent-to-agent payments', phase: 'commerce', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['C-1'] },
  { tid: 'C-5', name: 'Highway pricing', phase: 'commerce', status: 'todo', priority: 'P2', taskType: 'build', blockedBy: ['C-2'] },
  { tid: 'C-6', name: 'Agentverse bridge', phase: 'commerce', status: 'todo', priority: 'P2', taskType: 'build', blockedBy: ['C-3'] },
  // Phase 5: Intelligence
  { tid: 'I-1', name: 'LLM as unit', phase: 'intelligence', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['C-4'] },
  { tid: 'I-2', name: 'Agent castes', phase: 'intelligence', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['I-1'] },
  { tid: 'I-3', name: 'Hypothesis engine', phase: 'intelligence', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['C-3'] },
  { tid: 'I-4', name: 'Frontier detection', phase: 'intelligence', status: 'todo', priority: 'P2', taskType: 'build', blockedBy: ['I-3'] },
  { tid: 'I-5', name: 'Dream state', phase: 'intelligence', status: 'todo', priority: 'P2', taskType: 'build', blockedBy: ['I-2', 'I-4'] },
  // Phase 6: Scale
  { tid: 'S-1', name: 'Cloudflare Pages deploy', phase: 'scale', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['I-1'] },
  { tid: 'S-2', name: 'Sui integration', phase: 'scale', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['S-1'] },
  { tid: 'S-3', name: 'Security hardening', phase: 'scale', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['S-2'] },
  { tid: 'S-4', name: 'Monitoring + alerts', phase: 'scale', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['S-1'] },
  { tid: 'S-5', name: 'ASI ecosystem', phase: 'scale', status: 'todo', priority: 'P1', taskType: 'build', blockedBy: ['S-3'] },
  { tid: 'S-6', name: 'Self-sustaining economy', phase: 'scale', status: 'todo', priority: 'P0', taskType: 'build', blockedBy: ['S-5'] },
]

const PHASES = [
  { id: 'tighten', name: 'Tighten', purpose: 'Converge schema and vocabulary' },
  { id: 'wire', name: 'Wire', purpose: 'Connect TypeDB + Cloudflare' },
  { id: 'tasks', name: 'Tasks', purpose: 'Build task system on substrate' },
  { id: 'onboard', name: 'Onboard', purpose: 'People and agents sign up' },
  { id: 'commerce', name: 'Commerce', purpose: 'x402 payments flow' },
  { id: 'intelligence', name: 'Intelligence', purpose: 'Substrate gets smarter' },
  { id: 'scale', name: 'Scale', purpose: 'Ship to production' },
]

export const POST: APIRoute = async () => {
  const results: string[] = []

  // 1. Create swarms for each phase
  for (const phase of PHASES) {
    await writeSilent(`
      insert $s isa swarm,
        has sid "phase-${phase.id}",
        has name "${phase.name}",
        has purpose "${phase.purpose}",
        has swarm-type "colony",
        has status "active";
    `)
    results.push(`swarm: phase-${phase.id}`)
  }

  // 2. Create all tasks
  for (const task of ROADMAP) {
    await writeSilent(`
      insert $t isa task,
        has tid "${task.tid}",
        has name "${task.name}",
        has task-type "${task.taskType}",
        has status "${task.status}",
        has priority "${task.priority}",
        has phase "${task.phase}",
        has importance 5,
        has price 0.0,
        has currency "SUI";
    `)
    results.push(`task: ${task.tid}`)
  }

  // 3. Create dependency relations
  for (const task of ROADMAP) {
    for (const blockerId of task.blockedBy) {
      await writeSilent(`
        match
          $dep isa task, has tid "${task.tid}";
          $blocker isa task, has tid "${blockerId}";
        insert
          (dependent: $dep, blocker: $blocker) isa dependency;
      `)
    }
  }

  // 4. Create trails between sequential tasks (within phases)
  const phaseGroups: Record<string, RoadmapTask[]> = {}
  for (const task of ROADMAP) {
    if (!phaseGroups[task.phase]) phaseGroups[task.phase] = []
    phaseGroups[task.phase].push(task)
  }

  for (const tasks of Object.values(phaseGroups)) {
    for (let i = 0; i < tasks.length - 1; i++) {
      const pheromone = tasks[i].status === 'complete' ? 70 : 0
      await writeSilent(`
        match
          $from isa task, has tid "${tasks[i].tid}";
          $to isa task, has tid "${tasks[i + 1].tid}";
        insert
          (source-task: $from, destination-task: $to) isa trail,
            has trail-pheromone ${pheromone}.0,
            has alarm-pheromone 0.0,
            has completions ${tasks[i].status === 'complete' ? 1 : 0},
            has failures 0,
            has revenue 0.0;
      `)
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    imported: results.length,
    phases: PHASES.length,
    tasks: ROADMAP.length,
    dependencies: ROADMAP.reduce((s, t) => s + t.blockedBy.length, 0),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
