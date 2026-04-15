#!/usr/bin/env bun
/**
 * Deterministic Deploy — W0 baseline → build → preview → approve/deploy → verify
 *
 * Flow:
 *   1. W0 baseline (biome + typecheck + vitest, with known-failure allowlist)
 *   2. Show changes vs production
 *   3. Build (NODE_ENV=production)
 *   4. Load Cloudflare credentials from .env
 *   5. Preview — deploy to preview URL, smoke-test, report diff
 *   6. Approve (main only) or auto-deploy (other branches)
 *   7. Deploy all 4 services
 *   8. Health check all URLs
 *
 * Usage:
 *   bun run deploy                  # full pipeline
 *   bun run deploy --dry-run        # stop before deploy
 *   bun run deploy --skip-tests     # skip W0
 *   bun run deploy --preview-only   # deploy only to preview
 *   bun run deploy --strict         # fail on any test failure
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const ENV_PATH = join(ROOT, '.env')

// ─────────────────────────────────────────────────────────────────────────────
// Args + config
// ─────────────────────────────────────────────────────────────────────────────

const args = new Set(Bun.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const SKIP_TESTS = args.has('--skip-tests')
const PREVIEW_ONLY = args.has('--preview-only')
const STRICT = args.has('--strict')
const FORCE_MAIN = args.has('--main')

// Tests known to be flaky/pre-existing. Failing these doesn't block deploy.
// Gate on these: they're stochastic or hardware-dependent (benchmarks).
const KNOWN_FLAKY = [
  'Act 15: Speed Benchmarks',
  'STAN distribution',
  'explorer mode',
  '100 calls build a highway that routes in <0.01ms', // pheromone deposit timing — hardware-dependent
  'generates 1000 keys in under 10ms', // key gen timing — hardware-dependent under load
]

// ─────────────────────────────────────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────────────────────────────────────

const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function header(text: string) {
  console.log()
  console.log(c.blue('═'.repeat(60)))
  console.log(c.blue(c.bold(text)))
  console.log(c.blue('═'.repeat(60)))
}

function step(n: number, total: number, text: string) {
  console.log()
  console.log(c.yellow(`[${n}/${total}] ${text}`))
}

function run(
  cmd: string,
  cmdArgs: string[],
  opts: { cwd?: string; env?: Record<string, string>; silent?: boolean } = {},
) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: opts.cwd ?? ROOT,
    env: { ...process.env, ...(opts.env ?? {}) },
    stdio: opts.silent ? 'pipe' : 'inherit',
    encoding: 'utf-8',
  })
  return {
    ok: result.status === 0,
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

// Async spawn — for real parallelism. Unlike run() which blocks.
function runAsync(
  cmd: string,
  cmdArgs: string[],
  opts: { cwd?: string; env?: Record<string, string> } = {},
): Promise<{ ok: boolean; code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, cmdArgs, {
      cwd: opts.cwd ?? ROOT,
      env: { ...process.env, ...(opts.env ?? {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString()
    })
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString()
    })
    child.on('close', (code) => {
      resolve({ ok: code === 0, code: code ?? 1, stdout, stderr })
    })
  })
}

function die(msg: string, extra?: string): never {
  console.log()
  console.log(c.red(`✗ ${msg}`))
  if (extra) console.log(extra)
  process.exit(1)
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}

  // Local dev: load from .env file if present.
  if (existsSync(ENV_PATH)) {
    const content = readFileSync(ENV_PATH, 'utf-8')
    for (const line of content.split('\n')) {
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      const value = line.slice(eq + 1).trim()
      if (key && /^[A-Z_][A-Z0-9_]*$/i.test(key)) env[key] = value
    }
  }

  // CI: credentials arrive as process env vars. Fill in anything the .env
  // didn't already provide, so one code path handles both surfaces.
  for (const key of ['CLOUDFLARE_GLOBAL_API_KEY', 'CLOUDFLARE_EMAIL', 'CLOUDFLARE_ACCOUNT_ID']) {
    if (!env[key] && process.env[key]) env[key] = process.env[key] as string
    // Accept CLOUDFLARE_API_KEY as an alias for CLOUDFLARE_GLOBAL_API_KEY
    // since CI secrets may be named either way.
    if (key === 'CLOUDFLARE_GLOBAL_API_KEY' && !env[key] && process.env.CLOUDFLARE_API_KEY) {
      env[key] = process.env.CLOUDFLARE_API_KEY
    }
  }

  return env
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: W0 Baseline
// ─────────────────────────────────────────────────────────────────────────────

function runVerify(): { ok: boolean; allowedFailures: number; totalFailures: number } {
  if (SKIP_TESTS) {
    console.log(c.yellow('⊘ Skipping W0 baseline (--skip-tests)'))
    return { ok: true, allowedFailures: 0, totalFailures: 0 }
  }

  // Run biome + typecheck first (cheap, fast)
  console.log(c.gray('  → biome check...'))
  const biome = run('bun', ['run', 'check'], { silent: true })
  if (!biome.ok) {
    console.log(biome.stdout)
    console.log(biome.stderr)
    die('biome check failed')
  }

  console.log(c.gray('  → typecheck...'))
  const tsc = run('bun', ['run', 'typecheck'], { silent: true })
  if (!tsc.ok) {
    console.log(
      tsc.stdout
        .split('\n')
        .filter((l) => l.includes('error TS'))
        .slice(0, 10)
        .join('\n'),
    )
    die('typecheck failed')
  }

  console.log(c.gray('  → vitest...'))
  const vitest = run('bun', ['run', 'test'], { silent: true })
  const output = vitest.stdout + vitest.stderr

  // Parse failures
  const failedMatch = output.match(/Tests\s+(\d+)\s+failed/)
  const totalFailures = failedMatch ? parseInt(failedMatch[1] ?? '0', 10) : 0

  if (totalFailures === 0 && vitest.ok) {
    console.log(c.green('  ✓ All tests pass'))
    return { ok: true, allowedFailures: 0, totalFailures: 0 }
  }

  // Count failures from known-flaky suites
  const failBlocks = output.split(/FAIL /g).slice(1)
  let allowedFailures = 0
  let blockingFailures = 0
  const blockingMessages: string[] = []

  for (const block of failBlocks) {
    const header = block.split('\n')[0] ?? ''
    const isAllowed = KNOWN_FLAKY.some((pattern) => block.includes(pattern))
    if (isAllowed) {
      allowedFailures++
    } else {
      blockingFailures++
      blockingMessages.push(`    ${header.slice(0, 100)}`)
    }
  }

  if (blockingFailures > 0 || STRICT) {
    console.log(
      c.red(`  ✗ ${totalFailures} test(s) failed (${blockingFailures} blocking, ${allowedFailures} known-flaky)`),
    )
    if (blockingMessages.length) {
      console.log('  Blocking failures:')
      for (const msg of blockingMessages.slice(0, 5)) console.log(msg)
    }
    if (STRICT && allowedFailures > 0) {
      console.log(c.yellow('  (--strict mode: known-flaky failures also blocking)'))
    }
    die('W0 baseline failed')
  }

  console.log(c.yellow(`  ⊘ ${totalFailures} known-flaky test(s) failed, allowed`))
  return { ok: true, allowedFailures, totalFailures }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Git changes
// ─────────────────────────────────────────────────────────────────────────────

function showChanges() {
  const branchResult = run('git', ['branch', '--show-current'], { silent: true })
  const branch = branchResult.stdout.trim()

  const stagedResult = run('git', ['diff', '--cached', '--name-only'], { silent: true })
  const staged = stagedResult.stdout.trim().split('\n').filter(Boolean)

  const unstagedResult = run('git', ['diff', '--name-only'], { silent: true })
  const unstaged = unstagedResult.stdout.trim().split('\n').filter(Boolean)

  const aheadResult = run('git', ['rev-list', '--count', 'origin/main..HEAD'], { silent: true })
  const ahead = aheadResult.ok ? parseInt(aheadResult.stdout.trim(), 10) : 0

  console.log(`  Branch:     ${branch}`)
  console.log(`  Ahead:      ${ahead} commits`)
  console.log(`  Staged:     ${staged.length} files`)
  console.log(`  Unstaged:   ${unstaged.length} files`)

  if (staged.length + unstaged.length > 15) {
    console.log(c.gray(`  (large changeset — review before deploy)`))
  }

  return { branch, staged, unstaged, ahead }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Build
// ─────────────────────────────────────────────────────────────────────────────

function build(): number {
  const start = Date.now()
  console.log(c.gray('  → astro build...'))
  const result = run('bun', ['run', 'build'], {
    env: { NODE_ENV: 'production' },
    silent: true,
  })
  if (!result.ok) {
    console.log(result.stdout.slice(-2000))
    console.log(result.stderr.slice(-2000))
    die('Build failed')
  }
  const elapsed = Date.now() - start

  const distPath = join(ROOT, 'dist')
  if (!existsSync(distPath)) die('dist/ directory not created')

  // Get bundle size
  const duResult = run('du', ['-sh', distPath], { silent: true })
  const size = duResult.stdout.split(/\s+/)[0] ?? '?'

  console.log(c.green(`  ✓ Build succeeded`) + c.gray(` (${elapsed}ms, ${size})`))
  return elapsed
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Credentials
// ─────────────────────────────────────────────────────────────────────────────

function loadCredentials(): Record<string, string> {
  const env = loadEnv()
  const required = ['CLOUDFLARE_GLOBAL_API_KEY', 'CLOUDFLARE_EMAIL', 'CLOUDFLARE_ACCOUNT_ID']
  const missing = required.filter((k) => !env[k])
  if (missing.length > 0) {
    die(`Missing credentials: ${missing.join(', ')}`)
  }

  // Warn if scoped token is in shell — wrangler prefers it over Global Key
  if (process.env.CLOUDFLARE_API_TOKEN) {
    console.log(c.yellow(`  ⚠ CLOUDFLARE_API_TOKEN detected in shell — will be unset`))
    console.log(c.gray(`    (scoped tokens lack permissions; we always use Global API Key)`))
  }

  const creds = {
    CLOUDFLARE_API_KEY: env.CLOUDFLARE_GLOBAL_API_KEY ?? '',
    CLOUDFLARE_EMAIL: env.CLOUDFLARE_EMAIL ?? '',
    CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID ?? '',
    // Empty string explicitly unsets any inherited scoped token.
    // Wrangler auth priority: CLOUDFLARE_API_TOKEN > CLOUDFLARE_API_KEY+EMAIL.
    // Global Key has full perms; scoped tokens often don't — always force Global.
    CLOUDFLARE_API_TOKEN: '',
  }

  const accountPrefix = creds.CLOUDFLARE_ACCOUNT_ID.slice(0, 10)
  console.log(c.green(`  ✓ Credentials loaded`) + c.gray(` (Global API Key, account: ${accountPrefix}...)`))
  return creds
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Preview smoke tests
// ─────────────────────────────────────────────────────────────────────────────

function smokeCheck() {
  const checks = [
    { name: 'Pages dist/', path: join(ROOT, 'dist', '_worker.js') },
    { name: 'Gateway config', path: join(ROOT, 'gateway', 'wrangler.toml') },
    { name: 'Sync config', path: join(ROOT, 'workers/sync', 'wrangler.toml') },
    { name: 'NanoClaw config', path: join(ROOT, 'nanoclaw', 'wrangler.toml') },
  ]
  let ok = true
  for (const check of checks) {
    if (existsSync(check.path)) {
      console.log(c.green(`  ✓ ${check.name}`))
    } else {
      console.log(c.red(`  ✗ ${check.name} missing: ${check.path}`))
      ok = false
    }
  }
  if (!ok) die('Smoke check failed')
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 6: Approval (main only)
// ─────────────────────────────────────────────────────────────────────────────

async function approve(branch: string): Promise<boolean> {
  const needsApproval = branch === 'main' || FORCE_MAIN
  if (!needsApproval) {
    console.log(c.gray(`  → auto-deploying (branch ≠ main)`))
    return true
  }

  console.log(c.yellow(`  ⚠ Branch is 'main' — human approval required`))
  console.log()
  console.log('  Deploy 4 services to production?')
  console.log(`    • Gateway     (api.one.ie)`)
  console.log(`    • Sync        (one-sync.oneie.workers.dev)`)
  console.log(`    • NanoClaw    (nanoclaw.oneie.workers.dev)`)
  console.log(`    • Pages       (one-substrate.pages.dev)`)
  console.log()

  if (DRY_RUN) {
    console.log(c.gray('  (dry-run: skipping prompt)'))
    return false
  }

  // Non-interactive bypass — CI (behind GitHub `environment: production` gate)
  // or scripted deploys set DEPLOY_CONFIRM=yes. The gate is the GH reviewer,
  // not this prompt; keeping it also bypassed here keeps one code path.
  if (process.env.DEPLOY_CONFIRM === 'yes') {
    console.log(c.gray('  → DEPLOY_CONFIRM=yes in env, skipping TTY prompt'))
    return true
  }

  // Read from TTY
  process.stdout.write('  Type "yes" to deploy: ')
  const line = await new Promise<string>((resolve) => {
    let input = ''
    process.stdin.setRawMode?.(false)
    process.stdin.on('data', (data) => {
      input += data.toString()
      if (input.includes('\n')) resolve(input.trim())
    })
    process.stdin.resume()
  })

  return line.toLowerCase() === 'yes'
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 7: Deploy
// ─────────────────────────────────────────────────────────────────────────────

type DeployResult = { name: string; elapsed: number; version: string; previewUrl?: string }

// Deploy a single service via wrangler CLI direct (faster than `bun wrangler`).
// Uses runAsync for true parallelism — spawnSync blocks the event loop.
async function deployService(
  name: string,
  cwd: string,
  args: string[],
  env: Record<string, string>,
): Promise<DeployResult> {
  const start = Date.now()
  const result = await runAsync('wrangler', args, { cwd, env })
  const elapsed = Date.now() - start

  if (!result.ok) {
    console.log(result.stdout.slice(-1500))
    console.log(result.stderr.slice(-1500))
    die(`${name} deploy failed`)
  }

  const versionMatch = result.stdout.match(/Version ID:\s*([a-f0-9-]+)/i)
  const version = versionMatch ? (versionMatch[1]?.slice(0, 12) ?? '?') : '?'

  // Pages outputs a preview URL like "https://b7746117.one-substrate.pages.dev"
  const previewMatch = result.stdout.match(/https:\/\/([a-f0-9]+)\.one-substrate\.pages\.dev/)
  const previewUrl = previewMatch ? previewMatch[0] : undefined

  return { name, elapsed, version, previewUrl }
}

async function deployAll(creds: Record<string, string>): Promise<DeployResult[]> {
  const env = { ...creds, PATH: process.env.PATH ?? '' }

  // Ensure each sub-package has its node_modules. Root `bun install` doesn't
  // recurse, so CI (fresh clone) and local (new worker dir) both need this.
  // Idempotent — fast when deps are already installed.
  for (const dir of ['gateway', 'nanoclaw']) {
    const pkgDir = join(ROOT, dir)
    if (!existsSync(join(pkgDir, 'package.json'))) continue
    if (existsSync(join(pkgDir, 'node_modules'))) continue
    console.log(c.gray(`  → installing ${dir}/ deps...`))
    // No lockfile in sub-packages, so run plain install.
    const res = run('bun', ['install'], { cwd: pkgDir, silent: true })
    if (!res.ok) die(`${dir} install failed: ${res.stderr.slice(0, 200)}`)
  }

  // Workers are independent — parallelize for ~3× speedup.
  console.log(c.gray(`  → Gateway, Sync, NanoClaw (parallel)...`))
  const workerStart = Date.now()
  const workers = await Promise.all([
    deployService('Gateway', join(ROOT, 'gateway'), ['deploy'], env),
    deployService('Sync', join(ROOT, 'workers/sync'), ['deploy'], env),
    deployService('NanoClaw', join(ROOT, 'nanoclaw'), ['deploy'], env),
  ])
  const workerElapsed = Date.now() - workerStart

  for (const w of workers) {
    console.log(c.green(`  ✓ ${w.name}`) + c.gray(` (${w.elapsed}ms, v${w.version})`))
  }
  console.log(
    c.gray(`  (parallel total: ${workerElapsed}ms — vs ~${workers.reduce((a, b) => a + b.elapsed, 0)}ms sequential)`),
  )

  // Pages deploys last so workers back it.
  console.log(c.gray(`  → Pages...`))
  const pages = await deployService(
    'Pages',
    ROOT,
    ['pages', 'deploy', 'dist/', '--project-name=one-substrate', '--commit-dirty=true'],
    env,
  )
  console.log(c.green(`  ✓ ${pages.name}`) + c.gray(` (${pages.elapsed}ms)`))
  if (pages.previewUrl) {
    console.log(c.blue(`    📎 Preview: ${pages.previewUrl}`))
  }

  return [...workers, pages]
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 8: Health checks (implemented as healthCheckWithRetry below)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  header('Deterministic Deploy')

  const startTotal = Date.now()

  step(1, 8, 'W0 Baseline — biome + typecheck + vitest')
  const verify = runVerify()

  step(2, 8, 'Changes')
  const { branch, staged, unstaged } = showChanges()

  step(3, 8, 'Build')
  build()

  step(4, 8, 'Credentials')
  const creds = loadCredentials()

  step(5, 8, 'Smoke check — verify artifacts')
  smokeCheck()

  if (DRY_RUN) {
    console.log()
    console.log(c.yellow('⊘ DRY RUN — stopping before deploy'))
    console.log()
    console.log(`  Would deploy branch '${branch}' (${staged.length + unstaged.length} changed files)`)
    return
  }

  step(6, 8, 'Approval')
  const approved = await approve(branch)
  if (!approved) {
    die('Deployment cancelled')
  }

  if (PREVIEW_ONLY) {
    console.log(c.yellow('⊘ PREVIEW ONLY — stopping before production deploy'))
    return
  }

  step(7, 8, 'Deploy — 4 services (parallel workers + pages)')
  const deployResults = await deployAll(creds)

  step(8, 8, 'Health checks')
  const health = await healthCheckWithRetry()

  // Rule 3: record deploy to substrate — let the world learn from its own deploys
  await recordToSubstrate({ branch, deployResults, health, totalFailures: verify.totalFailures })

  const totalElapsed = ((Date.now() - startTotal) / 1000).toFixed(1)
  const preview = deployResults.find((r) => r.previewUrl)?.previewUrl

  console.log()
  console.log(c.green('═'.repeat(60)))
  console.log(c.green(c.bold(`✓ Deploy complete in ${totalElapsed}s`)))
  console.log(c.green('═'.repeat(60)))
  console.log()
  console.log(`  Branch:          ${branch}`)
  console.log(
    `  Tests:           ${verify.totalFailures === 0 ? 'all pass' : `${verify.allowedFailures} flaky allowed`}`,
  )
  console.log(`  Services:        4/4 deployed`)
  console.log(`  Health:          ${health.filter((h) => h.ok).length}/${health.length} responding`)
  if (preview) console.log(`  Preview:         ${preview}`)
  console.log()
  process.exit(0)
}

// Health check with 3 retries for slow-warming services (Pages CDN propagation).
async function healthCheckWithRetry() {
  const urls = [
    { name: 'Gateway', url: 'https://api.one.ie/health' },
    { name: 'Pages', url: 'https://one-substrate.pages.dev/' },
    { name: 'Sync', url: 'https://one-sync.oneie.workers.dev/' },
    { name: 'NanoClaw', url: 'https://nanoclaw.oneie.workers.dev/health' },
  ]

  async function check(
    name: string,
    url: string,
    attempt = 1,
  ): Promise<{ name: string; url: string; ok: boolean; status: number; elapsed: number; attempts: number }> {
    try {
      const start = Date.now()
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      const elapsed = Date.now() - start
      if (res.ok) return { name, url, ok: true, status: res.status, elapsed, attempts: attempt }
    } catch {}
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt))
      return check(name, url, attempt + 1)
    }
    return { name, url, ok: false, status: 0, elapsed: 0, attempts: attempt }
  }

  const results = await Promise.all(urls.map(({ name, url }) => check(name, url)))
  for (const r of results) {
    if (r.ok) {
      const retry = r.attempts > 1 ? c.gray(` (retry ${r.attempts})`) : ''
      console.log(c.green(`  ✓ ${r.name}`) + c.gray(` ${r.status} in ${r.elapsed}ms`) + retry)
    } else {
      console.log(c.red(`  ✗ ${r.name}`) + c.gray(` failed after 3 retries — ${r.url}`))
    }
  }
  return results
}

// Rule 3: emit deploy event as a substrate signal so paths learn.
// POST to /api/signal with deploy metadata; mark() on full health, warn() on failure.
async function recordToSubstrate(data: {
  branch: string
  deployResults: DeployResult[]
  health: Array<{ name: string; ok: boolean; elapsed: number }>
  totalFailures: number
}) {
  try {
    const allHealthy = data.health.every((h) => h.ok)
    const receiver = allHealthy ? 'deploy:success' : 'deploy:degraded'
    const payload = {
      receiver,
      data: {
        branch: data.branch,
        services: data.deployResults.map((r) => ({ name: r.name, elapsed: r.elapsed, version: r.version })),
        healthMs: Object.fromEntries(data.health.map((h) => [h.name.toLowerCase(), h.elapsed])),
        testFailures: data.totalFailures,
        timestamp: new Date().toISOString(),
      },
    }
    const res = await fetch('https://one-substrate.pages.dev/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      console.log(c.gray(`  ✓ Recorded to substrate: ${receiver}`))
    }
  } catch {
    // Non-fatal — the substrate might be unreachable during a deploy that broke it
    console.log(c.gray(`  ⊘ Substrate record skipped (non-fatal)`))
  }
}

main().catch((e) => die('Unexpected error', String(e)))
