// vault/crypto.ts — AES-GCM, HKDF, PBKDF2, HMAC primitives.
// All keys non-extractable. PBKDF2: 600k iter (OWASP 2024). HKDF: empty salt, info-based domain separation.

import type { EncryptedRecord } from './types'
import { VaultError } from './types'

// ===== CONSTANTS =====

export const PBKDF2_ITERATIONS = 600_000
export const AES_KEY_LENGTH = 256
export const IV_LENGTH = 12
export const SALT_LENGTH = 32

const SCHEMA_VERSION = 2

// ===== RANDOM =====

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length)
  crypto.getRandomValues(out)
  return out
}

// ===== ENCODING =====

// Chunked to avoid String.fromCharCode(...bytes) stack overflow on large inputs.
const B64_CHUNK = 0x8000

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += B64_CHUNK) {
    const chunk = bytes.subarray(i, i + B64_CHUNK)
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length % 2 !== 0) throw new VaultError('invalid hex length', 'crypto-error')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(clean.substr(i * 2, 2), 16)
    if (Number.isNaN(byte)) throw new VaultError('invalid hex char', 'crypto-error')
    out[i] = byte
  }
  return out
}

const TEXT_ENCODER = new TextEncoder()
const TEXT_DECODER = new TextDecoder()

export function utf8Encode(s: string): Uint8Array {
  return TEXT_ENCODER.encode(s)
}

export function utf8Decode(b: Uint8Array): string {
  return TEXT_DECODER.decode(b)
}

// TS 5.9 narrows TextEncoder/Uint8Array to <ArrayBufferLike>, but WebCrypto
// signatures want BufferSource (ArrayBufferView | ArrayBuffer with concrete
// ArrayBuffer). Shape is correct at runtime — this cast reconciles the
// generic-parameter mismatch only. See microsoft/TypeScript#58468.
const bs = (u: unknown): BufferSource => u as BufferSource

// ===== HASH =====

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest('SHA-256', bs(data))
  return new Uint8Array(buf)
}

// ===== KEY DERIVATION =====

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  usage: KeyUsage[] = ['encrypt', 'decrypt'],
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', bs(utf8Encode(password)), { name: 'PBKDF2' }, false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: bs(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    usage,
  )
}

// PBKDF2 → 32 bytes. Use this when you need a uniform secret to feed HKDF (e.g.
// the password-unlock path mirrors the passkey-PRF path, so vault.ts can derive
// per-wallet subkeys the same way regardless of how the user unlocked.
export async function deriveSecretFromPassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey('raw', bs(utf8Encode(password)), { name: 'PBKDF2' }, false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bs(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    256,
  )
  return new Uint8Array(bits)
}

export async function importMasterSecret(secret: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bs(secret), { name: 'HKDF' }, false, ['deriveKey', 'deriveBits'])
}

/**
 * Derive the 32-byte vault master from a WebAuthn PRF output.
 * Same passkey + same PRF salt = same 32 bytes, forever.
 * This is the root of the deterministic wallet derivation chain:
 *   Touch ID → PRF → prfToMaster() → HKDF(chain/index) → keypair → address
 */
export async function prfToMaster(prfSecret: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', bs(prfSecret), { name: 'HKDF' }, false, ['deriveBits'])
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: bs(new Uint8Array(0)),
        info: bs(utf8Encode('one.ie/vault/master/v2')),
      },
      key,
      256,
    ),
  )
}

export async function deriveSubKey(baseKey: CryptoKey, info: string): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      // RFC 5869 permits empty salt; domain separation comes from `info`.
      salt: bs(new Uint8Array(0)),
      info: bs(utf8Encode(info)),
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ===== ENCRYPT / DECRYPT =====

export async function encryptWithKey(plaintext: Uint8Array, key: CryptoKey, info: string): Promise<EncryptedRecord> {
  // 12 random bytes → 2^96 IV space, safe since keys rotate per-wallet (NIST SP 800-38D).
  const iv = randomBytes(IV_LENGTH)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bs(iv) }, key, bs(plaintext))
  return {
    ciphertext: new Uint8Array(ct),
    iv,
    info,
    version: SCHEMA_VERSION,
  }
}

export async function decryptWithKey(record: EncryptedRecord, key: CryptoKey): Promise<Uint8Array> {
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bs(record.iv) }, key, bs(record.ciphertext))
    return new Uint8Array(pt)
  } catch {
    // WebCrypto surfaces auth-tag failure as a generic error — translate to domain code.
    throw new VaultError('decryption failed', 'tamper-detected')
  }
}

// ===== HIGH-LEVEL HELPERS =====

export async function encryptUnderMaster(
  plaintext: string | Uint8Array,
  masterKey: CryptoKey,
  info: string,
): Promise<EncryptedRecord> {
  const bytes = typeof plaintext === 'string' ? utf8Encode(plaintext) : plaintext
  const sub = await deriveSubKey(masterKey, info)
  return encryptWithKey(bytes, sub, info)
}

export async function decryptUnderMaster(record: EncryptedRecord, masterKey: CryptoKey): Promise<string> {
  const sub = await deriveSubKey(masterKey, record.info)
  const pt = await decryptWithKey(record, sub)
  return utf8Decode(pt)
}

// ===== CONSTANT-TIME COMPARE =====

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  // Accumulate XOR of all bytes (plus length mismatch) — never short-circuit.
  const len = Math.max(a.length, b.length)
  let acc = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    const av = i < a.length ? a[i] : 0
    const bv = i < b.length ? b[i] : 0
    acc |= av ^ bv
  }
  return acc === 0
}
