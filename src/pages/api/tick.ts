/**
 * GET /api/tick — Run one growth cycle
 *
 * Interval-gated. Call from dashboard poll or cron.
 * Default: once per 60 seconds.
 *
 * Query: ?interval=60 (seconds), ?reload=1 (force meta refresh)
 * Returns: { ticked: boolean, result?, lastRun, nextRun }
 */
import type { APIRoute } from 'astro'
import { getNet, reloadMeta } from '@/lib/net'
import { openrouter } from '@/engine/llm'
import { tick } from '@/engine/loop'

let lastTick = 0

export const GET: APIRoute = async ({ url }) => {
  const interval = parseInt(url.searchParams.get('interval') || '60', 10) * 1000
  const reload = url.searchParams.get('reload') === '1'
  const now = Date.now()

  if (now - lastTick < interval) {
    return new Response(JSON.stringify({
      ticked: false,
      lastRun: new Date(lastTick).toISOString(),
      nextRun: new Date(lastTick + interval).toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } })
  }

  lastTick = now

  const net = await getNet()
  if (reload) await reloadMeta()

  const apiKey = import.meta.env.OPENROUTER_API_KEY || ''
  const complete = openrouter(apiKey)
  const result = await tick(net, complete)

  return new Response(JSON.stringify({
    ticked: true,
    result,
    lastRun: new Date(now).toISOString(),
    nextRun: new Date(now + interval).toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } })
}
