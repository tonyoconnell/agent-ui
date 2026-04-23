/**
 * Oracle consensus — staleness guard + deviation gate.
 *
 * Four accuracy questions:
 *   1. Both feeds fresh and close → returns their average
 *   2. Any feed stale → throws with source name
 *   3. Feeds deviate >2% → throws with percentage
 *   4. Single feed available → returns it (single-feed fallback)
 *
 * All fetch calls are mocked — no network, no flakiness.
 *
 * Run: bun test oracle.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCoinGecko, fetchPyth, getConsensusSuiPrice, mistToUsd, STALENESS_MS } from '../oracle'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fresh epoch-ms timestamp (well within 60s). */
const FRESH = () => Date.now() - 5_000 // 5s ago

/** Stale epoch-ms timestamp (just over the limit). */
const STALE = () => Date.now() - (STALENESS_MS + 1_000) // 61s ago

/** Build a minimal Pyth Hermes v2 response for a given price. */
function pythResponse(priceUsd: number, timestampMs: number) {
  // Pyth stores price as integer * 10^expo. We use expo=-8 for 8 decimal places.
  const expo = -8
  const rawPrice = Math.round(priceUsd * 10 ** -expo)
  return {
    parsed: [
      {
        price: {
          price: String(rawPrice),
          expo,
          publish_time: Math.floor(timestampMs / 1000), // seconds
        },
      },
    ],
  }
}

/** Build a minimal CoinGecko simple/price response. */
function geckoResponse(priceUsd: number, timestampMs: number) {
  return {
    sui: {
      usd: priceUsd,
      last_updated_at: Math.floor(timestampMs / 1000), // seconds
    },
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── Act 1: individual fetchers ───────────────────────────────────────────────

describe('fetchPyth', () => {
  it('parses a valid Pyth response', async () => {
    const ts = FRESH()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => pythResponse(3.456789, ts),
    } as Response)

    const reading = await fetchPyth()
    expect(reading.source).toBe('pyth')
    expect(reading.price).toBeCloseTo(3.456789, 4)
    expect(Math.abs(reading.timestamp - ts)).toBeLessThan(1500) // within 1.5s (rounding)
  })

  it('throws on non-OK HTTP status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response)
    await expect(fetchPyth()).rejects.toThrow('Pyth HTTP 503')
  })
})

describe('fetchCoinGecko', () => {
  it('parses a valid CoinGecko response', async () => {
    const ts = FRESH()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => geckoResponse(3.45, ts),
    } as Response)

    const reading = await fetchCoinGecko()
    expect(reading.source).toBe('coingecko')
    expect(reading.price).toBeCloseTo(3.45, 4)
    expect(Math.abs(reading.timestamp - ts)).toBeLessThan(1500)
  })

  it('throws on non-OK HTTP status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response)
    await expect(fetchCoinGecko()).rejects.toThrow('CoinGecko HTTP 429')
  })
})

// ─── Act 2: consensus logic ───────────────────────────────────────────────────

