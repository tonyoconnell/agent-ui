// src/components/u/lib/bip39.ts — BIP-39 12-word break-glass mnemonic for Ed25519 seeds.
// Contract: interfaces/wallet/bip39.d.ts
// Word list source: @scure/bip39 English wordlist (2048 words, standard BIP39)

import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic as scureValidate } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import type { Ed25519Seed } from '../../../../interfaces/types-crypto'
import type { WalletErrorKind } from '../../../../interfaces/types-errors'

// ===== CONSTANTS =====

/** BIP39 English wordlist size — 2048 words, 11 bits per word. */
export const WORDLIST_SIZE = 2048 as const

// ===== ERROR =====

/**
 * Throw a WalletError-shaped object with kind "bip39-malformed".
 * WalletError is an interface (not a class) so we construct a plain object.
 */
function throwBip39Error(message: string, cause?: unknown): never {
  const kind: WalletErrorKind = 'bip39-malformed'
  const err = Object.assign(new Error(message), { kind, cause })
  throw err
}

// ===== CORE API =====

/**
 * Generate 12 BIP39 words from an Ed25519 seed (entropy → mnemonic).
 * Uses the first 16 bytes of the 32-byte seed as 128-bit entropy.
 * 12 words encode exactly 128 bits: 12 × 11 bits − 4 checksum bits = 128.
 *
 * @param seed - 32-byte Ed25519 seed
 * @returns Array of 12 BIP39 words from the standard English wordlist
 */
export function seedToMnemonic(seed: Ed25519Seed): string[] {
  // Take first 16 bytes (128 bits) — sufficient for 12-word BIP39 mnemonic.
  const entropy = seed.slice(0, 16)
  const phrase = entropyToMnemonic(entropy, wordlist)
  return phrase.split(' ')
}

/**
 * Restore Ed25519 seed from 12 BIP39 words.
 * Reverses seedToMnemonic: mnemonic → 16-byte entropy → zero-padded to 32 bytes.
 *
 * @param words - Array of 12 valid BIP39 words
 * @returns 32-byte Ed25519 seed (first 16 bytes = entropy, last 16 = zeroes)
 * @throws WalletError with kind "bip39-malformed" if words are invalid,
 *         not exactly 12, or checksum fails
 */
export function mnemonicToSeed(words: string[]): Ed25519Seed {
  if (words.length !== 12) {
    throwBip39Error(`Expected 12 words, got ${words.length}`)
  }

  const phrase = words.map((w) => w.trim().toLowerCase()).join(' ')

  if (!scureValidate(phrase, wordlist)) {
    throwBip39Error('Invalid BIP39 mnemonic — check words and checksum')
  }

  const entropy = mnemonicToEntropy(phrase, wordlist) // 16 bytes
  // Pad to 32 bytes to match Ed25519Seed contract
  const seed = new Uint8Array(32)
  seed.set(entropy)
  return seed as Ed25519Seed
}

/**
 * Validate 12 BIP39 words without restoring the seed.
 * Checks wordlist membership and BIP39 checksum.
 *
 * @param words - Array to validate
 * @returns true if valid (exactly 12 words, all in wordlist, checksum passes)
 */
export function validateMnemonic(words: string[]): boolean {
  if (words.length !== 12) return false
  const phrase = words.map((w) => w.trim().toLowerCase()).join(' ')
  return scureValidate(phrase, wordlist)
}
