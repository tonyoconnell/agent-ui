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

// Gateway URL — all queries route through Cloudflare Worker
const GATEWAY_URL = import.meta.env.PUBLIC_GATEWAY_URL || 'https://one-gateway.oneie.workers.dev'

/** Execute a TypeQL query via Cloudflare gateway */
async function query(tql: string, txType: 'read' | 'write' = 'read'): Promise<unknown[]> {
  // Always route through Cloudflare gateway.
  // Timeout: reads get more headroom than writes. TypeDB 3.x's query
  // planner can spend 8-15s on compound join/attr-projection queries
  // (discovery, capability scans). Short writes should still fail
  // fast so /api/signal and friends don't hang a request.
  const timeoutMs = txType === 'write' ? 8000 : 30000
  const res = await fetch(`${GATEWAY_URL}/typedb/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: tql,
      transactionType: txType,
      commit: txType === 'write',
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gateway query failed: ${res.status} - ${text}`)
  }

  const data = (await res.json()) as { answers?: unknown[] }
  return data.answers || []
}

/** Read query (no side effects) */
export const read = (tql: string) => query(tql, 'read')

/** Write query (inserts, updates, deletes) */
export const write = (tql: string) => query(tql, 'write')

/** Parse TypeDB answers into flat key-value objects */
export function parseAnswers(answers: unknown[]): Record<string, unknown>[] {
  return (answers as Array<{ data?: Record<string, { value?: unknown; kind?: string }> }>).map((answer) => {
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

/**
 * Write that reports success without throwing. Returns true if TypeDB
 * accepted the query, false otherwise. Use in loops that must increment
 * `attempted` vs `succeeded` counters so deterministic results don't lie
 * when TypeDB is down (Rule 3).
 */
export const writeTracked = (tql: string): Promise<boolean> =>
  write(tql).then(
    () => true,
    () => false,
  )

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
 *
 * Mirrors world.ts fade() algorithm:
 * - Resistance decays 2× faster than strength (same as in-memory)
 * - Ghost trail floor: strength never drops below strength_before × 0.05
 *   (TypeDB has no peak attribute, so we derive the floor from current value
 *    each cycle — functionally equivalent for the common case)
 * - Clean delete at < 0.01 (separate pass after floor is applied)
 *
 * Note: seasonal factor (age-based multiplier) is skipped here — TypeDB paths
 * don't store lastUsed, and in-memory fade() already handles that dimension.
 */
export async function decay(strengthRate = 0.05, resistanceRate = 0.2): Promise<void> {
  // Ghost floor factor: after applying decay, strength won't drop below 5% of
  // its pre-decay value. Matches world.ts: `if (strength < peak * 0.05) strength = peak * 0.05`.
  // We use current strength as the floor base since TypeDB doesn't track peak.
  const tf = 1 - strengthRate
  const af = 1 - resistanceRate

  await Promise.all([
    // Paths WITH per-path fade-rate: decay strength with ghost floor
    // floor = $s * 0.05 (5% of pre-decay value, matching world.ts ghost trail)
    writeSilent(`
      match $e isa path, has strength $s, has fade-rate $r; $s > 0.01;
      let $decayed = $s * (1.0 - $r);
      let $floor = $s * 0.05;
      let $new_s = max($decayed, $floor);
      delete $s of $e;
      insert $e has strength $new_s;
    `),
    // Paths WITH per-path fade-rate: decay resistance 2x faster (no floor — resistance fully forgives)
    writeSilent(`
      match $e isa path, has resistance $a, has fade-rate $r; $a > 0.01;
      delete $a of $e;
      insert $e has resistance ($a * (1.0 - $r * 2.0));
    `),
    // Paths WITHOUT fade-rate: decay strength with ghost floor using global rate
    writeSilent(`
      match $e isa path, has strength $s; $s > 0.01;
      not { $e has fade-rate $r; };
      let $decayed = $s * ${tf};
      let $floor = $s * 0.05;
      let $new_s = max($decayed, $floor);
      delete $s of $e;
      insert $e has strength $new_s;
    `),
    // Paths WITHOUT fade-rate: decay resistance 2x faster (no floor)
    writeSilent(`
      match $e isa path, has resistance $a; $a > 0.01;
      not { $e has fade-rate $r; };
      delete $a of $e;
      insert $e has resistance ($a * ${af});
    `),
  ])

  // Clean up ghost-floor paths that have been pinned near-zero for a long time.
  // Once the floor value itself drops below 0.01, purge strength (and resistance if also tiny).
  // This mirrors world.ts: `if (strength[e] < 0.01) { delete strength[e]; delete peak[e]; }`
  // The floor of 5% means a path starting at 0.2 takes ~60 cycles to drop below 0.01.
  await Promise.all([
    writeSilent(`
      match $e isa path, has strength $s; $s <= 0.01;
      delete $s of $e;
    `),
    writeSilent(`
      match $e isa path, has resistance $a; $a <= 0.01;
      delete $a of $e;
    `),
  ])
}

/** Execute a TypeQL function (TypeDB 3.0) */
export async function callFunction(
  name: string,
  args: Record<string, unknown> = {},
): Promise<Record<string, unknown>[]> {
  const argStr = Object.entries(args)
    .map(([k, v]) => `$${k} = ${typeof v === 'string' ? `"${v}"` : v}`)
    .join(', ')
  const tql = argStr ? `${name}(${argStr})` : `${name}()`
  return readParsed(tql)
}
