import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks must be declared before imports ─────────────────────────────────────

vi.mock('@/lib/net', () => ({
  getNet: vi.fn(),
}))

import { getNet } from '@/lib/net'
import { GET } from '@/pages/api/brand/highways'

// ── Typed mock handle ─────────────────────────────────────────────────────────

const mockGetNet = vi.mocked(getNet)

// ── Seeded strength object ────────────────────────────────────────────────────

const seededStrength: Record<string, number> = {
  'brand:purple→thing:tutor': 42,
  'brand:stripe-blue→group:marketing': 25,
  'loop:W1→loop:W2': 60, // unrelated — no brand: prefix, must be excluded
  'brand:custom-abc→thing:blog': 10,
}

// ── Helper: build a minimal Astro APIRoute context ────────────────────────────

function makeCtx(search = '') {
  const url = new URL(`http://test/api/brand/highways${search}`)
  return { url } as never
}

function makeNet(strength: Record<string, number> = seededStrength) {
  return { strength }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/brand/highways', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetNet.mockResolvedValue(makeNet() as never)
  })

  // ── 1. Filters out non-brand paths, sorts desc by strength ────────────────
  it('returns only brand: paths, sorted by strength desc', async () => {
    const res = await GET(makeCtx())
    expect(res.status).toBe(200)

    const json = (await res.json()) as any
    expect(json.highways).toHaveLength(3)

    // loop:W1→loop:W2 must NOT appear
    const edges = json.highways.map((h: { edge: string }) => h.edge)
    expect(edges).not.toContain('loop:W1→loop:W2')

    // Sorted desc: 42, 25, 10
    expect(json.highways[0].strength).toBe(42)
    expect(json.highways[1].strength).toBe(25)
    expect(json.highways[2].strength).toBe(10)
  })

  // ── 2. threshold is HIGHWAY_THRESHOLD = 20 ────────────────────────────────
  it('response.threshold equals 20', async () => {
    const res = await GET(makeCtx())
    const json = (await res.json()) as any
    expect(json.threshold).toBe(20)
  })

  // ── 3. ?limit=2 → only 2 entries ─────────────────────────────────────────
  it('?limit=2 returns at most 2 entries', async () => {
    const res = await GET(makeCtx('?limit=2'))
    const json = (await res.json()) as any
    expect(json.highways).toHaveLength(2)
    // top 2 by strength
    expect(json.highways[0].strength).toBe(42)
    expect(json.highways[1].strength).toBe(25)
  })

  // ── 4. ?limit=0 treated as falsy → defaults to 10 ───────────────────────
  // parseInt('0') === 0 which is falsy, so `|| 10` kicks in → limit = 10.
  // With only 3 brand paths in the seed, all 3 are returned.
  it('?limit=0 (falsy int) defaults to 10, returning all seeded paths', async () => {
    const res = await GET(makeCtx('?limit=0'))
    const json = (await res.json()) as any
    expect(json.highways).toHaveLength(3)
  })

  // ── 5. ?limit=abc defaults to 10 ─────────────────────────────────────────
  it('?limit=abc (non-numeric) defaults to 10', async () => {
    // seed 12 brand paths to confirm the cap is 10
    const manyStrength: Record<string, number> = {}
    for (let i = 1; i <= 12; i++) {
      manyStrength[`brand:color-${i}→thing:item-${i}`] = i
    }
    mockGetNet.mockResolvedValue(makeNet(manyStrength) as never)

    const res = await GET(makeCtx('?limit=abc'))
    const json = (await res.json()) as any
    expect(json.highways).toHaveLength(10)
  })

  // ── 6. brand:purple→thing:tutor parses correctly ──────────────────────────
  it('parses thing: target as thingId, no groupId', async () => {
    const res = await GET(makeCtx())
    const json = (await res.json()) as any

    const entry = json.highways.find((h: { edge: string }) => h.edge === 'brand:purple→thing:tutor')
    expect(entry).toBeDefined()
    expect(entry.brand).toBe('purple')
    expect(entry.thingId).toBe('tutor')
    expect(entry.groupId).toBeUndefined()
  })

  // ── 7. brand:stripe-blue→group:marketing parses correctly ────────────────
  it('parses group: target as groupId, no thingId', async () => {
    const res = await GET(makeCtx())
    const json = (await res.json()) as any

    const entry = json.highways.find((h: { edge: string }) => h.edge === 'brand:stripe-blue→group:marketing')
    expect(entry).toBeDefined()
    expect(entry.brand).toBe('stripe-blue')
    expect(entry.groupId).toBe('marketing')
    expect(entry.thingId).toBeUndefined()
  })

  // ── 8. Empty net → { highways: [], threshold: 20 } ───────────────────────
  it('empty net returns empty highways array with threshold', async () => {
    mockGetNet.mockResolvedValue(makeNet({}) as never)

    const res = await GET(makeCtx())
    const json = (await res.json()) as any
    expect(json.highways).toEqual([])
    expect(json.threshold).toBe(20)
  })

  // ── 9. Response has correct content-type header ───────────────────────────
  it('sets content-type application/json', async () => {
    const res = await GET(makeCtx())
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})
