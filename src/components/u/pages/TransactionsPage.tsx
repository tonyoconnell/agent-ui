/**
 * TransactionsPage - Complete Transaction History
 *
 * Features:
 * - View all transactions across wallets
 * - Filter by chain, type, status
 * - Search by hash or address
 * - Fetch real transactions from blockchain
 * - No fake/sample data
 */

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTransactions as fetchChainTransactions, getChain, getExplorerTxUrl } from '../lib/BlockchainService'
import { UNav } from '../UNav'

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

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  name?: string
}

const CHAIN_FILTERS = [
  { id: 'all', name: 'All Chains' },
  { id: 'eth', name: 'Ethereum', icon: '⟠' },
  { id: 'btc', name: 'Bitcoin', icon: '₿' },
  { id: 'sol', name: 'Solana', icon: '◎' },
  { id: 'sui', name: 'Sui', icon: '💧' },
  { id: 'base', name: 'Base', icon: '🔵' },
]

const TX_TYPES = [
  { id: 'all', name: 'All Types' },
  { id: 'send', name: 'Send', icon: '↗' },
  { id: 'receive', name: 'Receive', icon: '↙' },
  { id: 'swap', name: 'Swap', icon: '⇄' },
  { id: 'mint', name: 'Mint', icon: '✨' },
  { id: 'interact', name: 'Interact', icon: '⚡' },
]

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [filter, setFilter] = useState({ chain: 'all', type: 'all', search: '' })
  const [_isLoading, _setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  // Load transactions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('u_transactions')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Filter out any obviously fake transactions (those with random 0x hashes that are 66 chars for non-SUI)
        const realTxs = parsed.filter((tx: Transaction) => {
          // Keep all transactions for now - will be replaced when fetching from chain
          return tx.hash && tx.hash.length > 0
        })
        setTransactions(realTxs)
      } catch (e) {
        console.error('Failed to parse transactions:', e)
        setTransactions([])
      }
    }

    // Load wallets
    const storedWallets = localStorage.getItem('u_wallets')
    if (storedWallets) {
      try {
        setWallets(JSON.parse(storedWallets))
      } catch (e) {
        console.error('Failed to parse wallets:', e)
      }
    }
  }, [])

  // Fetch transactions from all wallets
  const fetchAllTransactions = useCallback(async () => {
    if (wallets.length === 0) return

    setIsFetching(true)
    const allNewTxs: Transaction[] = []

    try {
      for (const wallet of wallets) {
        try {
          const chainTxs = await fetchChainTransactions(wallet.address, wallet.chain)
          // Add wallet ID to transactions
          const txsWithWallet = chainTxs.map((tx) => ({
            ...tx,
            walletId: wallet.id,
          }))
          allNewTxs.push(...txsWithWallet)
        } catch (e) {
          console.warn(`Failed to fetch transactions for ${wallet.chain}:`, e)
        }
      }

      if (allNewTxs.length > 0) {
        // Merge with existing, dedupe by hash
        const existingHashes = new Set(transactions.map((t) => t.hash))
        const newUnique = allNewTxs.filter((t) => !existingHashes.has(t.hash))
        const merged = [...newUnique, ...transactions].sort((a, b) => b.timestamp - a.timestamp)

        setTransactions(merged)
        localStorage.setItem('u_transactions', JSON.stringify(merged))
      }
    } catch (e) {
      console.error('Failed to fetch transactions:', e)
    } finally {
      setIsFetching(false)
    }
  }, [wallets, transactions])

  const filteredTx = transactions.filter((tx) => {
    if (filter.chain !== 'all' && tx.chain !== filter.chain) return false
    if (filter.type !== 'all' && tx.type !== filter.type) return false
    if (filter.search && !tx.hash.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
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

  const clearFakeData = () => {
    // Clear any remaining fake data from localStorage
    localStorage.removeItem('u_transactions')
    setTransactions([])
  }

  return (
    <div className="min-h-screen bg-background">
      <UNav active="transactions" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>↔️</span> Transactions
            </h1>
            <p className="text-muted-foreground mt-1">Real transactions from your wallets</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllTransactions} disabled={isFetching || wallets.length === 0}>
              {isFetching ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Fetching...
                </>
              ) : (
                <>📥 Fetch from Chain</>
              )}
            </Button>
            {transactions.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFakeData} title="Clear all transaction data">
                🗑️
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{transactions.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-500">
                {transactions.filter((t) => t.type === 'receive').length}
              </div>
              <div className="text-sm text-muted-foreground">Received</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-500">
                {transactions.filter((t) => t.type === 'send').length}
              </div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-500">
                {transactions.filter((t) => t.type === 'swap' || t.type === 'interact').length}
              </div>
              <div className="text-sm text-muted-foreground">Other</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-500">
                {transactions.filter((t) => t.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by transaction hash..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
              <Select value={filter.chain} onValueChange={(v) => setFilter({ ...filter, chain: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAIN_FILTERS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filter.type} onValueChange={(v) => setFilter({ ...filter, type: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TX_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.icon ? `${t.icon} ` : ''}
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTx.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">↔️</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {wallets.length === 0 ? 'No Wallets Yet' : 'No Transactions Found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {wallets.length === 0
                      ? 'Create a wallet first to see transactions'
                      : filter.search || filter.chain !== 'all' || filter.type !== 'all'
                        ? 'Try adjusting your filters'
                        : "Click 'Fetch from Chain' to load your transaction history"}
                  </p>
                  {wallets.length === 0 ? (
                    <Button asChild>
                      <a href="/u/wallets">Create Wallet</a>
                    </Button>
                  ) : (
                    <Button onClick={fetchAllTransactions} disabled={isFetching}>
                      {isFetching ? 'Fetching...' : '📥 Fetch Transactions'}
                    </Button>
                  )}
                </div>
              ) : (
                filteredTx
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((tx) => {
                    const chainConfig = getChain(tx.chain)
                    const explorerUrl = getExplorerTxUrl(tx.hash, tx.chain)
                    const chainFilter = CHAIN_FILTERS.find((c) => c.id === tx.chain)

                    return (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={tx.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              tx.type === 'receive'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                : tx.type === 'send'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            }`}
                          >
                            {getTypeIcon(tx.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold capitalize">{tx.type}</span>
                              <Badge variant="outline">
                                {chainFilter?.icon || chainConfig.icon} {tx.chain.toUpperCase()}
                              </Badge>
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(tx.status)}`} />
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-muted-foreground">
                                {tx.hash.slice(0, 12)}...{tx.hash.slice(-8)}
                              </code>
                              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                🔗 View on Explorer
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-semibold ${tx.type === 'receive' ? 'text-green-600' : tx.type === 'send' ? 'text-red-600' : ''}`}
                          >
                            {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}
                            {tx.amount !== '0' ? tx.amount : ''} {tx.token}
                          </div>
                          <div className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</div>
                        </div>
                      </a>
                    )
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
