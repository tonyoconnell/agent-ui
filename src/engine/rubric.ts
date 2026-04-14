/**
 * RUBRIC — markDims: emit 4 weighted tagged edges per cycle result
 *
 * Four dimensions: fit (0.35) · form (0.20) · truth (0.30) · taste (0.15)
 * Each dimension becomes a separate tagged edge: edge:fit, edge:form, …
 *
 * Threshold:
 *   score >= 0.5 → mark(edge:dim,  score  × weight)   — path strengthens
 *   score <  0.5 → warn(edge:dim, (1-score) × weight)  — path resists
 *
 * See docs/rubrics.md for full gate semantics (w4Verify lives in rubric-score.ts).
 */

import type { PersistentWorld } from './persist'

export const DEFAULT_WEIGHTS = {
  fit: 0.35,
  form: 0.2,
  truth: 0.3,
  taste: 0.15,
} as const

export type DimScores = {
  fit: number
  form: number
  truth: number
  taste: number
}

export type DimWeights = {
  fit: { weight: number }
  form: { weight: number }
  truth: { weight: number }
  taste: { weight: number }
}

type Net = Pick<PersistentWorld, 'mark' | 'warn'>

/**
 * Emit 4 tagged-edge pheromone deposits for a rubric result.
 *
 * For each dimension:
 *   score >= 0.5  → net.mark(`${edge}:${dim}`, score  × weight)
 *   score <  0.5  → net.warn(`${edge}:${dim}`, (1-score) × weight)
 *
 * @param net       - any world with mark/warn (World, PersistentWorld, or mock)
 * @param edge      - base edge label, e.g. 'entry→wave-runner'
 * @param scores    - raw dimension scores in [0, 1]
 * @param dimensions - optional per-dimension weight overrides
 */
export function markDims(net: Net, edge: string, scores: DimScores, dimensions?: DimWeights): void {
  const weights = dimensions
    ? {
        fit: dimensions.fit.weight,
        form: dimensions.form.weight,
        truth: dimensions.truth.weight,
        taste: dimensions.taste.weight,
      }
    : DEFAULT_WEIGHTS

  const dims = ['fit', 'form', 'truth', 'taste'] as const
  for (const dim of dims) {
    const taggedEdge = `${edge}:${dim}`
    const score = scores[dim]
    const weight = weights[dim]
    if (score >= 0.5) {
      net.mark(taggedEdge, score * weight)
    } else {
      net.warn(taggedEdge, (1 - score) * weight)
    }
  }
}
