/**
 * Chairman multisig assert endpoint test (owner-todo Gap 3 §3.s3, V3 sign_count).
 *
 * Covers the `action: 'multisig-action'` branch of
 * POST /api/auth/passkey/assert — server-orchestrated N-of-M assertion
 * batching within a 5-minute window.
 *
 * Cases:
 *  1. First chairman submits → 200 { ok: false, accepted: 1, threshold: 3 }; bundle exists.
 *  2. Second chairman submits → 200 { ok: false, accepted: 2, threshold: 3 }.
 *  3. Third chairman (distinct credId) → 200 { ok: true, accepted: 3, threshold: 3 }.
 *  4. Same chairman submits twice in same bundle → second call doesn't
 *     increment (Set dedupe); accepted stays the same.
 *  5. Unknown credId → 403 'unknown-cred'.
 *  6. Group with no multisig config → 400 'no-multisig-config'.
 *  7. Bundle expires after 5 min → 410 'bundle-expired' on next call
 *     (uses direct expiresAt mutation for determinism across ESM isolation).
 *  8. groupId mismatch with stored bundle → 403 'bundle-group-mismatch'.
 *  9. verifyAuthenticationResponse returns { verified: false } → 403 'verify-failed'.
 * 10. verifyAuthenticationResponse throws → 403 'verify-failed'.
 * 11. Counter increments on success: newCounter=1 persisted; subsequent newCounter=2 persisted.
 * 12. Replay rejected: library throws counter error → 403 'verify-failed'.
 * 13. Counter NOT updated on verify failure: row unchanged when verify returns { verified: false }.
 *
 * @simplewebauthn/server is mocked so tests don't need a live WebAuthn device.
 * The mock defaults to returning { verified: true, authenticationInfo: { newCounter: 1 } }.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── fakeD1 helper ──────────────────────────────────────────────────────────

interface FakeMultisigRow {
  group_id: string
  threshold_n: number
  threshold_m: number
  member_credentials: string // JSON
}

function makeFakeD1(rows: FakeMultisigRow[] = []) {
  // Mutable copy so UPDATE statements can mutate member_credentials in-place
  const mutableRows = rows.map((r) => ({ ...r }))

  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => ({
        first: vi.fn(async <T>() => {
          if (/FROM chairman_multisig WHERE group_id/i.test(sql)) {
            const gid = args[0] as string
            const row = mutableRows.find((r) => r.group_id === gid)
            if (!row) return null as T
            return {
              threshold_n: row.threshold_n,
              threshold_m: row.threshold_m,
              member_credentials: row.member_credentials,
            } as T
          }
          return null as T
        }),
        run: vi.fn(async () => {
          // Handle UPDATE chairman_multisig SET member_credentials = ? WHERE group_id = ?
          if (/UPDATE chairman_multisig SET member_credentials/i.test(sql)) {
            const newCreds = args[0] as string
            const gid = args[1] as string
            const row = mutableRows.find((r) => r.group_id === gid)
            if (row) row.member_credentials = newCreds
          }
          return { success: true }
        }),
      })),
    })),
    // Expose mutableRows for test assertions
    _rows: mutableRows,
  }
  return db
}

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

// auditOwner is best-effort (fire-and-forget); mock to avoid async complexity
vi.mock('@/engine/adl-cache', () => ({
  auditOwner: vi.fn().mockResolvedValue(true),
}))

// Mock @simplewebauthn/server so tests are not gated on a live WebAuthn device.
// Default: { verified: true, authenticationInfo: { newCounter: 1 } }.
// Override per-test with vi.mocked(...).mockResolvedValueOnce / mockRejectedValueOnce.
vi.mock('@simplewebauthn/server', () => ({
  verifyAuthenticationResponse: vi.fn().mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 1 } }),
}))

// ─── Test data ────────────────────────────────────────────────────────────────

const GROUP_ID = 'g:acme'

// Minimal 65-byte placeholder COSE public key for P-256.
// Real keys come from verifyRegistrationResponse.registrationInfo.credential.publicKey.
const FAKE_PUB_KEY = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'

const MEMBERS = [
  { uid: 'human:alice', credId: 'CRED_ALICE', pubKey: FAKE_PUB_KEY, addedAt: 0, signCount: 0 },
  { uid: 'human:bob', credId: 'CRED_BOB', pubKey: FAKE_PUB_KEY, addedAt: 0, signCount: 0 },
  { uid: 'human:carol', credId: 'CRED_CAROL', pubKey: FAKE_PUB_KEY, addedAt: 0, signCount: 0 },
  { uid: 'human:david', credId: 'CRED_DAVID', pubKey: FAKE_PUB_KEY, addedAt: 0, signCount: 0 },
  { uid: 'human:eve', credId: 'CRED_EVE', pubKey: FAKE_PUB_KEY, addedAt: 0, signCount: 0 },
]

const MULTISIG_ROW: FakeMultisigRow = {
  group_id: GROUP_ID,
  threshold_n: 3,
  threshold_m: 5,
  member_credentials: JSON.stringify(MEMBERS),
}

function makeAssertion(credId: string) {
  return {
    credId,
    clientDataJSON: 'base64url-client-data',
    authenticatorData: 'base64url-auth-data',
    signature: 'base64url-sig',
  }
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/passkey/assert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Reset the in-process bundle store before each test
  // Dynamic import gives us the live module reference
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Helper: get the live module to reset bundle store ────────────────────────

async function getEndpoint() {
  // Re-import to get fresh module reference (vitest module registry)
  const mod = await import('@/pages/api/auth/passkey/assert')
  // Clear bundle store to keep tests isolated
  mod.MULTISIG_BUNDLES.clear()
  return mod
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/passkey/assert — multisig-action flow (Gap 3 §3.s3)', () => {
  // ── Case 1: First chairman → accepted: 1, ok: false ──────────────────────
  it('1 — first chairman submits → 200 { ok: false, accepted: 1, threshold: 3 }', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-001',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; accepted: number; threshold: number }
    expect(body.ok).toBe(false)
    expect(body.accepted).toBe(1)
    expect(body.threshold).toBe(3)

    // Bundle entry exists in store
    expect(MULTISIG_BUNDLES.has('bundle-001')).toBe(true)
    expect(MULTISIG_BUNDLES.get('bundle-001')!.accepted.size).toBe(1)
  })

  // ── Case 2: Second chairman → accepted: 2, ok: false ─────────────────────
  it('2 — second chairman submits → 200 { accepted: 2, ok: false }', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    // First submission
    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-002',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    // Second submission
    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-002',
        assertion: makeAssertion('CRED_BOB'),
      }),
    } as never)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; accepted: number }
    expect(body.ok).toBe(false)
    expect(body.accepted).toBe(2)
  })

  // ── Case 3: Third chairman → threshold reached, ok: true ─────────────────
  it('3 — third distinct chairman → 200 { ok: true, accepted: 3, threshold: 3 }', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const bundleId = 'bundle-003'

    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)
    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_BOB'),
      }),
    } as never)

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_CAROL'),
      }),
    } as never)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; accepted: number; threshold: number }
    expect(body.ok).toBe(true)
    expect(body.accepted).toBe(3)
    expect(body.threshold).toBe(3)
  })

  // ── Case 4: Same chairman submits twice → Set dedupe, no increment ────────
  it('4 — same credId submitted twice → accepted stays the same (Set dedupe)', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const bundleId = 'bundle-004'

    // First submission (alice)
    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    // Second submission (alice AGAIN — same credId)
    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; accepted: number }
    // Accepted count must still be 1, not 2
    expect(body.accepted).toBe(1)
    expect(body.ok).toBe(false)

    // Internal Set also stays at 1
    expect(MULTISIG_BUNDLES.get(bundleId)!.accepted.size).toBe(1)
  })

  // ── Case 5: Unknown credId → 403 ─────────────────────────────────────────
  it('5 — unknown credId → 403 unknown-cred', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-005',
        assertion: makeAssertion('CRED_UNKNOWN_XYZ'),
      }),
    } as never)

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('unknown-cred')
  })

  // ── Case 6: Group with no multisig config → 400 ──────────────────────────
  it('6 — group with no multisig config → 400 no-multisig-config', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    // Empty D1 — no rows
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: 'g:nonexistent',
        bundleId: 'bundle-006',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('no-multisig-config')
  })

  // ── Case 7: Bundle expires after 5 min → 410 ─────────────────────────────
  it('7 — bundle expires after 5 min → 410 bundle-expired', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const bundleId = 'bundle-007'
    const FIVE_MIN_MS = 5 * 60 * 1000

    // Record the real time before the first submission
    const t0 = Date.now()

    // First submission creates the bundle entry
    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(MULTISIG_BUNDLES.has(bundleId)).toBe(true)

    // Manually expire the bundle by rewinding its expiresAt to the past.
    // This is more reliable than vi.useFakeTimers (which patches async Date.now
    // inconsistently across module boundaries in vitest's ESM isolation mode).
    const entry = MULTISIG_BUNDLES.get(bundleId)!
    entry.expiresAt = t0 - 1 // set expiry to 1ms before t0 → always expired

    // Second submission should find the bundle expired
    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_BOB'),
      }),
    } as never)

    expect(res.status).toBe(410)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('bundle-expired')

    // Bundle entry should be removed
    expect(MULTISIG_BUNDLES.has(bundleId)).toBe(false)

    // Note: vi.useFakeTimers + vi.advanceTimersByTime is the idiomatic approach
    // but does not reliably shift Date.now() across ESM module boundaries in
    // vitest's module isolation mode. Direct mutation of expiresAt achieves
    // identical coverage with full determinism. See Gap 3.s4 for a
    // Durable Object-based store that will expose a testable clock interface.
    void FIVE_MIN_MS // suppress unused-var lint for the constant
  })

  // ── Case 8: groupId mismatch with stored bundle → 403 ────────────────────
  it('8 — groupId mismatch with stored bundle → 403 bundle-group-mismatch', async () => {
    const { getD1 } = await import('@/lib/cf-env')

    const OTHER_GROUP_ID = 'g:other-org'
    const OTHER_MULTISIG_ROW: FakeMultisigRow = {
      group_id: OTHER_GROUP_ID,
      threshold_n: 2,
      threshold_m: 3,
      member_credentials: JSON.stringify(MEMBERS.slice(0, 3)),
    }

    // D1 has both groups configured
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW, OTHER_MULTISIG_ROW]) as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const bundleId = 'bundle-008'

    // First submission for g:acme creates the bundle
    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId,
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    // Second submission uses the SAME bundleId but a DIFFERENT groupId
    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: OTHER_GROUP_ID, // mismatch!
        bundleId,
        assertion: makeAssertion('CRED_BOB'),
      }),
    } as never)

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('bundle-group-mismatch')
  })

  // ── Case 9: verifyAuthenticationResponse returns { verified: false } → 403 ──
  it('9 — verifyAuthenticationResponse returns { verified: false } → 403 verify-failed', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    // Override the mock to return { verified: false } for this test
    const swa = await import('@simplewebauthn/server')
    vi.mocked(swa.verifyAuthenticationResponse).mockResolvedValueOnce({ verified: false } as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-009',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('verify-failed')
  })

  // ── Case 10: verifyAuthenticationResponse throws → 403 verify-failed ────────
  it('10 — verifyAuthenticationResponse throws → 403 verify-failed', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([MULTISIG_ROW]) as never)

    // Override the mock to throw for this test
    const swa = await import('@simplewebauthn/server')
    vi.mocked(swa.verifyAuthenticationResponse).mockRejectedValueOnce(new Error('cbor: unexpected end of data'))

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-010',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string; reason: string }
    expect(body.error).toBe('verify-failed')
    expect(body.reason).toContain('cbor')
  })

  // ── Case 11: Counter increments on success ────────────────────────────────
  it('11 — newCounter=1 persisted after first success; newCounter=2 persisted after second', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    const fakeDb = makeFakeD1([{ ...MULTISIG_ROW }])
    vi.mocked(getD1).mockResolvedValue(fakeDb as never)

    const swa = await import('@simplewebauthn/server')
    // First call: newCounter=1
    vi.mocked(swa.verifyAuthenticationResponse).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    } as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-011a',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    // After first assertion the member_credentials JSON stored in the fake D1
    // should contain signCount: 1 for CRED_ALICE
    const row = fakeDb._rows.find((r) => r.group_id === GROUP_ID)!
    const creds = JSON.parse(row.member_credentials) as Array<{ credId: string; signCount: number }>
    expect(creds.find((c) => c.credId === 'CRED_ALICE')?.signCount).toBe(1)

    // Second call (new bundle, same credId): newCounter=2
    vi.mocked(swa.verifyAuthenticationResponse).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 2 },
    } as never)

    await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-011b',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    const creds2 = JSON.parse(fakeDb._rows.find((r) => r.group_id === GROUP_ID)!.member_credentials) as Array<{
      credId: string
      signCount: number
    }>
    expect(creds2.find((c) => c.credId === 'CRED_ALICE')?.signCount).toBe(2)
  })

  // ── Case 12: Replay rejected — library throws counter error ───────────────
  it('12 — library throws counter error → 403 verify-failed (replay detected)', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    // Member already has signCount: 5 stored
    const rowWithCounter: FakeMultisigRow = {
      ...MULTISIG_ROW,
      member_credentials: JSON.stringify(MEMBERS.map((m) => (m.credId === 'CRED_ALICE' ? { ...m, signCount: 5 } : m))),
    }
    vi.mocked(getD1).mockResolvedValue(makeFakeD1([rowWithCounter]) as never)

    const swa = await import('@simplewebauthn/server')
    // Simulate @simplewebauthn/server detecting a replay via counter check
    vi.mocked(swa.verifyAuthenticationResponse).mockRejectedValueOnce(
      new Error("Counter not greater than authenticator's stored counter"),
    )

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-012',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string; reason: string }
    expect(body.error).toBe('verify-failed')
    expect(body.reason).toMatch(/counter/i)
  })

  // ── Case 13: Counter NOT updated when verify returns { verified: false } ──
  it('13 — verify returns { verified: false } → row signCount unchanged', async () => {
    const { getD1 } = await import('@/lib/cf-env')
    const fakeDb = makeFakeD1([{ ...MULTISIG_ROW }])
    vi.mocked(getD1).mockResolvedValue(fakeDb as never)

    const swa = await import('@simplewebauthn/server')
    vi.mocked(swa.verifyAuthenticationResponse).mockResolvedValueOnce({
      verified: false,
      authenticationInfo: { newCounter: 99 },
    } as never)

    const { POST, MULTISIG_BUNDLES } = await getEndpoint()
    MULTISIG_BUNDLES.clear()

    const res = await POST({
      request: makeRequest({
        action: 'multisig-action',
        groupId: GROUP_ID,
        bundleId: 'bundle-013',
        assertion: makeAssertion('CRED_ALICE'),
      }),
    } as never)

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('verify-failed')

    // signCount in D1 must still be 0 — no UPDATE should have run
    const row = fakeDb._rows.find((r) => r.group_id === GROUP_ID)!
    const creds = JSON.parse(row.member_credentials) as Array<{ credId: string; signCount: number }>
    expect(creds.find((c) => c.credId === 'CRED_ALICE')?.signCount).toBe(0)
  })
})
