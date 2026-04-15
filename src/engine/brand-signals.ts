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
import { purpleBrand } from '@/engine/brand'

// ── bot filter ───────────────────────────────────────────────────────────────

const BOT_UA = /bot|crawl|spider|preview|monitor|fetch|headless|phantom/i

// ── djb2 hash ───────────────────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
    h = h >>> 0 // keep unsigned 32-bit
  }
  return h
}

// ── registry deep-equal ──────────────────────────────────────────────────────

function deepEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// Lazy accessor — brand.ts imports brand-signals.ts (for emitBrandApplied),
// so at module-eval time purpleBrand may still be undefined under some loaders
// (vitest's module graph differs from bun's). Reading it at call-time sidesteps
// the circular-init hazard.
const knownBrands = (): Array<[string, BrandTokens]> => [['purple', purpleBrand]]

// ── brandKey ────────────────────────────────────────────────────────────────

/**
 * Stable short identifier for a brand.
 *
 * - string  → lower-cased, spaces→hyphens  e.g. "Purple Haze" → "purple-haze"
 * - object  → matched against registry first; if found returns label ("purple").
 *             If no match, djb2 hash over JSON.stringify → "custom-<6 hex chars>"
 */
export function brandKey(brand: BrandTokens | string): string {
  if (typeof brand === 'string') {
    return brand.trim().toLowerCase().replace(/\s+/g, '-')
  }
  for (const [label, tokens] of knownBrands()) {
    if (deepEquals(brand, tokens)) return label
  }
  const hash = djb2(JSON.stringify(brand))
  return `custom-${hash.toString(16).slice(0, 6).padStart(6, '0')}`
}

// ── emitBrandApplied ────────────────────────────────────────────────────────

/**
 * Fire-and-forget pheromone mark on brand→thing or brand→group edge.
 *
 * No-ops when neither thingId nor groupId is supplied.
 * No-ops when ctx.ua is an empty string or matches a known bot pattern.
 * When ctx.ua is undefined the caller opted out of UA filtering — proceed normally.
 * Swallows all errors — this is telemetry only.
 */
export function emitBrandApplied(
  brand: BrandTokens | string,
  ctx?: { thingId?: string; groupId?: string; ua?: string },
): void {
  if (!ctx?.thingId && !ctx?.groupId) return

  // Bot filter — zero-cost fast path when ua is undefined (not provided)
  if (ctx.ua !== undefined && (ctx.ua === '' || BOT_UA.test(ctx.ua))) return

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
