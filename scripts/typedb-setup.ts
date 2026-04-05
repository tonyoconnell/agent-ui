#!/usr/bin/env npx tsx
/**
 * TypeDB Setup Script — Load schema and seed data
 *
 * Usage:
 *   npx tsx scripts/typedb-setup.ts           # Full setup (schema + seed)
 *   npx tsx scripts/typedb-setup.ts --test    # Test connection only
 *   npx tsx scripts/typedb-setup.ts --schema  # Load schema only
 *   npx tsx scripts/typedb-setup.ts --seed    # Seed data only
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load env
const envPath = path.join(__dirname, '..', '.env')
const env: Record<string, string> = {}
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim()
  }
}

const TYPEDB_URL = env.TYPEDB_URL || process.env.TYPEDB_URL || ''
const TYPEDB_DATABASE = env.TYPEDB_DATABASE || process.env.TYPEDB_DATABASE || 'one'
const TYPEDB_USERNAME = env.TYPEDB_USERNAME || process.env.TYPEDB_USERNAME || 'admin'
const TYPEDB_PASSWORD = env.TYPEDB_PASSWORD || process.env.TYPEDB_PASSWORD || ''

if (!TYPEDB_URL || !TYPEDB_PASSWORD) {
  console.error('Missing TYPEDB_URL or TYPEDB_PASSWORD in .env')
  process.exit(1)
}

console.log(`TypeDB: ${TYPEDB_URL}`)
console.log(`Database: ${TYPEDB_DATABASE}`)

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const res = await fetch(`${TYPEDB_URL}/v1/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Signin failed: ${res.status} - ${text}`)
  }

  const data = await res.json() as { token: string }
  return data.token
}

// ─── Query ────────────────────────────────────────────────────────────────────

async function query(
  token: string,
  tql: string,
  txType: 'read' | 'write' | 'schema' = 'read',
  commit = true
): Promise<unknown> {
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      databaseName: TYPEDB_DATABASE,
      transactionType: txType,
      query: tql,
      commit,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Query failed: ${res.status} - ${text}`)
  }

  return res.json()
}

// ─── Database Management ──────────────────────────────────────────────────────

async function listDatabases(token: string): Promise<string[]> {
  const res = await fetch(`${TYPEDB_URL}/v1/databases`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) return []
  const data = await res.json() as { databases?: Array<{ name: string }> }
  // Handle both string[] and {name: string}[] formats
  return (data.databases || []).map(d => typeof d === 'string' ? d : d.name)
}

async function createDatabase(token: string, name: string): Promise<boolean> {
  const res = await fetch(`${TYPEDB_URL}/v1/databases/${name}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  return res.ok
}

// ─── Test Connection ──────────────────────────────────────────────────────────

async function testConnection(): Promise<boolean> {
  console.log('\n--- Testing connection ---')

  try {
    const token = await getToken()
    console.log('Auth: OK')

    const dbs = await listDatabases(token)
    console.log(`Databases: ${dbs.join(', ') || '(none)'}`)

    const hasDb = dbs.includes(TYPEDB_DATABASE)
    console.log(`Database "${TYPEDB_DATABASE}": ${hasDb ? 'EXISTS' : 'NOT FOUND'}`)

    if (hasDb) {
      // Try a simple query - this may fail if schema not loaded yet
      try {
        await query(token, 'match $u isa unit; limit 1;', 'read')
        console.log('Schema: LOADED (found unit type)')
      } catch {
        console.log('Schema: NOT LOADED (need to run --schema)')
      }
    }

    return true
  } catch (e) {
    console.error('Connection failed:', e instanceof Error ? e.message : e)
    return false
  }
}

// ─── Load Schema ──────────────────────────────────────────────────────────────

async function loadSchema(): Promise<boolean> {
  console.log('\n--- Loading schema ---')

  const schemaPath = path.join(__dirname, '..', 'src', 'schema', 'one.tql')
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema not found: ${schemaPath}`)
    return false
  }

  let schema = fs.readFileSync(schemaPath, 'utf-8')

  // Strip ALL comments (TypeQL HTTP API doesn't accept them)
  // Remove # comments (but keep string literals)
  schema = schema
    .split('\n')
    .map(line => {
      // Don't strip inside strings
      const hashIndex = line.indexOf('#')
      if (hashIndex === -1) return line
      // Check if # is inside a string
      const beforeHash = line.slice(0, hashIndex)
      const quotes = (beforeHash.match(/"/g) || []).length
      if (quotes % 2 === 1) return line // Inside a string, keep it
      return beforeHash.trimEnd()
    })
    .filter(line => line.trim().length > 0) // Remove empty lines
    .join('\n')

  console.log(`Schema: ${schema.split('\n').length} lines (comments stripped)`)

  try {
    const token = await getToken()

    // Check if database exists, create if not
    const dbs = await listDatabases(token)
    if (!dbs.includes(TYPEDB_DATABASE)) {
      console.log(`Creating database "${TYPEDB_DATABASE}"...`)
      const created = await createDatabase(token, TYPEDB_DATABASE)
      if (!created) {
        console.error('Failed to create database')
        return false
      }
      console.log('Database created')
    }

    // Load schema
    console.log('Defining schema...')
    await query(token, schema, 'schema', true)
    console.log('Schema: LOADED')

    return true
  } catch (e) {
    console.error('Schema load failed:', e instanceof Error ? e.message : e)
    return false
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seedData(): Promise<boolean> {
  console.log('\n--- Seeding data ---')

  try {
    const token = await getToken()

    // Check if already seeded
    const result = await query(token, 'match $u isa unit, has uid $id; select $id; limit 1;', 'read') as { answers?: unknown[] }
    if (result.answers && result.answers.length > 0) {
      console.log('Data already exists. Skipping seed.')
      return true
    }

    // Seed groups
    const groups = [
      { id: 'group-platform', name: 'Platform', purpose: 'Build and maintain the ONE substrate' },
      { id: 'group-agents', name: 'Agents', purpose: 'AI agent services and integration' },
      { id: 'group-community', name: 'Community', purpose: 'User growth and engagement' },
    ]

    for (const g of groups) {
      await query(token, `
        insert $g isa group,
          has gid "${g.id}",
          has name "${g.name}",
          has purpose "${g.purpose}";
      `, 'write')
    }
    console.log(`Groups: ${groups.length}`)

    // Seed units (8 personas)
    const units = [
      { id: 'executives', name: 'Executives', kind: 'persona' },
      { id: 'engineers', name: 'Engineers', kind: 'persona' },
      { id: 'designers', name: 'Designers', kind: 'persona' },
      { id: 'marketers', name: 'Marketers', kind: 'persona' },
      { id: 'sellers', name: 'Sellers', kind: 'persona' },
      { id: 'creators', name: 'Creators', kind: 'persona' },
      { id: 'young-people', name: 'Young People', kind: 'persona' },
      { id: 'kids', name: 'Kids', kind: 'persona' },
    ]

    for (const u of units) {
      await query(token, `
        insert $u isa unit,
          has uid "${u.id}",
          has name "${u.name}",
          has unit-kind "${u.kind}",
          has status "active";
      `, 'write')
    }
    console.log(`Units: ${units.length}`)

    // Seed paths (pheromone connections between units)
    const edges = [
      { from: 'executives', to: 'engineers', strength: 80 },
      { from: 'engineers', to: 'designers', strength: 65 },
      { from: 'marketers', to: 'sellers', strength: 70 },
      { from: 'creators', to: 'young-people', strength: 55 },
    ]

    for (const e of edges) {
      await query(token, `
        match
          $from isa unit, has uid "${e.from}";
          $to isa unit, has uid "${e.to}";
        insert
          (source: $from, target: $to) isa path,
            has strength ${e.strength}.0,
            has resistance 0.0,
            has traversals 0,
            has revenue 0.0;
      `, 'write')
    }
    console.log(`Paths: ${edges.length}`)

    console.log('Seed: COMPLETE')
    return true
  } catch (e) {
    console.error('Seed failed:', e instanceof Error ? e.message : e)
    return false
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const testOnly = args.includes('--test')
const schemaOnly = args.includes('--schema')
const seedOnly = args.includes('--seed')

async function main() {
  console.log('TypeDB Setup')
  console.log('============')

  if (testOnly) {
    const ok = await testConnection()
    process.exit(ok ? 0 : 1)
  }

  if (schemaOnly) {
    const ok = await loadSchema()
    process.exit(ok ? 0 : 1)
  }

  if (seedOnly) {
    const ok = await seedData()
    process.exit(ok ? 0 : 1)
  }

  // Full setup
  const connected = await testConnection()
  if (!connected) process.exit(1)

  const schemaLoaded = await loadSchema()
  if (!schemaLoaded) process.exit(1)

  const seeded = await seedData()
  if (!seeded) process.exit(1)

  console.log('\n--- Setup Complete ---')
  console.log('Next: run `npm run dev` and test at http://localhost:4321/world')
}

main()
