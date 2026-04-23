/**
 * WalletDetailPage - Individual Wallet View
 *
 * Features:
 * - Full transaction history for this wallet
 * - Real balance fetching from blockchain
 * - Quick actions (Send, Receive, Export)
 * - Address with QR code
 * - Activity feed
 */

import {
  Activity,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  Flame,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Wallet as WalletIcon,
  Zap,
} from 'lucide-react'
import { type ComponentType, useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import * as Vault from '../lib/vault/vault'
import { ReceiveSheet } from '../sheets/ReceiveSheet'
import { UNav } from '../UNav'

type ChainStyle = {
  tile: string
  icon: string
  ring: string
  accent: string
  surface: string
  dot: string
}

const CHAIN_STYLES: Record<string, ChainStyle> = {
  eth: {
    tile: 'bg-indigo-500/10',
    icon: 'text-indigo-400',
    ring: 'ring-indigo-500/20',
    accent: 'text-indigo-300',
    surface: 'from-indigo-500/10 via-background to-background',
    dot: 'bg-indigo-400',
  },
  btc: {
    tile: 'bg-orange-500/10',
    icon: 'text-orange-400',
    ring: 'ring-orange-500/20',
    accent: 'text-orange-300',
    surface: 'from-orange-500/10 via-background to-background',
    dot: 'bg-orange-400',
  },
  sol: {
    tile: 'bg-fuchsia-500/10',
    icon: 'text-fuchsia-400',
    ring: 'ring-fuchsia-500/20',
    accent: 'text-fuchsia-300',
    surface: 'from-fuchsia-500/10 via-background to-background',
    dot: 'bg-fuchsia-400',
  },
  sui: {
    tile: 'bg-sky-500/10',
    icon: 'text-sky-400',
    ring: 'ring-sky-500/20',
    accent: 'text-sky-300',
    surface: 'from-sky-500/10 via-background to-background',
    dot: 'bg-sky-400',
  },
  usdc: {
    tile: 'bg-blue-500/10',
    icon: 'text-blue-400',
    ring: 'ring-blue-500/20',
    accent: 'text-blue-300',
    surface: 'from-blue-500/10 via-background to-background',
    dot: 'bg-blue-400',
  },
  one: {
    tile: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
    accent: 'text-emerald-300',
    surface: 'from-emerald-500/10 via-background to-background',
    dot: 'bg-emerald-400',
  },
  unknown: {
    tile: 'bg-muted',
    icon: 'text-muted-foreground',
    ring: 'ring-border',
    accent: 'text-muted-foreground',
    surface: 'from-muted/40 via-background to-background',
    dot: 'bg-muted-foreground',
  },
}

const TX_ICONS: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  swap: ArrowLeftRight,
  mint: Sparkles,
  burn: Flame,
  deploy: FileCode,
  interact: Zap,
}

const TX_TILE: Record<string, string> = {
  send: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  receive: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  swap: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  mint: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  burn: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  deploy: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  interact: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
}

// Sui RPC endpoint (public mainnet)
const SUI_RPC = 'https://fullnode.mainnet.sui.io:443'

// CoinGecko price IDs
const COINGECKO_IDS: Record<string, string> = {
  eth: 'ethereum',
  btc: 'bitcoin',
  sol: 'solana',
  sui: 'sui',
}

