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

  const data = await res.json() as { answers?: unknown[] }
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
  await query(env, `
    insert $u isa unit,
      has uid "${uid}",
      has name "${groupId}",
      has unit-kind "agent",
      has status "active",
      has success-rate 0.5,
      has sample-count 0,
      has generation 0;
  `, true).catch(() => {})

  await env.KV.put(key, '1', { expirationTtl: 86400 * 30 }) // 30 day TTL
}

// ═══════════════════════════════════════════════════════════════════════════
// TOXICITY CHECK
// ═══════════════════════════════════════════════════════════════════════════

export const isToxic = async (env: Env, source: string, target: string): Promise<boolean> => {
  const key = `toxic:${source}→${target}`
  const cached = await env.KV.get(key)
  if (cached !== null) return cached === '1'

  const rows = await query(env, `
    match
      $from isa unit, has uid "${source}";
      $to isa unit, has uid "${target}";
      (source: $from, target: $to) isa path, has strength $s, has resistance $r;
    select $s, $r;
  `)

  if (!rows.length) {
    await env.KV.put(key, '0', { expirationTtl: 300 }) // 5 min cache
    return false
  }

  const row = rows[0] as { s: number; r: number }
  const s = row.s || 0
  const r = row.r || 0
  const total = s + r
  const toxic = r >= 10 && r > s * 2 && total > 5

  await env.KV.put(key, toxic ? '1' : '0', { expirationTtl: 300 })
  return toxic
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAIL MARKING
// ═══════════════════════════════════════════════════════════════════════════

export const mark = async (env: Env, source: string, target: string, strength = 1): Promise<void> => {
  await query(env, `
    match
      $from isa unit, has uid "${source}";
      $to isa unit, has uid "${target}";
    insert (source: $from, target: $to) isa path,
      has strength ${strength}, has resistance 0.0, has traversals 1;
  `, true).catch(async () => {
    // Path exists, update it
    await query(env, `
      match
        $from isa unit, has uid "${source}";
        $to isa unit, has uid "${target}";
        $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + ${strength}), has traversals ($t + 1);
    `, true)
  })

  // Invalidate toxic cache
  await env.KV.delete(`toxic:${source}→${target}`)
}

export const warn = async (env: Env, source: string, target: string, strength = 1): Promise<void> => {
  await query(env, `
    match
      $from isa unit, has uid "${source}";
      $to isa unit, has uid "${target}";
      $e (source: $from, target: $to) isa path, has resistance $r;
    delete $r of $e;
    insert $e has resistance ($r + ${strength});
  `, true).catch(() => {})

  // Invalidate toxic cache
  await env.KV.delete(`toxic:${source}→${target}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTING
// ═══════════════════════════════════════════════════════════════════════════

export const suggestRoute = async (env: Env, from: string, skill: string): Promise<string[]> => {
  const rows = await query(env, `
    match
      $from isa unit, has uid "${from}";
      (source: $from, target: $to) isa path, has strength $s;
      (provider: $to, offered: $sk) isa capability;
      $sk has skill-id "${skill}";
      $to has uid $uid;
    sort $s desc; limit 5;
    select $uid;
  `)

  return rows.map((r: unknown) => (r as { uid: string }).uid)
}

export const highways = async (env: Env, limit = 10): Promise<{ from: string; to: string; strength: number }[]> => {
  const rows = await query(env, `
    match
      $e (source: $from, target: $to) isa path, has strength $s;
      $from has uid $fid; $to has uid $tid;
      $s >= 10.0;
    sort $s desc; limit ${limit};
    select $fid, $tid, $s;
  `)

  return rows.map((r: unknown) => {
    const row = r as { fid: string; tid: string; s: number }
    return { from: row.fid, to: row.tid, strength: row.s }
  })
}
