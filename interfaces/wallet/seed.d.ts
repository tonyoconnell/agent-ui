import type { Ed25519Seed, SeedBuffer } from "../types-crypto"
import type { WalletRecord } from "../types-wallet"

// Generate a new random 32-byte Ed25519 seed
export declare function generateSeed(): Ed25519Seed

// Derive Sui address from seed (Ed25519 keypair → toSuiAddress())
export declare function seedToAddress(seed: Ed25519Seed): string

// Initialize a new State-1 WalletRecord with a fresh seed
// plaintext seed stored in IndexedDB until State 2
export declare function initWalletRecord(seed: Ed25519Seed): WalletRecord

// Wipe a seed buffer (fill with zeros)
export declare function wipeSeed(buf: SeedBuffer): void
