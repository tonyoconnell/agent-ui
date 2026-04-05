/**
 * GET /api/decay-auto — Auto-decay on interval
 *
 * Call from dashboard poll or cron. Only runs decay if enough time
 * has elapsed since last run (default 5 minutes).
 *
 * Query: ?interval=300 (seconds, default 300 = 5min)
 * Returns: { decayed: boolean, lastRun, nextRun }
 */
import type { APIRoute } from 'astro'
import { decay } from '@/lib/typedb'

let lastDecay = 0

export const GET: APIRoute = async ({ url }) => {
  const interval = parseInt(url.searchParams.get('interval') || '300', 10) * 1000
  const now = Date.now()

  if (now - lastDecay < interval) {
    return new Response(JSON.stringify({
      decayed: false,
      lastRun: new Date(lastDecay).toISOString(),
      nextRun: new Date(lastDecay + interval).toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  lastDecay = now
  await decay(0.05, 0.20)

  return new Response(JSON.stringify({
    decayed: true,
    lastRun: new Date(now).toISOString(),
    nextRun: new Date(now + interval).toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
