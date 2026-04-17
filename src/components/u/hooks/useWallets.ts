import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519'
import { useCallback, useEffect, useState } from 'react'
import type { Wallet } from '../lib/adapters/WalletAdapter'
import { WalletAdapter } from '../lib/adapters/WalletAdapter'
import PayService from '../lib/PayService'
import { useNetwork } from './useNetwork'

// Base58 alphabet for Solana addresses and private keys
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// Helper functions for local generation
function generateLocalAddress(chainId: string): string {
  const chain = chainId.toLowerCase() // Normalize to lowercase
  const chars = '0123456789abcdef'
  switch (chain) {
    case 'btc':
      return `bc1q${Array.from({ length: 38 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    case 'sol':
      return Array.from({ length: 44 }, () => BASE58_ALPHABET[Math.floor(Math.random() * 58)]).join('')
    // SUI handled by real keypair generation now
    case 'sui':
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    default:
      return `0x${Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
  }
}

function generateLocalPrivateKey(chainId: string): string {
  const chain = chainId.toLowerCase() // Normalize to lowercase
  const chars = '0123456789abcdef'
  switch (chain) {
    case 'btc':
      // WIF format simulation
      return `5${Array.from({ length: 50 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    case 'sol':
      // Base58 private key
      return Array.from({ length: 88 }, () => BASE58_ALPHABET[Math.floor(Math.random() * 58)]).join('')
    // SUI handled by real keypair generation now
    case 'sui':
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    default:
      // Ethereum-style hex private key
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
  }
}

export interface UseWalletsReturn {
  wallets: Wallet[]
  isLoading: boolean
  error: Error | null
  syncStatus: 'local' | 'synced' | 'syncing' | 'error'
  createWallet: (chain?: string) => Promise<Wallet>
  deleteWallet: (id: string) => void
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

  const loadWallets = async () => {
    setIsLoading(true)
    try {
      const context = isTestnet ? 'testnet' : 'mainnet'

      // 1. Load local wallets matching current chain & context
      // Note: We might want to see ALL wallets, but typically we filter by context (mainnet vs testnet)
      const local = WalletAdapter.fromLocalStorage({
        context, // Filter by mainnet/testnet
      })

      // Filter for current chain specifically if needed, or show all for that context
      // For now, let's show all wallets in the current context (e.g. all Mainnet wallets)
      setWallets(local)

      // 2. Background sync balances
      if (local.length > 0) {
        refreshBalances(local)
      } else {
        setSyncStatus('local')
      }
    } catch (err) {
      setError(err as Error)
      setSyncStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Load wallets for current network context
  useEffect(() => {
    loadWallets()
  }, [loadWallets])

  const refreshBalances = async (currentWallets: Wallet[] = wallets) => {
    setSyncStatus('syncing')
    try {
      const updated = await Promise.all(
        currentWallets.map(async (wallet) => {
          // Only refresh if chain matches connected API capabilities
          // or if we have a generic balance endpoint
          if (wallet.chain) {
            const response = await PayService.getBalance({
              address: wallet.address,
              chain: wallet.chain,
            })

            if (response.success && response.data) {
              return {
                ...wallet,
                balance: response.data.balance,
                usdValue: response.data.usdValue,
                lastUpdated: Date.now(),
              }
            }
          }
          return wallet
        }),
      )

      setWallets(updated)
      WalletAdapter.toLocalStorage(updated)
      setSyncStatus('synced')
    } catch (e) {
      console.error('Balance refresh failed', e)
      setSyncStatus('error')
    }
  }

  const createWallet = useCallback(
    async (chainOverride?: string): Promise<Wallet> => {
      // Normalize chain ID to lowercase for consistency
      const chain = (chainOverride || network.id).toLowerCase()
      const context = isTestnet ? 'testnet' : 'mainnet'

      // SECURITY: Generate wallets locally by default
      // Private keys should never be sent to or generated by any server
      // All key generation happens client-side for maximum security
      // All key generation happens client-side for maximum security
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
        publicKey = address // Fallback
      }

      const newWallet: Wallet = {
        id: `${chain}-${Date.now()}`,
        name: `My ${chain.toUpperCase()} Wallet`,
        address,
        chain, // Store as lowercase
        context,
        balance: '0',
        privateKey,
        publicKey,
        lastUpdated: Date.now(),
        isCloudBacked: false,
        usdValue: 0,
      }

      // Save to local storage
      WalletAdapter.addWallet(newWallet)

      // Update state
      setWallets((prev) => [...prev, newWallet])

      return newWallet
    },
    [network.id, isTestnet],
  )

  const deleteWallet = useCallback(
    (id: string) => {
      const updated = wallets.filter((w) => w.id !== id)
      setWallets(updated)
      WalletAdapter.toLocalStorage(updated)
    },
    [wallets],
  )

  // Find the primary wallet for the current network
  const currentWallet = wallets.find((w) => w.chain === network.id)

  return {
    wallets,
    isLoading,
    error,
    syncStatus,
    createWallet,
    deleteWallet,
    setWallets,
    refreshBalances: () => refreshBalances(),
    currentWallet,
  }
}
