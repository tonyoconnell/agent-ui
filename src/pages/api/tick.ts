/**
 * GET /api/tick — Loop state and growth cycle
 *
 * Returns: { ticked: boolean, result, lastRun, nextRun, loopTimings }
 * Query: ?interval=60 (seconds), ?reload=1 (force meta refresh), ?peek=1 (don't run, just report)
 */
import type { APIRoute } from 'astro'
import { openrouter } from '@/engine/llm'
import { tick } from '@/engine/loop'
import { getNet, reloadMeta } from '@/lib/net'

let lastTick = 0

// Named interval constants (ms)
const L1_INTERVAL = 100 // signal routing per message
const L2_INTERVAL = 1000 // path-strength accumulation per outcome
const L3_INTERVAL = 300_000 // fade every 5 min
const L4_INTERVAL = 60_000 // economic payment tracking per min
const L5_INTERVAL = 600_000 // evolution every 10 min (24h cooldown per unit)
const L6_INTERVAL = 3_600_000 // hypothesis/highway hardening every hour
const L7_INTERVAL = 3_600_000 // frontier detection every hour

let lastL1 = 0
let lastL2 = 0
let lastL3 = 0
let lastL4 = 0
let lastL5 = 0
let lastL6 = 0
let lastL7 = 0

export const GET: APIRoute = async ({ url }) => {
  const interval = parseInt(url.searchParams.get('interval') || '60', 10) * 1000
  const reload = url.searchParams.get('reload') === '1'
  const peek = url.searchParams.get('peek') === '1'
  const now = Date.now()

  // If peek=1, just report timings without running tick
  if (peek) {
    return new Response(
      JSON.stringify({
        ticked: false,
        peek: true,
        loopTimings: {
          l1: { interval: L1_INTERVAL, lastAtMs: lastL1, nextAtMs: lastL1 + L1_INTERVAL },
          l2: { interval: L2_INTERVAL, lastAtMs: lastL2, nextAtMs: lastL2 + L2_INTERVAL },
          l3: { interval: L3_INTERVAL, lastAtMs: lastL3, nextAtMs: lastL3 + L3_INTERVAL },
          l4: { interval: L4_INTERVAL, lastAtMs: lastL4, nextAtMs: lastL4 + L4_INTERVAL },
          l5: { interval: L5_INTERVAL, lastAtMs: lastL5, nextAtMs: lastL5 + L5_INTERVAL },
          l6: { interval: L6_INTERVAL, lastAtMs: lastL6, nextAtMs: lastL6 + L6_INTERVAL },
          l7: { interval: L7_INTERVAL, lastAtMs: lastL7, nextAtMs: lastL7 + L7_INTERVAL },
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1' } },
    )
  }

  // Normal tick with interval gating
  if (now - lastTick < interval) {
    return new Response(
      JSON.stringify({
        ticked: false,
        lastRun: new Date(lastTick).toISOString(),
        nextRun: new Date(lastTick + interval).toISOString(),
        loopTimings: {
          l1: { interval: L1_INTERVAL, lastAtMs: lastL1, nextAtMs: lastL1 + L1_INTERVAL },
          l2: { interval: L2_INTERVAL, lastAtMs: lastL2, nextAtMs: lastL2 + L2_INTERVAL },
          l3: { interval: L3_INTERVAL, lastAtMs: lastL3, nextAtMs: lastL3 + L3_INTERVAL },
          l4: { interval: L4_INTERVAL, lastAtMs: lastL4, nextAtMs: lastL4 + L4_INTERVAL },
          l5: { interval: L5_INTERVAL, lastAtMs: lastL5, nextAtMs: lastL5 + L5_INTERVAL },
          l6: { interval: L6_INTERVAL, lastAtMs: lastL6, nextAtMs: lastL6 + L6_INTERVAL },
          l7: { interval: L7_INTERVAL, lastAtMs: lastL7, nextAtMs: lastL7 + L7_INTERVAL },
        },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Run the tick
  lastTick = now
  lastL1 = now
  lastL2 = now

  // L3: decay every 5 min + stale lease recovery
  if (now - lastL3 >= L3_INTERVAL) {
    lastL3 = now
    // Auto-expire stale claims as part of L3 cleanup
    const baseUrl = import.meta.env.PUBLIC_GATEWAY_URL || 'http://localhost:4321'
    try {
      // Release task claims >30min old
      await fetch(`${baseUrl}/api/tasks/expire`)
      // Release wave-locks >2h old
      await fetch(`${baseUrl}/api/waves/expire`)
    } catch {
      // Silently fail if expire unavailable; next tick will retry
    }
  }

  // L4: revenue tracking per min (implicit in signal.ts)
  if (now - lastL4 >= L4_INTERVAL) lastL4 = now

  // L5: evolution every 10 min
  if (now - lastL5 >= L5_INTERVAL) lastL5 = now

  // L6: hypothesis hardening every hour
  if (now - lastL6 >= L6_INTERVAL) lastL6 = now

  // L7: frontier detection every hour
  if (now - lastL7 >= L7_INTERVAL) lastL7 = now

  const net = await getNet()
  if (reload) await reloadMeta()

  const apiKey = import.meta.env.OPENROUTER_API_KEY || ''
  const complete = openrouter(apiKey)
  const result = await tick(net, complete)

  return new Response(
    JSON.stringify({
      ticked: true,
      result,
      lastRun: new Date(now).toISOString(),
      nextRun: new Date(now + interval).toISOString(),
      loopTimings: {
        l1: { interval: L1_INTERVAL, lastAtMs: lastL1, nextAtMs: lastL1 + L1_INTERVAL },
        l2: { interval: L2_INTERVAL, lastAtMs: lastL2, nextAtMs: lastL2 + L2_INTERVAL },
        l3: { interval: L3_INTERVAL, lastAtMs: lastL3, nextAtMs: lastL3 + L3_INTERVAL },
        l4: { interval: L4_INTERVAL, lastAtMs: lastL4, nextAtMs: lastL4 + L4_INTERVAL },
        l5: { interval: L5_INTERVAL, lastAtMs: lastL5, nextAtMs: lastL5 + L5_INTERVAL },
        l6: { interval: L6_INTERVAL, lastAtMs: lastL6, nextAtMs: lastL6 + L6_INTERVAL },
        l7: { interval: L7_INTERVAL, lastAtMs: lastL7, nextAtMs: lastL7 + L7_INTERVAL },
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
