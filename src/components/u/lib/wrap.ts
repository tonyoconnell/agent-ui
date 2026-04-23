// wrap.ts — Passkey PRF seed wrapping (State 2 core).
// PRF output → HKDF-SHA256 → AES-256-GCM key → encrypt/decrypt Ed25519 seed.
//
// Reuses vault/passkey.ts for WebAuthn ceremony and vault/crypto.ts for AES-GCM.
// Never stores the seed or the AES key — both exist only in memory during the call.

import type { Ed25519Seed, PrfOutput, AesKey, Ciphertext, IV, CredId } from '../../../../interfaces/types-crypto'
import type { PasskeyPrfWrapping } from '../../../../interfaces/types-wallet'
import { VaultError } from './vault/types'

// ===== CONSTANTS =====

/**
 * Deterministic HKDF salt that binds key material to this wallet version.
 * All wrapping operations use this constant — never a random value.
 */
export const PRF_SALT: Uint8Array = new TextEncoder().encode('one.ie-wallet-v1')

// TS 5.9 narrows TextEncoder/Uint8Array to <ArrayBufferLike>, but WebCrypto
// signatures want BufferSource (ArrayBufferView | ArrayBuffer with concrete
// ArrayBuffer). Shape is correct at runtime — this cast reconciles the
// generic-parameter mismatch only.
const bs = (u: unknown): BufferSource => u as BufferSource

// ===== PRF → AES KEY =====

/**
 * Derive AES-256-GCM key from passkey PRF output via HKDF-SHA256.
 * @param prf - 32-byte PRF output from WebAuthn ceremony
 * @param info - HKDF info string for domain separation (defaults to "one.ie-wallet-v1")
 * @returns AES-256-GCM key, non-extractable (browser-enforced)
 */
export async function prfToAesKey(prf: PrfOutput, info?: string): Promise<AesKey> {
  const infoBytes = info ? new TextEncoder().encode(info) : PRF_SALT

  // Import PRF bytes as HKDF base key material
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    bs(prf),
    { name: 'HKDF' },
    false,
    ['deriveBits', 'deriveKey'],
  )

  // Derive AES-256-GCM key via HKDF-SHA256
  // RFC 5869: empty salt is fine when input key material (PRF) is already uniformly random.
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: bs(new Uint8Array(0)),
      info: bs(infoBytes),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )

  return aesKey as AesKey
}

// ===== WRAP / UNWRAP =====

/**
 * Encrypt Ed25519 seed with AES-256-GCM.
 * @param seed - The 32-byte seed to wrap
 * @param key - AES-256-GCM key from prfToAesKey
 * @returns iv (12 bytes) and ciphertext (seed bytes + 16-byte auth tag)
 */
export async function wrapSeed(seed: Ed25519Seed, key: AesKey): Promise<{ iv: IV; ciphertext: Ciphertext }> {
  // 12 random bytes — 2^96 IV space, safe for single-use keys (NIST SP 800-38D)
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)

  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: bs(iv) },
    key,
    bs(seed),
  )

  return {
    iv: iv as IV,
    ciphertext: new Uint8Array(ct) as Ciphertext,
  }
}

/**
 * Decrypt PasskeyPrfWrapping to recover Ed25519 seed.
 * @param wrapping - Object with iv + ciphertext
 * @param key - AES-256-GCM key from prfToAesKey
 * @returns Decrypted Ed25519 seed. Caller must wipe after use.
 * @throws VaultError('tamper-detected') if auth tag fails
 */
export async function unwrapSeed(wrapping: PasskeyPrfWrapping, key: AesKey): Promise<Ed25519Seed> {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bs(wrapping.iv) },
      key,
      bs(wrapping.ciphertext),
    )
    return new Uint8Array(pt) as Ed25519Seed
  } catch {
    // WebCrypto surfaces auth-tag failure as a generic error — translate to domain code.
    throw new VaultError('decryption failed — seed tampered or wrong passkey', 'tamper-detected')
  }
}

// ===== FULL PASSKEY FLOWS =====

