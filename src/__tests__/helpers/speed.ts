/**
 * speed — record named timing samples from tests
 *
 * Every test in this codebase records speed. Vitest's JSON reporter captures
 * per-test wall-clock duration automatically (→ `.vitest/results.json`).
 * This helper adds **named inner measurements** (e.g. `sui:address:derive`,
 * `edge:cache:hit`) that survive test renames and can be aggregated, p50/p95'd,
 * or emitted as `test:timing` signals to the substrate.
 *
 * Output: `.vitest/speed.json` — array of { name, ms, iters, at } entries.
 * Appends; the CI/deploy pipeline reads and resets this file as needed.
 *
 * Usage:
 *   const ms = await measure('edge:cache:hit', () => getPaths(kv))
 *   const ms = await measure('routing:select', () => net.select(), 10_000)
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const OUT = resolve(process.cwd(), '.vitest/speed.ndjson')

export interface SpeedSample {
  name: string
  ms: number // per-iteration when iters > 1, else total
  total: number // total ms across all iters
  iters: number
  at: number // epoch ms
}

function ensureDir(path: string) {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function record(sample: SpeedSample) {
  ensureDir(OUT)
  // NDJSON — safe to append concurrently from parallel workers
  appendFileSync(OUT, `${JSON.stringify(sample)}\n`)
}

/**
 * Time a function and record the sample. Returns per-iteration ms.
 * For iters > 1, the function is called in a tight loop; returned ms is total/iters.
 */
export async function measure<T>(name: string, fn: () => T | Promise<T>, iters = 1): Promise<number> {
  const t0 = performance.now()
  for (let i = 0; i < iters; i++) await fn()
  const total = performance.now() - t0
  const ms = total / iters
  record({ name, ms, total, iters, at: Date.now() })
  return ms
}

/** Synchronous variant — use when fn is guaranteed sync (hot loops). */
export function measureSync<T>(name: string, fn: () => T, iters = 1): number {
  const t0 = performance.now()
  for (let i = 0; i < iters; i++) fn()
  const total = performance.now() - t0
  const ms = total / iters
  record({ name, ms, total, iters, at: Date.now() })
  return ms
}

/** Read all recorded samples — used by aggregators and CI. */
export function readSamples(): SpeedSample[] {
  if (!existsSync(OUT)) return []
  return readFileSync(OUT, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SpeedSample)
}

/** Reset the sample file — call at the start of a clean CI run. */
export function resetSamples() {
  ensureDir(OUT)
  writeFileSync(OUT, '')
}
