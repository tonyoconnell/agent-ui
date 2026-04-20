// ported from pay-plan.md spec on 2026-04-20
/**
 * Integration Test: pay ADL network gate
 *
 * Verifies that /api/pay/create-link returns 403 when the target unit's
 * perm-network.allowed_hosts does not include the required host for the rail:
 *   card  → api.stripe.com must be in allowed_hosts
 *   any   → pay.one.ie must be in allowed_hosts
 *
 * In audit mode the request proceeds but emits adl:denial:network.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { audit, enforcementMode } from '@/engine/adl-cache'
import { readParsed } from '@/lib/typedb'

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  write: vi.fn(),
  writeSilent: vi.fn(),
}))

vi.mock('@/engine/adl-cache', () => ({
  enforcementMode: vi.fn(() => 'enforce'),
  audit: vi.fn(),
  invalidateAdlCache: vi.fn(),
  getCached: vi.fn(),
  setCached: vi.fn(),
}))

vi.mock('@/components/u/lib/PayService', () => ({
  createPaymentLink: vi
    .fn()
    .mockResolvedValue({ success: true, data: { link: 'https://pay.one.ie/link', expires: 0 } }),
  createShortlink: vi.fn().mockResolvedValue({
    success: true,
    data: { code: 'xyz', shortUrl: 'https://pay.one.ie/xyz', longUrl: 'https://pay.one.ie/xyz' },
  }),
}))

// ═══════════════════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════════════════

function createMockContext(body: unknown) {
  return {
    request: new Request('http://localhost:4321/api/pay/create-link', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  } as any
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('/api/pay/create-link — ADL network gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when allowed_hosts missing api.stripe.com for card rail in enforce mode', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('enforce')

    // Lifecycle check passes
    mockReadParsed.mockResolvedValueOnce([{ s: 'active', sa: undefined }])
    // Network check: perm-network exists but does NOT include api.stripe.com
    mockReadParsed.mockResolvedValueOnce([
      {
        pn: JSON.stringify({ allowed_hosts: ['pay.one.ie'], protocols: ['https'] }),
      },
    ])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'restricted-unit', rail: 'card', amount: 25 }))

    expect(response.status).toBe(403)
    const data = (await response.json()) as any
    expect(data.gate).toBe('network')
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ gate: 'network', decision: 'deny' }))
  })

  it('returns 403 when allowed_hosts missing pay.one.ie for crypto rail in enforce mode', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('enforce')

    mockReadParsed.mockResolvedValueOnce([{ s: 'active', sa: undefined }])
    // perm-network missing pay.one.ie
    mockReadParsed.mockResolvedValueOnce([
      {
        pn: JSON.stringify({ allowed_hosts: ['api.stripe.com'], protocols: ['https'] }),
      },
    ])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'stripe-only-unit', rail: 'crypto', amount: 5 }))

    expect(response.status).toBe(403)
    const data = (await response.json()) as any
    expect(data.gate).toBe('network')
  })

  it('proceeds in audit mode and emits adl:denial:network when host missing', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('audit')

    mockReadParsed.mockResolvedValueOnce([{ s: 'active', sa: undefined }])
    // perm-network missing pay.one.ie — should fail gate but not block in audit mode
    mockReadParsed.mockResolvedValueOnce([
      {
        pn: JSON.stringify({ allowed_hosts: ['api.stripe.com'] }),
      },
    ])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'audit-unit', rail: 'crypto', amount: 5 }))

    // In audit mode: not 403
    expect(response.status).not.toBe(403)
    // audit() called with network gate
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ gate: 'network', decision: 'deny', mode: 'audit' }))
  })

  it('passes when allowed_hosts includes the required host', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('enforce')

    mockReadParsed.mockResolvedValueOnce([{ s: 'active', sa: undefined }])
    // Both hosts allowed
    mockReadParsed.mockResolvedValueOnce([
      {
        pn: JSON.stringify({ allowed_hosts: ['api.stripe.com', 'pay.one.ie'] }),
      },
    ])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'open-unit', rail: 'card', amount: 20 }))

    expect(response.status).not.toBe(403)
  })
})