/**
 * Get PRF output from WebAuthn using a specific credId + salt.
 * Internal helper shared by wrapWithPasskey and unwrapWithPasskey.
 */
async function getPrfOutput(credId: CredId, salt: Uint8Array): Promise<PrfOutput> {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    throw new VaultError('WebAuthn requires secure context (HTTPS or localhost)', 'passkey-unsupported')
  }
  if (typeof window.PublicKeyCredential === 'undefined' || !navigator.credentials) {
    throw new VaultError('WebAuthn API not available', 'passkey-unsupported')
  }

  const challenge = new Uint8Array(32)
  crypto.getRandomValues(challenge)

  const options: PublicKeyCredentialRequestOptions = {
    challenge: bs(challenge),
    rpId: window.location.hostname,
    allowCredentials: [{ id: credId as BufferSource, type: 'public-key' }],
    userVerification: 'required',
    timeout: 60_000,
    extensions: {
      prf: { eval: { first: salt } },
    } as PublicKeyCredentialRequestOptions['extensions'],
  }

  let assertion: PublicKeyCredential | null
  try {
    assertion = (await navigator.credentials.get({ publicKey: options })) as PublicKeyCredential | null
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'NotAllowedError' || name === 'AbortError') {
      throw new VaultError('Passkey authentication cancelled', 'passkey-cancelled')
    }
    throw new VaultError(
      `Passkey authentication failed: ${(err as Error)?.message ?? String(err)}`,
      'passkey-unsupported',
    )
  }

  if (!assertion) {
    throw new VaultError('Passkey returned no credential', 'passkey-unsupported')
  }

  // Extract PRF first result
  const ext = assertion.getClientExtensionResults() as {
    prf?: { results?: { first?: ArrayBuffer | Uint8Array } }
  }
  const first = ext?.prf?.results?.first
  if (!first) {
    throw new VaultError('PRF not supported by authenticator', 'passkey-unsupported')
  }

  const bytes = first instanceof Uint8Array ? first : new Uint8Array(first)
  if (bytes.byteLength !== 32) {
    throw new VaultError(`PRF output unexpected length: ${bytes.byteLength}`, 'crypto-error')
  }

  return bytes as PrfOutput
}

/**
 * Full wrapping flow: passkey Touch ID → PRF → HKDF-AES → encrypt seed.
 * @param seed - The Ed25519 seed to protect
 * @param credId - WebAuthn credential ID (passkey identifier)
 * @returns PasskeyPrfWrapping ready for IndexedDB storage
 */
export async function wrapWithPasskey(seed: Ed25519Seed, credId: CredId): Promise<PasskeyPrfWrapping> {
  // 1. PRF ceremony with deterministic PRF_SALT
  const prf = await getPrfOutput(credId, PRF_SALT)

  // 2. HKDF-SHA256 → AES-256-GCM key
  const key = await prfToAesKey(prf)

  // 3. AES-GCM encrypt seed
  const { iv, ciphertext } = await wrapSeed(seed, key)

  // 4. Return storable wrapping object
  return {
    type: 'passkey-prf',
    credId: credId instanceof ArrayBuffer ? credId : (credId as ArrayBuffer),
    iv,
    ciphertext,
  }
}

/**
 * Full unwrapping flow: passkey Touch ID → PRF → HKDF-AES → decrypt seed.
 * @param wrapping - PasskeyPrfWrapping from IndexedDB storage
 * @returns Ed25519 seed. Caller must wipe (fill-zero) after use.
 * @throws VaultError if PRF, key derivation, or decryption fails
 */
export async function unwrapWithPasskey(wrapping: PasskeyPrfWrapping): Promise<Ed25519Seed> {
  // 1. PRF ceremony — credId comes from the wrapping
  const prf = await getPrfOutput(wrapping.credId as CredId, PRF_SALT)

  // 2. HKDF-SHA256 → AES-256-GCM key (same derivation as wrapWithPasskey)
  const key = await prfToAesKey(prf)

  // 3. AES-GCM decrypt → Ed25519 seed
  return unwrapSeed(wrapping, key)
}
