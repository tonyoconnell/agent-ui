/**
 * Format a millisecond measurement so it's always informative — never "0ms".
 * Sub-microsecond values truncate to `<1μs`; the ladder never collapses to zero.
 */
export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 0.001) return '<1μs'
  if (ms < 1) {
    const us = ms * 1000
    return us < 10 ? `${us.toFixed(2)}μs` : `${us.toFixed(1)}μs`
  }
  if (ms < 10) return `${ms.toFixed(2)}ms`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Pick a badge tone for a timing — cheaper ops get greener tones.
 * Returns Tailwind class suffixes for bg/text/border tones.
 */
export function msTone(ms: number): 'instant' | 'fast' | 'slow' {
  if (ms < 1) return 'instant'
  if (ms < 50) return 'fast'
  return 'slow'
}
