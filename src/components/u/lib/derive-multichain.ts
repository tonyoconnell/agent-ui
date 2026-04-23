// derive-multichain.ts — Deterministic multi-chain address derivation from a passkey PRF output.
//
// One passkey → one PRF output → multiple chain addresses via HKDF domain separation.
// All derivation is browser-side (WebCrypto). Server never sees the PRF secret.
//
// Chain derivation:
//   prfOutput → HKDF(info="wallet:<chain>") → 32-byte private key → chain address
//
// Security:
//   Different HKDF info strings produce cryptographically independent outputs.
//   Same passkey + same info = same address, every time (deterministic).

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { base58 } from '@scure/base'

// ===== TYPES =====

export interface MultichainAddresses {
  sui: string // 0x... Ed25519 (Sui address format)
  eth: string // 0x... secp256k1 EIP-55 checksum
  sol: string // base58 Ed25519 pubkey (Solana address)
  btc: string // bech32 P2WPKH (bc1q...)
}

// ===== CHAIN SALTS (HKDF info strings) =====

// Each chain uses a unique HKDF info value for domain separation.
// The same PRF input produces completely unrelated 32-byte secrets per chain.
// These are stable identifiers — do not change after wallets have been created.

const CHAIN_SALTS = {
  sui: new TextEncoder().encode('wallet:sui'),
  eth: new TextEncoder().encode('wallet:eth'),
  sol: new TextEncoder().encode('wallet:sol'),
  btc: new TextEncoder().encode('wallet:btc'),
} as const

export type Chain = keyof typeof CHAIN_SALTS

export const SUPPORTED_CHAINS: Chain[] = ['sui', 'eth', 'sol', 'btc']

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

  // HKDF with empty salt (RFC 5869: if salt not provided, set to a string of
  // HashLen zeros — WebCrypto handles this via empty Uint8Array).
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
 * Mirrors chain-arb.ts pubkeyToChecksumAddress pattern.
 */
function deriveEthAddress(secret: Uint8Array): string {
  const pubKey = secp256k1.getPublicKey(secret, false) // 65 bytes, uncompressed
  const pubKeyBody = pubKey.slice(1) // drop 0x04 prefix → 64 bytes
  const hash = keccak_256(pubKeyBody)
  const addrBytes = hash.slice(12) // last 20 bytes
  const hex = Array.from(addrBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  // EIP-55 checksum: uppercase hex digit if the corresponding nibble of
  // keccak256(hex-address) >= 8
  const hashHex = Array.from(keccak_256(new TextEncoder().encode(hex)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const checksummed = hex
    .split('')
    .map((c, i) => (parseInt(hashHex[i], 16) >= 8 ? c.toUpperCase() : c))
    .join('')
  return '0x' + checksummed
}

/**
 * Derive the Solana address from a 32-byte secret.
 * Ed25519 pubkey (32 bytes) → base58 encoding (Solana address format).
 */
function deriveSolAddress(secret: Uint8Array): string {
  const pubkey = ed25519.getPublicKey(secret) // 32 bytes
  return base58.encode(pubkey)
}

// ─── RIPEMD-160 (pure JS, matches btc.ts pattern) ────────────────────────────
// Minimal implementation sufficient for hash160. Same logic as btc.ts.

function ripemd160(data: Uint8Array): Uint8Array {
  const KL = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
  const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]
  const SL = [
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12,
    15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14,
    15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11,
    8, 5, 6,
  ]
  const SR = [
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7,
    12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11,
    14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13,
    11, 11,
  ]
  const RL = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9,
    5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8,
    12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
  ]
  const RR = [
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8,
    12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11,
    15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
  ]

  function f(j: number, x: number, y: number, z: number): number {
    if (j < 16) return x ^ y ^ z
    if (j < 32) return (x & y) | (~x & z)
    if (j < 48) return (x | ~y) ^ z
    if (j < 64) return (x & z) | (y & ~z)
    return x ^ (y | ~z)
  }

  function rol32(x: number, n: number): number {
    return ((x << n) | (x >>> (32 - n))) >>> 0
  }

  const msgLen = data.length
  const bitLen = msgLen * 8
  const padLen = msgLen % 64 < 56 ? 56 - (msgLen % 64) : 120 - (msgLen % 64)
  const padded = new Uint8Array(msgLen + padLen + 8)
  padded.set(data)
  padded[msgLen] = 0x80
  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 8, bitLen >>> 0, true)
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32) >>> 0, true)

  let [h0, h1, h2, h3, h4] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]

  for (let i = 0; i < padded.length; i += 64) {
    const X: number[] = []
    for (let j = 0; j < 16; j++) X.push(dv.getUint32(i + j * 4, true))

    let [al, bl, cl, dl, el] = [h0, h1, h2, h3, h4]
    let [ar, br, cr, dr, er] = [h0, h1, h2, h3, h4]

    for (let j = 0; j < 80; j++) {
      const round = Math.floor(j / 16)
      let T = (rol32((al + f(j, bl, cl, dl) + X[RL[j]] + KL[round]) >>> 0, SL[j]) + el) >>> 0
      al = el; el = dl; dl = rol32(cl, 10); cl = bl; bl = T
      T = (rol32((ar + f(79 - j, br, cr, dr) + X[RR[j]] + KR[round]) >>> 0, SR[j]) + er) >>> 0
      ar = er; er = dr; dr = rol32(cr, 10); cr = br; br = T
    }

    const T = (h1 + cl + dr) >>> 0
    h1 = (h2 + dl + er) >>> 0
    h2 = (h3 + el + ar) >>> 0
    h3 = (h4 + al + br) >>> 0
    h4 = (h0 + bl + cr) >>> 0
    h0 = T
  }

  const out = new Uint8Array(20)
  const outDv = new DataView(out.buffer)
  outDv.setUint32(0, h0, true)
  outDv.setUint32(4, h1, true)
  outDv.setUint32(8, h2, true)
  outDv.setUint32(12, h3, true)
  outDv.setUint32(16, h4, true)
  return out
}

