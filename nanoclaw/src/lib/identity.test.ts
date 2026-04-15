import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../types'
import { issueClaim, linkIdentity, resolveActor } from './identity'

// Minimal KV mock
function makeKV(store: Record<string, string> = {}) {
  return {
    get: vi.fn(async (key: string) => store[key] ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store[key] = value
    }),
    delete: vi.fn(async (key: string) => {
      delete store[key]
    }),
  }
}

// Minimal D1 mock
function makeDB(rows: Record<string, unknown>[] = []) {
  const stmt = {
    bind: vi.fn(),
    first: vi.fn(async () => rows[0] ?? null),
    run: vi.fn(async () => ({ success: true })),
    all: vi.fn(async () => ({ results: rows })),
  }
  stmt.bind.mockReturnValue(stmt)
  return { prepare: vi.fn(() => stmt), _stmt: stmt }
}

describe('resolveActor', () => {
  it('returns channel:sender when no link exists', async () => {
    const db = makeDB([])
    const env = { DB: db, KV: makeKV() } as unknown as Env
    const uid = await resolveActor('telegram', '12345', env)
    expect(uid).toBe('telegram:12345')
  })

  it('returns canonical_uid when link exists', async () => {
    const db = makeDB([{ canonical_uid: 'telegram:12345' }])
    const env = { DB: db, KV: makeKV() } as unknown as Env
    const uid = await resolveActor('web', 'session-abc', env)
    expect(uid).toBe('telegram:12345')
  })

  it('falls back gracefully on DB error', async () => {
    const db = {
      prepare: vi.fn(() => {
        throw new Error('DB down')
      }),
    }
    const env = { DB: db, KV: makeKV() } as unknown as Env
    const uid = await resolveActor('telegram', '99', env)
    expect(uid).toBe('telegram:99')
  })
})

describe('issueClaim', () => {
  it('stores nonce in KV and returns it', async () => {
    const kv = makeKV()
    const env = { DB: makeDB()._stmt, KV: kv } as unknown as Env
    const nonce = await issueClaim('session-xyz', env)
    expect(typeof nonce).toBe('string')
    expect(nonce.length).toBeGreaterThan(10)
    expect(kv.put).toHaveBeenCalledWith(`pending_claim:${nonce}`, expect.stringContaining('session-xyz'), {
      expirationTtl: 300,
    })
  })
})

describe('linkIdentity', () => {
  it('returns null for unknown nonce', async () => {
    const kv = makeKV({})
    const env = { DB: makeDB(), KV: kv } as unknown as Env
    const result = await linkIdentity('bad-nonce', 'telegram', '42', env)
    expect(result).toBeNull()
  })

  it('links web session to telegram uid and returns sessionId', async () => {
    const store: Record<string, string> = {
      'pending_claim:abc-123': JSON.stringify({ sessionId: 'session-xyz', createdAt: Date.now() }),
    }
    const kv = makeKV(store)
    const db = makeDB()
    const env = { DB: db, KV: kv } as unknown as Env

    const result = await linkIdentity('abc-123', 'telegram', '42', env)

    expect(result).toBe('session-xyz')
    // Should write two D1 rows (web + telegram self-reference)
    expect(db._stmt.run).toHaveBeenCalledTimes(2)
    // Should delete nonce from KV
    expect(kv.delete).toHaveBeenCalledWith('pending_claim:abc-123')
  })

  it('returns null for malformed KV payload', async () => {
    const kv = makeKV({ 'pending_claim:bad': 'not-json' })
    const env = { DB: makeDB(), KV: kv } as unknown as Env
    const result = await linkIdentity('bad', 'telegram', '42', env)
    expect(result).toBeNull()
  })
})
