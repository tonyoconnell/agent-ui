/**
 * ReceivePage - Fast & Simple Receive Flow
 *
 * Show all wallets, click to copy or scan QR.
 * Zero friction receiving.
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UNav } from '../UNav'

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  name?: string
}

const CHAINS: Record<string, { name: string; icon: string; color: string; symbol: string }> = {
  eth: { name: 'Ethereum', icon: '⟠', color: 'from-blue-500 to-indigo-600', symbol: 'ETH' },
  btc: { name: 'Bitcoin', icon: '₿', color: 'from-orange-400 to-orange-600', symbol: 'BTC' },
  sol: { name: 'Solana', icon: '◎', color: 'from-purple-500 to-pink-500', symbol: 'SOL' },
  sui: { name: 'Sui', icon: '💧', color: 'from-cyan-400 to-blue-500', symbol: 'SUI' },
  usdc: { name: 'USDC', icon: '💵', color: 'from-blue-400 to-blue-600', symbol: 'USDC' },
  one: { name: 'ONE', icon: '①', color: 'from-emerald-400 to-teal-600', symbol: 'ONE' },
}

export function ReceivePage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    // REMOVED: localStorage.getItem('u_wallets') read
    // TODO: read from IndexedDB via useVault() hook instead
    // const stored = localStorage.getItem('u_wallets')
    // if (stored) setWallets(JSON.parse(stored))
  }, [])

  const copyAddress = async (wallet: Wallet) => {
    await navigator.clipboard.writeText(wallet.address)
    setCopiedId(wallet.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatAddress = (addr: string) => {
    if (!addr) return 'No address'
    if (addr.length < 16) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-background">
      <UNav active="receive" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">↙️</div>
          <h1 className="text-2xl font-bold">Receive</h1>
          <p className="text-muted-foreground text-sm">Select a wallet to receive crypto</p>
        </div>

        {/* Wallet List */}
        {wallets.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">👛</div>
            <h3 className="font-semibold mb-2">No Wallets Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create a wallet to start receiving crypto</p>
            <Button asChild>
              <a href="/u/wallets">Create Wallet</a>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {wallets
              .filter((w) => w.id && w.address)
              .map((wallet, index) => {
                const chain = CHAINS[wallet.chain] || CHAINS.eth
                const isCopied = copiedId === wallet.id

                return (
                  <Card
                    key={wallet.id || `wallet-${index}`}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Chain Icon */}
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center text-white text-xl shrink-0`}
                        >
                          {chain.icon}
                        </div>

                        {/* Wallet Info */}
                        <a href={`/u/receive/${wallet.id}`} className="flex-1 min-w-0">
                          <div className="font-medium">{wallet.name || `${chain.name} Wallet`}</div>
                          <code className="text-sm text-muted-foreground">{formatAddress(wallet.address)}</code>
                        </a>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Copy Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              copyAddress(wallet)
                            }}
                            className="w-20"
                          >
                            {isCopied ? '✓ Copied' : '📋 Copy'}
                          </Button>

                          {/* QR Link */}
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/u/receive/${wallet.id}`}>QR →</a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}

        {/* Help Text */}
        {wallets.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">Tap a wallet to see QR code and full address</p>
        )}
      </div>
    </div>
  )
}
