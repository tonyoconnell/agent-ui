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

import { useCallback, useEffect, useState } from 'react'
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
import { UNav } from '../UNav'

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
    const data = await response.json()
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

    const data = await response.json()
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

    const data = await response.json()
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

    const dataTo = await responseToAddr.json()
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

// Fetch ETH balance
async function fetchEthBalance(address: string): Promise<{ balance: string; usdValue: number }> {
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=demo`,
    )
    const data = await response.json()
    const balanceWei = data.result || '0'
    const balanceEth = parseInt(balanceWei, 10) / 1e18

    const price = await fetchTokenPrice('eth')
    const usdValue = balanceEth * price

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
    const data = await response.json()
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
  const [allWallets, setAllWallets] = useState<Wallet[]>([])
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

    // Load wallets from localStorage
    const storedWallets = localStorage.getItem('u_wallets')
    if (storedWallets) {
      const wallets: Wallet[] = JSON.parse(storedWallets)
      setAllWallets(wallets)
      const found = wallets.find((w) => w.id === walletId)
      if (found) {
        setWallet(found)
      }
    }

    // Load transactions
    const storedTx = localStorage.getItem('u_transactions')
    if (storedTx) {
      const allTx: Transaction[] = JSON.parse(storedTx)
      // Filter transactions for this wallet
      const walletTx = allTx.filter(
        (tx) => tx.walletId === walletId || (wallet && (tx.from === wallet.address || tx.to === wallet.address)),
      )
      setTransactions(walletTx)
    }

    setLoading(false)
  }, [walletId, wallet.address, wallet])

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

        const wallets = allWallets.map((w) => (w.id === wallet.id ? updatedWallet : w))
        localStorage.setItem('u_wallets', JSON.stringify(wallets))
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
        const data = await response.json()

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
        const data = await response.json()

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
        const data = await response.json()

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

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      send: '↗',
      receive: '↙',
      swap: '⇄',
      mint: '✨',
      burn: '🔥',
      deploy: '📜',
      interact: '⚡',
    }
    return icons[type] || '•'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'send':
        return 'text-red-500'
      case 'receive':
        return 'text-green-500'
      case 'swap':
        return 'text-blue-500'
      case 'mint':
        return 'text-purple-500'
      default:
        return 'text-muted-foreground'
    }
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
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin text-4xl">⏳</div>
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
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Wallet Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The wallet you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => (window.location.href = '/u/wallets')}>← Back to Wallets</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <UNav active="wallets" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4" onClick={() => (window.location.href = '/u/wallets')}>
          ← Back to Wallets
        </Button>

        {/* Hero Section */}
        <Card
          className={`mb-8 overflow-hidden border-2 bg-gradient-to-br ${chainInfo.color}/10 border-${chainInfo.color.split(' ')[0].replace('from-', '')}/30`}
        >
          <CardContent className="p-0">
            <div className="relative">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${chainInfo.color} opacity-10`} />
              <div
                className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${chainInfo.color} opacity-20 rounded-full blur-3xl -translate-y-32 translate-x-32`}
              />

              <div className="relative p-8">
                <div className="flex items-start justify-between">
                  {/* Wallet Info */}
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${chainInfo.color} flex items-center justify-center text-5xl text-white shadow-2xl`}
                    >
                      {chainInfo.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{wallet.name || chainInfo.name}</h1>
                        <Badge variant="outline" className="text-lg px-3">
                          {chainInfo.symbol}
                        </Badge>
                      </div>
                      <div
                        className="flex items-center gap-2 p-3 bg-black/5 dark:bg-white/5 rounded-lg cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        onClick={copyAddress}
                      >
                        <code className="font-mono text-sm">{wallet.address}</code>
                        <span className="text-lg">{copied ? '✓' : '📋'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Created {new Date(wallet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center justify-end gap-2">
                      Balance
                      {fetchingBalance && <span className="animate-spin">⟳</span>}
                    </div>
                    <div className="text-5xl font-bold mb-1">
                      {liveBalance !== null ? parseFloat(liveBalance.balance).toFixed(6) : wallet.balance}{' '}
                      <span className="text-2xl text-muted-foreground">{chainInfo.symbol}</span>
                    </div>
                    <div className="text-2xl text-muted-foreground">
                      ≈ $
                      {liveBalance !== null ? liveBalance.usdValue.toLocaleString() : wallet.usdValue.toLocaleString()}
                    </div>
                    {liveBalance !== null && liveBalance.balance !== String(wallet.balance) && (
                      <div className="text-xs text-green-500 mt-1">Live from blockchain</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <Button
            size="lg"
            className={`h-20 bg-gradient-to-br ${chainInfo.color} text-white hover:opacity-90`}
            onClick={() => setShowSendDialog(true)}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">↗</div>
              <div className="font-semibold">Send</div>
            </div>
          </Button>
          <Button size="lg" variant="outline" className="h-20" onClick={() => setShowReceiveDialog(true)}>
            <div className="text-center">
              <div className="text-2xl mb-1">↙</div>
              <div className="font-semibold">Receive</div>
            </div>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-20"
            onClick={() => window.open(getExplorerAddressUrl(), '_blank')}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🔍</div>
              <div className="font-semibold">Explorer</div>
            </div>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-20"
            onClick={fetchBlockchainTransactions}
            disabled={fetchingTx || !supportsLiveFetch}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{fetchingTx ? '⏳' : '📥'}</div>
              <div className="font-semibold">{fetchingTx ? 'Loading...' : 'Fetch TX'}</div>
            </div>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-20"
            onClick={fetchLiveBalance}
            disabled={fetchingBalance || !supportsLiveFetch}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{fetchingBalance ? '⏳' : '💰'}</div>
              <div className="font-semibold">{fetchingBalance ? 'Loading...' : 'Refresh'}</div>
            </div>
          </Button>
          <Button size="lg" variant="outline" className="h-20" onClick={() => setShowExportDialog(true)}>
            <div className="text-center">
              <div className="text-2xl mb-1">🔐</div>
              <div className="font-semibold">Export Key</div>
            </div>
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Transaction History */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>↔️</span> Transaction History
                </CardTitle>
                <CardDescription>All transactions for this wallet</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground mb-4">Send or receive funds to see your transaction history</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setShowReceiveDialog(true)}>↙ Receive Funds</Button>
                      {supportsLiveFetch && (
                        <Button variant="outline" onClick={fetchBlockchainTransactions} disabled={fetchingTx}>
                          {fetchingTx ? '⏳ Loading...' : '📥 Fetch from Chain'}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                        onClick={() => window.open(getExplorerTxUrl(tx.hash), '_blank')}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl ${getTypeColor(tx.type)}`}
                          >
                            {getTypeIcon(tx.type)}
                          </div>
                          <div>
                            <div className="font-semibold capitalize flex items-center gap-2">
                              {tx.type}
                              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                🔗 View on Explorer
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {tx.type === 'send' ? `To: ${tx.to.slice(0, 10)}...` : `From: ${tx.from.slice(0, 10)}...`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${tx.type === 'receive' ? 'text-green-500' : tx.type === 'send' ? 'text-red-500' : ''}`}
                          >
                            {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}
                            {tx.amount} {tx.token}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatDate(tx.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-bold">{transactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="font-bold text-red-500">{transactions.filter((t) => t.type === 'send').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received</span>
                  <span className="font-bold text-green-500">
                    {transactions.filter((t) => t.type === 'receive').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Same Chain Wallets */}
            {sameChainWallets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">👛 Other {chainInfo.symbol} Wallets</CardTitle>
                  <CardDescription>Quick transfer between your wallets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sameChainWallets.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/u/wallet/${w.id}`)}
                    >
                      <div>
                        <div className="font-medium text-sm">{w.name || chainInfo.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {w.address.slice(0, 8)}...{w.address.slice(-6)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{w.balance}</div>
                        <div className="text-xs text-muted-foreground">{chainInfo.symbol}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Security Reminder */}
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Security Reminder</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
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
            <DialogTitle className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${chainInfo.color} flex items-center justify-center text-white`}
              >
                {chainInfo.icon}
              </span>
              Send {chainInfo.symbol}
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
            <Button
              disabled={!sendTo || !sendAmount}
              onClick={sendTransaction}
              className={`bg-gradient-to-r ${chainInfo.color} text-white`}
            >
              Send {chainInfo.symbol}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${chainInfo.color} flex items-center justify-center text-white`}
              >
                {chainInfo.icon}
              </span>
              Receive {chainInfo.symbol}
            </DialogTitle>
            <DialogDescription>Share your address to receive funds</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-white dark:bg-black p-6 rounded-xl text-center mb-4">
              {/* QR Code placeholder - in production use a QR library */}
              <div className="w-48 h-48 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-4 grid grid-cols-8 gap-0.5">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className={`${Math.random() > 0.5 ? 'bg-black dark:bg-white' : 'bg-transparent'}`} />
                  ))}
                </div>
                <div
                  className={`absolute w-12 h-12 rounded bg-gradient-to-br ${chainInfo.color} flex items-center justify-center text-white text-xl z-10`}
                >
                  {chainInfo.icon}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-2">Scan or copy address</div>
            </div>
            <div
              className="p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={copyAddress}
            >
              <code className="text-sm font-mono break-all block">{wallet.address}</code>
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {copied ? '✓ Copied!' : 'Click to copy'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReceiveDialog(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogTitle className="flex items-center gap-2">🔐 Export Private Key</DialogTitle>
            <DialogDescription>Your private key gives full access to this wallet</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">⚠️ Security Warning</p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Never share your private key with anyone</li>
                <li>• Anyone with this key can steal your funds</li>
                <li>• Store it in a secure, offline location</li>
              </ul>
            </div>

            {!keyRevealed ? (
              <div
                className="p-6 bg-muted rounded-lg text-center cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setKeyRevealed(true)}
              >
                <div className="text-4xl mb-3">👁️</div>
                <p className="font-medium">Click to reveal private key</p>
                <p className="text-sm text-muted-foreground">Make sure no one is watching</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                  <code className="text-sm font-mono break-all">{wallet.privateKey || 'No key available'}</code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.privateKey || '')
                    }}
                  >
                    📋 Copy Key
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setKeyRevealed(false)}>
                    🙈 Hide Key
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
