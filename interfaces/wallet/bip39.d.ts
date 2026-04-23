import type { Ed25519Seed } from "../types-crypto"

/**
 * Generate 12 BIP39 words from an Ed25519 seed (entropy → mnemonic).
 * Used for paper break-glass recovery in passkeys.md.
 *
 * @param seed - 32-byte Ed25519 seed (entropy)
 * @returns Array of 12 BIP39 words from the standard English wordlist
 */
export declare function seedToMnemonic(seed: Ed25519Seed): string[]

/**
 * Restore Ed25519 seed from 12 BIP39 words.
 * Paper break-glass recovery path: user transcribes words → seed restored.
 *
 * @param words - Array of 12 valid BIP39 words
 * @returns 32-byte Ed25519 seed (entropy)
 * @throws WalletError with kind "bip39-malformed" if words are invalid,
 *         not exactly 12, or checksum fails
 */
export declare function mnemonicToSeed(words: string[]): Ed25519Seed

/**
 * Validate 12 BIP39 words without restoring the seed.
 * Checks wordlist membership and BIP39 checksum (last word's first 4 bits).
 *
 * @param words - Array to validate
 * @returns true if valid (12 words, all in wordlist, checksum passes)
 */
export declare function validateMnemonic(words: string[]): boolean

/**
 * Word list size per BIP39 spec.
 * Standard English wordlist: 2048 words.
 * Each word encodes 11 bits of entropy (2^11 = 2048).
 */
export declare const WORDLIST_SIZE: 2048
