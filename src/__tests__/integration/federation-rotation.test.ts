/**
 * federation-rotation.test.ts — Gap 6 §6.t2: stale bridge after peer key rotation
 *
 * Verifies:
 * 1. Bridge stored with peer_owner_version=3; signal arrives with
 *    peerOwnerVersion=4 → rejected with federation='bridge:stale'.
 * 2. Bridge stored with peer_owner_version=3; signal arrives with
 *    peerOwnerVersion=3 → accepted (+ owner role downgraded per §6.t1).
 * 3. Bridge stored with peer_owner_version=3; signal arrives with NO
 *    peerOwnerVersion → V1 fallback: accepted, warn but allow.
 *    TODO Gap 6 V2: enforce peerOwnerVersion presence.
 *
 * Mock strategy:
 * - vi.mock('@/lib/typedb') — bridge path lookup (readParsed)
 * - vi.mock('@/engine/adl-cache') — suppress audit() side-effects
 * Real inbound() logic runs.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Hoist mocks so factories can reference them safely ────────────────────

const { auditMock } = vi.hoisted(() => ({ auditMock: vi.fn() }))

vi.mock('@/engine/adl-cache', () => ({
  audit: auditMock,
  CACHE_TTL: 300_000,
  PERM_CACHE: new Map(),
}))

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
  write: vi.fn().mockResolvedValue(undefined),
}))

import { type BridgePath, type InboundSignal, inbound } from '@/engine/federation'
import { readParsed } from '@/lib/typedb'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeBridge(peerOwnerVersion: number | undefined): BridgePath {
  return {
    from: '0xAAA',
    to: 'local',
    peerOwnerAddress: '0xAAA',
    peerOwnerVersion,
  }
}

function makeSignal(peerOwnerVersion?: number): InboundSignal {
  return {
    receiver: 'some:handler',
    data: {},
    role: 'chairman',
    ...(peerOwnerVersion !== undefined ? { peerOwnerVersion } : {}),
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('federation inbound() — Gap 6 §6.t2: rotation invalidates bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: readParsed returns empty (version comes from bridge record directly)
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([])
  })

  it('1. stored version=3; signal peerOwnerVersion=4 → rejected bridge:stale', async () => {
    const bridge = makeBridge(3)
    const signal = makeSignal(4) // rotated key

    const result = await inbound(signal, bridge)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.federation).toBe('bridge:stale')
    expect(result.reason).toMatch(/re-handshake/i)
  })

  it('2. stored version=3; signal peerOwnerVersion=3 → accepted', async () => {
    const bridge = makeBridge(3)
    const signal = makeSignal(3)

    const result = await inbound(signal, bridge)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    // chairman role stays chairman (no downgrade needed here)
    expect(result.signal.role).toBe('chairman')
  })

  it('2b. stored version=3; signal peerOwnerVersion=3 with role=owner → accepted + downgraded', async () => {
    const bridge = makeBridge(3)
    const signal: InboundSignal = { receiver: 'x', role: 'owner', peerOwnerVersion: 3 }

    const result = await inbound(signal, bridge)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.signal.role).toBe('chairman')
    expect(auditMock).toHaveBeenCalledOnce()
  })

  it('3. stored version=3; signal has NO peerOwnerVersion → V1 fallback: accepted (warn but allow)', async () => {
    // Gap 6 V1 behaviour: missing peerOwnerVersion on signal is treated as
    // "graceful fallback — allow". This covers old peers that pre-date Gap 6.
    // TODO Gap 6 V2: reject when peerOwnerVersion is absent (enforce presence).
    const bridge = makeBridge(3)
    const signal = makeSignal(undefined) // no version

    const result = await inbound(signal, bridge)

    // V1: accepted even without version field
    expect(result.ok).toBe(true)
  })

  it('3b. bridge has no stored version; signal has no version → accepted (no data to compare)', async () => {
    const bridge = makeBridge(undefined) // legacy bridge, no version stored
    const signal = makeSignal(undefined)

    const result = await inbound(signal, bridge)

    expect(result.ok).toBe(true)
  })

  it('3c. bridge has no stored version; signal has version=5 → V1: accepted (stored=undefined, cannot reject)', async () => {
    // storedVersion undefined → no comparison possible → allow (V1 permissive)
    const bridge = makeBridge(undefined)
    const signal = makeSignal(5)

    const result = await inbound(signal, bridge)

    expect(result.ok).toBe(true)
  })

  it('TypeDB lookup fallback: bridge missing version in record, TypeDB has it', async () => {
    // If bridge.peerOwnerVersion is undefined, inbound() queries TypeDB.
    // Simulate TypeDB returning version=3; signal sends version=4 → stale.
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([{ v: 3 }])

    const bridge: BridgePath = {
      from: '0xAAA',
      to: 'local',
      peerOwnerAddress: '0xAAA',
      // peerOwnerVersion deliberately absent — triggers TypeDB lookup
    }
    const signal = makeSignal(4) // rotated

    const result = await inbound(signal, bridge)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.federation).toBe('bridge:stale')
  })
})
