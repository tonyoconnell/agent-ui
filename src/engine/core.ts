/**
 * CORE — The One Loop
 *
 * Everything reduces to: sense → select → act → mark
 *
 * All seven loops are this pattern with different sources,
 * selectors, actions, and feedback mechanisms.
 */

import type { Signal } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Outcome = {
  result?: unknown
  timeout?: boolean
  dissolved?: boolean
}

export type Source<T> = () => T[] | Promise<T[]>
export type Selector<T> = (items: T[]) => T | null
export type Actor<T> = (item: T) => Outcome | Promise<Outcome>
export type Marker<T> = (item: T, outcome: Outcome) => void

export type Loop<T> = {
  sense: Source<T>
  select: Selector<T>
  act: Actor<T>
  mark: Marker<T>
}

export type LoopResult<T> = {
  item: T | null
  outcome: Outcome | null
}

// ═══════════════════════════════════════════════════════════════════════════
// THE ONE LOOP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a loop from its four components.
 * Returns an async function that runs one iteration.
 */
export const loop = <T>(
  sense: Source<T>,
  select: Selector<T>,
  act: Actor<T>,
  mark: Marker<T>
): (() => Promise<LoopResult<T>>) => {
  return async () => {
    // Sense: observe state
    const items = await sense()
    if (!items.length) return { item: null, outcome: null }

    // Select: pick one
    const item = select(items)
    if (!item) return { item: null, outcome: null }

    // Act: do work
    const outcome = await act(item)

    // Mark: record feedback
    mark(item, outcome)

    return { item, outcome }
  }
}

/**
 * Create a composed loop that spawns sub-loops.
 * Parent outcome depends on child outcomes.
 */
export const compose = <T, U>(
  parent: Loop<T>,
  spawn: (item: T) => Loop<U> | null,
  merge: (parentOutcome: Outcome, childOutcomes: Outcome[]) => Outcome | Promise<Outcome>
): (() => Promise<LoopResult<T>>) => {
  return async () => {
    const items = await parent.sense()
    if (!items.length) return { item: null, outcome: null }

    const item = parent.select(items)
    if (!item) return { item: null, outcome: null }

    // Run parent action
    const parentOutcome = await parent.act(item)

    // Spawn child loop if applicable
    const childLoop = spawn(item)
    const childOutcomes: Outcome[] = []

    if (childLoop) {
      const childRunner = loop(
        childLoop.sense,
        childLoop.select,
        childLoop.act,
        childLoop.mark
      )
      // Run child until exhausted (up to 10 iterations)
      for (let i = 0; i < 10; i++) {
        const { outcome } = await childRunner()
        if (!outcome) break
        childOutcomes.push(outcome)
      }
    }

    // Merge outcomes (may be async)
    const finalOutcome = await merge(parentOutcome, childOutcomes)

    // Mark with merged outcome
    parent.mark(item, finalOutcome)

    return { item, outcome: finalOutcome }
  }
}

/**
 * Run a loop on an interval. Returns stop function.
 */
export const schedule = <T>(
  runner: () => Promise<LoopResult<T>>,
  interval: number,
  onResult?: (result: LoopResult<T>) => void
): (() => void) => {
  let timer: ReturnType<typeof setInterval> | null = null

  const tick = async () => {
    const result = await runner()
    onResult?.(result)
  }

  timer = setInterval(tick, interval)
  tick() // Run immediately

  return () => {
    if (timer) clearInterval(timer)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SENSE → SELECT → ACT → MARK
// ═══════════════════════════════════════════════════════════════════════════
