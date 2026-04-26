/**
 * Integration tests for /api/auth/owner-pubkeys (Federation V4 §0034).
 *
 * Covers the management endpoint (POST/GET/DELETE) and the well-known
 * discovery endpoint (/.well-known/owner-pubkey.json) D1 + env fallback.
 *
 * No real TypeDB, Sui, or D1 — contract tests using the same D1 shim
 * pattern as owner-rotation.test.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Shared D1 shim ───────────────────────────────────────────────────────────

interface PubkeyRow {
  cred_id: string
  pub_key: string
  alg: string
  registered_at: number
  revoked_at: number | null
}

function makeFakeD1(initialRows: PubkeyRow[] = []) {
  const rows: PubkeyRow[] = [...initialRows]

  const db = {
    prepare: vi.fn((sql: string) => {
      let boundArgs: unknown[] = []

      const stmt = {
        bind: vi.fn((...args: unknown[]) => {
          boundArgs = args
          return stmt
        }),
        run: vi.fn(async () => {
          // INSERT INTO owner_pubkeys
          if (/INSERT INTO owner_pubkeys/i.test(sql)) {
            const credId = boundArgs[0] as string
            if (rows.some((r) => r.cred_id === credId)) {
              throw new Error('UNIQUE constraint failed: owner_pubkeys.cred_id')
            }
            rows.push({
              cred_id: credId,
              pub_key: boundArgs[1] as string,
              alg: boundArgs[2] as string,
              registered_at: Math.floor(Date.now() / 1000),
              revoked_at: null,
            })
            return { success: true }
          }
          // UPDATE owner_pubkeys SET revoked_at
          if (/UPDATE owner_pubkeys SET revoked_at/i.test(sql)) {
            const revokedAt = boundArgs[0] as number
            const credId = boundArgs[1] as string
            const target = rows.find((r) => r.cred_id === credId && r.revoked_at === null)
            if (target) target.revoked_at = revokedAt
            return { success: true }
          }
          return { success: true }
        }),
        first: vi.fn(async <T>(): Promise<T | null> => {
          // SELECT version FROM owner_key (well-known endpoint)
          if (/SELECT version FROM owner_key/i.test(sql)) {
            return { version: 1 } as T
          }
          // SELECT cred_id FROM owner_pubkeys WHERE cred_id = ? (existence check in DELETE)
          if (/SELECT cred_id FROM owner_pubkeys WHERE cred_id/i.test(sql)) {
            const credId = boundArgs[0] as string
            const found = rows.find((r) => r.cred_id === credId)
            return found ? ({ cred_id: found.cred_id } as T) : null
          }
          // SELECT registered_at FROM owner_pubkeys WHERE cred_id (POST return)
          if (/SELECT registered_at AS registeredAt FROM owner_pubkeys WHERE cred_id/i.test(sql)) {
            const credId = boundArgs[0] as string
            const found = rows.find((r) => r.cred_id === credId)
            return found ? ({ registeredAt: found.registered_at } as T) : null
          }
          return null
        }),
        all: vi.fn(async <T>() => {
          // SELECT active keys from owner_pubkeys
          if (/SELECT cred_id AS credId.*FROM owner_pubkeys.*WHERE revoked_at IS NULL/is.test(sql)) {
            const active = rows
              .filter((r) => r.revoked_at === null)
              .map((r) => ({
                credId: r.cred_id,
                pubKey: r.pub_key,
                alg: r.alg,
                registeredAt: r.registered_at,
              }))
            return { results: active as T[] }
          }
          return { results: [] as T[] }
        }),
      }

      return stmt
    }),
    _rows: rows,
  }

  return { db, rows }
}

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn(),
}))

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** A valid base64url credential ID (≥ 22 chars). */
const VALID_CRED_ID = 'AAAAAAAAAAAAAAAAAAAAAA' // 22 chars

/** A valid base64url COSE public key (≥ 43 chars, approximates ≥ 32 bytes). */
const VALID_PUB_KEY = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' // 43 chars

function ownerAuth() {
  return {
    user: 'human:tony',
    role: 'owner' as const,
    isValid: true,
    permissions: [],
    keyId: 'key-1',
  }
}

