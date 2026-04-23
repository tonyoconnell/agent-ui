import type { Ed25519Seed } from "../types-crypto"
import type { WalletRecord } from "../types-wallet"

// Fetch server backup for current auth session and decrypt
// GET /api/wallet/wrap/:credId — requires Better Auth session
export declare function restoreFromServerBackup(
  credId: ArrayBuffer
): Promise<Ed25519Seed>

// Restore from BIP39 phrase (paper break-glass)
// Does NOT enroll a new passkey — caller handles that
export declare function restoreFromMnemonic(words: string[]): Promise<Ed25519Seed>

// Restore full WalletRecord from recovered seed (same address)
export declare function buildRestoredRecord(seed: Ed25519Seed, address: string): WalletRecord
