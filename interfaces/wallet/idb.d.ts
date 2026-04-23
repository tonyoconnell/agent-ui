import type { WalletRecord, Wrapping } from "../types-wallet"

export declare const WALLET_KEY: "wallet"  // stable IDB key, never changes

// Get the current WalletRecord (returns null if not initialized)
export declare function getWallet(): Promise<WalletRecord | null>

// Write a complete WalletRecord
export declare function putWallet(record: WalletRecord): Promise<void>

// Add a wrapping to the existing record (add-only, never rewrites)
export declare function addWrapping(wrapping: Wrapping): Promise<void>

// Remove a wrapping by credId (for revoke)
export declare function removeWrapping(credId: ArrayBuffer): Promise<void>

// Wipe the plaintextSeed field (called after State 2)
export declare function wipePlaintextSeed(): Promise<void>

// Clear all wallet data (GDPR / "I want to start over")
export declare function clearWallet(): Promise<void>
