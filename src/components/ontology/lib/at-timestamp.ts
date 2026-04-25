import type React from 'react'

export interface TimeWindow {
  /** ms since epoch — null means "now" */
  at: number | null
}

export function isNow(window: TimeWindow): boolean {
  return window.at === null
}

export function describe(window: TimeWindow): string {
  if (window.at === null) return 'now'
  const diff = Date.now() - window.at
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (day > 0) return `${day}d ago`
  if (hr > 0) return `${hr}h ago`
  if (min > 0) return `${min}m ago`
  return 'just now'
}

/** Build a TypeDB filter clause for valid-from/valid-to bi-temporal query. */
export function validityClause(varName: string, window: TimeWindow): string {
  if (window.at === null) return ''
  const iso = new Date(window.at).toISOString()
  return `${varName} has valid-from <= ${iso}; { ${varName} has valid-to >= ${iso}; } or { not { ${varName} has valid-to $vt; }; };`
}

/** Compute set diff between two arrays of objects with .id field. */
export function diffById<T extends { id: string }>(
  prev: T[],
  next: T[],
): {
  added: T[]
  removed: T[]
  unchanged: T[]
} {
  const prevIds = new Set(prev.map((x) => x.id))
  const nextIds = new Set(next.map((x) => x.id))
  return {
    added: next.filter((x) => !prevIds.has(x.id)),
    removed: prev.filter((x) => !nextIds.has(x.id)),
    unchanged: next.filter((x) => prevIds.has(x.id)),
  }
}

/**
 * Apply diff style to a ReactFlow node so added pulses green, removed pulses red.
 *
 * NOTE: The `animation: 'pulse 1.4s infinite'` references the Tailwind default
 * `@keyframes pulse` keyframe by name. If the inline style animation name does
 * not resolve (because Tailwind only injects keyframes when the `animate-pulse`
 * class is used somewhere in the tree), add `animate-pulse` as a className on
 * the node element instead and omit the animation property from this style object.
 */
export function diffStyle(state: 'added' | 'removed' | 'unchanged'): React.CSSProperties {
  if (state === 'added')
    return {
      boxShadow: '0 0 0 3px rgba(16,185,129,0.6)',
      animation: 'pulse 1.4s infinite',
    }
  if (state === 'removed') return { boxShadow: '0 0 0 3px rgba(239,68,68,0.6)', opacity: 0.5 }
  return {}
}
