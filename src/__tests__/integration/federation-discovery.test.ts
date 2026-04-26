/**
 * federation-discovery.test.ts
 *
 * Tests for src/lib/federation-discovery.ts
 *
 * Cases:
 * 1. fetchPeerPubkey returns parsed PeerPubkey for a valid response.
 * 2. Cache hit on second call within TTL → no network round-trip.
 * 3. Cache miss after TTL expires → re-fetches.
 * 4. Network error → null.
 * 5. Malformed JSON / missing fields → null.
 * 6. Wrong schema string → null.
 * 7. (V2.2) v2 schema with keys array → parsed into PeerPubkey.keys.
 * 8. (V2.2) v1 schema (no keys) → still parses, keys is undefined.
 * 9. (V2.2) v2 schema with malformed keys (missing credId) → null.
 *
 * Mock strategy: vi.stubGlobal('fetch', ...) to control the HTTP layer.
 * No real network calls; no TypeDB; no D1.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { _clearDiscoveryCacheForTests, CACHE_TTL_MS, fetchPeerPubkey } from '@/lib/federation-discovery'

// ── Helpers ────────────────────────────────────────────────────────────────

function validPubkeyBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    address: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
    version: 1,
    publishedAt: 1715000000,
    schema: 'owner-pubkey-v1',
    ...overrides,
  }
}

function validV2PubkeyBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    address: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
    version: 1,
    publishedAt: 1715000000,
    schema: 'owner-pubkey-v2',
    keys: [
      {
        credId: 'AAAA1234',
        pubKey: 'BBBB5678',
        alg: 'ES256',
        registeredAt: 1715000000,
      },
    ],
    ...overrides,
  }
}

function mockFetch(body: unknown, opts: { ok?: boolean; status?: number; throws?: Error } = {}) {
  const { ok = true, status = 200, throws } = opts

  const fetchMock = throws
    ? vi.fn().mockRejectedValue(throws)
    : vi.fn().mockResolvedValue({
        ok,
        status,
        json: vi.fn().mockResolvedValue(body),
      })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  _clearDiscoveryCacheForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe('fetchPeerPubkey', () => {
  it('1. returns parsed PeerPubkey for a valid response', async () => {
    const body = validPubkeyBody()
    mockFetch(body)

    const result = await fetchPeerPubkey('https://other.one.ie')

    expect(result).not.toBeNull()
    expect(result?.address).toBe(body.address)
    expect(result?.version).toBe(1)
    expect(result?.publishedAt).toBe(1715000000)
    expect(result?.schema).toBe('owner-pubkey-v1')
  })

  it('2. cache hit on second call within TTL → fetch called only once', async () => {
    const body = validPubkeyBody()
    const fetchMock = mockFetch(body)

    // First call — populates cache
    const first = await fetchPeerPubkey('https://other.one.ie')
    // Second call — should hit cache
    const second = await fetchPeerPubkey('https://other.one.ie')

    expect(first).toEqual(second)
    // fetch was called only once (not twice)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('3. cache miss after TTL expires → re-fetches', async () => {
    const body = validPubkeyBody({ version: 1 })
    mockFetch(body)

    // First call — populates cache
    await fetchPeerPubkey('https://other.one.ie')

    // Advance time past TTL using fake timers
    vi.useFakeTimers()
    vi.advanceTimersByTime(CACHE_TTL_MS + 1)

    // Clear stub and re-stub with new body (version bumped to detect re-fetch)
    vi.unstubAllGlobals()
    const updatedBody = validPubkeyBody({ version: 2 })
    const newFetchMock = mockFetch(updatedBody)

    const second = await fetchPeerPubkey('https://other.one.ie')

    // Should have re-fetched and returned the new version
    expect(second?.version).toBe(2)
    expect(newFetchMock).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('4. network error → null', async () => {
    mockFetch(null, { throws: new Error('ECONNREFUSED') })

    const result = await fetchPeerPubkey('https://unreachable.one.ie')

    expect(result).toBeNull()
  })

  it('5. malformed JSON (missing required fields) → null', async () => {
    // Missing `schema` and `version` fields
    mockFetch({ address: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b' })

    const result = await fetchPeerPubkey('https://broken.one.ie')

    expect(result).toBeNull()
  })

  it('5b. invalid address format (short hex) → null', async () => {
    mockFetch(validPubkeyBody({ address: '0xdeadbeef' }))

    const result = await fetchPeerPubkey('https://other.one.ie')

    expect(result).toBeNull()
  })

  it('6. wrong schema string → null', async () => {
    mockFetch(validPubkeyBody({ schema: 'owner-pubkey-v99' }))

    const result = await fetchPeerPubkey('https://other.one.ie')

    expect(result).toBeNull()
  })

  it('non-ok HTTP response (404) → null', async () => {
    mockFetch(null, { ok: false, status: 404 })

    const result = await fetchPeerPubkey('https://other.one.ie')

    expect(result).toBeNull()
  })

  it('trailing slash on host is normalised (cache hit)', async () => {
    const body = validPubkeyBody()
    const fetchMock = mockFetch(body)

    await fetchPeerPubkey('https://other.one.ie/')
    await fetchPeerPubkey('https://other.one.ie')

    // Both hit the same cache key — only one network call
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  // ── V2.2 JWKS shape tests ──────────────────────────────────────────────

  it('7. (V2.2) v2 schema with keys array → parsed correctly into PeerPubkey.keys', async () => {
    const body = validV2PubkeyBody()
    mockFetch(body)

    const result = await fetchPeerPubkey('https://v2.one.ie')

    expect(result).not.toBeNull()
    expect(result?.schema).toBe('owner-pubkey-v2')
    expect(Array.isArray(result?.keys)).toBe(true)
    expect(result?.keys).toHaveLength(1)
    expect(result?.keys?.[0].credId).toBe('AAAA1234')
    expect(result?.keys?.[0].pubKey).toBe('BBBB5678')
    expect(result?.keys?.[0].alg).toBe('ES256')
    expect(result?.keys?.[0].registeredAt).toBe(1715000000)
  })

  it('8. (V2.2) v1 schema (no keys) → still parses, keys is undefined', async () => {
    const body = validPubkeyBody() // schema: 'owner-pubkey-v1', no keys field
    mockFetch(body)

    const result = await fetchPeerPubkey('https://v1.one.ie')

    expect(result).not.toBeNull()
    expect(result?.schema).toBe('owner-pubkey-v1')
    // v1 body has no keys — field should be absent (undefined)
    expect(result?.keys).toBeUndefined()
  })

  it('9. (V2.2) v2 schema with malformed keys (missing credId) → null', async () => {
    const body = validV2PubkeyBody({
      keys: [
        {
          // credId missing — should fail validation
          pubKey: 'BBBB5678',
          alg: 'ES256',
          registeredAt: 1715000000,
        },
      ],
    })
    mockFetch(body)

    const result = await fetchPeerPubkey('https://broken-v2.one.ie')

    expect(result).toBeNull()
  })
})
