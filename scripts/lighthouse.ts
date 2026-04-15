#!/usr/bin/env bun
/**
 * Performance budget verifier — the CI gate for client-ui perf.
 *
 * Checks deterministic budgets WITHOUT a running server:
 *   ✓ Bundle per route       < 100 KB gzip   (from dist/_astro/*.js)
 *   ✓ Chat embed bundle      < 30 KB gzip    (from dist/chat.js if built)
 *
 * Prints manual commands for runtime budgets (need a running server):
 *   · TTI group view         < 200ms p50
 *   · Signal round-trip      < 300ms p50   (WS keystroke → DO → UI)
 *   · Chat first token       < 500ms p50
 *   · 100-path graph paint   < 16ms
 *
 * Run:
 *   bun run scripts/lighthouse.ts               # check dist/ (build first if stale)
 *   bun run scripts/lighthouse.ts --no-build    # skip build, fail if dist/ missing
 *
 * Exit codes:
 *   0 — all deterministic budgets pass
 *   1 — one or more budget exceeded
 */

import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = process.cwd()
const DIST_ASSETS = join(ROOT, 'dist/_astro')
const DIST_ROOT = join(ROOT, 'dist')
const NO_BUILD = process.argv.includes('--no-build')

// ── Budget table ─────────────────────────────────────────────────────────────

const BUDGETS = {
  routeBundle: 100 * 1024, // 100 KB gzip — per JS chunk in dist/_astro
  embedBundle: 30 * 1024, // 30 KB gzip  — chat.js embed
}

// ── Ensure dist/ is fresh ────────────────────────────────────────────────────

function distIsFresh(): boolean {
  if (!existsSync(DIST_ASSETS)) return false
  // SSR (Cloudflare adapter) produces _worker.js; static builds produce index.html
  const ssrMarker = join(DIST_ROOT, '_worker.js')
  const staticMarker = join(DIST_ROOT, 'index.html')
  const marker = existsSync(ssrMarker) ? ssrMarker : existsSync(staticMarker) ? staticMarker : null
  if (!marker) return false
  // Consider fresh if built in the last 2 hours
  const ageMs = Date.now() - statSync(marker).mtimeMs
  return ageMs < 2 * 60 * 60 * 1000
}

if (!distIsFresh()) {
  if (NO_BUILD) {
    console.error('✗ dist/ missing or stale. Run `bun run build` first.')
    process.exit(1)
  }
  console.log('→ Building (dist/ stale or missing)…')
  try {
    execSync('bun run build', { cwd: ROOT, stdio: 'inherit' })
  } catch {
    console.error('✗ Build failed.')
    process.exit(1)
  }
}

// ── Bundle size checks ───────────────────────────────────────────────────────

// Rollup code-splitting naming convention in this project:
//   Route/component chunks:  PascalCase prefix  → ChatShell.yABmRFmv.js, TaskBoard.CudXqOdg.js
//   Shiki language grammars: non-PascalCase     → python.B6aJPvgy.js, mermaid-GHXKKRXX.B8j6.js
//   WASM + theme assets:     non-PascalCase     → wasm.CG6Dc4jp.js
//
// Only measure chunks whose first character is uppercase — those are the
// actual component bundles shipped with page navigation. Everything else
// is lazy-loaded syntax-highlighting infrastructure.
const IS_ROUTE_CHUNK = /^[A-Z]/

type BudgetResult = { file: string; rawBytes: number; gzBytes: number; budget: number; pass: boolean }
const results: BudgetResult[] = []

async function checkDir(dir: string, budget: number, label: string) {
  if (!existsSync(dir)) {
    console.log(`  · ${label}: dir not found, skipping`)
    return
  }
  const files = (await readdir(dir)).filter((f) => (f.endsWith('.js') || f.endsWith('.mjs')) && IS_ROUTE_CHUNK.test(f))
  for (const file of files) {
    const raw = await readFile(join(dir, file))
    const gz = gzipSync(raw)
    const pass = gz.length <= budget
    results.push({ file, rawBytes: raw.length, gzBytes: gz.length, budget, pass })
  }
}

async function checkEmbed() {
  const path = join(DIST_ROOT, 'chat.js')
  if (!existsSync(path)) return
  const raw = await readFile(path)
  const gz = gzipSync(raw)
  const pass = gz.length <= BUDGETS.embedBundle
  results.push({ file: 'chat.js (embed)', rawBytes: raw.length, gzBytes: gz.length, budget: BUDGETS.embedBundle, pass })
}

await checkDir(DIST_ASSETS, BUDGETS.routeBundle, '_astro/*.js chunks')
await checkEmbed()

// ── Report deterministic results ─────────────────────────────────────────────

console.log('\nBundle size budgets')
console.log('──────────────────────────────────────────────────────')

let failures = 0
for (const r of results) {
  const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`
  const budgetKb = (r.budget / 1024).toFixed(0)
  const mark = r.pass ? '✓' : '✗'
  const line = `  ${mark}  ${r.file.padEnd(48)} ${kb(r.gzBytes).padStart(9)} gz  (budget ${budgetKb} KB)`
  if (r.pass) {
    console.log(line)
  } else {
    console.error(line)
    failures++
  }
}

if (results.length === 0) {
  console.log('  · No JS chunks found in dist/_astro — build may be empty')
}

// ── Runtime budget instructions ───────────────────────────────────────────────

console.log('\nRuntime budgets (require a running server)')
console.log('──────────────────────────────────────────────────────')
console.log(`
These budgets need a live server. Run \`bun run tunnel:local\` then:

  TTI group view < 200ms p50:
    npx lighthouse http://localhost:4321/app --only-categories=performance \\
      --output=json | jq '.audits["interactive"].numericValue'

  Signal round-trip < 300ms p50 (WS → DO → UI):
    bun run scripts/test-ws-integration.ts   # 11/11 must pass, check latency output

  Chat first-token < 500ms p50:
    curl -s -o /dev/null -w "%{time_starttransfer}" \\
      -X POST http://localhost:4321/api/chat \\
      -H "Content-Type: application/json" \\
      -d '{"messages":[{"role":"user","content":"hi"}],"model":"meta-llama/llama-4-maverick"}'

  100-path graph paint < 16ms:
    # Open localhost:4321/world in Chrome DevTools → Performance → Record → measure paint
`)

console.log('──────────────────────────────────────────────────────')

if (failures > 0) {
  console.error(`\n✗ ${failures} bundle budget(s) exceeded.`)
  process.exit(1)
} else {
  console.log(`✓ ${results.length} bundle budget(s) passed. Runtime budgets require a live server (see above).`)
}
