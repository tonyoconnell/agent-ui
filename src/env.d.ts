/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>

interface Env {
  // Cloudflare bindings
  DB: D1Database
  KV: KVNamespace
  QUEUE: Queue
  R2: R2Bucket

  // TypeDB (vars in wrangler.toml)
  TYPEDB_URL: string
  TYPEDB_DATABASE: string

  // Secrets (set via wrangler secret put)
  TYPEDB_USERNAME: string
  TYPEDB_PASSWORD: string
  ANTHROPIC_API_KEY: string
  CLOUDFLARE_GLOBAL_API_KEY: string
}

declare namespace App {
  interface Locals extends Runtime {
    user: { id: string; name: string; email: string } | null
    paths?: Record<string, { strength: number; resistance: number }>
    units?: Record<string, { kind: string; status: string }>
  }
}
