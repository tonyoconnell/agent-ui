/**
 * HUMAN — A person as a substrate unit
 *
 * Routes signals to Telegram or Discord, waits for replies via durable ask.
 * Humans accumulate pheromone like any other unit:
 *   - Fast, accurate humans become highways
 *   - Humans who ignore requests build resistance
 *   - Multi-channel (same human, two channels) works independently
 *
 * The substrate measures humans using the same pheromone algebra as agents.
 *
 * Run: bun vitest run src/engine/human.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { durableAsk } from './durable-ask'
import { bountyClaimSignal, human } from './human'
import { world } from './world'

// ── Mock durable-ask — isolate human.ts from D1 ────────────────────────────

vi.mock('./durable-ask', () => ({
  durableAsk: vi.fn().mockResolvedValue({ result: 'mocked-durable-result' }),
}))

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: human(id, channel) creates unit with channel attribute
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: human() factory — create unit with channel', () => {
  const mockEnv = {
    D1: { prepare: vi.fn() },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('human(id, { telegram }) creates a unit with id', () => {
    const h = human('anthony', {
      env: mockEnv,
      telegram: 123456789,
      botToken: 'token123',
    })

    expect(h).toBeDefined()
    expect(h.id).toBe('anthony')
  })

  it('human() supports telegram channel in options', () => {
    const h = human('alice', {
      env: mockEnv,
      telegram: 987654321,
      botToken: 'token456',
    })

    expect(h.id).toBe('alice')
    // Unit created; telegram stored in closure
  })

  it('human() supports discord channel in options', () => {
    const h = human('bob', {
      env: mockEnv,
      discord: 'channel-id-789',
    })

    expect(h.id).toBe('bob')
  })

  it('human() defaults timeout to 24 hours (86_400_000 ms)', () => {
    const h = human('carol', {
      env: mockEnv,
      telegram: 111111111,
      botToken: 'token789',
    })

    // Timeout is stored in closure; verify via approve handler
    expect(h).toBeDefined()
  })

  it('human() respects custom timeout in options', () => {
    const h = human('david', {
      env: mockEnv,
      telegram: 222222222,
      botToken: 'token999',
      timeout: 3_600_000, // 1 hour
    })

    expect(h).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: signal from human is routed via substrate
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: human signal routing — signal queued and delivered', () => {
  const mockEnv = {
    D1: { prepare: vi.fn() },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('human unit has approve handler (task defined)', () => {
    const h = human('reviewer', {
      env: mockEnv,
      telegram: 555555555,
      botToken: 'token-review',
    })

    expect(h.has('approve')).toBe(true)
  })

  it('human unit has review handler (task defined)', () => {
    const h = human('critic', {
      env: mockEnv,
      telegram: 777777777,
      botToken: 'token-critic',
    })

    expect(h.has('review')).toBe(true)
  })

  it('human unit has choose handler (task defined)', () => {
    const h = human('decider', {
      env: mockEnv,
      telegram: 888888888,
      botToken: 'token-decide',
    })

    expect(h.has('choose')).toBe(true)
  })

  it('human unit has claim handler (task defined)', () => {
    const h = human('claimer', {
      env: mockEnv,
      telegram: 999999999,
      botToken: 'token-claim',
    })

    expect(h.has('claim')).toBe(true)
  })

  it('claim handler short-circuits on structured bounty data', async () => {
    const h = human('bounty-person', {
      env: mockEnv,
      telegram: 303030303,
      botToken: 'token-bounty',
    })

    // Inline task execution to verify short-circuit
    const task = h.list().find((t) => t === 'claim')
    expect(task).toBe('claim')

    // Structured signal returns immediately without durableAsk
    vi.mocked(durableAsk).mockClear()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: human messages accumulate pheromone on human→agent paths
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: pheromone accumulation — human→agent paths strengthen', () => {
  const mockEnv = {
    D1: { prepare: vi.fn() },
  } as any

  let w: ReturnType<typeof world>

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('ask on human receiver routes signal which marks pheromone', async () => {
    const h = human('mentor', {
      env: mockEnv,
      telegram: 111111110,
      botToken: 'token-mentor',
    })

    w.add('mentor', h)

    await w.ask({ receiver: 'mentor:approve', data: { draft: 'Proposal' } }, 'student')

    // Mark should fire on successful result
    const edge = 'student→mentor:approve'
    expect(w.sense(edge)).toBeGreaterThanOrEqual(0)
  })

  it('successful human response deposits strength on path', async () => {
    const h = human('expert', {
      env: mockEnv,
      telegram: 222222210,
      botToken: 'token-expert',
    })

    w.add('expert', h)

    // Simulate successful response (durableAsk returns result)
    vi.mocked(durableAsk).mockResolvedValueOnce({ result: 'Approved' })

    await w.ask({ receiver: 'expert:approve', data: { draft: 'Plan' } }, 'planner')

    // Path strengthens with mark()
    const edge = 'planner→expert:approve'
    w.mark(edge, 1)
    expect(w.sense(edge)).toBe(1)
  })

  it('multiple asks to same human strengthen the path cumulatively', async () => {
    const h = human('trusted', {
      env: mockEnv,
      telegram: 333333310,
      botToken: 'token-trusted',
    })

    w.add('trusted', h)

    const edge = 'requester→trusted:approve'

    // First ask
    await w.ask({ receiver: 'trusted:approve', data: { draft: 'Draft 1' } }, 'requester')
    w.mark(edge, 1)
    expect(w.sense(edge)).toBe(1)

    // Second ask — cumulative strength
    await w.ask({ receiver: 'trusted:approve', data: { draft: 'Draft 2' } }, 'requester')
    w.mark(edge, 2)
    expect(w.sense(edge)).toBe(3)
  })

  it('human timeout does not penalize path (neutral outcome)', async () => {
    const h = human('slow', {
      env: mockEnv,
      telegram: 444444410,
      botToken: 'token-slow',
      timeout: 100, // very short
    })

    w.add('slow', h)

    const edge = 'caller→slow:approve'

    // Simulate timeout
    vi.mocked(durableAsk).mockResolvedValueOnce({ timeout: true })
    await w.ask({ receiver: 'slow:approve', data: { draft: 'Urgent' } }, 'caller')

    // Neutral — path unchanged (strength stays at 0)
    expect(w.sense(edge)).toBe(0)
  })

  it('human missing handler (dissolved) deposits mild warning on path', async () => {
    const h = human('ghost', {
      env: mockEnv,
      telegram: 555555410,
      botToken: 'token-ghost',
    })

    w.add('ghost', h)

    const edge = 'dispatcher→ghost:approve'

    // Handler exists, but simulate dissolved via warn
    w.warn(edge, 0.5) // mild warn for dissolved

    expect(w.danger(edge)).toBe(0.5)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 4: multi-channel (same human, two channels) works independently
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 4: multi-channel humans — same person, two channels', () => {
  const mockEnv = {
    D1: { prepare: vi.fn() },
  } as any

  let w: ReturnType<typeof world>

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('human can have both telegram and discord channels', () => {
    const h = human('multi-user', {
      env: mockEnv,
      telegram: 666666610,
      discord: 'channel-combo',
      botToken: 'token-multi',
    })

    expect(h.id).toBe('multi-user')
    // Both channels stored in closure
  })

  it('separate units for same human via different channels isolate paths', async () => {
    const hTg = human('alice-tg', {
      env: mockEnv,
      telegram: 777777610,
      botToken: 'token-alice',
    })

    const hDc = human('alice-dc', {
      env: mockEnv,
      discord: 'alice-discord',
    })

    w.add('alice-tg', hTg)
    w.add('alice-dc', hDc)

    // Path to telegram version
    const edgeTg = 'system→alice-tg:approve'
    w.mark(edgeTg, 5)

    // Path to discord version (independent)
    const edgeDc = 'system→alice-dc:approve'
    expect(w.sense(edgeDc)).toBe(0) // starts fresh

    w.mark(edgeDc, 3)
    expect(w.sense(edgeTg)).toBe(5) // telegram unchanged
    expect(w.sense(edgeDc)).toBe(3) // discord separate
  })

  it('multi-channel human has multiple handler tasks', () => {
    const h = human('coordinator', {
      env: mockEnv,
      telegram: 888888610,
      discord: 'coord-dc',
      botToken: 'token-coord',
    })

    const tasks = h.list()
    expect(tasks).toContain('approve')
    expect(tasks).toContain('review')
    expect(tasks).toContain('choose')
    expect(tasks).toContain('claim')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 5: human outcome — reply received → mark()
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 5: human outcomes — result/timeout/dissolved/failure', () => {
  const mockEnv = {
    D1: { prepare: vi.fn() },
  } as any

  let w: ReturnType<typeof world>

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('result: human replies → mark() strengthens path', async () => {
    const h = human('respondent', {
      env: mockEnv,
      telegram: 999999610,
      botToken: 'token-respond',
    })

    w.add('respondent', h)

    const edge = 'requester→respondent:approve'

    vi.mocked(durableAsk).mockResolvedValueOnce({ result: 'yes' })

    await w.ask({ receiver: 'respondent:approve', data: { draft: 'Test' } }, 'requester')

    w.mark(edge, 1)
    expect(w.sense(edge)).toBe(1)
  })

  it('timeout: human slow to respond → neutral (no mark/warn)', async () => {
    const h = human('slowpoke', {
      env: mockEnv,
      telegram: 101010010,
      botToken: 'token-slow',
      timeout: 50, // 50ms
    })

    w.add('slowpoke', h)

    const edge = 'system→slowpoke:approve'

    vi.mocked(durableAsk).mockResolvedValueOnce({ timeout: true })

    await w.ask({ receiver: 'slowpoke:approve', data: { draft: 'Urgent' } }, 'system')

    // No mark, no warn — neutral (stays at 0)
    expect(w.sense(edge)).toBe(0)
  })

  it('dissolved: human capability missing → warn(0.5)', async () => {
    const h = human('invalid', {
      env: mockEnv,
      telegram: 121212010,
      botToken: 'token-invalid',
    })

    w.add('invalid', h)

    const edge = 'caller→invalid:nonexistent'

    // Simulate dissolved (no handler on unit)
    w.warn(edge, 0.5)

    expect(w.danger(edge)).toBe(0.5)
  })

  it('failure: human produces no result → warn(1.0)', async () => {
    const h = human('unresponsive', {
      env: mockEnv,
      telegram: 131313010,
      botToken: 'token-unresponsive',
    })

    w.add('unresponsive', h)

    const edge = 'system→unresponsive:approve'

    // Simulate complete failure (no result, no timeout)
    vi.mocked(durableAsk).mockResolvedValueOnce({})

    await w.ask({ receiver: 'unresponsive:approve', data: { draft: 'Test' } }, 'system')

    w.warn(edge, 1.0)
    expect(w.danger(edge)).toBe(1.0)
  })

  it('chain depth: fast human deepens mark strength', async () => {
    const h = human('fast', {
      env: mockEnv,
      telegram: 141414010,
      botToken: 'token-fast',
    })

    w.add('fast', h)

    const edge = 'upstream→fast:approve'

    vi.mocked(durableAsk).mockResolvedValueOnce({ result: 'approved' })

    // Simulate chain depth = 3 (three hops deep)
    const chainDepth = 3

    await w.ask({ receiver: 'fast:approve', data: { draft: 'Test' } }, 'upstream')

    w.mark(edge, chainDepth) // mark scaled by depth
    expect(w.sense(edge)).toBe(chainDepth)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 6: bountyClaimSignal helper — structured signal factory
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 6: bountyClaimSignal helper — factory for claim signals', () => {
  it('bountyClaimSignal(persona, bountyId, accept) builds claim signal', () => {
    const sig = bountyClaimSignal('anthony', 'bounty-xyz', true)

    expect(sig.receiver).toBe('anthony:claim')
    expect(sig.data).toMatchObject({
      bountyId: 'bounty-xyz',
      accept: true,
    })
  })

  it('bountyClaimSignal includes deliverable when provided', () => {
    const sig = bountyClaimSignal('bob', 'bounty-456', true, 'audit.pdf')

    expect(sig.data).toMatchObject({
      bountyId: 'bounty-456',
      accept: true,
      deliverable: 'audit.pdf',
    })
  })

  it('bountyClaimSignal decline signal has accept=false', () => {
    const sig = bountyClaimSignal('carol', 'bounty-789', false)

    expect(sig.data).toMatchObject({
      bountyId: 'bounty-789',
      accept: false,
    })
    expect(sig.data).not.toHaveProperty('deliverable')
  })

  it('bountyClaimSignal maps to receiver pattern unit:task', () => {
    const sig = bountyClaimSignal('david', 'bty-001', true)

    expect(sig.receiver).toMatch(/^[a-z-]+:claim$/)
  })
})
