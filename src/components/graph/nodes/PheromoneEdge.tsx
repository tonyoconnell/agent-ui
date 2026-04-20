/**
 * pheromoneEdgeStyle — unified edge styling for pheromone-aware graphs.
 *
 * Extracted from PheromoneGraph.tsx. Consumed by:
 *   - /world → PheromoneGraph (existing)
 *   - /chairman → OrgChart (C2)
 *
 * Formula:
 *   strokeWidth = log(strength + 1) × 2, clamped [1, 10]
 *   toxic    = resistance >= 10 && resistance > strength × 2
 *   highway  = !toxic && strength >= 20
 *   Colors   = toxic (red) | highway (gold) | normal (slate)
 */

const C = {
  toxic: '#ef4444',
  highway: '#f59e0b',
  normal: '#334155',
  pending: '#6b7280',
}

export interface EdgeStyleOpts {
  /** Force specific stroke color (overrides toxic/highway/normal) */
  stroke?: string
  /** Dashed stroke — for pending/speculative edges */
  dashed?: boolean
  /** Animate — usually paired with pending */
  animated?: boolean
}

export interface EdgeStyle {
  stroke: string
  strokeWidth: number
  strokeOpacity: number
  strokeDasharray?: string
}

export function pheromoneEdgeStyle(strength: number, resistance: number, opts: EdgeStyleOpts = {}): EdgeStyle {
  const s = Math.max(0, strength)
  const r = Math.max(0, resistance)

  const toxic = r >= 10 && r > s * 2
  const highway = !toxic && s >= 20

  const strokeWidth = s > 0 ? Math.max(1, Math.min(10, Math.log(s + 1) * 2)) : 1
  const stroke = opts.stroke ?? (toxic ? C.toxic : highway ? C.highway : C.normal)
  const strokeOpacity = toxic ? 0.9 : highway ? 0.95 : 0.6

  const style: EdgeStyle = {
    stroke,
    strokeWidth,
    strokeOpacity,
  }
  if (opts.dashed || toxic) {
    style.strokeDasharray = opts.dashed ? '4 4' : '6 3'
  }
  return style
}

export const PHEROMONE_COLORS = C
