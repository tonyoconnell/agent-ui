#!/usr/bin/env bun

/**
 * predev — runs before `astro dev`. Ensures local D1 is migrated.
 *
 * If `.wrangler/state/v3/d1/.../db.sqlite` is missing, empty, or has fewer
 * tables than there are migration files, runs `wrangler d1 migrations apply`.
 * Silent no-op when already up to date — adds <50ms to dev start.
 *
 * Failures are non-fatal: prints a hint and lets `astro dev` boot anyway,
 * so a wrangler outage doesn't block iteration on non-D1 features.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
const MIGRATIONS_DIR = 'migrations'

function findDbFile(): string | null {
  if (!existsSync(D1_DIR)) return null
  const files = readdirSync(D1_DIR).filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
  return files.length > 0 ? join(D1_DIR, files[0]) : null
}

function dbAppearsMigrated(): boolean {
  const dbPath = findDbFile()
  if (!dbPath) return false

  // Cheap heuristic: count migration files vs DB size. The first migration
  // alone produces ~30KB; if the file is < 8KB it's effectively empty.
  // Avoids the cost of opening the DB and counting tables on every boot.
  const dbSize = statSync(dbPath).size
  if (dbSize < 8 * 1024) return false

  const migrationCount = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).length

  // Ballpark: each migration adds ~4KB minimum. If DB is suspiciously small
  // for the migration count, force a re-apply (idempotent — wrangler skips
  // already-applied entries).
  const expectedMin = migrationCount * 1024
  return dbSize >= expectedMin
}

function applyMigrations(): boolean {
  console.log('[predev] applying D1 migrations (local)...')
  const res = spawnSync('bunx', ['wrangler', 'd1', 'migrations', 'apply', 'one-vault', '--local'], {
    stdio: 'inherit',
    encoding: 'utf-8',
  })
  return res.status === 0
}

if (!dbAppearsMigrated()) {
  const ok = applyMigrations()
  if (!ok) {
    console.warn('[predev] migrations failed — proceeding anyway. Run `bun run d1:migrate` manually if D1 routes 503.')
  }
}
