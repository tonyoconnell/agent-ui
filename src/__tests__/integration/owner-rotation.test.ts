/**
 * Owner-key rotation integration test (owner-todo Gap 4 §4.t1).
 *
 * Covers:
 *   - POST /api/auth/owner-key-versions registers a new version (owner-only)
 *   - non-owner role → 403
 *   - GET lists active versions (excludes expired)
 *   - DELETE force-revokes (sets expires_at = unixepoch())
 *   - duplicate keyHash → 409
 *   - bad-input validation (missing role/group, invalid version)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface RecordedInsert {
  sql: string
  args: unknown[]
}

function makeFakeD1(initialRows: Array<Record<string, unknown>> = []) {
  const inserts: RecordedInsert[] = []
  const rows = [...initialRows]
  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => ({
        run: vi.fn(async () => {
          inserts.push({ sql, args })
          if (/INSERT INTO owner_key/i.test(sql)) {
            const keyHash = args[0] as string
            if (rows.some((r) => r.key_hash === keyHash)) {
              throw new Error('UNIQUE constraint failed: owner_key.key_hash')
            }
            rows.push({
              key_hash: keyHash,
              address: args[1],
              version: args[2],
              role: args[3],
              group_id: args[4],
              expires_at: args[5],
              issued_at: Math.floor(Date.now() / 1000),
            })
          }
          if (/UPDATE owner_key SET expires_at/i.test(sql)) {
            const newExpiry = args[0] as number
            const targetHash = args[1] as string
            const target = rows.find((r) => r.key_hash === targetHash)
            if (target) target.expires_at = newExpiry
          }
          return { success: true }
        }),
        // The endpoint chains .bind(...).all() for the GET listing.
        all: vi.fn(async () => {
          if (/SELECT.*FROM owner_key.*expires_at IS NULL OR expires_at >/is.test(sql)) {
            const now = Math.floor(Date.now() / 1000)
            return {
              results: rows.filter((r) => r.expires_at == null || (r.expires_at as number) > now),
            }
          }
          return { results: [] }
        }),
      })),
      first: vi.fn(async () => {
        if (/SELECT count\(\*\)\s+AS\s+n FROM owner_key/i.test(sql)) {
          return { n: rows.length }
        }
        return null
      }),
      all: vi.fn(async () => {
        if (/SELECT.*FROM owner_key.*expires_at IS NULL OR expires_at >/is.test(sql)) {
          const now = Math.floor(Date.now() / 1000)
          return {
            results: rows.filter((r) => r.expires_at == null || (r.expires_at as number) > now),
          }
        }
        return { results: [] }
      }),
    })),
  }
  return { db, inserts, rows }
}

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn(),
}))

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

async function callRoute(method: 'POST' | 'GET' | 'DELETE', body?: unknown) {
  const { POST, GET, DELETE } = await import('@/pages/api/auth/owner-key-versions')
  const handler = method === 'POST' ? POST : method === 'GET' ? GET : DELETE
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body !== undefined) init.body = JSON.stringify(body)
  const req = new Request('http://localhost/api/auth/owner-key-versions', init)
  return handler({ request: req, locals: {} } as Parameters<typeof handler>[0])
}

describe('POST /api/auth/owner-key-versions (4.s2)', () => {
  it('owner registers a new version → 200; D1 INSERT issued', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db, rows } = makeFakeD1()
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      role: 'owner',
      isValid: true,
      permissions: [],
      keyId: 'key-1',
    } as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callRoute('POST', {
      keyHash: 'abc123',
      role: 'owner',
      group: 'g:owns:human:tony',
      version: 2,
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.ok).toBe(true)
    expect(body.version).toBe(2)
    expect(rows).toHaveLength(1)
    expect(rows[0].version).toBe(2)
  })

  it('non-owner role → 403', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:other',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'key-2',
    } as never)

    const res = await callRoute('POST', { keyHash: 'x', role: 'owner', group: 'g', version: 1 })
    expect(res.status).toBe(403)
  })

  it('unauthenticated → 401', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: '',
      role: undefined,
      isValid: false,
      permissions: [],
      keyId: '',
    } as never)

    const res = await callRoute('POST', { keyHash: 'x', role: 'owner', group: 'g', version: 1 })
    expect(res.status).toBe(401)
  })

  it('missing keyHash → 400', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      role: 'owner',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)

    const res = await callRoute('POST', { role: 'owner', group: 'g', version: 1 })
    expect(res.status).toBe(400)
  })

  it('invalid version (zero) → 400', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      role: 'owner',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)

    const res = await callRoute('POST', { keyHash: 'x', role: 'owner', group: 'g', version: 0 })
    expect(res.status).toBe(400)
  })

  it('duplicate keyHash → 409', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1([{ key_hash: 'dup', version: 1, expires_at: null }])
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      role: 'owner',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callRoute('POST', { keyHash: 'dup', role: 'owner', group: 'g', version: 2 })
    expect(res.status).toBe(409)
  })
})

describe('GET /api/auth/owner-key-versions', () => {
  it('owner lists active versions', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const past = Math.floor(Date.now() / 1000) - 100
    const future = Math.floor(Date.now() / 1000) + 100
    const { db } = makeFakeD1([
      { key_hash: 'active', version: 2, expires_at: future, issued_at: 0 },
      { key_hash: 'expired', version: 1, expires_at: past, issued_at: 0 },
      { key_hash: 'no-expiry', version: 3, expires_at: null, issued_at: 0 },
    ])
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      role: 'owner',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callRoute('GET')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { versions: Array<{ key_hash: string }> }
    const hashes = body.versions.map((v) => v.key_hash).sort()
    expect(hashes).toEqual(['active', 'no-expiry'])
  })
})

describe('DELETE /api/auth/owner-key-versions (force-revoke)', () => {
  it('owner force-revokes by keyHash; expires_at set to now', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db, rows } = makeFakeD1([{ key_hash: 'revoke-me', version: 2, expires_at: null, issued_at: 0 }])
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      role: 'owner',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callRoute('DELETE', { keyHash: 'revoke-me' })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; expiresAt: number }
    expect(body.ok).toBe(true)
    expect(rows[0].expires_at).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))
  })

  it('non-owner → 403', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:other',
      role: 'agent',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    const res = await callRoute('DELETE', { keyHash: 'x' })
    expect(res.status).toBe(403)
  })
})
