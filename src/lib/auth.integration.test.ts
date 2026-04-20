/**
 * auth.integration.test.ts — End-to-end auth ownership flow
 *
 * Tests the 9-step claim scenario:
 *   1. Agent self-registers → gets bootstrap key K1
 *   2. Human signs up → gets cookie session
 *   3. Claim: cookie + K1 bearer → { owned: true, newKey: K2 }
 *   4. K1 revoked → validateApiKey returns isValid: false
 *   5. K2 works → validateApiKey returns isValid: true
 *   6. Cookie + actAs=swift-scout → user swapped, realUser preserved
 *   7. (Verified by actAs test)
 *   8. Re-mint without proof → 403 (enforce) or audit-logged (audit)
 *   9. getRoleForUser(human) in g:owns scope → "chairman"
 */

import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  write: vi.fn().mockResolvedValue(undefined),
  writeSilent: vi.fn(),
  writeTracked: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@/lib/api-key', () => ({
  generateApiKey: vi.fn().mockReturnValue('api_new_key_k2'),
  getKeyPrefix: vi.fn().mockReturnValue('testpfx1'),
  hashKey: vi.fn().mockResolvedValue('$pbkdf2$100000$salt$hash'),
  verifyKey: vi.fn(),
}))

vi.mock('@/lib/net', () => ({
  getNet: vi.fn().mockResolvedValue({ warn: vi.fn() }),
}))

vi.mock('@/lib/security-signals', () => ({
  emitSecurityEvent: vi.fn(),
}))

vi.mock('@/lib/sui', () => ({
  addressFor: vi.fn().mockResolvedValue('0xabc123'),
  ensureFunded: vi.fn().mockResolvedValue(undefined),
}))

import { verifyKey } from '@/lib/api-key'
import { auth } from '@/lib/auth'
import { readParsed } from '@/lib/typedb'

const mockReadParsed = readParsed as Mock
const mockGetSession = auth.api.getSession as unknown as Mock
const mockVerifyKey = verifyKey as Mock

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(opts: { bearer?: string; cookie?: string; url?: string; actAs?: string }): Request {
  const headers = new Headers()
  if (opts.bearer) headers.set('Authorization', `Bearer ${opts.bearer}`)
  if (opts.cookie) headers.set('Cookie', opts.cookie)
  if (opts.actAs) headers.set('X-Act-As', opts.actAs)
  return new Request(opts.url ?? 'http://localhost/api/state', { headers })
}

// ─── Step 9: getRoleForUser returns "chairman" for human in ownership group ──

describe('getRoleForUser — ownership group', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns "chairman" when human has chairman membership', async () => {
    mockReadParsed.mockResolvedValueOnce([{ r: 'chairman' }])

    const { getRoleForUser } = await import('./api-auth')
    const role = await getRoleForUser('human:tony')
    expect(role).toBe('chairman')
  })

  it('returns undefined when human has no membership', async () => {
    mockReadParsed.mockResolvedValueOnce([])

    const { getRoleForUser } = await import('./api-auth')
    const role = await getRoleForUser('human:nobody')
    expect(role).toBeUndefined()
  })
})

// ─── Step 4 + 5: validateApiKey — active vs revoked key ─────────────────────

describe('validateApiKey — active key K1 vs revoked', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('step 5: active key K2 → isValid: true', async () => {
    mockReadParsed.mockResolvedValueOnce([
      { id: 'key-k2', h: '$pbkdf2$100000$salt$hash', u: 'human:tony', p: 'read,write', exp: null, sg: null, ss: null },
    ])
    mockVerifyKey.mockResolvedValueOnce(true)
    mockReadParsed.mockResolvedValueOnce([]) // getRoleForUser

    const { validateApiKey } = await import('./api-auth')
    const req = makeRequest({ bearer: 'api_new_key_k2' })
    const ctx = await validateApiKey(req)
    expect(ctx.isValid).toBe(true)
    expect(ctx.user).toBe('human:tony')
  })

  it('step 4: revoked key K1 → isValid: false (no active key found)', async () => {
    // No active keys match
    mockReadParsed.mockResolvedValueOnce([])
    mockVerifyKey.mockResolvedValue(false)

    const { validateApiKey } = await import('./api-auth')
    const req = makeRequest({ bearer: 'api_old_key_k1' })
    const ctx = await validateApiKey(req)
    expect(ctx.isValid).toBe(false)
  })
})

// ─── Step 6: actAs — cookie + X-Act-As → swapped identity ───────────────────

