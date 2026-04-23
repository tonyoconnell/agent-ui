/**
 * Tier 0 type vocabulary for wallet-v2 program.
 * One-address ephemeral-first wallet with multiple key material wrappings.
 * Seed generated once in IndexedDB, wrapped by passkey PRF, BIP39, or server KEK.
 */

export type WrappingType = "passkey-prf" | "bip39-shown" | "server-kek"

export interface PasskeyPrfWrapping {
  type: "passkey-prf"
  credId: ArrayBuffer        // passkey credential ID
  iv: Uint8Array             // AES-GCM IV
  ciphertext: Uint8Array     // AES-GCM encrypted seed
}

export interface Bip39ShownWrapping {
  type: "bip39-shown"
  createdAt: string          // ISO timestamp; phrase lives on paper, not stored
}

export interface ServerKekWrapping {
  type: "server-kek"
  wrappedBy: string          // Better Auth user ID or "google"
  iv: Uint8Array
  ciphertext: Uint8Array
}

export type Wrapping = PasskeyPrfWrapping | Bip39ShownWrapping | ServerKekWrapping

// The IndexedDB record
export interface WalletRecord {
  version: 1
  address: string            // Sui address, stable forever
  wrappings: Wrapping[]
  plaintextSeed: null        // always null after State 2
  bip39ShownAt?: string      // ISO timestamp when phrase was shown
}

// Wallet lifecycle state
export type WalletState = 1 | 2 | 3 | 4 | 5
