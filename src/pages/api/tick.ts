/**
 * GET /api/tick — Run one growth cycle
 *
 * Interval-gated. Call from dashboard poll or cron.
 * Default: once per 60 seconds.
 *
 * Query: ?interval=60 (seconds)
 * Returns: { ticked: boolean, result?: TickResult, lastRun, nextRun }
 *
 * The PersistentWorld is cached at module level — loaded once from TypeDB,
 * then reused across ticks. Pheromone state accumulates in memory between
 * ticks (as it should). Re-hydrate by passing ?reload=1.
 */
import type { APIRoute } from 'astro'
import { world, type PersistentWorld } from '@/engine/persist'
import { openrouter } from '@/engine/llm'
import { tick } from '@/engine/loop'

let lastTick = 0
let _world: PersistentWorld | null = null

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
  const apiKey = import.meta.env.OPENROUTER_API_KEY || ''
  const complete = openrouter(apiKey)

  // Load world once; reuse on subsequent ticks (pheromone accumulates in memory)
  if (!_world || reload) {
    _world = world()
    await _world.load().catch(() => {})
  }

  const result = await tick(_world, complete)

  return new Response(JSON.stringify({
    ticked: true,
    result,
    lastRun: new Date(now).toISOString(),
    nextRun: new Date(now + interval).toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } })
}
