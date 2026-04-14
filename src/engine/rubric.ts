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

/**
 * Parse dimension scores from W4 verdict text.
 * Looks for "fit:N form:N truth:N taste:N" pattern (0–1 floats).
 * Falls back to heuristics: PASS → balanced pass, FAIL → reduced scores.
 */
export function score(verdict: string): DimScores & { violations: string[] } {
  const match = verdict.match(/fit[:\s]+([\d.]+).*?form[:\s]+([\d.]+).*?truth[:\s]+([\d.]+).*?taste[:\s]+([\d.]+)/is)
  if (match) {
    return {
      fit: Math.min(1, parseFloat(match[1])),
      form: Math.min(1, parseFloat(match[2])),
      truth: Math.min(1, parseFloat(match[3])),
      taste: Math.min(1, parseFloat(match[4])),
      violations: [],
    }
  }
  const pass = verdict.trim().toUpperCase().startsWith('PASS')
  // PASS: exit condition met → fit is confident; form/truth/taste moderately high (unknown without scores)
  // FAIL: exit condition failed → fit is very low; form/truth/taste are UNKNOWN (neutral 0.50)
  //       Rationale: a failed implementation can still be diagnosed accurately (truth stays neutral)
  //       and L5 evolution should not conclude "low truth = agent lies" when it just means task failed.
  return {
    fit: pass ? 0.85 : 0.15,
    form: pass ? 0.75 : 0.5,
    truth: pass ? 0.8 : 0.5,
    taste: pass ? 0.75 : 0.5,
    violations: pass ? [] : [verdict.slice(0, 120).trim()],
  }
}
