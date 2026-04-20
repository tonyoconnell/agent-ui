/**
 * GET /api/tick — Loop state and growth cycle
 *
 * Returns: { ticked: boolean, result, lastRun, nextRun, loopTimings }
 * Query: ?interval=60 (seconds), ?reload=1 (force meta refresh), ?peek=1 (don't run, just report)
 */
import type { APIRoute } from 'astro'
import { openrouter } from '@/engine/llm'
import { tick } from '@/engine/loop'
import { pickBest } from '@/engine/match'
import { selfCheckoff } from '@/engine/task-sync'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { getNet, reloadMeta } from '@/lib/net'
import { checkApiCallLimit, tierAllowsLoop, tierLimitResponse } from '@/lib/tier-limits'
import { readParsed } from '@/lib/typedb'

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

export const GET: APIRoute = async ({ url, request, locals }) => {
  const interval = parseInt(url.searchParams.get('interval') || '60', 10) * 1000
  const reload = url.searchParams.get('reload') === '1'
  const peek = url.searchParams.get('peek') === '1'
  const now = Date.now()

  // BaaS gate (Cycle 1 T-B1-07): tick advances all 7 loops. Gate on tier.
  // Anonymous callers (cron, internal) pass through to preserve scheduled ticks.
  // Authenticated free-tier callers get 402 on non-peek (L4-L7 require Builder+).
  const db = await getD1(locals)
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  const tier = auth?.isValid ? (auth.tier ?? 'free') : null
  if (tier && !peek) {
    const usage = await getUsage(db, auth?.keyId ?? '')
    const callGate = checkApiCallLimit(tier, usage)
    if (!callGate.ok) return tierLimitResponse(callGate)
    if (!tierAllowsLoop(tier, 'L4')) {
      return new Response(
        JSON.stringify({
          error: 'tick requires Builder+ tier — free tier is L1-L3 only. Use ?peek=1 to read state.',
          tier,
          required: 'builder',
          upgradeUrl: 'https://one.ie/pricing',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } },
      )
    }
    void recordCall(db, auth?.keyId ?? '')
  }

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

  // L1b: Task orchestration (feature-gated — opt-in via TICK_ORCHESTRATE=1)
  let taskOrchestration: { selected: string | null; agent: string | null; outcome: string } | null = null
  if (import.meta.env.TICK_ORCHESTRATE === '1') {
    try {
      const rows = await readParsed(`
        match $t isa task, has done false, has status "open";
        not { (blocker: $b, blocked: $t) isa blocks; $b has done false; };
        $t has priority-score $p;
        select $t, $p;
        sort $p desc; limit 1;
      `)
      if (rows.length > 0) {
        const taskRow = rows[0]
        const taskId = (taskRow.t as Record<string, unknown>)?.['task-id'] as string | undefined
        const tags = (taskRow.t as Record<string, unknown>)?.tag as string[] | string | undefined
        const tagList = Array.isArray(tags) ? tags : tags ? [tags] : []
        // Multi-tag Jaccard × pheromone match. Falls back to legacy single-tag
        // select() when no unit shares any tag with the task.
        const bestAgent = tagList.length > 0 ? ((await pickBest(net, tagList)) ?? net.select(tagList[0])) : net.select()
        if (taskId && bestAgent) {
          const { result: taskResult, dissolved } = await net.ask({ receiver: bestAgent, data: taskRow.t })
          if (taskResult) {
            await selfCheckoff(taskId, net)
            taskOrchestration = { selected: taskId, agent: bestAgent, outcome: 'result' }
          } else if (dissolved) {
            net.warn(`loop→${bestAgent}`, 0.5)
            taskOrchestration = { selected: taskId, agent: bestAgent, outcome: 'dissolved' }
          } else {
            net.warn(`loop→${bestAgent}`, 1)
            taskOrchestration = { selected: taskId, agent: bestAgent, outcome: 'failure' }
          }
        } else {
          taskOrchestration = { selected: taskId ?? null, agent: null, outcome: 'no-agent' }
        }
      }
    } catch {
      // Silently skip orchestration errors; main tick result is unaffected
    }
  }

  return new Response(
    JSON.stringify({
      ticked: true,
      result,
      ...(taskOrchestration !== undefined ? { taskOrchestration } : {}),
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