const CHAINS = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    color: 'from-blue-500 to-indigo-600',
    icon: '⟠',
    decimals: 18,
    explorer: 'https://etherscan.io',
    explorerAddress: (addr: string) => `https://etherscan.io/address/${addr}`,
    explorerTx: (hash: string) => `https://etherscan.io/tx/${hash}`,
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    color: 'from-orange-400 to-orange-600',
    icon: '₿',
    decimals: 8,
    explorer: 'https://blockstream.info',
    explorerAddress: (addr: string) => `https://blockstream.info/address/${addr}`,
    explorerTx: (hash: string) => `https://blockstream.info/tx/${hash}`,
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    color: 'from-purple-500 to-pink-500',
    icon: '◎',
    decimals: 9,
    explorer: 'https://solscan.io',
    explorerAddress: (addr: string) => `https://solscan.io/account/${addr}`,
    explorerTx: (hash: string) => `https://solscan.io/tx/${hash}`,
  },
  {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    color: 'from-cyan-400 to-blue-500',
    icon: '💧',
    decimals: 9,
    explorer: 'https://suiscan.xyz',
    explorerAddress: (addr: string) => `https://suiscan.xyz/mainnet/account/${addr}`,
    explorerTx: (hash: string) => `https://suiscan.xyz/mainnet/tx/${hash}`,
  },
  {
    id: 'usdc',
    name: 'USDC',
    symbol: 'USDC',
    color: 'from-blue-400 to-blue-600',
    icon: '💵',
    decimals: 6,
    explorer: 'https://etherscan.io',
    explorerAddress: (addr: string) => `https://etherscan.io/address/${addr}#tokentxns`,
    explorerTx: (hash: string) => `https://etherscan.io/tx/${hash}`,
  },
  {
    id: 'one',
    name: 'ONEIE',
    symbol: 'ONE',
    color: 'from-emerald-400 to-teal-600',
    icon: '①',
    decimals: 18,
    explorer: 'https://etherscan.io',
    explorerAddress: (addr: string) => `https://etherscan.io/address/${addr}`,
    explorerTx: (hash: string) => `https://etherscan.io/tx/${hash}`,
  },
]

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  createdAt: number
  name?: string
  privateKey?: string
}

interface Transaction {
  id: string
  hash: string
  type: 'send' | 'receive' | 'swap' | 'mint' | 'burn' | 'deploy' | 'interact'
  from: string
  to: string
  amount: string
  token: string
  chain: string
  status: 'confirmed' | 'pending' | 'failed'
  timestamp: number
  gasUsed?: string
  gasFee?: string
  walletId?: string
}

interface WalletDetailPageProps {
  walletId: string | undefined
}

