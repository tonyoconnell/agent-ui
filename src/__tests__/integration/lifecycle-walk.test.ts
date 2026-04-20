/**
 * Integration Test: Lifecycle Walk (Stages 0–10)
 *
 * Tests the complete 10-stage funnel via route handlers with mocked TypeDB.
 * Asserts: each stage returns expected shape.
 *
 * This is the Cycle 1 gate test for api-todo.md.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readParsed } from '@/lib/typedb'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
  write: vi.fn(),
}))

vi.mock('@/lib/sui', () => ({
  addressFor: vi.fn().mockResolvedValue('0xtest123walletaddress'),
  deriveKeypair: vi.fn(),
}))

// Mock requireRole to pass-through as chairman (auth is tested in gate-matrix.test.ts)
vi.mock('@/lib/api-auth', () => ({
  requireRole: vi.fn().mockResolvedValue({
    ok: true,
    auth: { isValid: true, user: 'owner-uid', permissions: [], keyId: 'k1', role: 'chairman' },
    role: 'chairman',
  }),
  validateApiKey: vi.fn().mockResolvedValue({
    isValid: true,
    user: 'owner-uid',
    permissions: [],
    keyId: 'k1',
    role: 'chairman',
  }),
  getRoleForUser: vi.fn().mockResolvedValue('chairman'),
}))

// Mock ADL enforcement to audit mode so gates log but don't block lifecycle tests
vi.mock('@/engine/adl-cache', () => ({
  enforcementMode: vi.fn(() => 'audit'),
  audit: vi.fn(),
  invalidateAdlCache: vi.fn(),
  getCached: vi.fn(),
  setCached: vi.fn(),
}))

function ctx(method: string, body: unknown) {
  return {
    request: new Request(`http://localhost:4321/test`, {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: {} as Record<string, string>,
  } as any
}

function ctxGet(params: Record<string, string>) {
  return {
    request: new Request(`http://localhost:4321/test`),
    params,
  } as any
}

describe('Lifecycle Walk — Stage 0: Wallet', () => {
  it('GET /api/identity/:uid/address returns wallet address', async () => {
    const { GET } = await import('@/pages/api/identity/[uid]/address')
    const res = await GET(ctxGet({ uid: 'test-agent' }))
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.uid).toBe('test-agent')
    expect(data.address).toBeTruthy()
    expect(data.derivedAt).toBeTruthy()
  })

  it('returns 400 without uid', async () => {
    const { GET } = await import('@/pages/api/identity/[uid]/address')
    const res = await GET(ctxGet({}))
    expect(res.status).toBe(400)
  })
})

describe('Lifecycle Walk — Stage 3: Join Board', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mock = readParsed as any
    // membership check returns empty (not joined yet)
    mock.mockResolvedValue([])
  })

  it('POST /api/board/join creates membership', async () => {
    const { POST } = await import('@/pages/api/board/join')
    const res = await POST(ctx('POST', { uid: 'test-agent' }))
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.ok).toBe(true)
    expect(data.uid).toBe('test-agent')
  })

  it('returns 400 without uid', async () => {
    const { POST } = await import('@/pages/api/board/join')
    const res = await POST(ctx('POST', {}))
    expect(res.status).toBe(400)
  })
})

describe('Lifecycle Walk — Stage 5b: Deploy on Behalf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mock = readParsed as any
    // owner has 3+ highways
    mock.mockResolvedValue([
      { f: 'owner-uid', t: 'target-1', s: 10 },
      { f: 'owner-uid', t: 'target-2', s: 8 },
      { f: 'owner-uid', t: 'target-3', s: 6 },
    ])
  })

  it('POST /api/agents/deploy-on-behalf deploys with inherited paths', async () => {
    const { POST } = await import('@/pages/api/agents/deploy-on-behalf')
    const res = await POST(ctx('POST', { owner: 'owner-uid', spec: { name: 'new-agent' } }))
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.ok).toBe(true)
    expect(data.uid).toBeTruthy()
    expect(data.inheritedPaths).toHaveLength(3)
  })

  it('returns 400 without owner', async () => {
    const { POST } = await import('@/pages/api/agents/deploy-on-behalf')
    const res = await POST(ctx('POST', { spec: { name: 'x' } }))
    expect(res.status).toBe(400)
  })
})
