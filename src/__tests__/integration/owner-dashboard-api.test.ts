/**
 * Integration tests for /api/owner/agents and /api/owner/audit
 *
 * Covers:
 *   1. GET /api/owner/agents — owner → 200 with agents array
 *   2. GET /api/owner/agents — non-owner → 403
 *   3. GET /api/owner/agents — unauthenticated → 401
 *   4. GET /api/owner/audit?limit=10 — owner → 200 with rows
 *   5. GET /api/owner/audit — invalid limit (>200, negative) → clamps or 400
 *   6. POST /api/owner/agents — 405 method not allowed
 *   7. POST /api/owner/audit — 405 method not allowed
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContext } from '@/lib/api-auth'

// ---------------------------------------------------------------------------
// Mock declarations — must come before deferred imports
// ---------------------------------------------------------------------------

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn(),
}))

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Deferred imports (after mocks)
// ---------------------------------------------------------------------------

import * as apiAuth from '@/lib/api-auth'
import * as cfEnv from '@/lib/cf-env'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(method = 'GET', url = 'http://localhost/api/owner/agents'): Request {
  return new Request(url, { method })
}

const OWNER_CTX: AuthContext = {
  isValid: true,
  user: 'human:tony',
  keyId: 'key-owner',
  permissions: ['read', 'write'],
  role: 'owner',
  scopeGroups: [],
  scopeSkills: [],
}

const CHAIRMAN_CTX: AuthContext = {
  isValid: true,
  user: 'human:alice',
  keyId: 'key-chairman',
  permissions: ['read'],
  role: 'chairman',
  scopeGroups: [],
  scopeSkills: [],
}

const ANON_CTX: AuthContext = {
  isValid: false,
  user: '',
  keyId: '',
  permissions: [],
}

function mockD1(rows: unknown[]) {
  const allResult = { results: rows, success: true }
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue(allResult),
  }
  vi.mocked(cfEnv.getD1).mockResolvedValue({ prepare: vi.fn().mockReturnValue(stmt) } as unknown as D1Database)
  return stmt
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('/api/owner/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1. owner → 200 with agents array', async () => {
    vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue(OWNER_CTX)
    const fakeAgents = [
      { uid: 'agent:alpha', address: '0xabc', kdf_version: 1, created_at: '2026-01-01T00:00:00Z', expires_at: null },
    ]
    mockD1(fakeAgents)

    const { GET } = await import('@/pages/api/owner/agents')
    const res = await GET({ request: makeRequest(), locals: {} } as any)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { agents: unknown[] }
    expect(Array.isArray(body.agents)).toBe(true)
    expect(body.agents).toHaveLength(1)
  })

  it('2. non-owner (chairman) → 403', async () => {
    vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue(CHAIRMAN_CTX)

    const { GET } = await import('@/pages/api/owner/agents')
    const res = await GET({ request: makeRequest(), locals: {} } as any)

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('forbidden')
  })

  it('3. unauthenticated → 401', async () => {
    vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue(ANON_CTX)

    const { GET } = await import('@/pages/api/owner/agents')
    const res = await GET({ request: makeRequest(), locals: {} } as any)

    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('unauthenticated')
  })

  it('6. POST → 405', async () => {
    const { POST } = await import('@/pages/api/owner/agents')
    const res = await POST({ request: makeRequest('POST'), locals: {} } as any)
    expect(res.status).toBe(405)
  })
})

describe('/api/owner/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('4. owner with ?limit=10 → 200 with rows array', async () => {
    vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue(OWNER_CTX)
    const fakeRows = [
      {
        ts: 1714000000,
        action: 'bypass',
        sender: 'human:tony',
        receiver: 'agent:alpha',
        gate: 'owner-tier',
        decision: 'allow-audit',
      },
    ]
    mockD1(fakeRows)

    const { GET } = await import('@/pages/api/owner/audit')
    const req = new Request('http://localhost/api/owner/audit?limit=10', { method: 'GET' })
    const res = await GET({ request: req, locals: {} } as any)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { rows: unknown[] }
    expect(Array.isArray(body.rows)).toBe(true)
    expect(body.rows).toHaveLength(1)
  })

  it('5a. limit > 200 → clamps to 200 (still 200 OK)', async () => {
    vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue(OWNER_CTX)
    const stmt = mockD1([])

    const { GET } = await import('@/pages/api/owner/audit')
    const req = new Request('http://localhost/api/owner/audit?limit=999', { method: 'GET' })
    const res = await GET({ request: req, locals: {} } as any)

    expect(res.status).toBe(200)
    // The bind call should use 200, not 999
    expect(stmt.bind).toHaveBeenCalledWith(200)
  })

  it('5b. negative limit → 400', async () => {
    vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue(OWNER_CTX)

    const { GET } = await import('@/pages/api/owner/audit')
    const req = new Request('http://localhost/api/owner/audit?limit=-5', { method: 'GET' })
    const res = await GET({ request: req, locals: {} } as any)

    expect(res.status).toBe(400)
  })

  it('7. POST → 405', async () => {
    const { POST } = await import('@/pages/api/owner/audit')
    const req = new Request('http://localhost/api/owner/audit', { method: 'POST' })
    const res = await POST({ request: req, locals: {} } as any)
    expect(res.status).toBe(405)
  })
})
