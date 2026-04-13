/**
 * RUBRIC SCORING — W4 quality gate for the deterministic sandwich
 *
 * Four dimensions: fit (0.35) + form (0.20) + truth (0.30) + taste (0.15)
 * Each dimension is a tagged edge in the pheromone graph.
 *
 * Golden zone: all dims ≥ 0.65 → composite score ≥ 0.85 → mark() with full strength
 * Borderline: any dim < 0.5 → warn() — do not mark done on partial work
 * Must-nots: violations → immediate warn(1), bypass scoring
 */

export interface RubricScore {
  fit: number // Does it answer the ask? (0-1)
  form: number // Is the shape/format right? (0-1)
  truth: number // Are facts, types, spec correct? (0-1)
  taste: number // Does it match agent voice/style? (0-1)
  violations: string[] // Hard gates: must-nots triggered
  composite: number // weighted sum: 0.35·fit + 0.20·form + 0.30·truth + 0.15·taste
}

export const RUBRIC_WEIGHTS = {
  fit: 0.35,
  form: 0.2,
  truth: 0.3,
  taste: 0.15,
}

/** Compute composite score from dimension scores */
export function compositeScore(dims: Omit<RubricScore, 'violations' | 'composite'>): number {
  return (
    RUBRIC_WEIGHTS.fit * dims.fit +
    RUBRIC_WEIGHTS.form * dims.form +
    RUBRIC_WEIGHTS.truth * dims.truth +
    RUBRIC_WEIGHTS.taste * dims.taste
  )
}

/** Score interpretation for pheromone marking */
export function scoreInterpretation(score: number): 'golden' | 'good' | 'borderline' | 'failed' {
  if (score >= 0.85) return 'golden'
  if (score >= 0.65) return 'good'
  if (score >= 0.5) return 'borderline'
  return 'failed'
}

/** Manual scoring function for tests (no LLM) */
export function scoreWork(
  task: {
    name: string
    description: string
  },
  result: {
    fit?: number // Does it answer the task?
    form?: number // Code quality, structure, tests
    truth?: number // Correctness, spec compliance
    taste?: number // Code style, consistency
    violations?: string[] // Must-nots: hard gates
  },
): RubricScore {
  const fit = result.fit ?? 0.5
  const form = result.form ?? 0.5
  const truth = result.truth ?? 0.5
  const taste = result.taste ?? 0.5
  const violations = result.violations ?? []

  const composite = compositeScore({ fit, form, truth, taste })

  return {
    fit,
    form,
    truth,
    taste,
    violations,
    composite,
  }
}

/** W4 gate: verify work against rubric before marking done */
export function w4Verify(score: RubricScore): {
  pass: boolean
  reason: string
  strength?: number // if pass, return strength for mark()
} {
  // Hard gates: must-nots block immediately
  if (score.violations.length > 0) {
    return {
      pass: false,
      reason: `VIOLATIONS: ${score.violations.join(', ')} — mark() not called, warn() applied instead`,
    }
  }

  // Any dimension below 0.5 = fail
  if (score.fit < 0.5 || score.form < 0.5 || score.truth < 0.5 || score.taste < 0.5) {
    const weak = [
      score.fit < 0.5 && 'fit',
      score.form < 0.5 && 'form',
      score.truth < 0.5 && 'truth',
      score.taste < 0.5 && 'taste',
    ].filter(Boolean)
    return {
      pass: false,
      reason: `WEAK DIMENSIONS: ${weak.join(', ')} < 0.5 — do not mark done`,
    }
  }

  // Composite score ≥ 0.85 = golden zone
  if (score.composite >= 0.85) {
    return {
      pass: true,
      reason: `GOLDEN: composite ${score.composite.toFixed(2)} ≥ 0.85 — all dims strong`,
      strength: score.composite,
    }
  }

  // 0.65-0.84 = good, mark but not full strength
  if (score.composite >= 0.65) {
    return {
      pass: true,
      reason: `GOOD: composite ${score.composite.toFixed(2)} ≥ 0.65 — most dims hit`,
      strength: score.composite,
    }
  }

  // 0.5-0.64 = borderline, do not mark
  return {
    pass: false,
    reason: `BORDERLINE: composite ${score.composite.toFixed(2)} < 0.65 — needs more work`,
  }
}

/** Format rubric result for reporting */
export function formatRubric(score: RubricScore, verify: ReturnType<typeof w4Verify>): string {
  const dims = [
    `fit:${score.fit.toFixed(2)}`,
    `form:${score.form.toFixed(2)}`,
    `truth:${score.truth.toFixed(2)}`,
    `taste:${score.taste.toFixed(2)}`,
  ].join(' ')

  const status = verify.pass ? '✓' : '✗'
  const composite = `${score.composite.toFixed(2)}`

  return `
[${status}] RUBRIC: [${dims}] = ${composite}
    ${verify.reason}
    ${verify.strength ? `→ mark(edge, ${verify.strength.toFixed(2)})` : '→ warn(edge, 1.0) — path not reinforced'}
`
}
