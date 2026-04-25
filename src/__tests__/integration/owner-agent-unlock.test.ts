/**
 * Contract test for POST /api/agents/[uid]/unlock — agent-bearer-authenticated
 * wallet unlock endpoint. Owner-todo Gap 1, task 1.s6.
 *
 * Seven scenarios:
 *   1. valid bearer matching path uid → 200 with token shape
 *   2. expiresAt is now+60 (within 1s tolerance)
 *   3. sig is non-empty base64url; verifying with the same key produces a match
 *   4. bearer for different uid → 403 bearer-uid-mismatch
 *   5. unauthenticated → 401
 *   6. agent uid not in D1 → 404 no-agent-wallet
 *   7. UNLOCK_SIGNING_KEY missing → 500 with code 'unlock-signing-key-missing'
 *
 * Uses vi.mock (same pattern as owner-bootstrap.test.ts and auth-claim.test.ts).
 * No real TypeDB, Sui, or D1.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_UID = 'agent:scout'
const OTHER_UID = 'agent:other'

// ─── Fake D1 agent_wallet row ─────────────────────────────────────────────────

// 12-byte nonce + 48-byte ciphertext (representative sizes)
const FAKE_IV = new Uint8Array(12).fill(0x11)
const FAKE_CIPHERTEXT = new Uint8Array(48).fill(0x22)
const FAKE_ADDRESS = '0xscout1234'
const FAKE_KDF_VERSION = 1

function makeWalletRow() {
  return {
    ciphertext: FAKE_CIPHERTEXT.buffer,
    iv: FAKE_IV.buffer,
    kdf_version: FAKE_KDF_VERSION,
    address: FAKE_ADDRESS,
  }
}

// ─── Fake D1 builder ─────────────────────────────────────────────────────────

function makeFakeD1(row: ReturnType<typeof makeWalletRow> | null) {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn(async () => row),
      })),
    })),
  }
}

// ─── Module mocks (must precede dynamic imports) ──────────────────────────────

vi.mock('@/lib/api-auth', () => ({
  resolveUnitFromSession: vi.fn(),
}))

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

// ─── Request factory ─────────────────────────────────────────────────────────

function makeRequest(opts: { bearer?: string } = {}): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (opts.bearer) headers.set('Authorization', `Bearer ${opts.bearer}`)
  return new Request('http://localhost/api/agents/agent:scout/unlock', {
    method: 'POST',
    headers,
  })
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

/** Generate a fresh 32-byte random key and return as base64url string */
function genKeyB64url(): string {
  const raw = new Uint8Array(32)
  crypto.getRandomValues(raw)
  return btoa(String.fromCharCode(...raw))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** HMAC-SHA-256 verify using the same algorithm as the endpoint */
async function hmacVerify(keyB64url: string, input: string, sigB64url: string): Promise<boolean> {
  const b64 = keyB64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(b64 + pad)
  const keyBytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i)

  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return computed === sigB64url
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

// ─── Scenario 1: valid bearer matching path uid → 200 with token shape ────────

describe('scenario 1: valid bearer, matching uid', () => {
  it('returns 200 with ciphertextB64, ivB64, kdfVersion, expiresAt, address, sig', async () => {
    const signingKey = genKeyB64url()
    vi.stubEnv('UNLOCK_SIGNING_KEY', signingKey)

    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: AGENT_UID,
      permissions: [],
      keyId: 'key:scout',
      isValid: true,
    } as any)
    vi.mocked(getD1).mockResolvedValue(makeFakeD1(makeWalletRow()) as any)

    const { POST } = await import('@/pages/api/agents/[uid]/unlock')
    const res = await POST({
      request: makeRequest({ bearer: 'api_scout_token' }),
      params: { uid: AGENT_UID },
    } as any)

    expect(res.status).toBe(200)
    const body = await res.json()

    expect(typeof body.ciphertextB64).toBe('string')
    expect(body.ciphertextB64.length).toBeGreaterThan(0)

    expect(typeof body.ivB64).toBe('string')
    expect(body.ivB64.length).toBeGreaterThan(0)

    expect(body.kdfVersion).toBe(FAKE_KDF_VERSION)
    expect(body.address).toBe(FAKE_ADDRESS)

    expect(typeof body.expiresAt).toBe('number')
    expect(typeof body.sig).toBe('string')
    expect(body.sig.length).toBeGreaterThan(0)
  })
})

// ─── Scenario 2: expiresAt is now+60 (within 1s tolerance) ───────────────────

describe('scenario 2: expiresAt timing', () => {
  it('expiresAt is approximately now+60 seconds', async () => {
    const signingKey = genKeyB64url()
    vi.stubEnv('UNLOCK_SIGNING_KEY', signingKey)

    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: AGENT_UID,
      permissions: [],
      keyId: 'key:scout',
      isValid: true,
    } as any)
    vi.mocked(getD1).mockResolvedValue(makeFakeD1(makeWalletRow()) as any)

    const before = Math.floor(Date.now() / 1000)

    const { POST } = await import('@/pages/api/agents/[uid]/unlock')
    const res = await POST({
      request: makeRequest({ bearer: 'api_scout_token' }),
      params: { uid: AGENT_UID },
    } as any)

    const after = Math.floor(Date.now() / 1000)
    const body = await res.json()

    expect(res.status).toBe(200)
    // expiresAt should be between before+60 and after+60 (inclusive, 1s tolerance)
    expect(body.expiresAt).toBeGreaterThanOrEqual(before + 60)
    expect(body.expiresAt).toBeLessThanOrEqual(after + 61)
  })
})

