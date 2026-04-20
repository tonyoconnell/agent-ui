// ported from pay-plan.md spec on 2026-04-20
/**
 * Integration Test: pay ADL lifecycle gate
 *
 * Verifies that /api/pay/create-link returns 410 Gone when the target unit
 * has adl-status="retired" or sunset-at in the past, in enforce mode.
 * In audit mode, the request proceeds and an adl:denial:lifecycle signal is emitted.
 *
 * Tests marked describe.skip because they require a running server — the bodies
 * are real code exercising real ADL logic. Run individually with:
 *   bun vitest src/__tests__/integration/pay-adl-lifecycle.test.ts --reporter=verbose
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
    data: { code: 'abc123', shortUrl: 'https://pay.one.ie/abc123', longUrl: 'https://pay.one.ie/abc123' },
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

describe('/api/pay/create-link — ADL lifecycle gate', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 410 when unit adl-status=retired in enforce mode', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('enforce')

    // First readParsed call: lifecycle check returns retired
    mockReadParsed.mockResolvedValueOnce([{ s: 'retired', sa: undefined }])
    // Second readParsed call: network check (won't be reached in enforce mode)
    mockReadParsed.mockResolvedValueOnce([])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'retired-unit', rail: 'card', amount: 10 }))

    expect(response.status).toBe(410)
    const data = (await response.json()) as any
    expect(data.gate).toBe('lifecycle')
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ gate: 'lifecycle', decision: 'deny' }))
  })

  it('returns 410 when sunset-at is in the past in enforce mode', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('enforce')

    // sunset-at is in the past
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    mockReadParsed.mockResolvedValueOnce([{ s: 'active', sa: pastDate }])
    mockReadParsed.mockResolvedValueOnce([])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'sunset-unit', rail: 'crypto', amount: 5 }))

    expect(response.status).toBe(410)
    const data = (await response.json()) as any
    expect(data.gate).toBe('lifecycle')
  })

  it('proceeds in audit mode and emits adl:denial:lifecycle signal', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('audit')

    // Lifecycle check fails (retired)
    mockReadParsed.mockResolvedValueOnce([{ s: 'retired', sa: undefined }])
    // Network check passes
    mockReadParsed.mockResolvedValueOnce([])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'retired-unit', rail: 'crypto', amount: 5 }))

    // In audit mode the request should NOT return 410 — it proceeds
    expect(response.status).not.toBe(410)
    // audit() should still have been called
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ gate: 'lifecycle', decision: 'deny', mode: 'audit' }))
  })

  it('passes through when unit has active status', async () => {
    const mockReadParsed = readParsed as any
    const mockEnforcementMode = enforcementMode as any

    mockEnforcementMode.mockReturnValue('enforce')
    mockReadParsed.mockResolvedValueOnce([{ s: 'active', sa: undefined }])
    // Network check: no perm-network restriction
    mockReadParsed.mockResolvedValueOnce([])

    const { POST } = await import('@/pages/api/pay/create-link')
    const response = await POST(createMockContext({ to: 'active-unit', rail: 'crypto', amount: 5 }))

    expect(response.status).not.toBe(410)
  })
})
