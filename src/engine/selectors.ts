/**
 * SELECTORS — How to choose
 *
 * Each selector takes a list of items and picks one.
 * Different selectors implement different strategies.
 */

import type { World } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Selector<T> = (items: T[]) => T | null

type WithPath = { path?: string }
type WithPriority = { priority?: string }
type WithSuccessRate = { successRate?: number }

// ═══════════════════════════════════════════════════════════════════════════
// BASIC SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Always pick the first item.
 */
export const first =
  <T>(): Selector<T> =>
  (items) =>
    items[0] || null

/**
 * Pick a random item.
 */
export const random =
  <T>(): Selector<T> =>
  (items) =>
    items.length ? items[Math.floor(Math.random() * items.length)] : null

// ═══════════════════════════════════════════════════════════════════════════
// PHEROMONE-BASED SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sort by pheromone strength, pick the strongest.
 * Requires items to have a `path` field.
 */
export const byPheromone =
  <T extends WithPath>(net: World): Selector<T> =>
  (items) => {
    if (!items.length) return null
    return items.sort((a, b) => {
      const sa = a.path ? net.sense(a.path) - net.danger(a.path) : 0
      const sb = b.path ? net.sense(b.path) - net.danger(b.path) : 0
      return sb - sa
    })[0]
  }

/**
 * Weighted random selection by pheromone, with exploration bias.
 * Like `select()` in world.ts but for arbitrary items.
 */
export const weighted =
  <T extends WithPath>(net: World, explore = 0.3): Selector<T> =>
  (items) => {
    if (!items.length) return null
    if (Math.random() < explore) return items[Math.floor(Math.random() * items.length)]

    const weights = items.map((item) => {
      if (!item.path) return 1
      const s = net.sense(item.path)
      const r = net.danger(item.path)
      return Math.max(0.1, s - r)
    })

    const total = weights.reduce((sum, w) => sum + w, 0)
    let r = Math.random() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY-BASED SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

const priorityValue = (p: string | undefined): number => {
  if (!p) return 9
  const match = p.match(/P(\d)/)
  return match ? parseInt(match[1], 10) : 9
}

/**
 * Sort by priority (P0 > P1 > P2 > P3), pick highest.
 * Requires items to have a `priority` field.
 */
export const byPriority =
  <T extends WithPriority>(): Selector<T> =>
  (items) => {
    if (!items.length) return null
    return items.sort((a, b) => priorityValue(a.priority) - priorityValue(b.priority))[0]
  }

/**
 * Priority-weighted random selection.
 * P0 items are 8x more likely than P3.
 */
export const priorityWeighted =
  <T extends WithPriority>(explore = 0.2): Selector<T> =>
  (items) => {
    if (!items.length) return null
    if (Math.random() < explore) return items[Math.floor(Math.random() * items.length)]

    const weights = items.map((item) => {
      const p = priorityValue(item.priority)
      return 2 ** (3 - p) // P0=8, P1=4, P2=2, P3=1
    })

    const total = weights.reduce((sum, w) => sum + w, 0)
    let r = Math.random() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS-BASED SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sort by success rate descending, pick the best performer.
 * For selecting advisors.
 */
export const bySuccessRate =
  <T extends WithSuccessRate>(): Selector<T> =>
  (items) => {
    if (!items.length) return null
    return items.sort((a, b) => (b.successRate || 0) - (a.successRate || 0))[0]
  }

/**
 * Sort by success rate ascending, pick the worst performer.
 * For selecting who needs help.
 */
export const byNeed =
  <T extends WithSuccessRate>(): Selector<T> =>
  (items) => {
    if (!items.length) return null
    return items.sort((a, b) => (a.successRate || 0) - (b.successRate || 0))[0]
  }

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chain selectors: try first, fall back to second if first returns null.
 */
export const fallback =
  <T>(primary: Selector<T>, secondary: Selector<T>): Selector<T> =>
  (items) =>
    primary(items) || secondary(items)

/**
 * Filter items first, then select from filtered set.
 */
export const filtered =
  <T>(filter: (item: T) => boolean, selector: Selector<T>): Selector<T> =>
  (items) =>
    selector(items.filter(filter))

/**
 * Round-robin selector with memory.
 * Returns a selector that cycles through items.
 */
export const roundRobin = <T>(): { selector: Selector<T>; reset: () => void } => {
  let index = 0
  return {
    selector: (items) => {
      if (!items.length) return null
      const item = items[index % items.length]
      index++
      return item
    },
    reset: () => {
      index = 0
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════════════════════
