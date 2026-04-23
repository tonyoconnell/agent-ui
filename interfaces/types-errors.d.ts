/**
 * Wallet error discriminated union.
 * Every technical error maps to a user-visible string from wallet.md §Error copy.
 */

/**
 * Error kind discriminant — maps to user-visible copy.
 */
export type WalletErrorKind =
  | "sponsor-unreachable"      // "Couldn't reach the network. Try again."
  | "epoch-expired"            // "Took a moment too long — tap Send again."
  | "sponsor-rate-limited"     // "One moment — finishing a previous action."
  | "webauthn-cancelled"       // silent — return without showing anything
  | "webauthn-not-allowed"     // "Touch ID didn't register. Try once more."
  | "state1-cap-exceeded"      // "Save this wallet first to receive larger amounts."
  | "prf-unsupported"          // "This browser can't save wallets yet. Use Safari 17+ or Chrome 118+."
  | "largeblob-unsupported"    // silent — fallback to server-held ciphertext
  | "bip39-malformed"          // "Those words don't match a wallet. Check each one."
  | "network-timeout"          // "Slow connection. Still trying." + cancel
  | "cursor-stale"             // chat: session cursor rejected by server
  | "request-expired"          // agent co-sign: approval window elapsed
  | "hallucinated-recipient"   // chat buy flow: address not resolvable
  | "scope-violation"          // agent tried to exceed ScopedWallet cap

/**
 * Wallet error object with kind, user-visible message, and optional cause.
 */
export interface WalletError {
  kind: WalletErrorKind
  message: string              // user-visible copy from wallet.md §Error copy
  cause?: unknown              // underlying error for ops logging
}

/**
 * Type guard for WalletError.
 */
export declare function isWalletError(err: unknown): err is WalletError
