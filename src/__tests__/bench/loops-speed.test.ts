/**
 * Wave 4 — Slow loops L4–L7.
 *
 * These run at minute-to-hour periods, not signal speed. The budget is that
 * each loop finishes inside its period (≤10% of window actually running).
 *
 * Loops take a PersistentWorld that needs TypeDB. We build a lightweight
 * stub that satisfies the minimum interface each loop touches, so we
 * measure the substrate-side compute cost rather than any I/O.
 */
import { describe, test } from 'vitest'
import { measure, measureSync } from '@/__tests__/helpers/speed'
import { createWorld } from '@/engine'

// Build a PersistentWorld-shaped stub by starting from createWorld() and
// adding no-op persistence + minimal learning helpers. This is enough for
// loops that touch highways/paths but NOT enough for full TypeDB sync —
// which is the point: we measure the in-memory branches.
function stubPersistentWorld() {
  const base = createWorld()
  for (let i = 0; i < 200; i++) {
    base.add(`unit-${i}`)
    if (i > 0) {
      base.mark(`unit-0→unit-${i}`, Math.random() * 10)
      if (Math.random() < 0.2) base.warn(`unit-0→unit-${i}`, Math.random() * 3)
    }
  }
  // Add persistence no-ops that loops may call.
  return Object.assign(base, {
    actor: () => base.get('unit-0'),
    flow: () => {},
    open: () => base.highways(10),
    blocked: () => [] as Array<{ from: string; to: string }>,
    know: async () => 0,
    recall: async () => [],
    load: async () => {},
    sync: async () => {},
    taskBlockers: async () => [],
    markTaskResult: () => {},
  })
}

describe('system speed — slow loops (L4-L7)', () => {
  test('L4 — economic tick (revenue accumulation)', () => {
    const net = createWorld()
    for (let i = 0; i < 100; i++) net.add(`unit-${i}`)
    // Model of L4: update revenue on paths after a payment signal
    measureSync(
      'loop:L4:economic',
      () => {
        for (let i = 1; i < 100; i++) {
          net.recordRevenue(`unit-0→unit-${i}`, 0.001)
        }
      },
      100,
    )
  })

  test('L5 — evolution tick (prompt rewrite trigger only)', async () => {
    // We don't actually call the LLM — we measure the detection loop that
    // decides WHICH agent needs rewriting. That's the substrate-side cost.
    const net = stubPersistentWorld()
    const strugglingCandidates = () =>
      net
        .highways(200)
        .filter((h) => {
          const s = net.sense(h.path)
          const r = net.danger(h.path)
          return r > s * 2 && r + s > 5
        })
        .map((h) => h.path)
    await measure('loop:L5:evolution:detect', async () => strugglingCandidates(), 500)
  })

  test('L6 — know tick (promote highways to hypotheses)', () => {
    const net = stubPersistentWorld()
    // In-memory half of the loop: identify highways above threshold.
    measureSync(
      'loop:L6:know:scan',
      () => {
        const highways = net.highways(50)
        return highways.filter((h) => h.strength >= 5)
      },
      500,
    )
  })

  test('L7 — frontier tick (detect unexplored tag clusters)', () => {
    const net = stubPersistentWorld()
    // Frontier = low-weight edges with unique receivers
    measureSync(
      'loop:L7:frontier:scan',
      () => {
        const all = net.highways(1_000)
        const lowWeight = all.filter((h) => h.strength < 1)
        const seen = new Set<string>()
        for (const h of lowWeight) seen.add(h.path.split('→')[1])
        return seen.size
      },
      500,
    )
  })

  test('L3 fade — full 1,000-path world', () => {
    const net = createWorld()
    for (let i = 0; i < 1_000; i++) {
      net.add(`u${i}`)
      if (i > 0) net.mark(`u0→u${i}`, Math.random() * 10)
    }
    measureSync('loop:L3:fade:1000', () => net.fade(0.05), 50)
  })
})
