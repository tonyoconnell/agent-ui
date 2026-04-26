/**
 * owner-crypto.test.ts — unit tests for the shared base64url + HMAC primitives.
 * 8 cases, Web Crypto only, no external deps.
 */

import { describe, expect, it } from 'vitest'
import { b64urlDecode, b64urlEncode, decodeKeyEnv, hmacSign, hmacVerify } from './owner-crypto'

// ── Case 1 & 2: b64urlEncode/Decode roundtrip ──────────────────────────────

describe('b64urlEncode / b64urlDecode', () => {
  it('roundtrip on random 32 bytes', () => {
    const original = crypto.getRandomValues(new Uint8Array(32))
    const encoded = b64urlEncode(original)
    const decoded = b64urlDecode(encoded)
    expect(decoded).toEqual(original)
  })

  it('b64urlDecode handles missing padding', () => {
    // Manually strip padding from a known value and confirm decode still works.
    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    const withPad = btoa(String.fromCharCode(...bytes)) // standard base64 with padding
    const noPad = withPad.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
    const decoded = b64urlDecode(noPad)
    expect(decoded).toEqual(bytes)
  })

  it('b64urlDecode throws on invalid characters', () => {
    // A string that cannot be decoded by atob (invalid base64).
    expect(() => b64urlDecode('this is not valid base64!!!')).toThrow()
  })
})

// ── Cases 4–8: HMAC ─────────────────────────────────────────────────────────

describe('hmacSign / hmacVerify', () => {
  const key32 = crypto.getRandomValues(new Uint8Array(32))
  const altKey = crypto.getRandomValues(new Uint8Array(32))

  it('hmacSign is deterministic — same body+key yields same sig', async () => {
    const body = 'canonical|body|string'
    const sig1 = await hmacSign(body, key32)
    const sig2 = await hmacSign(body, key32)
    expect(sig1).toBe(sig2)
  })

  it('hmacSign different keys yield different sigs', async () => {
    const body = 'canonical|body|string'
    const sig1 = await hmacSign(body, key32)
    const sig2 = await hmacSign(body, altKey)
    expect(sig1).not.toBe(sig2)
  })

  it('hmacVerify returns true for a valid sig', async () => {
    const body = 'verify-me'
    const sig = await hmacSign(body, key32)
    const ok = await hmacVerify(body, sig, key32)
    expect(ok).toBe(true)
  })

  it('hmacVerify returns false for tampered body', async () => {
    const body = 'original-body'
    const sig = await hmacSign(body, key32)
    const ok = await hmacVerify('tampered-body', sig, key32)
    expect(ok).toBe(false)
  })

  it('hmacVerify returns false for malformed b64 sig', async () => {
    const ok = await hmacVerify('some-body', '!!!invalid!!!', key32)
    expect(ok).toBe(false)
  })
})

// ── decodeKeyEnv ─────────────────────────────────────────────────────────────

describe('decodeKeyEnv', () => {
  it('decodes a valid base64url env value', () => {
    const raw = crypto.getRandomValues(new Uint8Array(32))
    const encoded = b64urlEncode(raw)
    const decoded = decodeKeyEnv(encoded)
    expect(decoded).toEqual(raw)
  })

  it('throws on empty string', () => {
    expect(() => decodeKeyEnv('')).toThrow('owner-crypto: empty env value')
  })
})
