/**
 * SUI chain address derivation + payment URI.
 *
 * Mirrors addressFor(uid) in src/lib/sui.ts — same derivation, no circular dep.
 * Uses SHA-256(seed || uid) → 32-byte secret → Ed25519 keypair → Sui address.
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'

// ─── seed ────────────────────────────────────────────────────────────────────

function readSeedBytes(): Uint8Array {
  const b64 = (typeof process !== 'undefined' && process.env?.SUI_SEED) || import.meta.env.SUI_SEED || ''
  if (!b64) throw new Error('SUI_SEED not configured')
  return Uint8Array.from(atob(b64.toString()), (c) => c.charCodeAt(0))
}

// ─── derivation ──────────────────────────────────────────────────────────────

/**
 * Derive a deterministic Sui address for a uid.
 * SHA-256(seed || uid) — preserves parity with src/lib/sui.ts version 0.
 */
export async function deriveAddressSui(uid: string): Promise<string> {
  const seed = readSeedBytes()
  const encoder = new TextEncoder()
  const uidBytes = encoder.encode(uid)
  const material = new Uint8Array(seed.length + uidBytes.length)
  material.set(seed)
  material.set(uidBytes, seed.length)
  const hash = await crypto.subtle.digest('SHA-256', material)
  const kp = Ed25519Keypair.fromSecretKey(new Uint8Array(hash))
  return kp.getPublicKey().toSuiAddress()
}

// ─── payment URI ─────────────────────────────────────────────────────────────

/**
 * Build a SUI payment URI.
 * Format: sui:<address>?amount=<amountMist>
 */
export function buildPaymentUriSui(addr: string, amountMist: bigint): string {
  return `sui:${addr}?amount=${amountMist}`
}
