import type { Ed25519Seed, PrfOutput, AesKey, Ciphertext, IV, CredId } from "../types-crypto"
import type { PasskeyPrfWrapping } from "../types-wallet"

/**
 * Deterministic salt for PRF derivation.
 * Hardcoded string: "one.ie-wallet-v1"
 * Used in HKDF-SHA256 to bind key material to this wallet version.
 */
export declare const PRF_SALT: Uint8Array

/**
 * Derive AES-256-GCM key from passkey PRF output via HKDF-SHA256.
 * @param prf - PRF output from WebAuthn ceremony
 * @param info - Optional HKDF info string (defaults to PRF_SALT)
 * @returns AES-256-GCM key, non-extractable (browser-enforced)
 */
export declare function prfToAesKey(prf: PrfOutput, info?: string): Promise<AesKey>

/**
 * Encrypt Ed25519 seed with AES-256-GCM.
 * @param seed - The seed material to wrap
 * @param key - AES-256-GCM key from prfToAesKey
 * @returns Object with iv and ciphertext (both Uint8Array)
 *
 * Format: IV (12 bytes) | ciphertext (n bytes with 16-byte auth tag included)
 */
export declare function wrapSeed(seed: Ed25519Seed, key: AesKey): Promise<{ iv: IV; ciphertext: Ciphertext }>

/**
 * Decrypt PasskeyPrfWrapping to recover Ed25519 seed.
 * @param wrapping - The PasskeyPrfWrapping object (iv + ciphertext)
 * @param key - AES-256-GCM key from prfToAesKey
 * @returns Decrypted Ed25519 seed. Caller must wipe after use.
 *
 * Throws if authentication fails (ciphertext tampered or wrong key).
 */
export declare function unwrapSeed(wrapping: PasskeyPrfWrapping, key: AesKey): Promise<Ed25519Seed>

/**
 * Full wrapping flow: passkey Touch ID → PRF → HKDF-AES → encrypt seed.
 * @param seed - The Ed25519 seed to wrap
 * @param credId - WebAuthn credential ID (passkey identifier)
 * @returns PasskeyPrfWrapping object ready for storage
 *
 * Steps:
 * 1. Call WebAuthn.get() with PRF extension → PrfOutput
 * 2. prfToAesKey(prf) → AES key
 * 3. wrapSeed(seed, key) → iv + ciphertext
 * 4. Return { type: "passkey-prf", credId, iv, ciphertext }
 *
 * Caller must ensure credId matches the passkey used in step 1.
 */
export declare function wrapWithPasskey(
  seed: Ed25519Seed,
  credId: CredId
): Promise<PasskeyPrfWrapping>

/**
 * Full unwrapping flow: passkey Touch ID → PRF → HKDF-AES → decrypt seed.
 * @param wrapping - PasskeyPrfWrapping object from storage
 * @returns Ed25519 seed. Caller must wipe after use.
 *
 * Steps:
 * 1. Call WebAuthn.get() with PRF extension (credId from wrapping) → PrfOutput
 * 2. prfToAesKey(prf) → AES key
 * 3. unwrapSeed(wrapping, key) → Ed25519 seed
 * 4. Return seed
 *
 * Throws if PRF fails, key derivation fails, or decryption fails.
 */
export declare function unwrapWithPasskey(
  wrapping: PasskeyPrfWrapping
): Promise<Ed25519Seed>
