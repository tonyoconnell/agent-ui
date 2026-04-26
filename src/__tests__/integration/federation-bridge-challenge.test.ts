/**
 * federation-bridge-challenge.test.ts
 *
 * Tests for:
 *   1-7:  GET /api/paths/bridge/challenge  (challenge issuer endpoint)
 *   8-10: POST /api/paths/bridge (extended V3 challenge validation)
 *
 * Challenge endpoint cases:
 *   1. owner GETs challenge → 200 with valid 32-byte base64url nonce
 *   2. chairman GETs challenge (via X-Group-Id) → 200
 *   3. non-member (no role) → 403
 *   4. missing peer query param → 400
 *   5. challenge expires after 5 min — consumeChallenge after fake-timer advance → false
 *   6. challenge is single-use — second consumeChallenge for same value → false
 *   7. peer mismatch — challenge for peer-A, consumed against peer-B → false
 *
 * Bridge endpoint V3 cases:
 *   8. Bridge with valid bridgeChallenge pre-stored → 201
 *   9. Bridge with stale/replayed bridgeChallenge → 403 'bridge-challenge-stale-or-replayed'
 *  10. Bridge without bridgeChallenge (V2.2 fallback) → 201 with X-Bridge-Challenge-Missing
 *
 * Mock strategy:
 *   - vi.mock('@/lib/api-auth') — bypass DB auth
 *   - vi.mock('@/lib/typedb') — suppress TypeDB writes
 *   - vi.mock('@/lib/federation-discovery') — control fetchPeerPubkey
 *   - vi.mock('@simplewebauthn/server') — control verifyAuthenticationResponse
 *   - Import issueChallenge / consumeChallenge / _clearChallengeStoreForTests
 *     directly from the challenge module to exercise store logic.
 *   - Use vitest fake timers for TTL expiry test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────

const { fetchPeerPubkeyMock, verifyAuthenticationResponseMock } = vi.hoisted(() => ({
  fetchPeerPubkeyMock: vi.fn(),
  verifyAuthenticationResponseMock: vi.fn(),
}))

vi.mock('@/lib/federation-discovery', () => ({
  fetchPeerPubkey: fetchPeerPubkeyMock,
  _clearDiscoveryCacheForTests: vi.fn(),
}))

vi.mock('@simplewebauthn/server', () => ({
  verifyAuthenticationResponse: verifyAuthenticationResponseMock,
}))

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn(),
  write: vi.fn().mockResolvedValue(undefined),
}))

// ── Mock auth ─────────────────────────────────────────────────────────────
// Roles: 'owner' users have role 'owner' on any gid;
//        'chairman' users have role 'chairman' on 'test-group';
//        all others get null.

let currentUser = 'user-owner'
let currentSessionRole: string | undefined = 'owner'

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn().mockImplementation(() =>
    Promise.resolve({
      isValid: true,
      user: currentUser,
      role: currentSessionRole,
    }),
  ),
  getRoleForUser: vi.fn().mockImplementation((_user: string, gid: string) => {
    if (currentUser === 'user-owner') return Promise.resolve('owner')
    if (currentUser === 'user-chairman' && gid === 'test-group') return Promise.resolve('chairman')
    return Promise.resolve(null)
  }),
}))

// ── Import modules under test ─────────────────────────────────────────────

import { _clearChallengeStoreForTests, consumeChallenge, issueChallenge } from '@/pages/api/paths/bridge/challenge'

// ── Helpers ───────────────────────────────────────────────────────────────

async function callChallengeGET(peer: string | null, headers: Record<string, string> = {}): Promise<Response> {
  const { GET } = await import('@/pages/api/paths/bridge/challenge')

  const url = new URL('http://localhost/api/paths/bridge/challenge')
  if (peer !== null) url.searchParams.set('peer', peer)

  const request = new Request(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  })

  return GET({ request, locals: {} as App.Locals } as Parameters<typeof GET>[0])
}

// Bridge state machine requires two calls (pending → accepted).
// We use unique group IDs per test to avoid cross-test state.
let bridgeGroupCounter = 100

async function callBridge(body: Record<string, unknown>, asUser: string): Promise<Response> {
  currentUser = asUser
  currentSessionRole = asUser === 'user-owner' ? 'owner' : undefined

  const { POST } = await import('@/pages/api/paths/bridge')

  const request = new Request('http://localhost/api/paths/bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return POST({ request, locals: {} as App.Locals } as Parameters<typeof POST>[0])
}

// V1 peer pubkey (no COSE keys) — used for V2 bridge tests
const PEER_ADDR = '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b'
const PEER_HOST = 'https://peer.one.ie'

function v2PeerKey() {
  return {
    address: PEER_ADDR,
    version: 1,
    publishedAt: 1715000000,
    schema: 'owner-pubkey-v2',
    keys: [
      {
        credId: 'valid-cred-id',
        pubKey: 'BBBB5678',
        alg: 'ES256',
        registeredAt: 1715000000,
      },
    ],
  }
}

const VALID_ASSERTION = {
  credId: 'valid-cred-id',
  clientDataJSON: 'e30',
  authenticatorData: 'AAAA',
  signature: 'CCCC',
}

// ── Tests: challenge endpoint ─────────────────────────────────────────────

describe('GET /api/paths/bridge/challenge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _clearChallengeStoreForTests()
    currentUser = 'user-owner'
    currentSessionRole = 'owner'
  })

  afterEach(() => {
    vi.useRealTimers()
    _clearChallengeStoreForTests()
  })

  it('1. owner GETs challenge → 200 with valid 32-byte base64url nonce', async () => {
    currentUser = 'user-owner'
    currentSessionRole = 'owner'

    const res = await callChallengeGET('https://peer.one.ie')
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(typeof json.challenge).toBe('string')
    expect(typeof json.issuedAt).toBe('number')
    expect(typeof json.expiresAt).toBe('number')
    expect(json.peer).toBe('https://peer.one.ie')

    // 32 bytes base64url → ceil(32*4/3) = 43 chars (no padding)
    // base64url alphabet: A-Z a-z 0-9 - _
    expect(json.challenge).toMatch(/^[A-Za-z0-9\-_]{40,50}$/)
    expect(json.expiresAt - json.issuedAt).toBe(300)
  })

  it('2. chairman GETs challenge via X-Group-Id → 200', async () => {
    currentUser = 'user-chairman'
    currentSessionRole = undefined

    const res = await callChallengeGET('https://peer.one.ie', { 'X-Group-Id': 'test-group' })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.challenge).toBeTruthy()
    expect(json.peer).toBe('https://peer.one.ie')
  })

  it('3. non-member (no role) → 403', async () => {
    currentUser = 'user-nobody'
    currentSessionRole = undefined

    const res = await callChallengeGET('https://peer.one.ie')
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json.error).toBe('forbidden')
  })

  it('4. missing peer query param → 400', async () => {
    currentUser = 'user-owner'
    currentSessionRole = 'owner'

    const res = await callChallengeGET(null)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('bad-input')
  })

  it('5. challenge expires after 5 min — consumeChallenge after fake-timer advance → false', () => {
    vi.useFakeTimers()

    const { challenge, peer } = issueChallenge('https://peer.one.ie')

    // Advance 5 minutes + 1 second past issue time
    vi.advanceTimersByTime((300 + 1) * 1000)

    const ok = consumeChallenge(challenge, peer)
    expect(ok).toBe(false)
  })

  it('6. challenge is single-use — second consumeChallenge returns false', () => {
    const { challenge, peer } = issueChallenge('https://peer.one.ie')

    // First consume: valid
    const first = consumeChallenge(challenge, peer)
    expect(first).toBe(true)

    // Second consume: already removed
    const second = consumeChallenge(challenge, peer)
    expect(second).toBe(false)
  })

  it('7. peer mismatch — challenge for peer-A, consumed against peer-B → false', () => {
    const { challenge } = issueChallenge('https://peer-a.one.ie')

    const ok = consumeChallenge(challenge, 'https://peer-b.one.ie')
    expect(ok).toBe(false)
  })
})

// ── Tests: bridge endpoint V3 challenge integration ───────────────────────

describe('POST /api/paths/bridge — V3 challenge validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _clearChallengeStoreForTests()
    currentUser = 'user-owner'
    currentSessionRole = 'owner'
    bridgeGroupCounter++
  })

  afterEach(() => {
    _clearChallengeStoreForTests()
  })

  // Helper: mock getRoleForUser for bridge group pair
  function _setupRoles(from: string, to: string) {
    vi.mocked((async () => (await import('@/lib/api-auth')).getRoleForUser)()).then((fn) => {
      if (fn && typeof fn === 'function') {
        // Already mocked via vi.mock above — just reconfigure
      }
    })
    // Re-configure the mock for this test's groups
    const { getRoleForUser } = vi.mocked(require('@/lib/api-auth'))
    if (getRoleForUser && typeof getRoleForUser.mockImplementation === 'function') {
      getRoleForUser.mockImplementation((_u: string, gid: string) => {
        if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
        if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
        return Promise.resolve(null)
      })
    }
  }

  it('8. bridge with valid bridgeChallenge pre-stored → 201', async () => {
    fetchPeerPubkeyMock.mockResolvedValue(v2PeerKey())
    verifyAuthenticationResponseMock.mockResolvedValue({ verified: true })

    const from = `group-a-ch${bridgeGroupCounter}`
    const to = `group-b-ch${bridgeGroupCounter}`

    // Issue a real challenge for the peer host
    const { challenge } = issueChallenge(PEER_HOST)

    // Bridge state machine — mock roles for these groups
    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    // First side — pending
    await callBridge({ from, to }, 'userA')

    // Second side — complete with bridgeChallenge
    const res = await callBridge(
      {
        from,
        to,
        peerOwnerAddress: PEER_ADDR,
        peerOwnerVersion: 1,
        peerHost: PEER_HOST,
        peerAssertion: VALID_ASSERTION,
        bridgeChallenge: challenge,
      },
      'userB',
    )

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.status).toBe('accepted')
    expect(json._warn).toBeUndefined()
  })

  it('9. bridge with stale/replayed bridgeChallenge → 403 bridge-challenge-stale-or-replayed', async () => {
    fetchPeerPubkeyMock.mockResolvedValue(v2PeerKey())
    verifyAuthenticationResponseMock.mockResolvedValue({ verified: true })

    const from = `group-a-ch${bridgeGroupCounter}s`
    const to = `group-b-ch${bridgeGroupCounter}s`

    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    // First side — pending
    await callBridge({ from, to }, 'userA')

    // Second side — stale/unknown challenge
    const res = await callBridge(
      {
        from,
        to,
        peerOwnerAddress: PEER_ADDR,
        peerOwnerVersion: 1,
        peerHost: PEER_HOST,
        peerAssertion: VALID_ASSERTION,
        bridgeChallenge: 'this-challenge-was-never-issued-or-already-consumed',
      },
      'userB',
    )

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('bridge-challenge-stale-or-replayed')
  })

  it('10. bridge without bridgeChallenge (V2.2 fallback) → 201 with X-Bridge-Challenge-Missing', async () => {
    fetchPeerPubkeyMock.mockResolvedValue(v2PeerKey())
    verifyAuthenticationResponseMock.mockResolvedValue({ verified: true })

    const from = `group-a-ch${bridgeGroupCounter}f`
    const to = `group-b-ch${bridgeGroupCounter}f`

    vi.mocked(await import('@/lib/api-auth')).getRoleForUser.mockImplementation((_u: string, gid: string) => {
      if (currentUser === 'userA' && gid === from) return Promise.resolve('chairman')
      if (currentUser === 'userB' && gid === to) return Promise.resolve('chairman')
      return Promise.resolve(null)
    })

    // First side — pending
    await callBridge({ from, to }, 'userA')

    // Second side — NO bridgeChallenge (V2.2 fallback)
    const res = await callBridge(
      {
        from,
        to,
        peerOwnerAddress: PEER_ADDR,
        peerOwnerVersion: 1,
        peerHost: PEER_HOST,
        peerAssertion: VALID_ASSERTION,
        // bridgeChallenge intentionally omitted
      },
      'userB',
    )

    expect(res.status).toBe(201)
    // Warning header must be set
    expect(res.headers.get('X-Bridge-Challenge-Missing')).toBe('true')
    const json = await res.json()
    expect(json.ok).toBe(true)
    // Body warning flag
    expect(json._warn).toContain('bridgeChallenge absent')
  })
})
