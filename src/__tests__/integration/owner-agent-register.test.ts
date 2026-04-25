/**
 * Contract test for POST /api/agents/register — owner-only agent wallet
 * registration endpoint. Owner-todo Gap 1, task 1.s3.
 *
 * Seven scenarios:
 *   1. owner posts valid registration → 200 with bearer + keyId; agent_wallet INSERT issued
 *   2. non-owner role (chairman) → 403 not-owner; no D1 INSERT
 *   3. unauthenticated → 401; no D1 INSERT
 *   4. invalid uid format → 400; no D1 INSERT
 *   5. duplicate uid → 409 already-registered
 *   6. invalid ivB64 length (not 12 bytes after decode) → 400
 *   7. successful response shape includes uid, address, bearer, keyId, kdfVersion
 *
 * Uses vi.mock (same pattern as owner-bootstrap.test.ts and owner-agent-unlock.test.ts).
 * No real TypeDB, Sui, or D1.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Constants ────────────────────────────────────────────────────────────────

const OWNER_UID = 'human:tony'
const AGENT_UID = 'marketing:scout'
const VALID_ADDRESS = `0x${'a'.repeat(64)}`

// 32-byte seed + 16-byte GCM tag = 48 bytes minimum → encode as base64url
function makeBase64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const VALID_CIPHERTEXT_B64 = makeBase64url(new Uint8Array(48).fill(0xcc))
const VALID_IV_B64 = makeBase64url(new Uint8Array(12).fill(0x11))

// ─── Module mocks (must precede dynamic imports) ──────────────────────────────

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn(),
}))

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

vi.mock('@/lib/typedb', () => ({
  write: vi.fn().mockResolvedValue(undefined),
  readParsed: vi.fn().mockResolvedValue([]),
}))

// ─── Fake D1 builder ─────────────────────────────────────────────────────────

type D1InsertCall = {
  uid: string
  ciphertext: unknown
  iv: unknown
  kdf_version: number
  address: string
  expires_at: number | null
}

function makeFakeD1(existingCount = 0) {
  const inserts: D1InsertCall[] = []
  let callCount = 0

  return {
    prepare: vi.fn((sql: string) => {
      const isCount = /count\(\*\)\s+AS\s+n/i.test(sql)
      const isInsert = /INSERT\s+INTO\s+agent_wallet/i.test(sql)

      return {
        bind: vi.fn((...args: unknown[]) => ({
          first: vi.fn(async <T>() => {
            if (isCount) return { n: existingCount } as T
            return null as T
          }),
          run: vi.fn(async () => {
            if (isInsert) {
              callCount++
              inserts.push({
                uid: args[0] as string,
                ciphertext: args[1],
                iv: args[2],
                kdf_version: args[3] as number,
                address: args[4] as string,
                expires_at: args[5] as number | null,
              })
            }
            return { success: true }
          }),
        })),
        first: vi.fn(async <T>() => {
          if (isCount) return { n: existingCount } as T
          return null as T
        }),
      }
    }),
    _inserts: inserts,
    _insertCount: () => callCount,
  }
}

// ─── Request factory ──────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/agents/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer fake-owner-key' },
    body: JSON.stringify(body),
  })
}

function validBody(): Record<string, unknown> {
  return {
    uid: AGENT_UID,
    address: VALID_ADDRESS,
    ciphertextB64: VALID_CIPHERTEXT_B64,
    ivB64: VALID_IV_B64,
  }
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Scenario 1: valid owner registration → 200 ───────────────────────────────

describe('scenario 1: valid owner registration', () => {
  it('returns 200 with bearer + keyId; D1 INSERT issued with correct columns', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1(0) // no existing row
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: OWNER_UID,
      permissions: ['read', 'write'],
      keyId: 'key-owner-001',
      isValid: true,
      role: 'owner',
    } as any)
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST({ request: makeRequest(validBody()), locals: {} } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.uid).toBe(AGENT_UID)
    expect(body.address).toBe(VALID_ADDRESS)
    expect(typeof body.bearer).toBe('string')
    expect(body.bearer.length).toBeGreaterThan(0)
    expect(typeof body.keyId).toBe('string')
    expect(body.keyId.length).toBeGreaterThan(0)
    expect(body.kdfVersion).toBe(1)

    // D1 INSERT was called
    expect(fakeDb._insertCount()).toBe(1)
    const row = fakeDb._inserts[0]
    expect(row.uid).toBe(AGENT_UID)
    expect(row.address).toBe(VALID_ADDRESS)
    expect(row.kdf_version).toBe(1)
    expect(row.expires_at).toBeNull()
  })
})

// ─── Scenario 2: non-owner (chairman) → 403 ──────────────────────────────────

describe('scenario 2: chairman role → 403 not-owner', () => {
  it('returns 403; no D1 INSERT', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1(0)
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      permissions: ['read'],
      keyId: 'key-chairman-001',
      isValid: true,
      role: 'chairman',
    } as any)
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST({ request: makeRequest(validBody()), locals: {} } as any)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('not-owner')
    expect(fakeDb._insertCount()).toBe(0)
  })
})

// ─── Scenario 3: unauthenticated → 401 ───────────────────────────────────────

describe('scenario 3: unauthenticated → 401', () => {
  it('returns 401; no D1 INSERT', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1(0)
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: '',
      permissions: [],
      keyId: '',
      isValid: false,
    } as any)
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST({ request: makeRequest(validBody()), locals: {} } as any)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('unauthenticated')
    expect(fakeDb._insertCount()).toBe(0)
  })
})

// ─── Scenario 4: invalid uid format → 400 ────────────────────────────────────

describe('scenario 4: invalid uid format → 400', () => {
  it('returns 400 bad-input; no D1 INSERT', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1(0)
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: OWNER_UID,
      permissions: ['read', 'write'],
      keyId: 'key-owner-001',
      isValid: true,
      role: 'owner',
    } as any)
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST({
      request: makeRequest({ ...validBody(), uid: 'invalid uid with spaces' }),
      locals: {},
    } as any)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('bad-input')
    expect(fakeDb._insertCount()).toBe(0)
  })
})

// ─── Scenario 5: duplicate uid → 409 ─────────────────────────────────────────

describe('scenario 5: duplicate uid → 409', () => {
  it('returns 409 already-registered; no INSERT called', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1(1) // existing row present
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: OWNER_UID,
      permissions: ['read', 'write'],
      keyId: 'key-owner-001',
      isValid: true,
      role: 'owner',
    } as any)
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST({ request: makeRequest(validBody()), locals: {} } as any)
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toBe('already-registered')
    expect(body.uid).toBe(AGENT_UID)
    expect(fakeDb._insertCount()).toBe(0)
  })
})

// ─── Scenario 6: invalid ivB64 length → 400 ──────────────────────────────────

describe('scenario 6: ivB64 decodes to wrong length → 400', () => {
  it('returns 400 bad-input for 11-byte iv', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1(0)
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: OWNER_UID,
      permissions: ['read', 'write'],
      keyId: 'key-owner-001',
      isValid: true,
      role: 'owner',
    } as any)
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    // 11 bytes — should fail the === 12 check
    const badIv = makeBase64url(new Uint8Array(11).fill(0xaa))

    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST({
      request: makeRequest({ ...validBody(), ivB64: badIv }),
      locals: {},
    } as any)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('bad-input')
    expect(body.detail).toMatch(/12 bytes/)
    expect(fakeDb._insertCount()).toBe(0)
  })
})

// ─── Scenario 7: response shape ───────────────────────────────────────────────

describe('scenario 7: successful response shape', () => {
  it('includes uid, address, bearer, keyId, kdfVersion and no extra secrets', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    const fakeDb = makeFakeD1(0)
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: OWNER_UID,
      permissions: ['read', 'write'],
      keyId: 'key-owner-001',
      isValid: true,
      role: 'owner',
    } as any)
    vi.mocked(getD1).mockResolvedValue(fakeDb as any)

    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST({ request: makeRequest(validBody()), locals: {} } as any)
    const body = await res.json()

    expect(res.status).toBe(200)

    // Required fields
    expect(body).toHaveProperty('uid', AGENT_UID)
    expect(body).toHaveProperty('address', VALID_ADDRESS)
    expect(body).toHaveProperty('bearer')
    expect(body).toHaveProperty('keyId')
    expect(body).toHaveProperty('kdfVersion', 1)

    // bearer has the api_ prefix shape
    expect((body.bearer as string).startsWith('api_')).toBe(true)

    // ciphertext and iv must NOT be echoed back
    expect(body).not.toHaveProperty('ciphertextB64')
    expect(body).not.toHaveProperty('ivB64')
  })
})