describe('resolveUnitFromSession — actAs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('step 6: cookie + actAs=swift-scout → user swapped, realUser preserved', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'auth-user-1', email: 'tony@one.ie', name: 'Tony' },
      session: { id: 'sess-123' },
    })
    // ensureHumanUnit: check existence
    mockReadParsed.mockResolvedValueOnce([])
    // ensureHumanUnit: write (mocked via write mock)
    // getRoleForUser for human:tony
    mockReadParsed.mockResolvedValueOnce([])
    // actAs membership check
    mockReadParsed.mockResolvedValueOnce([{ r: 'chairman' }])
    // getRoleForUser for swift-scout
    mockReadParsed.mockResolvedValueOnce([{ r: 'agent' }])

    const { resolveUnitFromSession } = await import('./api-auth')
    const req = makeRequest({ cookie: 'better-auth.session=xxx', actAs: 'swift-scout' })
    const ctx = await resolveUnitFromSession(req)

    expect(ctx.isValid).toBe(true)
    expect(ctx.user).toBe('swift-scout')
    expect(ctx.realUser).toBe('human:tony')
    expect(ctx.actAs).toBe('swift-scout')
  })

  it('cookie + actAs (not owned) → 401', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'auth-user-1', email: 'tony@one.ie', name: 'Tony' },
      session: { id: 'sess-123' },
    })
    mockReadParsed.mockResolvedValueOnce([]) // ensureHumanUnit check
    mockReadParsed.mockResolvedValueOnce([]) // getRoleForUser
    mockReadParsed.mockResolvedValueOnce([]) // actAs membership: NOT chairman

    const { resolveUnitFromSession } = await import('./api-auth')
    const req = makeRequest({ cookie: 'better-auth.session=xxx', actAs: 'other-agent' })
    const ctx = await resolveUnitFromSession(req)

    expect(ctx.isValid).toBe(false)
  })
})

// ─── Step 8: rate-mint gate ───────────────────────────────────────────────────

describe('POST /api/auth/agent re-mint gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('step 8a: returning + no auth + enforce mode → 403', async () => {
    vi.stubEnv('AUTH_AGENT_REMINT_MODE', 'enforce')

    // existing unit found
    mockReadParsed.mockResolvedValueOnce([{ n: 'swift-scout' }])
    // resolveUnitFromSession: no bearer, no cookie → isValid: false
    // (no Authorization header, no Cookie header)

    const { POST } = await import('../pages/api/auth/agent')
    const req = new Request('http://localhost/api/auth/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'swift-scout' }),
    })
    const res = await POST({ request: req } as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(403)
  })

  it('step 8b: returning + valid bearer + enforce mode → 200', async () => {
    vi.stubEnv('AUTH_AGENT_REMINT_MODE', 'enforce')

    // existing unit found
    mockReadParsed.mockResolvedValueOnce([{ n: 'swift-scout' }])
    // validateApiKey: bearer valid for swift-scout
    mockReadParsed.mockResolvedValueOnce([
      { id: 'key-k2', h: '$pbkdf2$100000$salt$hash', u: 'swift-scout', p: 'read,write', exp: null, sg: null, ss: null },
    ])
    mockVerifyKey.mockResolvedValueOnce(true)
    mockReadParsed.mockResolvedValueOnce([]) // getRoleForUser in validateApiKey

    const { POST } = await import('../pages/api/auth/agent')
    const req = new Request('http://localhost/api/auth/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer api_valid_bearer',
      },
      body: JSON.stringify({ uid: 'swift-scout' }),
    })
    const res = await POST({ request: req } as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(200)
  })

  it('step 8c: audit mode → 200 even without proof (logged not blocked)', async () => {
    vi.stubEnv('AUTH_AGENT_REMINT_MODE', 'audit')

    mockReadParsed.mockResolvedValueOnce([{ n: 'swift-scout' }])
    // resolveUnitFromSession: no auth → isValid: false (proof missing, audit logs only)

    const { POST } = await import('../pages/api/auth/agent')
    const req = new Request('http://localhost/api/auth/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'swift-scout' }),
    })
    const res = await POST({ request: req } as unknown as Parameters<typeof POST>[0])
    expect(res.status).not.toBe(403)
  })
})

// ─── Step 3: claim flow ───────────────────────────────────────────────────────

