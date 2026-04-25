/**
 * src/lib/pay/chains/index.ts
 *
 * Per-chain address derivation and payment URI construction for the
 * crypto rail of /api/pay/create-link.
 *
 * Derivation model:
 *   SUI  — Ed25519 keypair via addressFor(uid) from src/lib/sui.ts
 *           (SHA-256(SUI_SEED || uid) → Ed25519 → Sui address)
 *
 *   EVM  — last 20 bytes of SHA-256(SUI_SEED || "evm:" || uid) as 0x hex
 *   SOL  — 32-byte SHA-256(SUI_SEED || "sol:" || uid) base58-encoded
 *   BTC  — SHA-256(SUI_SEED || "btc:" || uid) encoded as bech32-like bc1q address
 *
 * All derivations are deterministic: same UID always → same address.
 * No new secrets are introduced — everything is seeded from SUI_SEED.
 *
 * Payment URIs follow wallet standards:
 *   SUI   → sui:<address>?amount=<mist>
 *   EVM   → ethereum:<address>?value=<wei>
 *   SOL   → solana:<address>?amount=<lamports>
 *   BTC   → bitcoin:<address>?amount=<btc>
 */

// ─── helpers ─────────────────────────────────────────────────────────────────

function readSeedBytes(): Uint8Array | null {
  const fromRuntime =
    typeof process !== 'undefined' && process.env && process.env.SUI_SEED ? process.env.SUI_SEED : undefined
  const fromBuild = import.meta.env.SUI_SEED
  const b64 = (fromRuntime || fromBuild || '').toString()
  if (!b64) return null
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

/**
 * Derive 32 raw bytes from (seed || namespace || uid) using SHA-256.
 * Returns null when SUI_SEED is not configured (caller returns a graceful error).
 */
async function _deriveSeedBytes(namespace: string, uid: string): Promise<Uint8Array | null> {
  const seed = readSeedBytes()
  if (!seed) return null
  const ns = new TextEncoder().encode(namespace)
  const id = new TextEncoder().encode(uid)
  const material = new Uint8Array(seed.length + ns.length + id.length)
  material.set(seed)
  material.set(ns, seed.length)
  material.set(id, seed.length + ns.length)
  const hash = await crypto.subtle.digest('SHA-256', material)
  return new Uint8Array(hash)
}

const HEX = '0123456789abcdef'

function _bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => HEX[b >> 4] + HEX[b & 0xf])
    .join('')
}

/** Base58 alphabet (Bitcoin/Solana) */
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function _bytesToBase58(bytes: Uint8Array): string {
  // count leading zero bytes
  let leadingZeros = 0
  for (const b of bytes) {
    if (b !== 0) break
    leadingZeros++
  }

  // big-number encode
  const digits = [0]
  for (const b of bytes) {
    let carry = b
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8
      digits[i] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }

  return (
    '1'.repeat(leadingZeros) +
    digits
      .reverse()
      .map((d) => B58[d])
      .join('')
  )
}

/** Minimal bech32 encoding for a bc1q address (witness v0 P2WPKH). */
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const v of values) {
    const b = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) {
      chk ^= (b >> i) & 1 ? GEN[i] : 0
    }
  }
  return chk
}

function hrpExpand(hrp: string): number[] {
  const ret: number[] = []
  for (const ch of hrp) ret.push(ch.charCodeAt(0) >> 5)
  ret.push(0)
  for (const ch of hrp) ret.push(ch.charCodeAt(0) & 31)
  return ret
}

function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0])
  const poly = polymod(values) ^ 1
  const chk: number[] = []
  for (let i = 0; i < 6; i++) chk.push((poly >> (5 * (5 - i))) & 31)
  return chk
}

/**
 * Encode 20 bytes as a bc1q (bech32 segwit v0 P2WPKH) address.
 */
