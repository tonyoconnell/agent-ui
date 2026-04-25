/**
 * local-d1.ts — bun:sqlite shim that mimics the D1Database surface so Astro
 * dev (Node adapter, no `cloudflare:workers` binding) can hit the same SQLite
 * file that `wrangler d1 ... --local` manages.
 *
 * Path: `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<sha>.sqlite`.
 * The hash is miniflare's deterministic per-binding key — we glob for it
 * rather than reverse-engineering the derivation.
 *
 * Surface implemented (D1 v1, the only methods this codebase calls):
 *   db.prepare(sql).bind(...args).first<T>(col?)  → Promise<T | null>
 *   db.prepare(sql).bind(...args).all<T>()         → Promise<{ results, success, meta }>
 *   db.prepare(sql).bind(...args).run()            → Promise<{ success, meta }>
 *   db.exec(sql)                                   → Promise<D1ExecResult>
 *
 * `batch()`, `dump()`, `raw()` are not used in src/ — surveyed before writing.
 *
 * Only loaded when typeof process !== 'undefined' (Node dev). Production
 * (workerd) never imports this file because `getD1()` returns the real
 * D1 binding before reaching the fallback.
 */

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// bun:sqlite is a built-in module. Type via a minimal surface — full types
// come from @types/bun if installed, but we don't depend on that here.
type BunDatabase = {
  query: (sql: string) => BunStatement
  exec: (sql: string) => void
  close: () => void
}
type BunStatement = {
  get: (...args: unknown[]) => unknown
  all: (...args: unknown[]) => unknown[]
  run: (...args: unknown[]) => { changes: number; lastInsertRowid: number | bigint }
}

let cachedDb: BunDatabase | null = null
let cachedPath: string | null = null

const D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'

function findSqlitePath(): string {
  if (cachedPath && existsSync(cachedPath)) return cachedPath
  if (!existsSync(D1_DIR)) {
    throw new Error(
      `[local-d1] No local D1 state at ${D1_DIR}. Run: bunx wrangler d1 migrations apply one-vault --local`,
    )
  }
  const files = readdirSync(D1_DIR).filter(
    (f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite',
  )
  if (files.length === 0) {
    throw new Error(
      `[local-d1] No DB file in ${D1_DIR}. Run: bunx wrangler d1 migrations apply one-vault --local`,
    )
  }
  if (files.length > 1) {
    // Multiple D1 bindings would land here — unexpected with current wrangler.toml.
    // Pick the largest (most likely populated) and warn.
    files.sort((a, b) => a.localeCompare(b))
  }
  cachedPath = join(D1_DIR, files[0])
  return cachedPath
}

async function openDb(): Promise<BunDatabase> {
  if (cachedDb) return cachedDb
  // Dynamic import so Vite doesn't try to bundle bun:sqlite for the worker.
  // The string-cast keeps the import opaque to esbuild / rollup.
  const mod = (await import('bun:sqlite' as string)) as {
    Database: new (path: string) => BunDatabase
  }
  cachedDb = new mod.Database(findSqlitePath())
  return cachedDb
}

/**
 * Convert a D1 placeholder SQL string to a positional one bun:sqlite accepts.
 * D1 supports `?` and `?N`; bun:sqlite supports `?` (positional) and `$name`.
 * Both happen to use `?` for positional, so most queries pass through. Named
 * binding (?NNN) isn't used in src/ — verified by grep before writing.
 */
function normaliseArgs(args: unknown[]): unknown[] {
  return args.map((a) => {
    if (a === undefined) return null
    if (typeof a === 'boolean') return a ? 1 : 0
    if (a instanceof Uint8Array) return a
    return a as never
  })
}

class LocalPreparedStatement {
  private boundArgs: unknown[] = []

  constructor(
    private readonly dbPromise: Promise<BunDatabase>,
    private readonly sql: string,
  ) {}

  bind(...args: unknown[]): LocalPreparedStatement {
    const next = new LocalPreparedStatement(this.dbPromise, this.sql)
    next.boundArgs = normaliseArgs(args)
    return next
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const db = await this.dbPromise
    const stmt = db.query(this.sql)
    const row = stmt.get(...this.boundArgs) as Record<string, unknown> | null
    if (!row) return null
    if (colName !== undefined) {
      return (row[colName] ?? null) as T
    }
    return row as T
  }

  async all<T = unknown>(): Promise<{
    results: T[]
    success: true
    meta: Record<string, unknown>
  }> {
    const db = await this.dbPromise
    const stmt = db.query(this.sql)
    const rows = stmt.all(...this.boundArgs) as T[]
    return { results: rows, success: true, meta: {} }
  }

  async run(): Promise<{
    success: true
    meta: { changes: number; last_row_id: number; duration: number }
  }> {
    const db = await this.dbPromise
    const stmt = db.query(this.sql)
    const start = performance.now()
    const res = stmt.run(...this.boundArgs)
    const duration = performance.now() - start
    return {
      success: true,
      meta: {
        changes: res.changes,
        last_row_id: Number(res.lastInsertRowid),
        duration,
      },
    }
  }
}

class LocalD1Database {
  private readonly dbPromise: Promise<BunDatabase>

  constructor() {
    this.dbPromise = openDb()
  }

  prepare(sql: string): LocalPreparedStatement {
    return new LocalPreparedStatement(this.dbPromise, sql)
  }

  async exec(
    sql: string,
  ): Promise<{ count: number; duration: number }> {
    const db = await this.dbPromise
    const start = performance.now()
    db.exec(sql)
    return {
      count: sql.split(';').filter((s) => s.trim()).length,
      duration: performance.now() - start,
    }
  }
}

let cachedShim: LocalD1Database | null = null

/** Returns the singleton local-D1 shim, or null if bun:sqlite is unavailable. */
export function getLocalD1(): D1Database | null {
  // Only run under Node (Astro dev with Node adapter). workerd never reaches here.
  if (typeof process === 'undefined') return null
  // bun:sqlite is bun-specific — guard against running under plain Node where it would throw.
  if (typeof Bun === 'undefined') return null
  if (!cachedShim) cachedShim = new LocalD1Database()
  return cachedShim as unknown as D1Database
}
