/**
 * Wallet error construction helpers.
 * Maps error kinds to user-visible copy per wallet.md §Error copy.
 */

import type { WalletError, WalletErrorKind } from "../types-errors"

/**
 * Construct a WalletError with the correct user-visible message.
 * @param kind — error discriminant
 * @param cause — underlying error for ops logging
 * @returns WalletError with user-visible message matched to kind
 */
export declare function makeWalletError(
  kind: WalletErrorKind,
  cause?: unknown
): WalletError

/**
 * User-visible copy for each error kind.
 * Mapped directly from wallet.md §Error copy.
 * Silent kinds ("webauthn-cancelled", "largeblob-unsupported") have empty string.
 */
export declare const ERROR_COPY: Record<WalletErrorKind, string>

// Re-export for convenience
export type { WalletError, WalletErrorKind } from "../types-errors"
export { isWalletError } from "../types-errors"
