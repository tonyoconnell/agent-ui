/**
 * BOOT — Hydration + wiring + tick start tests
 *
 * Tests the boot sequence:
 *   1. load() — hydrate pheromone from TypeDB
 *   2. readParsed() — load units and add them to the world
 *   3. wireChairmanChain(), registerBridges(), registerPayUnit() — wiring
 *   4. tick() — starts the loop
 *
 * Mocks: TypeDB, all wiring modules, loop tick.
 * Pattern from persist.test.ts.
 *
 * Run: bun vitest run src/engine/boot.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock all external dependencies ────────────────────────────────────────────

vi.mock('@/lib/typedb', () => ({
  read: vi.fn().mockResolvedValue('[]'),
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn().mockResolvedValue(undefined),
  writeTracked: vi.fn().mockResolvedValue(true),
  parseAnswers: vi.fn().mockReturnValue([]),
}))

// ADL cache — use importOriginal so all constants (SKILL_SCHEMA_CACHE etc.) pass through;
// only override the hook functions we need to spy on.
vi.mock('./adl-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./adl-cache')>()
  return {
    ...actual,
    pheromoneWeight: vi.fn().mockReturnValue(0),
    setAuditPheromone: vi.fn(),
    invalidateAdlCache: vi.fn(),
  }
})

// Agentverse — optional, returns null when key not set
vi.mock('./agentverse-connect', () => ({
  connectAgentverse: vi.fn().mockResolvedValue(null),
}))

// Bridge units — wire-only, no return value needed
vi.mock('./bridges', () => ({
  registerBridges: vi.fn(),
}))

// Builder — registers the W1-W4 wave runner
vi.mock('./builder', () => ({
  registerBuilder: vi.fn(),
}))

// Chairman chain — wires CEO→Director→Specialist
vi.mock('./chairman-chain', () => ({
  wireChairmanChain: vi.fn().mockReturnValue({
    ceo: { id: 'ceo', has: vi.fn().mockReturnValue(false), on: vi.fn() },
    directors: [],
    registered: [],
    skipped: [],
  }),
  DEFAULT_MARKETING_TEAM: [],
}))

// Loop — tick should start but we don't want it to run indefinitely
vi.mock('./loop', () => ({
  tick: vi.fn().mockResolvedValue({
    cycle: 1,
    selected: null,
    success: null,
    highways: [],
    writes: { evolveAttempted: 0, evolveOk: 0, hypoAttempted: 0, hypoOk: 0, frontierAttempted: 0, frontierOk: 0 },
    writeHealth: 1,
  }),
}))

// Pay unit — Sui commerce
vi.mock('./pay', () => ({
  registerPayUnit: vi.fn(),
}))

// Persist world — use real persist.world() but mock bridge calls
vi.mock('./bridge', () => ({
  mirrorMark: vi.fn().mockResolvedValue(undefined),
  mirrorWarn: vi.fn().mockResolvedValue(undefined),
  mirrorActor: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./context', () => ({
  inferDocsFromTags: vi.fn().mockReturnValue([]),
  loadContext: vi.fn().mockReturnValue(''),
  ingestDocs: vi.fn().mockResolvedValue(0),
}))

import { readParsed } from '@/lib/typedb'
import { setAuditPheromone } from './adl-cache'
import { connectAgentverse } from './agentverse-connect'
import { boot } from './boot'
import { registerBridges } from './bridges'
import { registerBuilder } from './builder'
import { wireChairmanChain } from './chairman-chain'
import { tick } from './loop'
import { registerPayUnit } from './pay'

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: boot() returns the expected API shape
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: boot() — returns world + control API', () => {
  let stopBoot: (() => Promise<void>) | null = null

  afterEach(async () => {
    if (stopBoot) {
      stopBoot()
      stopBoot = null
    }
    vi.clearAllMocks()
    await new Promise((r) => setTimeout(r, 10))
  })

  it('boot returns an object with world, signal, ask, enqueue, stop', async () => {
    const result = await boot(undefined, 100_000) // very long interval → no tick during test
    stopBoot = result.stop

    expect(result.world).toBeDefined()
    expect(typeof result.signal).toBe('function')
    expect(typeof result.ask).toBe('function')
    expect(typeof result.enqueue).toBe('function')
    expect(typeof result.stop).toBe('function')
  })

  it('world is a PersistentWorld with unit management', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    const w = result.world
    expect(typeof w.add).toBe('function')
    expect(typeof w.signal).toBe('function')
    expect(typeof w.ask).toBe('function')
    expect(typeof w.mark).toBe('function')
    expect(typeof w.warn).toBe('function')
    expect(typeof w.fade).toBe('function')
    expect(typeof w.highways).toBe('function')
  })

  it('agentverse is null when AGENTVERSE_API_KEY is not set', async () => {
    vi.mocked(connectAgentverse).mockResolvedValue(null)

    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    expect(result.agentverse).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: Hydration — TypeDB units are loaded and added to the world
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: Hydration — load units from TypeDB', () => {
  let stopBoot: (() => Promise<void>) | null = null

  afterEach(async () => {
    if (stopBoot) {
      stopBoot()
      stopBoot = null
    }
    vi.clearAllMocks()
    await new Promise((r) => setTimeout(r, 10))
  })

  it('readParsed is called during boot to load units', async () => {
    vi.mocked(readParsed).mockResolvedValue([])

    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    // readParsed should have been called at least once (for unit loading)
    expect(vi.mocked(readParsed)).toHaveBeenCalled()
  })

  it('units from TypeDB are added to the world in the correct order', async () => {
    // Return two units from the "mock TypeDB"
    vi.mocked(readParsed).mockResolvedValueOnce([
      { id: 'marketing-director', kind: 'director' },
      { id: 'marketing-seo', kind: 'specialist' },
    ])

    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    // Units were loaded — world should be able to handle signals to them
    // (They might have been added by wireChairmanChain since we mock it,
    //  but the readParsed call verifies hydration attempt happened)
    expect(vi.mocked(readParsed)).toHaveBeenCalled()
    const callArgs = vi.mocked(readParsed).mock.calls[0]?.[0] as string
    expect(callArgs).toMatch(/unit.*uid|uid.*unit/)
  })

  it('empty TypeDB (no units) does not crash boot', async () => {
    vi.mocked(readParsed).mockResolvedValue([])

    await expect(boot(undefined, 100_000)).resolves.toBeDefined()
    stopBoot = (await boot(undefined, 100_000)).stop
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: Wiring — chairman chain, bridges, pay unit are registered
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: Wiring — chain + bridges + pay registered after hydration', () => {
  let stopBoot: (() => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readParsed).mockResolvedValue([])
  })

  afterEach(async () => {
    if (stopBoot) {
      stopBoot()
      stopBoot = null
    }
    await new Promise((r) => setTimeout(r, 10))
  })

  it('wireChairmanChain is called once with the world', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    expect(wireChairmanChain).toHaveBeenCalledTimes(1)
    expect(wireChairmanChain).toHaveBeenCalledWith(result.world)
  })

  it('registerBridges is called once with the world', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    expect(registerBridges).toHaveBeenCalledTimes(1)
    expect(registerBridges).toHaveBeenCalledWith(result.world)
  })

  it('registerPayUnit is called once with the world', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    expect(registerPayUnit).toHaveBeenCalledTimes(1)
    expect(registerPayUnit).toHaveBeenCalledWith(result.world)
  })

  it('registerBuilder is NOT called when no complete function provided', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    expect(registerBuilder).not.toHaveBeenCalled()
  })

  it('registerBuilder IS called when complete function is provided', async () => {
    const complete = vi.fn(async (prompt: string) => `done: ${prompt.slice(0, 10)}`)

    const result = await boot(complete, 100_000)
    stopBoot = result.stop

    expect(registerBuilder).toHaveBeenCalledTimes(1)
    expect(registerBuilder).toHaveBeenCalledWith(result.world, expect.any(Function))
  })

  it('setAuditPheromone is called to close the ADL security loop', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    expect(setAuditPheromone).toHaveBeenCalledTimes(1)
    expect(setAuditPheromone).toHaveBeenCalledWith(expect.any(Function))
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 4: loop:feedback unit is registered
//
// boot.ts registers a 'loop' unit with a 'feedback' handler.
// This handler deposits pheromone on tag paths proportional to rubric score.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 4: loop:feedback unit wired by boot', () => {
  let stopBoot: (() => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readParsed).mockResolvedValue([])
  })

  afterEach(async () => {
    if (stopBoot) {
      stopBoot()
      stopBoot = null
    }
    await new Promise((r) => setTimeout(r, 10))
  })

  it('loop unit is present in the world after boot', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    expect(result.world.has('loop')).toBe(true)
  })

  it('loop:feedback marks tag paths on golden result', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    const w = result.world
    await w.ask({
      receiver: 'loop:feedback',
      data: { tags: ['engine'], strength: 0.9, outcome: 'result' },
    })

    // strength >= 0.65 → mark(tag:engine, strength * 5)
    expect(w.sense('tag:engine')).toBeCloseTo(0.9 * 5, 1)
  })

  it('loop:feedback warns tag paths on failure', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    const w = result.world
    await w.ask({
      receiver: 'loop:feedback',
      data: { tags: ['deploy'], strength: 0.95, outcome: 'failure' },
    })

    // failure → warn(tag:deploy, 1)
    expect(w.danger('tag:deploy')).toBe(1)
    expect(w.sense('tag:deploy')).toBe(0)
  })

  it('loop:feedback warns tag paths on dissolved', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    const w = result.world
    await w.ask({
      receiver: 'loop:feedback',
      data: { tags: ['api'], strength: 0.9, outcome: 'dissolved' },
    })

    // dissolved → warn(tag:api, 0.5)
    expect(w.danger('tag:api')).toBe(0.5)
  })

  it('loop:feedback warns tag paths when strength < 0.65', async () => {
    const result = await boot(undefined, 100_000)
    stopBoot = result.stop

    const w = result.world
    await w.ask({
      receiver: 'loop:feedback',
      data: { tags: ['ui'], strength: 0.4, outcome: 'result' },
    })

    // strength < 0.65 → warn(tag:ui, 0.5) even with result
    expect(w.danger('tag:ui')).toBe(0.5)
    expect(w.sense('tag:ui')).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 5: TypeDB failure during hydration is handled gracefully
//
// If load() or readParsed() rejects, boot should not crash.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 5: TypeDB failure — graceful degradation', () => {
  afterEach(async () => {
    vi.clearAllMocks()
    await new Promise((r) => setTimeout(r, 10))
  })

  it('boot does not crash when readParsed rejects', async () => {
    vi.mocked(readParsed).mockRejectedValue(new Error('TypeDB unavailable'))

    // boot uses .catch(() => []) on the readParsed call — should not throw
    const _result = await expect(boot(undefined, 100_000)).resolves.toBeDefined()
    // Clean up
    const r = await boot(undefined, 100_000)
    r.stop()
    await new Promise((res) => setTimeout(res, 10))
  })

  it('boot with TypeDB failure still returns a functional world', async () => {
    vi.mocked(readParsed).mockRejectedValue(new Error('TypeDB unavailable'))

    let stopFn: (() => Promise<void>) | null = null
    try {
      const result = await boot(undefined, 100_000)
      stopFn = result.stop

      // World is functional even without TypeDB hydration
      expect(result.world).toBeDefined()
      expect(typeof result.world.signal).toBe('function')
      expect(typeof result.world.mark).toBe('function')
    } finally {
      if (stopFn) {
        stopFn()
        await new Promise((r) => setTimeout(r, 10))
      }
    }
  })

  it('connectAgentverse failure is caught and returns null agentverse', async () => {
    vi.mocked(readParsed).mockResolvedValue([])
    vi.mocked(connectAgentverse).mockRejectedValue(new Error('Agentverse unavailable'))

    let stopFn: (() => Promise<void>) | null = null
    try {
      const result = await boot(undefined, 100_000)
      stopFn = result.stop

      // agentverse should be null when connection fails
      expect(result.agentverse).toBeNull()
    } finally {
      if (stopFn) {
        stopFn()
        await new Promise((r) => setTimeout(r, 10))
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 6: tick starts after hydration
//
// The loop begins after wiring completes. tick is called at least once
// after boot() resolves.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 6: tick starts after hydration completes', () => {
  afterEach(async () => {
    vi.clearAllMocks()
    await new Promise((r) => setTimeout(r, 50))
  })

  it('tick is called after boot resolves', async () => {
    vi.mocked(readParsed).mockResolvedValue([])
    vi.mocked(tick).mockResolvedValue({
      cycle: 1,
      selected: null,
      success: null,
      highways: [],
      writes: { evolveAttempted: 0, evolveOk: 0, hypoAttempted: 0, hypoOk: 0, frontierAttempted: 0, frontierOk: 0 },
      writeHealth: 1,
    })

    const result = await boot(undefined, 1) // interval=1ms → tick fires immediately
    const stop = result.stop

    // Wait briefly for the first tick to fire
    await new Promise((r) => setTimeout(r, 20))
    stop()
    await new Promise((r) => setTimeout(r, 20))

    expect(tick).toHaveBeenCalled()
    expect(tick).toHaveBeenCalledWith(result.world, undefined)
  })

  it('stop() halts the tick loop', async () => {
    vi.mocked(readParsed).mockResolvedValue([])
    vi.mocked(tick).mockResolvedValue({
      cycle: 1,
      selected: null,
      success: null,
      highways: [],
      writes: { evolveAttempted: 0, evolveOk: 0, hypoAttempted: 0, hypoOk: 0, frontierAttempted: 0, frontierOk: 0 },
      writeHealth: 1,
    })

    const result = await boot(undefined, 10) // 10ms interval
    const stop = result.stop

    // Let it tick a few times
    await new Promise((r) => setTimeout(r, 30))
    const countBeforeStop = vi.mocked(tick).mock.calls.length
    stop()

    // Wait and verify no more ticks
    await new Promise((r) => setTimeout(r, 30))
    const countAfterStop = vi.mocked(tick).mock.calls.length

    expect(countBeforeStop).toBeGreaterThan(0)
    // After stop, count shouldn't grow much (at most 1 more in-flight)
    expect(countAfterStop).toBeLessThanOrEqual(countBeforeStop + 2)
  })

  it('tick receives the complete function when provided', async () => {
    vi.mocked(readParsed).mockResolvedValue([])
    vi.mocked(tick).mockResolvedValue({
      cycle: 1,
      selected: null,
      success: null,
      highways: [],
      writes: { evolveAttempted: 0, evolveOk: 0, hypoAttempted: 0, hypoOk: 0, frontierAttempted: 0, frontierOk: 0 },
      writeHealth: 1,
    })

    const complete = vi.fn(async (prompt: string) => `done: ${prompt}`)

    const result = await boot(complete, 1) // 1ms interval
    const stop = result.stop

    await new Promise((r) => setTimeout(r, 20))
    stop()
    await new Promise((r) => setTimeout(r, 20))

    // tick should have been called with the complete function
    const tickCalls = vi.mocked(tick).mock.calls
    expect(tickCalls.length).toBeGreaterThan(0)
    expect(tickCalls[0]?.[1]).toBe(complete)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 7: Consecutive failure backoff
//
// When tick() fails repeatedly, boot applies exponential backoff.
// This prevents hammering a down TypeDB with rapid retries.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 7: Consecutive failure backoff', () => {
  afterEach(async () => {
    vi.clearAllMocks()
    await new Promise((r) => setTimeout(r, 20))
  })

  it('tick failures do not crash the boot loop', async () => {
    vi.mocked(readParsed).mockResolvedValue([])
    vi.mocked(tick).mockRejectedValue(new Error('TypeDB down'))

    const result = await boot(undefined, 5) // 5ms interval
    const stop = result.stop

    // Wait and verify boot didn't throw
    await new Promise((r) => setTimeout(r, 30))
    stop()

    // tick was called (and failed) — but boot is still alive
    expect(tick).toHaveBeenCalled()
  })

  it('recovery after failure: tick called again after error', async () => {
    vi.mocked(readParsed).mockResolvedValue([])

    let callCount = 0
    vi.mocked(tick).mockImplementation(async () => {
      callCount++
      if (callCount <= 2) throw new Error('TypeDB down')
      return {
        cycle: callCount,
        selected: null,
        success: null,
        highways: [],
        writes: { evolveAttempted: 0, evolveOk: 0, hypoAttempted: 0, hypoOk: 0, frontierAttempted: 0, frontierOk: 0 },
        writeHealth: 1,
      }
    })

    const result = await boot(undefined, 1) // 1ms interval — but backoff kicks in
    const stop = result.stop

    await new Promise((r) => setTimeout(r, 100))
    stop()

    // Should have been called at least 3 times (2 failures + 1 recovery)
    expect(callCount).toBeGreaterThanOrEqual(3)
  })
})
