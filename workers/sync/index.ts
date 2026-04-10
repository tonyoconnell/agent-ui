/// <reference types="@cloudflare/workers-types" />
/**
 * Sync Worker — TypeDB ↔ KV ↔ Sui
 * Scheduled: every minute
 *
 * Three jobs:
 *   1. TypeDB → KV     Export snapshots (paths, units, skills, highways, toxic)
 *   2. Sui → TypeDB    Absorb on-chain events (Marked, Warned, UnitCreated, etc.)
 *   3. KV cursor        Track Sui event cursor between runs
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

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const base = env.APP_URL || 'https://one.ie'

    // ── Job 1: TypeDB → KV ──────────────────────────────────────────────

    const endpoints = ['paths', 'units', 'skills', 'highways', 'toxic'] as const

    const results = await Promise.allSettled(
      endpoints.map(async (key) => {
        const res = await fetch(`${base}/api/export/${key}`)
        if (!res.ok) throw new Error(`${key}: ${res.status}`)
        const data = await res.json() as unknown[]
        const json = JSON.stringify(data)
        const newHash = hashStr(json)

        // Skip KV write if data unchanged
        const oldHash = await env.KV.get(`${key}.hash`)
        if (oldHash !== newHash) {
          await env.KV.put(`${key}.json`, json)
          await env.KV.put(`${key}.hash`, newHash)
        }

        return {
          key,
          count: Array.isArray(data) ? data.length : Object.keys(data as object).length,
          changed: oldHash !== newHash,
        }
      })
    )

    const synced = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<{ key: string; count: number; changed: boolean }>).value)

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r, i) => ({ key: endpoints[i], error: r.reason?.message }))

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
        const data = await res.json() as { count: number; cursor: string }
        absorbed = data.count
        if (data.cursor) {
          await env.KV.put('sui_event_cursor', data.cursor)
        }
      }
    } catch (e) {
      console.error('Sui absorb error:', e)
    }

    await env.KV.put('synced_at', Date.now().toString())

    if (failed.length > 0) {
      console.error('Sync failures:', JSON.stringify(failed))
    }

    const changed = synced.filter(s => s.changed).map(s => s.key)
    console.log('Sync complete:', JSON.stringify({ synced: synced.length, changed, absorbed }))
  },

  // Also handle manual trigger via HTTP
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (new URL(request.url).pathname === '/sync') {
      await this.scheduled({} as ScheduledEvent, env, ctx)
      const syncedAt = await env.KV.get('synced_at')
      return Response.json({ ok: true, synced_at: syncedAt })
    }
    return Response.json({ status: 'sync-worker', trigger: '/sync' })
  },
}
