#!/usr/bin/env npx tsx
/**
 * migrate-thing-owner.ts — Add `thing owns owner` to the live TypeDB schema.
 *
 * Safe and idempotent. Probes `match $t isa thing, has owner $o; limit 1;`
 * first — if it succeeds, the owns-declaration is already in place and we
 * skip. The `attribute owner` itself is already declared in `world.tql:421`
 * and `sui.tql:119`, so this script only adds the `thing` side.
 *
 * Usage:
 *   npx tsx scripts/migrate-thing-owner.ts --dry-run   # show what would run
 *   npx tsx scripts/migrate-thing-owner.ts             # apply
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.join(__dirname, '..', '.env')
const env: Record<string, string> = {}
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
}

const TYPEDB_URL = env.TYPEDB_URL || process.env.TYPEDB_URL || ''
const TYPEDB_DATABASE = env.TYPEDB_DATABASE || process.env.TYPEDB_DATABASE || 'one'
const TYPEDB_USERNAME = env.TYPEDB_USERNAME || process.env.TYPEDB_USERNAME || 'admin'
const TYPEDB_PASSWORD = env.TYPEDB_PASSWORD || process.env.TYPEDB_PASSWORD || ''
const DRY_RUN = process.argv.includes('--dry-run')

if (!TYPEDB_URL || !TYPEDB_PASSWORD) {
  console.error('✗ Missing TYPEDB_URL or TYPEDB_PASSWORD in .env')
  process.exit(1)
}

// ── TypeDB client (mirrors migrate-auth-schema.ts) ────────────────────────────

let cachedToken = ''
let tokenExpires = 0

async function getToken(): Promise<string> {
  if (cachedToken && tokenExpires > Date.now() + 60_000) return cachedToken
  const res = await fetch(`${TYPEDB_URL}/v1/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Signin failed: ${res.status} - ${await res.text()}`)
  const data = (await res.json()) as { token: string }
  const payload = JSON.parse(atob(data.token.split('.')[1]))
  cachedToken = data.token
  tokenExpires = payload.exp * 1000
  return cachedToken
}

async function query(tql: string, txType: 'read' | 'write' | 'schema' = 'read'): Promise<{ answers?: unknown[] }> {
  const token = await getToken()
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ databaseName: TYPEDB_DATABASE, transactionType: txType, query: tql, commit: true }),
  })
  if (!res.ok) throw new Error(`Query failed: ${res.status} - ${await res.text()}`)
  return res.json() as Promise<{ answers?: unknown[] }>
}

// ── Probe: does thing already own owner? ──────────────────────────────────────

async function thingOwnsOwner(): Promise<boolean> {
  try {
    await query(`match $t isa thing, has owner $o; limit 1;`, 'read')
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (
      msg.includes('not found') ||
      msg.includes('invalid') ||
      msg.includes('Unknown') ||
      msg.includes('undefined') ||
      msg.includes('does not own')
    ) {
      return false
    }
    throw e
  }
}

// ── Schema migration ──────────────────────────────────────────────────────────
//
// `attribute owner, value string;` is already defined in world.tql:421 and
// sui.tql:119. We only need the owns-declaration on `thing`.

const MIGRATION = `
define
  thing owns owner;
`.trim()

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`→ TypeDB: ${TYPEDB_URL}  database=${TYPEDB_DATABASE}`)

  const alreadyOwns = await thingOwnsOwner()
  if (alreadyOwns) {
    console.log('✓ thing already owns owner — nothing to do')
    return
  }

  console.log('· thing does NOT own owner — migration needed')
  console.log('')
  console.log(MIGRATION)
  console.log('')

  if (DRY_RUN) {
    console.log('⊘ DRY RUN — not applying')
    return
  }

  await query(MIGRATION, 'schema')
  console.log('✓ schema applied')

  // Verify
  const now = await thingOwnsOwner()
  if (!now) {
    console.error('✗ verification failed — thing still does not own owner')
    process.exit(1)
  }
  console.log('✓ verified: thing owns owner')
}

main().catch((e) => {
  console.error('✗ migration failed:', e)
  process.exit(1)
})
