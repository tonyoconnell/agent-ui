/**
 * STATS — Statistical hypothesis testing
 *
 * Binomial proportion z-test for comparing success rates before/after
 * pattern detection. Used in loop.ts to compute earned p-values from D1 marks.
 */

/**
 * Compute p-value via binomial proportion z-test
 *
 * Compares success rate before pattern detection vs after.
 * Returns p-value between 0 and 1, or 0.5 if insufficient samples.
 *
 * @param successBefore count of successes before pattern detected
 * @param totalBefore total attempts before pattern detected
 * @param successAfter count of successes after pattern detected
 * @param totalAfter total attempts after pattern detected
 * @returns p-value [0, 1]
 */
export const computeZTestPValue = (
  successBefore: number,
  totalBefore: number,
  successAfter: number,
  totalAfter: number,
): number => {
  // Minimum sample sizes required for valid z-test
  const MIN_SAMPLES = 10
  if (totalBefore < MIN_SAMPLES || totalAfter < MIN_SAMPLES) {
    return 0.5 // Uncertain — not enough data
  }

  // Avoid division by zero
  if (totalBefore === 0 || totalAfter === 0) {
    return 0.5
  }

  // Calculate rates
  const p1 = successBefore / totalBefore
  const p2 = successAfter / totalAfter

  // Pooled proportion
  const pooled = (successBefore + successAfter) / (totalBefore + totalAfter)

  // Standard error
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / totalBefore + 1 / totalAfter))

  // Avoid division by zero
  if (se === 0) {
    return 0.5
  }

  // Z-score (testing if p2 > p1)
  const z = (p2 - p1) / se

  // Convert z-score to two-tailed p-value
  // Approximation: 1 - erf(z / sqrt(2)) for one-tailed
  // Two-tailed: multiply by 2
  const pValue = 2 * (1 - normalCDF(Math.abs(z)))

  // Clamp to [0, 1] to handle floating point errors
  return Math.max(0, Math.min(1, pValue))
}

/**
 * Standard normal cumulative distribution function (approximation)
 * Used to convert z-score to p-value
 *
 * Approximation accurate to ~0.0001 for |z| < 6
 * Hart, J.F. et al. Computer Approximations (1968)
 */
const normalCDF = (z: number): number => {
  // Handle extreme values
  if (z < -6) return 0
  if (z > 6) return 1

  // Abramowitz and Stegun approximation
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = z >= 0 ? 1 : -1
  const absZ = Math.abs(z)

  const t = 1 / (1 + p * absZ)
  const t2 = t * t
  const t3 = t2 * t
  const t4 = t3 * t
  const t5 = t4 * t

  const y = 1 - (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) * Math.exp(-absZ * absZ)

  return 0.5 * (1 + sign * y)
}

/**
 * Quick confidence assessment from sample size and effect magnitude
 *
 * Used to determine when a hypothesis is "proven" vs "promising"
 * Returns confidence [0, 1] based on sample size and consistency
 */
export const computeConfidence = (pValue: number, samples: number): number => {
  if (samples < 10) return 0 // Insufficient data
  if (pValue > 0.05) return Math.max(0.1, 1 - pValue) // p > 0.05 = not significant
  if (pValue > 0.01) return 0.9 // p ≤ 0.05 = significant
  if (pValue > 0.001) return 0.95 // p ≤ 0.01 = highly significant
  return 0.99 // p ≤ 0.001 = very highly significant
}
