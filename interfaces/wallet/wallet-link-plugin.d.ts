import type { SuiAddress } from "../types-sui"

/**
 * Fields written to the Better Auth user record during wallet linking.
 * State 3 linking: wallet address + passkey credId persisted server-side.
 */
export interface WalletLinkFields {
  walletAddress: SuiAddress    // Ed25519 address, stable forever
  passkeyCredIds: string[]     // hex-encoded credIds for multi-device hints
}

/**
 * Result of a successful wallet link operation.
 * Returned by linkWallet() and getLinkedWallet().
 */
export interface WalletLinkResult {
  userId: string               // Better Auth user ID
  walletAddress: SuiAddress
  linkedAt: string             // ISO timestamp
}

/**
 * Link a wallet address to the authenticated user.
 * Server-side only. Writes to TypeDB auth-user entity via ensureHumanUnit().
 *
 * @param userId - Better Auth user ID
 * @param address - Sui wallet address (Ed25519 public key)
 * @param credId - Optional passkey credId (ArrayBuffer) for multi-device hints
 * @returns Promise resolving to WalletLinkResult with userId, address, and linkedAt timestamp
 *
 * No seed material ever crosses to server. The address is derived deterministically
 * client-side from the passkey PRF, then linked here as a capability assertion.
 */
export declare function linkWallet(
  userId: string,
  address: SuiAddress,
  credId?: ArrayBuffer
): Promise<WalletLinkResult>

/**
 * Retrieve the linked wallet for a user, if one exists.
 * Server-side only.
 *
 * @param userId - Better Auth user ID
 * @returns Promise resolving to WalletLinkResult if linked, null if not linked
 */
export declare function getLinkedWallet(userId: string): Promise<WalletLinkResult | null>
