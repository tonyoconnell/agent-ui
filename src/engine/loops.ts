/**
 * LOOPS — All seven from the same primitive
 *
 * L1 SIGNAL     per tick      signal arrives, agent acts, emits
 * L2 TRAIL      per outcome   mark/warn accumulates
 * L3 FADE       every 5 min   all weights decay
 * L4 ECONOMIC   per payment   revenue reinforces paths
 * L5 EVOLUTION  every 10 min  agent rewrites its own prompt
 * L6 KNOWLEDGE  every hour    hypotheses confirmed, highways harden
 * L7 FRONTIER   every hour    system detects what it doesn't know
 *
 * Each loop is composed from: sense → select → act → mark
 */

import { compose, type Loop, loop } from './core'
import {
  type Advisor,
  advisors,
  fadeAction,
  knowAction,
  type StrugglingUnit,
  signals,
  struggling,
  surges,
  unexploredTags,
  unitGaps,
} from './sources'

// Inline type to avoid pulling doc-scan into the Cloudflare bundle
type VerifiedItem = {
  id: string
  name: string
  source: string
  section: string
  tags: string[]
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  done: boolean
  verified: boolean
  line: number
  raw: string
  target?: string
  evidence?: string
}

import { readParsed, writeSilent } from '@/lib/typedb'
// docMark imported dynamically to avoid Cloudflare bundling issues
import type { PersistentWorld } from './persist'
import { byNeed, byPriority, bySuccessRate, first } from './selectors'
import type { Signal } from './world'

export type Complete = (prompt: string) => Promise<string>

// ═══════════════════════════════════════════════════════════════════════════
// L1+L2: SIGNAL + TRAIL (the core feedback loop)
// ═══════════════════════════════════════════════════════════════════════════

let previousTarget: string | null = null
let chainDepth = 0
const CHAIN_CAP = 5
const HIGHWAY_THRESHOLD = 20

/**
 * Signal loop: sense pending signals, select one, execute, mark outcome.
 */
export const signalLoop = (net: PersistentWorld) =>
  loop<Signal>(
    signals(net),
    first(),
    async (sig) => {
      const edge = previousTarget ? `${previousTarget}→${sig.receiver}` : `entry→${sig.receiver}`
      const netStrength = net.sense(edge) - net.danger(edge)

      // Highway: skip LLM, direct route
      if (netStrength >= HIGHWAY_THRESHOLD) {
        chainDepth++
        net.mark(edge, Math.min(chainDepth, CHAIN_CAP))
        previousTarget = sig.receiver.split(':')[0]
        net.drain() // Actually process the signal
        return { result: 'highway' }
      }

      // Normal ask path
      const outcome = await net.ask(sig)

      if (outcome.result !== undefined) {
        chainDepth++
        net.mark(edge, Math.min(chainDepth, CHAIN_CAP))
        previousTarget = sig.receiver.split(':')[0]
      } else if (outcome.timeout) {
        // Neutral - not the agent's fault
      } else if (outcome.dissolved) {
        net.warn(edge, 0.5)
        previousTarget = null
        chainDepth = 0
      } else {
        net.warn(edge, 1)
        previousTarget = null
        chainDepth = 0
      }

      net.drain() // Process from queue
      return outcome
    },
    () => {}, // Mark already happened in act
  )

// ═══════════════════════════════════════════════════════════════════════════
// L3: FADE (asymmetric decay)
// ═══════════════════════════════════════════════════════════════════════════

const FADE_RATE = 0.05

/**
 * Fade loop: decay all paths. Resistance fades 2x faster.
 */
export const fadeLoop = (net: PersistentWorld) =>
  loop<{ action: 'fade' }>(
    fadeAction(),
    first(),
    () => {
      net.fade(FADE_RATE)
      return { result: true }
    },
    () => {},
  )

// ═══════════════════════════════════════════════════════════════════════════
// L5: EVOLUTION (agent self-improvement)
// ═══════════════════════════════════════════════════════════════════════════

const _EVOLUTION_THRESHOLD = 0.5
const REVENUE_SKIP_THRESHOLD = 1.0
const REVENUE_MIN_SUCCESS = 0.3

/**
 * Consult loop: ask high-performing agents for advice.
 * This is a sub-loop spawned by evolveLoop.
 */
