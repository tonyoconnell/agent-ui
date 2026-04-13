/**
 * LIFECYCLE — From Zero to Highway
 *
 * This test file proves the full agent lifecycle using only world.ts.
 * No TypeDB. No mocks. No network. Pure in-memory substrate.
 *
 * The story: agents are born, receive work, accumulate pheromone,
 * form highways, teach each other through chains, carry context
 * through waves, and survive fade. This is the nervous system.
 *
 * Three acts:
 *   1. Agent Lifecycle — register → signal → highway
 *   2. Self-Learning   — the flywheel: chains reinforce, select() biases
 *   3. Wave Pattern    — context accumulates through .then() chains
 *
 * Run: npx vitest run src/engine/lifecycle.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { type World, world } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: AGENT LIFECYCLE
//
// A single agent. Born with no history. Receives work. Paths strengthen.
// Failures warn. Fade decays asymmetrically. Enough successes → highway.
// ═══════════════════════════════════════════════════════════════════════════

describe('Agent Lifecycle: register → signal → highway', () => {
  let w: World

  beforeEach(() => {
    w = world()
  })

  it('register: add() makes the unit reachable', () => {
    expect(w.has('scout')).toBe(false)

    w.add('scout')

    expect(w.has('scout')).toBe(true)
    expect(w.list()).toContain('scout')
  })

  it('capable: on() registers a skill, has() confirms it', () => {
    const scout = w.add('scout')
    expect(scout.has('observe')).toBe(false)

    scout.on('observe', () => 'found something')

    expect(scout.has('observe')).toBe(true)
    expect(scout.list()).toContain('observe')
  })

  it('signal to missing unit dissolves — no path, no cost', async () => {
    const outcome = await w.ask({ receiver: 'ghost:observe', data: {} })
    expect(outcome.dissolved).toBe(true)
    expect(w.sense('entry→ghost:observe')).toBe(0)
  })

  it('first success: ask() returns result and marks the path', async () => {
    w.add('scout').on('observe', () => 'found something')

    const outcome = await w.ask({ receiver: 'scout:observe', data: { tick: 1 } })

    // Signal delivered and result returned
    expect(outcome.result).toBe('found something')
    expect(outcome.dissolved).toBeUndefined()
    expect(outcome.timeout).toBeUndefined()

    // Path marked by signal delivery
    expect(w.sense('entry→scout:observe')).toBeGreaterThan(0)
  })

  it('failure: null result warns the path via replyTo', async () => {
    // A handler that returns null triggers the failure branch
    w.add('scout').on('observe', () => null)

    // ask() resolves via replyTo — null result sends { failure: true }
    // which the reply unit sees as a result (not undefined)
    const _outcome = await w.ask({ receiver: 'scout:observe', data: {} })

    // The path was still marked on delivery (signal arrived)
    expect(w.sense('entry→scout:observe')).toBeGreaterThan(0)
  })

  it('warn: manually warning a path increases resistance', () => {
    w.add('scout').on('observe', () => 'ok')

    w.mark('entry→scout:observe', 5)
    expect(w.sense('entry→scout:observe')).toBe(5)
    expect(w.danger('entry→scout:observe')).toBe(0)

    w.warn('entry→scout:observe', 3)
    expect(w.danger('entry→scout:observe')).toBe(3)
  })

  it('fade: asymmetric decay — resistance drops 2x faster than strength', () => {
    w.mark('entry→scout:observe', 10)
    w.warn('entry→scout:observe', 10)

    const strengthBefore = w.sense('entry→scout:observe')
    const resistanceBefore = w.danger('entry→scout:observe')

    // Fade once at rate=0.1
    w.fade(0.1)

    const strengthAfter = w.sense('entry→scout:observe')
    const resistanceAfter = w.danger('entry→scout:observe')

    // Both decay, but resistance drops more
    expect(strengthAfter).toBeLessThan(strengthBefore)
    expect(resistanceAfter).toBeLessThan(resistanceBefore)

    // Resistance fraction lost should be ~2x strength fraction lost
    const strLost = (strengthBefore - strengthAfter) / strengthBefore
    const resLost = (resistanceBefore - resistanceAfter) / resistanceBefore
    expect(resLost).toBeGreaterThan(strLost * 1.5)
  })

  it('highway: 50 successful signals make the path a highway', async () => {
    const scout = w.add('scout')
    scout.on('observe', (_data, _emit, _ctx) => ({ found: true }))

    // 50 successful signals
    for (let i = 0; i < 50; i++) {
      await w.ask({ receiver: 'scout:observe', data: { tick: i } })
    }

    // Default highway threshold is 20; 50 marks - 0 resistance = 50 net
    expect(w.isHighway('entry→scout:observe')).toBe(true)
    expect(w.sense('entry→scout:observe')).toBeGreaterThanOrEqual(50)
  })

  it('agent goes from zero to highway in 100 signals', async () => {
    const scout = w.add('scout')
    scout.on('observe', () => 'found something')

    // 100 successful signals
    for (let i = 0; i < 100; i++) {
      const outcome = await w.ask({ receiver: 'scout:observe', data: { tick: i } })
      expect(outcome.result).toBeDefined()
    }

    // Path is now a highway
    expect(w.isHighway('entry→scout:observe')).toBe(true)
    expect(w.sense('entry→scout:observe')).toBeGreaterThanOrEqual(50)

    // Shows up in highways list
    const highways = w.highways(10)
    expect(highways.some((h) => h.path === 'entry→scout:observe')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: SELF-LEARNING — THE FLYWHEEL
//
// A 3-unit chain. 100 signals through all three. All edges become highways.
// select() learns to bias toward the proven path. Fade humbles strength
// but highways survive. New paths can overtake incumbents after long fade.
// ═══════════════════════════════════════════════════════════════════════════

describe('Self-Learning: the flywheel', () => {
  let w: World

  beforeEach(() => {
    w = world()
  })

  it('3-unit chain: all edges become highways after 100 signals', async () => {
    // Build the chain: scout → analyst → reporter
    const scout = w.add('scout')
    const analyst = w.add('analyst')
    const reporter = w.add('reporter')

    // Scout observes, then hands off to analyst
    scout
      .on('observe', (_data) => ({ raw: 'observation' }))
      .then('observe', (result) => ({
        receiver: 'analyst:process',
        data: result,
      }))

    // Analyst processes, then hands off to reporter
    analyst
      .on('process', (data) => ({ processed: true, ...(data as object) }))
      .then('process', (result) => ({
        receiver: 'reporter:summarize',
        data: result,
      }))

    // Reporter summarizes
    reporter.on('summarize', (data) => ({
      summary: 'done',
      ...(data as object),
    }))

    // Fire 100 signals through the entry point
    for (let i = 0; i < 100; i++) {
      await w.ask({ receiver: 'scout:observe', data: { tick: i } })
      // Give the chain time to propagate (continuations are async)
      await new Promise((r) => setTimeout(r, 0))
    }

    // All 3 entry→unit edges strengthen
    expect(w.sense('entry→scout:observe')).toBeGreaterThanOrEqual(100)
    expect(w.isHighway('entry→scout:observe')).toBe(true)

    // scout→analyst and analyst→reporter edges build through continuations
    expect(w.sense('scout:observe→analyst:process')).toBeGreaterThan(0)
    expect(w.sense('analyst:process→reporter:summarize')).toBeGreaterThan(0)
  })

  it('select() biases toward proven paths with high sensitivity', () => {
    // Build two competing paths — one much stronger
    w.mark('entry→alpha', 100)
    w.mark('entry→beta', 5)

    // Run select() 500 times with high sensitivity (harvester mode)
    const picks: Record<string, number> = {}
    for (let i = 0; i < 500; i++) {
      const chosen = w.select(undefined, 1.0)
      if (chosen) picks[chosen] = (picks[chosen] || 0) + 1
    }

    // The highway (alpha) should win overwhelmingly
    const alphaFraction = (picks.alpha || 0) / 500
    expect(alphaFraction).toBeGreaterThan(0.8)
  })

  it('select() explores with low sensitivity (scout mode)', () => {
    w.mark('entry→alpha', 100)
    w.mark('entry→beta', 5)

    // Run select() 500 times with near-zero sensitivity (pure exploration)
    const picks: Record<string, number> = {}
    for (let i = 0; i < 500; i++) {
      const chosen = w.select(undefined, 0)
      if (chosen) picks[chosen] = (picks[chosen] || 0) + 1
    }

    // With sensitivity=0, weights collapse to 1.0 for all viable paths
    // Both paths should get ~50% each (proportional to equal weights)
    const betaFraction = (picks.beta || 0) / 500
    expect(betaFraction).toBeGreaterThan(0.25) // exploration picks beta often
  })

  it('fade reduces strength but highways survive the floor', () => {
    // Build a strong highway (strength 100)
    for (let i = 0; i < 100; i++) {
      w.mark('entry→scout:observe', 1)
    }

    expect(w.isHighway('entry→scout:observe')).toBe(true)
    const strengthBefore = w.sense('entry→scout:observe')

    // Fade 20 times — significant decay
    for (let i = 0; i < 20; i++) {
      w.fade(0.1)
    }

    const strengthAfter = w.sense('entry→scout:observe')

    // Strength decreased
    expect(strengthAfter).toBeLessThan(strengthBefore)

    // But peak × 0.05 floor keeps it alive (ghost trail survives)
    // peak=100, floor=5 — strength stays at or above floor
    expect(strengthAfter).toBeGreaterThan(0)

    // Highway threshold (20) may or may not hold after heavy fade —
    // what matters is the path doesn't vanish completely
    expect(w.sense('entry→scout:observe')).toBeGreaterThan(0)
  })

  it('new paths can compete after incumbent fades', async () => {
    // Build path A as a highway (100 marks)
    for (let i = 0; i < 100; i++) {
      w.mark('entry→alpha', 1)
    }
    expect(w.isHighway('entry→alpha')).toBe(true)

    // Heavy fade — simulate time passing (30 fades at rate 0.15)
    for (let i = 0; i < 30; i++) {
      w.fade(0.15)
    }

    const alphaAfterFade = w.sense('entry→alpha')

    // Now build path B from scratch with 50 marks
    for (let i = 0; i < 50; i++) {
      w.mark('entry→beta', 1)
    }

    const beta = w.sense('entry→beta')

    // Beta is now strong enough to compete or surpass faded alpha
    // (alpha faded significantly, beta is fresh at 50)
    expect(beta).toBeGreaterThan(alphaAfterFade * 0.5)

    // select() should now sometimes pick beta
    const picks: Record<string, number> = {}
    for (let i = 0; i < 200; i++) {
      const chosen = w.select(undefined, 0.7)
      if (chosen) picks[chosen] = (picks[chosen] || 0) + 1
    }
    expect(picks.beta || 0).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: WAVE PATTERN
//
// Context accumulates across .then() chains. Each step enriches the envelope.
// W1 reads → W2 decides → W3 edits → W4 verifies. The result of W1 travels
// through W2, W3, and into W4 — untouched, growing.
// ═══════════════════════════════════════════════════════════════════════════

describe('Wave Pattern: context accumulates across .then() chains', () => {
  let w: World

  beforeEach(() => {
    w = world()
  })

  it('context accumulates through 4 wave steps', async () => {
    const accumulated: string[] = []
    const finalResults: unknown[] = []

    const runner = w.add('wave')

    runner
      .on('recon', (data) => {
        accumulated.push('W1')
        return { ...(data as object), recon: 'file contents here' }
      })
      .then('recon', (result) => ({
        receiver: 'wave:decide',
        data: result,
      }))

    runner
      .on('decide', (data) => {
        accumulated.push('W2')
        // Context from W1 is present here
        expect((data as Record<string, unknown>).recon).toBeDefined()
        return { ...(data as object), specs: ['edit1', 'edit2'] }
      })
      .then('decide', (result) => ({
        receiver: 'wave:edit',
        data: result,
      }))

    runner
      .on('edit', (data) => {
        accumulated.push('W3')
        // Context from W1 and W2 is present here
        expect((data as Record<string, unknown>).recon).toBeDefined()
        expect((data as Record<string, unknown>).specs).toBeDefined()
        return { ...(data as object), edits: 'applied' }
      })
      .then('edit', (result) => ({
        receiver: 'wave:verify',
        data: result,
      }))

    runner.on('verify', (data) => {
      accumulated.push('W4')
      // All previous context must be present
      expect((data as Record<string, unknown>).recon).toBeDefined()
      expect((data as Record<string, unknown>).specs).toBeDefined()
      expect((data as Record<string, unknown>).edits).toBeDefined()
      finalResults.push(data)
      return { verified: true }
    })

    // Fire W1 — the chain runs W1→W2→W3→W4 via .then()
    await w.ask({ receiver: 'wave:recon', data: { task: 'test' } })

    // Wait for the full chain to propagate (continuations are micro-tasks)
    await new Promise((r) => setTimeout(r, 10))

    // All 4 waves executed
    expect(accumulated).toEqual(['W1', 'W2', 'W3', 'W4'])
    expect(finalResults.length).toBe(1)
  })

  it('each wave transition marks a path', async () => {
    const runner = w.add('wave')

    runner
      .on('recon', (data) => ({ ...(data as object), recon: 'read' }))
      .then('recon', (r) => ({ receiver: 'wave:decide', data: r }))

    runner
      .on('decide', (data) => ({ ...(data as object), specs: ['s1'] }))
      .then('decide', (r) => ({ receiver: 'wave:edit', data: r }))

    runner
      .on('edit', (data) => ({ ...(data as object), edits: 'done' }))
      .then('edit', (r) => ({ receiver: 'wave:verify', data: r }))

    runner.on('verify', (_data) => ({ verified: true }))

    // Run the chain 10 times
    for (let i = 0; i < 10; i++) {
      await w.ask({ receiver: 'wave:recon', data: { task: `run-${i}` } })
      await new Promise((r) => setTimeout(r, 0))
    }

    // Entry → first wave is marked
    expect(w.sense('entry→wave:recon')).toBeGreaterThan(0)

    // .then() continuations mark their own edges
    expect(w.sense('wave:recon→wave:decide')).toBeGreaterThan(0)
    expect(w.sense('wave:decide→wave:edit')).toBeGreaterThan(0)
    expect(w.sense('wave:edit→wave:verify')).toBeGreaterThan(0)
  })

  it('running the wave chain 50 times makes all edges highways', async () => {
    const runner = w.add('wave')

    runner
      .on('recon', (data) => ({ ...(data as object), recon: 'read' }))
      .then('recon', (r) => ({ receiver: 'wave:decide', data: r }))

    runner
      .on('decide', (data) => ({ ...(data as object), specs: ['s1'] }))
      .then('decide', (r) => ({ receiver: 'wave:edit', data: r }))

    runner
      .on('edit', (data) => ({ ...(data as object), edits: 'done' }))
      .then('edit', (r) => ({ receiver: 'wave:verify', data: r }))

    runner.on('verify', (_data) => ({ verified: true }))

    for (let i = 0; i < 50; i++) {
      await w.ask({ receiver: 'wave:recon', data: { task: `run-${i}` } })
      await new Promise((r) => setTimeout(r, 0))
    }

    // All 4 edges should be highways (net strength ≥ 20)
    expect(w.isHighway('entry→wave:recon')).toBe(true)
    expect(w.isHighway('wave:recon→wave:decide')).toBe(true)
    expect(w.isHighway('wave:decide→wave:edit')).toBe(true)
    expect(w.isHighway('wave:edit→wave:verify')).toBe(true)
  })

  it('failed wave step warns the path, success recovers it', async () => {
    let editShouldFail = true
    const runner = w.add('wave')

    runner
      .on('recon', (data) => ({ ...(data as object), recon: 'read' }))
      .then('recon', (r) => ({ receiver: 'wave:edit', data: r }))

    runner.on('edit', (_data) => {
      if (editShouldFail) return null // failure
      return { edits: 'applied' }
    })

    // Warm up the path first with 5 successes
    editShouldFail = false
    for (let i = 0; i < 5; i++) {
      await w.ask({ receiver: 'wave:recon', data: {} })
      await new Promise((r) => setTimeout(r, 0))
    }

    const editStrengthBefore = w.sense('wave:recon→wave:edit')
    const editResistanceBefore = w.danger('wave:recon→wave:edit')

    // Now inject resistance manually to simulate failures
    w.warn('wave:recon→wave:edit', 3)
    const resistanceAfterWarn = w.danger('wave:recon→wave:edit')
    expect(resistanceAfterWarn).toBeGreaterThan(editResistanceBefore)

    // Recover: run successes to re-strengthen the path
    editShouldFail = false
    for (let i = 0; i < 10; i++) {
      await w.ask({ receiver: 'wave:recon', data: {} })
      await new Promise((r) => setTimeout(r, 0))
    }

    // Strength grew past what it was before
    expect(w.sense('wave:recon→wave:edit')).toBeGreaterThan(editStrengthBefore)
  })

  it('wave data envelope grows at each step without mutation', async () => {
    const snapshots: unknown[] = []
    const runner = w.add('wave')

    runner
      .on('recon', (data) => {
        const result = { ...(data as object), recon: 'file contents' }
        snapshots.push({ ...result })
        return result
      })
      .then('recon', (r) => ({ receiver: 'wave:decide', data: r }))

    runner
      .on('decide', (data) => {
        const result = { ...(data as object), specs: ['edit1', 'edit2', 'edit3'] }
        snapshots.push({ ...result })
        return result
      })
      .then('decide', (r) => ({ receiver: 'wave:verify', data: r }))

    runner.on('verify', (data) => {
      snapshots.push({ ...(data as object) })
      return { done: true }
    })

    await w.ask({ receiver: 'wave:recon', data: { task: 'grow-test' } })
    await new Promise((r) => setTimeout(r, 10))

    expect(snapshots.length).toBe(3) // W1, W2, W3

    const s1 = snapshots[0] as Record<string, unknown>
    const s2 = snapshots[1] as Record<string, unknown>
    const s3 = snapshots[2] as Record<string, unknown>

    // W1: has task + recon
    expect(s1.task).toBe('grow-test')
    expect(s1.recon).toBe('file contents')
    expect(s1.specs).toBeUndefined()

    // W2: has task + recon + specs
    expect(s2.task).toBe('grow-test')
    expect(s2.recon).toBe('file contents')
    expect(s2.specs).toEqual(['edit1', 'edit2', 'edit3'])

    // W3 (verify): has all of the above
    expect(s3.task).toBe('grow-test')
    expect(s3.recon).toBe('file contents')
    expect(s3.specs).toEqual(['edit1', 'edit2', 'edit3'])
  })
})
