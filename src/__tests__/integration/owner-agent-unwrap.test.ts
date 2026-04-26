/**
 * Integration test: POST /api/agents/[uid]/unwrap
 *
 * Covers:
 *   1. valid bearer + agent_wallet row + daemon 200 → 200 { ok: true, seedB64 }
 *   2. no bearer → 401 unauthenticated
 *   3. bearer for different uid → 403 bearer-uid-mismatch
 *   4. agent_wallet row missing → 404 no-agent-wallet
 *   5. OWNER_DAEMON_KEY missing → 503 daemon-not-configured
 *   6. daemon returns 423 → 503 owner-locked
 *   7. daemon network error (fetch throws) → 503 daemon-unreachable
 *   8. daemon returns 400 unwrap-failed → 502 unwrap-failed
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContext } from '@/lib/api-auth'

// ---------------------------------------------------------------------------
// Mocks — must precede deferred imports
// ---------------------------------------------------------------------------

vi.mock('@/lib/api-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-auth')>()
  return {
    ...actual,
    resolveUnitFromSession: vi.fn(),
  }
})

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Deferred imports
// ---------------------------------------------------------------------------

import * as apiAuth from '@/lib/api-auth'
import * as cfEnv from '@/lib/cf-env'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal D1 mock that returns `row` for the first `.first()` call. */
function makeDb(row: Record<string, unknown> | null) {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(row),
      }),
    }),
  } as unknown as D1Database
}

/** Encode a string as a Uint8Array — stands in for binary D1 blob. */
function strToBuffer(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

const VALID_UID = 'agent-swift-001'
const VALID_KEY_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' // 32 zero bytes, padded std-b64

const VALID_ROW = {
  ciphertext: strToBuffer('fake-ciphertext'),
  iv: strToBuffer('fake-iv'),
  kdf_version: 1,
}

function makeRequest(opts: { uid?: string; bearer?: string } = {}): {
  request: Request
  params: Record<string, string>
  locals: Record<string, unknown>
} {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (opts.bearer) headers.set('Authorization', `Bearer ${opts.bearer}`)
  return {
    request: new Request(`http://localhost/api/agents/${opts.uid ?? VALID_UID}/unwrap`, {
      method: 'POST',
      headers,
    }),
    params: { uid: opts.uid ?? VALID_UID },
    locals: {} as Record<string, unknown>,
  }
}

function stubAuth(overrides?: Partial<AuthContext>): void {
  vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue({
    isValid: true,
    user: VALID_UID,
    keyId: 'key-abc',
    permissions: [],
    ...overrides,
  } as AuthContext)
}

function stubNoAuth(): void {
  vi.mocked(apiAuth.resolveUnitFromSession).mockResolvedValue({
    isValid: false,
    user: '',
    keyId: '',
    permissions: [],
  } as AuthContext)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/agents/[uid]/unwrap', () => {
  // Reset all mocks and env stubs between tests
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  // ─── Case 1: happy path ─────────────────────────────────────────────────

  it('1. valid bearer + wallet row + daemon 200 → 200 { ok: true, seedB64 }', async () => {
    stubAuth()
    vi.mocked(cfEnv.getD1).mockResolvedValue(makeDb(VALID_ROW))
    vi.stubEnv('OWNER_DAEMON_KEY', VALID_KEY_B64)
    vi.stubEnv('OWNER_DAEMON_URL', 'http://127.0.0.1:48923')

    const daemonReply = { ok: true, seedB64: 'c2VlZA' } // "seed" in base64url
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(daemonReply), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest({ bearer: 'api_test_token' })
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.seedB64).toBe('c2VlZA')
  })

  // ─── Case 2: unauthenticated ─────────────────────────────────────────────

  it('2. no bearer / invalid bearer → 401 unauthenticated', async () => {
    stubNoAuth()

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest() // no bearer
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('unauthenticated')
  })

  // ─── Case 3: bearer belongs to different uid ──────────────────────────────

  it('3. bearer uid mismatch → 403 bearer-uid-mismatch', async () => {
    // Auth resolves to a different uid than the path uid
    stubAuth({ user: 'other-agent-999' })

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest({
      uid: VALID_UID,
      bearer: 'api_test_other',
    })
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('bearer-uid-mismatch')
  })

  // ─── Case 4: no agent_wallet row ─────────────────────────────────────────

  it('4. agent_wallet row missing → 404 no-agent-wallet', async () => {
    stubAuth()
    vi.mocked(cfEnv.getD1).mockResolvedValue(makeDb(null)) // no row

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest({ bearer: 'api_test_token' })
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('no-agent-wallet')
  })

  // ─── Case 5: OWNER_DAEMON_KEY missing ────────────────────────────────────

  it('5. OWNER_DAEMON_KEY not set → 503 daemon-not-configured', async () => {
    stubAuth()
    vi.mocked(cfEnv.getD1).mockResolvedValue(makeDb(VALID_ROW))
    // Do NOT stub OWNER_DAEMON_KEY — ensure it reads as empty
    vi.stubEnv('OWNER_DAEMON_KEY', '')

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest({ bearer: 'api_test_token' })
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBe('daemon-not-configured')
  })

  // ─── Case 6: daemon returns 423 (session-locked) ─────────────────────────

  it('6. daemon 423 → 503 owner-locked', async () => {
    stubAuth()
    vi.mocked(cfEnv.getD1).mockResolvedValue(makeDb(VALID_ROW))
    vi.stubEnv('OWNER_DAEMON_KEY', VALID_KEY_B64)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('session-locked', { status: 423 })))

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest({ bearer: 'api_test_token' })
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBe('owner-locked')
  })

  // ─── Case 7: daemon network error ────────────────────────────────────────

  it('7. fetch throws (network error) → 503 daemon-unreachable', async () => {
    stubAuth()
    vi.mocked(cfEnv.getD1).mockResolvedValue(makeDb(VALID_ROW))
    vi.stubEnv('OWNER_DAEMON_KEY', VALID_KEY_B64)

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest({ bearer: 'api_test_token' })
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBe('daemon-unreachable')
    expect(body.reason).toContain('ECONNREFUSED')
  })

  // ─── Case 8: daemon returns 400 unwrap-failed ────────────────────────────

  it('8. daemon 400 → 502 unwrap-failed', async () => {
    stubAuth()
    vi.mocked(cfEnv.getD1).mockResolvedValue(makeDb(VALID_ROW))
    vi.stubEnv('OWNER_DAEMON_KEY', VALID_KEY_B64)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unwrap-failed', { status: 400 })))

    const { POST } = await import('@/pages/api/agents/[uid]/unwrap')
    const { request, params, locals } = makeRequest({ bearer: 'api_test_token' })
    const res = await POST({ request, params, locals } as any)
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBe('unwrap-failed')
  })
})
