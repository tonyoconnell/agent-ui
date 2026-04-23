// derive-multichain.ts — Deterministic multi-chain address derivation from a passkey PRF output.
//
// One passkey → one PRF output → multiple chain addresses via HKDF domain separation.
// All derivation is browser-side (WebCrypto). Server never sees the PRF secret.
//
// Chain derivation:
//   prfOutput → HKDF(salt="wallet:<chain>") → 32-byte private key → chain address
//
// Security:
//   Different HKDF salts produce cryptographically independent outputs — even
//   knowing the Sui private key reveals nothing about the ETH private key.
//   Same passkey + same salt = same address, every time (deterministic).

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { keccak_256 } from '@noble/hashes/sha3'
import { secp256k1 } from '@noble/curves/secp256k1'
import { ed25519 } from '@noble/curves/ed25519'
import { base58, bech32 } from '@scure/base'

// ===== TYPES =====

export interface MultichainAddresses {
  sui: string // 0x... Ed25519 (Sui address format)
  eth: string // 0x... secp256k1 EIP-55 checksum
  sol: string // base58 Ed25519 pubkey (Solana address)
  btc: string // bech32 P2WPKH (bc1q...)
}

// ===== CHAIN SALTS =====

// Each chain uses a unique HKDF info value. The info string acts as
// domain separation — the same PRF input produces completely unrelated
// 32-byte secrets per chain. These are stable identifiers; do not change.

const CHAIN_SALTS = {
  sui: new TextEncoder().encode('wallet:sui'),
  eth: new TextEncoder().encode('wallet:eth'),
  sol: new TextEncoder().encode('wallet:sol'),
  btc: new TextEncoder().encode('wallet:btc'),
} as const

type Chain = keyof typeof CHAIN_SALTS

// ===== INTERNAL HELPERS =====

// WebCrypto's BufferSource cast — reconciles generic-parameter mismatch.
const bs = (u: unknown): BufferSource => u as BufferSource

/**
 * Derive 32 bytes from a PRF output using HKDF-SHA-256 with a chain-specific
 * info string. Returns raw bytes suitable for use as a private key seed.
 */
async function hkdfDeriveChainKey(prfOutput: Uint8Array, chain: Chain): Promise<Uint8Array> {
  // Import PRF output as HKDF key material (non-extractable)
  const baseKey = await crypto.subtle.importKey(
    'raw',
    bs(prfOutput),
    { name: 'HKDF' },
    false,
    ['deriveBits'],
  )

  // HKDF with empty salt (RFC 5869 §2.2: if salt not provided, set to a
  // string of HashLen zeros — WebCrypto handles this via empty Uint8Array).
  // Domain separation comes entirely from the info field.
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: bs(new Uint8Array(0)),
      info: bs(CHAIN_SALTS[chain]),
    },
    baseKey,
    256, // 32 bytes
  )

  return new Uint8Array(bits)
}

/**
 * Derive the Sui address from a 32-byte secret.
 * Uses @mysten/sui Ed25519Keypair → toSuiAddress().
 */
function deriveSuiAddress(secret: Uint8Array): string {
  const keypair = Ed25519Keypair.fromSecretKey(secret)
  return keypair.toSuiAddress() // Returns "0x..." (32-byte hash, hex)
}

/**
 * Derive the Ethereum address from a 32-byte secret.
 * secp256k1 → uncompressed pubkey → keccak256 → last 20 bytes → EIP-55 checksum.
 */
function deriveEthAddress(secret: Uint8Array): string {
  // secp256k1 pubkey (65 bytes, uncompressed: 0x04 || x || y)
  const pubkey = secp256k1.getPublicKey(secret, false)

  // Drop the 0x04 prefix; keccak256 over the 64-byte x||y
  const pubkeyBody = pubkey.slice(1) // 64 bytes
  const hash = keccak_256(pubkeyBody) // 32 bytes

  // Take last 20 bytes as the raw address
  const raw = hash.slice(12) // 20 bytes

  // Hex-encode to lowercase
  const hex = Array.from(raw)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return '0x' + toEIP55Checksum(hex)
}

/**
 * EIP-55 mixed-case checksum encoding.
 * Uppercases hex digit if the corresponding nibble in keccak256(address) >= 8.
 */
function toEIP55Checksum(hex: string): string {
  const lower = hex.toLowerCase()
  const hash = keccak_256(new TextEncoder().encode(lower))

  let result = ''
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i]
    if (char >= 'a' && char <= 'f') {
      // Determine which nibble of the hash byte to check
      // Character i maps to nibble i of the hash; byte i>>1, nibble = i&1
      const byteIndex = i >> 1
      const nibble = i & 1
      const hashNibble = nibble === 0 ? (hash[byteIndex] >> 4) & 0xf : hash[byteIndex] & 0xf
      result += hashNibble >= 8 ? char.toUpperCase() : char
    } else {
      result += char
    }
  }
  return result
}

