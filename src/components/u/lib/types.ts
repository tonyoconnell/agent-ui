// Dashboard Wallet type — what the UI renders.
// Persisted shape lives in `VaultWallet` (lib/vault/types.ts); this is a
// decrypted/presentational view with an optional transient `privateKey` /
// `mnemonic` returned ONCE by `createWallet` for the onboarding carousel.

export interface Wallet {
  id: string
  name: string
  address: string
  chain: string // 'eth', 'sol', 'sui', 'btc', lowercase
  balance: string
  context: 'mainnet' | 'testnet'
  publicKey?: string
  usdValue?: number
  lastUpdated?: number
  tags?: string[]
  isCloudBacked?: boolean
  /** Only present on the object returned by `createWallet` — not persisted in state. */
  privateKey?: string
  /** Only present on the object returned by `createWallet` — not persisted in state. */
  mnemonic?: string
}
