/**
 * UI permission bypass cache.
 *
 * Pre-warms known-safe ui:* receivers so /api/signal can skip TypeDB
 * lifecycle + network gate queries on cache hit. Receivers are added
 * here after a turn completes or during the loop.ts tick.
 */
const _warm = new Set<string>()

/** Mark receivers as pre-cleared (no TypeDB ADL entry, always pass-through). */
export function warmUI(ids: string[]): void {
  for (const id of ids) _warm.add(id)
}

/** Check if a receiver was pre-warmed and can skip permission TypeDB queries. */
export function isWarm(id: string): boolean {
  return _warm.has(id)
}

/** Clear all pre-warmed entries (useful in tests). */
export function clearWarm(): void {
  _warm.clear()
}