function chairmanAuth() {
  return {
    user: 'human:other',
    role: 'chairman' as const,
    isValid: true,
    permissions: [],
    keyId: 'key-2',
  }
}

async function callManagement(method: 'POST' | 'GET' | 'DELETE', body?: unknown) {
  const { POST, GET, DELETE } = await import('@/pages/api/auth/owner-pubkeys')
  const handler = method === 'POST' ? POST : method === 'GET' ? GET : DELETE
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body !== undefined) init.body = JSON.stringify(body)
  const req = new Request('http://localhost/api/auth/owner-pubkeys', init)
  return handler({ request: req, locals: {} } as Parameters<typeof handler>[0])
}

async function callWellKnown(db?: ReturnType<typeof makeFakeD1>['db'], envJson?: string) {
  const { GET } = await import('@/pages/.well-known/owner-pubkey.json')
  const { getD1 } = await import('@/lib/cf-env')
  if (db) {
    vi.mocked(getD1).mockResolvedValue(db as never)
  } else {
    vi.mocked(getD1).mockResolvedValue(null)
  }
  if (envJson !== undefined) {
    vi.stubEnv('OWNER_PUBKEYS_JSON', envJson)
  }
  vi.stubEnv('OWNER_EXPECTED_ADDRESS', '0xabc123')
  const req = new Request('http://localhost/.well-known/owner-pubkey.json')
  return GET({ request: req, locals: {} } as Parameters<typeof GET>[0])
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ─── POST /api/auth/owner-pubkeys ─────────────────────────────────────────────

describe('POST /api/auth/owner-pubkeys', () => {
  it('owner with valid pubKey → 200; D1 row inserted', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db, rows } = makeFakeD1()
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callManagement('POST', {
      credId: VALID_CRED_ID,
      pubKey: VALID_PUB_KEY,
      alg: 'ES256',
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.ok).toBe(true)
    expect(body.credId).toBe(VALID_CRED_ID)
    expect(typeof body.registeredAt).toBe('number')
    expect(rows).toHaveLength(1)
    expect(rows[0].cred_id).toBe(VALID_CRED_ID)
    expect(rows[0].alg).toBe('ES256')
    expect(rows[0].revoked_at).toBeNull()
  })

  it('non-owner → 403', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue(chairmanAuth() as never)

    const res = await callManagement('POST', {
      credId: VALID_CRED_ID,
      pubKey: VALID_PUB_KEY,
    })
    expect(res.status).toBe(403)
  })

  it('duplicate credId → 409', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1([
      {
        cred_id: VALID_CRED_ID,
        pub_key: VALID_PUB_KEY,
        alg: 'ES256',
        registered_at: 1715000000,
        revoked_at: null,
      },
    ])
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callManagement('POST', {
      credId: VALID_CRED_ID,
      pubKey: VALID_PUB_KEY,
    })
    expect(res.status).toBe(409)
  })

  it('bad alg → 400', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1()
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callManagement('POST', {
      credId: VALID_CRED_ID,
      pubKey: VALID_PUB_KEY,
      alg: 'RS512', // not in allowed set
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; reason: string }
    expect(body.error).toBe('bad-input')
    expect(body.reason).toMatch(/alg/)
  })

  it('short credId → 400', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)

    const res = await callManagement('POST', {
      credId: 'tooshort',
      pubKey: VALID_PUB_KEY,
    })
    expect(res.status).toBe(400)
  })

  it('missing pubKey → 400', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)

    const res = await callManagement('POST', {
      credId: VALID_CRED_ID,
    })
    expect(res.status).toBe(400)
  })
})

// ─── GET /api/auth/owner-pubkeys ──────────────────────────────────────────────

describe('GET /api/auth/owner-pubkeys', () => {
  it('owner → 200 with active keys (excludes revoked)', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1([
      {
        cred_id: 'active-key',
        pub_key: VALID_PUB_KEY,
        alg: 'ES256',
        registered_at: 1715000000,
        revoked_at: null,
      },
      {
        cred_id: 'revoked-key',
        pub_key: VALID_PUB_KEY,
        alg: 'EdDSA',
        registered_at: 1715000001,
        revoked_at: 1715001000,
      },
    ])
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callManagement('GET')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { keys: Array<{ credId: string }> }
    expect(body.keys).toHaveLength(1)
    expect(body.keys[0].credId).toBe('active-key')
  })

  it('non-owner → 403', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue(chairmanAuth() as never)

    const res = await callManagement('GET')
    expect(res.status).toBe(403)
  })
})

