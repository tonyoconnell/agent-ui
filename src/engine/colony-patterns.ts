/**
 * COLONY SUBSTRATE
 *
 * The 70-line pattern implementing all 6 TypeDB inference lessons.
 *
 * TypeDB declares WHAT (inference rules).
 * Substrate executes HOW (signal flow).
 *
 * Lesson 1 (Perception):    .on('classify') → emit tier
 * Lesson 2 (Homeostasis):   .on('validate') → reject or pass
 * Lesson 3 (Hypothesis):    .on('observe')  → state transition
 * Lesson 4 (Task Alloc):    ready tasks via negation (no blockers)
 * Lesson 5 (Contribution):  .on('contribute') → aggregate
 * Lesson 6 (Emergence):     .on('spawn-objective') → autonomous goals
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (same as substrate.ts)
// ═══════════════════════════════════════════════════════════════════════════

type Envelope = { receiver: string; payload?: unknown }
type Emit = (e: Envelope) => void
type Ctx = { from: string; self: string }
type Task = (payload: unknown, emit: Emit, ctx: Ctx) => Promise<unknown>
type Template = (result: unknown) => Envelope

interface Unit {
  (e: Envelope, from?: string): void
  on: (name: string, fn: (p: unknown, emit: Emit, ctx: Ctx) => unknown) => Unit
  then: (name: string, template: Template) => Unit
  id: string
  state: Record<string, unknown>
}

interface Colony {
  spawn: (id: string) => Unit
  send: (e: Envelope, from?: string) => void
  mark: (edge: string, strength?: number) => void
  smell: (edge: string) => number
  fade: (rate?: number) => void
  highways: (limit?: number) => { path: string; strength: number }[]
  get: (id: string) => Unit | undefined
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSTRATE (70 lines, adapted for TypeDB patterns)
// ═══════════════════════════════════════════════════════════════════════════

const unit = (id: string, route: (e: Envelope, from: string) => void): Unit => {
  const tasks: Record<string, Task> = {}
  const next: Record<string, Template> = {}
  const state: Record<string, unknown> = {}

  const u: Unit = ({ receiver, payload }, from = 'entry') => {
    const taskName = receiver.includes(':') ? receiver.split(':')[1] : 'default'
    const task = tasks[taskName] || tasks.default
    const emit: Emit = e => route(e, receiver)
    task?.(payload, emit, { from, self: receiver }).then(result =>
      next[taskName] && route(next[taskName](result), receiver)
    )
  }

  u.on = (n, f) => (tasks[n] = (p, e, c) => Promise.resolve(f(p, e, c)), u)
  u.then = (n, t) => (next[n] = t, u)
  u.id = id
  u.state = state
  return u
}

const colony = (): Colony => {
  const units: Record<string, Unit> = {}
  const scent: Record<string, number> = {}

  const mark = (edge: string, strength = 1) => { scent[edge] = (scent[edge] || 0) + strength }
  const smell = (edge: string) => scent[edge] || 0
  const fade = (r = 0.1) => Object.keys(scent).forEach(e => {
    scent[e] *= (1 - r)
    scent[e] < 0.01 && delete scent[e]
  })
  const highways = (limit = 10) =>
    Object.entries(scent).sort(([, a], [, b]) => b - a).slice(0, limit)
      .map(([path, strength]) => ({ path, strength }))

  const send = ({ receiver, payload }: Envelope, from = 'entry') => {
    const unitId = receiver.includes(':') ? receiver.split(':')[0] : receiver
    const target = units[unitId]
    target && (mark(`${from}→${receiver}`), target({ receiver, payload }, from))
  }

  const spawn = (id: string) => {
    const u = unit(id, (e, from) => send(e, from))
    units[id] = u
    return u
  }

  return { spawn, send, mark, smell, fade, highways, get: id => units[id] }
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 1: PERCEPTION (Classification)
// ═══════════════════════════════════════════════════════════════════════════
// TypeDB: fun elite_agents() -> { agent }
// Substrate: agent:classify → emits tier

const setupPerception = (c: Colony) => {
  c.spawn('classifier')
    .on('classify', ({ successRate, activityScore, sampleCount }: any, emit) => {
      // Elite: sr >= 0.75, as >= 70, sc >= 50
      if (successRate >= 0.75 && activityScore >= 70 && sampleCount >= 50) {
        return { tier: 'elite' }
      }
      // At-risk: sr < 0.40, as >= 25, sc >= 30
      if (successRate < 0.40 && activityScore >= 25 && sampleCount >= 30) {
        return { tier: 'at-risk' }
      }
      return { tier: 'standard' }
    })
    .then('classify', ({ tier }) => ({
      receiver: 'registry:update-tier',
      payload: { tier }
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 2: HOMEOSTASIS (Quality Bands + Rejection)
// ═══════════════════════════════════════════════════════════════════════════
// TypeDB: rule high-quality-record, rule prevent_zombie_agents
// Substrate: validator:check → pass or reject (silence)

const setupHomeostasis = (c: Colony) => {
  c.spawn('validator')
    .on('check-quality', ({ applied, effectiveness }: any, emit) => {
      if (!applied) return null // Silence - not applicable

      // Mutually exclusive bands
      if (effectiveness >= 0.7) return { quality: 'high' }
      if (effectiveness >= 0.4) return { quality: 'medium' }
      return { quality: 'low' }
    })
    .on('check-zombie', ({ energyLevel, reliabilityScore }: any) => {
      // Zombie prevention: energy=0 but reliability>0.5 is invalid
      if (energyLevel === 0 && reliabilityScore > 0.5) {
        return null // REJECT by silence - signal dissolves
      }
      return { valid: true }
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 3: HYPOTHESIS (State Machine)
// ═══════════════════════════════════════════════════════════════════════════
// TypeDB: rule promote-to-testing, rule confirm-hypothesis
// Substrate: hypothesis:observe → state transitions

const setupHypothesis = (c: Colony) => {
  c.spawn('hypothesis')
    .on('observe', ({ id, outcome }: any, emit, ctx) => {
      const h = ctx.self // hypothesis state would be stored
      // State machine: pending → testing → confirmed/rejected
      // Transitions based on accumulated observations
      emit({ receiver: 'hypothesis:evaluate', payload: { id, outcome } })
    })
    .on('evaluate', ({ id, pValue, observationCount, status }: any) => {
      // pending → testing (obs >= 10)
      if (status === 'pending' && observationCount >= 10) {
        return { status: 'testing' }
      }
      // testing → confirmed (p <= 0.05, obs >= 100)
      if (status === 'testing' && pValue <= 0.05 && observationCount >= 100) {
        return { status: 'confirmed', actionReady: true }
      }
      // testing → rejected (p > 0.20, obs >= 100)
      if (status === 'testing' && pValue > 0.20 && observationCount >= 100) {
        return { status: 'rejected' }
      }
      return { status }
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 4: TASK ALLOCATION (Negation + Pheromone)
// ═══════════════════════════════════════════════════════════════════════════
// TypeDB: fun ready_tasks(), fun attractive_tasks()
// Substrate: task:query-ready, pheromone via mark/smell

const setupTaskAllocation = (c: Colony) => {
  const tasks: Record<string, { status: string; blockers: string[] }> = {}
  const trailPheromone: Record<string, number> = {}
  const alarmPheromone: Record<string, number> = {}

  c.spawn('taskManager')
    .on('register', ({ id, blockers = [] }: any) => {
      tasks[id] = { status: 'todo', blockers }
    })
    .on('query-ready', (_: any, emit) => {
      // NEGATION pattern: ready = todo AND no incomplete blockers
      const ready = Object.entries(tasks)
        .filter(([_, t]) => t.status === 'todo')
        .filter(([_, t]) => t.blockers.every(b => tasks[b]?.status === 'complete'))
        .map(([id]) => id)
      return { ready }
    })
    .on('query-attractive', (_: any, emit) => {
      // Attractive: ready + trail pheromone >= 50
      const ready = Object.entries(tasks)
        .filter(([_, t]) => t.status === 'todo')
        .filter(([_, t]) => t.blockers.every(b => tasks[b]?.status === 'complete'))
        .filter(([id]) => (trailPheromone[id] || 0) >= 50)
        .map(([id]) => id)
      return { attractive: ready }
    })
    .on('query-repelled', () => {
      // Repelled: alarm >= 30 AND alarm > trail
      const repelled = Object.keys(tasks)
        .filter(id => (alarmPheromone[id] || 0) >= 30)
        .filter(id => (alarmPheromone[id] || 0) > (trailPheromone[id] || 0))
      return { repelled }
    })
    .on('reinforce', ({ from, to }: any) => {
      // Success: deposit trail pheromone
      const edge = `${from}→${to}`
      trailPheromone[to] = Math.min(100, (trailPheromone[to] || 0) + 5)
      c.mark(edge, 5)
    })
    .on('alarm', ({ from, to }: any) => {
      // Failure: deposit alarm pheromone
      alarmPheromone[to] = Math.min(100, (alarmPheromone[to] || 0) + 8)
    })
    .on('decay', () => {
      // Asymmetric decay: trail 5%, alarm 20%
      Object.keys(trailPheromone).forEach(k => {
        trailPheromone[k] *= 0.95
        if (trailPheromone[k] < 0.1) delete trailPheromone[k]
      })
      Object.keys(alarmPheromone).forEach(k => {
        alarmPheromone[k] *= 0.80
        if (alarmPheromone[k] < 0.1) delete alarmPheromone[k]
      })
      c.fade(0.05)
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 5: CONTRIBUTION (Aggregation)
// ═══════════════════════════════════════════════════════════════════════════
// TypeDB: fun total_contribution($name) -> double
// Substrate: contributions aggregated per agent

const setupContribution = (c: Colony) => {
  const contributions: Record<string, number[]> = {}

  c.spawn('ledger')
    .on('record', ({ agent, impact }: any) => {
      contributions[agent] = contributions[agent] || []
      contributions[agent].push(impact)
    })
    .on('total', ({ agent }: any) => {
      const scores = contributions[agent] || []
      return { agent, total: scores.reduce((a, b) => a + b, 0) }
    })
    .on('synergy', ({ agentA, agentB }: any) => {
      // Best synergy: combined contribution of pair
      const totalA = (contributions[agentA] || []).reduce((a, b) => a + b, 0)
      const totalB = (contributions[agentB] || []).reduce((a, b) => a + b, 0)
      return { agentA, agentB, combined: totalA + totalB }
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON 6: EMERGENCE (Autonomous Goals)
// ═══════════════════════════════════════════════════════════════════════════
// TypeDB: fun promising_frontiers(), rule spawn-exploration-objective
// Substrate: frontier detection → objective spawning

const setupEmergence = (c: Colony) => {
  const frontiers: Record<string, { expectedValue: number; status: string }> = {}
  const objectives: Record<string, { progress: number; status: string }> = {}
  let objectiveCounter = 0

  c.spawn('emergence')
    .on('detect-frontier', ({ id, potential, probability, cost }: any) => {
      const expectedValue = (potential * probability) / cost
      frontiers[id] = { expectedValue, status: 'unexplored' }

      // Autonomous objective spawning: EV >= 0.5 triggers exploration
      if (expectedValue >= 0.5) {
        const objId = `obj-${++objectiveCounter}`
        objectives[objId] = { progress: 0, status: 'pending' }
        return { spawned: objId, frontier: id }
      }
      return { frontier: id, promising: false }
    })
    .on('query-promising', () => {
      const promising = Object.entries(frontiers)
        .filter(([_, f]) => f.status === 'unexplored' && f.expectedValue >= 0.5)
        .map(([id, f]) => ({ id, expectedValue: f.expectedValue }))
      return { promising }
    })
    .on('query-active-objectives', () => {
      const active = Object.entries(objectives)
        .filter(([_, o]) => o.status === 'pending' || o.status === 'active')
        .map(([id, o]) => ({ id, ...o }))
      return { active }
    })
    .on('update-progress', ({ id, progress }: any) => {
      if (objectives[id]) {
        objectives[id].progress = progress
        if (progress >= 1.0) objectives[id].status = 'complete'
      }
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP: Create a fully-functional colony
// ═══════════════════════════════════════════════════════════════════════════

export const createColony = () => {
  const c = colony()

  setupPerception(c)
  setupHomeostasis(c)
  setupHypothesis(c)
  setupTaskAllocation(c)
  setupContribution(c)
  setupEmergence(c)

  return c
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ═══════════════════════════════════════════════════════════════════════════
/*
const c = createColony()

// Classify an agent (L1)
c.send({ receiver: 'classifier:classify', payload: { successRate: 0.85, activityScore: 80, sampleCount: 100 } })

// Register tasks with dependencies (L4)
c.send({ receiver: 'taskManager:register', payload: { id: 'task-1', blockers: [] } })
c.send({ receiver: 'taskManager:register', payload: { id: 'task-2', blockers: ['task-1'] } })

// Query ready tasks (L4 - negation pattern)
c.send({ receiver: 'taskManager:query-ready', payload: {} })

// Record contribution (L5)
c.send({ receiver: 'ledger:record', payload: { agent: 'alpha', impact: 8.5 } })

// Detect frontier (L6 - emergence)
c.send({ receiver: 'emergence:detect-frontier', payload: { id: 'f-1', potential: 0.8, probability: 0.7, cost: 1.0 } })

// Decay pheromones
c.send({ receiver: 'taskManager:decay', payload: {} })

// Get highways (strongest signal paths)
console.log(c.highways(5))
*/
