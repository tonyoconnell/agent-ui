/**
 * WORK LOOP — the developer loop as signals on the substrate
 *
 * Each stage is a path. Stage transitions leave pheromone.
 * The loop itself becomes a learned highway.
 *
 * See docs/work-loop.md for the 26 stages and their PRE gates.
 *
 * Usage:
 *   const wl = workLoop(net, 'session-123')
 *   wl.stage('sync')
 *   wl.stage('recall')         // edge: loop:sync → loop:recall is marked
 *   ...
 *   wl.close({ result: 'done' }, { rubric: 0.82 })  // chain gets bonus
 */

import type { World } from './world'

export type Stage =
  | 'sync'
  | 'recall'
  | 'dictionary'
  | 'schema'
  | 'types'
  | 'dsl'
  | 'patterns'
  | 'skills'
  | 'frame'
  | 'plan'
  | 'relevant-files'
  | 'story'
  | 'design'
  | 'rubric'
  | 'prune'
  | 'code'
  | 'test'
  | 'optimise'
  | 'document'
  | 'commit'
  | 'ship'
  | 'observe'
  | 'mark'
  | 'report'
  | 'know'
  | 'frontier'

export type StageOutcome = {
  result?: unknown
  timeout?: boolean
  dissolved?: boolean
  failure?: boolean
}

export type CloseOpts = {
  rubric?: number // 0..1, scales chain bonus
  reason?: string
}

export interface WorkLoop {
  session: string
  stages: Stage[]
  stage: (name: Stage, data?: unknown) => void
  close: (outcome: StageOutcome, opts?: CloseOpts) => void
  highways: (limit?: number) => Array<{ path: string; strength: number; resistance: number }>
}

const STAGE_RECEIVER = (s: Stage) => `loop:${s}`

export const workLoop = (net: World, session: string): WorkLoop => {
  const stages: Stage[] = []

  // Ensure a loop unit exists with no-op handlers for every stage.
  // Handlers are no-ops because we only care about the path, not the work.
  // The actual work runs in the developer's tools; this is instrumentation.
  if (!net.units.loop) {
    const u = net.add('loop')
    // Single catch-all: register lazy .on for each stage so signal lands and pheromone marks.
    // World's signal() auto-marks the edge from→receiver on delivery.
    const noop = () => undefined
    for (const s of [
      'sync',
      'recall',
      'dictionary',
      'schema',
      'types',
      'dsl',
      'patterns',
      'skills',
      'frame',
      'plan',
      'relevant-files',
      'story',
      'design',
      'rubric',
      'prune',
      'code',
      'test',
      'optimise',
      'document',
      'commit',
      'ship',
      'observe',
      'mark',
      'report',
      'know',
      'frontier',
    ] as Stage[]) {
      u.on(s, noop)
    }
  }

  const stage = (name: Stage, data?: unknown) => {
    const prev = stages[stages.length - 1]
    const from = prev ? STAGE_RECEIVER(prev) : `session:${session}`
    net.signal({ receiver: STAGE_RECEIVER(name), data }, from)
    stages.push(name)
  }

  // Propagate outcome backward: each stage edge in this session's chain
  // gets mark/warn proportional to chain depth and rubric score.
  // Mirrors loop.ts chain bonus: longer successful chains reinforce more.
  const close = (outcome: StageOutcome, opts: CloseOpts = {}) => {
    if (stages.length < 2) return
    const rubric = typeof opts.rubric === 'number' ? Math.max(0, Math.min(1, opts.rubric)) : 0.5
    const bonus = 1 + rubric * 5 // taste reinforces more

    const edges: string[] = []
    let from = `session:${session}`
    for (const s of stages) {
      edges.push(`${from}→${STAGE_RECEIVER(s)}`)
      from = STAGE_RECEIVER(s)
    }

    if (outcome.result !== undefined) {
      edges.forEach((e, i) => {
        // Depth-weighted: later stages in a successful chain get more credit.
        const depth = Math.min(i + 1, 5)
        net.mark(e, bonus + depth * 0.2)
      })
    } else if (outcome.dissolved) {
      // Mild warn — path didn't exist, not the loop's fault
      edges.forEach((e) => net.warn(e, 0.5))
    } else if (outcome.timeout) {
      // Neutral — no mark, no warn
    } else if (outcome.failure) {
      // Full warn on the last stage that ran (the one that produced nothing)
      const last = edges[edges.length - 1]
      if (last) net.warn(last, 1)
    }
  }

  const highways = (limit = 10) =>
    Object.entries(net.strength)
      .filter(([p]) => p.includes('loop:'))
      .map(([path, strength]) => ({ path, strength, resistance: net.resistance[path] ?? 0 }))
      .sort((a, b) => b.strength - b.resistance - (a.strength - a.resistance))
      .slice(0, limit)

  return { session, stages, stage, close, highways }
}
