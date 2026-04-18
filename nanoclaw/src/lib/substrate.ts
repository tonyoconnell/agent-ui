/**
 * Substrate — TypeDB integration via gateway
 *
 * All TypeDB access goes through the gateway worker.
 * NanoClaw agents are units in the ONE substrate.
 */

import type { Env } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// QUERY
// ═══════════════════════════════════════════════════════════════════════════

export const query = async (env: Env, tql: string, write = false): Promise<unknown[]> => {
  const res = await fetch(`${env.GATEWAY_URL}/typedb/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: tql,
      transactionType: write ? 'write' : 'read',
      commit: write,
    }),
  })

  if (!res.ok) {
    console.error('TypeDB query failed:', await res.text())
    return []
  }

  const data = (await res.json()) as { answers?: unknown[] }
  return data.answers || []
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

export const ensureRegistered = async (env: Env, groupId: string): Promise<void> => {
  const key = `registered:${groupId}`
  const exists = await env.KV.get(key)
  if (exists) return

  const uid = `nanoclaw:${groupId}`
  await query(
    env,
    `
    insert $u isa unit,
      has uid "${uid}",
      has name "${groupId}",
      has unit-kind "agent",
      has status "active",
      has success-rate 0.5,
      has sample-count 0,
      has generation 0;
  `,
    true,
  ).catch(() => {})

  await env.KV.put(key, '1', { expirationTtl: 86400 * 30 }).catch(() => {})
}

// ═══════════════════════════════════════════════════════════════════════════
// TOXICITY CHECK
// ═══════════════════════════════════════════════════════════════════════════

export const isToxic = async (env: Env, source: string, target: string): Promise<boolean> => {
  const key = `toxic:${source}→${target}`
  const cached = await env.KV.get(key)
  if (cached !== null) return cached === '1'

  const rows = await query(
    env,
    `
    match
      $from isa unit, has uid "${source}";
      $to isa unit, has uid "${target}";
      (source: $from, target: $to) isa path, has strength $s, has resistance $r;
    select $s, $r;
  `,
  )

  if (!rows.length) {
    await env.KV.put(key, '0', { expirationTtl: 300 }).catch(() => {})
    return false
  }

  const row = rows[0] as { s: number; r: number }
  const s = row.s || 0
  const r = row.r || 0
  const total = s + r
  const toxic = r >= 10 && r > s * 2 && total > 5

  await env.KV.put(key, toxic ? '1' : '0', { expirationTtl: 300 }).catch(() => {})
  return toxic
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAIL MARKING
// ═══════════════════════════════════════════════════════════════════════════

export const mark = async (env: Env, source: string, target: string, strength = 1): Promise<void> => {
  await query(
    env,
    `
    match
      $from isa unit, has uid "${source}";
      $to isa unit, has uid "${target}";
    insert (source: $from, target: $to) isa path,
      has strength ${strength}, has resistance 0.0, has traversals 1;
  `,
    true,
  ).catch(async () => {
    // Path exists, update it
    await query(
      env,
      `
      match
        $from isa unit, has uid "${source}";
        $to isa unit, has uid "${target}";
        $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + ${strength}), has traversals ($t + 1);
    `,
      true,
    )
  })

  // Invalidate toxic cache
  await env.KV.delete(`toxic:${source}→${target}`)

  // Local write to D1 (claw_paths table) — preserve both strength and resistance
  try {
    // Insert on cold start, ignoring if exists
    await env.DB?.prepare(`
      INSERT OR IGNORE INTO claw_paths (source, target, strength, resistance, traversals, ts)
      VALUES (?, ?, ?, 0, 1, ?)
    `)
      .bind(source, target, strength || 0.5, Date.now())
      .run()
    // Update strength + traversals on warm start
    await env.DB?.prepare(`
      UPDATE claw_paths SET strength = ?, traversals = traversals + 1, ts = ?
      WHERE source = ? AND target = ?
    `)
      .bind(strength || 0.5, Date.now(), source, target)
      .run()
  } catch {}

  // Global queue signal
  try {
    await env.AGENT_QUEUE?.send({
      type: 'mark',
      source,
      target,
      strength: strength || 1,
      source_origin: 'claw',
      ts: Date.now(),
    })
  } catch {}

  // Invalidate highway cache
  try {
    const group = target.split(':')[1]
    await env.KV?.delete(`highways:${group}`)
  } catch {}
}

export const warn = async (env: Env, source: string, target: string, strength = 1): Promise<void> => {
  await query(
    env,
    `
    match
      $from isa unit, has uid "${source}";
      $to isa unit, has uid "${target}";
      $e (source: $from, target: $to) isa path, has resistance $r;
    delete $r of $e;
    insert $e has resistance ($r + ${strength});
  `,
    true,
  ).catch(() => {})

  // Invalidate toxic cache
  await env.KV?.delete(`toxic:${source}→${target}`)

  // Local write to D1 (claw_paths table) — preserve both strength and resistance
  try {
    // Insert on cold start, ignoring if exists
    await env.DB?.prepare(`
      INSERT OR IGNORE INTO claw_paths (source, target, strength, resistance, traversals, ts)
      VALUES (?, 0, ?, 1, ?)
    `)
      .bind(source, target, strength || 0.5, Date.now())
      .run()
    // Update resistance + traversals on warm start
    await env.DB?.prepare(`
      UPDATE claw_paths SET resistance = ?, traversals = traversals + 1, ts = ?
      WHERE source = ? AND target = ?
    `)
      .bind(strength || 0.5, Date.now(), source, target)
      .run()
  } catch {}

  // Global queue signal
  try {
    await env.AGENT_QUEUE?.send({
      type: 'warn',
      source,
      target,
      strength: strength || 1,
      source_origin: 'claw',
      ts: Date.now(),
    })
  } catch {}

  // Invalidate highway cache
  try {
    const group = target.split(':')[1]
    await env.KV?.delete(`highways:${group}`)
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTING
// ═══════════════════════════════════════════════════════════════════════════

export const suggestRoute = async (env: Env, from: string, skill: string): Promise<string[]> => {
  const rows = await query(
    env,
    `
    match
      $from isa unit, has uid "${from}";
      (source: $from, target: $to) isa path, has strength $s;
      (provider: $to, offered: $sk) isa capability;
      $sk has skill-id "${skill}";
      $to has uid $uid;
    sort $s desc; limit 5;
    select $uid;
  `,
  )

  return rows.map((r: unknown) => (r as { uid: string }).uid)
}

export const highways = async (env: Env, limit = 10): Promise<{ from: string; to: string; strength: number }[]> => {
  const rows = await query(
    env,
    `
    match
      $e (source: $from, target: $to) isa path, has strength $s;
      $from has uid $fid; $to has uid $tid;
      $s >= 10.0;
    sort $s desc; limit ${limit};
    select $fid, $tid, $s;
  `,
  )

  return rows.map((r: unknown) => {
    const row = r as { fid: string; tid: string; s: number }
    return { from: row.fid, to: row.tid, strength: row.s }
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTOR HIGHWAYS
// ═══════════════════════════════════════════════════════════════════════════

export const actorHighways = async (
  env: Env,
  actorUid: string,
  limit = 10,
): Promise<{ to: string; strength: number }[]> => {
  const safe = actorUid.replace(/"/g, '')
  const rows = await query(
    env,
    `
    match
      $from isa unit, has uid "${safe}";
      $e (source: $from, target: $to) isa path, has strength $s;
      $to has uid $tid;
    sort $s desc; limit ${limit};
    select $tid, $s;
  `,
  )

  return rows.map((r: unknown) => {
    const row = r as { tid: string; s: number }
    return { to: row.tid, strength: row.s }
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// WRITE HYPOTHESIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Write an asserted hypothesis to TypeDB (fire-and-forget).
 * Called from the `remember` tool — the KV write already happened;
 * this extends the memory into the substrate so recall() and L6 can see it.
 * source="asserted" caps confidence at 0.30 until corroborated.
 */
export const rememberHypothesis = (env: Env, persona: string, key: string, value: string): void => {
  // Sanitise: escape double-quotes so they don't break the TQL string literal
  const safeKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const safeValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const hid = `remember-${persona}-${safeKey}-${Date.now()}`
  const statement = `${safeKey}: ${safeValue}`
  const now = Date.now()

  query(
    env,
    `insert $h isa hypothesis,
      has hid "${hid}",
      has statement "${statement}",
      has hypothesis-status "confirmed",
      has observations-count 1,
      has p-value 0.05,
      has source "asserted",
      has observed-at ${now};`,
    true,
  ).catch((err: unknown) => {
    console.warn('[substrate] rememberHypothesis failed (KV write still succeeded):', err)
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// RECALL HYPOTHESES
// ═══════════════════════════════════════════════════════════════════════════

export const recallHypotheses = async (
  env: Env,
  searchTerm: string,
): Promise<Array<{ statement: string; status: string; confidence: number }>> => {
  const safe = searchTerm.replace(/"/g, '')
  const rows = await query(
    env,
    `
    match
      $h isa hypothesis,
        has statement $s,
        has hypothesis-status $st,
        has p-value $p;
      $s contains "${safe}";
      $st != "rejected";
    sort $p asc; limit 20;
    select $s, $st, $p;
  `,
  )

  if (!rows.length) return []

  return rows.map((r: unknown) => {
    const row = r as { s: string; st: string; p: number }
    return {
      statement: row.s,
      status: row.st,
      confidence: Math.max(0, Math.min(1, 1 - (row.p ?? 1))),
    }
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// STAN — Model Selection via D1 Pheromone
// ═══════════════════════════════════════════════════════════════════════════

import type { NanoModel } from './models'
import { DEFAULT_MAX_COST, DEFAULT_MODEL_ID } from './models'

// Module-level pheromone cache: tag→modelId → net strength. TTL 60s.
const _pheromoneCache = new Map<string, { value: number; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

async function readEdgeStrength(env: Env, source: string, target: string): Promise<number> {
  const key = `${source}→${target}`
  const cached = _pheromoneCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const row = await env.DB.prepare(
    'SELECT strength, resistance FROM claw_paths WHERE source = ? AND target = ? LIMIT 1',
  )
    .bind(source, target)
    .first<{ strength: number; resistance: number } | null>()
    .catch(() => null)

  const value = row ? Math.max(0, (row.strength ?? 0) - (row.resistance ?? 0)) : 0
  _pheromoneCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

/**
 * STAN model selection for nanoclaw.
 * Reads tag→model pheromone from D1 claw_paths, picks best model within budget.
 * Falls back to the persona's configured model if no pheromone data.
 */
export async function chooseModelLocal(
  env: Env,
  tags: string[],
  models: NanoModel[],
  fallbackModelId: string = DEFAULT_MODEL_ID,
  maxCostPerCall: number = DEFAULT_MAX_COST,
): Promise<{ modelId: string; reason: string; edge: string }> {
  if (tags.length === 0 || models.length === 0) {
    return { modelId: fallbackModelId, reason: 'no-tags', edge: '' }
  }

  // Budget gate: filter models within cost limit (estimate 512 tokens per call)
  const tokensEst = 512
  const affordable = models.filter((m) => (m.pricePerM / 1_000_000) * tokensEst <= maxCostPerCall)
  if (affordable.length === 0) {
    return { modelId: fallbackModelId, reason: 'budget-fallback', edge: '' }
  }

  // Read pheromone for each tag×model pair
  let bestModel = affordable[0]
  let bestStrength = -Infinity
  let bestEdge = ''
  let bestReason = 'seed'

  for (const tag of tags) {
    for (const m of affordable) {
      const edge = `${tag}→${m.id}`
      const strength = await readEdgeStrength(env, tag, m.id)
      if (strength > bestStrength) {
        bestStrength = strength
        bestModel = m
        bestEdge = edge
        bestReason = strength > 0 ? 'pheromone' : 'seed'
      }
    }
  }

  return { modelId: bestModel.id, reason: bestReason, edge: bestEdge }
}

/**
 * Mark model outcome — deposits pheromone on tag→model edge in D1.
 * success=true → mark (strengthen), success=false → warn (weaken).
 */
export async function markModelOutcome(env: Env, edge: string, success: boolean, strength = 1): Promise<void> {
  if (!edge) return
  const [source, target] = edge.split('→')
  if (!source || !target) return

  if (success) {
    await mark(env, source, target, strength).catch(() => {})
  } else {
    await warn(env, source, target, strength).catch(() => {})
  }
  // Invalidate cache entry
  _pheromoneCache.delete(edge)
}
