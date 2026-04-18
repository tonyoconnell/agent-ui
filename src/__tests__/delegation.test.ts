/**
 * Delegation mechanics — Cycle 2
 *
 * Surfaces under test:
 *   GET  /api/me/agents        — agents the caller commands (chairman/ceo)
 *   POST /api/agents/:id/authorize — seed delegation path with strength 0.5
 *   POST /api/mark             — pheromone gate (hasPathRelationship)
 *
 * No network. No real TypeDB. Mocked at vi.mock boundaries.
 *
 * Run: bunx vitest run src/__tests__/delegation.test.ts --no-coverage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock api-auth — control resolveUnitFromSession ────────────────────────────
const mockResolveUnit = vi.fn()
vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: (...args: unknown[]) => mockResolveUnit(...args),
  validateApiKey: vi.fn().mockResolvedValue({ isValid: false, user: '', permissions: [], keyId: '' }),
  getRoleForUser: vi.fn().mockResolvedValue('agent'),
}))

// ── Mock role-check ────────────────────────────────────────────────────────────
const mockRoleCheck = vi.fn()
vi.mock('@/lib/role-check', () => ({
  roleCheck: (...args: unknown[]) => mockRoleCheck(...args),
}))

// ── Mock TypeDB ────────────────────────────────────────────────────────────────
const mockReadParsed = vi.fn()
const mockWrite = vi.fn()
const mockWriteSilent = vi.fn()
vi.mock('@/lib/typedb', () => ({
  readParsed: (...args: unknown[]) => mockReadParsed(...args),
  write: (...args: unknown[]) => mockWrite(...args),
  writeSilent: (...args: unknown[]) => mockWriteSilent(...args),
}))

import { POST as authorizePOST } from '@/pages/api/agents/[id]/authorize'
import { POST as markPOST } from '@/pages/api/mark'
import { GET as meAgentsGET } from '@/pages/api/me/agents'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(method: 'GET' | 'POST', body?: unknown, authHeader?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authHeader) headers.Authorization = authHeader
  return new Request('http://test/api/test', {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function makeContext(params?: Record<string, string>) {
  return { params: params ?? {}, locals: {} }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: GET /api/me/agents — scope by role
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: GET /api/me/agents — scope by role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWrite.mockResolvedValue(undefined)
    mockWriteSilent.mockResolvedValue(undefined)
  })

  it('Test 1: returns 401 when resolveUnitFromSession is invalid', async () => {
    mockResolveUnit.mockResolvedValue({ isValid: false, user: '' })
    const req = makeRequest('GET')
    const res = await meAgentsGET({ request: req, ...makeContext() } as Parameters<typeof meAgentsGET>[0])
    expect(res.status).toBe(401)
    const body = (await res.json()) as any
    expect(body.error).toBe('unauthorized')
  })

  it('Test 2: returns [] when caller has no chairman/ceo memberships', async () => {
    mockResolveUnit.mockResolvedValue({ isValid: true, user: 'human:alice' })
    // membership query returns only member roles (not chairman/ceo)
    mockReadParsed.mockResolvedValue([
      { gn: 'marketing', r: 'agent' },
      { gn: 'sales', r: 'board' },
    ])
    const req = makeRequest('GET')
    const res = await meAgentsGET({ request: req, ...makeContext() } as Parameters<typeof meAgentsGET>[0])
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body).toEqual([])
  })

  it('Test 3: returns agent rows filtered to chairman/ceo groups', async () => {
    mockResolveUnit.mockResolvedValue({ isValid: true, user: 'human:alice' })

    // Call 1: membership rows — alice is chairman of "debby-org"
    // Call 2: co-member rows in "debby-org"
    // Call 3 onwards: wallet+status per agent (best-effort, can return [])
    mockReadParsed
      .mockResolvedValueOnce([
        { gn: 'debby-org', r: 'chairman' },
        { gn: 'marketing', r: 'agent' },
      ])
      .mockResolvedValueOnce([
        { uid: 'debby:concierge', name: 'Concierge', role: 'agent' },
        { uid: 'debby:amara', name: 'Amara', role: 'agent' },
      ])
      .mockResolvedValue([{ wallet: null, status: 'active' }])

    const req = makeRequest('GET')
    const res = await meAgentsGET({ request: req, ...makeContext() } as Parameters<typeof meAgentsGET>[0])
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    // Should have the 2 co-members
    expect(body).toHaveLength(2)
    const uids = body.map((r: { uid: string }) => r.uid)
    expect(uids).toContain('debby:concierge')
    expect(uids).toContain('debby:amara')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: POST /api/agents/:id/authorize — delegation seed
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: POST /api/agents/:id/authorize — delegation seed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteSilent.mockResolvedValue(undefined)
  })

  it('Test 4: returns 401 if resolveUnitFromSession is invalid', async () => {
    mockResolveUnit.mockResolvedValue({ isValid: false, user: '' })
    const req = makeRequest('POST', {})
    const res = await authorizePOST({ request: req, ...makeContext({ id: 'debby:concierge' }) } as Parameters<
      typeof authorizePOST
    >[0])
    expect(res.status).toBe(401)
  })

  it('Test 5: returns 404 if target agent does not exist', async () => {
    mockResolveUnit.mockResolvedValue({ isValid: true, user: 'human:alice' })
    // Agent existence check returns empty
    mockReadParsed.mockResolvedValue([])
    const req = makeRequest('POST', {})
    const res = await authorizePOST({ request: req, ...makeContext({ id: 'ghost:agent' }) } as Parameters<
      typeof authorizePOST
    >[0])
    expect(res.status).toBe(404)
    const body = (await res.json()) as any
    expect(body.error).toContain('not found')
  })

  it('Test 6: returns 200 and writes path with strength 0.5 when valid', async () => {
    mockResolveUnit.mockResolvedValue({ isValid: true, user: 'human:alice' })
    // Agent exists
    mockReadParsed.mockResolvedValue([{ a: 'entity' }])
    // First write: increment existing path (throws to trigger insert path)
    mockWrite.mockRejectedValueOnce(new Error('no path yet'))
    // Second write: insert fresh path succeeds
    mockWrite.mockResolvedValueOnce(undefined)

    const req = makeRequest('POST', {})
    const res = await authorizePOST({ request: req, ...makeContext({ id: 'debby:concierge' }) } as Parameters<
      typeof authorizePOST
    >[0])
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.from).toBe('human:alice')
    expect(body.to).toBe('debby:concierge')
    expect(body.strength).toBe(0.5)
    // write was called twice (try increment, then insert fresh)
    expect(mockWrite).toHaveBeenCalledTimes(2)
  })

  it('Test 7: accepts optional scope parameter and passes it through', async () => {
    mockResolveUnit.mockResolvedValue({ isValid: true, user: 'human:alice' })
    mockReadParsed.mockResolvedValue([{ a: 'entity' }])
    // First write succeeds (path already exists, strength incremented)
    mockWrite.mockResolvedValue(undefined)

    const req = makeRequest('POST', { scope: 'group', strength: 1.0 })
    const res = await authorizePOST({ request: req, ...makeContext({ id: 'debby:concierge' }) } as Parameters<
      typeof authorizePOST
    >[0])
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.scope).toBe('group')
    expect(body.strength).toBe(1.0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: POST /api/mark — pheromone gate
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: POST /api/mark — pheromone gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWrite.mockResolvedValue(undefined)
  })

  it('Test 8: operator role + empty hasPathRelationship → 403', async () => {
    const { validateApiKey, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(validateApiKey).mockResolvedValue({
      isValid: true,
      user: 'human:alice',
      permissions: ['read', 'write'],
      keyId: 'key-001',
    })
    vi.mocked(getRoleForUser).mockResolvedValue('operator')
    mockRoleCheck.mockReturnValue(true)
    // hasPathRelationship check returns empty → no pheromone → 403
    mockReadParsed.mockResolvedValue([])

    const req = makeRequest('POST', { from: 'unit:a', to: 'unit:b', strength: 1 }, 'Bearer api_test_validkey')
    const res = await markPOST({ request: req, ...makeContext() } as Parameters<typeof markPOST>[0])
    expect(res.status).toBe(403)
    const body = (await res.json()) as any
    expect(body.error).toContain('forbidden')
  })

  it('Test 9: operator role + hasPathRelationship returns row → 200', async () => {
    const { validateApiKey, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(validateApiKey).mockResolvedValue({
      isValid: true,
      user: 'human:alice',
      permissions: ['read', 'write'],
      keyId: 'key-001',
    })
    vi.mocked(getRoleForUser).mockResolvedValue('operator')
    mockRoleCheck.mockReturnValue(true)
    // hasPathRelationship check returns a matching unit row → caller participates
    mockReadParsed.mockResolvedValue([{ u: 'human:alice' }])

    const req = makeRequest('POST', { from: 'unit:a', to: 'unit:b', strength: 1 }, 'Bearer api_test_validkey')
    const res = await markPOST({ request: req, ...makeContext() } as Parameters<typeof markPOST>[0])
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
  })
})
