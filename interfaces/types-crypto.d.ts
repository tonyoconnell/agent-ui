/**
 * Cryptographic Material Type Definitions (Tier 0)
 *
 * Branded primitive types for type-safe handling of cryptographic data.
 * Each type carries semantic intent through the TypeScript type system,
 * preventing accidental substitution of incompatible byte buffers.
 *
 * Brand pattern: T & { readonly _brand: "TypeName" }
 * - Unique at compile time only
 * - Zero runtime overhead
 * - Requires intentional cast or dedicated constructor
 */

/**
 * Ed25519 seed material (32 bytes).
 * Derived from BIP39 mnemonic or platform entropy.
 * Guards: never transmitted, never logged, fill-zero on drop.
 */
export type Ed25519Seed = Uint8Array & { readonly _brand: "Ed25519Seed" }

/**
 * Ed25519 signature over a message.
 * Proof of signing authority. 64 bytes.
 * Immutable. Safe to transmit.
 */
export type Ed25519Signature = Uint8Array & { readonly _brand: "Ed25519Signature" }

/**
 * PRF (Pseudo-Random Function) output from passkey.
 * Derived from WebAuthn ceremony and user identity material.
 * Variable length, usually 32+ bytes.
 * Guards: short-lived, never persisted unencrypted.
 */
export type PrfOutput = Uint8Array & { readonly _brand: "PrfOutput" }

/**
 * AES-256-GCM symmetric key (CryptoKey object).
 * Unwrap only inside vault — never as raw bytes.
 * Guards: inaccessible to JavaScript after wrapping, browser-enforced.
 */
export type AesKey = CryptoKey & { readonly _brand: "AesKey" }

/**
 * AES-256-GCM authenticated ciphertext.
 * Format: [iv (12 bytes) | tag (16 bytes) | encrypted (n bytes)].
 * Safe to store and transmit.
 */
export type Ciphertext = Uint8Array & { readonly _brand: "Ciphertext" }

/**
 * Initialization Vector for AES-GCM (12 bytes / 96 bits).
 * Non-repeating per key. Safe to transmit with ciphertext.
 */
export type IV = Uint8Array & { readonly _brand: "IV" }

/**
 * WebAuthn credential ID (public identifier).
 * Opaque bytes chosen by authenticator. 32–128 bytes typical.
 * Safe to store, transmit, use as database key.
 */
export type CredId = ArrayBuffer & { readonly _brand: "CredId" }

/**
 * Raw Uint8Array holding seed material (≤32 bytes).
 * Short-lived transient. Caller is responsible for:
 * - Fill with zeros when done (crypto.getRandomValues(buf))
 * - Never log or transmit
 * - Drop before returning to user
 *
 * Lifecycle: constructor → use → fill-zero → out of scope.
 */
export type SeedBuffer = Uint8Array & { readonly _brand: "SeedBuffer" }
