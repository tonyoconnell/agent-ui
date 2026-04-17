/**
 * GET /api/tick — Loop state and growth cycle tests
 *
 * Tests the tick endpoint: interval gating, peek mode, reload, loop timings,
 * and task orchestration.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn().mockResolvedValue([]),
  write: vi.fn().mockResolvedValue(undefined),
  writeSilent: vi.fn(),
}))

vi.mock('@/engine/llm', () => ({
  openrouter: vi.fn(() => vi.fn().mockResolvedValue('mock-llm-response')),
}))

vi.mock('@/engine/loop', () => ({
  tick: vi.fn().mockResolvedValue({
    cycle: 1,
    selected: 'test-agent',
    success: true,
    highways: [{ path: 'a→b', strength: 55 }],
  }),
}))

vi.mock('@/engine/task-sync', () => ({
  selfCheckoff: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/net', () => ({
  getNet: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue('test-agent'),
    ask: vi.fn().mockResolvedValue({ result: 'ok' }),
    warn: vi.fn(),
    mark: vi.fn(),
    load: vi.fn().mockResolvedValue(undefined),
  }),
  reloadMeta: vi.fn().mockResolvedValue(undefined),
}))

// Stub import.meta.env
vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
vi.stubEnv('TICK_ORCHESTRATE', '0')
vi.stubEnv('PUBLIC_GATEWAY_URL', 'http://localhost:4321')

describe('GET /api/tick', () => {
  let GET: any

  beforeEach(async () => {
    vi.resetModules()
    // Re-import to reset module-level state (lastTick, etc.)
    const mod = await import('./tick')
    GET = mod.GET
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeCtx(searchParams: Record<string, string> = {}) {
    const url = new URL('http://localhost:4321/api/tick')
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v)
    }
    return { url }
  }

  // ── Peek mode ──────────────────────────────────────────────────────────

  it('returns loop timings without running tick when peek=1', async () => {
    const res = await GET(makeCtx({ peek: '1' }))
    const body = await res.json()

    expect(body.ticked).toBe(false)
    expect(body.peek).toBe(true)
    expect(body.loopTimings).toBeDefined()
    expect(body.loopTimings.l1).toHaveProperty('interval')
    expect(body.loopTimings.l1).toHaveProperty('lastAtMs')
    expect(body.loopTimings.l1).toHaveProperty('nextAtMs')
    expect(body.loopTimings.l7).toHaveProperty('interval')
    expect(body.timestamp).toBeDefined()

    // tick() should NOT have been called
    const { tick } = await import('@/engine/loop')
    expect(tick).not.toHaveBeenCalled()
  })

  it('peek response has Cache-Control header', async () => {
    const res = await GET(makeCtx({ peek: '1' }))
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=1')
  })

  // ── Normal tick ────────────────────────────────────────────────────────

  it('runs tick and returns result on first call', async () => {
    const res = await GET(makeCtx({ interval: '0' }))
    const body = await res.json()

    expect(body.ticked).toBe(true)
    expect(body.result).toBeDefined()
    expect(body.result.cycle).toBe(1)
    expect(body.result.selected).toBe('test-agent')
    expect(body.result.success).toBe(true)
    expect(body.lastRun).toBeDefined()
    expect(body.nextRun).toBeDefined()
    expect(body.loopTimings).toBeDefined()
  })

  it('returns all 7 loop timings', async () => {
    const res = await GET(makeCtx({ interval: '0' }))
    const body = await res.json()

    const loops = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7']
    for (const l of loops) {
      expect(body.loopTimings[l]).toBeDefined()
      expect(body.loopTimings[l].interval).toBeGreaterThan(0)
      expect(typeof body.loopTimings[l].lastAtMs).toBe('number')
      expect(typeof body.loopTimings[l].nextAtMs).toBe('number')
    }
  })

  // ── Interval gating ────────────────────────────────────────────────────

  it('skips tick when within interval window', async () => {
    // First call runs the tick
    const res1 = await GET(makeCtx({ interval: '9999' }))
    const body1 = await res1.json()
    expect(body1.ticked).toBe(true)

    // Second call within interval should be gated
    const res2 = await GET(makeCtx({ interval: '9999' }))
    const body2 = await res2.json()
    expect(body2.ticked).toBe(false)
    expect(body2.lastRun).toBeDefined()
    expect(body2.nextRun).toBeDefined()
  })

  // ── Reload ─────────────────────────────────────────────────────────────

  it('calls reloadMeta when reload=1', async () => {
    const { reloadMeta } = await import('@/lib/net')
    await GET(makeCtx({ interval: '0', reload: '1' }))
    expect(reloadMeta).toHaveBeenCalled()
  })

  it('does not call reloadMeta without reload param', async () => {
    const { reloadMeta } = await import('@/lib/net')
    await GET(makeCtx({ interval: '0' }))
    expect(reloadMeta).not.toHaveBeenCalled()
  })

  // ── Response shape ─────────────────────────────────────────────────────

  it('returns application/json content type', async () => {
    const res = await GET(makeCtx({ interval: '0' }))
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  it('loop timing intervals match expected values', async () => {
    const res = await GET(makeCtx({ peek: '1' }))
    const body = await res.json()

    expect(body.loopTimings.l1.interval).toBe(100) // L1: per message
    expect(body.loopTimings.l2.interval).toBe(1000) // L2: per outcome
    expect(body.loopTimings.l3.interval).toBe(300_000) // L3: 5 min
    expect(body.loopTimings.l4.interval).toBe(60_000) // L4: 1 min
    expect(body.loopTimings.l5.interval).toBe(600_000) // L5: 10 min
    expect(body.loopTimings.l6.interval).toBe(3_600_000) // L6: 1 hour
    expect(body.loopTimings.l7.interval).toBe(3_600_000) // L7: 1 hour
  })
})
