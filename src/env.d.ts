/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  // Cloudflare bindings
  DB: D1Database
  KV: KVNamespace
  QUEUE: Queue
  R2: R2Bucket

  // TypeDB public config (vars in wrangler.toml)
  TYPEDB_URL: string
  TYPEDB_DATABASE: string

  // Secrets (set via wrangler secret put — NOT in .env)
  // CRITICAL: TYPEDB_USERNAME and TYPEDB_PASSWORD must be set via wrangler secret put
  // Do not expose in build-time env. Access from globalThis in runtime context only.
  TYPEDB_USERNAME?: string
  TYPEDB_PASSWORD?: string
  ANTHROPIC_API_KEY?: string
  CLOUDFLARE_GLOBAL_API_KEY?: string
}

// Astro 6 + @astrojs/cloudflare v13 removed `Astro.locals.runtime.env`.
// Canonical replacement is `import { env } from 'cloudflare:workers'`.
// Shim keeps the old `locals?.runtime?.env?.DB` type-legal; callers are
// already optional-chained and guard on `if (!db)`, so undefined-at-runtime
// behaves as "no binding" rather than crashing. TODO: migrate callers.
declare namespace App {
  interface Locals {
    runtime?: {
      env: Env
      cf?: unknown
      ctx?: ExecutionContext
      caches?: CacheStorage
    }
    cfContext?: ExecutionContext
    user: { id: string; name: string; email: string } | null
    paths?: Record<string, { strength: number; resistance: number }>
    units?: Record<string, { kind: string; status: string }>
  }
}
