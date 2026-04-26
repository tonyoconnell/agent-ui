/**
 * boot.test.ts — agent boot fail-closed tests.
 *
 * owner-todo Gap 1 §1.s7 + §1.s8 (worker boot integration).
 *
 * Covers:
 *   - Happy path: loadAgentToken returns 200 → ensureAgentSeed succeeds,
 *     returns ciphertextB64 placeholder, caches result.
 *   - Fail-closed (owner-offline): cached AgentBootError re-thrown on every
 *     call after first failure — no retry storm.
 *   - Fail-closed (bad-bearer): 401 → AgentBootError(bad-bearer); no fallthrough
 *     to anonymous mode.
 *   - Missing env vars: AGENT_UID / AGENT_BEARER / UNLOCK_SIGNING_KEY not set
 *     → AgentBootError(unknown) without hitting the network.
 *   - Cache isolation: _resetBootCacheForTests() clears state between cases.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../types'
import { _resetBootCacheForTests, ensureAgentSeed, getBootedToken } from './boot'

// ─── Shared HMAC helpers (same as agent-key-load.test.ts) ────────────────────

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
// boot.ts uses module-level state. Each test must start clean.

beforeEach(() => {
  _resetBootCacheForTests()
})

// ─── Test: happy path ─────────────────────────────────────────────────────────

describe('ensureAgentSeed — happy path', () => {
  it('returns ciphertextB64 when token-load returns 200 with valid sig', async () => {
    const key = genKey()
    const tokenBase = {
      ciphertextB64: 'CIPHERTEXT_V1',
      ivB64: 'IV_BYTES',
      kdfVersion: 1,
      expiresAt: Math.floor(Date.now() / 1000) + 60,
      address: '0xabc',
    }
    const sig = await signToken(tokenBase, 'test:scout', key)
    const token = { ...tokenBase, sig }

    // Wire mock fetch into the module via vi.stubGlobal
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(token), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })
    const result = await ensureAgentSeed(env)

    expect(result).toBe('CIPHERTEXT_V1')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Verify getBootedToken reflects the loaded token
    const booted = getBootedToken()
    expect(booted).not.toBeNull()
    expect(booted?.address).toBe('0xabc')

    vi.unstubAllGlobals()
  })

  it('returns cached result on second call — no second fetch', async () => {
    const key = genKey()
    const tokenBase = {
      ciphertextB64: 'CACHED_CIPHER',
      ivB64: 'IV',
      kdfVersion: 1,
      expiresAt: Math.floor(Date.now() / 1000) + 60,
      address: '0xdef',
    }
    const sig = await signToken(tokenBase, 'test:scout', key)
    const token = { ...tokenBase, sig }

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(token), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv({ UNLOCK_SIGNING_KEY: key })
    const r1 = await ensureAgentSeed(env)
    const r2 = await ensureAgentSeed(env)

    expect(r1).toBe('CACHED_CIPHER')
    expect(r2).toBe('CACHED_CIPHER')
    expect(fetchMock).toHaveBeenCalledTimes(1) // only one network call

    vi.unstubAllGlobals()
  })
})

// ─── Test: fail-closed (owner offline) ───────────────────────────────────────

describe('ensureAgentSeed — fail-closed: owner offline', () => {
  it('throws AgentBootError(owner-offline) after exhausting retries', async () => {
    // All requests return 503 — owner never comes online
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv()

    // loadAgentToken uses maxAttempts=6 by default (63s total), but we cannot
    // easily fast-forward timers here. Instead we confirm the error type and cause.
    // The test timeout is set high enough to accommodate real backoff.
    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'owner-offline',
    })

    vi.unstubAllGlobals()
  }, 120_000) // up to 63s total backoff

  it('re-throws cached error on subsequent calls — no retry storm', async () => {
    // First call: one 401 → AgentBootError(bad-bearer)
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

// ─── Test: fail-closed (bad bearer) ──────────────────────────────────────────

describe('ensureAgentSeed — fail-closed: bad bearer', () => {
  it('401 → AgentBootError(bad-bearer); no fallthrough to anonymous mode', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    const env = makeEnv()

    await expect(ensureAgentSeed(env)).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'bad-bearer',
    })

    // Worker must not have fallen through — getBootedToken must be null
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

// ─── Test: missing env vars ───────────────────────────────────────────────────

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
