/**
 * SOURCES — What to sense
 *
 * Each source returns a list of items for a loop to select from.
 * Sources can be sync or async. They observe state without mutating it.
 */

import { readParsed } from '@/lib/typedb'
import type { World, Signal } from './world'
import type { PersistentWorld } from './persist'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type StrugglingUnit = {
  id: string
  prompt: string
  successRate: number
  sampleCount: number
  generation: number
  skills: string[]
  tags: string[]
}

export type Advisor = {
  id: string
  successRate: number
  skills: string[]
}

export type DocSpec = {
  source: string
  line: number
  type: 'todo' | 'should' | 'must' | 'implements' | 'gap'
  target?: string
  description: string
  priority?: string
}

export type Highway = {
  path: string
  strength: number
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGNAL SOURCES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pending signals from the queue.
 */
export const signals = (net: World) => (): Signal[] => {
  if (net.pending() === 0) return []
  // Peek at queue without draining
  return [...net.queue]
}

/**
 * Single "fade" action - returns one item when it's time to fade.
 */
export const fadeAction = () => (): { action: 'fade' }[] => [{ action: 'fade' }]

/**
 * Single "know" action - returns one item when it's time to crystallize.
 */
export const knowAction = () => (): { action: 'know' }[] => [{ action: 'know' }]

// ═══════════════════════════════════════════════════════════════════════════
// EVOLUTION SOURCES
// ═══════════════════════════════════════════════════════════════════════════

const EVOLUTION_THRESHOLD = 0.50
const EVOLUTION_MIN_SAMPLES = 20
const EVOLUTION_COOLDOWN_MS = 86_400_000  // 24 hours

/**
 * Units that are struggling and need evolution.
 */
export const struggling = (net: PersistentWorld) => async (): Promise<StrugglingUnit[]> => {
  const now = Date.now()
  const rows = await readParsed(`
    match $u isa unit, has uid $id, has system-prompt $sp, has success-rate $sr,
          has sample-count $sc, has generation $g;
    $sr < ${EVOLUTION_THRESHOLD}; $sc >= ${EVOLUTION_MIN_SAMPLES};
    not { $u has last-evolved $le; $le > ${new Date(now - EVOLUTION_COOLDOWN_MS).toISOString().replace('Z', '')}; };
    (provider: $u, offered: $sk) isa capability;
    $sk has skill-id $sid, has tag $tag;
    select $id, $sp, $sr, $sc, $g, $sid, $tag;
  `).catch(() => [])

  // Group by unit ID (query returns multiple rows per skill×tag)
  const byUnit: Record<string, StrugglingUnit> = {}
  for (const r of rows) {
    const id = r.id as string
    if (!byUnit[id]) {
      byUnit[id] = {
        id,
        prompt: r.sp as string,
        successRate: r.sr as number,
        sampleCount: r.sc as number,
        generation: r.g as number,
        skills: [],
        tags: [],
      }
    }
    const unit = byUnit[id]
    const skill = r.sid as string
    const tag = r.tag as string
    if (!unit.skills.includes(skill)) unit.skills.push(skill)
    if (!unit.tags.includes(tag)) unit.tags.push(tag)
  }

  return Object.values(byUnit)
}

/**
 * High-performing units that can advise on specific skills.
 */
export const advisors = (skillTags: string[]) => async (): Promise<Advisor[]> => {
  if (!skillTags.length) return []

  const tagFilter = skillTags.map(t => `"${t}"`).join(', ')
  const rows = await readParsed(`
    match $u isa unit, has uid $uid, has success-rate $sr;
    $sr > 0.7;
    (provider: $u, offered: $sk) isa capability;
    $sk has tag $tag; $tag in [${tagFilter}];
    select $uid, $sr; sort $sr desc; limit 5;
  `).catch(() => [])

  const seen = new Set<string>()
  const result: Advisor[] = []
  for (const r of rows) {
    const id = r.uid as string
    if (seen.has(id)) continue
    seen.add(id)
    result.push({
      id,
      successRate: r.sr as number,
      skills: [], // Could query separately if needed
    })
  }
  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE SOURCES
// ═══════════════════════════════════════════════════════════════════════════

const HIGHWAY_THRESHOLD = 20

/**
 * Highways strong enough to crystallize into knowledge.
 */
export const highways = (net: World, threshold = HIGHWAY_THRESHOLD) => (): Highway[] => {
  return net.highways(100).filter(h => h.strength >= threshold)
}

/**
 * Paths that are surging (rapid strength increase).
 */
export const surges = (
  net: World,
  lastStrengths: Record<string, number>,
  threshold = 10
) => (): { path: string; delta: number; from: number; to: number }[] => {
  const result: { path: string; delta: number; from: number; to: number }[] = []
  for (const h of net.highways(50)) {
    const prev = lastStrengths[h.path] || 0
    const delta = h.strength - prev
    if (delta > threshold) {
      result.push({ path: h.path, delta, from: prev, to: h.strength })
    }
  }
  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// FRONTIER SOURCES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unexplored tag clusters.
 */
export const unexploredTags = (net: World) => async (): Promise<{
  tag: string
  unexplored: string[]
  total: number
}[]> => {
  const rows = await readParsed(`
    match $sk isa skill, has tag $tag, has skill-id $sid; select $tag, $sid;
  `).catch(() => [])

  const byTag: Record<string, string[]> = {}
  for (const r of rows) {
    const tag = r.tag as string
    const sid = r.sid as string
    ;(byTag[tag] ||= []).push(sid)
  }

  const explored = new Set(Object.keys(net.strength).flatMap(e => e.split('→')))
  const result: { tag: string; unexplored: string[]; total: number }[] = []

  for (const [tag, skills] of Object.entries(byTag)) {
    const unexplored = skills.filter(s => !explored.has(s))
    // Only flag if >70% unexplored and at least 3 skills
    if (unexplored.length > skills.length * 0.7 && unexplored.length >= 3) {
      result.push({ tag, unexplored, total: skills.length })
    }
  }

  return result
}

/**
 * Active units that have never been connected.
 */
export const unitGaps = (net: World, minActivity = 3) => (): {
  unitA: string
  unitB: string
}[] => {
  const units = net.list()
  const explored = new Set(Object.keys(net.strength).flatMap(e => e.split('→')))
  const result: { unitA: string; unitB: string }[] = []

  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const a = units[i], b = units[j]
      // Both must be "explored" (appear in some edge)
      if (!explored.has(a) || !explored.has(b)) continue

      // Check if they're connected in either direction
      const fwd = `${a}→${b}`
      const rev = `${b}→${a}`
      if (net.sense(fwd) > 0 || net.sense(rev) > 0) continue

      // Check activity level
      const actA = Object.keys(net.strength).filter(e => e.includes(a)).length
      const actB = Object.keys(net.strength).filter(e => e.includes(b)).length
      if (actA >= minActivity && actB >= minActivity) {
        result.push({ unitA: a, unitB: b })
      }
    }
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// DOC SOURCES (re-exported from doc-scan)
// ═══════════════════════════════════════════════════════════════════════════

// docSpecs and types — import directly from './doc-scan' (uses Node.js APIs)

// ═══════════════════════════════════════════════════════════════════════════
// SENSE
// ═══════════════════════════════════════════════════════════════════════════
