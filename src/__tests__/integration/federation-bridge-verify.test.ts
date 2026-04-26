/**
 * federation-bridge-verify.test.ts
 *
 * Tests for the Gap 6 V2 peer-discovery verification in
 * POST /api/paths/bridge.
 *
 * Cases:
 * 1. Valid bridge with peerAssertion + peerHost + matching discovery → 201.
 * 2. peer-discovery-failed: fetchPeerPubkey returns null → 503.
 * 3. peer-address-mismatch: discovery returns a different address → 403.
 * 4. peer-version-mismatch: discovery version differs from body version → 403.
 *
 * Strategy:
 * - vi.mock('@/lib/federation-discovery') to control fetchPeerPubkey return value.
 * - vi.mock('@/lib/api-auth') so getRoleForUser and resolveUnitFromSession
 *   bypass the real DB.
 * - vi.mock('@/lib/typedb') to suppress TypeDB writes.
 *
 * The bridge state machine requires TWO calls to POST /api/paths/bridge
 * (pending → accepted). We make the first call with initiator A, then
 * the second call with a different user B. The V2 discovery check only
 * runs on the second call (when the handshake completes).
 *
 * Both callers are mocked as "chairman" of their respective sides so the
 * role check passes without a real TypeDB lookup.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Hoist mocks ────────────────────────────────────────────────────────────

const { fetchPeerPubkeyMock } = vi.hoisted(() => ({
  fetchPeerPubkeyMock: vi.fn(),
}))

vi.mock('@/lib/federation-discovery', () => ({
  fetchPeerPubkey: fetchPeerPubkeyMock,
  _clearDiscoveryCacheForTests: vi.fn(),
}))

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn(),
  write: vi.fn().mockResolvedValue(undefined),
}))

// ── Mock auth: allow two distinct users ──────────────────────────────────
// userA initiates the bridge; userB completes it.
// Both are "chairman" on their respective sides.

let currentUser = 'userA'

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn().mockImplementation(() =>
    Promise.resolve({
      isValid: true,
      user: currentUser,
    }),
  ),
  getRoleForUser: vi.fn().mockImplementation((_user: string, gid: string) => {
    // userA is chairman of 'group-a', userB is chairman of 'group-b'
    if (currentUser === 'userA' && gid === 'group-a') return Promise.resolve('chairman')
    if (currentUser === 'userB' && gid === 'group-b') return Promise.resolve('chairman')
    return Promise.resolve(null)
  }),
}))

// ── Import route after mocks are set ──────────────────────────────────────

// We import the module lazily because it uses top-level Map state (`pending`).
// Each test must clear the module's `pending` Map via module re-import or by
// completing/clearing the pending state between tests.
//
// Since Vitest does not expose module internals, we manage pending state by
// running the first-side POST call in each test's setup.

async function callBridge(body: Record<string, unknown>, asUser: string): Promise<Response> {
  currentUser = asUser

  const { POST } = await import('@/pages/api/paths/bridge')

  const request = new Request('http://localhost/api/paths/bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // Astro APIRoute signature: ({ request, locals, ... })
  return POST({ request, locals: {} as App.Locals } as Parameters<typeof POST>[0])
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/paths/bridge — Gap 6 V2 peer-discovery verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset user
    currentUser = 'userA'
    // Re-import clears module cache is NOT done here — the pending Map
    // is intentionally cleared by using unique group IDs per test so
    // bridgeKey() produces distinct keys.
  })

  it('1. valid bridge with peerHost + matching discovery → 201 accepted', async () => {
    fetchPeerPubkeyMock.mockResolvedValue({
      address: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
      version: 3,
      publishedAt: 1715000000,
      schema: 'owner-pubkey-v1',
    })

    // Unique groups for this test
    const from = 'group-a-t1'
    const to = 'group-b-t1'

    // First side — initiator A
    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    await callBridge({ from, to }, 'userA')

    // Second side — completer B (with peer discovery fields)
    const res = await callBridge(
      {
        from,
        to,
        peerOwnerAddress: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
        peerOwnerVersion: 3,
        peerHost: 'https://other.one.ie',
      },
      'userB',
    )

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.status).toBe('accepted')
    expect(fetchPeerPubkeyMock).toHaveBeenCalledWith('https://other.one.ie')
  })

  it('2. peer-discovery-failed: fetchPeerPubkey returns null → 503', async () => {
    fetchPeerPubkeyMock.mockResolvedValue(null)

    const from = 'group-a-t2'
    const to = 'group-b-t2'

    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    // Initiate
    await callBridge({ from, to }, 'userA')

    // Complete — discovery fails
    const res = await callBridge(
      {
        from,
        to,
        peerOwnerAddress: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
        peerOwnerVersion: 3,
        peerHost: 'https://unreachable.one.ie',
      },
      'userB',
    )

    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBe('peer-discovery-failed')
  })

  it('3. peer-address-mismatch: discovery returns a different address → 403', async () => {
    fetchPeerPubkeyMock.mockResolvedValue({
      address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      version: 3,
      publishedAt: 1715000000,
      schema: 'owner-pubkey-v1',
    })

    const from = 'group-a-t3'
    const to = 'group-b-t3'

    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    await callBridge({ from, to }, 'userA')

    const res = await callBridge(
      {
        from,
        to,
        // Body claims a DIFFERENT address than what discovery publishes
        peerOwnerAddress: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
        peerOwnerVersion: 3,
        peerHost: 'https://spoofed.one.ie',
      },
      'userB',
    )

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('peer-address-mismatch')
  })

  it('4. peer-version-mismatch: discovery version differs from body version → 403', async () => {
    fetchPeerPubkeyMock.mockResolvedValue({
      address: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
      version: 5, // discovery says v5
      publishedAt: 1715000000,
      schema: 'owner-pubkey-v1',
    })

    const from = 'group-a-t4'
    const to = 'group-b-t4'

    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    await callBridge({ from, to }, 'userA')

    const res = await callBridge(
      {
        from,
        to,
        peerOwnerAddress: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
        peerOwnerVersion: 3, // body claims v3, but discovery says v5
        peerHost: 'https://other.one.ie',
      },
      'userB',
    )

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('peer-version-mismatch')
  })

  it('no peerHost supplied → skip discovery, accept (legacy V1 path)', async () => {
    const from = 'group-a-t5'
    const to = 'group-b-t5'

    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    await callBridge({ from, to }, 'userA')

    const res = await callBridge(
      {
        from,
        to,
        peerOwnerAddress: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
        peerOwnerVersion: 3,
        // No peerHost — discovery skipped
      },
      'userB',
    )

    expect(res.status).toBe(201)
    // fetchPeerPubkey must NOT have been called
    expect(fetchPeerPubkeyMock).not.toHaveBeenCalled()
  })
})
