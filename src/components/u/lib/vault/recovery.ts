// vault/recovery.ts — BIP-39 24-word recovery phrase.
// Generates, validates, normalises, derives vault master secret.

import { entropyToMnemonic, generateMnemonic, mnemonicToEntropy, mnemonicToSeed, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { VaultError } from './types'

// ===== CONFIG =====

export const RECOVERY_STRENGTH_BITS = 256 // → 24 words
export const RECOVERY_WORD_COUNT = 24

// ===== NORMALISATION =====

/**
 * Normalise a user-typed phrase: trim, collapse whitespace runs to a
 * single space, lowercase. Useful before validate/seed.
 */
export function normaliseRecoveryPhrase(phrase: string): string {
  return phrase.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** Split a phrase into its constituent words (for chip-style UI). */
export function splitRecoveryPhrase(phrase: string): string[] {
  const n = normaliseRecoveryPhrase(phrase)
  if (n === '') return []
  return n.split(' ')
}

// ===== GENERATION =====

/**
 * Generate a fresh 24-word BIP-39 recovery phrase.
 * Uses generateMnemonic from @scure/bip39 with strength 256.
 * Returns space-separated lowercase phrase.
 */
export function generateRecoveryPhrase(): string {
  return generateMnemonic(wordlist, RECOVERY_STRENGTH_BITS)
}

// ===== VALIDATION =====

/**
 * Validate a phrase against BIP-39 (length, wordlist, checksum).
 * Trims and normalises whitespace before validation.
 * Returns true iff valid.
 */
export function isValidRecoveryPhrase(phrase: string): boolean {
  try {
    assertValidRecoveryPhrase(phrase)
    return true
  } catch {
    return false
  }
}

/**
 * Like isValidRecoveryPhrase but throws VaultError('invalid-mnemonic')
 * with a helpful message.
 */
export function assertValidRecoveryPhrase(phrase: string): void {
  const normalised = normaliseRecoveryPhrase(phrase)

  if (normalised === '') {
    throw new VaultError('Recovery phrase is empty', 'invalid-mnemonic')
  }

  const words = normalised.split(' ')

  if (words.length !== 12 && words.length !== 24) {
    throw new VaultError(`Recovery phrase must be 12 or 24 words (got ${words.length})`, 'invalid-mnemonic')
  }

  // Per-word wordlist check (more specific than @scure's boolean result)
  const wordlistSet = new Set(wordlist)
  for (let i = 0; i < words.length; i++) {
    if (!wordlistSet.has(words[i] as string)) {
      throw new VaultError(`Word #${i + 1} ("${words[i]}") is not in the BIP-39 wordlist`, 'invalid-mnemonic')
    }
  }

  // All words in list — any remaining failure is a checksum failure.
  if (!validateMnemonic(normalised, wordlist)) {
    throw new VaultError('Recovery phrase checksum failed — check for typos', 'invalid-mnemonic')
  }
}

// ===== SEED DERIVATION =====

/**
 * BIP-39 mnemonic → 64-byte seed (PBKDF2-SHA512, 2048 iter, salt 'mnemonic'+passphrase).
 * Async — uses mnemonicToSeed which is the async variant.
 *
 * @param phrase recovery phrase (validated by caller)
 * @param passphrase optional BIP-39 passphrase ("25th word"), default ''
 */
export function recoveryToSeed(phrase: string, passphrase: string = ''): Promise<Uint8Array> {
  const normalised = normaliseRecoveryPhrase(phrase)
  return mnemonicToSeed(normalised, passphrase)
}

/**
 * Derive a 32-byte vault master secret from a recovery phrase.
 * Steps:
 *   1. Validate phrase (throws VaultError on invalid)
 *   2. Normalise
 *   3. Compute BIP-39 seed (64 bytes)
 *   4. Take first 32 bytes (sufficient — full entropy is preserved by PBKDF2-SHA512)
 *
 * @returns 32-byte Uint8Array
 */
export async function recoveryToVaultSecret(phrase: string, passphrase: string = ''): Promise<Uint8Array> {
  assertValidRecoveryPhrase(phrase)
  const normalised = normaliseRecoveryPhrase(phrase)
  const seed = await mnemonicToSeed(normalised, passphrase)
  return seed.slice(0, 32)
}

// ===== MASTER ↔ PHRASE (new deterministic model) =====

/**
 * Encode a 32-byte vault master as a 24-word BIP-39 phrase.
 * Deterministic: same master always produces the same phrase.
 * Used to show the user their emergency backup after PRF-derived vault setup.
 * The user writes this down; entering it back calls masterFromRecoveryPhrase().
 */
export function masterToRecoveryPhrase(master: Uint8Array): string {
  if (master.length !== 32) throw new VaultError('master must be 32 bytes for phrase encoding', 'crypto-error')
  return entropyToMnemonic(master, wordlist)
}

/**
 * Recover the 32-byte vault master from a phrase created by masterToRecoveryPhrase().
 * Uses direct entropy extraction (BIP-39 checksum → entropy bytes) — NOT PBKDF2.
 * Only valid for phrases that were produced by masterToRecoveryPhrase().
 */
export function masterFromRecoveryPhrase(phrase: string): Uint8Array {
  assertValidRecoveryPhrase(phrase)
  const normalised = normaliseRecoveryPhrase(phrase)
  return new Uint8Array(mnemonicToEntropy(normalised, wordlist))
}

// ===== WORDLIST UTILITIES =====

/**
 * Suggest matching BIP-39 words for an autocomplete UI.
 * @param prefix lowercase prefix (1+ chars)
 * @param limit max suggestions (default 5)
 */
export function suggestWords(prefix: string, limit: number = 5): string[] {
  const p = prefix.trim().toLowerCase()
  if (p === '' || limit <= 0) return []
  const out: string[] = []
  for (const w of wordlist) {
    if (w.startsWith(p)) {
      out.push(w)
      if (out.length >= limit) break
    }
  }
  return out
}

/**
 * Check if a word is in the BIP-39 wordlist exactly.
 */
export function isWordlistWord(word: string): boolean {
  return wordlist.includes(word.trim().toLowerCase())
}
