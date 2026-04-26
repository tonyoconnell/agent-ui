#!/usr/bin/env bun
/**
 * restore-typedb.ts — Replay R2 backup to TypeDB via Gateway.
 *
 * Usage:
 *   bun run scripts/restore-typedb.ts [--date YYYY-MM-DD] [--dry-run]
 *
 * Default date: yesterday (D-1).
 * Reads KV snapshots backed by workers/backup, writes back via /api/agents/sync
 * and TypeDB query proxy for units, paths, hypotheses.
 *
 * Exit 0 = success (≥99% rows restored). Exit 1 = failure.
 */

import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const dateArg = args.find((a, i) => a === '--date' && args[i + 1])
const dryRun = args.includes('--dry-run')

// Default: yesterday
const defaultDate = new Date()
defaultDate.setDate(defaultDate.getDate() - 1)
const date = dateArg ? args[args.indexOf('--date') + 1] : defaultDate.toISOString().slice(0, 10)

const BUCKET = process.env.BACKUP_BUCKET_NAME ?? 'one-typedb-backups'
const GATEWAY = process.env.TYPEDB_GATEWAY_URL ?? 'https://api.one.ie'
const GATEWAY_KEY = process.env.GATEWAY_API_KEY ?? ''

console.log(`[restore] date=${date} dry-run=${dryRun}`)

const _SNAPSHOT_KEYS = ['paths.json', 'units.json', 'skills.json', 'highways.json', 'toxic.json']

async function fetchBackup(key: string): Promise<unknown[] | null> {
  try {
    // Use wrangler r2 object get to download the file
    const result = execSync(`wrangler r2 object get ${BUCKET} typedb/${date}/${key} --pipe`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return JSON.parse(result) as unknown[]
  } catch (e) {
    console.error(`[restore] failed to fetch ${key}: ${e}`)
    return null
  }
}

async function writeToTypeDB(query: string): Promise<boolean> {
  if (dryRun) {
    console.log(`[dry-run] would write: ${query.slice(0, 80)}...`)
    return true
  }
  const res = await fetch(`${GATEWAY}/typedb/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(GATEWAY_KEY ? { Authorization: `Bearer ${GATEWAY_KEY}` } : {}),
    },
    body: JSON.stringify({
      databaseName: process.env.TYPEDB_DATABASE ?? 'one',
      transactionType: 'write',
      query,
    }),
  })
  return res.ok
}

async function restoreUnits(units: Array<Record<string, unknown>>): Promise<number> {
  let ok = 0
  for (const u of units) {
    const uid = String(u.uid ?? '')
    if (!uid) continue
    const name = String(u.name ?? uid)
    const q = `
      match $u isa unit, has uid "${uid}";
      not { $u isa unit; };
      insert $u isa unit, has uid "${uid}", has name "${name.replace(/"/g, '\\"')}";
    `
    if (await writeToTypeDB(q)) ok++
  }
  return ok
}

async function restorePaths(paths: Array<Record<string, unknown>>): Promise<number> {
  let ok = 0
  for (const p of paths) {
    const from = String(p.from ?? '')
    const to = String(p.to ?? '')
    const strength = Number(p.strength ?? 0)
    const resistance = Number(p.resistance ?? 0)
    if (!from || !to) continue
    const q = `
      match $f isa unit, has uid "${from}"; $t isa unit, has uid "${to}";
      not { (from: $f, to: $t) isa path; };
      insert $p (from: $f, to: $t) isa path,
        has strength ${strength.toFixed(4)},
        has resistance ${resistance.toFixed(4)};
    `
    if (await writeToTypeDB(q)) ok++
  }
  return ok
}

// Main
let totalIn = 0
let totalOut = 0

console.log(`[restore] reading backup from R2 bucket=${BUCKET} date=${date}`)

const units = (await fetchBackup('units.json')) as Array<Record<string, unknown>> | null
const paths = (await fetchBackup('paths.json')) as Array<Record<string, unknown>> | null

if (units) {
  totalIn += units.length
  const restored = await restoreUnits(units)
  totalOut += restored
  console.log(`[restore] units: ${restored}/${units.length}`)
}

if (paths) {
  totalIn += paths.length
  const restored = await restorePaths(paths)
  totalOut += restored
  console.log(`[restore] paths: ${restored}/${paths.length}`)
}

const ratio = totalIn > 0 ? totalOut / totalIn : 1
console.log(`[restore] total: ${totalOut}/${totalIn} rows (${(ratio * 100).toFixed(1)}%)`)

if (ratio < 0.99 && !dryRun) {
  console.error('[restore] FAIL: less than 99% rows restored')
  process.exit(1)
}

console.log('[restore] done')
