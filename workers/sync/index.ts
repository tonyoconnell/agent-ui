/**
 * Sync Worker — TypeDB → KV
 * Scheduled: every 5 minutes (free tier) or every 5 seconds (paid)
 * Fetches snapshots from export API, writes to KV as JSON
 */

interface Env {
  KV: KVNamespace
  APP_URL: string // e.g. https://one.ie or http://localhost:4321
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const base = env.APP_URL || 'https://one.ie'

    const endpoints = ['paths', 'units', 'skills', 'highways', 'toxic'] as const

    const results = await Promise.allSettled(
      endpoints.map(async (key) => {
        const res = await fetch(`${base}/api/export/${key}`)
        if (!res.ok) throw new Error(`${key}: ${res.status}`)
        const data = await res.json()
        await env.KV.put(`${key}.json`, JSON.stringify(data))
        return { key, count: Array.isArray(data) ? data.length : Object.keys(data).length }
      })
    )

    const synced = results
      .filter((r): r is PromiseFulfilledResult<{ key: string; count: number }> => r.status === 'fulfilled')
      .map(r => r.value)

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r, i) => ({ key: endpoints[i], error: r.reason?.message }))

    await env.KV.put('synced_at', Date.now().toString())

    if (failed.length > 0) {
      console.error('Sync failures:', JSON.stringify(failed))
    }

    console.log('Sync complete:', JSON.stringify(synced))
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
