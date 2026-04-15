/**
 * System Speed Benchmarks — measures the substrate's hot paths.
 *
 * These are NOT tests of the test suite's speed. They measure the PRODUCTION
 * system: how fast routing, marking, fading, signal dispatch, cache hits,
 * and identity derivation actually run. Each named sample is emitted to
 * .vitest/speed.ndjson; scripts/speed-report.ts renders them into
 * docs/speed-test.md with per-layer budgets from speed.md.
 *
 * Naming convention for samples:
 *   <layer>:<op>[:<variant>]
 *   routing:select, pheromone:mark, signal:dispatch, …
 *
 * These benches RECORD, they don't GATE. Budget verdicts live in the
 * generated report. This avoids the absolute-threshold flakiness that
 * plagues perf-gated tests on noisy hardware (see memory/feedback_performance_thresholds).
 */
import { beforeAll, describe, test, vi } from 'vitest'
import { measure, measureSync } from '@/__tests__/helpers/speed'
import { createWorld } from '@/engine'

beforeAll(() => {
  ;(import.meta.env as Record<string, string>).SUI_SEED = Buffer.from(new Uint8Array(32).fill(9)).toString('base64')
})

function worldWithPaths(n: number) {
  const net = createWorld()
  for (let i = 0; i < n; i++) {
    net.add(`unit-${i}`)
    if (i > 0) net.mark(`unit-0→unit-${i}`, Math.random())
  }
  return net
}

// ─────────────────────────────────────────────────────────────────────────────
// Routing layer
// ─────────────────────────────────────────────────────────────────────────────

describe('system speed — routing', () => {
  test('select() from 100 paths', () => {
    const net = worldWithPaths(100)
    measureSync('routing:select:100', () => net.select(), 10_000)
  })

  test('select() from 1,000 paths', () => {
    const net = worldWithPaths(1_000)
    measureSync('routing:select:1000', () => net.select(), 5_000)
  })

  test('follow() strongest path', () => {
    const net = worldWithPaths(100)
    measureSync('routing:follow', () => net.follow(), 10_000)
  })

  test('10,000 follow() calls on 100-path world (batch)', () => {
    const net = worldWithPaths(100)
    measureSync('routing:follow:batch-10k', () => net.follow(), 10_000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Pheromone layer
// ─────────────────────────────────────────────────────────────────────────────

describe('system speed — pheromone', () => {
  test('mark() single deposit', () => {
    const net = createWorld()
    let i = 0
    measureSync('pheromone:mark', () => net.mark(`a→b-${i++ % 100}`, 1), 10_000)
  })

  test('warn() single deposit', () => {
    const net = createWorld()
    let i = 0
    measureSync('pheromone:warn', () => net.warn(`a→b-${i++ % 100}`, 1), 10_000)
  })

  test('sense() read strength', () => {
    const net = worldWithPaths(100)
    measureSync('pheromone:sense', () => net.sense('unit-0→unit-50'), 10_000)
  })

  test('fade() 1,000 paths', () => {
    const net = worldWithPaths(1_000)
    measureSync('pheromone:fade:1000', () => net.fade(0.05), 100)
  })

  test('highways() top 10 from 1,000', () => {
    const net = worldWithPaths(1_000)
    measureSync('pheromone:highways:top10', () => net.highways(10), 1_000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Signal layer
// ─────────────────────────────────────────────────────────────────────────────

describe('system speed — signal', () => {
  test('signal() in-memory dispatch', () => {
    const net = createWorld()
    net.add('sink').on('default', () => Promise.resolve('ok'))
    measureSync('signal:dispatch', () => net.signal({ receiver: 'sink', data: { i: 1 } }), 5_000)
  })

  test('signal() dissolves missing unit without throwing', () => {
    const net = createWorld()
    measureSync('signal:dispatch:dissolved', () => net.signal({ receiver: 'nobody', data: { i: 1 } }), 5_000)
  })

  test('enqueue() + drain()', () => {
    const net = createWorld()
    net.add('sink').on('default', () => Promise.resolve('ok'))
    measureSync(
      'signal:queue:roundtrip',
      () => {
        net.enqueue({ receiver: 'sink', data: {} })
        net.drain()
      },
      5_000,
    )
  })

  test('ask() 3-unit chain round-trip', async () => {
    const net = createWorld()
    net
      .add('a')
      .on('default', async (data: unknown) => ({ ...(data as object), a: 1 }))
      .then('default', (r) => ({ receiver: 'b', data: r }))
    net
      .add('b')
      .on('default', async (data: unknown) => ({ ...(data as object), b: 1 }))
      .then('default', (r) => ({ receiver: 'c', data: r }))
    net.add('c').on('default', async (data: unknown) => ({ ...(data as object), c: 1 }))

    await measure('signal:ask:chain-3', () => net.ask({ receiver: 'a', data: {} }), 50)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Identity layer (Sui keypair derivation)
// ─────────────────────────────────────────────────────────────────────────────

describe('system speed — identity', () => {
  test('Sui addressFor() derive', async () => {
    // sui.ts captures SEED_B64 at module load — reset modules so our env wins.
    vi.resetModules()
    const { addressFor } = await import('@/lib/sui')
    await measure('identity:sui:address', () => addressFor('bench:unit'), 200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge (KV cache) layer
// ─────────────────────────────────────────────────────────────────────────────

describe('system speed — edge cache', () => {
  test('in-process cache hit', async () => {
    const mockKv = {
      get: async () => JSON.stringify({ 'a→b': { strength: 1, resistance: 0 } }),
    } as unknown as KVNamespace
    const { getPaths } = await import('@/lib/edge')
    await getPaths(mockKv) // prime
    await measure('edge:cache:hit', () => getPaths(mockKv), 5_000)
  })
})