function _encodeBech32(hrp: string, bytes20: Uint8Array): string {
  // convert 8-bit groups to 5-bit groups
  const data: number[] = [0] // witness version 0
  let acc = 0
  let bits = 0
  for (const b of bytes20) {
    acc = (acc << 8) | b
    bits += 8
    while (bits >= 5) {
      bits -= 5
      data.push((acc >> bits) & 31)
    }
  }
  if (bits > 0) data.push((acc << (5 - bits)) & 31)

  const checksum = createChecksum(hrp, data)
  return `${hrp}1${[...data, ...checksum].map((d) => BECH32_CHARSET[d]).join('')}`
}

// ─── per-chain address derivation ────────────────────────────────────────────

/**
 * Derive Sui address for a uid.
 * Platform SUI_SEED removed (sys-201) — use user vault for address derivation.
 */
export async function deriveAddressSui(uid: string): Promise<string> {
  return Promise.reject(new Error('Platform key removed (sys-201)'))
}

/**
 * Derive an EVM-compatible address (ETH, BASE, ARB, OPT) for a uid.
 * Platform SUI_SEED removed (sys-201) — use user vault for address derivation.
 */
export async function deriveAddressEvm(uid: string): Promise<string> {
  return Promise.reject(new Error('Platform key removed (sys-201)'))
}

/**
 * Derive a Solana address for a uid.
 * Platform SUI_SEED removed (sys-201) — use user vault for address derivation.
 */
export async function deriveAddressSol(uid: string): Promise<string> {
  return Promise.reject(new Error('Platform key removed (sys-201)'))
}

/**
 * Derive a Bitcoin bech32 (bc1q) address for a uid.
 * Platform SUI_SEED removed (sys-201) — use user vault for address derivation.
 */
export async function deriveAddressBtc(uid: string): Promise<string> {
  return Promise.reject(new Error('Platform key removed (sys-201)'))
}

// ─── dispatcher ──────────────────────────────────────────────────────────────

/** Derive a receive address for the given chain and uid. */
export async function deriveAddressForChain(uid: string, chain: string): Promise<string> {
  const c = chain.toLowerCase()
  if (c === 'sui') return deriveAddressSui(uid)
  if (c === 'sol' || c === 'solana') return deriveAddressSol(uid)
  if (c === 'btc' || c === 'bitcoin') return deriveAddressBtc(uid)
  // Default: all EVM chains (eth, base, arb, opt, usdc-on-eth, etc.)
  return deriveAddressEvm(uid)
}

// ─── payment URI builders ─────────────────────────────────────────────────────

/**
 * Build a SIP-10-style Sui payment URI.
 * amount is in USD/fiat — converted to mist (1 SUI = 1e9 mist) is the caller's
 * responsibility if needed; here we pass the raw amount as-is in the URI.
 */
export function buildPaymentUriSui(address: string, amount: number): string {
  const mist = Math.round(amount * 1e9)
  return `sui:${address}?amount=${mist}`
}

/** EIP-681 Ethereum payment URI. amount in ETH units (non-wei). */
export function buildPaymentUriEvm(address: string, amount: number): string {
  const wei = BigInt(Math.round(amount * 1e18))
  return `ethereum:${address}?value=${wei.toString()}`
}

/** Solana Pay URI. amount in SOL units. */
export function buildPaymentUriSol(address: string, amount: number): string {
  return `solana:${address}?amount=${amount}`
}

/** BIP-21 Bitcoin payment URI. amount in BTC. */
export function buildPaymentUriBtc(address: string, amount: number): string {
  return `bitcoin:${address}?amount=${amount}`
}

/** Dispatch to the correct URI builder for the given chain. */
export function buildPaymentUri(address: string, amount: number, chain: string): string {
  const c = chain.toLowerCase()
  if (c === 'sui') return buildPaymentUriSui(address, amount)
  if (c === 'sol' || c === 'solana') return buildPaymentUriSol(address, amount)
  if (c === 'btc' || c === 'bitcoin') return buildPaymentUriBtc(address, amount)
  // EVM default
  return buildPaymentUriEvm(address, amount)
}
