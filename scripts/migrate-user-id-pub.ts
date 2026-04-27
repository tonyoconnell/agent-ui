#!/usr/bin/env npx tsx
/**
 * migrate-user-id-pub.ts — Add `auth-user-id-pub` attribute to TypeDB
 *
 * passkey-recognition: deterministic identity = HKDF(master, "user-id-v1").
 * Server uses it as the stable join key for auth-user — same biometric →
 * same userIdPub → same user, on any device, forever.
 *
 * What this defines:
 *   - attribute auth-user-id-pub (string)
 *   - extends entity auth-user with `owns auth-user-id-pub`
 *
 * Idempotent: TypeDB `define` is additive. Re-running is safe.
 *
 * Usage:
 *   npx tsx scripts/migrate-user-id-pub.ts --dry-run
 *   npx tsx scripts/migrate-user-id-pub.ts
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

// ── TypeDB client ─────────────────────────────────────────────────────────────

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

async function query(tql: string, txType: 'read' | 'write' | 'schema' = 'read'): Promise<unknown> {
  const token = await getToken()
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ databaseName: TYPEDB_DATABASE, transactionType: txType, query: tql, commit: true }),
  })
  if (!res.ok) throw new Error(`Query failed: ${res.status} - ${await res.text()}`)
  return res.json()
}

async function attributeExists(name: string): Promise<boolean> {
  try {
    // Probe by querying instances. Unknown attribute throws; known attribute
    // (even with zero instances) returns empty answers.
    await query(`match $x has ${name} $v; limit 1;`, 'read')
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('not found') || msg.includes('invalid') || msg.includes('Unknown') || msg.includes('undefined')) {
      return false
    }
    throw e
  }
}

async function authUserOwnsField(): Promise<boolean> {
  // Attempt a read that joins through the new ownership.
  // If auth-user does not yet `owns auth-user-id-pub`, this throws.
  try {
    await query(`match $u isa auth-user, has auth-user-id-pub $p; limit 1;`, 'read')
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('not found') || msg.includes('invalid') || msg.includes('Unknown') || msg.includes('undefined')) {
      return false
    }
    throw e
  }
}

// ── Migration body ────────────────────────────────────────────────────────────

const SCHEMA = `
define
  attribute auth-user-id-pub, value string;
  auth-user owns auth-user-id-pub;
`

async function main() {
  console.log('Auth user-id-pub Migration')
  console.log('===========================')
  console.log(`TypeDB  : ${TYPEDB_URL}`)
  console.log(`Database: ${TYPEDB_DATABASE}`)
  if (DRY_RUN) console.log('Mode    : DRY RUN (no changes)\n')
  else console.log('Mode    : LIVE\n')

  process.stdout.write('1. Connection ... ')
  try {
    await getToken()
    console.log('OK')
  } catch (e) {
    console.log('FAILED')
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }

  console.log('\n2. Probing ...')
  const attrPresent = await attributeExists('auth-user-id-pub')
  const ownsPresent = attrPresent ? await authUserOwnsField() : false
  console.log(`   attribute auth-user-id-pub        ${attrPresent ? '✓ exists' : '✗ missing'}`)
  console.log(`   auth-user owns auth-user-id-pub  ${ownsPresent ? '✓ exists' : '✗ missing'}`)

  if (attrPresent && ownsPresent) {
    console.log('\n✓ Schema already up to date. Nothing to apply.')
    process.exit(0)
  }

  console.log('\n3. Migration TQL:')
  console.log(SCHEMA)

  if (DRY_RUN) {
    console.log('Re-run without --dry-run to apply.')
    process.exit(0)
  }

  process.stdout.write('4. Applying schema define ... ')
  try {
    await query(SCHEMA, 'schema')
    console.log('OK')
  } catch (e) {
    console.log('FAILED')
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }

  console.log('\n5. Verifying ...')
  const attrAfter = await attributeExists('auth-user-id-pub')
  const ownsAfter = await authUserOwnsField()
  console.log(`   attribute auth-user-id-pub        ${attrAfter ? '✓' : '✗ MISSING'}`)
  console.log(`   auth-user owns auth-user-id-pub  ${ownsAfter ? '✓' : '✗ MISSING'}`)

  if (!attrAfter || !ownsAfter) {
    console.error('\n✗ Verification failed.')
    process.exit(1)
  }

  console.log('\n✓ Migration complete.')
}

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e)
  process.exit(1)
})
