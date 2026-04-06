/**
 * /api/speedtest/run
 *
 * Runs comprehensive speedtest suite:
 * - Signal routing (L1)
 * - Mark/warn pheromone (L2)
 * - Fade decay (L3)
 * - Chain depth (continuation routing)
 * - Page load simulation
 *
 * Returns: { timestamp, environment, results }
 */

import type { APIRoute } from 'astro'
import { benchmark, percentiles, type BenchmarkResult, type SpeedtestResult } from '@/lib/speedtest'
import { createWorld } from '@/engine'

export const GET: APIRoute = async ({ url }) => {
  const results: Record<string, BenchmarkResult> = {}

  try {
    // ────────────────────────────────────────────────────────────────────
    // L1: SIGNAL ROUTING
    // ────────────────────────────────────────────────────────────────────

    results.signal_routing = await benchmark(
      'signal_routing',
      () => {
        const net = createWorld()
        net.add('alice')
        net.add('bob')
        net.signal({ receiver: 'bob', data: { test: 1 } }, 'alice')
      },
      1000
    )

    // ────────────────────────────────────────────────────────────────────
    // L2: MARK (Pheromone strengthen)
    // ────────────────────────────────────────────────────────────────────

    const net = createWorld()
    net.add('unit-0')
    net.add('unit-1')

    results.pheromone_mark = await benchmark(
      'pheromone_mark',
      () => {
        net.mark('unit-0→unit-1', 1)
      },
      1000
    )

    // ────────────────────────────────────────────────────────────────────
    // L2: WARN (Pheromone weaken)
    // ────────────────────────────────────────────────────────────────────

    results.pheromone_warn = await benchmark(
      'pheromone_warn',
      () => {
        net.warn('unit-0→unit-1', 0.5)
      },
      1000
    )

    // ────────────────────────────────────────────────────────────────────
    // L3: FADE (Decay all paths)
    // ────────────────────────────────────────────────────────────────────

    // Seed with paths
    for (let i = 0; i < 100; i++) {
      net.add(`unit-${i}`)
      if (i > 0) {
        net.mark(`unit-${i - 1}→unit-${i}`, Math.random() * 50)
      }
    }

    results.fade_decay = await benchmark(
      'fade_decay',
      () => {
        net.fade(0.05)
      },
      50
    )

    // ────────────────────────────────────────────────────────────────────
    // L2: ASK (Signal + wait + mark)
    // ────────────────────────────────────────────────────────────────────

    const net2 = createWorld()
    const alice = net2.add('alice')
    alice.on('ping', () => ({ pong: true }))

    results.ask_latency = await benchmark(
      'ask_latency',
      async () => {
        await net2.ask({ receiver: 'alice:ping', data: {} }, 'entry', 100)
      },
      100
    )

    // ────────────────────────────────────────────────────────────────────
    // CHAIN DEPTH (Continuations)
    // ────────────────────────────────────────────────────────────────────

    const net3 = createWorld()
    const depth = 5

    for (let i = 0; i < depth; i++) {
      const u = net3.add(`chain-${i}`)
      u.on('task', async (data, emit) => {
        emit({ receiver: `chain-${i + 1}:task`, data: { depth: (data as any).depth + 1 } })
      })
      u.then('task', (result) => ({ receiver: `chain-${i + 1}:task`, data: result }))
    }

    // Final unit
    const final = net3.add('chain-5')
    final.on('task', async (data) => {
      return { final: true, depth: (data as any).depth }
    })

    results.chain_depth = await benchmark(
      'chain_depth',
      async () => {
        await net3.ask({ receiver: 'chain-0:task', data: { depth: 0 } }, 'entry', 500)
      },
      20
    )

    // ────────────────────────────────────────────────────────────────────
    // ENQUEUE + DRAIN
    // ────────────────────────────────────────────────────────────────────

    const net4 = createWorld()

    results.enqueue_drain = await benchmark(
      'enqueue_drain',
      () => {
        for (let i = 0; i < 10; i++) {
          net4.enqueue({ receiver: 'future:task', data: { count: i } })
        }
        for (let i = 0; i < 10; i++) {
          net4.drain()
        }
      },
      100
    )

    // ────────────────────────────────────────────────────────────────────
    // HIGHWAYS (Top paths)
    // ────────────────────────────────────────────────────────────────────

    results.highways_query = await benchmark(
      'highways_query',
      () => {
        net.highways(50)
      },
      50
    )

    // ────────────────────────────────────────────────────────────────────
    // SELECT (Probabilistic routing)
    // ────────────────────────────────────────────────────────────────────

    results.select_routing = await benchmark(
      'select_routing',
      () => {
        net.select('task', 0.5)
      },
      100
    )

    // ────────────────────────────────────────────────────────────────────
    // FOLLOW (Deterministic routing)
    // ────────────────────────────────────────────────────────────────────

    results.follow_routing = await benchmark(
      'follow_routing',
      () => {
        net.follow('task')
      },
      100
    )

    const speedtest: SpeedtestResult = {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development',
      results,
    }

    return new Response(JSON.stringify(speedtest, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error), timestamp: new Date().toISOString() }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
