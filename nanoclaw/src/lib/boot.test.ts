/**
 * boot.test.ts — agent boot fail-closed tests.
 *
 * owner-todo Gap 1 §1.s7 + §1.s8 (worker boot integration).
 *
 * Covers (original 9 tests, kept green):
 *   - Happy path: unlock + unwrap return 200 → ensureAgentSeed succeeds,
 *     returns "keypair:ready" sentinel, caches result.
 *   - Fail-closed (owner-offline): 401 at /unlock → AgentBootError(bad-bearer)
 *     re-thrown on every call — no retry storm.
 *   - Fail-closed (bad-bearer): 401 / 403 → AgentBootError(bad-bearer).
 *   - Missing env vars: AGENT_UID / AGENT_BEARER / UNLOCK_SIGNING_KEY not set
 *     → AgentBootError(unknown) without hitting the network.
 *   - Cache isolation: _resetBootCacheForTests() clears state between cases.
 *
 * New tests (unwrap path, 7 more):
 *   1. Happy path: unlock 200 + unwrap 200 → ensureAgentKeypair returns Ed25519Keypair.
 *   2. unwrap 503 owner-locked → AgentBootError(owner-offline).
 *   3. unwrap 401 → AgentBootError(bad-bearer).
 *   4. unwrap 404 → AgentBootError(no-wallet).
 *   5. unwrap returns wrong-length seed (16 bytes) → AgentBootError(unknown).
 *   6. ensureAgentKeypair caches: second call doesn't re-fetch.
 *   7. ensureAgentKeypair caches errors: subsequent calls throw same error without retry.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../types'
import { _resetBootCacheForTests, ensureAgentKeypair, ensureAgentSeed, getBootedAddress, getBootedToken } from './boot'

// ─── Shared HMAC helpers ──────────────────────────────────────────────────────

async function signToken(
  token: {
    ciphertextB64: string
    ivB64: string
    kdfVersion: number
    expiresAt: number
    address: string
  },
  uid: string,
  keyB64: string,
): Promise<string> {
  const canonical = `${token.ciphertextB64}|${token.ivB64}|${token.kdfVersion}|${token.expiresAt}|${token.address}|${uid}`
  const b64 = keyB64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(b64 + pad)
  const keyBytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical))
  let bin2 = ''
  const u8 = new Uint8Array(sig)
  for (let i = 0; i < u8.length; i++) bin2 += String.fromCharCode(u8[i])
  return btoa(bin2).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function genKey(): string {
  const k = crypto.getRandomValues(new Uint8Array(32))
  let bin = ''
  for (let i = 0; i < k.length; i++) bin += String.fromCharCode(k[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** base64url-encode a Uint8Array */
function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ─── Build a valid signed unlock token + mock /unlock + /unwrap responses ────

async function makeUnlockResponse(key: string, uid = 'test:scout', address = '0xabc') {
  const tokenBase = {
    ciphertextB64: 'CIPHERTEXT_V1',
    ivB64: 'IV_BYTES',
    kdfVersion: 1,
    expiresAt: Math.floor(Date.now() / 1000) + 60,
    address,
  }
  const sig = await signToken(tokenBase, uid, key)
  return { ...tokenBase, sig }
}

// ─── Env stub ────────────────────────────────────────────────────────────────

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    KV: {} as KVNamespace,
    AGENT_QUEUE: {} as Queue,
    GATEWAY_URL: 'https://api.one.ie',
    OPENROUTER_API_KEY: 'sk_test',
    VERSION: 'test',
    AGENT_UID: 'test:scout',
    AGENT_BEARER: 'sk_agent_test',
    UNLOCK_SIGNING_KEY: genKey(),
    ONE_HOST: 'https://one.ie',
    ...overrides,
  } as Env
}

// ─── Reset boot cache before each test ───────────────────────────────────────

beforeEach(() => {
  _resetBootCacheForTests()
})

// ─── Original tests (9), adapted for new two-call flow ───────────────────────

