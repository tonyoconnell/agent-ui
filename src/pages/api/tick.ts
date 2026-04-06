/**
 * GET /api/tick — Run one growth cycle
 *
 * Interval-gated. Call from dashboard poll or cron.
 * Default: once per 60 seconds.
 *
 * Query: ?interval=60 (seconds)
 * Returns: { ticked: boolean, result?: TickResult, lastRun, nextRun }
 */
import type { APIRoute } from 'astro'
import { world } from '@/engine/persist'
import { anthropic } from '@/engine/llm'
import { tick } from '@/engine/loop'

let lastTick = 0

export const GET: APIRoute = async ({ url }) => {
  const interval = parseInt(url.searchParams.get('interval') || '60', 10) * 1000
  const now = Date.now()

  if (now - lastTick < interval) {
    return new Response(JSON.stringify({
      ticked: false,
      lastRun: new Date(lastTick).toISOString(),
      nextRun: new Date(lastTick + interval).toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } })
  }

  lastTick = now
  const apiKey = import.meta.env.ANTHROPIC_API_KEY || ''
  const complete = anthropic(apiKey)
  const w = world()
  await w.load().catch(() => {})  // hydrate pheromone from TypeDB
  const result = await tick(w, complete)

  return new Response(JSON.stringify({
    ticked: true,
    result,
    lastRun: new Date(now).toISOString(),
    nextRun: new Date(now + interval).toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } })
}