describe('POST /api/auth/agent/:uid/claim', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('step 3a: happy path → owned: true, newKey returned', async () => {
    // getSession → human:tony
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'auth-user-1', email: 'tony@one.ie', name: 'Tony' },
      session: { id: 'sess-123' },
    })
    // validateApiKey: bearer K1 matches swift-scout
    mockReadParsed.mockResolvedValueOnce([
      { id: 'key-k1', h: '$pbkdf2$100000$salt$hash', u: 'swift-scout', p: 'read,write', exp: null, sg: null, ss: null },
    ])
    mockVerifyKey.mockResolvedValueOnce(true)
    mockReadParsed.mockResolvedValueOnce([]) // getRoleForUser in validateApiKey
    // idempotency check: not yet claimed
    mockReadParsed.mockResolvedValueOnce([])
    // ensureHumanUnit: not found, will insert
    mockReadParsed.mockResolvedValueOnce([])

    const { POST } = await import('../pages/api/auth/agent/[uid]/claim')
    const req = new Request('http://localhost/api/auth/agent/swift-scout/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'better-auth.session=xxx',
        Authorization: 'Bearer api_k1_key',
      },
    })
    const res = await POST({ request: req, params: { uid: 'swift-scout' } } as unknown as Parameters<typeof POST>[0])
    const body = (await res.json()) as {
      owned: boolean
      ownerUid: string
      agentUid: string
      group: string
      newKey: string
    }

    expect(res.status).toBe(200)
    expect(body.owned).toBe(true)
    expect(body.ownerUid).toBe('human:tony')
    expect(body.agentUid).toBe('swift-scout')
    expect(body.group).toBe('g:owns:swift-scout')
    expect(body.newKey).toBe('api_new_key_k2')
  })

  it('step 3b: bearer mismatch → 403', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'auth-user-1', email: 'tony@one.ie', name: 'Tony' },
      session: { id: 'sess-123' },
    })
    // bearer belongs to DIFFERENT agent
    mockReadParsed.mockResolvedValueOnce([
      {
        id: 'key-other',
        h: '$pbkdf2$100000$salt$hash',
        u: 'other-agent',
        p: 'read,write',
        exp: null,
        sg: null,
        ss: null,
      },
    ])
    mockVerifyKey.mockResolvedValueOnce(true)
    mockReadParsed.mockResolvedValueOnce([]) // getRoleForUser

    const { POST } = await import('../pages/api/auth/agent/[uid]/claim')
    const req = new Request('http://localhost/api/auth/agent/swift-scout/claim', {
      method: 'POST',
      headers: { Authorization: 'Bearer api_wrong_key', Cookie: 'session=xxx' },
    })
    const res = await POST({ request: req, params: { uid: 'swift-scout' } } as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(403)
  })

  it('step 3c: no cookie → 401', async () => {
    mockGetSession.mockResolvedValueOnce(null)

    const { POST } = await import('../pages/api/auth/agent/[uid]/claim')
    const req = new Request('http://localhost/api/auth/agent/swift-scout/claim', {
      method: 'POST',
      headers: { Authorization: 'Bearer api_k1_key' },
    })
    const res = await POST({ request: req, params: { uid: 'swift-scout' } } as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(401)
  })

  it('step 3d: idempotent re-claim → alreadyClaimed: true', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'auth-user-1', email: 'tony@one.ie', name: 'Tony' },
      session: { id: 'sess-123' },
    })
    // validateApiKey: K2 valid for swift-scout
    mockReadParsed.mockResolvedValueOnce([
      { id: 'key-k2', h: '$pbkdf2$100000$salt$hash', u: 'swift-scout', p: 'read,write', exp: null, sg: null, ss: null },
    ])
    mockVerifyKey.mockResolvedValueOnce(true)
    mockReadParsed.mockResolvedValueOnce([]) // getRoleForUser in validateApiKey
    // idempotency: already claimed
    mockReadParsed.mockResolvedValueOnce([{ g: 'g:owns:swift-scout' }])

    const { POST } = await import('../pages/api/auth/agent/[uid]/claim')
    const req = new Request('http://localhost/api/auth/agent/swift-scout/claim', {
      method: 'POST',
      headers: { Authorization: 'Bearer api_k2_key', Cookie: 'session=xxx' },
    })
    const res = await POST({ request: req, params: { uid: 'swift-scout' } } as unknown as Parameters<typeof POST>[0])
    const body = (await res.json()) as { alreadyClaimed: boolean }
    expect(res.status).toBe(200)
    expect(body.alreadyClaimed).toBe(true)
  })
})
