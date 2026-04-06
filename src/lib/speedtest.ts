/**
 * Speedtest runner
 * Measures nervous system (ms) and brain (s) latencies
 */

export interface BenchmarkResult {
  name: string
  runs: number
  min_ms: number
  p50_ms: number
  p95_ms: number
  p99_ms: number
  max_ms: number
  mean_ms: number
  stddev_ms: number
}

export interface SpeedtestResult {
  timestamp: string
  environment: string
  results: Record<string, BenchmarkResult>
}

/**
 * Collect percentiles from sorted times array
 */
export function percentiles(times: number[]): {
  min: number
  p50: number
  p95: number
  p99: number
  max: number
  mean: number
  stddev: number
} {
  if (times.length === 0) return { min: 0, p50: 0, p95: 0, p99: 0, max: 0, mean: 0, stddev: 0 }

  const sorted = [...times].sort((a, b) => a - b)
  const sum = times.reduce((a, b) => a + b, 0)
  const mean = sum / times.length
  const variance = times.reduce((a, x) => a + Math.pow(x - mean, 2), 0) / times.length
  const stddev = Math.sqrt(variance)

  return {
    min: sorted[0],
    p50: sorted[Math.floor(times.length * 0.50)],
    p95: sorted[Math.floor(times.length * 0.95)],
    p99: sorted[Math.floor(times.length * 0.99)],
    max: sorted[sorted.length - 1],
    mean,
    stddev,
  }
}

/**
 * Benchmark a function multiple times and collect latencies
 */
export async function benchmark(
  name: string,
  fn: () => Promise<void> | void,
  runs: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = []

  for (let i = 0; i < runs; i++) {
    const t0 = performance.now()
    await fn()
    times.push(performance.now() - t0)
  }

  const p = percentiles(times)
  return {
    name,
    runs,
    min_ms: Math.round(p.min * 100) / 100,
    p50_ms: Math.round(p.p50 * 100) / 100,
    p95_ms: Math.round(p.p95 * 100) / 100,
    p99_ms: Math.round(p.p99 * 100) / 100,
    max_ms: Math.round(p.max * 100) / 100,
    mean_ms: Math.round(p.mean * 100) / 100,
    stddev_ms: Math.round(p.stddev * 100) / 100,
  }
}

/**
 * Check if a result exceeds threshold by percentage
 */
export function checkRegression(
  result: BenchmarkResult,
  baseline: number,
  threshold: number = 0.2
): boolean {
  return result.p95_ms > baseline * (1 + threshold)
}