function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(nobleSha256(data))
}

// ─── bech32 (P2WPKH, matches btc.ts pattern) ─────────────────────────────────

const BECH32_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const v of values) {
    const b = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i]
  }
  return chk
}

function bech32HrpExpand(hrp: string): number[] {
  const ret: number[] = []
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5)
  ret.push(0)
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31)
  return ret
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0, bits = 0
  const ret: number[] = []
  const maxv = (1 << toBits) - 1
  for (const value of data) {
    acc = (acc << fromBits) | value
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      ret.push((acc >> bits) & maxv)
    }
  }
  if (pad && bits > 0) ret.push((acc << (toBits - bits)) & maxv)
  return ret
}

function encodeBech32(hrp: string, witVer: number, witProg: Uint8Array): string {
  const data = [witVer, ...convertBits(witProg, 8, 5, true)]
  const checksumData = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0]
  const checksum = bech32Polymod(checksumData) ^ 1
  const chars = data.map(d => BECH32_CHARS[d]).join('')
  const chk = [
    (checksum >> 25) & 31, (checksum >> 20) & 31, (checksum >> 15) & 31,
    (checksum >> 10) & 31, (checksum >> 5) & 31, checksum & 31,
  ].map(d => BECH32_CHARS[d]).join('')
  return hrp + '1' + chars + chk
}

/**
 * Derive a Bitcoin P2WPKH (native SegWit, bech32 "bc1q...") address.
 * secp256k1 compressed pubkey → RIPEMD-160(SHA-256(pubkey)) → P2WPKH bech32.
 */
function deriveBtcAddress(secret: Uint8Array): string {
  const pubKey = secp256k1.getPublicKey(secret, true) // 33 bytes, compressed
  const h160 = hash160(pubKey)
  return encodeBech32('bc', 0, h160)
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
 * - **Browser-only:** All derivation uses WebCrypto (no server round-trip)
 */
export async function deriveMultichainAddresses(
  prfOutput: Uint8Array,
): Promise<MultichainAddresses> {
  if (prfOutput.length !== 32) {
    throw new Error(`PRF output must be 32 bytes, got ${prfOutput.length}`)
  }

  // Derive chain-specific 32-byte secrets in parallel
  const [suiSecret, ethSecret, solSecret, btcSecret] = await Promise.all([
    hkdfDeriveChainKey(prfOutput, 'sui'),
    hkdfDeriveChainKey(prfOutput, 'eth'),
    hkdfDeriveChainKey(prfOutput, 'sol'),
    hkdfDeriveChainKey(prfOutput, 'btc'),
  ])

  return {
    sui: deriveSuiAddress(suiSecret),
    eth: deriveEthAddress(ethSecret),
    sol: deriveSolAddress(solSecret),
    btc: deriveBtcAddress(btcSecret),
  }
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
