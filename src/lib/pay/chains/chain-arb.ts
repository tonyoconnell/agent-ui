/**
 * ARB (Arbitrum One) chain address derivation + payment URI.
 *
 * Arbitrum is EVM-compatible (chainId=42161). Address derivation is identical to ETH
 * (secp256k1 → keccak256 → EIP-55 checksum). URI uses EIP-681 with chainId.
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { deriveSecret } from './_derive.ts'

const ARB_CHAIN_ID = 42161

// ─── shared EVM address logic ─────────────────────────────────────────────────

function pubkeyToChecksumAddress(pubKey: Uint8Array): string {
  const pubKeyBody = pubKey.slice(1) // drop 0x04 prefix → 64 bytes
  const hash = keccak_256(pubKeyBody)
  const addrBytes = hash.slice(12) // last 20 bytes
  const hex = Array.from(addrBytes)
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

// ─── derivation ──────────────────────────────────────────────────────────────

/**
 * Derive a deterministic Arbitrum One address for a uid.
 * Returns an EIP-55 checksummed 0x-prefixed address.
 */
export function deriveAddressArb(uid: string): string {
  const secret = deriveSecret('arb', uid)
  const pubKey = secp256k1.getPublicKey(secret, false) // 65 bytes, uncompressed
  return pubkeyToChecksumAddress(pubKey)
}

// ─── payment URI ─────────────────────────────────────────────────────────────

/**
 * Build an Arbitrum One payment URI (EIP-681 with chainId).
 * Format: eip681:<address>@42161?value=<amountWei>
 */
export function buildPaymentUriArb(addr: string, amountWei: bigint): string {
  return `eip681:${addr}@${ARB_CHAIN_ID}?value=${amountWei}`
}