export const consultLoop = (net: PersistentWorld, seeker: StrugglingUnit): Loop<Advisor> => ({
  sense: advisors(seeker.tags),
  select: bySuccessRate(),
  act: async (advisor) => {
    // Route consultation THROUGH THE WORLD
    const result = await net.ask(
      {
        receiver: `${advisor.id}:advise`,
        data: {
          from: seeker.id,
          prompt: seeker.prompt,
          successRate: seeker.successRate,
          skills: seeker.skills,
        },
      },
      seeker.id,
      10000,
    )

    return result
  },
  mark: (advisor, outcome) => {
    // Consultation paths get pheromone too
    if (outcome.result) {
      net.mark(`${seeker.id}→${advisor.id}:advise`)
    }
  },
})

/**
 * Evolution loop: find struggling agents, consult advisors, rewrite prompts.
 */
export const evolveLoop = (net: PersistentWorld, complete: Complete) =>
  compose<StrugglingUnit, Advisor>(
    {
      sense: struggling(net),
      select: byNeed(),
      act: async (unit) => {
        // Skip profitable agents (unless critically bad)
        const revenueRows = await readParsed(`
        match $e (source: $f, target: $t) isa path; $t isa unit, has uid "${unit.id}";
        $e has revenue $rev; $rev > 0.0; select $rev;
      `).catch(() => [])
        const totalRevenue = revenueRows.reduce((sum, r) => sum + (r.rev as number), 0)
        if (totalRevenue > REVENUE_SKIP_THRESHOLD && unit.successRate > REVENUE_MIN_SUCCESS) {
          return { result: 'skipped-profitable' }
        }

        // Fetch known patterns for this unit
        const knownPatterns = await net.recall(unit.id).catch(() => [])
        const insights = knownPatterns
          .filter((k) => k.confidence > 0.7)
          .map((k) => k.pattern)
          .join('; ')

        return { result: { unit, insights } }
      },
      mark: () => {}, // Mark happens after merge
    },
    // Spawn consultation loop for advice
    (unit) => consultLoop(net, unit),
    // Merge parent + child outcomes, trigger prompt rewrite
    async (parentOutcome, childOutcomes) => {
      if (!parentOutcome.result || parentOutcome.result === 'skipped-profitable') {
        return parentOutcome
      }

      const { unit, insights } = parentOutcome.result as { unit: StrugglingUnit; insights: string }
      const advice = childOutcomes
        .filter((o) => o.result)
        .map((o) => String(o.result))
        .join('\n')

      // Synthesize: LLM rewrites prompt with failures + patterns + advice
      const skillInfo = unit.skills.join(', ')
      const newPrompt = await complete(
        `Agent "${unit.id}" has ${(unit.successRate * 100).toFixed(0)}% success over ${unit.sampleCount} tasks (gen ${unit.generation}).
Skills: ${skillInfo}
Known patterns: ${insights || 'none'}
Advisor feedback: ${advice || 'none'}

Rewrite its prompt to improve:

${unit.prompt}`,
      ).catch(() => null)

      if (!newPrompt) return { dissolved: true }

      // Save old prompt as hypothesis (for rollback)
      writeSilent(`
      insert $h isa hypothesis, has hid "evolve-${unit.id}-gen${unit.generation}",
        has statement "gen ${unit.generation} prompt for ${unit.id}: ${unit.prompt.slice(0, 200).replace(/"/g, "'")}",
        has hypothesis-status "testing", has observations-count 0, has p-value 1.0;
    `).catch(() => {})

      // Update unit with new prompt
      writeSilent(`
      match $u isa unit, has uid "${unit.id}", has system-prompt $sp, has generation $g;
      delete $sp of $u; delete $g of $u;
      insert $u has system-prompt "${newPrompt.replace(/"/g, '\\"')}", has generation (${unit.generation} + 1),
             has last-evolved ${new Date().toISOString().replace('Z', '')};
    `).catch(() => {})

      return { result: { evolved: unit.id, generation: unit.generation + 1 } }
    },
  )

// ═══════════════════════════════════════════════════════════════════════════
// L6: KNOWLEDGE (hardening)
// ═══════════════════════════════════════════════════════════════════════════

let lastStrengths: Record<string, number> = {}
let priorityEvolve: string[] = []

/**
 * Knowledge loop: harden highways, detect surges, generate hypotheses.
 */
