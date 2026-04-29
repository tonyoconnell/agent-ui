/**
 * Lazy D1 Dialect for Kysely
 *
 * Creates a Kysely dialect that defers the D1 binding lookup until the first
 * query executes. This lets the Kysely/Better Auth instance be constructed at
 * module level (no CF env yet) while the actual DB access only happens inside
 * a request handler (where `cloudflare:workers` env is available).
 *
 * Used by auth.ts so Better Auth uses D1 for fast, local auth storage instead
 * of routing every session/verification lookup through TypeDB (~100ms RTT).
 */

import type {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  DialectAdapter,
  Driver,
  Kysely,
  QueryCompiler,
  QueryResult,
} from 'kysely'
import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from 'kysely'

class D1Connection implements DatabaseConnection {
  constructor(private readonly db: D1Database) {}

  async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    const result = await this.db
      .prepare(query.sql)
      .bind(...(query.parameters as unknown[]))
      .all<R>()
    return {
      rows: result.results ?? [],
      numAffectedRows: result.meta.changes != null ? BigInt(result.meta.changes) : undefined,
      insertId: result.meta.last_row_id != null ? BigInt(result.meta.last_row_id) : undefined,
    }
  }

  async *streamQuery(): AsyncGenerator<never> {
    throw new Error('D1 does not support streaming queries')
  }
}

class LazyD1Driver implements Driver {
  private connection: D1Connection | null = null

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      const mod = (await import('cloudflare:workers' as string)) as { env?: { DB?: D1Database } }
      const db = mod.env?.DB
      if (!db) throw new Error('D1 binding "DB" not found — ensure [[d1_databases]] binding = "DB" in wrangler.toml')
      this.connection = new D1Connection(db)
    }
    return this.connection
  }

  async beginTransaction(): Promise<void> {
    throw new Error('D1 does not support interactive transactions')
  }
  async commitTransaction(): Promise<void> {}
  async rollbackTransaction(): Promise<void> {}
  async releaseConnection(): Promise<void> {}
  async destroy(): Promise<void> {
    this.connection = null
  }
}

export class LazyD1Dialect implements Dialect {
  createAdapter(): DialectAdapter {
    return new SqliteAdapter()
  }
  createDriver(): Driver {
    return new LazyD1Driver()
  }
  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db)
  }
  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler()
  }
}
