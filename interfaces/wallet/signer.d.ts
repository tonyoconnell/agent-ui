import type { Ed25519Seed, Ed25519Signature, CredId } from "../types-crypto"
import type { TxBytes, SuiAddress } from "../types-sui"

/**
 * Sign transaction bytes with an Ed25519 seed.
 *
 * Lifecycle:
 * 1. Seed imported as non-extractable CryptoKey (WebCrypto native)
 * 2. Transaction bytes signed with SubtleCrypto.sign() via Ed25519
 * 3. Raw seed bytes wiped within 1ms of signing completion
 * 4. Signature returned as Ed25519Signature (64 bytes)
 *
 * Guards:
 * - Seed never stored after signing
 * - Seed never logged or transmitted
 * - Import uses extractable:false; impossible to recover raw bytes
 *
 * @param txBytes - Serialized Sui transaction (from tx.toBcs())
 * @param seed - Ed25519 seed material (32 bytes)
 * @returns Promise<Ed25519Signature> — 64-byte Ed25519 signature
 * @throws WalletError — "sign-failed" if SubtleCrypto.sign() fails
 */
export declare function signTx(
  txBytes: TxBytes,
  seed: Ed25519Seed
): Promise<Ed25519Signature>

/**
 * Full sign flow for State 2+ wallets with passkey-backed seeds.
 *
 * Lifecycle (Touch ID → PRF → unwrap seed → sign → wipe):
 * 1. User presses confirm → WebAuthn ceremony starts
 * 2. Platform calls PRF extension with credId and input
 * 3. PRF output unwraps the sealed seed from vault
 * 4. signTx() imports seed and signs transaction
 * 5. Seed wiped, vault re-seals; only signature leaves device
 *
 * Guards:
 * - Seed never visible to JavaScript after unwrap
 * - PRF output never stored or logged
 * - Credential ID identifies the security key; actual keying material stays in hardware
 *
 * @param txBytes - Serialized Sui transaction (from tx.toBcs())
 * @param credId - WebAuthn credential ID (opaque authenticator reference)
 * @returns Promise<Uint8Array> — Sui-formatted signature bytes (64 bytes + metadata)
 * @throws WalletError — "biometric-failed" | "prf-failed" | "sign-failed" | "network-timeout"
 */
export declare function signWithPasskey(
  txBytes: TxBytes,
  credId: CredId
): Promise<Uint8Array>

/**
 * Verify a signature against a transaction and address.
 *
 * Used by co-sign reviewers to validate signature integrity before approval.
 * Performs Ed25519 verification and checks that the derived address matches.
 *
 * Guards:
 * - Verification is deterministic; same txBytes + sig + address always produces same result
 * - Does not grant approval; only confirms signature is valid
 * - Safe to call on untrusted input (no timing attacks, constant-time compare)
 *
 * @param txBytes - Serialized Sui transaction (from tx.toBcs())
 * @param sig - Ed25519 signature to verify
 * @param address - Expected signer address (Sui mainnet format)
 * @returns Promise<boolean> — true if signature is valid and address matches
 * @throws WalletError — "verify-failed" if SubtleCrypto.verify() throws
 */
export declare function verifySig(
  txBytes: TxBytes,
  sig: Ed25519Signature,
  address: SuiAddress
): Promise<boolean>