// Fetch token price from CoinGecko
async function fetchTokenPrice(chainId: string): Promise<number> {
  const geckoId = COINGECKO_IDS[chainId]
  if (!geckoId) return 0

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`)
    const data = (await response.json()) as Record<string, { usd?: number }>
    return data[geckoId]?.usd || 0
  } catch (error) {
    console.error('Failed to fetch price:', error)
    return 0
  }
}

// Fetch Sui balance using JSON-RPC
async function fetchSuiBalance(address: string): Promise<{ balance: string; usdValue: number }> {
  try {
    // Get SUI balance
    const response = await fetch(SUI_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_getBalance',
        params: [address, '0x2::sui::SUI'],
      }),
    })

    const data = (await response.json()) as { result?: { totalBalance?: string } }
    const totalBalance = data.result?.totalBalance || '0'
    const balanceInSui = parseInt(totalBalance, 10) / 1e9 // 9 decimals

    // Get price
    const price = await fetchTokenPrice('sui')
    const usdValue = balanceInSui * price

    return {
      balance: balanceInSui.toFixed(4),
      usdValue: Math.round(usdValue * 100) / 100,
    }
  } catch (error) {
    console.error('Failed to fetch SUI balance:', error)
    return { balance: '0', usdValue: 0 }
  }
}

// Fetch Sui transactions using JSON-RPC
async function fetchSuiTransactions(address: string): Promise<Transaction[]> {
  try {
    // Get transactions from address
    const response = await fetch(SUI_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_queryTransactionBlocks',
        params: [
          {
            filter: { FromAddress: address },
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
            },
          },
          null,
          20,
          true,
        ],
      }),
    })

    const data = (await response.json()) as { result?: { data?: Array<Record<string, any>> } }
    const txs = data.result?.data || []

    // Also get transactions TO this address
    const responseToAddr = await fetch(SUI_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'suix_queryTransactionBlocks',
        params: [
          {
            filter: { ToAddress: address },
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
            },
          },
          null,
          20,
          true,
        ],
      }),
    })

    const dataTo = (await responseToAddr.json()) as { result?: { data?: Array<Record<string, any>> } }
    const txsTo = dataTo.result?.data || []

    // Combine and dedupe
    const allTxs = [...txs, ...txsTo]
    const seen = new Set<string>()
    const uniqueTxs = allTxs.filter((tx) => {
      const digest = tx.digest
      if (seen.has(digest)) return false
      seen.add(digest)
      return true
    })

    return uniqueTxs.map((tx: Record<string, unknown>) => {
      const effects = tx.effects as Record<string, unknown> | undefined
      const status = (effects?.status as Record<string, string>)?.status
      const timestamp = tx.timestampMs as string | undefined
      const sender = (tx.transaction as Record<string, unknown>)?.data as Record<string, unknown> | undefined
      const senderAddr = (sender?.sender as string) || ''

      return {
        id: tx.digest as string,
        hash: tx.digest as string,
        type: senderAddr.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
        from: senderAddr,
        to: address,
        amount: '0', // Would need to parse events for actual amount
        token: 'SUI',
        chain: 'sui',
        status: status === 'success' ? 'confirmed' : 'failed',
        timestamp: timestamp ? parseInt(timestamp, 10) : Date.now(),
        walletId: '',
      } as Transaction
    })
  } catch (error) {
    console.error('Failed to fetch SUI transactions:', error)
    return []
  }
}

// Fetch ETH balance via public Cloudflare RPC (no API key required)
async function fetchEthBalance(address: string): Promise<{ balance: string; usdValue: number }> {
  try {
    const response = await fetch('https://cloudflare-eth.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    })
    const data = (await response.json()) as { result?: string }
    const hex = typeof data.result === 'string' && data.result.startsWith('0x') ? data.result : '0x0'
    const balanceWei = BigInt(hex)
    const balanceEth = Number(balanceWei) / 1e18

    if (!Number.isFinite(balanceEth)) {
      return { balance: '0', usdValue: 0 }
    }

    const price = await fetchTokenPrice('eth')
    const usdValue = Number.isFinite(balanceEth * price) ? balanceEth * price : 0

    return {
      balance: balanceEth.toFixed(6),
      usdValue: Math.round(usdValue * 100) / 100,
    }
  } catch (error) {
    console.error('Failed to fetch ETH balance:', error)
    return { balance: '0', usdValue: 0 }
  }
}

// Fetch SOL balance
async function fetchSolBalance(address: string): Promise<{ balance: string; usdValue: number }> {
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    })
    const data = (await response.json()) as { result?: { value?: number } }
    const balanceLamports = data.result?.value || 0
    const balanceSol = balanceLamports / 1e9

    const price = await fetchTokenPrice('sol')
    const usdValue = balanceSol * price

    return {
      balance: balanceSol.toFixed(4),
      usdValue: Math.round(usdValue * 100) / 100,
    }
  } catch (error) {
    console.error('Failed to fetch SOL balance:', error)
    return { balance: '0', usdValue: 0 }
  }
}

export function WalletDetailPage({ walletId }: WalletDetailPageProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allWallets, _setAllWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingTx, setFetchingTx] = useState(false)
  const [fetchingBalance, setFetchingBalance] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [showOwnWallets, setShowOwnWallets] = useState(false)
  const [copied, setCopied] = useState(false)
  const [keyRevealed, setKeyRevealed] = useState(false)
  const [liveBalance, setLiveBalance] = useState<{ balance: string; usdValue: number } | null>(null)

  useEffect(() => {
    if (!walletId) {
      setLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const v = await Vault.getWallet(walletId)
        if (!cancelled && v) {
          setWallet({
            id: v.id,
            name: v.name ?? `My ${v.chain.toUpperCase()} Wallet`,
            address: v.address,
            chain: v.chain.toLowerCase(),
            balance: v.balance,
            context: v.id.startsWith('testnet-') ? 'testnet' : 'mainnet',
            publicKey: v.publicKey || undefined,
            usdValue: v.usdValue,
            lastUpdated: v.createdAt,
          } as Wallet)
        }
      } catch {
        /* wallet missing or vault unavailable — loading state handles it */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const storedTx = localStorage.getItem('u_transactions')
    if (storedTx) {
      try {
        const allTx: Transaction[] = JSON.parse(storedTx)
        setTransactions(allTx.filter((tx) => tx.walletId === walletId))
      } catch {
        /* ignore */
      }
    }

    return () => {
      cancelled = true
    }
  }, [walletId])

  // Re-filter transactions when wallet is loaded
  useEffect(() => {
    if (wallet) {
      const storedTx = localStorage.getItem('u_transactions')
      if (storedTx) {
        const allTx: Transaction[] = JSON.parse(storedTx)
        const walletTx = allTx.filter(
          (tx) => tx.walletId === walletId || tx.from === wallet.address || tx.to === wallet.address,
        )
        setTransactions(walletTx)
      }
    }
  }, [wallet, walletId])

  const chain = wallet ? CHAINS.find((c) => c.id === wallet.chain) : null
  const defaultChain = {
    id: 'unknown',
    name: 'Unknown',
    symbol: '???',
    color: 'from-gray-400 to-gray-600',
    icon: '🔗',
    decimals: 18,
    explorer: '#',
    explorerAddress: (_addr: string) => `#`,
    explorerTx: (_hash: string) => `#`,
  }
  const chainInfo = chain || defaultChain

  // Fetch live balance from blockchain
  const fetchLiveBalance = useCallback(async () => {
    if (!wallet) return

    setFetchingBalance(true)
    try {
      let result: { balance: string; usdValue: number } | null = null

      switch (wallet.chain) {
        case 'sui':
          result = await fetchSuiBalance(wallet.address)
          break
        case 'eth':
          result = await fetchEthBalance(wallet.address)
          break
        case 'sol':
          result = await fetchSolBalance(wallet.address)
          break
        default: {
          // For other chains, just fetch price and use stored balance
          const price = await fetchTokenPrice(wallet.chain)
          const balance = parseFloat(wallet.balance) || 0
          result = {
            balance: wallet.balance,
            usdValue: Math.round(balance * price * 100) / 100,
          }
        }
      }

      if (result) {
        setLiveBalance(result)

        // Update wallet in storage
        const updatedWallet = { ...wallet, balance: result.balance, usdValue: result.usdValue }
        setWallet(updatedWallet)

        const _wallets = allWallets.map((w) => (w.id === wallet.id ? updatedWallet : w))
        // REMOVED: localStorage.setItem('u_wallets', JSON.stringify(wallets))
        // TODO: write to IndexedDB via useVault().updateBalance() instead
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    } finally {
      setFetchingBalance(false)
    }
  }, [wallet, allWallets])

  // Auto-fetch balance on load
  useEffect(() => {
    if (wallet && !liveBalance) {
      fetchLiveBalance()
    }
  }, [wallet, liveBalance, fetchLiveBalance])

  // Get the explorer URL for this wallet's address
  const getExplorerAddressUrl = () => {
    if (!wallet) return '#'
    return chainInfo.explorerAddress(wallet.address)
  }

  // Get the explorer URL for a transaction
  const getExplorerTxUrl = (hash: string) => {
    return chainInfo.explorerTx(hash)
  }

  // Fetch transactions from blockchain
  const fetchBlockchainTransactions = async () => {
    if (!wallet) return

    setFetchingTx(true)
    try {
      let parsedTx: Transaction[] = []

      if (wallet.chain === 'sui') {
        // Use Sui RPC
        parsedTx = await fetchSuiTransactions(wallet.address)
        parsedTx = parsedTx.map((tx) => ({ ...tx, walletId: wallet.id }))
      } else if (wallet.chain === 'eth') {
        // Use Etherscan API
        const response = await fetch(
          `https://api.etherscan.io/api?module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&sort=desc&apikey=demo`,
        )
        const data = (await response.json()) as { result?: Array<Record<string, string>> }

        if (data.result && Array.isArray(data.result)) {
          parsedTx = data.result.slice(0, 20).map((tx: Record<string, string>) => ({
            id: tx.hash,
            hash: tx.hash,
            type: tx.from.toLowerCase() === wallet.address.toLowerCase() ? 'send' : 'receive',
            from: tx.from,
            to: tx.to,
            amount: (parseInt(tx.value, 10) / 1e18).toFixed(6),
            token: 'ETH',
            chain: 'eth',
            status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
            timestamp: parseInt(tx.timeStamp, 10) * 1000,
            walletId: wallet.id,
            gasUsed: tx.gasUsed,
            gasFee: ((parseInt(tx.gasUsed, 10) * parseInt(tx.gasPrice, 10)) / 1e18).toFixed(8),
          }))
        }
      } else if (wallet.chain === 'sol') {
        // Use Solana RPC to get signatures
        const response = await fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignaturesForAddress',
            params: [wallet.address, { limit: 20 }],
          }),
        })
        const data = (await response.json()) as { result?: Array<Record<string, unknown>> }

        if (data.result && Array.isArray(data.result)) {
          parsedTx = data.result.map((sig: Record<string, unknown>) => ({
            id: sig.signature as string,
            hash: sig.signature as string,
            type: 'interact',
            from: wallet.address,
            to: '',
            amount: '0',
            token: 'SOL',
            chain: 'sol',
            status: sig.err ? 'failed' : 'confirmed',
            timestamp: ((sig.blockTime as number) || Date.now() / 1000) * 1000,
            walletId: wallet.id,
          }))
        }
      } else if (wallet.chain === 'btc') {
        // Use Blockstream API
        const response = await fetch(`https://blockstream.info/api/address/${wallet.address}/txs`)
        const data = (await response.json()) as Array<Record<string, unknown>>

        if (Array.isArray(data)) {
          parsedTx = data.slice(0, 20).map((tx: Record<string, unknown>) => ({
            id: tx.txid as string,
            hash: tx.txid as string,
            type: 'receive',
            from: '...',
            to: wallet.address,
            amount: '0',
            token: 'BTC',
            chain: 'btc',
            status: (tx.status as Record<string, boolean>)?.confirmed ? 'confirmed' : 'pending',
            timestamp: ((tx.status as Record<string, number>)?.block_time || Date.now() / 1000) * 1000,
            walletId: wallet.id,
          }))
        }
      }

      if (parsedTx.length > 0) {
        // Merge with existing transactions
        const existingHashes = new Set(transactions.map((t) => t.hash))
        const newTx = parsedTx.filter((t) => !existingHashes.has(t.hash))
        const merged = [...newTx, ...transactions].sort((a, b) => b.timestamp - a.timestamp)
        setTransactions(merged)

        // Save to localStorage
        const stored = localStorage.getItem('u_transactions')
        const allTx = stored ? JSON.parse(stored) : []
        const allHashes = new Set(allTx.map((t: Transaction) => t.hash))
        const toAdd = newTx.filter((t) => !allHashes.has(t.hash))
        localStorage.setItem('u_transactions', JSON.stringify([...toAdd, ...allTx]))
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setFetchingTx(false)
    }
  }

  // Check if chain supports live data fetching
  const supportsLiveFetch = ['sui', 'eth', 'sol', 'btc'].includes(wallet?.chain || '')

  const sameChainWallets = allWallets.filter((w) => w.chain === wallet?.chain && w.id !== wallet?.id)

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sendTransaction = () => {
    if (!wallet || !sendTo || !sendAmount) return

    // Create pending transaction (no fake hash - requires real SDK for broadcast)
    const timestamp = Date.now()
    const pendingTxId = `pending-${timestamp}`

    // Create send transaction for this wallet
    const sendTx: Transaction = {
      id: pendingTxId,
      hash: `PENDING-${pendingTxId}`, // Clearly marked as pending
      type: 'send',
      from: wallet.address,
      to: sendTo,
      amount: sendAmount,
      token: chainInfo.symbol,
      chain: wallet.chain,
      status: 'pending', // Pending until real broadcast
      timestamp,
      walletId: wallet.id,
    }

    // Save transaction
    const stored = localStorage.getItem('u_transactions')
    const allTx = stored ? JSON.parse(stored) : []
    allTx.unshift(sendTx)
    localStorage.setItem('u_transactions', JSON.stringify(allTx))

    // Update local state
    setTransactions((prev) => [sendTx, ...prev])

    // Note: Don't update balances since transaction is pending
    // Real balance will update when user fetches from blockchain after actual broadcast

    // Reset form
    setSendTo('')
    setSendAmount('')
    setShowSendDialog(false)
    setShowOwnWallets(false)
  }

  const getTypeIcon = (type: string) => TX_ICONS[type] || Zap
  const getTypeTile = (type: string) => TX_TILE[type] || 'bg-muted text-muted-foreground ring-border'

  const formatCreated = (timestamp?: number) => {
    if (!timestamp || Number.isNaN(timestamp)) return 'Just now'
    const d = new Date(timestamp)
    if (Number.isNaN(d.getTime())) return 'Just now'
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return `${minutes}m ago`
      }
      return `${hours}h ago`
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days}d ago`
    }
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <UNav active="wallets" />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-background">
        <UNav active="wallets" />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Card className="p-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-muted ring-1 ring-border">
              <Search className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Wallet Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The wallet you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => (window.location.href = '/u/wallets')} className="gap-1">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              Back to Wallets
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const style = CHAIN_STYLES[wallet.chain] ?? CHAIN_STYLES.unknown
  const safeBalance = (raw: string | number | undefined) => {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''))
    return Number.isFinite(n) ? n.toFixed(6) : '0.000000'
  }
  const safeUsd = (raw: number | undefined) => {
    const n = Number(raw)
    return Number.isFinite(n)
      ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00'
  }
  const displayBalance = liveBalance !== null ? safeBalance(liveBalance.balance) : safeBalance(wallet.balance)
  const displayUsd = liveBalance !== null ? safeUsd(liveBalance.usdValue) : safeUsd(wallet.usdValue)
  const isLive = liveBalance !== null && liveBalance.balance !== String(wallet.balance)

  return (
    <div className="min-h-screen bg-background">
      <UNav active="wallets" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => (window.location.href = '/u/wallets')}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          Back to Wallets
        </Button>

        {/* Hero Card */}
        <Card className={cn('mb-6 overflow-hidden border-border/60 bg-gradient-to-br shadow-sm', style.surface)}>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:gap-7">
              {/* Identity row */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div
                  className={cn(
                    'flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-[20px] ring-1 shrink-0',
                    style.tile,
                    style.ring,
                  )}
                >
                  <WalletIcon className={cn('h-7 w-7 sm:h-8 sm:w-8', style.icon)} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                      {wallet.name || chainInfo.name}
                    </h1>
                    <Badge variant="secondary" className="rounded-full font-medium tracking-wide">
                      {chainInfo.symbol}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Created {formatCreated(wallet.createdAt)}
                  </p>
                </div>
              </div>

              {/* Balance */}
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                  Balance
                  {fetchingBalance && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                </div>
                <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                  <span className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight">
                    {displayBalance}
                  </span>
                  <span className="text-lg sm:text-xl font-medium text-muted-foreground">{chainInfo.symbol}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                  <span className="tabular-nums">≈ ${displayUsd}</span>
                  {isLive && (
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', style.accent)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', style.dot)} />
                      Live
                    </span>
                  )}
                </div>
              </div>

              {/* Address pill */}
              <button
                type="button"
                onClick={copyAddress}
                className="group flex items-center gap-3 rounded-2xl bg-background/60 hover:bg-background/90 border border-border/60 px-4 py-3 text-left transition-colors"
              >
                <code className="flex-1 min-w-0 truncate font-mono text-xs sm:text-sm text-foreground/90">
                  {wallet.address}
                </code>
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" strokeWidth={2} />
                      <span className="hidden sm:inline">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" strokeWidth={1.75} />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Action Tiles */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6 sm:mb-8">
          <ActionTile
            icon={ArrowUpRight}
            label="Send"
            toneClasses={cn(style.tile, style.icon, style.ring)}
            onClick={() => setShowSendDialog(true)}
          />
          <ActionTile
            icon={ArrowDownLeft}
            label="Receive"
            toneClasses="bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
            onClick={() => setShowReceiveDialog(true)}
          />
          <ActionTile
            icon={ExternalLink}
            label="Explorer"
            toneClasses="bg-slate-500/10 text-slate-300 ring-slate-500/20"
            onClick={() => window.open(getExplorerAddressUrl(), '_blank')}
          />
          <ActionTile
            icon={ArrowDownToLine}
            label={fetchingTx ? 'Fetching' : 'Fetch TX'}
            loading={fetchingTx}
            disabled={fetchingTx || !supportsLiveFetch}
            toneClasses="bg-violet-500/10 text-violet-300 ring-violet-500/20"
            onClick={fetchBlockchainTransactions}
          />
          <ActionTile
            icon={RefreshCw}
            label={fetchingBalance ? 'Refreshing' : 'Refresh'}
            loading={fetchingBalance}
            disabled={fetchingBalance || !supportsLiveFetch}
            toneClasses="bg-cyan-500/10 text-cyan-300 ring-cyan-500/20"
            onClick={fetchLiveBalance}
          />
          <ActionTile
            icon={KeyRound}
            label="Export Key"
            toneClasses="bg-amber-500/10 text-amber-300 ring-amber-500/20"
            onClick={() => setShowExportDialog(true)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                    <ArrowLeftRight className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight">Transaction History</CardTitle>
                    <CardDescription className="text-xs">All transactions for this wallet</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-10 sm:py-14">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-muted ring-1 ring-border mb-4">
                      <ArrowDownToLine className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight mb-1">No Transactions Yet</h3>
                    <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                      Send or receive funds to see your transaction history
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button size="sm" onClick={() => setShowReceiveDialog(true)} className="gap-1.5">
                        <ArrowDownLeft className="h-4 w-4" strokeWidth={1.75} />
                        Receive Funds
                      </Button>
                      {supportsLiveFetch && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={fetchBlockchainTransactions}
                          disabled={fetchingTx}
                          className="gap-1.5"
                        >
                          {fetchingTx ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                          ) : (
                            <ArrowDownToLine className="h-4 w-4" strokeWidth={1.75} />
                          )}
                          {fetchingTx ? 'Loading' : 'Fetch from Chain'}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 -mx-6">
                    {transactions.map((tx) => {
                      const Icon = getTypeIcon(tx.type)
                      return (
                        <button
                          type="button"
                          key={tx.id}
                          className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-muted/40 transition-colors text-left group"
                          onClick={() => window.open(getExplorerTxUrl(tx.hash), '_blank')}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-xl ring-1 shrink-0',
                                getTypeTile(tx.type),
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-medium capitalize text-sm">
                                {tx.type}
                                <ExternalLink
                                  className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  strokeWidth={1.75}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground font-mono truncate">
                                {tx.type === 'send' ? `To · ${tx.to.slice(0, 10)}…` : `From · ${tx.from.slice(0, 10)}…`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div
                              className={cn(
                                'font-semibold tabular-nums text-sm',
                                tx.type === 'receive' && 'text-emerald-400',
                                tx.type === 'send' && 'text-rose-400',
                              )}
                            >
                              {tx.type === 'receive' ? '+' : tx.type === 'send' ? '−' : ''}
                              {tx.amount} {tx.token}
                            </div>
                            <div className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Activity */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                    <Activity className="h-4 w-4 text-violet-400" strokeWidth={1.75} />
                  </div>
                  <CardTitle className="text-base font-semibold tracking-tight">Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-semibold tabular-nums">{transactions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="font-semibold tabular-nums text-rose-400">
                    {transactions.filter((t) => t.type === 'send').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Received</span>
                  <span className="font-semibold tabular-nums text-emerald-400">
                    {transactions.filter((t) => t.type === 'receive').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Same Chain Wallets */}
            {sameChainWallets.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl ring-1',
                        style.tile,
                        style.ring,
                      )}
                    >
                      <WalletIcon className={cn('h-4 w-4', style.icon)} strokeWidth={1.75} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold tracking-tight">
                        Other {chainInfo.symbol} Wallets
                      </CardTitle>
                      <CardDescription className="text-xs">Quick transfer between your wallets</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {sameChainWallets.map((w) => (
                    <button
                      type="button"
                      key={w.id}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
                      onClick={() => (window.location.href = `/u/wallet/${w.id}`)}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{w.name || chainInfo.name}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {w.address.slice(0, 8)}…{w.address.slice(-6)}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="font-semibold text-sm tabular-nums">{w.balance}</div>
                        <div className="text-xs text-muted-foreground">{chainInfo.symbol}</div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Security Reminder */}
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 shrink-0">
                    <ShieldAlert className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-amber-300 mb-0.5">Security Reminder</h4>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      Never share your private key. Back up your recovery phrase securely.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Send Dialog */}
      <Dialog
        open={showSendDialog}
        onOpenChange={(open) => {
          setShowSendDialog(open)
          if (!open) {
            setShowOwnWallets(false)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span
                className={cn('flex h-9 w-9 items-center justify-center rounded-xl ring-1', style.tile, style.ring)}
              >
                <ArrowUpRight className={cn('h-4 w-4', style.icon)} strokeWidth={1.75} />
              </span>
              <span className="font-semibold tracking-tight">Send {chainInfo.symbol}</span>
            </DialogTitle>
            <DialogDescription>Send from {wallet.name || chainInfo.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Recipient Address</label>
              <Input
                placeholder={`Enter ${chainInfo.symbol} address`}
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>

            {/* Quick select own wallets */}
            {sameChainWallets.length > 0 && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowOwnWallets(!showOwnWallets)}
                >
                  {showOwnWallets ? 'Hide' : 'Send to'} My Other {chainInfo.symbol} Wallets
                </Button>
                {showOwnWallets && (
                  <div className="mt-2 space-y-2 p-3 bg-muted rounded-lg">
                    {sameChainWallets.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2 bg-background rounded cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          setSendTo(w.address)
                          setShowOwnWallets(false)
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm">{w.name || chainInfo.name}</div>
                          <code className="text-xs text-muted-foreground">
                            {w.address.slice(0, 10)}...{w.address.slice(-8)}
                          </code>
                        </div>
                        <Badge variant="secondary">
                          {w.balance} {chainInfo.symbol}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Amount</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                />
                <Button variant="outline" onClick={() => setSendAmount(wallet.balance)}>
                  Max
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Available: {wallet.balance} {chainInfo.symbol}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button disabled={!sendTo || !sendAmount} onClick={sendTransaction} className="gap-1.5">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              Send {chainInfo.symbol}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Sheet — real QR, copy, share, payment link */}
      <ReceiveSheet
        open={showReceiveDialog}
        onOpenChange={setShowReceiveDialog}
        wallet={{ id: wallet.id, address: wallet.address }}
        chain={{
          id: chainInfo.id,
          name: chainInfo.name,
          symbol: chainInfo.symbol,
          color: chainInfo.color,
          icon: chainInfo.icon,
        }}
      />

      {/* Export Key Dialog */}
      <Dialog
        open={showExportDialog}
        onOpenChange={(open) => {
          setShowExportDialog(open)
          if (!open) setKeyRevealed(false)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <KeyRound className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
              </span>
              <span className="font-semibold tracking-tight">Export Private Key</span>
            </DialogTitle>
            <DialogDescription>Your private key gives full access to this wallet</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-start gap-2.5 mb-2">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-rose-300">Security Warning</p>
              </div>
              <ul className="text-xs text-rose-200/80 space-y-1 pl-6 leading-relaxed">
                <li>Never share your private key with anyone</li>
                <li>Anyone with this key can steal your funds</li>
                <li>Store it in a secure, offline location</li>
              </ul>
            </div>

            {!keyRevealed ? (
              <button
                type="button"
                className="w-full p-6 bg-muted/60 rounded-2xl text-center hover:bg-muted transition-colors border border-border/60"
                onClick={() => setKeyRevealed(true)}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-background ring-1 ring-border">
                  <Eye className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="font-medium text-sm">Click to reveal private key</p>
                <p className="text-xs text-muted-foreground mt-0.5">Make sure no one is watching</p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                  <code className="text-xs font-mono break-all text-amber-200/90">
                    {wallet.privateKey || 'No key available'}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.privateKey || '')
                    }}
                  >
                    <Copy className="h-4 w-4" strokeWidth={1.75} />
                    Copy Key
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => setKeyRevealed(false)}>
                    <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                    Hide Key
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type ActionTileProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  toneClasses: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

function ActionTile({ icon: Icon, label, toneClasses, onClick, disabled, loading }: ActionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card',
        'px-2 py-3 sm:py-4 transition-all',
        'hover:bg-muted/60 active:scale-[0.98]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card disabled:active:scale-100',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl ring-1 transition-transform',
          'group-hover:scale-[1.04] group-disabled:group-hover:scale-100',
          toneClasses,
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
        ) : (
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        )}
      </span>
      <span className="text-[11px] sm:text-xs font-medium text-foreground/90">{label}</span>
    </button>
  )
}
