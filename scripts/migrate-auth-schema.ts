#!/usr/bin/env npx tsx
/**
 * migrate-auth-schema.ts — Add BetterAuth entities to TypeDB
 *
 * Safe, additive migration. Only defines types that do not yet exist.
 * Exits non-zero on any unexpected TypeDB error.
 *
 * Usage:
 *   npx tsx scripts/migrate-auth-schema.ts --dry-run   # show what would run
 *   npx tsx scripts/migrate-auth-schema.ts             # apply
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

// ── Schema probe — check what already exists ──────────────────────────────────

async function typeExists(typeName: string): Promise<boolean> {
  try {
    // In TypeDB 3, attempt a data read of that type.
    // If the type is undefined in the schema, this throws.
    // If it exists but has no instances, it returns empty — that's also "exists".
    await query(`match $x isa ${typeName}; limit 1;`, 'read')
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // TypeDB signals unknown type with messages like "Invalid Type" or "not found"
    // A successful query (even empty) means the type exists in the schema
    if (msg.includes('not found') || msg.includes('invalid') || msg.includes('Unknown') || msg.includes('undefined')) {
      return false
    }
    // Any other error (network, auth) — rethrow so we don't mask real problems
    throw e
  }
}

// ── The new auth schema (attributes + entities) ───────────────────────────────
//
// TypeDB define is additive — existing types are untouched.
// Attributes defined before entities that own them.
//
// Includes:
//   - api-key + api-authorization (substrate auth, added after last schema apply)
//   - auth-* entities (BetterAuth human sessions, new)
//
// Epoch millis stored as integer (BetterAuth serialises Date → getTime()).

const API_KEY_SCHEMA = `
attribute api-key-id, value string;
attribute key-hash, value string;
attribute user-id, value string;
attribute permissions, value string;
attribute key-status, value string;
attribute expires-at, value datetime;

entity api-key,
    owns api-key-id @key,
    owns key-hash,
    owns user-id,
    owns permissions,
    owns key-status,
    owns created,
    owns last-used,
    owns expires-at,
    plays api-authorization:api-key;

relation api-authorization,
    relates api-key,
    relates authorized-unit;

unit plays api-authorization:authorized-unit;
`

const AUTH_ATTRIBUTES = `
attribute auth-id, value string;
attribute auth-name, value string;
attribute auth-email, value string;
attribute auth-email-verified, value boolean;
attribute auth-image, value string;
attribute auth-password, value string;
attribute auth-user-id, value string;
attribute auth-token, value string;
attribute auth-ip-address, value string;
attribute auth-user-agent, value string;
attribute auth-account-id, value string;
attribute auth-provider-id, value string;
attribute auth-access-token, value string;
attribute auth-refresh-token, value string;
attribute auth-id-token, value string;
attribute auth-scope, value string;
attribute auth-identifier, value string;
attribute auth-value, value string;
attribute auth-rate-limit-key, value string;
attribute auth-created-at, value integer;
attribute auth-updated-at, value integer;
attribute auth-expires-at, value integer;
attribute auth-access-token-expires-at, value integer;
attribute auth-refresh-token-expires-at, value integer;
attribute auth-last-request, value integer;
attribute auth-count, value integer;
`

const AUTH_ENTITIES = `
entity auth-user,
    owns auth-id @key,
    owns auth-name,
    owns auth-email,
    owns auth-email-verified,
    owns auth-image,
    owns auth-password,
    owns auth-created-at,
    owns auth-updated-at;

entity auth-session,
    owns auth-id @key,
    owns auth-user-id,
    owns auth-token,
    owns auth-expires-at,
    owns auth-ip-address,
    owns auth-user-agent,
    owns auth-created-at,
    owns auth-updated-at;

entity auth-account,
    owns auth-id @key,
    owns auth-account-id,
    owns auth-provider-id,
    owns auth-user-id,
    owns auth-access-token,
    owns auth-refresh-token,
    owns auth-id-token,
    owns auth-access-token-expires-at,
    owns auth-refresh-token-expires-at,
    owns auth-scope,
    owns auth-password,
    owns auth-created-at,
    owns auth-updated-at;

entity auth-verification,
    owns auth-id @key,
    owns auth-identifier,
    owns auth-value,
    owns auth-expires-at,
    owns auth-created-at,
    owns auth-updated-at;

entity auth-rate-limit,
    owns auth-id @key,
    owns auth-rate-limit-key,
    owns auth-count,
    owns auth-last-request;
`

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Auth Schema Migration')
  console.log('=====================')
  console.log(`TypeDB : ${TYPEDB_URL}`)
  console.log(`Database: ${TYPEDB_DATABASE}`)
  if (DRY_RUN) console.log('Mode    : DRY RUN (no changes)\n')
  else console.log('Mode    : LIVE\n')

  // 1. Connection test
  process.stdout.write('1. Connection ... ')
  try {
    await getToken()
    console.log('OK')
  } catch (e) {
    console.log('FAILED')
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }

  // 2. Probe existing schema
  console.log('\n2. Probing existing schema ...')
  const checks = {
    'unit (world.tql baseline)': await typeExists('unit'),
    'api-key': await typeExists('api-key'),
    'auth-user': await typeExists('auth-user'),
    'auth-session': await typeExists('auth-session'),
    'auth-account': await typeExists('auth-account'),
    'auth-verification': await typeExists('auth-verification'),
    'auth-rate-limit': await typeExists('auth-rate-limit'),
  }

  const maxLen = Math.max(...Object.keys(checks).map((k) => k.length))
  for (const [name, exists] of Object.entries(checks)) {
    const pad = ' '.repeat(maxLen - name.length + 2)
    console.log(`   ${name}${pad}${exists ? '✓ exists' : '✗ missing'}`)
  }

  const migrateTargets: Array<{ key: keyof typeof checks; label: string }> = [
    { key: 'api-key', label: 'api-key + api-authorization' },
    { key: 'auth-user', label: 'auth-user' },
    { key: 'auth-session', label: 'auth-session' },
    { key: 'auth-account', label: 'auth-account' },
    { key: 'auth-verification', label: 'auth-verification' },
    { key: 'auth-rate-limit', label: 'auth-rate-limit' },
  ]

  const missing = migrateTargets.filter((t) => !checks[t.key])

  if (missing.length === 0) {
    console.log('\n✓ All types already present. Nothing to migrate.')
    process.exit(0)
  }

  if (!checks['unit (world.tql baseline)']) {
    console.error('\n✗ `unit` type not found — world.tql schema has not been applied.')
    console.error('  Run: npx tsx scripts/typedb-setup.ts --schema first.')
    process.exit(1)
  }

  // 3. Build migration TQL — include api-key block if missing
  const parts: string[] = ['define']
  if (!checks['api-key']) parts.push(API_KEY_SCHEMA)
  const authMissing = ['auth-user', 'auth-session', 'auth-account', 'auth-verification', 'auth-rate-limit'].some(
    (e) => !checks[e as keyof typeof checks],
  )
  if (authMissing) parts.push(AUTH_ATTRIBUTES, AUTH_ENTITIES)

  const migration = parts.join('\n')
  const lineCount = migration.split('\n').filter((l) => l.trim()).length

  console.log(
    `\n3. Migration: ${lineCount} lines (${missing.length} missing: ${missing.map((t) => t.label).join(', ')})`,
  )

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: TQL that would be applied ---')
    console.log(migration)
    console.log('--- end ---')
    console.log('\nRe-run without --dry-run to apply.')
    process.exit(0)
  }

  // 4. Apply
  process.stdout.write('\n4. Applying schema define ... ')
  try {
    await query(migration, 'schema')
    console.log('OK')
  } catch (e) {
    console.log('FAILED')
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }

  // 5. Verify all targets now exist
  console.log('\n5. Verifying ...')
  let allOk = true
  const verifyTargets = ['api-key', 'auth-user', 'auth-session', 'auth-account', 'auth-verification', 'auth-rate-limit']
  for (const entity of verifyTargets) {
    const exists = await typeExists(entity)
    console.log(`   ${entity.padEnd(22)} ${exists ? '✓' : '✗ MISSING — migration may have failed'}`)
    if (!exists) allOk = false
  }

  if (!allOk) {
    console.error('\n✗ Verification failed. Check TypeDB logs.')
    process.exit(1)
  }

  console.log('\n✓ Migration complete.')
  console.log('  Agent auth:  POST /api/auth/agent')
  console.log('  Sign-up:     POST /api/auth/sign-up/email')
  console.log('  Sign-in:     POST /api/auth/sign-in/email')
}

main()