// ─── Scenario 3: sig verifies with the same key ───────────────────────────────

describe('scenario 3: sig verification', () => {
  it('sig is non-empty base64url and verifies against canonical input with the same key', async () => {
    const signingKey = genKeyB64url()
    vi.stubEnv('UNLOCK_SIGNING_KEY', signingKey)

    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: AGENT_UID,
      permissions: [],
      keyId: 'key:scout',
      isValid: true,
    } as any)
    vi.mocked(getD1).mockResolvedValue(makeFakeD1(makeWalletRow()) as any)

    const { POST } = await import('@/pages/api/agents/[uid]/unlock')
    const res = await POST({
      request: makeRequest({ bearer: 'api_scout_token' }),
      params: { uid: AGENT_UID },
    } as any)

    expect(res.status).toBe(200)
    const body = await res.json()

    // sig must look like base64url (no + or /)
    expect(body.sig).toMatch(/^[A-Za-z0-9_-]+$/)

    // reconstruct canonical string and verify
    const canonical = `${body.ciphertextB64}|${body.ivB64}|${body.kdfVersion}|${body.expiresAt}|${body.address}|${AGENT_UID}`
    const ok = await hmacVerify(signingKey, canonical, body.sig)
    expect(ok).toBe(true)
  })
})

// ─── Scenario 4: bearer for different uid → 403 ──────────────────────────────

describe('scenario 4: bearer uid mismatch', () => {
  it('returns 403 bearer-uid-mismatch when bearer uid differs from path uid', async () => {
    const signingKey = genKeyB64url()
    vi.stubEnv('UNLOCK_SIGNING_KEY', signingKey)

    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    // Bearer resolves to OTHER_UID, path uid is AGENT_UID
    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: OTHER_UID,
      permissions: [],
      keyId: 'key:other',
      isValid: true,
    } as any)
    vi.mocked(getD1).mockResolvedValue(makeFakeD1(makeWalletRow()) as any)

    const { POST } = await import('@/pages/api/agents/[uid]/unlock')
    const res = await POST({
      request: makeRequest({ bearer: 'api_other_token' }),
      params: { uid: AGENT_UID },
    } as any)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('bearer-uid-mismatch')
    expect(body.ok).toBe(false)
  })
})

// ─── Scenario 5: unauthenticated → 401 ───────────────────────────────────────

describe('scenario 5: unauthenticated request', () => {
  it('returns 401 invalid-bearer when no valid auth is present', async () => {
    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: '',
      permissions: [],
      keyId: '',
      isValid: false,
    } as any)
    vi.mocked(getD1).mockResolvedValue(makeFakeD1(makeWalletRow()) as any)

    const { POST } = await import('@/pages/api/agents/[uid]/unlock')
    const res = await POST({
      request: makeRequest(), // no bearer
      params: { uid: AGENT_UID },
    } as any)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('invalid-bearer')
    expect(body.ok).toBe(false)
  })
})

// ─── Scenario 6: agent uid not in D1 → 404 ───────────────────────────────────

describe('scenario 6: no agent_wallet row', () => {
  it('returns 404 no-agent-wallet when D1 has no row for the uid', async () => {
    const signingKey = genKeyB64url()
    vi.stubEnv('UNLOCK_SIGNING_KEY', signingKey)

    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: AGENT_UID,
      permissions: [],
      keyId: 'key:scout',
      isValid: true,
    } as any)
    // D1 returns null (no row)
    vi.mocked(getD1).mockResolvedValue(makeFakeD1(null) as any)

    const { POST } = await import('@/pages/api/agents/[uid]/unlock')
    const res = await POST({
      request: makeRequest({ bearer: 'api_scout_token' }),
      params: { uid: AGENT_UID },
    } as any)

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('no-agent-wallet')
    expect(body.ok).toBe(false)
  })
})

// ─── Scenario 7: UNLOCK_SIGNING_KEY missing → 500 ────────────────────────────

describe('scenario 7: UNLOCK_SIGNING_KEY missing', () => {
  it('returns 500 unlock-signing-key-missing when env var is absent', async () => {
    // Ensure env var is not set
    vi.unstubAllEnvs()

    const { resolveUnitFromSession } = await import('@/lib/api-auth')
    const { getD1 } = await import('@/lib/cf-env')

    vi.mocked(resolveUnitFromSession).mockResolvedValue({
      user: AGENT_UID,
      permissions: [],
      keyId: 'key:scout',
      isValid: true,
    } as any)
    vi.mocked(getD1).mockResolvedValue(makeFakeD1(makeWalletRow()) as any)

    // Override import.meta.env to not have the key
    const origEnv = import.meta.env as Record<string, unknown>
    const saved = origEnv.UNLOCK_SIGNING_KEY
    delete origEnv.UNLOCK_SIGNING_KEY

    const { POST } = await import('@/pages/api/agents/[uid]/unlock')
    const res = await POST({
      request: makeRequest({ bearer: 'api_scout_token' }),
      params: { uid: AGENT_UID },
    } as any)

    // Restore
    if (saved !== undefined) origEnv.UNLOCK_SIGNING_KEY = saved

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('unlock-signing-key-missing')
    expect(body.ok).toBe(false)
  })
})