// ─── DELETE /api/auth/owner-pubkeys ───────────────────────────────────────────

describe('DELETE /api/auth/owner-pubkeys', () => {
  it('owner → 200; row revoked_at set', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db, rows } = makeFakeD1([
      {
        cred_id: VALID_CRED_ID,
        pub_key: VALID_PUB_KEY,
        alg: 'ES256',
        registered_at: 1715000000,
        revoked_at: null,
      },
    ])
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callManagement('DELETE', { credId: VALID_CRED_ID })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; revokedAt: number }
    expect(body.ok).toBe(true)
    expect(typeof body.revokedAt).toBe('number')
    expect(rows[0].revoked_at).not.toBeNull()
    expect(rows[0].revoked_at).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))
  })

  it('non-existent credId → 404', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1([]) // empty table
    vi.mocked(resolveUnitFromSession).mockResolvedValue(ownerAuth() as never)
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callManagement('DELETE', { credId: VALID_CRED_ID })
    expect(res.status).toBe(404)
  })
})

// ─── /.well-known/owner-pubkey.json ──────────────────────────────────────────

describe('GET /.well-known/owner-pubkey.json', () => {
  it('D1 returns rows → schema=owner-pubkey-v3, keys from D1', async () => {
    const { db } = makeFakeD1([
      {
        cred_id: 'cred-abc',
        pub_key: VALID_PUB_KEY,
        alg: 'ES256',
        registered_at: 1715000000,
        revoked_at: null,
      },
    ])

    const res = await callWellKnown(db)
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      schema: string
      keys: Array<{ credId: string; alg: string }>
    }
    expect(body.schema).toBe('owner-pubkey-v3')
    expect(body.keys).toHaveLength(1)
    expect(body.keys[0].credId).toBe('cred-abc')
    expect(body.keys[0].alg).toBe('ES256')
  })

  it('D1 empty + OWNER_PUBKEYS_JSON env set → schema=owner-pubkey-v2 fallback', async () => {
    const { db } = makeFakeD1([]) // empty table
    const envKeys = JSON.stringify([
      {
        credId: 'env-cred',
        pubKey: VALID_PUB_KEY,
        alg: 'ES256',
        registeredAt: 1715000000,
      },
    ])

    const res = await callWellKnown(db, envKeys)
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      schema: string
      keys: Array<{ credId: string }>
    }
    expect(body.schema).toBe('owner-pubkey-v2')
    expect(body.keys).toHaveLength(1)
    expect(body.keys[0].credId).toBe('env-cred')
  })

  it('D1 unavailable + OWNER_PUBKEYS_JSON env set → v2 fallback', async () => {
    const envKeys = JSON.stringify([
      { credId: 'fallback-cred', pubKey: VALID_PUB_KEY, alg: 'EdDSA', registeredAt: 1715000000 },
    ])
    // No db passed → getD1 returns null
    const res = await callWellKnown(undefined, envKeys)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { schema: string; keys: Array<{ credId: string }> }
    expect(body.schema).toBe('owner-pubkey-v2')
    expect(body.keys[0].credId).toBe('fallback-cred')
  })

  it('D1 has rows AND env set → D1 wins (schema=v3)', async () => {
    const { db } = makeFakeD1([
      {
        cred_id: 'd1-cred',
        pub_key: VALID_PUB_KEY,
        alg: 'RS256',
        registered_at: 1715000000,
        revoked_at: null,
      },
    ])
    const envKeys = JSON.stringify([
      { credId: 'env-cred', pubKey: VALID_PUB_KEY, alg: 'ES256', registeredAt: 1715000000 },
    ])

    const res = await callWellKnown(db, envKeys)
    const body = (await res.json()) as { schema: string; keys: Array<{ credId: string }> }
    expect(body.schema).toBe('owner-pubkey-v3')
    expect(body.keys[0].credId).toBe('d1-cred')
  })
})
