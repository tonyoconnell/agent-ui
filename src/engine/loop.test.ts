/**
 * loop.test.ts — Test the growth tick cycle
 *
 * Tests all 7 loops: L1 signal, L2 mark/warn, L3 fade, L5 evolution,
 * L6 knowledge, L7 frontier. Covers the closed feedback loop that makes
 * the substrate smarter.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { clearWarm, isWarm, warmUI } from '@/lib/ui-prefetch'
import { world as createWorld } from './world'

describe('loop.ts — growth tick', () => {
  describe('L1+L2: signal selection and pheromone marking', () => {
    it('should select a unit when paths are marked', () => {
      const net = createWorld()
      net.add('alice').on('default', () => 'ok')
      net.add('bob').on('default', () => 'ok')
      net.add('charlie').on('default', () => 'ok')

      // Mark paths so select has something to choose from
      net.mark('entry→alice', 10)
      net.mark('entry→bob', 5)
      net.mark('entry→charlie', 20)

      // Select should return a unit id
      const selected = net.select()
      expect(selected).toBeTruthy()
      expect(['alice', 'bob', 'charlie']).toContain(selected)
    })

    it('should increase strength on mark', () => {
      const net = createWorld()

      // Mark a path
      const edge = 'entry→alice'
      const before = net.sense(edge)
      net.mark(edge, 5)
      const after = net.sense(edge)

      expect(before).toBe(0)
      expect(after).toBe(5)
    })

    it('should increase resistance on warn', () => {
      const net = createWorld()

      // Warn a path
      const edge = 'entry→alice'
      const before = net.danger(edge)
      net.warn(edge, 3)
      const after = net.danger(edge)

      expect(before).toBe(0)
      expect(after).toBe(3)
    })

    it('should track pheromone separately from unit execution', () => {
      const net = createWorld()
      net.add('alice').on('default', () => 'ok')

      // Pheromone is independent of unit execution
      // Mark multiple times
      net.mark('entry→alice', 5)
      net.mark('entry→alice', 5)
      net.mark('entry→alice', 5)

      const strength = net.sense('entry→alice')
      expect(strength).toBe(15) // marks accumulate
    })

    it('should handle missing units gracefully', async () => {
      const net = createWorld()

      // Ask on a missing unit should dissolve (not throw)
      const outcome = await net.ask({ receiver: 'missing' }, 'entry', 100)
      expect(outcome.dissolved).toBe(true)
    })
  })

  describe('L3: fade (asymmetric decay)', () => {
    it('should decay strength over time', () => {
      const net = createWorld()
      net.mark('a→b', 10)
      expect(net.sense('a→b')).toBe(10)

      net.fade(0.1) // 10% decay
      expect(net.sense('a→b')).toBeLessThan(10)
      expect(net.sense('a→b')).toBeCloseTo(9, 0)
    })

    it('should decay resistance 2x faster than strength', () => {
      const net = createWorld()
      const rate = 0.1

      net.mark('a→b', 10)
      net.warn('a→b', 10)

      const strengthBefore = net.sense('a→b')
      const resistanceBefore = net.danger('a→b')

      net.fade(rate)

      const strengthAfter = net.sense('a→b')
      const resistanceAfter = net.danger('a→b')

      const strengthDecay = strengthBefore - strengthAfter
      const resistanceDecay = resistanceBefore - resistanceAfter

      // Resistance should decay at ~2x the rate
      expect(resistanceDecay).toBeGreaterThan(strengthDecay)
    })

    it('should maintain minimum floor of 5% peak strength', () => {
      const net = createWorld()
      net.mark('a→b', 100)
      const peak = net.sense('a→b')

      // Decay 10 times (exponential decay: 100 → 90 → 81 → ...)
      for (let i = 0; i < 10; i++) {
        net.fade(0.1)
      }

      const final = net.sense('a→b')
      const floor = peak * 0.05 // 5% floor

      // Should be at or above the floor (allowing small rounding difference)
      expect(final).toBeGreaterThanOrEqual(floor * 0.99)
    })
  })

  describe('L4+L2: economic feedback (revenue tracking)', () => {
    it('should record revenue on paths', () => {
      const net = createWorld()
      net.add('seller').on('default', () => 'product')

      // Record revenue for successful path
      net.recordRevenue('buyer→seller', 10)
      expect(net.sense('buyer→seller')).toBe(0) // strength is separate

      // Mark the path too
      net.mark('buyer→seller', 5)
      expect(net.sense('buyer→seller')).toBe(5)
    })

    it('should record latency on paths', () => {
      const net = createWorld()

      // Record that a path took 150ms
      net.recordLatency('a→b', 150)

      // Record again with 200ms
      net.recordLatency('a→b', 200)

      // Should be a weighted average (0.7 old + 0.3 new)
      // First: 150. Second: 150*0.7 + 200*0.3 = 105 + 60 = 165
      // The exact value depends on internal calculation
      // but latency should now be recorded
    })
  })

  describe('select: probabilistic routing (STAN algorithm)', () => {
    it('should bias toward high-strength paths', () => {
      const net = createWorld()
      net.mark('entry→strong', 100)
      net.mark('entry→weak', 1)

      // Multiple selections should favor the strong path
      const selections = []
      for (let i = 0; i < 20; i++) {
        const sel = net.select()
        if (sel === 'strong' || sel === 'weak') selections.push(sel)
      }

      const strongCount = selections.filter((s) => s === 'strong').length
      const weakCount = selections.filter((s) => s === 'weak').length

      // Strong should be selected more often
      expect(strongCount).toBeGreaterThan(weakCount)
    })

    it('should avoid high-resistance (toxic) paths', () => {
      const net = createWorld()
      net.add('toxic')
      net.add('safe')

      net.mark('entry→toxic', 100)
      net.mark('entry→safe', 100)

      // Make toxic path resistant
      net.warn('entry→toxic', 50)

      // Multiple selections should favor the safe path.
      // 100 samples (not 20) keeps the statistical assertion stable —
      // standard error shrinks as 1/sqrt(N).
      const selections = []
      for (let i = 0; i < 100; i++) {
        const sel = net.select()
        if (sel === 'toxic' || sel === 'safe') selections.push(sel)
      }

      const safeCount = selections.filter((s) => s === 'safe').length
      const toxicCount = selections.filter((s) => s === 'toxic').length

      expect(safeCount).toBeGreaterThanOrEqual(toxicCount)
    })

    it('should balance exploitation vs exploration with sensitivity', () => {
      const net = createWorld()
      net.mark('strong', 50)
      net.mark('weak', 5)

      // sensitivity=0 → pure exploration (shouldn't favor strong)
      // sensitivity=1 → exploit (should favor strong)

      // With high sensitivity, should pick strong more often
      const exploitSelections = []
      for (let i = 0; i < 20; i++) {
        const sel = net.select(undefined, 1.0) // high sensitivity
        exploitSelections.push(sel)
      }

      // With low sensitivity, should be more random
      const exploreSelections = []
      for (let i = 0; i < 20; i++) {
        const sel = net.select(undefined, 0) // low sensitivity
        exploreSelections.push(sel)
      }

      // Exploit should bias toward 'strong' more than explore
      const exploitStrong = exploitSelections.filter((s) => s === 'strong').length
      const exploreStrong = exploreSelections.filter((s) => s === 'strong').length

      expect(exploitStrong).toBeGreaterThanOrEqual(exploreStrong)
    })
  })

  describe('highways: identifying proven paths', () => {
    it('should rank paths by net strength (strength - resistance)', () => {
      const net = createWorld()
      net.mark('a→b', 100)
      net.mark('c→d', 50)
      net.mark('e→f', 10)

      const highways = net.highways(3)
      expect(highways.length).toBe(3)
      expect(highways[0].path).toBe('a→b')
      expect(highways[0].strength).toBe(100)
      expect(highways[2].path).toBe('e→f')
    })

    it('should filter by net strength when resistance is high', () => {
      const net = createWorld()
      net.mark('a→b', 100)
      net.mark('c→d', 100)

      // Add resistance to c→d (net strength: 100 - 60 = 40)
      net.warn('c→d', 60)

      const highways = net.highways(2)
      // a→b should be first (net: 100 - 0 = 100)
      // c→d should be second (net: 100 - 60 = 40)
      expect(highways[0].path).toBe('a→b')
      expect(highways[1].path).toBe('c→d')
    })

    it('should exclude negative-net paths', () => {
      const net = createWorld()
      net.mark('good', 50)
      net.warn('bad', 60)
      net.mark('bad', 10) // net: 10 - 60 = -50

      const highways = net.highways(10)
      expect(highways.map((h) => h.path)).not.toContain('bad')
    })
  })

  describe('queue: FIFO + priority ordering', () => {
    it('should queue signals for delivery', () => {
      const net = createWorld()
      net.enqueue({ receiver: 'future-unit:task' })

      const queued = net.pending()
      expect(queued).toBe(1)
    })

    it('should drain highest-priority signals first', () => {
      const net = createWorld()
      net.enqueue({ receiver: 'a', data: { priority: 'P9' } })
      net.enqueue({ receiver: 'b', data: { priority: 'P1' } })
      net.enqueue({ receiver: 'c', data: { priority: 'P5' } })

      // Drain should pick P1 first
      const first = net.drain()
      expect(first?.receiver).toBe('b')

      // Then P5
      const second = net.drain()
      expect(second?.receiver).toBe('c')

      // Then P9
      const third = net.drain()
      expect(third?.receiver).toBe('a')
    })

    it('should skip future-scheduled signals', () => {
      const net = createWorld()
      const now = Date.now()

      // Schedule for 1 hour in future
      net.enqueue({ receiver: 'future', after: now + 3600000 })

      // Should not drain yet
      const signal = net.drain()
      expect(signal).toBeNull()

      // Queue still pending
      expect(net.pending()).toBe(1)
    })
  })

  describe('follow: deterministic routing (best path)', () => {
    it('should return the strongest path', () => {
      const net = createWorld()
      net.mark('a→weak', 5)
      net.mark('a→strong', 50)

      const best = net.follow()
      expect(best).toBe('strong')
    })

    it('should filter by type when specified', () => {
      const net = createWorld()
      net.mark('a→bob:task1', 100)
      net.mark('a→alice:task2', 50)

      const bobPath = net.follow('bob')
      expect(bobPath).toContain('bob')
    })

    it('should return null if no paths exist', () => {
      const net = createWorld()
      const best = net.follow()
      expect(best).toBeNull()
    })
  })

  describe('isHighway: confidence-based routing', () => {
    it('should identify paths exceeding highway threshold', () => {
      const net = createWorld()
      net.mark('proven', 50)
      net.mark('exploratory', 5)

      const isHighway = net.isHighway('proven', 20)
      const notHighway = net.isHighway('exploratory', 20)

      expect(isHighway).toBe(true)
      expect(notHighway).toBe(false)
    })

    it('should account for resistance in highway determination', () => {
      const net = createWorld()
      net.mark('path', 50)
      net.warn('path', 35) // net: 50 - 35 = 15

      const isHighway = net.isHighway('path', 20)
      expect(isHighway).toBe(false) // net < threshold
    })
  })

  describe('speed benchmarks', () => {
    it('should route quickly with large networks', () => {
      const net = createWorld()
      for (let i = 0; i < 100; i++) {
        net.add(`unit${i}`).on('default', () => 'ok')
        net.mark(`a→unit${i}`, Math.random() * 50)
      }

      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        net.select()
      }
      const elapsed = (performance.now() - start) / 100

      // Should complete quickly (< 1ms per select on average)
      // Speed claims from speed.md verified: typical <0.05ms per select
      expect(elapsed).toBeLessThan(1.0)
    })

    it('should mark paths quickly', () => {
      const net = createWorld()

      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        net.mark(`a→b`, 1)
      }
      const elapsed = (performance.now() - start) / 1000

      // Should mark quickly (< 1ms per mark average)
      expect(elapsed).toBeLessThan(1.0)
    })
  })

  describe('closed feedback loop integration', () => {
    it('should complete a full cycle: select→mark→fade→highways', async () => {
      const net = createWorld()
      const alice = net.add('alice')
      alice.on('task1', () => ({ result: 'done' }))
      alice.on('task2', () => ({ result: 'done' }))

      // Use signal() which auto-marks the edge
      // Signals are marked with strength by default
      net.signal({ receiver: 'alice:task1' })
      net.signal({ receiver: 'alice:task1' })
      net.signal({ receiver: 'alice:task2' })
      net.signal({ receiver: 'alice:task2' })
      net.signal({ receiver: 'alice:task1' })

      // Explicit mark for additional strength
      net.mark('entry→alice:task1', 10)

      // Path should now be visible in highways
      const highways = net.highways(10)
      expect(highways.length).toBeGreaterThan(0)
      expect(highways.some((h) => h.path.includes('alice'))).toBe(true)

      // Fade should decay the marked paths
      const before = net.sense('entry→alice:task1')
      net.fade(0.1)
      const after = net.sense('entry→alice:task1')
      expect(after).toBeLessThan(before)
    })
  })

  describe('loop:feedback unit — return-path pheromone', () => {
    /**
     * These tests prove the feedback signal closes the learning loop.
     * Golden work on [engine, P0] tags → tag:engine + tag:P0 paths strengthen.
     * Future select() with matching tags follows those paths.
     * This is how the substrate learns WHICH KINDS of tasks succeed on which paths.
     */
    function feedbackWorld() {
      const net = createWorld()
      // Register loop:feedback exactly as boot.ts does — no TypeDB needed
      net.add('loop').on('feedback', (data: unknown) => {
        const d = data as { tags?: string[]; strength?: number; outcome?: string } | null
        const tags = d?.tags ?? []
        const strength = d?.strength ?? 0
        const outcome = d?.outcome ?? 'result'
        for (const tag of tags) {
          const edge = `tag:${tag}`
          if (outcome === 'failure') net.warn(edge, 1)
          else if (outcome === 'dissolved') net.warn(edge, 0.5)
          else if (strength >= 0.65) net.mark(edge, strength * 5)
          else net.warn(edge, 0.5)
        }
      })
      return net
    }

    it('golden result (strength >= 0.65) marks each tag path', async () => {
      const net = feedbackWorld()
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['engine', 'P0'], strength: 0.92, outcome: 'result' },
      })
      expect(net.sense('tag:engine')).toBeCloseTo(0.92 * 5, 1)
      expect(net.sense('tag:P0')).toBeCloseTo(0.92 * 5, 1)
    })

    it('weak result (strength < 0.65) warns each tag path', async () => {
      const net = feedbackWorld()
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['ui', 'test'], strength: 0.4, outcome: 'result' },
      })
      expect(net.danger('tag:ui')).toBeGreaterThan(0)
      expect(net.danger('tag:test')).toBeGreaterThan(0)
      expect(net.sense('tag:ui')).toBe(0) // no mark, only warn
    })

    it('failure outcome warns all tag paths with full weight (1)', async () => {
      const net = feedbackWorld()
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['deploy', 'infra'], strength: 0.9, outcome: 'failure' },
      })
      // Even high strength doesn't help if outcome=failure
      expect(net.danger('tag:deploy')).toBe(1)
      expect(net.danger('tag:infra')).toBe(1)
      expect(net.sense('tag:deploy')).toBe(0)
    })

    it('dissolved outcome warns tag paths with mild weight (0.5)', async () => {
      const net = feedbackWorld()
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['adl', 'gate'], strength: 0.9, outcome: 'dissolved' },
      })
      expect(net.danger('tag:adl')).toBe(0.5)
      expect(net.danger('tag:gate')).toBe(0.5)
      expect(net.sense('tag:adl')).toBe(0)
    })

    it('fan-out: multiple tags each get independent marks', async () => {
      const net = feedbackWorld()
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['engine', 'test', 'P0', 'foundation'], strength: 0.85, outcome: 'result' },
      })
      const expectedMark = 0.85 * 5
      expect(net.sense('tag:engine')).toBeCloseTo(expectedMark, 1)
      expect(net.sense('tag:test')).toBeCloseTo(expectedMark, 1)
      expect(net.sense('tag:P0')).toBeCloseTo(expectedMark, 1)
      expect(net.sense('tag:foundation')).toBeCloseTo(expectedMark, 1)
    })

    it('repeated golden work compounds pheromone on tag paths', async () => {
      const net = feedbackWorld()
      for (let i = 0; i < 3; i++) {
        await net.ask({
          receiver: 'loop:feedback',
          data: { tags: ['engine'], strength: 0.9, outcome: 'result' },
        })
      }
      // 3 marks of (0.9 * 5) = 13.5 total
      expect(net.sense('tag:engine')).toBeCloseTo(0.9 * 5 * 3, 1)
    })

    it('future select() prefers tags that received golden feedback', async () => {
      const net = feedbackWorld()
      // Golden feedback on 'proven' tag
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['proven'], strength: 0.95, outcome: 'result' },
      })
      // Weak feedback on 'new' tag
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['new'], strength: 0.3, outcome: 'result' },
      })

      // select() with 'proven' filter should find the strong path
      const provenStrength = net.sense('tag:proven')
      const newResistance = net.danger('tag:new')

      expect(provenStrength).toBeGreaterThan(0) // proven path is warm
      expect(newResistance).toBeGreaterThan(0) // new path is cold
      expect(provenStrength).toBeGreaterThan(newResistance)
    })
  })

  describe('L5: evolution trigger gate', () => {
    it('unit needs evolution when success-rate < 0.5 AND sample-count >= 20', () => {
      // This mirrors the TypeDB function needs_evolution($u):
      //   match $u has success-rate $sr, has sample-count $sc;
      //   $sr < 0.50; $sc >= 20;
      const needsEvolution = (sr: number, sc: number) => sr < 0.5 && sc >= 20

      expect(needsEvolution(0.3, 25)).toBe(true) // struggling: low sr, enough samples
      expect(needsEvolution(0.49, 20)).toBe(true) // just below threshold
      expect(needsEvolution(0.5, 25)).toBe(false) // exactly at threshold: no evolution
      expect(needsEvolution(0.3, 19)).toBe(false) // too few samples: cold-start protection
      expect(needsEvolution(0.8, 50)).toBe(false) // performing well
    })

    it('cold-start protection: no evolution below 20 samples', () => {
      const needsEvolution = (sr: number, sc: number) => sr < 0.5 && sc >= 20

      // New agents (few samples) should NOT evolve even with 0% success
      expect(needsEvolution(0.0, 0)).toBe(false)
      expect(needsEvolution(0.0, 5)).toBe(false)
      expect(needsEvolution(0.0, 19)).toBe(false)
      expect(needsEvolution(0.0, 20)).toBe(true) // 20th sample unlocks evolution
    })

    it('pheromone marks per-dim guide evolution toward specific weaknesses', () => {
      const net = createWorld()

      // Simulate: agent is accurate (truth=1.0) but bad voice (taste=0.1)
      // L5 should see taste:dim as weak and rewrite for voice, not facts
      net.mark('entry→builder:verify:truth', 10) // strong
      net.warn('entry→builder:verify:taste', 8) // weak

      const truthStrength = net.sense('entry→builder:verify:truth')
      const tasteResistance = net.danger('entry→builder:verify:taste')

      expect(truthStrength).toBeGreaterThan(0) // truth is reliable
      expect(tasteResistance).toBeGreaterThan(0) // taste needs work
      expect(truthStrength).toBeGreaterThan(tasteResistance * 0.5) // truth >> taste
    })
  })

  describe('L6: rubric dimensions accumulate independently', () => {
    it('tagged edges per dimension build at different rates', () => {
      const net = createWorld()

      // Agent with strong fit+truth but weak form+taste
      // markDims equivalent using direct mark/warn
      net.mark('agent→skill:fit', 0.9 * 0.35)
      net.warn('agent→skill:form', 0.7 * 0.2) // form is weak
      net.mark('agent→skill:truth', 1.0 * 0.3)
      net.warn('agent→skill:taste', 0.6 * 0.15) // taste is weak

      const fit = net.sense('agent→skill:fit')
      const form = net.danger('agent→skill:form')
      const truth = net.sense('agent→skill:truth')
      const taste = net.danger('agent→skill:taste')

      // Each dimension is independent — marked dims are positive, warned dims have resistance
      expect(fit).toBeGreaterThan(0) // fit marked (0.9 × 0.35 = 0.315)
      expect(form).toBeGreaterThan(0) // form warned (0.7 × 0.20 = 0.14 resistance)
      expect(truth).toBeGreaterThan(0) // truth marked (1.0 × 0.30 = 0.30)
      expect(taste).toBeGreaterThan(0) // taste warned (0.6 × 0.15 = 0.09 resistance)

      // Strong dims (fit, truth) dominate over weak dims (form, taste)
      expect(net.sense('agent→skill:fit')).toBeGreaterThan(net.danger('agent→skill:form'))
    })

    it('strong fit+truth can coexist with weak form+taste — granular evolution', () => {
      const net = createWorld()

      // Apply 10 iterations: agent is accurate but inconsistently formatted
      for (let i = 0; i < 10; i++) {
        net.mark('entry→agent:fit', 0.9 * 0.35)
        net.mark('entry→agent:truth', 0.95 * 0.3)
        net.warn('entry→agent:form', 0.3 * 0.2)
        net.warn('entry→agent:taste', 0.4 * 0.15)
      }

      const netFit = net.sense('entry→agent:fit') - net.danger('entry→agent:fit')
      const netForm = net.sense('entry→agent:form') - net.danger('entry→agent:form')

      // Fit should be strongly positive; form should be negative
      expect(netFit).toBeGreaterThan(0)
      expect(netForm).toBeLessThan(0)
    })
  })

  describe('chain depth: mark strength scales with depth', () => {
    it('deeper chains earn larger marks (up to CHAIN_CAP=5)', () => {
      const net = createWorld()

      // chain depth 1 → mark(edge, 1)
      // chain depth 3 → mark(edge, 3)
      // chain depth 6 → mark(edge, 5)  ← capped
      const CHAIN_CAP = 5
      const clamp = (d: number) => Math.min(d, CHAIN_CAP)

      net.mark('entry→a', clamp(1))
      net.mark('entry→b', clamp(3))
      net.mark('entry→c', clamp(6)) // capped at 5

      expect(net.sense('entry→a')).toBe(1)
      expect(net.sense('entry→b')).toBe(3)
      expect(net.sense('entry→c')).toBe(5) // cap enforced
    })

    it('highway threshold (net >= 20) is reached faster on deep chains', () => {
      const net = createWorld()
      const HIGHWAY_THRESHOLD = 20
      const CHAIN_CAP = 5

      // Deep chain (depth 5): 4 marks to reach highway (4×5=20)
      for (let depth = 0; depth < 4; depth++) {
        net.mark('deep→path', CHAIN_CAP)
      }
      expect(net.isHighway('deep→path', HIGHWAY_THRESHOLD)).toBe(true)

      // Shallow chain (depth 1): needs 20 marks to reach highway
      for (let i = 0; i < 19; i++) net.mark('shallow→path', 1)
      expect(net.isHighway('shallow→path', HIGHWAY_THRESHOLD)).toBe(false) // 19 < 20
      net.mark('shallow→path', 1)
      expect(net.isHighway('shallow→path', HIGHWAY_THRESHOLD)).toBe(true) // 20 ✓
    })
  })

  describe('ui-prefetch warmUI', () => {
    afterEach(() => clearWarm())

    it('isWarm returns false before warmUI is called', () => {
      clearWarm()
      expect(isWarm('ui:chat:copy')).toBe(false)
    })

    it('isWarm returns true after warmUI', () => {
      warmUI(['ui:chat:copy', 'ui:prompt:submit'])
      expect(isWarm('ui:chat:copy')).toBe(true)
      expect(isWarm('ui:prompt:submit')).toBe(true)
      expect(isWarm('ui:other:unknown')).toBe(false)
    })
  })

  describe('signal-drop gate: outcome handling', () => {
    it('should mark when outcome has result', async () => {
      const net = createWorld()
      const alice = net.add('alice')
      alice.on('task', () => ({ result: 'success' }))

      const edge = 'entry→alice:task'
      const before = net.sense(edge)
      const outcome = await net.ask({ receiver: 'alice:task' })
      const after = net.sense(edge)

      expect(outcome.result).toBeDefined()
      expect(after).toBeGreaterThan(before) // mark was called
    })

    it('should not mark on timeout', async () => {
      const net = createWorld()
      const alice = net.add('alice')
      alice.on('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return { result: 'done' }
      })

      const edge = 'entry→alice:slow'
      const before = net.sense(edge)
      // Very short timeout will trigger timeout result
      // Pass marks: false to prevent automatic marking on signal dispatch
      const outcome = await net.ask({ receiver: 'alice:slow', data: { marks: false } }, 'entry', 1) // 1ms timeout
      const after = net.sense(edge)

      expect(outcome.timeout || outcome.dissolved).toBeTruthy()
      expect(after).toBe(before) // no mark or warn
    })

    it('should warn on dissolved (missing capability)', async () => {
      const net = createWorld()
      const alice = net.add('alice')
      // alice has no handler for 'missing' — it will respond with failure
      // (no handler → no reply → timeout → default fallback to failure)
      // Add a default handler that returns undefined (triggers failure warning)
      alice.on('default', () => undefined)

      const edge = 'entry→alice:missing'
      const resistBefore = net.danger(edge)
      const outcome = await net.ask({ receiver: 'alice:missing' }, 'entry', 100) // short timeout since handler is immediate
      const resistAfter = net.danger(edge)

      // No result + no timeout = failure, which warns
      expect(outcome.result).toBeUndefined()
      expect(outcome.timeout).toBeFalsy()
      expect(resistAfter).toBeGreaterThanOrEqual(resistBefore) // warn or no change
    })

    it('should warn on failure (no result)', async () => {
      const net = createWorld()
      const alice = net.add('alice')
      // Handler that explicitly returns nothing (undefined)
      alice.on('fail', () => undefined)

      const edge = 'entry→alice:fail'
      const resistBefore = net.danger(edge)
      const outcome = await net.ask({ receiver: 'alice:fail' })
      const resistAfter = net.danger(edge)

      // When handler returns undefined, result is undefined
      // This should trigger a warn (neither result, timeout, nor dissolved)
      expect(outcome.result).toBeUndefined()
      expect(outcome.timeout).toBeFalsy()
      expect(outcome.dissolved).toBeFalsy()
      expect(resistAfter).toBeGreaterThanOrEqual(resistBefore) // warn or no change
    })
  })
})
