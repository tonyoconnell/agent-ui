import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { useCallback, useEffect, useState } from 'react'
import PayService from '../lib/PayService'
import type { Wallet } from '../lib/types'
import { syncToCloud } from '../lib/vault/sync'
import type { VaultWallet } from '../lib/vault/types'
import * as Vault from '../lib/vault/vault'
import { useNetwork } from './useNetwork'

// Stable wallet ID: "<context>-<chain>-<index>". The index is determined at
// creation time by counting existing wallets for that chain+context. This
// makes the HKDF derivation domain stable so the same key is re-derived on
// every sign-in — no cloud backup needed to recover.
function walletIdFor(context: 'mainnet' | 'testnet', chain: string, index: number): string {
  return `${context}-${chain}-${index}`
}

function contextOf(walletId: string): 'mainnet' | 'testnet' {
  return walletId.startsWith('testnet-') ? 'testnet' : 'mainnet'
}

function toWallet(v: VaultWallet): Wallet {
  return {
    id: v.id,
    name: v.name ?? `My ${v.chain.toUpperCase()} Wallet`,
    address: v.address,
    chain: v.chain.toLowerCase(),
    balance: v.balance,
    context: contextOf(v.id),
    publicKey: v.publicKey || undefined,
    usdValue: v.usdValue,
    lastUpdated: v.createdAt,
    isCloudBacked: false,
  }
}

// One-shot: nuke legacy localStorage the first time the new hook loads on
// this device. The vault is the single source of truth going forward.
const LEGACY_KEYS = ['u_wallets', 'u_keys', 'u_secure_wallets', 'u_password_check', 'u_secure_settings']
const LEGACY_CLEARED_FLAG = 'u_legacy_cleared_v1'

function wipeLegacyOnce(): void {
  try {
    if (localStorage.getItem(LEGACY_CLEARED_FLAG)) return
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
    localStorage.setItem(LEGACY_CLEARED_FLAG, String(Date.now()))
  } catch {
    /* storage unavailable — no-op */
  }
}

export interface UseWalletsReturn {
  wallets: Wallet[]
  isLoading: boolean
  error: Error | null
  syncStatus: 'local' | 'synced' | 'syncing' | 'error'
  isLocked: boolean
  createWallet: (chain?: string) => Promise<Wallet>
  deleteWallet: (id: string) => Promise<void>
  setWallets: (wallets: Wallet[]) => void
  refreshBalances: () => Promise<void>
  currentWallet: Wallet | undefined
}

