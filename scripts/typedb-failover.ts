#!/usr/bin/env bun
/**
 * typedb-failover.ts — EU TypeDB replica health check and failover.
 *
 * Usage:
 *   bun run scripts/typedb-failover.ts          # check health, report
 *   bun run scripts/typedb-failover.ts --sync   # restore latest R2 backup to EU cluster
 *   bun run scripts/typedb-failover.ts --drill  # full drill: sync EU + verify round-trip <2min
 *
 * Exit 0 = healthy. Exit 1 = degraded (see output for details).
 *
 * sys-301: EU 150→30ms target; drill <2min.
 */

const args = process.argv.slice(2)
const doSync = args.includes('--sync')
const doDrill = args.includes('--drill')

const US_URL = process.env.TYPEDB_URL ?? 'https://flsiu1-0.cluster.typedb.com:1729'
const EU_URL = process.env.TYPEDB_EU_URL ?? ''
const DB = process.env.TYPEDB_DATABASE ?? 'one'
const USER = process.env.TYPEDB_USERNAME ?? 'admin'
const PASS = process.env.TYPEDB_PASSWORD ?? ''

if (!EU_URL) {
  console.error('[failover] TYPEDB_EU_URL not set — no EU replica configured')
  process.exit(1)
}

async function getToken(baseUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/v1/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USER, password: PASS }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { token: string }
    return data.token
  } catch {
    return null
  }
}

async function checkHealth(label: string, baseUrl: string): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  const token = await getToken(baseUrl)
  const latencyMs = Date.now() - start
  if (!token) {
    console.log(`[failover] ${label}: ✗ unreachable (${latencyMs}ms)`)
    return { ok: false, latencyMs }
  }
  // Smoke query: count units
  try {
    const res = await fetch(`${baseUrl}/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: `match $u isa unit; select $u; limit 1;`, database: DB }),
    })
    const roundtrip = Date.now() - start
    const ok = res.ok
    console.log(`[failover] ${label}: ${ok ? '✓' : '✗'} ${roundtrip}ms`)
    return { ok, latencyMs: roundtrip }
  } catch {
    return { ok: false, latencyMs }
  }
}

async function syncEuFromBackup(): Promise<void> {
  console.log('[failover] syncing latest R2 backup to EU cluster...')
  const { execSync } = await import('node:child_process')
  // Reuse restore-typedb.ts logic: pass EU gateway override via env
  const env = { ...process.env, TYPEDB_GATEWAY_URL: EU_URL }
  try {
    execSync('bun run scripts/restore-typedb.ts', { env, stdio: 'inherit' })
    console.log('[failover] EU sync complete')
  } catch {
    console.error('[failover] EU sync failed — check restore-typedb.ts output')
    process.exit(1)
  }
}

async function main() {
  const drillStart = Date.now()
  console.log(`[failover] checking US=${US_URL}`)
  console.log(`[failover] checking EU=${EU_URL}`)
  console.log()

  const [us, eu] = await Promise.all([checkHealth('US', US_URL), checkHealth('EU', EU_URL)])

  console.log()
  if (!us.ok && !eu.ok) {
    console.error('[failover] BOTH clusters unreachable — platform degraded')
    process.exit(1)
  }
  if (!eu.ok) {
    console.warn('[failover] EU cluster unreachable — traffic falling back to US primary')
    console.warn('[failover] set TYPEDB_EU_URL="" in gateway to disable EU routing, or run --sync to restore EU')
    process.exit(1)
  }
  if (!us.ok) {
    console.warn('[failover] US primary unreachable — EU serving all traffic (read-only mode)')
    process.exit(1)
  }

  console.log('[failover] both clusters healthy')

  if (doSync || doDrill) {
    await syncEuFromBackup()
  }

  if (doDrill) {
    const elapsed = Date.now() - drillStart
    const target = 2 * 60 * 1000 // 2 min
    if (elapsed > target) {
      console.error(`[failover] drill FAILED: ${elapsed}ms > ${target}ms target`)
      process.exit(1)
    }
    console.log(`[failover] drill PASSED: ${elapsed}ms (target <${target}ms)`)
  }
}

main().catch((e) => {
  console.error('[failover]', e)
  process.exit(1)
})
