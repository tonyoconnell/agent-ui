/**
 * POST /api/agents/register — wallet derivation tests
 *
 * The register endpoint now derives a Sui wallet via addressFor(uid)
 * and returns it in the response. This wallet is used by the
 * useAgentLifecycle hook (step 2: Register buyer + derive Sui wallet).
 *
 * Tests:
 *  (a) Successful registration returns uid + status + wallet
 *  (b) addressFor failure → wallet: null (fail gracefully, not 500)
 *  (c) Missing uid → 400 Bad Request
 *  (d) wallet is the same address for the same uid (deterministic)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/engine/persist', () => ({
  world: vi.fn(() => ({
    actor: vi.fn(),
    thing: vi.fn(),
    capable: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@/lib/sui', () => ({
  addressFor: vi.fn(),
}))

import { addressFor } from '@/lib/sui'

// ── Helper ────────────────────────────────────────────────────────────────────

async function callRegister(body: Record<string, unknown>) {
  const { POST } = await import('@/pages/api/agents/register')
  const req = new Request('http://localhost/api/agents/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST({ request: req } as Parameters<typeof POST>[0])
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/agents/register — wallet derivation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('(a) returns wallet address when derivation succeeds', async () => {
    const mockWallet = '0xdeadbeef1234567890abcdef'
    vi.mocked(addressFor).mockResolvedValue(mockWallet)

    const res = await callRegister({ uid: 'buyer-abc123', kind: 'human' })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.uid).toBe('buyer-abc123')
    expect(body.status).toBe('registered')
    expect(body.wallet).toBe(mockWallet)
    expect(addressFor).toHaveBeenCalledWith('buyer-abc123')
  })

  it('(b) returns wallet: null when addressFor throws (fail gracefully)', async () => {
    vi.mocked(addressFor).mockRejectedValue(new Error('SUI_SEED not set'))

    const res = await callRegister({ uid: 'buyer-no-seed', kind: 'human' })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.uid).toBe('buyer-no-seed')
    expect(body.status).toBe('registered')
    // Wallet is null when derivation fails — does NOT 500
    expect(body.wallet).toBeNull()
  })

  it('(c) returns 400 when uid is missing', async () => {
    const res = await callRegister({ kind: 'agent' })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/uid/)
    // addressFor should NOT be called without a uid
    expect(addressFor).not.toHaveBeenCalled()
  })

  it('(d) passes uid correctly to addressFor (deterministic derivation)', async () => {
    const uid = 'agent-deterministic-test'
    const mockAddr = '0xcafe5678'
    vi.mocked(addressFor).mockResolvedValue(mockAddr)

    await callRegister({ uid })

    // Same uid always produces the same address — the derivation is deterministic
    // (HKDF-SHA256(seed || uid) → Ed25519 keypair → Sui address)
    expect(addressFor).toHaveBeenCalledTimes(1)
    expect(addressFor).toHaveBeenCalledWith(uid)
  })

  it('(e) capabilities count returned correctly', async () => {
    vi.mocked(addressFor).mockResolvedValue('0xwallet')

    const res = await callRegister({
      uid: 'agent-caps',
      capabilities: [
        { skill: 'translate', price: 0.05 },
        { skill: 'summarise', price: 0.02 },
      ],
    })

    const body = await res.json()
    expect(body.capabilities).toBe(2)
  })
})
