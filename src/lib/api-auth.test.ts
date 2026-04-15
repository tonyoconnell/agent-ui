/**
 * AUTH — API Key Validation & Permission Middleware
 *
 * Two accuracy questions:
 *   1. Does validateApiKey() correctly identify valid vs invalid keys?
 *   2. Does the in-process cache eliminate repeat TypeDB calls?
 *
 * One speed question:
 *   3. Does the cache make repeat auth O(1)?
 *
 * Run: bun vitest run src/lib/api-auth.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock TypeDB — auth must not hit the database in unit tests ─────────────
vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn(),
}))

// ── Mock net — prevent warnAuthBoundary from reaching bridge/Sui ───────────
vi.mock('@/lib/net', () => ({
  getNet: vi.fn().mockResolvedValue({
    warn: vi.fn().mockResolvedValue(undefined),
    mark: vi.fn().mockResolvedValue(undefined),
  }),
}))

// ── Mock security-signals — prevent TypeDB writes in unit tests ────────────
vi.mock('@/lib/security-signals', () => ({
  emitSecurityEvent: vi.fn(),
}))

// ── Mock api-key verifyKey — control pass/fail without PBKDF2 cost ─────────
vi.mock('./api-key', () => ({
  generateApiKey: vi.fn().mockReturnValue('api_test_32characterrandomstringhere'),
  hashKey: vi.fn().mockResolvedValue('$pbkdf2$100000$fakesalt$fakehash'),
  verifyKey: vi.fn().mockResolvedValue(false), // default: reject
}))

import { readParsed } from '@/lib/typedb'
import { hasPermission, invalidateKeyCache, validateApiKey } from './api-auth'
import { verifyKey } from './api-key'

const VALID_KEY = 'api_test_validkeyAAAAAAAAAAAAAAAAAAAAA'
const VALID_ROW = {
  id: 'key-test-001',
  h: '$pbkdf2$100000$fakesalt$fakehash',
  u: 'alice',
  p: 'read,write',
}

function makeRequest(authHeader?: string): Request {
  return new Request('https://api.one.ie/api/signal', {
    headers: authHeader ? { Authorization: authHeader } : {},
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: No auth header → always invalid
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: missing or malformed header', () => {
  it('returns isValid: false when no Authorization header', async () => {
    const result = await validateApiKey(makeRequest())
    expect(result.isValid).toBe(false)
    expect(result.user).toBe('')
  })

  it('returns isValid: false for non-Bearer schemes', async () => {
    const result = await validateApiKey(makeRequest('Basic dXNlcjpwYXNz'))
    expect(result.isValid).toBe(false)
  })

  it('does not call TypeDB when header is absent', async () => {
    vi.mocked(readParsed).mockClear()
    await validateApiKey(makeRequest())
    expect(readParsed).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: Valid key — TypeDB lookup + PBKDF2 verify
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: valid key — lookup and verification', () => {
  beforeEach(() => {
    invalidateKeyCache(VALID_ROW.id) // evict by keyId (new API)
    vi.mocked(readParsed).mockResolvedValue([VALID_ROW])
    vi.mocked(verifyKey).mockResolvedValue(false) // default reject
  })

  it('returns isValid: true when key matches a row', async () => {
    vi.mocked(verifyKey).mockResolvedValueOnce(true)
    const result = await validateApiKey(makeRequest(`Bearer ${VALID_KEY}`))
    expect(result.isValid).toBe(true)
    expect(result.user).toBe('alice')
    expect(result.keyId).toBe('key-test-001')
  })

  it('returns parsed permissions array', async () => {
    vi.mocked(verifyKey).mockResolvedValueOnce(true)
    const result = await validateApiKey(makeRequest(`Bearer ${VALID_KEY}`))
    expect(result.permissions).toEqual(['read', 'write'])
  })

  it('returns isValid: false when no rows match', async () => {
    vi.mocked(readParsed).mockResolvedValue([])
    const result = await validateApiKey(makeRequest(`Bearer ${VALID_KEY}`))
    expect(result.isValid).toBe(false)
  })

  it('returns isValid: false when verifyKey returns false for all rows', async () => {
    vi.mocked(verifyKey).mockResolvedValue(false)
    const result = await validateApiKey(makeRequest(`Bearer ${VALID_KEY}`))
    expect(result.isValid).toBe(false)
  })

  it('handles TypeDB read failure gracefully', async () => {
    invalidateKeyCache(VALID_ROW.id) // evict by keyId (new API)
    vi.mocked(readParsed).mockRejectedValue(new Error('TypeDB timeout'))
    const result = await validateApiKey(makeRequest(`Bearer ${VALID_KEY}`))
    expect(result.isValid).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: Cache — O(1) on repeat, invalidation works
//
// First call: TypeDB hit (slow path). Subsequent calls within TTL: no TypeDB.
// invalidateKeyCache() removes the entry so next call re-verifies.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: in-process cache — accuracy and speed', () => {
  const CACHED_KEY = 'api_cache_test_AAAAAAAAAAAAAAAAAAAAA'

  beforeEach(() => {
    invalidateKeyCache('key-cache-001') // evict by keyId (new API)
    vi.mocked(readParsed).mockResolvedValue([{ ...VALID_ROW, id: 'key-cache-001' }])
    vi.mocked(verifyKey).mockResolvedValue(true)
  })

  it('calls TypeDB on first request (cold)', async () => {
    vi.mocked(readParsed).mockClear()
    await validateApiKey(makeRequest(`Bearer ${CACHED_KEY}`))
    expect(readParsed).toHaveBeenCalledTimes(1)
  })

  it('does NOT call TypeDB on second request (cache hit)', async () => {
    // Warm the cache
    await validateApiKey(makeRequest(`Bearer ${CACHED_KEY}`))
    vi.mocked(readParsed).mockClear()
    // Second call — should hit cache
    const result = await validateApiKey(makeRequest(`Bearer ${CACHED_KEY}`))
    expect(readParsed).not.toHaveBeenCalled()
    expect(result.isValid).toBe(true)
    expect(result.user).toBe('alice')
  })

  it('re-verifies after invalidateKeyCache()', async () => {
    // Warm cache
    await validateApiKey(makeRequest(`Bearer ${CACHED_KEY}`))
    // Invalidate by keyId (new API)
    invalidateKeyCache('key-cache-001')
    vi.mocked(readParsed).mockClear()
    // Next call must go to TypeDB
    await validateApiKey(makeRequest(`Bearer ${CACHED_KEY}`))
    expect(readParsed).toHaveBeenCalledTimes(1)
  })

  it('cache hit is faster than cold verify', async () => {
    // Warm cache
    await validateApiKey(makeRequest(`Bearer ${CACHED_KEY}`))

    const t0 = performance.now()
    await validateApiKey(makeRequest(`Bearer ${CACHED_KEY}`))
    const cached = performance.now() - t0

    // Cache hit should complete well under 1ms (Map lookup only)
    expect(cached).toBeLessThan(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 4: hasPermission — read/write permission gates
//
// Substrate separates read-only keys (KV consumers, dashboards) from
// write keys (signal senders, mark/warn callers). hasPermission() enforces
// this without a TypeDB call — O(1) on the cached permissions array.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 4: hasPermission — permission enforcement', () => {
  const readOnly = { user: 'alice', permissions: ['read'], keyId: 'k1', isValid: true }
  const readWrite = { user: 'alice', permissions: ['read', 'write'], keyId: 'k2', isValid: true }
  const invalid = { user: '', permissions: [], keyId: '', isValid: false }

  it('read-only key passes read check', () => {
    expect(hasPermission(readOnly, 'read')).toBe(true)
  })

  it('read-only key fails write check', () => {
    expect(hasPermission(readOnly, 'write')).toBe(false)
  })

  it('read,write key passes both checks', () => {
    expect(hasPermission(readWrite, 'read')).toBe(true)
    expect(hasPermission(readWrite, 'write')).toBe(true)
  })

  it('invalid auth context fails all permission checks', () => {
    expect(hasPermission(invalid, 'read')).toBe(false)
    expect(hasPermission(invalid, 'write')).toBe(false)
  })

  it('unknown permission returns false', () => {
    expect(hasPermission(readWrite, 'admin')).toBe(false)
  })
})
