/**
 * Chairman multisig config endpoint test (owner-todo Gap 3 §3.s2).
 *
 * Covers:
 *   POST /api/groups/:gid/multisig — chairman/owner UPSERTs threshold
 *   GET  /api/groups/:gid/multisig — any member reads current config
 *   non-member POST → 403
 *   non-member GET  → 403
 *   bad inputs (n>m, n<1, members.length≠m, missing fields) → 400
 *   re-config replaces previous (UPSERT)
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
          if (/INSERT INTO chairman_multisig.*ON CONFLICT/is.test(sql)) {
            const gid = args[0] as string
            const idx = rows.findIndex((r) => r.group_id === gid)
            const next = {
              group_id: gid,
              threshold_n: args[1],
              threshold_m: args[2],
              member_credentials: args[3],
              configured_at: Math.floor(Date.now() / 1000),
              configured_by: args[4],
            }
            if (idx >= 0) rows[idx] = next
            else rows.push(next)
          }
          return { success: true }
        }),
        first: vi.fn(async () => {
          if (/SELECT.*FROM chairman_multisig WHERE group_id =/is.test(sql)) {
            const target = args[0] as string
            const r = rows.find((row) => row.group_id === target)
            if (!r) return null
            return {
              gid: r.group_id,
              n: r.threshold_n,
              m: r.threshold_m,
              members: r.member_credentials,
              configuredAt: r.configured_at,
              configuredBy: r.configured_by,
            }
          }
          return null
        }),
      })),
    })),
  }
  return { db, inserts, rows }
}

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn(),
  getRoleForUser: vi.fn(),
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

async function callPost(gid: string, body: unknown) {
  const { POST } = await import('@/pages/api/groups/[gid]/multisig')
  const req = new Request(`http://localhost/api/groups/${gid}/multisig`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST({ request: req, params: { gid }, locals: {} } as Parameters<typeof POST>[0])
}

async function callGet(gid: string) {
  const { GET } = await import('@/pages/api/groups/[gid]/multisig')
  const req = new Request(`http://localhost/api/groups/${gid}/multisig`)
  return GET({ request: req, params: { gid }, locals: {} } as Parameters<typeof GET>[0])
}

// pubKey is a base64url-encoded 65-byte COSE public key (P-256 uncompressed point).
// In tests we use a minimal 65-byte placeholder: 0x04 + 32 bytes x + 32 bytes y.
const FAKE_PUB_KEY = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'

const validMembers = [
  { uid: 'human:alice', credId: 'A_CRED', pubKey: FAKE_PUB_KEY },
  { uid: 'human:bob', credId: 'B_CRED', pubKey: FAKE_PUB_KEY },
  { uid: 'human:carol', credId: 'C_CRED', pubKey: FAKE_PUB_KEY },
  { uid: 'human:david', credId: 'D_CRED', pubKey: FAKE_PUB_KEY },
  { uid: 'human:eve', credId: 'E_CRED', pubKey: FAKE_PUB_KEY },
]

describe('POST /api/groups/:gid/multisig (3.s2)', () => {
  it('chairman configures 3-of-5 → 200; D1 row written', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db, rows } = makeFakeD1()
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callPost('g:acme', { n: 3, m: 5, members: validMembers })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.ok).toBe(true)
    expect(body.n).toBe(3)
    expect(body.m).toBe(5)
    expect(rows).toHaveLength(1)
    expect(rows[0].threshold_n).toBe(3)
    expect(rows[0].threshold_m).toBe(5)
  })

  it('owner can configure (not just chairman)', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1()
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:tony',
      role: 'owner',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('owner')
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callPost('g:acme', { n: 3, m: 5, members: validMembers })
    expect(res.status).toBe(200)
  })

  it('non-chairman / non-owner → 403', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      role: 'agent',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('operator') // operator is below chairman

    const res = await callPost('g:acme', { n: 3, m: 5, members: validMembers })
    expect(res.status).toBe(403)
  })

  it('unauthenticated → 401', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: '',
      isValid: false,
      permissions: [],
      keyId: '',
    } as never)

    const res = await callPost('g:acme', { n: 3, m: 5, members: validMembers })
    expect(res.status).toBe(401)
  })

  it('n > m → 400', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')

    const res = await callPost('g:acme', { n: 6, m: 5, members: validMembers })
    expect(res.status).toBe(400)
  })

  it('members.length ≠ m → 400', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')

    const res = await callPost('g:acme', { n: 3, m: 5, members: validMembers.slice(0, 4) })
    expect(res.status).toBe(400)
  })

  it('member missing credId → 400', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')

    const bad = [...validMembers]
    bad[2] = { uid: 'human:carol' } as (typeof validMembers)[0] // missing credId + pubKey
    const res = await callPost('g:acme', { n: 3, m: 5, members: bad })
    expect(res.status).toBe(400)
  })

  it('member missing pubKey → 400 pubkey-required', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')

    // Strip pubKey from one member — keep uid + credId
    const bad = validMembers.map((m, i) => (i === 1 ? { uid: m.uid, credId: m.credId } : m))
    const res = await callPost('g:acme', { n: 3, m: 5, members: bad })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('pubkey-required')
  })

  it('re-config UPSERTs (replaces previous threshold)', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db, rows } = makeFakeD1([
      {
        group_id: 'g:acme',
        threshold_n: 2,
        threshold_m: 3,
        member_credentials: '[]',
        configured_at: 0,
        configured_by: 'human:alice',
      },
    ])
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:alice',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callPost('g:acme', { n: 4, m: 5, members: validMembers })
    expect(res.status).toBe(200)
    expect(rows).toHaveLength(1) // still one row; UPSERT replaced
    expect(rows[0].threshold_n).toBe(4)
    expect(rows[0].threshold_m).toBe(5)
  })
})

describe('GET /api/groups/:gid/multisig', () => {
  it('member reads current config → 200 with multisig data', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1([
      {
        group_id: 'g:acme',
        threshold_n: 3,
        threshold_m: 5,
        member_credentials: JSON.stringify(validMembers.map((m) => ({ ...m, addedAt: 0 }))),
        configured_at: 12345,
        configured_by: 'human:alice',
      },
    ])
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:bob',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callGet('g:acme')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { multisig: { n: number; m: number; members: unknown[] } }
    expect(body.multisig.n).toBe(3)
    expect(body.multisig.m).toBe(5)
    expect(body.multisig.members).toHaveLength(5)
  })

  it('group with no multisig → 200 multisig: null', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')
    const { db } = makeFakeD1()
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:bob',
      role: 'chairman',
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue('chairman')
    vi.mocked(getD1).mockResolvedValue(db as never)

    const res = await callGet('g:acme')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { multisig: unknown }
    expect(body.multisig).toBeNull()
  })

  it('non-member → 403', async () => {
    const { resolveUnitFromSession, getRoleForUser } = await import('@/lib/api-auth')
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: 'human:stranger',
      role: undefined,
      isValid: true,
      permissions: [],
      keyId: 'k',
    } as never)
    vi.mocked(getRoleForUser).mockResolvedValue(undefined)

    const res = await callGet('g:acme')
    expect(res.status).toBe(403)
  })
})
