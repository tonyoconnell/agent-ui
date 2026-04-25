/**
 * Contract test for POST /api/auth/passkey/assert — owner-tier first-mint endpoint.
 *
 * Three scenarios:
 *  1. Wrong address rejected at first-mint → 403 first-mint-address-mismatch
 *  2. Right address accepted at first-mint → 200 with ownerKey, pinDigest, firstMint:true
 *  3. Post-first-mint: right address returns 200 (firstMint:false); wrong returns 403
 *
 * No real TypeDB, Sui, or D1 — this is an endpoint contract test, not a live
 * integration test. Uses vi.mock per the same pattern as cap.test.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── address constants ────────────────────────────────────────────────────────

const OWNER_ADDR = '0xabc'
const WRONG_ADDR = '0xdead'

// ─── module mocks (must precede dynamic import of the endpoint) ───────────────

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn(),
  getRoleForUser: vi.fn().mockResolvedValue('owner'),
}))

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
}))

vi.mock('@/lib/owner-mint', () => ({
  lockOnChainOwner: vi.fn(),
}))

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

// generateApiKey and hashKey are lightweight pure functions — use real impl to
// avoid over-mocking; only the infra boundaries are mocked above.

// ─── D1 shim ─────────────────────────────────────────────────────────────────

type D1Row = { key_hash: string; address: string; pin_object?: string; pin_digest?: string }

function makeFakeD1(initialRows: D1Row[] = []) {
  const rows = [...initialRows]
  return {
    prepare: vi.fn((sql: string) => ({
      first: vi.fn(async <T>() => {
        if (/count\(\*\)\s+AS\s+n/i.test(sql)) return { n: rows.length } as T
        if (/SELECT\s+address\s+FROM\s+owner_key/i.test(sql)) return (rows[0] ?? null) as T
        return null as T
      }),
      bind: vi.fn((...args: unknown[]) => ({
        run: vi.fn(async () => {
          if (/INSERT\s+INTO\s+owner_key/i.test(sql)) {
            rows.push({
              key_hash: args[0] as string,
              address: args[1] as string,
              pin_object: args[2] as string,
              pin_digest: args[3] as string,
            })
          }
          return { success: true }
        }),
      })),
    })),
    _rows: rows, // expose for assertions
  }
}

// ─── request factory ─────────────────────────────────────────────────────────

function makeRequest(): Request {
  return new Request('http://localhost/api/auth/passkey/assert', { method: 'POST' })
}

// ─── setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  // Set the expected-address env gate before each test
  ;(import.meta.env as Record<string, unknown>).OWNER_EXPECTED_ADDRESS = OWNER_ADDR
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── scenario 1: wrong address rejected at first-mint ────────────────────────

describe('scenario 1: wrong address rejected at first-mint', () => {
  it('returns 403 first-mint-address-mismatch; D1 row count stays 0; lockOnChainOwner not called', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { readParsed } = await import('@/lib/typedb')
    const { lockOnChainOwner } = await import('@/lib/owner-mint')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1([]) // empty — first-mint
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      permissions: [],
      keyId: '',
      isValid: true,
    } as any)
    vi.mocked(readParsed).mockResolvedValue([{ w: WRONG_ADDR }])
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)
    vi.mocked(lockOnChainOwner).mockResolvedValue({
      digest: '0xdig',
      pinObject: '0xpin',
      ownerAddress: WRONG_ADDR,
    } as any)

    const { POST } = await import('@/pages/api/auth/passkey/assert')
    const res = await POST({ request: makeRequest() } as any)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('first-mint-address-mismatch')
    expect(body.ok).toBe(false)
    // D1 row was never inserted
    expect(fakeDb._rows).toHaveLength(0)
    // Move call must not have been attempted
    expect(lockOnChainOwner).not.toHaveBeenCalled()
  })
})

// ─── scenario 2: right address accepted at first-mint ────────────────────────

describe('scenario 2: right address accepted at first-mint', () => {
  it('returns 200 with ownerKey, pinDigest, firstMint:true; D1 row count becomes 1; lockOnChainOwner called once', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { readParsed } = await import('@/lib/typedb')
    const { lockOnChainOwner } = await import('@/lib/owner-mint')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1([]) // empty — first-mint
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      permissions: [],
      keyId: '',
      isValid: true,
    } as any)
    vi.mocked(readParsed).mockResolvedValue([{ w: OWNER_ADDR }])
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)
    vi.mocked(lockOnChainOwner).mockResolvedValue({
      digest: '0xdig',
      pinObject: '0xpin',
      ownerAddress: OWNER_ADDR,
    } as any)

    const { POST } = await import('@/pages/api/auth/passkey/assert')
    const res = await POST({ request: makeRequest() } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.role).toBe('owner')
    expect(body.firstMint).toBe(true)
    expect(typeof body.ownerKey).toBe('string')
    expect(body.ownerKey.length).toBeGreaterThan(0)
    expect(typeof body.pinDigest).toBe('string')
    expect(body.address).toBe(OWNER_ADDR)

    // D1 insert happened
    expect(fakeDb._rows).toHaveLength(1)
    expect(fakeDb._rows[0].address).toBe(OWNER_ADDR)

    // lockOnChainOwner called exactly once with the owner address
    expect(lockOnChainOwner).toHaveBeenCalledTimes(1)
    expect(lockOnChainOwner).toHaveBeenCalledWith(OWNER_ADDR)
  })
})

// ─── scenario 3: post-first-mint address checks ──────────────────────────────

describe('scenario 3: post-first-mint address matching', () => {
  it('matching address returns 200 with firstMint:false', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { readParsed } = await import('@/lib/typedb')
    const { getD1 } = await import('@/lib/cf-env')

    const existingRow: D1Row = {
      key_hash: 'somehash',
      address: OWNER_ADDR,
      pin_object: '0xpin',
      pin_digest: '0xdig',
    }
    const fakeDb = makeFakeD1([existingRow]) // already has one row — post-first-mint
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      permissions: [],
      keyId: '',
      isValid: true,
    } as any)
    vi.mocked(readParsed).mockResolvedValue([{ w: OWNER_ADDR }])
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/auth/passkey/assert')
    const res = await POST({ request: makeRequest() } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.firstMint).toBe(false)
    expect(body.address).toBe(OWNER_ADDR)
    // ownerKey is NOT returned on subsequent calls
    expect(body.ownerKey).toBeUndefined()
  })

  it('mismatched address returns 403 address-not-owner', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { readParsed } = await import('@/lib/typedb')
    const { getD1 } = await import('@/lib/cf-env')

    const existingRow: D1Row = {
      key_hash: 'somehash',
      address: OWNER_ADDR, // registered owner is OWNER_ADDR
      pin_object: '0xpin',
      pin_digest: '0xdig',
    }
    const fakeDb = makeFakeD1([existingRow])
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:other',
      permissions: [],
      keyId: '',
      isValid: true,
    } as any)
    // caller has WRONG_ADDR wallet
    vi.mocked(readParsed).mockResolvedValue([{ w: WRONG_ADDR }])
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/auth/passkey/assert')
    const res = await POST({ request: makeRequest() } as any)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('address-not-owner')
    expect(body.ok).toBe(false)
  })
})
