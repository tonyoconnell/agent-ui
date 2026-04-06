/**
 * TypeDB Client — works from browser (via Worker) and server (direct)
 *
 * Browser: fetch → Cloudflare Worker (api.one.ie) → TypeDB Cloud
 * Server:  fetch → TypeDB Cloud directly (with JWT)
 *
 * Usage:
 *   import { read, write, parseAnswers } from '@/lib/typedb'
 *
 *   const answers = await read('match $u isa unit; $u has name $n; select $n;')
 *   const rows = parseAnswers(answers)
 */

// Gateway URL (browser goes through Worker, server can go direct)
const GATEWAY_URL = import.meta.env.PUBLIC_GATEWAY_URL || 'https://one-gateway.oneie.workers.dev'

// Public config only (credentials moved to runtime/worker env)
const TYPEDB_URL = import.meta.env.TYPEDB_URL || ''
const TYPEDB_DATABASE = import.meta.env.TYPEDB_DATABASE || 'one'

// Token cache (server-side direct mode)
let cachedToken: { token: string; expires: number } | null = null

async function getDirectToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) {
    return cachedToken.token
  }

  // Credentials: import.meta.env (Astro SSR) → globalThis (CF Worker) → process.env (Node)
  const username = import.meta.env.TYPEDB_USERNAME || (globalThis as any).TYPEDB_USERNAME || 'admin'
  const password = import.meta.env.TYPEDB_PASSWORD || (globalThis as any).TYPEDB_PASSWORD || ''

  if (!password) {
    throw new Error('TYPEDB_PASSWORD not configured. Set in .env, wrangler secret, or TYPEDB_PASSWORD env var')
  }

  const res = await fetch(`${TYPEDB_URL}/v1/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) throw new Error(`TypeDB signin failed: ${res.status}`)

  const data = await res.json() as { token: string }
  const payload = JSON.parse(atob(data.token.split('.')[1]))
  cachedToken = { token: data.token, expires: payload.exp * 1000 }
  return cachedToken.token
}

/** Execute a TypeQL query via gateway or direct */
async function query(tql: string, txType: 'read' | 'write' = 'read'): Promise<unknown[]> {
  // Server-side with direct TypeDB URL configured → skip gateway
  if (typeof window === 'undefined' && TYPEDB_URL) {
    const token = await getDirectToken()
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
        commit: txType === 'write',
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`TypeDB query failed: ${res.status} - ${text}`)
    }
    const data = await res.json() as { answers?: unknown[] }
    return data.answers || []
  }

  // Browser or server without direct config → go through gateway
  const res = await fetch(`${GATEWAY_URL}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: tql,
      transactionType: txType,
      commit: txType === 'write',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gateway query failed: ${res.status} - ${text}`)
  }

  const data = await res.json() as { answers?: unknown[] }
  return data.answers || []
}

/** Read query (no side effects) */
export const read = (tql: string) => query(tql, 'read')

/** Write query (inserts, updates, deletes) */
export const write = (tql: string) => query(tql, 'write')

/** Parse TypeDB answers into flat key-value objects */
export function parseAnswers(answers: unknown[]): Record<string, unknown>[] {
  return (answers as Array<{ data?: Record<string, { value?: unknown; kind?: string }> }>).map(answer => {
    const result: Record<string, unknown> = {}
    if (!answer?.data) return result

    for (const [varName, concept] of Object.entries(answer.data)) {
      if (concept?.value !== undefined) {
        result[varName] = concept.value
      }
    }
    return result
  })
}

/** Convenience: read + parse in one call */
export async function readParsed(tql: string): Promise<Record<string, unknown>[]> {
  const answers = await read(tql)
  return parseAnswers(answers)
}

/** Convenience: write, swallow errors (fire-and-forget) */
export const writeSilent = (tql: string) => write(tql).catch(() => {})

/** Execute multiple write queries in sequence */
export async function writeBatch(queries: string[]): Promise<void> {
  for (const tql of queries) {
    await write(tql)
  }
}

/**
 * Asymmetric decay: strength fades slow, resistance fades 2x faster.
 * Per-path fade-rate when set, falls back to global defaults.
 * From ant biology: success persists, failure forgives.
 */
export async function decay(strengthRate = 0.05, resistanceRate = 0.20): Promise<void> {
  const tf = 1 - strengthRate
  const af = 1 - resistanceRate

  await Promise.all([
    // Paths WITH per-path fade-rate: use it
    writeSilent(`
      match $e isa path, has strength $s, has fade-rate $r; $s > 0.01;
      delete $s of $e;
      insert $e has strength ($s * (1.0 - $r));
    `),
    writeSilent(`
      match $e isa path, has resistance $a, has fade-rate $r; $a > 0.01;
      delete $a of $e;
      insert $e has resistance ($a * (1.0 - $r * 2.0));
    `),
    // Paths WITHOUT fade-rate: use global defaults
    writeSilent(`
      match $e isa path, has strength $s; $s > 0.01;
      not { $e has fade-rate $r; };
      delete $s of $e;
      insert $e has strength ($s * ${tf});
    `),
    writeSilent(`
      match $e isa path, has resistance $a; $a > 0.01;
      not { $e has fade-rate $r; };
      delete $a of $e;
      insert $e has resistance ($a * ${af});
    `),
  ])
}

/** Execute a TypeQL function (TypeDB 3.0) */
export async function callFunction(name: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>[]> {
  const argStr = Object.entries(args)
    .map(([k, v]) => `$${k} = ${typeof v === 'string' ? `"${v}"` : v}`)
    .join(', ')
  const tql = argStr ? `${name}(${argStr})` : `${name}()`
  return readParsed(tql)
}
