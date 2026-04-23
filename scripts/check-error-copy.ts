#!/usr/bin/env bun
/**
 * check-error-copy.ts — CI lint
 *
 * Ensures errors.ts ERROR_COPY matches wallet.md §Error copy table.
 * Exit 0 if all 14 kinds match expected user-facing strings.
 * Exit 1 if any mismatch found.
 *
 * Aligned with wallet.md line 88-100 error copy table.
 */

import { ERROR_COPY } from '../src/components/u/lib/errors'

// Expected values mapped from wallet.md §Error copy table
const EXPECTED = {
  // Vault / auth state
  'locked': 'Your wallet is locked. Unlock it to continue.',
  'no-vault': 'No wallet found. Set one up to get started.',
  'wrong-password': 'Incorrect password. Try again.',
  'wrong-recovery': 'Recovery phrase didn\'t match. Check each word and try again.',
  // Passkey / WebAuthn
  'passkey-cancelled': null, // silent per wallet.md
  'passkey-unsupported': 'This browser can\'t save wallets yet. Use Safari 17+ or Chrome 118+.',
  // Integrity
  'tamper-detected': 'Vault data looks unexpected. Re-import your recovery phrase to continue.',
  // Rate limiting
  'rate-limited': 'One moment — finishing a previous action.',
  // Mnemonic
  'invalid-mnemonic': 'Those words don\'t match a wallet. Check each one.',
  // Storage / crypto internals
  'storage-error': 'Couldn\'t access secure storage. Check your browser settings.',
  'crypto-error': 'A security operation failed. Try again or reload the page.',
  // Network / sponsored transactions
  'network-error': 'Couldn\'t reach the network. Try again.',
  'epoch-expired': 'Took a moment too long — tap Send again.',
  'cap-exceeded': 'Save this wallet first to receive larger amounts.',
} as const

// Type check: all keys present
type ErrorKind = keyof typeof EXPECTED
const expectedKeys = Object.keys(EXPECTED) as ErrorKind[]
const actualKeys = Object.keys(ERROR_COPY) as ErrorKind[]

let ok = true

// Check for missing keys in ERROR_COPY
for (const kind of expectedKeys) {
  if (!(kind in ERROR_COPY)) {
    console.error(`MISSING: ${kind} not in ERROR_COPY`)
    ok = false
  }
}

// Check for extra keys in ERROR_COPY
for (const kind of actualKeys) {
  if (!(kind in EXPECTED)) {
    console.error(`EXTRA: ${kind} in ERROR_COPY but not in EXPECTED`)
    ok = false
  }
}

// Check for mismatches
for (const [kind, expectedCopy] of Object.entries(EXPECTED)) {
  const actualCopy = ERROR_COPY[kind as ErrorKind]
  if (actualCopy !== expectedCopy) {
    console.error(`MISMATCH: ${kind}`)
    console.error(`  expected: ${JSON.stringify(expectedCopy)}`)
    console.error(`  actual:   ${JSON.stringify(actualCopy)}`)
    ok = false
  }
}

if (!ok) {
  console.error('\nERROR_COPY validation failed.')
  process.exit(1)
}

const count = Object.keys(EXPECTED).length
console.log(`✓ ERROR_COPY OK: all ${count} kinds match wallet.md §Error copy`)
process.exit(0)
