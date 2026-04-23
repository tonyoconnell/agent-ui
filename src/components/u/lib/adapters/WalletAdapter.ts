/**
 * Wallet interface used in the Frontend
 */
export interface Wallet {
  id: string // Unique ID (usually address or derived ID)
  name: string
  address: string
  chain: string // 'eth', 'sol', 'sui', 'btc'
  balance: string
  context: 'mainnet' | 'testnet'
  privateKey?: string // Encrypted or raw (only if locally generated)
  mnemonic?: string // Only if locally generated
  publicKey?: string
  usdValue?: number
  lastUpdated?: number
  tags?: string[]
  isCloudBacked?: boolean
}

/**
 * DEPRECATED: WalletAdapter uses localStorage which is not safe for seed material.
 * Wallet state now lives in IndexedDB only via Vault (src/components/u/lib/vault/).
 * Use useVault hook or Vault.listWallets() to read wallets.
 * TODO: migrate all localStorage reads to vault.ts
 */
export const WalletAdapter = {
  /**
   * Load wallets from local storage
   * DEPRECATED: use Vault.listWallets() instead
   * TODO: read from IndexedDB via vault.ts instead
   */
  fromLocalStorage(filter?: { chain?: string; context?: 'mainnet' | 'testnet' }): Wallet[] {
    // REMOVED: localStorage.getItem('u_wallets')
    console.warn('WalletAdapter.fromLocalStorage is deprecated. Use Vault.listWallets() instead.')
    return []
  },

  /**
   * Save wallets to local storage
   * DEPRECATED: use Vault.saveWallet() instead
   * TODO: write to IndexedDB via vault.ts instead
   */
  toLocalStorage(wallets: Wallet[]) {
    // REMOVED: localStorage.setItem calls
    console.warn('WalletAdapter.toLocalStorage is deprecated. Use Vault.saveWallet() instead.')
  },

  /**
   * Add a single wallet
   */
  addWallet(wallet: Wallet) {
    this.toLocalStorage([wallet])
  },

  /**
   * Convert API response to Wallet model
   */
  fromApiResponse(
    apiWallet: { address: string; publicKey: string; privateKey?: string; mnemonic?: string },
    chain: string,
    context: 'mainnet' | 'testnet' = 'mainnet',
  ): Wallet {
    return {
      id: apiWallet.address,
      name: `My ${chain.toUpperCase()} Wallet`,
      address: apiWallet.address,
      chain,
      context,
      balance: '0',
      privateKey: apiWallet.privateKey,
      mnemonic: apiWallet.mnemonic,
      publicKey: apiWallet.publicKey,
      lastUpdated: Date.now(),
      isCloudBacked: !apiWallet.privateKey, // If no private key returned, it's cloud-only/derived
    }
  },
}
