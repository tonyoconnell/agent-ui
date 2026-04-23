/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  // Cloudflare bindings
  DB: D1Database
  KV: KVNamespace
  QUEUE: Queue
  R2: R2Bucket
  ASSETS: Fetcher

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

// Astro 6 + @astrojs/cloudflare v13:
//   - adapter `Runtime` type shrunk to { cfContext: ExecutionContext }
//   - `Astro.locals.runtime.env` was removed — canonical is now
//     `import { env } from "cloudflare:workers"`.
// This shim keeps legacy `locals?.runtime?.env?.DB` typing-legal for the
// 5 API routes that still use it. Callers already guard on `if (!db)`,
// so undefined-at-runtime is handled gracefully.
// TODO(cycle-2-plus): migrate callers to `cloudflare:workers` env import.
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
    cspNonce: string
    paths?: Record<string, { strength: number; resistance: number }>
    units?: Record<string, { kind: string; status: string }>
  }
}
