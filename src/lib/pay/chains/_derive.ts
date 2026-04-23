/**
 * Shared derivation helpers for all EVM + non-EVM chains.
 *
 * Root secret: SUI_SEED env (base64, 32 bytes) — same secret as src/lib/sui.ts.
 * Per-chain key: HKDF-SHA256(IKM=seed, salt=undefined, info="<chain>", length=32).
 * Then mix with uid: SHA-256(chainKey || uid) → 32-byte material for the keypair.
 *
 * This gives:
 *   - chain isolation (same uid → different address per chain)
 *   - uid isolation (same chain → different address per uid)
 *   - full determinism (no randomness, no clock)
 */

import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'

// ─── seed ────────────────────────────────────────────────────────────────────

export function readSeedBytes(): Uint8Array {
  const b64 = (typeof process !== 'undefined' && process.env?.SUI_SEED) || import.meta.env.SUI_SEED || ''
  if (!b64) throw new Error('SUI_SEED not configured')
  return Uint8Array.from(atob(b64.toString()), (c) => c.charCodeAt(0))
}

// ─── per-chain + per-uid 32-byte secret ──────────────────────────────────────

const encoder = new TextEncoder()

/**
 * Derive 32 bytes for (chain, uid):
 *   1. HKDF(IKM=seed, info=chainTag) → chainKey   (chain isolation)
 *   2. SHA-256(chainKey || uid)       → secret     (uid isolation)
 */
export function deriveSecret(chainTag: string, uid: string): Uint8Array {
  const seed = readSeedBytes()
  // HKDF with no salt → RFC 5869 uses a HashLen zero salt by default
  const chainKey = hkdf(sha256, seed, undefined, encoder.encode(chainTag), 32)
  // Mix uid into chainKey via SHA-256 (synchronous, no subtle.digest needed)
  const material = new Uint8Array(chainKey.length + encoder.encode(uid).length)
  material.set(chainKey)
  material.set(encoder.encode(uid), chainKey.length)
  return sha256(material)
}
