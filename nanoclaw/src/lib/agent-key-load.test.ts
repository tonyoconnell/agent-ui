/**
 * agent-key-load tests — owner-todo Gap 1 §1.s7 + 1.s8.
 *
 * Covers:
 *   - happy path: 200 with valid signed token → returns token
 *   - bad bearer → 401 → AgentBootError(bad-bearer)
 *   - bearer-uid mismatch → 403 → AgentBootError(bad-bearer)
 *   - no D1 row → 404 → AgentBootError(no-wallet)
 *   - 1.s8 boot-without-owner: 503 retries with exp backoff; succeeds when
 *     owner comes online; gives up after maxAttempts
 *   - bad sig → AgentBootError(bad-sig)
 *   - expired token → AgentBootError(expired)
 */

import { describe, expect, it, vi } from 'vitest'
import { type LoadOptions, loadAgentToken } from './agent-key-load'

// Test helper: HMAC-sign a canonical string the same way the unlock endpoint does
async function signToken(
  token: Omit<import('./agent-key-load').UnlockToken, 'sig'>,
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

const BASE_OPTS = (overrides: Partial<LoadOptions> = {}): LoadOptions => ({
  ownerHost: 'https://one.ie',
  uid: 'agent:scout',
  bearer: 'sk_test',
  unlockSigningKeyB64: genKey(),
  fetchImpl: vi.fn() as unknown as typeof fetch,
  ...overrides,
})

describe('loadAgentToken — happy path', () => {
  it('returns a token when server responds 200 with valid sig', async () => {
    const key = genKey()
    const tokenBase = {
      ciphertextB64: 'AAAA',
      ivB64: 'BBBB',
      kdfVersion: 1,
      expiresAt: Math.floor(Date.now() / 1000) + 60,
      address: '0x37cad0b0271f8e0a51a3d3748d7e648c1582197ad5dbc17956ecb31c63d8de3b',
    }
    const sig = await signToken(tokenBase, 'agent:scout', key)
    const token = { ...tokenBase, sig }

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(token), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      )

    const result = await loadAgentToken(BASE_OPTS({ unlockSigningKeyB64: key, fetchImpl }))
    expect(result.ciphertextB64).toBe('AAAA')
    expect(result.address).toBe(tokenBase.address)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('loadAgentToken — error paths', () => {
  it('401 → AgentBootError bad-bearer', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(loadAgentToken(BASE_OPTS({ fetchImpl }))).rejects.toMatchObject({
      name: 'AgentBootError',
      cause: 'bad-bearer',
    })
  })

  it('403 → AgentBootError bad-bearer (uid mismatch)', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, { status: 403 }))
    await expect(loadAgentToken(BASE_OPTS({ fetchImpl }))).rejects.toMatchObject({ cause: 'bad-bearer' })
  })

  it('404 → AgentBootError no-wallet', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 }))
    await expect(loadAgentToken(BASE_OPTS({ fetchImpl }))).rejects.toMatchObject({ cause: 'no-wallet' })
  })

  it('bad sig → AgentBootError bad-sig', async () => {
    const goodKey = genKey()
    const wrongKey = genKey()
    const tokenBase = {
      ciphertextB64: 'AAAA',
      ivB64: 'BBBB',
      kdfVersion: 1,
      expiresAt: Math.floor(Date.now() / 1000) + 60,
      address: '0x1',
    }
    const sig = await signToken(tokenBase, 'agent:scout', wrongKey)
    const token = { ...tokenBase, sig }

    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(token), { status: 200 }))

    await expect(loadAgentToken(BASE_OPTS({ unlockSigningKeyB64: goodKey, fetchImpl }))).rejects.toMatchObject({
      cause: 'bad-sig',
    })
  })

  it('expired token → AgentBootError expired', async () => {
    const key = genKey()
    const tokenBase = {
      ciphertextB64: 'AAAA',
      ivB64: 'BBBB',
      kdfVersion: 1,
      expiresAt: Math.floor(Date.now() / 1000) - 10, // already expired
      address: '0x1',
    }
    const sig = await signToken(tokenBase, 'agent:scout', key)
    const token = { ...tokenBase, sig }

    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(token), { status: 200 }))

    await expect(loadAgentToken(BASE_OPTS({ unlockSigningKeyB64: key, fetchImpl }))).rejects.toMatchObject({
      cause: 'expired',
    })
  })
})

describe('loadAgentToken — owner offline retry (1.s8)', () => {
  it('retries on 503 then succeeds when owner comes online', async () => {
    const key = genKey()
    const tokenBase = {
      ciphertextB64: 'AAAA',
      ivB64: 'BBBB',
      kdfVersion: 1,
      expiresAt: Math.floor(Date.now() / 1000) + 60,
      address: '0x1',
    }
    const sig = await signToken(tokenBase, 'agent:scout', key)
    const token = { ...tokenBase, sig }

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(token), { status: 200 }))

    // Use a tight backoff via tiny attempts. We can't easily fake timers
    // through arbitrary fetch boundaries here; trust the impl uses setTimeout
    // and just wait briefly. With first attempt sleeping 1s, this test runs ~1s.
    const result = await loadAgentToken(BASE_OPTS({ unlockSigningKeyB64: key, fetchImpl, maxAttempts: 3 }))
    expect(result.ciphertextB64).toBe('AAAA')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  }, 10_000)

  it('exhausts retries when owner stays offline → AgentBootError owner-offline', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 503 }))

    await expect(loadAgentToken(BASE_OPTS({ fetchImpl, maxAttempts: 2 }))).rejects.toMatchObject({
      cause: 'owner-offline',
    })
    // 2 attempts: 1st 503 then sleep 1s, 2nd 503 → throw
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  }, 10_000)
})
