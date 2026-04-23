#!/usr/bin/env bun
/**
 * Canary check: restore a known fixture seed → assert known Sui address.
 * Fails (exit 1) if derivation diverges — deploy should gate on this.
 *
 * Fixture: a deterministic test seed (NOT a real wallet).
 * The expected address is derived from this seed at write-time and hardcoded.
 *
 * mac.md principle: "verification > presence" — canary decrypts, canary txs,
 * reconciliation ticks. "File exists" is theater.
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'

// Canary fixture — test-only, not a real wallet.
// Seed: 32 bytes of 0x00...01 (trivially reproducible, zero economic value).
const CANARY_SEED_HEX = '0000000000000000000000000000000000000000000000000000000000000001'

// Expected address derived at script write-time (2026-04-23) via:
//   Ed25519Keypair.fromSecretKey(Buffer.from(CANARY_SEED_HEX, "hex")).toSuiAddress()
// If this ever changes, the @mysten/sui derivation logic has diverged — block the deploy.
const CANARY_EXPECTED_ADDRESS = '0xd0c2c91eda34bbfbaec6cfb9c7bb913e57dab3cbec4018a4b3f5e55531cd63af'

async function main() {
  const seedBytes = Buffer.from(CANARY_SEED_HEX, 'hex')
  const keypair = Ed25519Keypair.fromSecretKey(seedBytes)
  const address = keypair.toSuiAddress()

  if (address !== CANARY_EXPECTED_ADDRESS) {
    console.error(`CANARY FAIL: expected ${CANARY_EXPECTED_ADDRESS}, got ${address}`)
    console.error('Sui address derivation has diverged. Block the deploy and investigate @mysten/sui version.')
    process.exit(1)
  }

  console.log(`CANARY OK: ${address}`)
}

main()
