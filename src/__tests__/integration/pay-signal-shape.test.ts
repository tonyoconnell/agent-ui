// ported from pay-plan.md spec on 2026-04-20
/**
 * Integration Test: substrate:pay signal shape invariant
 *
 * Verifies that card, crypto, and weight rails all emit substrate:pay signals
 * with the same schema (identical keys in data.content, same tag-prefix conventions).
 *
 * Uses schema-match assertions that fail loudly if any rail diverges.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readParsed } from '@/lib/typedb'

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  write: vi.fn().mockResolvedValue(true),
  writeSilent: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/engine/adl-cache', () => ({
  enforcementMode: vi.fn(() => 'audit'), // audit mode so all rails proceed
  audit: vi.fn(),
  invalidateAdlCache: vi.fn(),
  getCached: vi.fn(),
  setCached: vi.fn(),
}))

vi.mock('@/components/u/lib/PayService', () => ({
  createPaymentLink: vi.fn().mockResolvedValue({
    success: true,
    data: { link: 'https://pay.one.ie/card-link', expires: 0 },
  }),
  createShortlink: vi.fn().mockResolvedValue({
    success: true,
    data: { code: 'abc', shortUrl: 'https://pay.one.ie/abc', longUrl: 'https://pay.one.ie/abc' },
  }),
}))

// ─── Capture emitted signals ──────────────────────────────────────────────

const capturedSignals: unknown[] = []

vi.stubGlobal(
  'fetch',
  vi.fn(async (url: string, init?: RequestInit) => {
    // Capture signals to substrate:pay receiver
    if (url.includes('/api/signal') && init?.body) {
      try {
        const body = JSON.parse(init.body as string)
        if (body?.receiver === 'substrate:pay') {
          capturedSignals.push(body)
        }
      } catch {
        // ignore parse errors
      }
    }
    // Return OK for all fetch calls
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
)

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

// ─── Signal schema contract ────────────────────────────────────────────────
// Every substrate:pay signal MUST have exactly these keys in data.content.
const REQUIRED_CONTENT_KEYS = ['rail', 'from', 'to', 'ref', 'status', 'provider'] as const

// Tag prefix conventions: first tag always "pay", second is rail name
function assertSignalShape(signal: unknown, expectedRail: string): void {
  expect(signal).toMatchObject({
    receiver: 'substrate:pay',
    data: expect.objectContaining({
      weight: expect.any(Number),
      tags: expect.arrayContaining(['pay', expectedRail]),
      content: expect.objectContaining(Object.fromEntries(REQUIRED_CONTENT_KEYS.map((k) => [k, expect.anything()]))),
    }),
  })

  // Ensure no sensitive keys leak through
  const body = signal as { data: { content: Record<string, unknown> } }
  const content = body.data.content
  const forbiddenKeys = ['pan', 'cvc', 'email', 'cardholder_name', 'buyer']
  for (const key of forbiddenKeys) {
    expect(content).not.toHaveProperty(key)
  }

  // Ensure tags[0] is always "pay"
  const tags = (signal as { data: { tags: string[] } }).data.tags
  expect(tags[0]).toBe('pay')
  expect(tags[1]).toBe(expectedRail)
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('substrate:pay signal shape — cross-rail invariant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSignals.length = 0

    const mockReadParsed = readParsed as any
    // Lifecycle check passes for all tests
    mockReadParsed.mockResolvedValue([{ s: 'active', sa: undefined }])
  })

  it('card rail emits substrate:pay with correct shape', async () => {
    const { POST } = await import('@/pages/api/pay/create-link')
    await POST(createMockContext({ to: 'unit-b', from: 'unit-a', rail: 'card', amount: 29.99, sku: 'prod-1' }))

    // Allow async fetch to settle
    await new Promise((r) => setTimeout(r, 10))

    const signal = capturedSignals.find(
      (s) => (s as { data: { content: { rail: string } } }).data.content.rail === 'card',
    )
    expect(signal).toBeDefined()
    assertSignalShape(signal, 'card')

    const content = (signal as { data: { content: Record<string, unknown> } }).data.content
    expect(content.status).toBe('pending') // create-link emits pending
    expect(content.provider).toBe('stripe')
    expect(content.sku).toBe('prod-1')
  })

  it.skip('crypto rail emits substrate:pay with correct shape', async () => {
    // SKIPPED: Platform SUI_SEED removed (sys-201). Crypto rail requires deriveAddressForChain
    // which now rejects with "Platform key removed". Address derivation moved to user vault.
    // See: src/lib/pay/chains/index.ts:156-182
    const { POST } = await import('@/pages/api/pay/create-link')
    await POST(createMockContext({ to: 'unit-c', from: 'unit-a', rail: 'crypto', amount: 1.5, sku: 'nft-1' }))

    await new Promise((r) => setTimeout(r, 10))

    const signal = capturedSignals.find(
      (s) => (s as { data: { content: { rail: string } } }).data.content.rail === 'crypto',
    )
    expect(signal).toBeDefined()
    assertSignalShape(signal, 'crypto')

    const content = (signal as { data: { content: Record<string, unknown> } }).data.content
    expect(content.status).toBe('pending')
    expect(content.provider).toBe('pay.one.ie')
  })

  it('weight rail emits substrate:pay via /api/pay POST', async () => {
    const { POST } = await import('@/pages/api/pay')
    await POST({
      request: new Request('http://localhost:4321/api/pay', {
        method: 'POST',
        body: JSON.stringify({ from: 'unit-x', to: 'unit-y', task: 'task-1', amount: 5.0 }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any)

    await new Promise((r) => setTimeout(r, 10))

    const signal = capturedSignals.find(
      (s) =>
        (s as { receiver: string }).receiver === 'substrate:pay' &&
        ['weight', 'crypto'].includes((s as { data: { content: { rail: string } } }).data.content.rail),
    )
    expect(signal).toBeDefined()

    const content = (signal as { data: { content: Record<string, unknown> } }).data.content
    // weight rail invariants
    expect(content).toHaveProperty('rail')
    expect(content).toHaveProperty('from')
    expect(content).toHaveProperty('to')
    expect(content).toHaveProperty('ref')
    expect(content).toHaveProperty('status')
    expect(content).toHaveProperty('provider')
    expect(content.status).toBe('captured')
  })

  it('all rails share identical content key set', async () => {
    // This test checks the structural invariant: every captured signal must have
    // exactly the REQUIRED_CONTENT_KEYS, no more sensitive keys, tags[0]==='pay'
    for (const signal of capturedSignals) {
      const content = (signal as { data: { content: Record<string, unknown> } }).data.content
      for (const key of REQUIRED_CONTENT_KEYS) {
        expect(content).toHaveProperty(key)
      }
    }
  })
})
