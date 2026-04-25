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

  it('(a) returns null wallet when platform key is removed', async () => {
    const res = await callRegister({ uid: 'buyer-abc123', kind: 'human' })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, any>
    expect(body.ok).toBe(true)
    expect(body.uid).toBe('buyer-abc123')
    expect(body.status).toBe('registered')
    expect(body.wallet).toBeFalsy()
  })

  it('(b) returns null wallet when address derivation unavailable (fail gracefully)', async () => {
    const res = await callRegister({ uid: 'buyer-no-seed', kind: 'human' })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, any>
    expect(body.ok).toBe(true)
    expect(body.uid).toBe('buyer-no-seed')
    expect(body.status).toBe('registered')
    // Wallet is null/falsy when derivation not available — does NOT 500
    expect(body.wallet).toBeFalsy()
  })

  it('(c) returns 400 when uid is missing', async () => {
    const res = await callRegister({ kind: 'agent' })

    expect(res.status).toBe(400)
    const body = (await res.json()) as Record<string, any>
    expect(body.error).toMatch(/uid/)
  })

  it('(d) accepts uid correctly (wallet derivation no longer available)', async () => {
    const uid = 'agent-deterministic-test'

    const res = await callRegister({ uid })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, any>
    expect(body.uid).toBe(uid)
    // Wallet is null/falsy since platform key removed, derivation unavailable
    expect(body.wallet).toBeFalsy()
  })

  it('(e) capabilities count returned correctly', async () => {
    const res = await callRegister({
      uid: 'agent-caps',
      capabilities: [
        { skill: 'translate', price: 0.05 },
        { skill: 'summarise', price: 0.02 },
      ],
    })

    const body = (await res.json()) as Record<string, any>
    expect(body.capabilities).toBe(2)
  })
})