describe('ensureAgentSeed — happy path (deprecation shim)', () => {
  it('returns "keypair:ready" sentinel when unlock + unwrap succeed', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)
    const seedBytes = crypto.getRandomValues(new Uint8Array(32))
    const seedB64 = b64urlEncode(seedBytes)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, seedB64 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })
    const result = await ensureAgentSeed(env)

    expect(result).toBe('keypair:ready')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // getBootedToken is now a deprecated shim that returns null
    expect(getBootedToken()).toBeNull()

    vi.unstubAllGlobals()
  })

  it('returns cached "keypair:ready" on second call — no second fetch', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)
    const seedBytes = crypto.getRandomValues(new Uint8Array(32))
    const seedB64 = b64urlEncode(seedBytes)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, seedB64 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })
    const r1 = await ensureAgentSeed(env)
    const r2 = await ensureAgentSeed(env)

    expect(r1).toBe('keypair:ready')
    expect(r2).toBe('keypair:ready')
    expect(fetchMock).toHaveBeenCalledTimes(2) // only two network calls total (unlock + unwrap)

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentSeed — fail-closed: owner offline', () => {
  it('throws AgentBootError(owner-offline) after exhausting retries', async () => {
    // All /unlock requests return 503 — owner never comes online
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv()

    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'owner-offline',
    })

    vi.unstubAllGlobals()
  }, 120_000) // up to 63s total backoff

  it('re-throws cached error on subsequent calls — no retry storm', async () => {
    // First call: one 401 at /unlock → AgentBootError(bad-bearer)
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv()

    // First call — actual network hit
    await expect(ensureAgentSeed(env)).rejects.toMatchObject({ cause: 'bad-bearer' })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Second call — must re-throw from cache, zero additional fetches
    await expect(ensureAgentSeed(env)).rejects.toMatchObject({ cause: 'bad-bearer' })
    expect(fetchMock).toHaveBeenCalledTimes(1) // still just 1 — cached error

    // Third call — same
    await expect(ensureAgentSeed(env)).rejects.toMatchObject({ cause: 'bad-bearer' })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentSeed — fail-closed: bad bearer', () => {
  it('401 → AgentBootError(bad-bearer); no fallthrough to anonymous mode', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv()

    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'bad-bearer',
    })

    // getBootedToken is the deprecated shim — always null
    expect(getBootedToken()).toBeNull()

    vi.unstubAllGlobals()
  })

  it('403 → AgentBootError(bad-bearer) — uid mismatch', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 403 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv()

    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'bad-bearer',
    })

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentSeed — missing env vars', () => {
  it('throws immediately when AGENT_UID is not set — no network call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ AGENT_UID: undefined })

    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'unknown',
    })

    expect(fetchMock).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('throws immediately when AGENT_BEARER is not set — no network call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ AGENT_BEARER: undefined })

    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'unknown',
    })

    expect(fetchMock).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('throws immediately when UNLOCK_SIGNING_KEY is not set — no network call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: undefined })

    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'unknown',
    })

    expect(fetchMock).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})

// ─── New tests: ensureAgentKeypair (unwrap path, 7 tests) ────────────────────

describe('ensureAgentKeypair — happy path', () => {
  it('returns Ed25519Keypair when unlock + unwrap return 200 with valid 32-byte seed', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key, 'test:scout', '0xdeadbeef')
    // Generate a real random 32-byte seed
    const seedBytes = crypto.getRandomValues(new Uint8Array(32))
    const seedB64 = b64urlEncode(seedBytes)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, seedB64 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })
    const kp = await ensureAgentKeypair(env)

    // Verify a real Ed25519 keypair was constructed
    const address = kp.getPublicKey().toSuiAddress()
    expect(address).toBeTruthy()
    expect(address).toMatch(/^0x[0-9a-f]{64}$/)

    // getBootedAddress reflects the address from the unlock token (not the keypair)
    expect(getBootedAddress()).toBe('0xdeadbeef')

    expect(fetchMock).toHaveBeenCalledTimes(2)

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentKeypair — unwrap 503 (owner-locked)', () => {
  it('throws AgentBootError(owner-offline) when /unwrap returns 503', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'owner-locked' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })

    await expect(ensureAgentKeypair(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'owner-offline',
    })

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentKeypair — unwrap 401 (bad bearer)', () => {
  it('throws AgentBootError(bad-bearer) when /unwrap returns 401', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })

    await expect(ensureAgentKeypair(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'bad-bearer',
    })

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentKeypair — unwrap 404 (no wallet)', () => {
  it('throws AgentBootError(no-wallet) when /unwrap returns 404', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })

    await expect(ensureAgentKeypair(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'no-wallet',
    })

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentKeypair — wrong-length seed', () => {
  it('throws AgentBootError(unknown) when /unwrap returns a 16-byte seed', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)
    // 16 bytes — too short for Ed25519
    const shortSeed = crypto.getRandomValues(new Uint8Array(16))
    const seedB64 = b64urlEncode(shortSeed)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, seedB64 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })

    await expect(ensureAgentKeypair(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'unknown',
    })

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentKeypair — caching (success)', () => {
  it('second call returns cached keypair without re-fetching', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)
    const seedBytes = crypto.getRandomValues(new Uint8Array(32))
    const seedB64 = b64urlEncode(seedBytes)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, seedB64 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })

    const kp1 = await ensureAgentKeypair(env)
    const kp2 = await ensureAgentKeypair(env)

    // Same object identity — cached
    expect(kp1).toBe(kp2)
    // Only two fetches total (unlock + unwrap on first call); second call is cache hit
    expect(fetchMock).toHaveBeenCalledTimes(2)

    vi.unstubAllGlobals()
  })
})

describe('ensureAgentKeypair — caching (error)', () => {
  it('subsequent calls rethrow cached error without retry storm', async () => {
    const key = genKey()
    const unlockToken = await makeUnlockResponse(key)

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unlockToken), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })

    // First call — actual network hit
    await expect(ensureAgentKeypair(env)).rejects.toMatchObject({ cause: 'no-wallet' })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Second call — must re-throw from cache, zero additional fetches
    await expect(ensureAgentKeypair(env)).rejects.toMatchObject({ cause: 'no-wallet' })
    expect(fetchMock).toHaveBeenCalledTimes(2) // still just 2 — cached error

    // Third call — same
    await expect(ensureAgentKeypair(env)).rejects.toMatchObject({ cause: 'no-wallet' })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    vi.unstubAllGlobals()
  })
})
