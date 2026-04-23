/**
 * ETH chain address derivation + payment URI.
 *
 * Derives a secp256k1 keypair from (seed, uid) via the shared _derive helper,
 * then computes the EIP-55 checksummed Ethereum address from the public key.
 *
 * ETH address = keccak256(uncompressed-pubkey[1:])[12:] with EIP-55 checksum.
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { deriveSecret } from './_derive.ts'

// ─── derivation ──────────────────────────────────────────────────────────────

/** Compute EIP-55 checksummed address from a 20-byte array. */
function toChecksumAddress(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHex = Array.from(keccak_256(new TextEncoder().encode(hex)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const checksummed = hex
    .split('')
    .map((c, i) => (parseInt(hashHex[i], 16) >= 8 ? c.toUpperCase() : c))
    .join('')
  return `0x${checksummed}`
}

/**
 * Derive a deterministic Ethereum address for a uid.
 * Returns an EIP-55 checksummed 0x-prefixed address.
 */
export function deriveAddressEth(uid: string): string {
  const secret = deriveSecret('eth', uid)
  const pubKey = secp256k1.getPublicKey(secret, false) // 65 bytes, uncompressed
  // Drop the 0x04 prefix → 64 bytes, keccak256 → take last 20 bytes
  const pubKeyBody = pubKey.slice(1) // 64 bytes
  const hash = keccak_256(pubKeyBody) // 32 bytes
  const addrBytes = hash.slice(12) // last 20 bytes
  return toChecksumAddress(addrBytes)
}

// ─── payment URI ─────────────────────────────────────────────────────────────

/**
 * Build an Ethereum payment URI (EIP-681).
 * Format: ethereum:<address>?value=<amountWei>
 */
export function buildPaymentUriEth(addr: string, amountWei: bigint): string {
  return `ethereum:${addr}?value=${amountWei}`
}
