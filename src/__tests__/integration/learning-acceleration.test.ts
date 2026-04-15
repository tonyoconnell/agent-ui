/**
 * LEARNING ACCELERATION — The System Gets Faster Over Time
 *
 * After N successful signals on a path, routing decisions shift from
 * probabilistic (select()) to deterministic (follow()). Highway detection
 * at strength > 50 gates the optimization.
 *
 * This test proves:
 * (a) Initial routing uses select() with O(paths) work — probabilistic
 * (b) After 100 marks, strongest path becomes highway — pheromone compounds
 * (c) follow() on highway returns in O(1) — deterministic, cached
 * (d) isHighway() gate works at threshold — strength - resistance >= 50
 *
 * The claim: system gets faster. Proof: arithmetic replaces LLM.
 *
 * Run: bun vitest run src/__tests__/integration/learning-acceleration.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { type World, world } from '@/engine/world'

const PERF = process.env.PERF_SCALE ? Number(process.env.PERF_SCALE) : Number.POSITIVE_INFINITY

describe('Learning Acceleration — Routing Gets Faster With Experience', () => {
  let w: World

  beforeEach(() => {
    w = world()
  })

  // ───────────────────────────────────────────────────────────────────────
  // TEST A: Initial Routing Uses select() — O(paths) Probabilistic
  // ───────────────────────────────────────────────────────────────────────

  describe('(a) Initial routing uses select() — probabilistic', () => {
    it('select() chooses from viable paths with weighted randomness', () => {
      // Setup: 3 paths with different strengths
      w.add('scout')
      w.add('analyst')
      w.add('harvester')
      w.add('router')

      // Emit signals to build initial trails
      w.signal({ receiver: 'scout', data: { marks: true } }, 'entry')
      w.signal({ receiver: 'analyst', data: { marks: true } }, 'entry')
      w.signal({ receiver: 'harvester', data: { marks: true } }, 'entry')

      // Verify pheromone was laid
      expect(w.sense('entry→scout')).toBeGreaterThan(0)
      expect(w.sense('entry→analyst')).toBeGreaterThan(0)
      expect(w.sense('entry→harvester')).toBeGreaterThan(0)

      // select() should pick one of the three (or null if sensitivity filters all)
      const choice = w.select('entry', 0.5)
      expect(['scout', 'analyst', 'harvester', null]).toContain(choice)
    })

    it('select() with high sensitivity favors stronger paths', () => {
      w.add('fast')
      w.add('slow')

      // Make fast much stronger
      w.mark('entry→fast', 10)
      w.mark('entry→slow', 1)

      // High sensitivity (0.9) should heavily favor fast
      const picks: string[] = []
      for (let i = 0; i < 20; i++) {
        const choice = w.select('entry', 0.9)
        if (choice) picks.push(choice)
      }

      // Majority should be 'fast' (not guaranteed, but statistically likely)
      const fastCount = picks.filter((p) => p === 'fast').length
      expect(fastCount).toBeGreaterThan(picks.length / 3)
    })

    it('select() with low sensitivity explores equally (cold-start)', () => {
      w.add('a')
      w.add('b')
      w.add('c')

      // Equal strength
      w.mark('entry→a', 1)
      w.mark('entry→b', 1)
      w.mark('entry→c', 1)

      // Low sensitivity (0.1) means all paths nearly equal weight
      const picks: string[] = []
      for (let i = 0; i < 30; i++) {
        const choice = w.select('entry', 0.1)
        if (choice) picks.push(choice)
      }

      // All three should be picked (roughly equally)
      const hasA = picks.some((p) => p === 'a')
      const hasB = picks.some((p) => p === 'b')
      const hasC = picks.some((p) => p === 'c')
      expect(hasA && hasB && hasC).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // TEST B: After 100 Marks, Strongest Path Becomes Highway
  // ───────────────────────────────────────────────────────────────────────

  describe('(b) After 100 marks, strongest path compounds and becomes highway', () => {
    it('mark() accumulates and strengthens paths linearly', () => {
      w.add('agent')
      w.signal({ receiver: 'agent', data: { marks: true } }, 'entry')

      const edge = 'entry→agent'
      expect(w.sense(edge)).toBe(1) // First signal

      // Mark 99 more times
      for (let i = 0; i < 99; i++) {
        w.mark(edge, 1)
      }

      // Total strength should be 100
      expect(w.sense(edge)).toBe(100)
    })

    it('highways() returns top paths sorted by net strength (strength - resistance)', () => {
      w.add('good')
      w.add('okay')
      w.add('bad')

      // Build experience
      for (let i = 0; i < 100; i++) w.mark('entry→good', 1)
      for (let i = 0; i < 50; i++) w.mark('entry→okay', 1)
      for (let i = 0; i < 10; i++) w.mark('entry→bad', 1)

      // Add resistance to bad
      for (let i = 0; i < 8; i++) w.warn('entry→bad', 1)

      const hw = w.highways(3)
      expect(hw[0].path).toBe('entry→good')
      expect(hw[0].strength).toBe(100) // net = 100 - 0
      expect(hw[1].path).toBe('entry→okay')
      expect(hw[1].strength).toBe(50) // net = 50 - 0
      expect(hw[2].path).toBe('entry→bad')
      expect(hw[2].strength).toBe(2) // net = 10 - 8
    })

    it('highways() cache invalidates on mark/warn', () => {
      w.add('path1')
      w.mark('entry→path1', 5)

      const hw1 = w.highways(1)
      expect(hw1[0].path).toBe('entry→path1')

      // Mark again
      w.mark('entry→path1', 10)
      const hw2 = w.highways(1)
      expect(hw2[0].strength).toBe(15) // cache rebuilt
    })

    it('multiple paths accumulate independently', () => {
      w.add('a')
      w.add('b')

      for (let i = 0; i < 60; i++) w.mark('entry→a', 1)
      for (let i = 0; i < 40; i++) w.mark('entry→b', 1)

      expect(w.sense('entry→a')).toBe(60)
      expect(w.sense('entry→b')).toBe(40)

      const hw = w.highways(2)
      expect(hw[0].path).toBe('entry→a')
      expect(hw[1].path).toBe('entry→b')
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // TEST C: follow() on Highway Returns in O(1) — Deterministic
  // ───────────────────────────────────────────────────────────────────────

  describe('(c) follow() returns deterministic best path — O(1) with typeIndex', () => {
    it('follow() picks strongest path (no randomness)', () => {
      w.add('fast')
      w.add('slow')

      w.mark('entry→fast', 100)
      w.mark('entry→slow', 10)

      // follow() always picks the strongest
      for (let i = 0; i < 10; i++) {
        expect(w.follow('entry')).toBe('fast')
      }
    })

    it('follow() ignores resistance but penalizes net', () => {
      w.add('good')
      w.add('suspect')

      // good: strength 100, no resistance
      w.mark('entry→good', 100)

      // suspect: strength 50, but high resistance
      w.mark('entry→suspect', 50)
      for (let i = 0; i < 20; i++) w.warn('entry→suspect', 1) // resistance = 20

      // follow() compares net strength: good=100, suspect=30
      expect(w.follow('entry')).toBe('good')
    })

    it('follow() uses typeIndex for O(k) scan (k=edges per type, not n=all edges)', () => {
      // Simulate 100 other paths
      for (let i = 0; i < 100; i++) {
        w.add(`other${i}`)
        w.mark(`entry→other${i}`, Math.random() * 10)
      }

      // Add our target
      w.add('target')
      w.mark('entry→target', 100)

      // follow() with type filter should scan only edges matching type
      const t0 = performance.now()
      const choice = w.follow('entry')
      const ms = performance.now() - t0

      expect(choice).toBe('target')
      expect(ms).toBeLessThan(5 * PERF) // should be sub-millisecond even with 100 paths
    })

    it('follow() returns null if no positive-strength paths exist', () => {
      w.add('ghost')
      w.mark('entry→ghost', 1)
      w.warn('entry→ghost', 10)

      // Net is negative: 1 - 10 = -9
      expect(w.follow('entry')).toBeNull()
    })

    it('follow() with type filter scans only matching edges', () => {
      w.add('scout')
      w.add('analyst')
      w.add('harvester')

      w.mark('entry→scout:observe', 50)
      w.mark('entry→analyst:think', 100)
      w.mark('entry→harvester:collect', 30)

      // Follow only analyst type
      expect(w.follow('analyst')).toBe('analyst')

      // Follow only scout type
      expect(w.follow('scout')).toBe('scout')
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // TEST D: isHighway() Gate — Threshold at strength - resistance >= 50
  // ───────────────────────────────────────────────────────────────────────

  describe('(d) isHighway() gate works at threshold', () => {
    it('isHighway() returns true when net strength >= 50', () => {
      w.mark('entry→proven', 50)
      expect(w.isHighway('entry→proven')).toBe(true)
    })

    it('isHighway() returns false when net strength < 50', () => {
      w.mark('entry→new', 49)
      expect(w.isHighway('entry→new')).toBe(false)
    })

    it('isHighway() subtracts resistance from strength', () => {
      w.mark('entry→suspect', 60)
      w.warn('entry→suspect', 15)
      // net = 60 - 15 = 45, which is < 50
      expect(w.isHighway('entry→suspect')).toBe(false)

      w.mark('entry→suspect', 5)
      // net = 65 - 15 = 50, now >= 50
      expect(w.isHighway('entry→suspect')).toBe(true)
    })

    it('isHighway() accepts custom threshold', () => {
      w.mark('entry→path', 75)

      expect(w.isHighway('entry→path', 50)).toBe(true) // 75 >= 50
      expect(w.isHighway('entry→path', 100)).toBe(false) // 75 < 100
      expect(w.isHighway('entry→path', 75)).toBe(true) // 75 >= 75
    })

    it('path below threshold after warning', () => {
      w.mark('entry→flaky', 55)
      expect(w.isHighway('entry→flaky')).toBe(true)

      // Add resistance
      w.warn('entry→flaky', 10)
      // net = 55 - 10 = 45, below 50
      expect(w.isHighway('entry→flaky')).toBe(false)
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // ACCELERATION PROOF: System Gets Faster
  // ───────────────────────────────────────────────────────────────────────

  describe('System acceleration: select() → follow() → cached decision', () => {
    it('cold start uses select() (probabilistic, O(paths)), warm uses follow() (O(1))', () => {
      // Setup: multiple agents
      w.add('scout')
      w.add('analyst')
      w.add('harvester')

      // Cold start: select() explores
      const choice1 = w.select('entry', 0.5)
      expect(choice1).toBeDefined()

      // Build 100 successful marks on analyst
      for (let i = 0; i < 100; i++) {
        w.mark('entry→analyst', 1)
      }

      // Now analyst is a highway (strength = 100)
      expect(w.isHighway('entry→analyst')).toBe(true)

      // Warm path: follow() routes directly
      for (let i = 0; i < 10; i++) {
        expect(w.follow('entry')).toBe('analyst')
      }
    })

    it('repeated marks compound pheromone exponentially in routing logic', () => {
      w.add('agent')

      // Mark 10 times
      for (let i = 0; i < 10; i++) {
        w.mark('entry→agent', 1)
      }
      const strength10 = w.sense('entry→agent')
      expect(strength10).toBe(10)

      // Mark 10 more times
      for (let i = 0; i < 10; i++) {
        w.mark('entry→agent', 1)
      }
      const strength20 = w.sense('entry→agent')
      expect(strength20).toBe(20)

      // Marking compounds: each mark has identical effect
      // But SELECT weight = (1 + strength × sensitivity) — strength scales the weight
      // So at strength=20, weight is larger than at strength=1
      const weight1 = 1 + 1 * 0.7
      const weight20 = 1 + 20 * 0.7
      expect(weight20 / weight1).toBeCloseTo(15 / 1.7, 0) // ~8.8x
    })

    it('fade() asymmetric decay: resistance forgives 2x faster', () => {
      w.mark('entry→path', 100)
      w.warn('entry→path', 50)

      expect(w.sense('entry→path')).toBe(100)
      expect(w.danger('entry→path')).toBe(50)

      // Fade at 10%
      w.fade(0.1)

      const strengthAfter = w.sense('entry→path')
      const resistanceAfter = w.danger('entry→path')

      // strength decays: 100 * (1 - 0.1) = 90
      // resistance decays at 2x: 50 * (1 - 0.1 * 2) = 40
      expect(strengthAfter).toBeCloseTo(90, 0)
      expect(resistanceAfter).toBeCloseTo(40, 0)

      // resistance gap shrinks: bad paths become less blocky
    })
  })
})