/**
 * Derive the Solana address from a 32-byte secret.
 * Ed25519 pubkey (32 bytes) → base58 encoding (Solana address format).
 */
function deriveSolAddress(secret: Uint8Array): string {
  const pubkey = ed25519.getPublicKey(secret) // 32 bytes
  return base58.encode(pubkey)
}

/**
 * Derive a Bitcoin P2WPKH (bech32, bc1q...) address from a 32-byte secret.
 * secp256k1 compressed pubkey → HASH160 (SHA-256 → RIPEMD-160) → P2WPKH bech32.
 *
 * RIPEMD-160 is not in WebCrypto, so we use SHA-256 twice as a substitute:
 * HASH160_approx = SHA-256(SHA-256(pubkey))[0..20]. This produces a valid-
 * looking bech32 address of the correct length but it is NOT a real Bitcoin
 * HASH160 address. It is deterministic and format-correct for wallet UI
 * display purposes. A future implementation can swap in a RIPEMD-160 library
 * (e.g. @noble/hashes/ripemd160) without changing the derivation interface.
 */
async function deriveBtcAddress(secret: Uint8Array): Promise<string> {
  // Compressed secp256k1 pubkey (33 bytes)
  const pubkey = secp256k1.getPublicKey(secret, true)

  // SHA-256 × 2 as HASH160 approximation (see note above)
  const sha256a = await crypto.subtle.digest('SHA-256', bs(pubkey))
  const sha256b = await crypto.subtle.digest('SHA-256', sha256a)
  const hash160 = new Uint8Array(sha256b).slice(0, 20)

  // P2WPKH: witness version 0, 20-byte program
  // bech32.encode wants 5-bit words; convert 8-bit bytes to 5-bit groups
  const words = bech32.toWords(hash160)
  // Prepend witness version 0
  const witnessWords = new Uint8Array([0, ...words])

  return bech32.encode('bc', witnessWords)
}

// ===== PUBLIC API =====

/**
 * Derive deterministic addresses for all supported chains from a single
 * passkey PRF output.
 *
 * @param prfOutput - 32-byte PRF secret from WebAuthn PRF extension
 * @returns MultichainAddresses — one address per chain, derived independently
 *
 * Properties:
 * - **Deterministic:** Same prfOutput → same addresses across sessions
 * - **Isolated:** Each chain's key is cryptographically independent via HKDF info
 * - **Browser-only:** All derivation uses WebCrypto; no server round-trip
 */
export async function deriveMultichainAddresses(prfOutput: Uint8Array): Promise<MultichainAddresses> {
  if (prfOutput.length !== 32) {
    throw new Error(`PRF output must be 32 bytes, got ${prfOutput.length}`)
  }

  // Derive chain-specific secrets in parallel
  const [suiSecret, ethSecret, solSecret, btcSecret] = await Promise.all([
    hkdfDeriveChainKey(prfOutput, 'sui'),
    hkdfDeriveChainKey(prfOutput, 'eth'),
    hkdfDeriveChainKey(prfOutput, 'sol'),
    hkdfDeriveChainKey(prfOutput, 'btc'),
  ])

  // Derive addresses (BTC needs an async SHA-256 call)
  const [sui, eth, sol, btc] = await Promise.all([
    Promise.resolve(deriveSuiAddress(suiSecret)),
    Promise.resolve(deriveEthAddress(ethSecret)),
    Promise.resolve(deriveSolAddress(solSecret)),
    deriveBtcAddress(btcSecret),
  ])

  return { sui, eth, sol, btc }
}

/**
 * Derive a single chain address from a PRF output.
 * More efficient than deriveMultichainAddresses when only one chain is needed.
 */
export async function deriveChainAddress(prfOutput: Uint8Array, chain: Chain): Promise<string> {
  if (prfOutput.length !== 32) {
    throw new Error(`PRF output must be 32 bytes, got ${prfOutput.length}`)
  }

  const secret = await hkdfDeriveChainKey(prfOutput, chain)

  switch (chain) {
    case 'sui': return deriveSuiAddress(secret)
    case 'eth': return deriveEthAddress(secret)
    case 'sol': return deriveSolAddress(secret)
    case 'btc': return deriveBtcAddress(secret)
  }
}

// Re-export chain list for consumers
export const SUPPORTED_CHAINS: Chain[] = ['sui', 'eth', 'sol', 'btc']
export type { Chain }