export function useWallets(): UseWalletsReturn {
  const { network, isTestnet } = useNetwork()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [syncStatus, setSyncStatus] = useState<'local' | 'synced' | 'syncing' | 'error'>('local')
  const [isLocked, setIsLocked] = useState(true)

  const refreshBalances = useCallback(async (currentWallets: Wallet[]) => {
    setSyncStatus('syncing')
    try {
      const updated = await Promise.all(
        currentWallets.map(async (wallet) => {
          if (!wallet.chain) return wallet
          const response = await PayService.getBalance({
            address: wallet.address,
            chain: wallet.chain,
          })
          if (response.success && response.data) {
            await Vault.updateBalance(wallet.id, response.data.balance, response.data.usdValue ?? 0)
            return {
              ...wallet,
              balance: response.data.balance,
              usdValue: response.data.usdValue,
              lastUpdated: Date.now(),
            }
          }
          return wallet
        }),
      )
      setWallets(updated)
      setSyncStatus('synced')
    } catch (e) {
      console.error('Balance refresh failed', e)
      setSyncStatus('error')
    }
  }, [])

  const loadWallets = useCallback(async () => {
    setIsLoading(true)
    try {
      wipeLegacyOnce()
      const context = isTestnet ? 'testnet' : 'mainnet'
      const status = await Vault.getStatus()
      setIsLocked(status.isLocked)

      const all = await Vault.listWallets()
      const filtered = all.filter((w) => contextOf(w.id) === context).map(toWallet)
      setWallets(filtered)

      if (filtered.length > 0) {
        void refreshBalances(filtered)
        // Push current vault state to cloud on every load so the blob stays
        // fresh even if a prior wallet-creation sync was lost.
        void syncToCloud()
      } else {
        setSyncStatus('local')
      }
    } catch (err) {
      setError(err as Error)
      setSyncStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [isTestnet, refreshBalances])

  useEffect(() => {
    void loadWallets()
  }, [loadWallets])

  const createWallet = useCallback(
    async (chainOverride?: string): Promise<Wallet> => {
      const chain = (chainOverride || network.id).toLowerCase()
      const context = isTestnet ? 'testnet' : 'mainnet'

      // Index = number of existing wallets for this chain+context. Stable
      // across devices: the Nth wallet for "mainnet/sui" always gets index N-1.
      const existingForChain = wallets.filter((w) => w.chain === chain && w.context === context).length
      const index = existingForChain
      const id = walletIdFor(context, chain, index)

      // Derive the wallet seed deterministically from the vault master.
      // Touch ID → PRF → master → HKDF(chain, index, context) → seed.
      // Same passkey always produces the same seed → same keypair → same address.
      const seed = await Vault.deriveWalletSeed(chain, index, context)

      let address: string
      let privateKey: string
      let publicKey: string

      if (chain === 'sui') {
        const keypair = Ed25519Keypair.fromSecretKey(seed)
        address = keypair.toSuiAddress()
        privateKey = keypair.getSecretKey()
        publicKey = keypair.getPublicKey().toBase64()
      } else {
        // For chains without a proper SDK wired yet, derive deterministically
        // from seed bytes so address is stable across sessions.
        const hex = Array.from(seed)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        address = chain === 'btc' ? `bc1q${hex.slice(0, 38)}` : `0x${hex.slice(0, 40)}`
        privateKey = `0x${hex}`
        publicKey = address
      }

      const chainUpper = chain.toUpperCase()
      const name =
        existingForChain === 0 ? `My ${chainUpper} Wallet` : `My ${chainUpper} Wallet ${existingForChain + 1}`

      // Persist to vault (requires unlocked session). Encryption happens inside.
      await Vault.saveWallet({
        id,
        chain,
        address,
        publicKey,
        privateKey,
        balance: '0',
        usdValue: 0,
        name,
      })

      // Explicit sync — don't rely solely on the mutation-listener side-effect.
      void syncToCloud().then((r) => {
        if (!r.ok) console.warn('[vault] cloud sync failed after createWallet:', r.reason)
      })

      // In-memory Wallet for the UI. privateKey is attached ONCE for the
      // onboarding carousel to display — it is not persisted in React state
      // and will be gone on the next reload.
      const newWallet: Wallet = {
        id,
        name,
        address,
        chain,
        context,
        balance: '0',
        privateKey,
        publicKey,
        lastUpdated: Date.now(),
        isCloudBacked: false,
        usdValue: 0,
      }

      // Reload from vault so state matches persisted truth (without privateKey).
      const all = await Vault.listWallets()
      const filtered = all.filter((w) => contextOf(w.id) === context).map(toWallet)
      setWallets(filtered)

      void fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'ui',
          receiver: 'substrate:u:generate',
          data: { weight: 1, tags: ['u', 'vault', chain ?? ''], content: { verb: 'generate', chain, outcome: 'ok' } },
        }),
      })

      return newWallet
    },
    [network.id, isTestnet, wallets],
  )

  const deleteWallet = useCallback(
    async (id: string) => {
      await Vault.deleteWallet(id)
      void syncToCloud().then((r) => {
        if (!r.ok) console.warn('[vault] cloud sync failed after deleteWallet:', r.reason)
      })
      const context = isTestnet ? 'testnet' : 'mainnet'
      const all = await Vault.listWallets()
      setWallets(all.filter((w) => contextOf(w.id) === context).map(toWallet))
      void fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'ui',
          receiver: 'substrate:u:delete',
          data: { weight: 1, tags: ['u', 'vault'], content: { verb: 'delete', outcome: 'ok' } },
        }),
      })
    },
    [isTestnet],
  )

  const currentWallet = wallets.find((w) => w.chain === network.id)

  return {
    wallets,
    isLoading,
    error,
    syncStatus,
    isLocked,
    createWallet,
    deleteWallet,
    setWallets,
    refreshBalances: () => refreshBalances(wallets),
    currentWallet,
  }
}
