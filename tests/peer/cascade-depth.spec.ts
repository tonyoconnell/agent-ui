/**
 * P.2b — Cascade depth ≥3: silent node freezes subtree, siblings unaffected
 *
 * Unit test (Vitest, NOT Playwright). Tests the dead-man cascade logic in
 * src/workers/heartbeat.ts::checkDeadManCascade() directly.
 *
 * Graph under test:
 *
 *   parentA
 *   ├── childB  (member of g:owns:childB where parentA is chairman)
 *   │   └── grandchildC  (member of g:owns:grandchildC where childB is chairman)
 *   │        ← SILENT > 30 days → should emit agent:paused
 *   └── siblingD  (member of g:owns:siblingD where parentA is chairman)
 *                ← active heartbeat → should NOT be paused
 *
 * Expected cascade outcome:
 *   1. checkDeadManCascade(parentA):
 *      - grandchildC is silent → emits agent:paused for grandchildC
 *      - childB heartbeat is recent → NOT paused by parentA's cascade
 *      - siblingD is active → NOT paused
 *
 *   2. checkDeadManCascade(childB) [triggered from childB's own heartbeat]:
 *      - grandchildC is silent → emits agent:paused for grandchildC
 *      - childB itself is paused in the process (its child triggered cascade)
 *
 * "3-deep" is achieved by parentA → childB → grandchildC.
 *
 * Mock setup:
 *   - TypeDB readParsed() is mocked to return fixture membership + liveness data.
 *   - fetch() (for /api/signal) is mocked to capture emitted signals.
 *   - writeSilent() is mocked as a no-op.
 *
 * Reference: src/workers/heartbeat.ts, interfaces/peer/heartbeat.d.ts,
 *            interfaces/peer/events.d.ts, DEADMAN_THRESHOLD_DAYS = 30.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks (must be at top, hoisted by Vitest)
// ---------------------------------------------------------------------------

// Mock TypeDB client
vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------

import { readParsed, writeSilent } from '@/lib/typedb'
import { checkDeadManCascade, DEADMAN_THRESHOLD_DAYS } from '../../src/workers/heartbeat'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PARENT_A = 'parentA'
const CHILD_B = 'childB'
const GRANDCHILD_C = 'grandchildC'
const SIBLING_D = 'siblingD'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** ISO date string N days in the past */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * MS_PER_DAY).toISOString().slice(0, 19)
}

/** ISO date string N days in the future (i.e. recent heartbeat) */
function daysAgoRecent(): string {
  return daysAgo(1) // 1 day ago = well within the 30-day window
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let capturedSignals: Array<{ receiver: string; type: string; reason?: string }> = []

beforeEach(() => {
  capturedSignals = []
  vi.resetAllMocks()
  vi.mocked(writeSilent).mockResolvedValue(undefined)

  // Mock global fetch to capture /api/signal calls
  global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
    if (typeof url === 'string' && url.includes('/api/signal') && opts?.method === 'POST') {
      try {
        const body = JSON.parse(opts.body as string)
        const data = typeof body.data === 'string' ? JSON.parse(body.data) : body.data
        capturedSignals.push({
          receiver: body.receiver as string,
          type: data?.type as string,
          reason: data?.reason as string | undefined,
        })
      } catch {
        // malformed — ignore
      }
    }
    return { ok: true } as Response
  }) as typeof fetch
})

afterEach(() => {
  vi.resetAllMocks()
})

// ---------------------------------------------------------------------------
// Helper: configure readParsed mock for a given graph topology
// ---------------------------------------------------------------------------

/**
 * Configure the readParsed mock to return the fixture graph.
 *
 * readParsed is called multiple times per checkDeadManCascade invocation:
 *   1. Children query (membership in g:owns:<parentUid>)
 *   2. Per-child: liveness-last-verified-at query
 *   3. Per-child (if no liveness): created timestamp query
 *
 * We distinguish calls by inspecting the TQL string.
 */
