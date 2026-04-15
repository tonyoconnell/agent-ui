/**
 * POST /api/harden — integration tests
 *
 * Tests the three observable outcomes:
 *  (a) strength - resistance < 50  → 400 Bad Request
 *  (b) sui-path-id missing          → 409 Conflict
 *  (c) happy path                   → 200, sui.harden called, TypeDB updated
 *
 * Mocks: @/lib/sui (harden), @/lib/typedb (readParsed, writeSilent), @/lib/net (getNet)
 *
 * Does NOT require Sui testnet or live TypeDB.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/sui', () => ({
  harden: vi.fn(),
}))

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
}))

vi.mock('@/lib/net', () => ({
  getNet: vi.fn(),
}))

import { getNet } from '@/lib/net'
import { harden as suiHarden } from '@/lib/sui'
import { readParsed, writeSilent } from '@/lib/typedb'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal mock PersistentWorld */
function makeMockNet({ strength = 0, resistance = 0 } = {}) {
  return {
    sense: vi.fn(() => strength),
    danger: vi.fn(() => resistance),
  }
}

/** POST /api/harden via the handler directly (no HTTP server needed) */
async function callHarden(body: Record<string, unknown>) {
  // Dynamically import after mocks are installed
  const { POST } = await import('@/pages/api/harden')
  const req = new Request('http://localhost/api/harden', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST({ request: req } as Parameters<typeof POST>[0])
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/harden', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  // ── (a) strength - resistance < 50 → 400 ─────────────────────────────────
  it('returns 400 when effective weight is below 50', async () => {
    // strength=30, resistance=10 → effective=20 < 50
    vi.mocked(getNet).mockResolvedValue(makeMockNet({ strength: 30, resistance: 10 }) as any)

    const res = await callHarden({ uid: 'alice', from: 'alice', to: 'bob' })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/not strong enough/)
    expect(body.effective).toBeCloseTo(20)
    // Sui and TypeDB must NOT be called
    expect(suiHarden).not.toHaveBeenCalled()
    expect(writeSilent).not.toHaveBeenCalled()
  })

  // ── (b) path not on-chain → 409 ───────────────────────────────────────────
  it('returns 409 when sui-path-id is missing from TypeDB', async () => {
    // strength=80, resistance=10 → effective=70 >= 50
    vi.mocked(getNet).mockResolvedValue(makeMockNet({ strength: 80, resistance: 10 }) as any)
    // readParsed returns empty — no sui-path-id in TypeDB
    vi.mocked(readParsed).mockResolvedValue([])

    const res = await callHarden({ uid: 'alice', from: 'alice', to: 'bob' })

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/not on-chain/)
    expect(suiHarden).not.toHaveBeenCalled()
    expect(writeSilent).not.toHaveBeenCalled()
  })

  // ── (c) happy path → 200, Sui called, TypeDB updated ─────────────────────
  it('hardens successfully: calls sui.harden and updates TypeDB', async () => {
    const mockDigest = '0xdeadbeef'
    const mockHighwayId = '0xcafe1234'
    const mockPathId = '0xabc999'

    // strength=100, resistance=5 → effective=95
    vi.mocked(getNet).mockResolvedValue(makeMockNet({ strength: 100, resistance: 5 }) as any)
    // readParsed returns the sui-path-id
    vi.mocked(readParsed).mockResolvedValue([{ pid: mockPathId }])
    // sui.harden returns digest + highwayId
    vi.mocked(suiHarden).mockResolvedValue({ digest: mockDigest, highwayId: mockHighwayId })

    const res = await callHarden({ uid: 'alice', from: 'alice', to: 'bob' })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.digest).toBe(mockDigest)
    expect(body.highwayId).toBe(mockHighwayId)
    expect(body.strength).toBe(100)
    expect(body.resistance).toBe(5)

    // Sui was called with correct args
    expect(suiHarden).toHaveBeenCalledWith('alice', mockPathId)

    // TypeDB was updated with sui-highway-id and hardened-at
    expect(writeSilent).toHaveBeenCalledOnce()
    const tql = vi.mocked(writeSilent).mock.calls[0][0] as string
    expect(tql).toContain(mockHighwayId)
    expect(tql).toContain('sui-highway-id')
    expect(tql).toContain('hardened-at')
  })
})
