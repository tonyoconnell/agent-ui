#!/usr/bin/env bun
/**
 * speed-report — generate docs/speed-test.md
 *
 * This report measures the PRODUCTION SYSTEM's speed, not the test suite.
 * Named benchmarks from `measure()` are the primary data. Per-test wall-clock
 * is a small appendix for sanity.
 *
 * Inputs:
 *   .vitest/speed.ndjson     — named samples (routing:select, pheromone:mark, …)
 *   .vitest/results.json     — per-test wall-clock (secondary, for appendix)
 *
 * Output: docs/speed-test.md
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')
const RESULTS = resolve(ROOT, '.vitest/results.json')
const SAMPLES = resolve(ROOT, '.vitest/speed.ndjson')
// Write to gitignored .vitest/ — keeps test teardown from dirtying the tree.
// Promote to tracked `one/speed-test.md` via `bun run speed:promote`.
// Deploy W0 gates on regression via `bun run speed:check`.
const OUT = resolve(ROOT, '.vitest/speed-report.md')

// ─────────────────────────────────────────────────────────────────────────────
// Budgets — kept in sync with docs/speed.md
// These are the aspirational (PERF_SCALE=1) numbers. The report shows p50/p95
// against the budget; practical budget = budget × PERF_SCALE (default 3).
// ─────────────────────────────────────────────────────────────────────────────

interface Budget {
  name: string
  ms: number
  layer:
    | 'routing'
    | 'pheromone'
    | 'signal'
    | 'identity'
    | 'edge'
    | 'sui'
    | 'bridge'
    | 'lifecycle'
    | 'intent'
    | 'ws'
    | 'ask'
    | 'channels'
    | 'loop'
    | 'page'
    | 'typedb'
    | 'other'
  replaces?: string
}

const BUDGETS: Budget[] = [
  // routing
  { name: 'routing:select:100', ms: 0.005, layer: 'routing', replaces: 'LLM routing (~300ms)' },
  { name: 'routing:select:1000', ms: 1, layer: 'routing', replaces: 'search API + rank' },
  { name: 'routing:follow', ms: 0.05, layer: 'routing', replaces: 'keyword search' },
  { name: 'routing:follow:batch-10k', ms: 0.005, layer: 'routing' },
  // pheromone
  { name: 'pheromone:mark', ms: 0.001, layer: 'pheromone', replaces: 'DB write (~10ms)' },
  { name: 'pheromone:warn', ms: 0.001, layer: 'pheromone' },
  { name: 'pheromone:sense', ms: 0.001, layer: 'pheromone' },
  { name: 'pheromone:fade:1000', ms: 5, layer: 'pheromone' },
  { name: 'pheromone:highways:top10', ms: 5, layer: 'pheromone' },
  // signal
  { name: 'signal:dispatch', ms: 1, layer: 'signal', replaces: 'HTTP call (~50ms)' },
  { name: 'signal:dispatch:dissolved', ms: 1, layer: 'signal' },
  { name: 'signal:queue:roundtrip', ms: 1, layer: 'signal' },
  { name: 'signal:ask:chain-3', ms: 100, layer: 'signal', replaces: '3 sequential LLM (~6s)' },
  // identity
  { name: 'identity:sui:address', ms: 5, layer: 'identity' },
  // edge
  { name: 'edge:cache:hit', ms: 0.01, layer: 'edge', replaces: 'TypeDB round-trip (~100ms)' },
  // sui (Wave 1)
  { name: 'sui:keypair:derive', ms: 5, layer: 'sui', replaces: 'HSM round-trip' },
  { name: 'sui:keypair:platform', ms: 0.001, layer: 'sui' },
  { name: 'sui:tx:build', ms: 0.01, layer: 'sui' },
  { name: 'sui:tx:build:movecall', ms: 0.1, layer: 'sui' },
  { name: 'sui:sign', ms: 5, layer: 'sui' },
  // bridge (Wave 1)
  { name: 'bridge:mirror:unit', ms: 10, layer: 'bridge', replaces: 'manual on-chain deploy' },
  { name: 'bridge:mirror:mark', ms: 5, layer: 'bridge' },
  // lifecycle (Wave 2)
  { name: 'lifecycle:register', ms: 10, layer: 'lifecycle', replaces: 'agent onboarding flow' },
  { name: 'lifecycle:capable:build', ms: 0.1, layer: 'lifecycle' },
  { name: 'lifecycle:discover', ms: 1, layer: 'lifecycle', replaces: 'search + rank API' },
  { name: 'lifecycle:signal+mark', ms: 5, layer: 'lifecycle' },
  { name: 'lifecycle:highway:select', ms: 0.01, layer: 'lifecycle', replaces: 'LLM decision' },
  { name: 'lifecycle:federate:hop', ms: 1, layer: 'lifecycle' },
  { name: 'lifecycle:e2e', ms: 50, layer: 'lifecycle' },
  // intent (Wave 3)
  { name: 'intent:resolve:label', ms: 0.05, layer: 'intent', replaces: 'LLM classify (~500ms)' },
  { name: 'intent:resolve:keyword', ms: 0.1, layer: 'intent' },
  { name: 'intent:resolve:miss', ms: 0.05, layer: 'intent' },
  // ws (Wave 3)
  { name: 'ws:broadcast:roundtrip', ms: 1, layer: 'ws', replaces: 'polling loop (~5s)' },
  // ask (Wave 3)
  { name: 'ask:durable:overhead', ms: 30, layer: 'ask' },
  // channels (Wave 3)
  { name: 'channels:telegram:normalize', ms: 0.05, layer: 'channels' },
  { name: 'channels:web:message', ms: 0.01, layer: 'channels' },
  // loops (Wave 4)
  { name: 'loop:L3:fade:1000', ms: 5, layer: 'loop' },
  { name: 'loop:L4:economic', ms: 10, layer: 'loop' },
  { name: 'loop:L5:evolution:detect', ms: 5, layer: 'loop' },
  { name: 'loop:L6:know:scan', ms: 1, layer: 'loop' },
  { name: 'loop:L7:frontier:scan', ms: 5, layer: 'loop' },
  // pages + typedb (Wave 5)
  { name: 'page:ssr:world', ms: 1, layer: 'page', replaces: 'client fetch waterfall (~500ms)' },
  { name: 'page:ssr:chat:config', ms: 0.01, layer: 'page' },
  { name: 'typedb:read:parse', ms: 1, layer: 'typedb' },
  { name: 'typedb:read:boot', ms: 10, layer: 'typedb' },
]

const SCALE = Number(process.env.PERF_SCALE ?? 3)

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Sample {
  name: string
  ms: number
  total: number
  iters: number
  at: number
}

interface AssertionResult {
  title: string
  fullName: string
  status: string
  duration?: number
}

interface FileResult {
  name: string
  startTime: number
  endTime: number
  assertionResults: AssertionResult[]
}

interface Results {
  numTotalTests: number
  numPassedTests: number
  numFailedTests: number
  startTime: number
  success: boolean
  testResults: FileResult[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

function fmt(ms: number): string {
  if (ms === 0) return '0'
  if (ms < 0.001) return ms.toExponential(2)
  if (ms < 1) return ms.toFixed(3)
  if (ms < 100) return ms.toFixed(2)
  return ms.toFixed(0)
}

interface Stat {
  name: string
  count: number
  min: number
  p50: number
  p95: number
  max: number
  mean: number
}

function stats(values: number[], name: string): Stat {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    name,
    count: values.length,
    min: sorted[0],
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
    mean: values.reduce((s, v) => s + v, 0) / values.length,
  }
}

function verdict(p95: number, budget: number): string {
  const practical = budget * SCALE
  if (p95 <= budget) return 'pass'
  if (p95 <= practical) return `pass (within ${SCALE}× scale)`
  return 'over'
}

// ─────────────────────────────────────────────────────────────────────────────
// Render — SYSTEM speed (primary)
// ─────────────────────────────────────────────────────────────────────────────

function renderSystem(samples: Sample[]): string {
  const byName = new Map<string, number[]>()
  for (const s of samples) {
    const arr = byName.get(s.name) ?? []
    arr.push(s.ms)
    byName.set(s.name, arr)
  }

  const layers: Record<Budget['layer'], string> = {
    routing: 'Routing Layer',
    pheromone: 'Pheromone Layer',
    signal: 'Signal Layer',
    identity: 'Identity Layer',
    edge: 'Edge Cache Layer',
    sui: 'Sui Layer',
    bridge: 'Bridge (TypeDB ↔ Sui)',
    lifecycle: 'Lifecycle Stages',
    intent: 'Intent Cache',
    ws: 'WebSocket Broadcast',
    ask: 'Durable Ask',
    channels: 'Channels',
    loop: 'Slow Loops (L3–L7)',
    page: 'Page SSR',
    typedb: 'TypeDB Read Path',
    other: 'Other',
  }

  const grouped: Record<Budget['layer'], Budget[]> = {
    routing: [],
    pheromone: [],
    signal: [],
    identity: [],
    edge: [],
    sui: [],
    bridge: [],
    lifecycle: [],
    intent: [],
    ws: [],
    ask: [],
    channels: [],
    loop: [],
    page: [],
    typedb: [],
    other: [],
  }
  for (const b of BUDGETS) grouped[b.layer].push(b)

  const out: string[] = []

  for (const [layer, title] of Object.entries(layers)) {
    const budgets = grouped[layer as Budget['layer']]
    if (!budgets.length) continue
    out.push(`### ${title}\n\n`)
    out.push('| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |\n')
    out.push('|-----------|-------:|----:|----:|----:|--:|:--------|----------|\n')
    for (const b of budgets) {
      const values = byName.get(b.name)
      if (!values) {
        out.push(`| \`${b.name}\` | ${fmt(b.ms)}ms | — | — | — | 0 | _no data_ | ${b.replaces ?? ''} |\n`)
        continue
      }
      const s = stats(values, b.name)
      const v = verdict(s.p95, b.ms)
      const marker = v === 'over' ? '✗' : v === 'pass' ? '✓' : '◐'
      out.push(
        `| \`${b.name}\` | ${fmt(b.ms)}ms | ${fmt(s.p50)} | ${fmt(s.p95)} | ${fmt(s.max)} | ${s.count} | ${marker} ${v} | ${b.replaces ?? ''} |\n`,
      )
    }
    out.push('\n')
  }

  // Unknown samples — anything recorded but not in BUDGETS (ad-hoc benchmarks)
  const known = new Set(BUDGETS.map((b) => b.name))
  const extra = [...byName.entries()].filter(([n]) => !known.has(n))
  if (extra.length) {
    out.push('### Ad-hoc samples (no budget)\n\n')
    out.push('| Name | n | p50 | p95 | max |\n|------|--:|----:|----:|----:|\n')
    for (const [name, values] of extra) {
      const s = stats(values, name)
      out.push(`| \`${name}\` | ${s.count} | ${fmt(s.p50)} | ${fmt(s.p95)} | ${fmt(s.max)} |\n`)
    }
    out.push('\n')
  }

  return out.join('')
}

// ─────────────────────────────────────────────────────────────────────────────
// Render — Gate timing appendix
// ─────────────────────────────────────────────────────────────────────────────

function renderGateAppendix(r: Results | null): string {
  if (!r) return ''
  const totalMs = r.testResults.reduce((s, f) => s + (f.endTime - f.startTime), 0)
  const perFile = r.testResults
    .map((f) => ({
      name: basename(f.name),
      ms: f.endTime - f.startTime,
      n: f.assertionResults.length,
    }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 10)

  const rows = perFile.map((f) => `| \`${f.name}\` | ${f.n} | ${fmt(f.ms)}ms |`).join('\n')
  const status = r.success ? '✓' : '✗'
  return `## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ${status} ${r.numPassedTests}/${r.numTotalTests} tests · ${fmt(totalMs)}ms across ${r.testResults.length} files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
${rows}
`
}

// ─────────────────────────────────────────────────────────────────────────────
// Header + main
// ─────────────────────────────────────────────────────────────────────────────

function renderHeader(samples: Sample[], r: Results | null): string {
  const now = new Date().toISOString()
  const runAt = r ? new Date(r.startTime).toISOString() : 'unknown'
  const sampleCount = samples.length
  const benchmarksMeasured = new Set(samples.map((s) => s.name)).size
  const budgetsCovered = BUDGETS.filter((b) => samples.some((s) => s.name === b.name)).length

  // Overall pass/fail across all budgets
  const byName = new Map<string, number[]>()
  for (const s of samples) {
    const arr = byName.get(s.name) ?? []
    arr.push(s.ms)
    byName.set(s.name, arr)
  }
  let pass = 0
  let over = 0
  let missing = 0
  for (const b of BUDGETS) {
    const values = byName.get(b.name)
    if (!values) {
      missing++
      continue
    }
    const s = stats(values, b.name)
    if (s.p95 <= b.ms * SCALE) pass++
    else over++
  }

  return `# System Speed Report

> **Auto-generated** by \`scripts/speed-report.ts\` after every \`bun run test\`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use \`PERF_SCALE=${SCALE}\`.

|  |  |
|---|---|
| Generated at | ${now} |
| Test run at | ${runAt} |
| Benchmarks measured | ${benchmarksMeasured} named ops, ${sampleCount} samples |
| Budget coverage | ${budgetsCovered} / ${BUDGETS.length} operations |
| Verdict | **${pass} pass** · **${over} over** · ${missing} missing |
| PERF_SCALE | ${SCALE} (practical budget = budget × ${SCALE}) |

**What's measured here:**

- \`routing:*\` — \`select()\`, \`follow()\` over 100–1,000 path worlds
- \`pheromone:*\` — \`mark()\`, \`warn()\`, \`sense()\`, \`fade()\`, \`highways()\`
- \`signal:*\` — in-memory dispatch, queue drain, 3-unit \`ask()\` round-trip
- \`identity:*\` — Sui keypair derivation (SHA-256 + Ed25519)
- \`edge:*\` — in-process KV cache hit

How to extend: call \`measure('<layer>:<op>', fn, iters)\` in any test; the
sample lands here automatically. Add a budget in \`scripts/speed-report.ts\`
to get a verdict column.

---

## System Benchmarks

`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function loadResults(): Results | null {
  if (!existsSync(RESULTS)) return null
  return JSON.parse(readFileSync(RESULTS, 'utf8')) as Results
}

function loadSamples(): Sample[] {
  if (!existsSync(SAMPLES)) return []
  return readFileSync(SAMPLES, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Sample)
}

function main() {
  const results = loadResults()
  const samples = loadSamples()

  if (!samples.length && !results) {
    console.error('No artifacts found. Run `bun run test` first.')
    process.exit(1)
  }

  const parts: string[] = []
  parts.push(renderHeader(samples, results))
  parts.push(renderSystem(samples))
  parts.push('\n---\n\n')
  parts.push(renderGateAppendix(results))
  parts.push(`\n---\n\n_Report generated ${new Date().toISOString()}._\n`)

  const outDir = dirname(OUT)
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  writeFileSync(OUT, parts.join(''))

  const benches = new Set(samples.map((s) => s.name)).size
  console.log(`✓ ${OUT}`)
  console.log(`  ${benches} benchmarks · ${samples.length} samples · ${BUDGETS.length} budgets`)
}

main()
