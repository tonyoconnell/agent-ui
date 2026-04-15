#!/usr/bin/env npx tsx
/**
 * migrate-brand-owner.ts — Wire brand + owner to the live schema.
 *
 * Live schema uses world.tql vocabulary: `unit`, `skill`, `group`.
 * We add:
 *   - attribute brand (not yet defined in world.tql)
 *   - group owns brand
 *   - unit  owns brand, owns owner
 *   - skill owns brand, owns owner
 *
 * Idempotent: probes each owns-declaration; skips if already present.
 *
 * Usage:
 *   npx tsx scripts/migrate-brand-owner.ts --dry-run
 *   npx tsx scripts/migrate-brand-owner.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

async function ownsAttr(entity: string, attr: string): Promise<boolean> {
  try {
    await query(`match $x isa ${entity}, has ${attr} $y; limit 1;`, 'read')
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

async function attributeExists(attr: string): Promise<boolean> {
  try {
    await query(`match $x isa! ${attr}; limit 1;`, 'read')
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('not found') || msg.includes('invalid') || msg.includes('Unknown') || msg.includes('undefined')) {
      return false
    }
    throw e
  }
}

async function main() {
  console.log(`→ TypeDB: ${TYPEDB_URL}  database=${TYPEDB_DATABASE}`)
  console.log('')

  const parts: string[] = []
  const checks: Array<[string, boolean]> = []

  const hasBrand = await attributeExists('brand')
  checks.push(['attribute brand', hasBrand])
  if (!hasBrand) parts.push('attribute brand, value string;')

  const hasOwner = await attributeExists('owner')
  checks.push(['attribute owner', hasOwner])
  if (!hasOwner) parts.push('attribute owner, value string;')

  const plan: Array<[string, string]> = [
    ['group', 'brand'],
    ['unit', 'brand'],
    ['unit', 'owner'],
    ['skill', 'brand'],
    ['skill', 'owner'],
  ]

  for (const [entity, attr] of plan) {
    const has = await ownsAttr(entity, attr)
    checks.push([`${entity} owns ${attr}`, has])
    if (!has) parts.push(`${entity} owns ${attr};`)
  }

  console.log('Current state:')
  for (const [label, has] of checks) {
    console.log(`  ${has ? '✓' : '·'} ${label}`)
  }
  console.log('')

  if (parts.length === 0) {
    console.log('✓ nothing to do — schema already has everything')
    return
  }

  const migration = `define\n  ${parts.join('\n  ')}\n`
  console.log('Will apply:')
  console.log(migration)

  if (DRY_RUN) {
    console.log('⊘ DRY RUN — not applying')
    return
  }

  await query(migration, 'schema')
  console.log('✓ schema applied')

  // Verify
  for (const [entity, attr] of plan) {
    const ok = await ownsAttr(entity, attr)
    if (!ok) {
      console.error(`✗ verification failed: ${entity} does not own ${attr}`)
      process.exit(1)
    }
  }
  console.log('✓ verified all owns-declarations present')
}

main().catch((e) => {
  console.error('✗ migration failed:', e)
  process.exit(1)
})
