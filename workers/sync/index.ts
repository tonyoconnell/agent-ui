/// <reference types="@cloudflare/workers-types" />
/**
 * Sync Worker — TypeDB ↔ KV ↔ Sui ↔ D1
 * Scheduled: every minute
 *
 * Four jobs:
 *   1. TypeDB → KV       Export snapshots (paths, units, skills, highways, toxic)
 *   2. Sui → TypeDB      Absorb on-chain events (Marked, Warned, UnitCreated, etc.)
 *   3. D1 → TypeDB       Batch sync marks WAL to TypeDB (Cycle 1 Foundation)
 *   4. KV cursor         Track Sui event cursor between runs
 *
 * Hash-based change detection: only writes to KV if data changed.
 * This keeps KV writes minimal and TTL-respecting CDN cache valid.
 */

interface Env {
  KV: KVNamespace
  APP_URL: string // e.g. https://one.ie or http://localhost:4321
}

/** Fast non-crypto hash — sufficient for change detection */
function hashStr(s: string): string {
  let h = 2166136261 // FNV-1a offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0 // FNV prime, keep 32-bit
  }
  return h.toString(36)
}

async function exportKeys(
  env: Env,
  base: string,
  keys: readonly string[],
  group?: string,
): Promise<{ synced: { key: string; count: number; changed: boolean }[]; failed: { key: string; error: string }[] }> {
  const results = await Promise.allSettled(
    keys.map(async (key) => {
      // Per-group exports use scoped KV key and group-filtered endpoint
      const kvKey = group ? `${key}:${group}.json` : `${key}.json`
      const url = group ? `${base}/api/export/${key}?group=${encodeURIComponent(group)}` : `${base}/api/export/${key}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${key}: ${res.status}`)
      const data = (await res.json()) as unknown[]
      const json = JSON.stringify(data)
      const newHash = hashStr(json)

      // Skip KV write if data unchanged
      const hashKey = group ? `${key}:${group}.hash` : `${key}.hash`
      const oldHash = await env.KV.get(hashKey)
      if (oldHash !== newHash) {
        await env.KV.put(kvKey, json)
        await env.KV.put(hashKey, newHash)
        // Bump version for cross-isolate invalidation (sys-110)
        await env.KV.put(`version:${kvKey}`, Date.now().toString(), { expirationTtl: 3600 })
      }

      return {
        key: kvKey,
        count: Array.isArray(data) ? data.length : Object.keys(data as object).length,
        changed: oldHash !== newHash,
      }
    }),
  )

  const synced = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<{ key: string; count: number; changed: boolean }>).value)

  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r, i) => ({ key: keys[i] as string, error: r.reason?.message }))

  return { synced, failed }
}

const ALL_ENDPOINTS = ['paths', 'units', 'skills', 'highways', 'toxic'] as const

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const base = env.APP_URL || 'https://one.ie'

    // ── Job 1: TypeDB → KV ──────────────────────────────────────────────

    const { synced, failed } = await exportKeys(env, base, ALL_ENDPOINTS)

    // ── Job 2: Sui → TypeDB ─────────────────────────────────────────────

    let absorbed = 0
    try {
      const cursor = await env.KV.get('sui_event_cursor')
      const res = await fetch(`${base}/api/absorb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursor }),
      })
      if (res.ok) {
        const data = (await res.json()) as { count: number; cursor: string }
        absorbed = data.count
        if (data.cursor) {
          await env.KV.put('sui_event_cursor', data.cursor)
        }
      }
    } catch (e) {
      console.error('Sui absorb error:', e)
    }

    // ── Job 3: D1 → TypeDB (Cycle 1 Foundation) ─────────────────────────

    let d1Synced = { edges_synced: 0, total_marks: 0 }
    try {
      const res = await fetch(`${base}/api/sync/d1-marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = (await res.json()) as { edges_synced: number; total_marks: number }
        d1Synced = data
      } else {
        console.error('D1 sync status:', res.status)
      }
    } catch (e) {
      console.error('D1 sync error:', e)
    }

    // ── Job 5: Wallet reconciliation ────────────────────────────────────────
    // Compare on-chain SUI balance vs TypeDB signal ledger per wallet.
    // Mismatch → auto-pauses wallet + writes security hypothesis (handled in-app).

    let reconcileStats = { ok: 0, mismatch: 0, error: 0 }
    try {
      const res = await fetch(`${base}/api/reconcile`, { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as { ok: number; mismatch: number; error: number }
        reconcileStats = { ok: data.ok ?? 0, mismatch: data.mismatch ?? 0, error: data.error ?? 0 }
        if (data.mismatch > 0) {
          console.warn('[reconcile] mismatches detected:', data.mismatch)
        }
      } else {
        console.error('[reconcile] status:', res.status)
      }
    } catch (e) {
      console.error('[reconcile] error:', e)
    }

    await env.KV.put('synced_at', Date.now().toString())

    if (failed.length > 0) {
      console.error('Sync failures:', JSON.stringify(failed))
    }

    const changed = synced.filter((s) => s.changed).map((s) => s.key)
    console.log(
      'Sync complete:',
      JSON.stringify({ synced: synced.length, changed, absorbed, d1_edges: d1Synced.edges_synced, reconcile: reconcileStats }),
    )
  },

  // Also handle manual trigger via HTTP
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/sync') {
      const keysParam = url.searchParams.get('keys')
      const groupParam = url.searchParams.get('group') || undefined
      const targetKeys = keysParam
        ? keysParam.split(',').filter((k) => (ALL_ENDPOINTS as readonly string[]).includes(k))
        : [...ALL_ENDPOINTS]
      const base = env.APP_URL || 'https://one.ie'
      ctx.waitUntil(exportKeys(env, base, targetKeys, groupParam))
      return Response.json({ ok: true, keys: targetKeys, group: groupParam ?? null })
    }
    return Response.json({ status: 'sync-worker', trigger: '/sync' })
  },
}
