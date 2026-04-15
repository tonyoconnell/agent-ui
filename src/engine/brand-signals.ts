/**
 * brand-signals — pheromone telemetry for brand renders
 *
 * Every call to emitBrandApplied() deposits a mark on the
 * brand→thing or brand→group edge so /api/brand/highways
 * can surface popular brand↔thing pairings over time.
 *
 * World instance is obtained via a lazy dynamic import of
 * @/lib/net (getNet) to avoid triggering TypeDB initialisation
 * at module-load time — brand-signals may be imported in SSR
 * contexts before the worker is ready.
 */

import type { BrandTokens } from '@/engine/brand'

// ── djb2 hash ───────────────────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
    h = h >>> 0 // keep unsigned 32-bit
  }
  return h
}

// ── brandKey ────────────────────────────────────────────────────────────────

/**
 * Stable short identifier for a brand.
 *
 * - string  → lower-cased, spaces→hyphens  e.g. "Purple Haze" → "purple-haze"
 * - object  → djb2 hash over JSON.stringify → "custom-<6 hex chars>"
 */
export function brandKey(brand: BrandTokens | string): string {
  if (typeof brand === 'string') {
    return brand.trim().toLowerCase().replace(/\s+/g, '-')
  }
  const hash = djb2(JSON.stringify(brand))
  return `custom-${hash.toString(16).slice(0, 6).padStart(6, '0')}`
}

// ── emitBrandApplied ────────────────────────────────────────────────────────

/**
 * Fire-and-forget pheromone mark on brand→thing or brand→group edge.
 *
 * No-ops when neither thingId nor groupId is supplied.
 * Swallows all errors — this is telemetry only.
 */
export function emitBrandApplied(brand: BrandTokens | string, ctx?: { thingId?: string; groupId?: string }): void {
  if (!ctx?.thingId && !ctx?.groupId) return

  const target = ctx.thingId ? `thing:${ctx.thingId}` : `group:${ctx.groupId}`
  const source = `brand:${brandKey(brand)}`
  const edge = `${source}→${target}`

  // Dynamic import keeps TypeDB init out of the module-load critical path.
  import('@/lib/net')
    .then(({ getNet }) => getNet())
    .then((net) => {
      try {
        net.mark(edge, 1)
      } catch {
        // telemetry — never throw
      }
    })
    .catch(() => {
      // telemetry — never throw
    })
}
