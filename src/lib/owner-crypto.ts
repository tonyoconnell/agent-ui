/**
 * owner-crypto — shared base64url + HMAC primitives for the owner-tier
 * surfaces. Web Crypto only. No external deps.
 *
 * History note: this module deduplicates ~5-6 ad-hoc implementations
 * scattered across endpoints, helpers, and the daemon. Replace local
 * helpers with imports here when polishing.
 */

const _enc = new TextEncoder()

/** Encode raw bytes as base64url (no padding, web-safe). */
export function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Decode a base64url string to raw bytes. Throws on malformed input. */
export function b64urlDecode(s: string): Uint8Array {
  const std = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (std.length % 4)) % 4)
  const bin = atob(std + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** HMAC-SHA-256 over `body` with `keyBytes`; returns base64url-encoded sig. */
export async function hmacSign(body: string, keyBytes: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, _enc.encode(body))
  return b64urlEncode(new Uint8Array(sig))
}

/** Verify base64url-encoded HMAC-SHA-256 signature against canonical `body`.
 *  Returns true on match (constant-time). */
export async function hmacVerify(body: string, sigB64: string, keyBytes: Uint8Array): Promise<boolean> {
  let sigBytes: Uint8Array
  try {
    sigBytes = b64urlDecode(sigB64)
  } catch {
    return false
  }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  return crypto.subtle.verify('HMAC', key, sigBytes, _enc.encode(body))
}

/** Convenience: import a base64url-encoded raw key (32 bytes typical). */
export function decodeKeyEnv(envValue: string): Uint8Array {
  if (!envValue) throw new Error('owner-crypto: empty env value')
  return b64urlDecode(envValue)
}
