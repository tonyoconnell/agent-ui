/**
 * SOL chain address derivation + payment URI.
 *
 * Derives an Ed25519 keypair from (seed, uid) via the shared _derive helper,
 * then encodes the 32-byte public key as a base58 Solana address.
 *
 * Solana address = base58(ed25519-pubkey).
 */

import { ed25519 } from '@noble/curves/ed25519.js'
import { deriveSecret } from './_derive.ts'

// ─── base58 ──────────────────────────────────────────────────────────────────

const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function encodeBase58(bytes: Uint8Array): string {
  // Count leading zeros
  let leadingZeros = 0
  for (const b of bytes) {
    if (b !== 0) break
    leadingZeros++
  }

  // Convert to big integer
  let num = 0n
  for (const b of bytes) {
    num = num * 256n + BigInt(b)
  }

  // Convert to base58
  let result = ''
  while (num > 0n) {
    const remainder = Number(num % 58n)
    num = num / 58n
    result = BASE58_CHARS[remainder] + result
  }

  return '1'.repeat(leadingZeros) + result
}

// ─── derivation ──────────────────────────────────────────────────────────────

/**
 * Derive a deterministic Solana address for a uid.
 * Returns a base58-encoded Ed25519 public key (standard Solana address format).
 */
export function deriveAddressSol(uid: string): string {
  const secret = deriveSecret('sol', uid)
  const pubKey = ed25519.getPublicKey(secret) // 32 bytes
  return encodeBase58(pubKey)
}

// ─── payment URI ─────────────────────────────────────────────────────────────

/**
 * Build a Solana payment URI.
 * Format: solana:<address>?amount=<lamports>
 */
export function buildPaymentUriSol(addr: string, amountLamports: bigint): string {
  return `solana:${addr}?amount=${amountLamports}`
}