function setupReadParsedMock(opts: {
  parentUid: string
  children: string[]
  childLiveness: Record<string, string | null> // uid → ISO or null (never heartbeated)
  childCreatedAt: Record<string, string> // uid → ISO (for null-liveness fallback)
}): void {
  vi.mocked(readParsed).mockImplementation(async (tql: string) => {
    // Children query: returns membership rows for the parent
    if (tql.includes('"owns"') && tql.includes(`"${opts.parentUid}"`)) {
      return opts.children.map(childUid => ({ childUid, gid: `g:owns:${childUid}` }))
    }

    // Liveness query for a specific child
    for (const childUid of opts.children) {
      if (tql.includes(`"${childUid}"`) && tql.includes('liveness-last-verified-at')) {
        const lv = opts.childLiveness[childUid]
        if (lv === null) return [] // never heartbeated
        return [{ lv }]
      }
      // Created-at fallback query
      if (tql.includes(`"${childUid}"`) && tql.includes('has created')) {
        return [{ c: opts.childCreatedAt[childUid] }]
      }
    }

    return []
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('P.2b — Dead-man cascade depth ≥3', () => {
  it('grandchildC silent >30d → paused; childB and siblingD unaffected by parentA cascade', async () => {
    // -------------------------------------------------------------------------
    // Graph:
    //   parentA → [childB (active), siblingD (active)]
    //   childB  → [grandchildC (silent 31d)]
    //
    // checkDeadManCascade(parentA) checks parentA's direct children:
    //   - childB: liveness 1 day ago → NOT paused
    //   - siblingD: liveness 1 day ago → NOT paused
    //
    // checkDeadManCascade(childB) checks childB's direct children:
    //   - grandchildC: silent 31 days → PAUSED
    // -------------------------------------------------------------------------

    // --- Step 1: cascade from parentA ---
    setupReadParsedMock({
      parentUid: PARENT_A,
      children: [CHILD_B, SIBLING_D],
      childLiveness: {
        [CHILD_B]: daysAgoRecent(),
        [SIBLING_D]: daysAgoRecent(),
      },
      childCreatedAt: {
        [CHILD_B]: daysAgo(60),
        [SIBLING_D]: daysAgo(45),
      },
    })

    await checkDeadManCascade(PARENT_A)

    // parentA's cascade should NOT pause childB or siblingD
    const pausedByParentA = capturedSignals.filter(
      s => s.type === 'agent:paused' && s.reason === 'deadman',
    )
    expect(pausedByParentA).toHaveLength(0)

    // --- Step 2: cascade from childB (childB's own heartbeat triggers this) ---
    capturedSignals = []

    setupReadParsedMock({
      parentUid: CHILD_B,
      children: [GRANDCHILD_C],
      childLiveness: {
        [GRANDCHILD_C]: null, // never heartbeated
      },
      childCreatedAt: {
        [GRANDCHILD_C]: daysAgo(DEADMAN_THRESHOLD_DAYS + 1), // created 31 days ago → silent
      },
    })

    await checkDeadManCascade(CHILD_B)

    // grandchildC must be paused
    const pausedByChildB = capturedSignals.filter(
      s => s.type === 'agent:paused' && s.reason === 'deadman',
    )
    expect(pausedByChildB).toHaveLength(1)
    expect(pausedByChildB[0].receiver).toBe(GRANDCHILD_C)

    // siblingD must NOT be in any paused signal
    const siblingPaused = capturedSignals.some(s => s.receiver === SIBLING_D)
    expect(siblingPaused).toBe(false)
  })

  it('grandchildC silent exactly 30d (threshold boundary) → still paused', async () => {
    // Edge: exactly at the threshold (not strictly greater) — treated as silent
    // to prevent off-by-one. Adjust if spec moves to strictly-greater.
    setupReadParsedMock({
      parentUid: CHILD_B,
      children: [GRANDCHILD_C],
      childLiveness: {
        [GRANDCHILD_C]: daysAgo(DEADMAN_THRESHOLD_DAYS), // exactly 30 days
      },
      childCreatedAt: {
        [GRANDCHILD_C]: daysAgo(60),
      },
    })

    await checkDeadManCascade(CHILD_B)

    const paused = capturedSignals.filter(s => s.type === 'agent:paused')
    expect(paused.length).toBeGreaterThanOrEqual(1)
    expect(paused[0].receiver).toBe(GRANDCHILD_C)
  })

  it('grandchildC active (29d ago) → NOT paused', async () => {
    setupReadParsedMock({
      parentUid: CHILD_B,
      children: [GRANDCHILD_C],
      childLiveness: {
        [GRANDCHILD_C]: daysAgo(29), // within threshold
      },
      childCreatedAt: {
        [GRANDCHILD_C]: daysAgo(60),
      },
    })

    await checkDeadManCascade(CHILD_B)

    const paused = capturedSignals.filter(s => s.type === 'agent:paused')
    expect(paused).toHaveLength(0)
  })

  it('siblingD remains unaffected even when sibling subtree has a silent node', async () => {
    // parentA → [childB, siblingD]
    // childB → [grandchildC (silent)]
    // siblingD → [] (no children)
    //
    // parentA cascade: childB active (no pause), siblingD active (no pause)
    // childB cascade: grandchildC paused
    // siblingD cascade: no children → no pauses
    //
    // Final state: only grandchildC is paused; siblingD unaffected.

    // --- parentA cascade ---
    setupReadParsedMock({
      parentUid: PARENT_A,
      children: [CHILD_B, SIBLING_D],
      childLiveness: {
        [CHILD_B]: daysAgoRecent(),
        [SIBLING_D]: daysAgoRecent(),
      },
      childCreatedAt: {
        [CHILD_B]: daysAgo(60),
        [SIBLING_D]: daysAgo(60),
      },
    })
    await checkDeadManCascade(PARENT_A)
    expect(capturedSignals.filter(s => s.type === 'agent:paused')).toHaveLength(0)

    capturedSignals = []

    // --- childB cascade ---
    setupReadParsedMock({
      parentUid: CHILD_B,
      children: [GRANDCHILD_C],
      childLiveness: { [GRANDCHILD_C]: daysAgo(31) },
      childCreatedAt: { [GRANDCHILD_C]: daysAgo(60) },
    })
    await checkDeadManCascade(CHILD_B)

    const childBPaused = capturedSignals.filter(s => s.type === 'agent:paused')
    expect(childBPaused).toHaveLength(1)
    expect(childBPaused[0].receiver).toBe(GRANDCHILD_C)

    capturedSignals = []

    // --- siblingD cascade (no children) ---
    setupReadParsedMock({
      parentUid: SIBLING_D,
      children: [],
      childLiveness: {},
      childCreatedAt: {},
    })
    await checkDeadManCascade(SIBLING_D)
    expect(capturedSignals.filter(s => s.type === 'agent:paused')).toHaveLength(0)

    // grandchildC was paused, siblingD was not
    const allPaused = capturedSignals.filter(s => s.type === 'agent:paused')
    const siblingPaused = allPaused.some(s => s.receiver === SIBLING_D)
    expect(siblingPaused).toBe(false)
  })

  it('no TypeDB children found → no signals emitted (zero-returns)', async () => {
    // If readParsed returns [] for the children query, nothing should happen.
    vi.mocked(readParsed).mockResolvedValue([])

    await checkDeadManCascade(PARENT_A)

    // No fetch calls to /api/signal
    const signalCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('/api/signal'),
    )
    expect(signalCalls).toHaveLength(0)
  })

  it('readParsed throws → cascade completes without rethrowing (graceful degradation)', async () => {
    vi.mocked(readParsed).mockRejectedValue(new Error('TypeDB unavailable'))

    // Must not throw — the function uses .catch(() => []) internally
    await expect(checkDeadManCascade(PARENT_A)).resolves.toBeUndefined()
  })

  it('paused signal carries correct shape: receiver=childUid, reason="deadman"', async () => {
    setupReadParsedMock({
      parentUid: PARENT_A,
      children: [CHILD_B],
      childLiveness: { [CHILD_B]: daysAgo(31) },
      childCreatedAt: { [CHILD_B]: daysAgo(60) },
    })

    await checkDeadManCascade(PARENT_A)

    expect(capturedSignals).toHaveLength(1)
    expect(capturedSignals[0]).toMatchObject({
      receiver: CHILD_B,
      type: 'agent:paused',
      reason: 'deadman',
    })
  })
})
