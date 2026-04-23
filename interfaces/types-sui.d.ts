/**
 * Sui Network Types (Tier 0 Vocabulary)
 *
 * Branded primitives for type safety across wallet-v2.
 * All types use readonly brands to prevent accidental mixing of incompatible types.
 */

/**
 * Sui blockchain address.
 * Branded as SuiAddress to prevent confusion with other address types.
 */
export type SuiAddress = string & { readonly _brand: "SuiAddress" }

/**
 * Serialized transaction bytes.
 * Branded to ensure proper handling of binary transaction data.
 */
export type TxBytes = Uint8Array & { readonly _brand: "TxBytes" }

/**
 * Transaction digest (hash) returned after execution.
 * Branded to distinguish from other string identifiers.
 */
export type TxDigest = string & { readonly _brand: "TxDigest" }

/**
 * Sui network identifier.
 * Mainnet, testnet, devnet, or localnet.
 */
export type NetworkId = "mainnet" | "testnet" | "devnet" | "localnet"

/**
 * Epoch identifier on the Sui blockchain.
 * Branded as number to ensure type safety with other numeric identifiers.
 */
export type EpochId = number & { readonly _brand: "EpochId" }

/**
 * Scoped wallet identifier.
 * Branded to ensure proper lifecycle isolation per wallet scope.
 */
export type ScopedWalletId = string & { readonly _brand: "ScopedWalletId" }

/**
 * Sui Move object ID.
 * Branded to distinguish from package IDs and other address-like strings.
 */
export type ObjectId = string & { readonly _brand: "ObjectId" }

/**
 * Sui Move package ID.
 * Branded to distinguish from object IDs and other address-like strings.
 */
export type PackageId = string & { readonly _brand: "PackageId" }
