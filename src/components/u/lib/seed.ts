// seed.ts — Seed generation and derivation for wallet-v2.
// Implements the contract in interfaces/wallet/seed.d.ts.
// Browser-only (uses crypto.getRandomValues and @mysten/sui).

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import type { Ed25519Seed, SeedBuffer } from '../../../../interfaces/types-crypto'
import type { WalletRecord } from '../../../../interfaces/types-wallet'

/**
 * Generate a new random 32-byte Ed25519 seed.
 * Uses the platform CSPRNG — never Math.random().
 */
export function generateSeed(): Ed25519Seed {
  return crypto.getRandomValues(new Uint8Array(32)) as Ed25519Seed
}

/**
 * Derive a Sui address from a seed.
 * Constructs an Ed25519 keypair from the raw secret key bytes,
 * then calls toSuiAddress() to get the canonical 0x-prefixed address.
 */
export function seedToAddress(seed: Ed25519Seed): string {
  const keypair = Ed25519Keypair.fromSecretKey(seed)
  return keypair.toSuiAddress()
}

/**
 * Initialize a new State-1 WalletRecord.
 * Derives the address from the seed and returns a record with
 * no wrappings and plaintextSeed set to null.
 * The caller is responsible for persisting the seed separately
 * (e.g. in IDB) for the State 1 → State 2 transition, then
 * calling wipeSeed() and wipePlaintextSeed() once wrapped.
 */
export function initWalletRecord(seed: Ed25519Seed): WalletRecord {
  return {
    version: 1,
    address: seedToAddress(seed),
    wrappings: [],
    plaintextSeed: null,
  }
}

/**
 * Wipe a seed buffer by filling with zeros.
 * Call immediately after the seed is no longer needed.
 */
export function wipeSeed(buf: SeedBuffer): void {
  buf.fill(0)
}
