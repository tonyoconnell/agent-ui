#!/usr/bin/env bun
/**
 * migrate-dev-passkey-hints.ts
 *
 * One-shot migration: read `.dev-passkey-hints.json` and upsert every row
 * into the local D1 sqlite's `vault_passkey_hints` table, then rename the
 * file with a `.migrated-YYYY-MM-DD` suffix so it isn't used again.
 *
 * Idempotent: uses `INSERT ... ON CONFLICT(cred_id) DO NOTHING`.
 * Re-running after success is a no-op (file is renamed, exits "no file").
 */

import { Database } from 'bun:sqlite'
import { existsSync, readdirSync, readFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')
const HINTS_PATH = resolve(ROOT, '.dev-passkey-hints.json')
const D1_DIR = resolve(ROOT, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject')

interface HintRow {
  user_id: string
  pub_key: string
  sign_count: number
  wrapped_master: string | null
  label: string | null
}

function findD1Sqlite(): string | null {
  if (!existsSync(D1_DIR)) return null
  let entries: string[]
  try {
    entries = readdirSync(D1_DIR)
  } catch {
    return null
  }
  for (const name of entries) {
    if (!name.endsWith('.sqlite')) continue
    // Exclude metadata.sqlite — only the data sqlite has vault_passkey_hints
    if (name === 'metadata.sqlite' || name.startsWith('metadata.')) continue
    return resolve(D1_DIR, name)
  }
  return null
}

function main(): number {
  if (!existsSync(HINTS_PATH)) {
    console.log('no file to migrate')
    return 0
  }

  const sqlitePath = findD1Sqlite()
  if (!sqlitePath) {
    console.error(`BLOCKED: no D1 sqlite found at ${D1_GLOB}`)
    return 1
  }
  console.log(`d1: ${sqlitePath}`)

  let raw: string
  try {
    raw = readFileSync(HINTS_PATH, 'utf8')
  } catch (e) {
    console.error(`BLOCKED: cannot read ${HINTS_PATH}: ${e}`)
    return 1
  }

  let parsed: Record<string, HintRow>
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    console.error(`BLOCKED: invalid JSON in ${HINTS_PATH}: ${e}`)
    return 1
  }

  const entries = Object.entries(parsed)
  const total = entries.length
  if (total === 0) {
    console.log(`empty json — nothing to insert; renaming anyway`)
  }

  const db = new Database(sqlitePath)
  let inserted = 0
  let skipped = 0

  try {
    const stmt = db.prepare(
      `INSERT INTO vault_passkey_hints
         (cred_id, user_id, pub_key, sign_count, wrapped_master, label)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(cred_id) DO NOTHING`,
    )

    db.exec('BEGIN')
    try {
      for (const [credId, row] of entries) {
        const result = stmt.run(
          credId,
          row.user_id,
          row.pub_key,
          row.sign_count ?? 0,
          row.wrapped_master ?? null,
          row.label ?? null,
        )
        // bun:sqlite Statement.run returns { changes, lastInsertRowid }
        if (result.changes && result.changes > 0) inserted++
        else skipped++
      }
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      console.error(`BLOCKED: insert failed: ${e}`)
      return 1
    }
  } finally {
    db.close()
  }

  // Rename so it isn't used again
  const today = new Date().toISOString().slice(0, 10)
  const renamed = `${HINTS_PATH}.migrated-${today}`
  try {
    renameSync(HINTS_PATH, renamed)
  } catch (e) {
    console.error(`BLOCKED: insert succeeded but rename failed: ${e} — manual rename required`)
    console.log(`inserted=${inserted} skipped=${skipped} total=${total}`)
    return 1
  }

  console.log(`inserted=${inserted} skipped=${skipped} total=${total}`)
  console.log(`renamed: ${HINTS_PATH} -> ${renamed}`)
  return 0
}

process.exit(main())
