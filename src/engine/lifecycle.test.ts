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
 * Note on ask(): ask() resolves when a actor explicitly emits a reply to
 * the replyTo address. Simple fire-and-forget handlers don't auto-reply.
 * Tests verify signal delivery via w.sense(), not ask() result values.
 *
 * Run: bun vitest run src/engine/lifecycle.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { type World, world } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: AGENT LIFECYCLE
//
// A single agent. Born with no history. Receives work. Paths strengthen.
// Failures warn. Fade decays asymmetrically. Enough signals → highway.
// ═══════════════════════════════════════════════════════════════════════════

describe('Agent Lifecycle: register → signal → highway', () => {
  let w: World

  beforeEach(() => {
    w = world()
  })

  it('register: add() makes the actor reachable', () => {
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

  it('signal to missing actor dissolves — no path, no cost', async () => {
    // ask() immediately returns dissolved when actor does not exist
    const outcome = await w.ask({ receiver: 'ghost:observe', data: {} })
    expect(outcome.dissolved).toBe(true)
    expect(w.sense('entry→ghost:observe')).toBe(0)
  })

  it('signal delivery: path is marked when a actor receives a signal', () => {
    // Handler called flag
    let called = false
    w.add('scout').on('observe', () => {
      called = true
      return 'found something'
    })

    // Before — no trail
    expect(w.sense('entry→scout:observe')).toBe(0)

    // Signal fires
    w.signal({ receiver: 'scout:observe', data: { tick: 1 } })

    // Handler ran
    expect(called).toBe(true)
    // Trail deposited — path learned
    expect(w.sense('entry→scout:observe')).toBeGreaterThan(0)
  })

  it('repeat signals accumulate pheromone on the path', () => {
    w.add('scout').on('observe', () => 'ok')

    for (let i = 0; i < 20; i++) {
      w.signal({ receiver: 'scout:observe', data: { tick: i } })
    }

    expect(w.sense('entry→scout:observe')).toBe(20)
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

  it('highway: 50 signals make the path a highway', () => {
    w.add('scout').on('observe', () => ({ found: true }))

    // 50 signals — each marks the path by 1
    for (let i = 0; i < 50; i++) {
      w.signal({ receiver: 'scout:observe', data: { tick: i } })
    }

    // Default highway threshold is 20; strength=50, resistance=0 → net=50
    expect(w.isHighway('entry→scout:observe')).toBe(true)
    expect(w.sense('entry→scout:observe')).toBeGreaterThanOrEqual(50)
  })

  it('agent goes from zero to highway in 100 signals', () => {
    w.add('scout').on('observe', () => 'found something')

    // 100 signals
    for (let i = 0; i < 100; i++) {
      w.signal({ receiver: 'scout:observe', data: { tick: i } })
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
// A 3-actor chain. 100 signals through all three. All edges become highways.
// select() learns to bias toward the proven path. Fade humbles strength
// but highways survive. New paths can overtake incumbents after long fade.
// ═══════════════════════════════════════════════════════════════════════════

describe('Self-Learning: the flywheel', () => {
  let w: World

  beforeEach(() => {
    w = world()
  })

  it('3-actor chain: all edges become highways after 100 signals', async () => {
    // Build the chain: scout → analyst → reporter
    const scout = w.add('scout')
    const analyst = w.add('analyst')
    const reporter = w.add('reporter')

    // Scout observes, then hands off to analyst via .then()
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
    reporter.on('summarize', (data) => ({ summary: 'done', ...(data as object) }))

    // Fire 100 signals through the entry point
    for (let i = 0; i < 100; i++) {
      w.signal({ receiver: 'scout:observe', data: { tick: i } })
    }

    // Wait for async continuations to propagate (microtasks)
    await new Promise((r) => setTimeout(r, 10))

    // Entry → scout: direct signals mark immediately
    expect(w.sense('entry→scout:observe')).toBe(100)
    expect(w.isHighway('entry→scout:observe')).toBe(true)

    // scout → analyst and analyst → reporter: marked via .then() continuations
    expect(w.sense('scout:observe→analyst:process')).toBeGreaterThan(0)
    expect(w.sense('analyst:process→reporter:summarize')).toBeGreaterThan(0)
    expect(w.isHighway('scout:observe→analyst:process')).toBe(true)
    expect(w.isHighway('analyst:process→reporter:summarize')).toBe(true)
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
    // Both should get some picks — exploration gives the underdog a shot
    const betaFraction = (picks.beta || 0) / 500
    expect(betaFraction).toBeGreaterThan(0.25)
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
  })

  it('new paths can compete after incumbent fades', () => {
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

    // Beta is now strong enough to compete with faded alpha
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
    let finalData: Record<string, unknown> | null = null

    const runner = w.add('wave')

    runner
      .on('recon', (data) => {
        accumulated.push('W1')
        return { ...(data as object), recon: 'file contents here' }
      })
      .then('recon', (result) => ({ receiver: 'wave:decide', data: result }))

    runner
      .on('decide', (data) => {
        accumulated.push('W2')
        return { ...(data as object), specs: ['edit1', 'edit2'] }
      })
      .then('decide', (result) => ({ receiver: 'wave:edit', data: result }))

    runner
      .on('edit', (data) => {
        accumulated.push('W3')
        return { ...(data as object), edits: 'applied' }
      })
      .then('edit', (result) => ({ receiver: 'wave:verify', data: result }))

    runner.on('verify', (data) => {
      accumulated.push('W4')
      finalData = data as Record<string, unknown>
      return { verified: true }
    })

    // Fire W1 — the chain runs W1→W2→W3→W4 via .then()
    w.signal({ receiver: 'wave:recon', data: { task: 'test' } })

    // Wait for the async chain to propagate
    await new Promise((r) => setTimeout(r, 20))

    // All 4 waves executed in order
    expect(accumulated).toEqual(['W1', 'W2', 'W3', 'W4'])

    // Final data has context from all previous waves
    expect(finalData).not.toBeNull()
    expect(finalData!.task).toBe('test')
    expect(finalData!.recon).toBe('file contents here')
    expect(finalData!.specs).toEqual(['edit1', 'edit2'])
    expect(finalData!.edits).toBe('applied')
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
      w.signal({ receiver: 'wave:recon', data: { task: `run-${i}` } })
    }

    // Wait for async continuations
    await new Promise((r) => setTimeout(r, 20))

    // Entry → first wave is marked (1 per signal)
    expect(w.sense('entry→wave:recon')).toBe(10)

    // .then() continuations mark their own edges
    expect(w.sense('wave:recon→wave:decide')).toBe(10)
    expect(w.sense('wave:decide→wave:edit')).toBe(10)
    expect(w.sense('wave:edit→wave:verify')).toBe(10)
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
      w.signal({ receiver: 'wave:recon', data: { task: `run-${i}` } })
    }

    await new Promise((r) => setTimeout(r, 20))

    // All 4 edges should be highways (net strength ≥ 20)
    expect(w.isHighway('entry→wave:recon')).toBe(true)
    expect(w.isHighway('wave:recon→wave:decide')).toBe(true)
    expect(w.isHighway('wave:decide→wave:edit')).toBe(true)
    expect(w.isHighway('wave:edit→wave:verify')).toBe(true)
  })

  it('warn on a wave edge increases resistance on that path', async () => {
    const runner = w.add('wave')

    runner
      .on('recon', (data) => ({ ...(data as object), recon: 'read' }))
      .then('recon', (r) => ({ receiver: 'wave:edit', data: r }))

    runner.on('edit', (_data) => ({ edits: 'applied' }))

    // Warm up with 10 signals
    for (let i = 0; i < 10; i++) {
      w.signal({ receiver: 'wave:recon', data: {} })
    }
    await new Promise((r) => setTimeout(r, 10))

    const strengthBefore = w.sense('wave:recon→wave:edit')
    const resistanceBefore = w.danger('wave:recon→wave:edit')

    // Manually warn the edge (simulating detected failures)
    w.warn('wave:recon→wave:edit', 3)

    expect(w.danger('wave:recon→wave:edit')).toBeGreaterThan(resistanceBefore)
    expect(w.danger('wave:recon→wave:edit')).toBe(resistanceBefore + 3)

    // Run 10 more successful signals — strength recovers
    for (let i = 0; i < 10; i++) {
      w.signal({ receiver: 'wave:recon', data: {} })
    }
    await new Promise((r) => setTimeout(r, 10))

    // Strength grew
    expect(w.sense('wave:recon→wave:edit')).toBeGreaterThan(strengthBefore)
  })

  it('wave data envelope grows at each step without mutation', async () => {
    // Spy on each step to capture what data arrives
    const snapshots: unknown[] = []

    const runner = w.add('wave')

    runner
      .on('recon', (data) => {
        const result = { ...(data as object), recon: 'file contents' }
        snapshots.push({ ...result }) // snapshot W1 output
        return result
      })
      .then('recon', (r) => ({ receiver: 'wave:decide', data: r }))

    runner
      .on('decide', (data) => {
        const result = { ...(data as object), specs: ['edit1', 'edit2', 'edit3'] }
        snapshots.push({ ...result }) // snapshot W2 output
        return result
      })
      .then('decide', (r) => ({ receiver: 'wave:verify', data: r }))

    runner.on('verify', (data) => {
      snapshots.push({ ...(data as object) }) // snapshot W3 (final) input
      return { done: true }
    })

    w.signal({ receiver: 'wave:recon', data: { task: 'grow-test' } })
    await new Promise((r) => setTimeout(r, 20))

    expect(snapshots.length).toBe(3) // W1, W2, W3

    const s1 = snapshots[0] as Record<string, unknown>
    const s2 = snapshots[1] as Record<string, unknown>
    const s3 = snapshots[2] as Record<string, unknown>

    // W1: has task + recon, no specs yet
    expect(s1.task).toBe('grow-test')
    expect(s1.recon).toBe('file contents')
    expect(s1.specs).toBeUndefined()

    // W2: has task + recon + specs
    expect(s2.task).toBe('grow-test')
    expect(s2.recon).toBe('file contents')
    expect(s2.specs).toEqual(['edit1', 'edit2', 'edit3'])

    // W3 (verify): has all of the above — full envelope
    expect(s3.task).toBe('grow-test')
    expect(s3.recon).toBe('file contents')
    expect(s3.specs).toEqual(['edit1', 'edit2', 'edit3'])
  })
})
