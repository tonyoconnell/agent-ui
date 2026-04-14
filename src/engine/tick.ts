/**
 * TICK — The master orchestrator
 *
 * One function runs all seven loops at their appropriate intervals.
 * Loops compose naturally: evolve spawns consult, know spawns frontier.
 *
 * Intervals:
 *   signal   — every tick (continuous)
 *   fade     — every 5 minutes
 *   evolve   — every 10 minutes
 *   know     — every hour
 *   frontier — every hour
 *   docs     — every hour
 */

import { loop } from './core'
import { type Complete, evolveLoop, fadeLoop, frontierLoop, knowLoop, signalLoop } from './loops'

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

// docMark imported inline below to avoid Cloudflare bundling issues
import type { PersistentWorld } from './persist'
import { byPriority } from './selectors'

// ══════════════════════════════════════════════════���════════════════════════
// INTERVALS
// ═══════════════════════════════════════════════════════════════════════════

const INTERVALS = {
  fade: 300_000, // 5 minutes
  evolve: 600_000, // 10 minutes
  know: 3_600_000, // 1 hour
  frontier: 3_600_000, // 1 hour
  docs: 3_600_000, // 1 hour
} as const

type LoopName = keyof typeof INTERVALS

// ═══════════════════════════════════════════════════════════════════════════
// TICK RESULT
// ═══════════════════════════════════════════════════════════════════════════

export type TickResult = {
  cycle: number
  signal: { selected: string | null; success: boolean | null; skipped?: boolean }
  fade?: boolean
  evolved?: number
  hardened?: number
  hypotheses?: number
  frontiers?: number
  docs?: { verified: number; gaps: number }
  highways: { path: string; strength: number }[]
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

let cycle = 0
const lastRun: Record<LoopName, number> = {
  fade: 0,
  evolve: 0,
  know: 0,
  frontier: 0,
  docs: 0,
}

// ════════════════════════════════════════════���══════════════════════════════
// DOC LOOP
// ══════════════════════════════════════════════════════════════════���════════

const createDocLoop = (net: PersistentWorld, docsDir: string) => {
  let _loop: ReturnType<typeof loop<VerifiedItem>> | null = null
  return async () => {
    if (!_loop) {
      const { docSpecs } = await import('./doc-scan')
      const { docMark } = await import('./doc-scan')
      _loop = loop<VerifiedItem>(
        docSpecs(docsDir),
        byPriority(),
        async () => ({ result: null }),
        docMark(net.mark.bind(net), net.warn.bind(net)),
      )
    }
    return _loop()
  }
}

// ════════════════════════════════════════════════��══════════════════════════
// THE TICK
// ═══════════════════════════════════════════════════════════════════════════

export const tick = async (net: PersistentWorld, complete?: Complete, docsDir = 'docs'): Promise<TickResult> => {
  const now = Date.now()
  cycle++

  const result: TickResult = {
    cycle,
    signal: { selected: null, success: null },
    highways: [],
  }

  // ── L1+L2: SIGNAL (every tick) ──────────────────────────────────────────

  const sigResult = await signalLoop(net)()
  if (sigResult.item) {
    result.signal = {
      selected: sigResult.item.receiver,
      success: sigResult.outcome?.result !== undefined ? true : sigResult.outcome?.timeout ? null : false,
      skipped: sigResult.outcome?.result === 'highway',
    }
  }

  // ── L3: FADE (every 5 min) ──────────────────────────────────────────────

  if (shouldRun('fade', now)) {
    await fadeLoop(net)()
    lastRun.fade = now
    result.fade = true
  }

  // ── L5: EVOLVE (every 10 min) ─────────────────────────────���─────────────

  if (complete && shouldRun('evolve', now)) {
    const evolveResult = await evolveLoop(net, complete)()
    lastRun.evolve = now
    if (evolveResult.outcome?.result) {
      const r = evolveResult.outcome.result as { evolved?: string }
      result.evolved = r.evolved ? 1 : 0
    }
  }

  // ── L6: KNOW (every hour) ───────────────────────────────────────────────

  if (shouldRun('know', now)) {
    const knowResult = await knowLoop(net, cycle)()
    lastRun.know = now
    if (knowResult.outcome?.result) {
      const r = knowResult.outcome.result as { hardened?: number; hypotheses?: number }
      result.hardened = r.hardened
      result.hypotheses = r.hypotheses
    }
  }

  // ── L7: FRONTIER (every hour, after know) ───────────────────────────────

  if (shouldRun('frontier', now)) {
    const frontierResult = await frontierLoop(net, cycle)()
    lastRun.frontier = now
    if (frontierResult.outcome?.result) {
      const r = frontierResult.outcome.result as { frontiers?: number }
      result.frontiers = r.frontiers
    }
  }

  // ── DOC LOOP (every hour) ───────────────────────────────────────────────

  if (shouldRun('docs', now)) {
    const docLoop = createDocLoop(net, docsDir)
    // Run multiple iterations to scan all gaps
    let verified = 0,
      gaps = 0
    for (let i = 0; i < 50; i++) {
      const docResult = await docLoop()
      if (!docResult.item) break
      if (docResult.outcome?.result) verified++
      else gaps++
    }
    lastRun.docs = now
    result.docs = { verified, gaps }
  }

  // ── HIGHWAYS ────────────────────────────────────────────────────────────

  result.highways = net.highways(10)

  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════��════════════════════

const shouldRun = (name: LoopName, now: number): boolean => now - lastRun[name] >= INTERVALS[name]

/**
 * Reset tick state (for testing)
 */
export const resetTick = () => {
  cycle = 0
  for (const key of Object.keys(lastRun) as LoopName[]) {
    lastRun[key] = 0
  }
}

/**
 * Get current cycle number
 */
export const getCycle = () => cycle

/**
 * Force a specific loop to run on next tick
 */
export const forceLoop = (name: LoopName) => {
  lastRun[name] = 0
}

// ═══════════════════════════════════════════════════════════════════════════
// SENSE → SELECT → ACT → MARK
// ═══════════════════════════════════════════════════════════════════════════
