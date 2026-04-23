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
    // Wallet metadata (address, chain, id, name) lives in localStorage.
    // Seed material never touches localStorage — that lives in vault/idb.ts.
    try {
      const raw = localStorage.getItem('u_wallets')
      if (!raw) return []
      const wallets: Wallet[] = JSON.parse(raw)
      if (!Array.isArray(wallets)) return []
      return wallets.filter((w) => {
        if (filter?.chain && w.chain !== filter.chain) return false
        if (filter?.context && w.context !== filter.context) return false
        return true
      })
    } catch {
      return []
    }
  },

  toLocalStorage(wallets: Wallet[]) {
    // Persist wallet metadata only — no private keys or seed phrases.
    // Called by useWallets after generateing or deleting a wallet.
    try {
      const existing = this.fromLocalStorage()
      const merged = [...existing]
      for (const w of wallets) {
        const idx = merged.findIndex((e) => e.id === w.id)
        // Strip sensitive fields before writing
        const safe: Wallet = { ...w, privateKey: undefined, mnemonic: undefined }
        if (idx >= 0) merged[idx] = safe
        else merged.push(safe)
      }
      localStorage.setItem('u_wallets', JSON.stringify(merged))
    } catch { /* storage unavailable */ }
  },

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
