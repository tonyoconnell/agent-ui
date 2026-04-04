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
const GATEWAY_URL = import.meta.env.PUBLIC_GATEWAY_URL || 'http://localhost:8787'

// Server-side direct config (optional — falls back to gateway)
const TYPEDB_URL = import.meta.env.TYPEDB_URL || ''
const TYPEDB_DATABASE = import.meta.env.TYPEDB_DATABASE || 'one'
const TYPEDB_USERNAME = import.meta.env.TYPEDB_USERNAME || 'admin'
const TYPEDB_PASSWORD = import.meta.env.TYPEDB_PASSWORD || ''

// Token cache (server-side direct mode)
let cachedToken: { token: string; expires: number } | null = null

async function getDirectToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) {
    return cachedToken.token
  }

  const res = await fetch(`${TYPEDB_URL}/typedb/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
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
    const res = await fetch(`${TYPEDB_URL}/typedb/query`, {
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
  const res = await fetch(`${GATEWAY_URL}/typedb/query`, {
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
 * Asymmetric decay: trail fades slow, alarm fades 2x faster.
 * Per-path fade-rate when set, falls back to global defaults.
 * From ant biology: success persists, failure forgives.
 */
export async function decay(trailRate = 0.05, alarmRate = 0.20): Promise<void> {
  const tf = 1 - trailRate
  const af = 1 - alarmRate

  await Promise.all([
    // Paths WITH per-path fade-rate: use it
    writeSilent(`
      match $e isa path, has strength $s, has fade-rate $r; $s > 0.01;
      delete $s of $e;
      insert $e has strength ($s * (1.0 - $r));
    `),
    writeSilent(`
      match $e isa path, has alarm $a, has fade-rate $r; $a > 0.01;
      delete $a of $e;
      insert $e has alarm ($a * (1.0 - $r * 2.0));
    `),
    // Paths WITHOUT fade-rate: use global defaults
    writeSilent(`
      match $e isa path, has strength $s; $s > 0.01;
      not { $e has fade-rate $r; };
      delete $s of $e;
      insert $e has strength ($s * ${tf});
    `),
    writeSilent(`
      match $e isa path, has alarm $a; $a > 0.01;
      not { $e has fade-rate $r; };
      delete $a of $e;
      insert $e has alarm ($a * ${af});
    `),
    // Trails: always global (no per-trail fade-rate)
    writeSilent(`
      match $t isa trail, has trail-pheromone $tp; $tp > 0.01;
      delete $tp of $t;
      insert $t has trail-pheromone ($tp * ${tf});
    `),
    writeSilent(`
      match $t isa trail, has alarm-pheromone $ap; $ap > 0.01;
      delete $ap of $t;
      insert $t has alarm-pheromone ($ap * ${af});
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