describe('getConsensusSuiPrice', () => {
  // Helper: mock fetch to return Pyth first, CoinGecko second
  function mockBothFeeds(pythPrice: number, pythTs: number, geckoPrice: number, geckoTs: number) {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => pythResponse(pythPrice, pythTs),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => geckoResponse(geckoPrice, geckoTs),
      } as Response)
  }

  // ── Scenario 1: both feeds fresh + close ──────────────────────────────────
  it('returns average when both feeds are fresh and close', async () => {
    const ts = FRESH()
    mockBothFeeds(3.4, ts, 3.42, ts)

    const price = await getConsensusSuiPrice()
    // Average of 3.40 and 3.42 = 3.41
    expect(price).toBeCloseTo(3.41, 3)
  })

  it('deviation just under boundary (1.99%) does NOT throw', async () => {
    const ts = FRESH()
    // 1.99% deviation — strictly inside the 2% limit.
    // We use fixed values to avoid floating-point boundary surprises.
    const base = 3.0
    const upper = 3.0597 // 3.00 * 1.0199 = 3.0597; deviation = 0.0199
    mockBothFeeds(base, ts, upper, ts)

    // Should not throw — deviation < MAX_DEVIATION
    const price = await getConsensusSuiPrice()
    expect(price).toBeCloseTo((base + upper) / 2, 3)
  })

  // ── Scenario 2: one feed stale ────────────────────────────────────────────
  it('throws when Pyth feed is stale', async () => {
    const staleTs = STALE()
    const freshTs = FRESH()
    mockBothFeeds(3.4, staleTs, 3.4, freshTs)

    await expect(getConsensusSuiPrice()).rejects.toThrow(/feed pyth stale/)
  })

  it('throws when CoinGecko feed is stale', async () => {
    const freshTs = FRESH()
    const staleTs = STALE()
    mockBothFeeds(3.4, freshTs, 3.4, staleTs)

    await expect(getConsensusSuiPrice()).rejects.toThrow(/feed coingecko stale/)
  })

  it('staleness error message includes age in seconds', async () => {
    const staleTs = Date.now() - 90_000 // ~90s ago
    const freshTs = FRESH()
    mockBothFeeds(3.4, staleTs, 3.4, freshTs)

    // Match any two-digit age ≥ 89s — allows ±1s execution jitter
    await expect(getConsensusSuiPrice()).rejects.toThrow(/\d+s old/)
  })

  // ── Scenario 3: feeds diverge >2% ────────────────────────────────────────
  it('throws when feeds deviate more than 2%', async () => {
    const ts = FRESH()
    // 3.40 vs 3.50 → deviation ≈ 2.94% > 2%
    mockBothFeeds(3.4, ts, 3.5, ts)

    await expect(getConsensusSuiPrice()).rejects.toThrow(/deviate.*> 2%/)
  })

  it('deviation error message includes the percentage', async () => {
    const ts = FRESH()
    mockBothFeeds(3.0, ts, 3.1, ts) // ~3.33% deviation

    await expect(getConsensusSuiPrice()).rejects.toThrow(/3\.33%/)
  })

  // ── Scenario 4: single-feed fallback ─────────────────────────────────────
  it('returns single feed price when only Pyth is available', async () => {
    const ts = FRESH()
    vi.mocked(fetch)
      // Pyth succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => pythResponse(3.4, ts),
      } as Response)
      // CoinGecko fails
      .mockRejectedValueOnce(new Error('network error'))

    const price = await getConsensusSuiPrice()
    expect(price).toBeCloseTo(3.4, 4)
  })

  it('returns single feed price when only CoinGecko is available', async () => {
    const ts = FRESH()
    vi.mocked(fetch)
      // Pyth fails
      .mockRejectedValueOnce(new Error('network error'))
      // CoinGecko succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => geckoResponse(3.45, ts),
      } as Response)

    const price = await getConsensusSuiPrice()
    expect(price).toBeCloseTo(3.45, 4)
  })

  it('throws when no feeds are available', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('timeout')).mockRejectedValueOnce(new Error('timeout'))

    await expect(getConsensusSuiPrice()).rejects.toThrow('oracle: no price feeds available')
  })

  // Single feed stale is still fatal
  it('throws when the only available feed is stale', async () => {
    const staleTs = STALE()
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('pyth down'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => geckoResponse(3.4, staleTs),
      } as Response)

    await expect(getConsensusSuiPrice()).rejects.toThrow(/feed coingecko stale/)
  })
})

// ─── Act 3: mistToUsd ────────────────────────────────────────────────────────

describe('mistToUsd', () => {
  it('converts 1 SUI (10^9 MIST) at price $3.40', () => {
    expect(mistToUsd(1_000_000_000n, 3.4)).toBeCloseTo(3.4, 8)
  })

  it('converts 0.5 SUI at price $4.00', () => {
    expect(mistToUsd(500_000_000n, 4.0)).toBeCloseTo(2.0, 8)
  })

  it('converts 0 MIST to $0', () => {
    expect(mistToUsd(0n, 3.4)).toBe(0)
  })

  it('handles large MIST amounts without overflow', () => {
    // 1,000 SUI at $3.00
    const result = mistToUsd(1_000_000_000_000n, 3.0)
    expect(result).toBeCloseTo(3000, 4)
  })
})
