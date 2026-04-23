/**
 * errors.ts — Wallet error taxonomy + user-visible copy
 *
 * Single source of truth for every error kind the wallet surfaces can throw.
 * Aligned with wallet.md §Error copy.
 *
 * Usage:
 *   import { makeWalletError, isWalletError } from '@/components/u/lib/errors'
 *
 *   throw makeWalletError('locked')
 *   throw makeWalletError('network-error', originalError)
 *
 *   catch (err) {
 *     if (isWalletError(err)) {
 *       // err.userMessage is safe to show in the UI
 *     }
 *   }
 *
 * Mapping from VaultErrorCode → WalletErrorKind:
 *   locked            → locked
 *   no-vault          → no-vault
 *   wrong-password    → wrong-password
 *   wrong-recovery    → wrong-recovery
 *   passkey-cancelled → passkey-cancelled
 *   passkey-unsupported → passkey-unsupported
 *   tamper-detected   → tamper-detected
 *   rate-limited      → rate-limited
 *   invalid-mnemonic  → invalid-mnemonic
 *   storage-error     → storage-error
 *   crypto-error      → crypto-error
 *
 * New kinds (from wallet.md §Error copy):
 *   network-error     — sponsor Worker 5xx / no connectivity
 *   epoch-expired     — sponsored-tx epoch expired mid-sign
 *   cap-exceeded      — deposit exceeds State 1 cap
 */

// ============================================
// DISCRIMINANT UNION (14 kinds)
// ============================================

export type WalletErrorKind =
  // Vault / auth state
  | 'locked'            // vault is locked; unlock before proceeding
  | 'no-vault'          // no vault exists; setup required
  | 'wrong-password'    // password verification failed
  | 'wrong-recovery'    // recovery phrase did not match
  // Passkey / WebAuthn
  | 'passkey-cancelled' // user dismissed the Touch ID / Face ID prompt — show nothing
  | 'passkey-unsupported' // PRF extension or WebAuthn API unavailable → show browser upgrade
  // Integrity
  | 'tamper-detected'   // sentinel decrypt mismatch — vault may be corrupted
  // Rate limiting
  | 'rate-limited'      // too many failed attempts; auto-retry in progress
  // Mnemonic
  | 'invalid-mnemonic'  // BIP39 word list validation failed
  // Storage / crypto internals
  | 'storage-error'     // IndexedDB unavailable or failed
  | 'crypto-error'      // WebCrypto API failure
  // Network / sponsored transactions
  | 'network-error'     // sponsor Worker returned 5xx or no connectivity
  | 'epoch-expired'     // sponsored tx epoch expired between sign and submit
  | 'cap-exceeded'      // deposit exceeds State 1 (anonymous) wallet cap

// ============================================
// INTERFACE
// ============================================

export interface WalletError extends Error {
  readonly name: 'WalletError'
  readonly kind: WalletErrorKind
  /**
   * User-visible message from ERROR_COPY. Always safe to render.
   * null means the error should be handled silently (passkey-cancelled, etc.)
   */
  readonly userMessage: string | null
  /** Original cause if available — never shown to the user */
  readonly cause?: unknown
}

// ============================================
// USER-VISIBLE COPY (wallet.md §Error copy)
// ============================================

/**
 * ERROR_COPY maps every WalletErrorKind to a user-visible string (or null for silent).
 *
 * null → the error is intentionally silent; do not surface anything in the UI.
 * All non-null strings are safe to render directly in toast / banner / inline copy.
 */
export const ERROR_COPY: Record<WalletErrorKind, string | null> = {
  // Vault / auth state
  'locked':
    'Your wallet is locked. Unlock it to continue.',
  'no-vault':
    'No wallet found. Set one up to get started.',
  'wrong-password':
    'Incorrect password. Try again.',
  'wrong-recovery':
    'Recovery phrase didn\'t match. Check each word and try again.',
  // Passkey / WebAuthn
  'passkey-cancelled':
    null, // user cancelled — show nothing per wallet.md
  'passkey-unsupported':
    'This browser can\'t save wallets yet. Use Safari 17+ or Chrome 118+.',
  // Integrity
  'tamper-detected':
    'Vault data looks unexpected. Re-import your recovery phrase to continue.',
  // Rate limiting
  'rate-limited':
    'One moment — finishing a previous action.',
  // Mnemonic
  'invalid-mnemonic':
    'Those words don\'t match a wallet. Check each one.',
  // Storage / crypto internals
  'storage-error':
    'Couldn\'t access secure storage. Check your browser settings.',
  'crypto-error':
    'A security operation failed. Try again or reload the page.',
  // Network / sponsored transactions
  'network-error':
    'Couldn\'t reach the network. Try again.',
  'epoch-expired':
    'Took a moment too long — tap Send again.',
  'cap-exceeded':
    'Save this wallet first to receive larger amounts.',
}

// ============================================
// TYPE GUARD
// ============================================

export function isWalletError(err: unknown): err is WalletError {
  return (
    err instanceof Error &&
    (err as WalletError).name === 'WalletError' &&
    typeof (err as WalletError).kind === 'string'
  )
}

// ============================================
// FACTORY
// ============================================

/**
 * makeWalletError — construct a WalletError with correct user copy.
 *
 * @param kind  - one of the 14 WalletErrorKind discriminants
 * @param cause - original underlying error (never shown to the user)
 */
export function makeWalletError(kind: WalletErrorKind, cause?: unknown): WalletError {
  const userMessage = ERROR_COPY[kind]
  const internalMessage = cause instanceof Error ? cause.message : String(cause ?? kind)
  const err = new Error(internalMessage) as WalletError & { name: string; kind: WalletErrorKind; userMessage: string | null; cause?: unknown }
  err.name = 'WalletError'
  err.kind = kind
  err.userMessage = userMessage
  err.cause = cause
  return err as WalletError
}
