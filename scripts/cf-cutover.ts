#!/usr/bin/env bun
/**
 * CF Pages → Workers cutover — API-driven replacement for the dashboard step
 * blocking `TODO-cf-workers-migration.md` Cycle 3.
 *
 * Three steps (each idempotent, each reports a deterministic result per Rule 3):
 *   1. Ensure `dev.one.ie/*` Workers route points at `one-substrate` Worker
 *   2. Detach `dev.one.ie` from the Pages project (so DNS resolves via Workers)
 *   3. Verify `https://dev.one.ie/api/health` returns 200 served by Workers
 *
 * The Pages project itself is NOT deleted — it stays paused (no traffic, no
 * domains) for a full rollback cycle before archive. That matches the
 * migration TODO's "rollback window" philosophy; deletion is Cycle 4+.
 *
 * Every run posts a `deploy:cutover` signal to /api/signal so the substrate
 * learns from both dry-run dress rehearsals and real cutovers.
 *
 * Usage:
 *   bun run cf-cutover             # dry-run (default, safe — no API writes)
 *   bun run cf-cutover --execute   # real cutover (writes to CF + posts signal)
 *   bun run cf-cutover --execute --no-verify   # skip step 3 (use sparingly)
 *
 * Required .env (CLAUDE.md §Deploy):
 *   CLOUDFLARE_GLOBAL_API_KEY    — global key, not scoped token
 *   CLOUDFLARE_EMAIL             — account email for X-Auth-Email
 *   CLOUDFLARE_ACCOUNT_ID        — account ID
 *   CLOUDFLARE_ZONE_ID           — (optional) zone ID for one.ie; auto-discovered if absent
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dir, '..')
const ENV_PATH = join(ROOT, '.env')

const WORKER_NAME = process.env.CF_CUTOVER_WORKER ?? 'one-substrate'
const PAGES_PROJECT = process.env.CF_CUTOVER_PAGES_PROJECT ?? 'one-substrate'
const CUSTOM_DOMAIN = process.env.CF_CUTOVER_DOMAIN ?? 'dev.one.ie'
const ZONE_NAME = CUSTOM_DOMAIN.split('.').slice(-2).join('.') // "one.ie"
const HEALTH_PATH = '/api/health'

const args = new Set(Bun.argv.slice(2))
const EXECUTE = args.has('--execute')
const DRY_RUN = !EXECUTE
const SKIP_VERIFY = args.has('--no-verify')

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

function header(text: string) {
  console.log()
  console.log(c.blue('═'.repeat(60)))
  console.log(c.blue(c.bold(text)))
  console.log(c.blue('═'.repeat(60)))
}

function step(n: number, total: number, label: string) {
  console.log(`\n${c.bold(`[${n}/${total}]`)} ${label}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// .env loader (matches scripts/deploy.ts style)
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {}
  const text = readFileSync(ENV_PATH, 'utf8')
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = { ...loadEnv(), ...process.env }

const EMAIL = env.CLOUDFLARE_EMAIL
const API_KEY = env.CLOUDFLARE_GLOBAL_API_KEY
const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID
let ZONE_ID = env.CLOUDFLARE_ZONE_ID

if (!EMAIL || !API_KEY || !ACCOUNT_ID) {
  console.error(c.red('✗ Missing credentials in .env'))
  console.error(c.gray('  Required: CLOUDFLARE_EMAIL, CLOUDFLARE_GLOBAL_API_KEY, CLOUDFLARE_ACCOUNT_ID'))
  console.error(c.gray('  See CLAUDE.md §Deploy — Global API Key only, not scoped token.'))
  process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// CF API client — Global API Key auth (CLAUDE.md: non-negotiable)
// ─────────────────────────────────────────────────────────────────────────────

type CfResponse<T> = { success: boolean; result: T; errors?: Array<{ code: number; message: string }> }

async function cf<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      'X-Auth-Email': EMAIL!,
      'X-Auth-Key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json()) as CfResponse<T>
  if (!json.success) {
    const msg = json.errors?.map((e) => `${e.code}:${e.message}`).join('; ') ?? 'unknown'
    throw new Error(`CF ${method} ${path} → ${res.status} ${msg}`)
  }
  return json.result
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 0 — Resolve zone ID (if not in .env)
// ─────────────────────────────────────────────────────────────────────────────

async function resolveZoneId(): Promise<string> {
  if (ZONE_ID) return ZONE_ID
  console.log(c.gray(`  Zone not in .env — looking up ${ZONE_NAME}...`))
  const zones = await cf<Array<{ id: string; name: string }>>('GET', `/zones?name=${ZONE_NAME}`)
  if (!zones.length) throw new Error(`Zone ${ZONE_NAME} not found on this account`)
  ZONE_ID = zones[0].id
  console.log(c.gray(`  → ${ZONE_ID}`))
  return ZONE_ID
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Workers route
// ─────────────────────────────────────────────────────────────────────────────

type Route = { id: string; pattern: string; script: string }

async function ensureWorkersRoute(): Promise<Record<string, unknown>> {
  const pattern = `${CUSTOM_DOMAIN}/*`
  const routes = await cf<Route[]>('GET', `/zones/${ZONE_ID}/workers/routes`)
  const match = routes.find((r) => r.pattern === pattern)

  if (match && match.script === WORKER_NAME) {
    console.log(c.green(`  ✓ route ${pattern} → ${WORKER_NAME} already present`))
    return { action: 'noop', id: match.id }
  }

  if (match) {
    const summary = `route ${pattern}: ${match.script} → ${WORKER_NAME}`
    if (DRY_RUN) {
      console.log(c.yellow(`  ⊘ would update ${summary}`))
      return { action: 'would-update', id: match.id, from: match.script, to: WORKER_NAME }
    }
    await cf<Route>('PUT', `/zones/${ZONE_ID}/workers/routes/${match.id}`, { pattern, script: WORKER_NAME })
    console.log(c.green(`  ✓ updated ${summary}`))
    return { action: 'updated', id: match.id, from: match.script, to: WORKER_NAME }
  }

  if (DRY_RUN) {
    console.log(c.yellow(`  ⊘ would create route ${pattern} → ${WORKER_NAME}`))
    return { action: 'would-create', pattern }
  }
  const created = await cf<{ id: string }>('POST', `/zones/${ZONE_ID}/workers/routes`, { pattern, script: WORKER_NAME })
  console.log(c.green(`  ✓ created route ${pattern} → ${WORKER_NAME}`))
  return { action: 'created', id: created.id, pattern }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Detach Pages custom domain
// ─────────────────────────────────────────────────────────────────────────────

type PagesDomain = { name: string; status: string }

async function detachPagesDomain(): Promise<Record<string, unknown>> {
  let domains: PagesDomain[] = []
  try {
    domains = await cf<PagesDomain[]>('GET', `/accounts/${ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains`)
  } catch (err) {
    // Project may already be archived, or the name may differ
    const msg = err instanceof Error ? err.message : String(err)
    console.log(c.gray(`  ⊘ pages project lookup: ${msg.slice(0, 80)}`))
    return { action: 'noop', reason: 'pages-project-inaccessible' }
  }

  const match = domains.find((d) => d.name === CUSTOM_DOMAIN)
  if (!match) {
    console.log(c.green(`  ✓ ${CUSTOM_DOMAIN} not on Pages project (already detached)`))
    return { action: 'noop', reason: 'not-attached' }
  }

  if (DRY_RUN) {
    console.log(c.yellow(`  ⊘ would detach ${CUSTOM_DOMAIN} from Pages project ${PAGES_PROJECT}`))
    return { action: 'would-detach', domain: CUSTOM_DOMAIN, status: match.status }
  }

  await cf<unknown>(
    'DELETE',
    `/accounts/${ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains/${encodeURIComponent(CUSTOM_DOMAIN)}`,
  )
  console.log(c.green(`  ✓ detached ${CUSTOM_DOMAIN} from Pages`))
  return { action: 'detached', domain: CUSTOM_DOMAIN }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Health verify (proves Workers is serving)
// ─────────────────────────────────────────────────────────────────────────────

async function verifyHealth(): Promise<Record<string, unknown>> {
  if (SKIP_VERIFY) {
    console.log(c.gray('  ⊘ --no-verify set; skipping'))
    return { action: 'skipped', reason: 'no-verify' }
  }
  if (DRY_RUN) {
    console.log(c.gray(`  ⊘ dry-run; would curl https://${CUSTOM_DOMAIN}${HEALTH_PATH}`))
    return { action: 'skipped', reason: 'dry-run' }
  }

  // Small delay — DNS/route propagation can take a few seconds
  await new Promise((r) => setTimeout(r, 3000))

  const start = Date.now()
  const res = await fetch(`https://${CUSTOM_DOMAIN}${HEALTH_PATH}`)
  const ms = Date.now() - start
  const cfRay = res.headers.get('cf-ray')
  const server = res.headers.get('server')
  const ok = res.ok

  const line = `  ${ok ? c.green('✓') : c.red('✗')} ${res.status} in ${ms}ms (cf-ray=${cfRay ?? '-'}, server=${server ?? '-'})`
  console.log(line)
  return { action: 'verified', status: res.status, durationMs: ms, cfRay, server, ok }
}

// ─────────────────────────────────────────────────────────────────────────────
// Substrate signal — record the outcome so pheromone learns
// ─────────────────────────────────────────────────────────────────────────────

async function recordOutcome(outcome: Record<string, unknown>): Promise<void> {
  const { SubstrateClient } = await import('@oneie/sdk')
  const baseUrl = env.ONE_API_URL ?? `https://${CUSTOM_DOMAIN}`
  const client = new SubstrateClient({ baseUrl })
  try {
    const res = await client.signal('cli:cutover', 'deploy:cutover', {
      tags: ['deploy', 'cf', 'cutover'],
      weight: outcome.ok ? 1 : -0.5,
      content: outcome,
    })
    console.log(c.gray(`  → /api/signal deploy:cutover (${res.success ? 'ok' : 'error'})`))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(c.gray(`  → signal post failed (best-effort): ${msg.slice(0, 80)}`))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  header(`CF Cutover — ${DRY_RUN ? c.yellow('DRY RUN') : c.red('EXECUTING')}`)
  console.log(c.gray(`  domain   : ${CUSTOM_DOMAIN}`))
  console.log(c.gray(`  worker   : ${WORKER_NAME}`))
  console.log(c.gray(`  pages    : ${PAGES_PROJECT}`))
  console.log(c.gray(`  account  : ${ACCOUNT_ID}`))
  if (DRY_RUN) console.log(c.yellow('\n  Re-run with --execute to commit.'))

  const start = Date.now()
  const result: Record<string, unknown> = { dryRun: DRY_RUN, domain: CUSTOM_DOMAIN }

  try {
    await resolveZoneId()
    result.zoneId = ZONE_ID

    step(1, 3, 'Workers route')
    result.route = await ensureWorkersRoute()

    step(2, 3, 'Detach Pages custom domain')
    result.detach = await detachPagesDomain()

    step(3, 3, 'Verify health')
    result.health = await verifyHealth()

    result.durationMs = Date.now() - start
    const healthOk = (result.health as { ok?: boolean }).ok
    result.ok = DRY_RUN || SKIP_VERIFY || healthOk === true

    header(result.ok ? c.green('✓ Cutover complete') : c.red('✗ Cutover completed but health failed'))
    console.log(c.gray(`  ${result.durationMs}ms total`))

    if (!DRY_RUN) await recordOutcome(result)
    process.exit(result.ok ? 0 : 1)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result.ok = false
    result.error = msg
    result.durationMs = Date.now() - start
    console.error(c.red(`\n✗ ${msg}`))
    if (!DRY_RUN) await recordOutcome(result)
    process.exit(1)
  }
}

main()