export const knowLoop = (net: PersistentWorld, cycle: number) =>
  loop<{ action: 'know' }>(
    knowAction(),
    first(),
    async () => {
      // L6: Harden strong paths
      const insights = await net.know()

      // L6: Auto-hypothesize from state changes
      let hypoCount = 0

      // Confirmed paths
      for (const i of insights.filter((i) => i.confidence >= 0.8)) {
        writeSilent(`
        insert $h isa hypothesis, has hid "path-${i.pattern.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${i.pattern} is proven (confidence ${i.confidence.toFixed(2)})",
          has hypothesis-status "confirmed", has observations-count ${cycle}, has p-value 0.01;
      `).catch(() => {})
        hypoCount++
      }

      // Degrading paths
      for (const h of net.highways(50).filter((h) => h.strength >= 10 && h.strength < 20)) {
        writeSilent(`
        insert $h isa hypothesis, has hid "fade-${h.path.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${h.path} is degrading (strength ${h.strength.toFixed(1)})",
          has hypothesis-status "testing", has observations-count 0, has p-value 0.5;
      `).catch(() => {})
        hypoCount++
      }

      // Detect surges
      for (const surge of surges(net, lastStrengths, 10)()) {
        writeSilent(`
        insert $h isa hypothesis, has hid "surge-${surge.path.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${surge.path} surged by ${surge.delta.toFixed(1)} (${surge.from.toFixed(1)} → ${surge.to.toFixed(1)})",
          has hypothesis-status "testing", has observations-count 0, has p-value 0.3;
      `).catch(() => {})
        hypoCount++
      }

      // Update strength cache
      lastStrengths = Object.fromEntries(net.highways(100).map((h) => [h.path, h.strength]))

      // LC-1: Knowledge → Evolution coupling
      for (const i of insights.filter((i) => i.confidence >= 0.8)) {
        const units = i.pattern.split('→').map((s) => s.split(':')[0])
        priorityEvolve.push(...units)
      }

      return { result: { hardened: insights.length, hypotheses: hypoCount } }
    },
    () => {},
  )

/**
 * Get and clear priority evolution queue.
 */
export const getPriorityEvolve = () => {
  const result = [...priorityEvolve]
  priorityEvolve = []
  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// L7: FRONTIER (unexplored territories)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Frontier loop: detect unexplored tag clusters and unit gaps.
 */
export const frontierLoop = (net: PersistentWorld, cycle: number) =>
  loop<{ action: 'know' }>(
    knowAction(),
    first(),
    async () => {
      let frontierCount = 0

      // Unexplored tag clusters
      const tagFrontiers = await unexploredTags(net)()
      for (const { tag, unexplored, total } of tagFrontiers) {
        writeSilent(`
        insert $f isa frontier, has fid "tag-${tag}-${cycle}",
          has frontier-type "${tag}",
          has frontier-description "${unexplored.length} of ${total} '${tag}' skills unexplored",
          has expected-value ${(unexplored.length / total).toFixed(2)},
          has frontier-status "unexplored";
      `).catch(() => {})
        frontierCount++
      }

      // Unit gaps
      const gaps = unitGaps(net, 3)()
      for (const { unitA, unitB } of gaps) {
        writeSilent(`
        insert $f isa frontier, has fid "gap-${unitA}-${unitB}-${cycle}",
          has frontier-type "unit-gap",
          has frontier-description "active units ${unitA} and ${unitB} never connected",
          has expected-value 0.5, has frontier-status "unexplored";
      `).catch(() => {})
        frontierCount++
      }

      return { result: { frontiers: frontierCount } }
    },
    () => {},
  )

// ═══════════════════════════════════════════════════════════════════════════
// DOC LOOP (docs as source of truth)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Doc loop: scan docs for specs, verify against code, track gaps.
 */
export const docLoop = (net: PersistentWorld, docsDir = 'docs') => {
  let _loop: ReturnType<typeof loop<VerifiedItem>> | null = null
  return async () => {
    if (!_loop) {
      const { docSpecs } = await import('./doc-scan')
      const { docMark } = await import('./doc-scan')
      _loop = loop<VerifiedItem>(
        docSpecs(docsDir),
        byPriority(),
        async (item) => {
          net.enqueue({
            receiver: 'worker:implement',
            data: {
              id: item.id,
              name: item.name,
              source: item.source,
              priority: item.priority,
              tags: item.tags,
            },
          })
          return { result: null }
        },
        docMark(net.mark.bind(net), net.warn.bind(net)),
      )
    }
    return _loop()
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SENSE → SELECT → ACT → MARK
// ═══════════════════════════════════════════════════════════════════════════
