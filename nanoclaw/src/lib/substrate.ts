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
// RECALL HYPOTHESES
// ═══════════════════════════════════════════════════════════════════════════

export const recallHypotheses = async (
  env: Env,
  actorUid: string,
): Promise<Array<{ predicate: string; object: string; confidence: number }>> => {
  const safe = actorUid.replace(/"/g, '')
  const rows = await query(
    env,
    `
    match
      $h isa hypothesis, has subject "${safe}", has predicate $p, has object $o, has confidence $c;
    sort $c desc; limit 20;
    select $p, $o, $c;
  `,
  )

  return rows.map((r: unknown) => {
    const row = r as { p: string; o: string; c: number }
    return { predicate: row.p, object: row.o, confidence: row.c }
  })
}
