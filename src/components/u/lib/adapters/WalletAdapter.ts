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

export const WalletAdapter = {
  /**
   * Load wallets from local storage
   */
  fromLocalStorage(filter?: { chain?: string; context?: 'mainnet' | 'testnet' }): Wallet[] {
    try {
      const stored = localStorage.getItem('u_wallets')
      if (!stored) return []

      let wallets: Wallet[] = JSON.parse(stored)

      if (filter?.chain) {
        wallets = wallets.filter((w) => w.chain === filter.chain)
      }

      if (filter?.context) {
        wallets = wallets.filter((w) => w.context === filter.context)
      }

      return wallets
    } catch (e) {
      console.error('Failed to load wallets', e)
      return []
    }
  },

  /**
   * Save wallets to local storage
   */
  toLocalStorage(wallets: Wallet[]) {
    // Merge with existing
    const existing = this.fromLocalStorage()
    const map = new Map(existing.map((w) => [w.address, w]))

    // Update or add new
    wallets.forEach((w) => map.set(w.address, w))

    const plain = Array.from(map.values())
    localStorage.setItem('u_wallets', JSON.stringify(plain))
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
