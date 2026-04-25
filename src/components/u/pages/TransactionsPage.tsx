/**
 * TransactionsPage — Sui transaction history
 *
 * Data sources:
 *   - Wallet address: IndexedDB via listWallets() (chain === 'sui')
 *   - Transactions:   Sui RPC — queryTransactionBlocks (FromAddress filter)
 *   - Descriptions:   summarizeTx() from src/lib/money.ts
 *
 * No localStorage reads. No zkLogin. Testnet by default.
 */

import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getWallet } from '@/components/u/lib/idb'
import { summarizeTxResponse, type TxSummary } from '@/components/u/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getExplorerTxUrl } from '@/lib/chains'
import { emitClick } from '@/lib/ui-signal'

// ─── Sui client (testnet by default) ─────────────────────────────────────────

const NETWORK: 'testnet' | 'mainnet' = 'testnet'
const PAGE_SIZE = 20

function getSuiClient(): SuiJsonRpcClient {
  return new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(NETWORK), network: NETWORK })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type KindFilter = 'all' | 'send' | 'receive' | 'interact'

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionsPage() {
  const [address, setAddress] = useState<string | null>(null)
  const [txs, setTxs] = useState<TxSummary[]>([])
  const [cursor, setCursor] = useState<string | null | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<{ kind: KindFilter; search: string }>({
    kind: 'all',
    search: '',
  })

  const clientRef = useRef<SuiJsonRpcClient | null>(null)

  // Resolve Sui wallet address from IndexedDB (idb.ts / one-wallet store)
  useEffect(() => {
    getWallet()
      .then((w) => {
        if (w?.address) setAddress(w.address)
      })
      .catch((err) => {
        console.warn('[TransactionsPage] Failed to read wallet from IDB:', err)
      })
  }, [])

  // Fetch a page of transactions from Sui RPC
  const fetchPage = useCallback(
    async (nextCursor?: string | null) => {
      if (!address) return

      setLoading(true)
      setError(null)

      try {
        if (!clientRef.current) {
          clientRef.current = getSuiClient()
        }
        const client = clientRef.current

        const result = await client.queryTransactionBlocks({
          filter: { FromAddress: address },
          options: {
            showInput: true,
            showEffects: true,
            showBalanceChanges: true,
          },
          cursor: nextCursor ?? undefined,
          limit: PAGE_SIZE,
          order: 'descending',
        })

        const summaries = result.data.map((tx) => summarizeTxResponse(tx, address))

        setTxs((prev) => (nextCursor ? [...prev, ...summaries] : summaries))
        setCursor(result.nextCursor ?? null)
        setHasMore(result.hasNextPage)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(`Failed to load transactions: ${msg}`)
        console.error('[TransactionsPage] RPC error:', err)
      } finally {
        setLoading(false)
      }
    },
    [address],
  )

  // Initial load when address is resolved
  useEffect(() => {
    if (address) {
      fetchPage(undefined)
    }
  }, [address, fetchPage])

  const loadMore = useCallback(() => {
    emitClick('ui:transactions:loadmore')
    fetchPage(cursor)
  }, [cursor, fetchPage])

  const refresh = useCallback(() => {
    emitClick('ui:transactions:refresh')
    setTxs([])
    setCursor(undefined)
    fetchPage(undefined)
  }, [fetchPage])

  // Apply client-side filters
  const filtered = txs.filter((tx) => {
    if (filter.kind !== 'all' && tx.kind !== filter.kind) return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (!tx.digest.toLowerCase().includes(q) && !tx.description.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  // ─── Stats ────────────────────────────────────────────────────────────────

  const sentCount = txs.filter((t) => t.kind === 'send').length
  const receivedCount = txs.filter((t) => t.kind === 'receive').length
  const interactCount = txs.filter((t) => t.kind === 'interact').length

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function formatDate(ms: number): string {
    if (!ms) return '—'
    const date = new Date(ms)
    const now = Date.now()
    const diff = now - ms
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  function kindIcon(kind: TxSummary['kind']): string {
    if (kind === 'send') return '↗'
    if (kind === 'receive') return '↙'
    return '⚡'
  }

  function kindColor(kind: TxSummary['kind']): string {
    if (kind === 'send') return 'text-red-500'
    if (kind === 'receive') return 'text-green-500'
    return 'text-blue-400'
  }

  function kindBg(kind: TxSummary['kind']): string {
    if (kind === 'send') return 'bg-red-100 dark:bg-red-900/30 text-red-600'
    if (kind === 'receive') return 'bg-green-100 dark:bg-green-900/30 text-green-600'
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>↔️</span> Transactions
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-mono">
              {address ? `${address.slice(0, 10)}…${address.slice(-6)}` : 'No Sui wallet found'}
              {address && (
                <Badge variant="outline" className="ml-2">
                  {NETWORK}
                </Badge>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading || !address}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Loading…
              </>
            ) : (
              '⟳ Refresh'
            )}
          </Button>
        </div>

        {/* No wallet state */}
        {!address && !loading && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">💧</div>
              <p className="text-muted-foreground">No Sui wallet found. Create one first to view transactions.</p>
              <Button asChild className="mt-4">
                <a href="/u/wallets">Create Wallet</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {address && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{txs.length}</div>
                <div className="text-sm text-muted-foreground">Loaded</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-500">{receivedCount}</div>
                <div className="text-sm text-muted-foreground">Received</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-500">{sentCount}</div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-400">{interactCount}</div>
                <div className="text-sm text-muted-foreground">Interact</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {address && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by digest or description…"
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'send', 'receive', 'interact'] as KindFilter[]).map((k) => (
                    <Button
                      key={k}
                      variant={filter.kind === k ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        emitClick(`ui:transactions:filter-${k}`)
                        setFilter({ ...filter, kind: k })
                      }}
                    >
                      {k === 'all' ? 'All' : k === 'send' ? '↗ Send' : k === 'receive' ? '↙ Receive' : '⚡ Interact'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-4 border-red-500">
            <CardContent className="pt-4 text-red-500 text-sm">{error}</CardContent>
          </Card>
        )}

        {/* Transaction list */}
        {address && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filtered.length === 0 && !loading ? (
                  <div className="p-12 text-center">
                    <div className="text-5xl mb-4">↔️</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {txs.length === 0 ? 'No Transactions' : 'No Results'}
                    </h3>
                    <p className="text-muted-foreground">
                      {txs.length === 0
                        ? 'No transactions found for this wallet on testnet.'
                        : 'Try adjusting your filters.'}
                    </p>
                  </div>
                ) : (
                  filtered.map((tx) => {
                    const explorerUrl = getExplorerTxUrl(tx.digest, 'sui')
                    return (
                      <a
                        key={tx.digest}
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => emitClick('ui:transactions:open-explorer')}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${kindBg(tx.kind)}`}
                          >
                            {kindIcon(tx.kind)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{tx.description}</span>
                              {tx.status === 'failure' && (
                                <Badge variant="destructive" className="text-xs">
                                  Failed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="text-xs text-muted-foreground">
                                {tx.digest.slice(0, 10)}…{tx.digest.slice(-6)}
                              </code>
                              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                🔗 Explorer
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {tx.amountMist && tx.amountMist > 0n && (
                            <div className={`font-semibold text-sm ${kindColor(tx.kind)}`}>
                              {tx.kind === 'receive' ? '+' : tx.kind === 'send' ? '-' : ''}
                              {(Number(tx.amountMist) / 1e9).toFixed(4)} SUI
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.timestampMs ?? 0)}</div>
                        </div>
                      </a>
                    )
                  })
                )}

                {/* Loading skeleton */}
                {loading && txs.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <span className="animate-spin inline-block mr-2">⟳</span> Loading transactions…
                  </div>
                )}
              </div>

              {/* Load more */}
              {hasMore && !loading && filtered.length > 0 && (
                <div className="p-4 border-t flex justify-center">
                  <Button variant="outline" onClick={loadMore}>
                    Load more
                  </Button>
                </div>
              )}
              {loading && txs.length > 0 && (
                <div className="p-4 border-t text-center text-sm text-muted-foreground">
                  <span className="animate-spin inline-block mr-2">⟳</span> Loading more…
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
