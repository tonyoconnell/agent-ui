import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { useCallback, useEffect, useState } from 'react'
import PayService from '../lib/PayService'
import type { Wallet } from '../lib/types'
import type { VaultWallet } from '../lib/vault/types'
import * as Vault from '../lib/vault/vault'
import { useNetwork } from './useNetwork'

// Base58 alphabet for Solana addresses and private keys
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function generateLocalAddress(chainId: string): string {
  const chain = chainId.toLowerCase()
  const chars = '0123456789abcdef'
  switch (chain) {
    case 'btc':
      return `bc1q${Array.from({ length: 38 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    case 'sol':
      return Array.from({ length: 44 }, () => BASE58_ALPHABET[Math.floor(Math.random() * 58)]).join('')
    case 'sui':
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    default:
      return `0x${Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
  }
}

function generateLocalPrivateKey(chainId: string): string {
  const chain = chainId.toLowerCase()
  const chars = '0123456789abcdef'
  switch (chain) {
    case 'btc':
      return `5${Array.from({ length: 50 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    case 'sol':
      return Array.from({ length: 88 }, () => BASE58_ALPHABET[Math.floor(Math.random() * 58)]).join('')
    case 'sui':
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    default:
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
  }
}

// Context (mainnet/testnet) is encoded in the wallet id prefix so the vault
// can store both without a dedicated column: "<context>-<chain>-<timestamp>".
function walletIdFor(context: 'mainnet' | 'testnet', chain: string): string {
  return `${context}-${chain}-${Date.now()}`
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
const LEGACY_KEYS = [
  'u_wallets',
  'u_keys',
  'u_secure_wallets',
  'u_password_check',
  'u_secure_settings',
]
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

      let address: string
      let privateKey: string
      let publicKey: string

      if (chain === 'sui') {
        const keypair = new Ed25519Keypair()
        address = keypair.toSuiAddress()
        privateKey = keypair.getSecretKey()
        publicKey = keypair.getPublicKey().toBase64()
      } else {
        address = generateLocalAddress(chain)
        privateKey = generateLocalPrivateKey(chain)
        publicKey = address
      }

      const existingForChain = wallets.filter((w) => w.chain === chain).length
      const chainUpper = chain.toUpperCase()
      const name =
        existingForChain === 0 ? `My ${chainUpper} Wallet` : `My ${chainUpper} Wallet ${existingForChain + 1}`
      const id = walletIdFor(context, chain)

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
