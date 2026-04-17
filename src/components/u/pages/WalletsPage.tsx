/**
 * WalletsPage - Complete Wallet Management
 *
 * Features:
 * - View all wallets with balances
 * - Generate new wallets
 * - Import existing wallets
 * - Export private keys (with warnings)
 * - QR codes for receiving
 * - Send transactions
 */

import { useEffect, useState } from 'react'
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

const CHAINS = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: 'from-blue-500 to-indigo-600', icon: '⟠', decimals: 18 },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: 'from-orange-400 to-orange-600', icon: '₿', decimals: 8 },
  { id: 'sol', name: 'Solana', symbol: 'SOL', color: 'from-purple-500 to-pink-500', icon: '◎', decimals: 9 },
  { id: 'sui', name: 'Sui', symbol: 'SUI', color: 'from-cyan-400 to-blue-500', icon: '💧', decimals: 9 },
  { id: 'usdc', name: 'USDC', symbol: 'USDC', color: 'from-blue-400 to-blue-600', icon: '💵', decimals: 6 },
  { id: 'one', name: 'ONEIE', symbol: 'ONE', color: 'from-emerald-400 to-teal-600', icon: '①', decimals: 18 },
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

interface StoredKey {
  id: string
  name: string
  type: 'mnemonic' | 'private_key'
  value: string
  createdAt: number
  chain?: string
  walletId?: string
}

export function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [filter, setFilter] = useState('all')

  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [showOwnWallets, setShowOwnWallets] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [walletName, setWalletName] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Keys state - for auto-saving when generating wallets
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('u_wallets')
    if (stored) {
      setWallets(JSON.parse(stored))
    }
    const storedKeysData = localStorage.getItem('u_keys')
    if (storedKeysData) {
      setStoredKeys(JSON.parse(storedKeysData))
    }
  }, [])

  const totalValue = wallets.reduce((sum, w) => sum + w.usdValue, 0)
  const filteredWallets = (filter === 'all' ? wallets : wallets.filter((w) => w.chain === filter)).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
  ) // Sort by creation date (newest first)

  const generateWallet = (chainId: string) => {
    const chain = CHAINS.find((c) => c.id === chainId)
    if (!chain) return

    // Count existing wallets of this chain for naming
    const existingCount = wallets.filter((w) => w.chain === chainId).length
    const address = generateAddress(chainId)
    const privateKey = generatePrivateKey(chainId)
    const walletId = `${chainId}-${Date.now()}`
    const walletName = `${chain.name} Wallet ${existingCount + 1}`

    const newWallet: Wallet = {
      id: walletId,
      chain: chainId,
      address,
      balance: '0.00',
      usdValue: 0,
      createdAt: Date.now(),
      name: walletName,
      privateKey,
    }

    const updated = [...wallets, newWallet]
    setWallets(updated)
    localStorage.setItem('u_wallets', JSON.stringify(updated))
    // Register as substrate actor (fire-and-forget)
    fetch('/api/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: newWallet.id, kind: 'wallet' }),
    }).catch(() => null)

    // Auto-save the private key
    const newKey: StoredKey = {
      id: `key-${walletId}`,
      name: `${walletName} Key`,
      type: 'private_key',
      value: privateKey,
      createdAt: Date.now(),
      chain: chainId,
      walletId: walletId,
    }
    const updatedKeys = [...storedKeys, newKey]
    setStoredKeys(updatedKeys)
    localStorage.setItem('u_keys', JSON.stringify(updatedKeys))
  }

  const saveWalletKey = (wallet: Wallet) => {
    if (!wallet.privateKey) return

    // Check if key already exists
    const existingKey = storedKeys.find((k) => k.walletId === wallet.id)
    if (existingKey) return

    const chain = CHAINS.find((c) => c.id === wallet.chain)
    const newKey: StoredKey = {
      id: `key-${wallet.id}`,
      name: `${wallet.name || chain?.name || 'Wallet'} Key`,
      type: 'private_key',
      value: wallet.privateKey,
      createdAt: Date.now(),
      chain: wallet.chain,
      walletId: wallet.id,
    }
    const updatedKeys = [...storedKeys, newKey]
    setStoredKeys(updatedKeys)
    localStorage.setItem('u_keys', JSON.stringify(updatedKeys))
  }

  const renameWallet = (walletId: string, newName: string) => {
    const updated = wallets.map((w) => (w.id === walletId ? { ...w, name: newName } : w))
    setWallets(updated)
    localStorage.setItem('u_wallets', JSON.stringify(updated))
  }

  const deleteWallet = (walletId: string) => {
    const updated = wallets.filter((w) => w.id !== walletId)
    setWallets(updated)
    localStorage.setItem('u_wallets', JSON.stringify(updated))
    setShowDeleteDialog(false)
    setDeleteConfirmText('')
    setSelectedWallet(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <UNav active="wallets" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>👛</span> Wallets
            </h1>
            <p className="text-muted-foreground mt-1">Manage your wallets across all chains</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Balance</div>
            <div className="text-3xl font-bold">${totalValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {CHAINS.map((chain) => {
            const count = wallets.filter((w) => w.chain === chain.id).length
            return (
              <Card
                key={chain.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${filter === chain.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFilter(filter === chain.id ? 'all' : chain.id)}
              >
                <CardContent className="pt-4 pb-4 text-center">
                  <div
                    className={`w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center text-white text-lg`}
                  >
                    {chain.icon}
                  </div>
                  <div className="font-semibold">{count}</div>
                  <div className="text-xs text-muted-foreground">{chain.symbol}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Generate */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Generate</CardTitle>
            <CardDescription>
              Create new wallets instantly - generate multiple wallets per currency for easy transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {CHAINS.map((chain) => {
                const count = wallets.filter((w) => w.chain === chain.id).length
                return (
                  <Button
                    key={chain.id}
                    onClick={() => {
                      emitClick('ui:wallet:create')
                      generateWallet(chain.id)
                    }}
                    variant="outline"
                    className={`bg-gradient-to-r ${chain.color} text-white border-0 hover:opacity-90 relative`}
                  >
                    <span className="mr-2">{chain.icon}</span>
                    {chain.symbol}
                    {count > 0 && <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">+{count}</span>}
                  </Button>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Connect Identity</p>
              <button
                className="w-full py-2 px-4 rounded-lg border border-indigo-500/30 text-indigo-400 text-sm hover:bg-indigo-500/10 transition-colors"
                onClick={() => (window.location.href = '/settings/keys')}
              >
                Connect Substrate Wallet
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              💡 Tip: Create multiple wallets of the same currency to organize funds and send between them
            </p>
          </CardContent>
        </Card>

        {/* Wallet List */}
        {filteredWallets.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">👛</div>
            <h3 className="text-xl font-semibold mb-2">No Wallets Yet</h3>
            <p className="text-muted-foreground mb-4">Generate your first wallet using the buttons above</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWallets.map((wallet) => {
              const chain = CHAINS.find((c) => c.id === wallet.chain) ?? {
                id: wallet.chain,
                name: wallet.chain.toUpperCase(),
                symbol: wallet.chain.toUpperCase(),
                color: 'from-gray-400 to-gray-600',
                icon: '🔗',
                decimals: 18,
              }
              const sameChainWallets = wallets.filter((w) => w.chain === wallet.chain).length
              return (
                <Card
                  key={wallet.id}
                  className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-card"
                  onClick={() => (window.location.href = `/u/wallet/${wallet.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center text-white text-xl shadow-lg`}
                        >
                          {chain.icon}
                        </div>
                        <div>
                          <div className="font-semibold">{wallet.name || chain.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {chain.symbol}
                            </Badge>
                            {sameChainWallets > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                1 of {sameChainWallets}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedWallet(wallet)
                            setWalletName(wallet.name || '')
                            setShowRenameDialog(true)
                          }}
                          title="Rename"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedWallet(wallet)
                            setShowDeleteDialog(true)
                          }}
                          title="Delete"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg mb-4">
                      <code className="text-xs font-mono text-muted-foreground">
                        {wallet.address ? `${wallet.address.slice(0, 12)}...${wallet.address.slice(-8)}` : 'No address'}
                      </code>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {wallet.balance} <span className="text-sm text-muted-foreground">{chain.symbol}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">≈ ${(wallet.usdValue || 0).toLocaleString()}</div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          emitClick('ui:send:open')
                          setSelectedWallet(wallet)
                          setShowSendDialog(true)
                        }}
                      >
                        ↗ Send
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          emitClick('ui:receive:open')
                          setSelectedWallet(wallet)
                          setShowReceiveDialog(true)
                        }}
                      >
                        ↙ Receive
                      </Button>
                    </div>
                    {/* Save Key Button */}
                    {wallet.privateKey && !storedKeys.find((k) => k.walletId === wallet.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          saveWalletKey(wallet)
                        }}
                      >
                        🔑 Save Key to Keys
                      </Button>
                    )}
                    {storedKeys.find((k) => k.walletId === wallet.id) && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
                        <span>✓</span> Key saved
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Send Dialog */}
      <Dialog
        open={showSendDialog}
        onOpenChange={(open) => {
          setShowSendDialog(open)
          if (!open) {
            setSendTo('')
            setSendAmount('')
            setShowOwnWallets(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send {selectedWallet && CHAINS.find((c) => c.id === selectedWallet.chain)?.symbol}
            </DialogTitle>
            <DialogDescription>Enter recipient address and amount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Recipient Address</label>
              <Input
                placeholder="0x... or ENS name"
                className="mt-1"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
              />
              {/* Show own wallets of same currency for easy transfers */}
              {selectedWallet &&
                wallets.filter((w) => w.chain === selectedWallet.chain && w.id !== selectedWallet.id).length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => setShowOwnWallets(!showOwnWallets)}
                    >
                      {showOwnWallets ? 'Hide' : 'Select from'} your other{' '}
                      {CHAINS.find((c) => c.id === selectedWallet.chain)?.symbol} wallets →
                    </Button>
                    {showOwnWallets && (
                      <div className="mt-2 space-y-2 p-3 bg-muted rounded-lg">
                        {wallets
                          .filter((w) => w.chain === selectedWallet.chain && w.id !== selectedWallet.id)
                          .map((w) => (
                            <div
                              key={w.id}
                              className="flex items-center justify-between p-2 bg-background rounded cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => {
                                setSendTo(w.address)
                                setShowOwnWallets(false)
                              }}
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {w.name || `Wallet ${w.id.split('-')[1]?.slice(-4)}`}
                                </div>
                                <code className="text-xs text-muted-foreground">
                                  {w.address.slice(0, 10)}...{w.address.slice(-6)}
                                </code>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {w.balance} {CHAINS.find((c) => c.id === w.chain)?.symbol}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                className="mt-1"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
              {selectedWallet && (
                <div className="text-xs text-muted-foreground mt-1">
                  Available: {selectedWallet.balance} {CHAINS.find((c) => c.id === selectedWallet.chain)?.symbol}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!sendTo || !sendAmount}
              onClick={() => {
                emitClick('ui:send:submit-private')
                if (!selectedWallet || !sendTo || !sendAmount) return

                const chain = CHAINS.find((c) => c.id === selectedWallet.chain)
                const timestamp = Date.now()
                const pendingTxId = `pending-${timestamp}`

                // Create pending send transaction (no fake hash)
                const sendTx = {
                  id: pendingTxId,
                  hash: `PENDING-${pendingTxId}`, // Clearly marked as pending
                  type: 'send',
                  from: selectedWallet.address,
                  to: sendTo,
                  amount: sendAmount,
                  token: chain?.symbol || selectedWallet.chain.toUpperCase(),
                  chain: selectedWallet.chain,
                  status: 'pending', // Pending until real broadcast
                  timestamp,
                  walletId: selectedWallet.id,
                }

                // Save transaction
                const stored = localStorage.getItem('u_transactions')
                const allTx = stored ? JSON.parse(stored) : []
                allTx.unshift(sendTx)
                localStorage.setItem('u_transactions', JSON.stringify(allTx))

                // Note: Don't update balances since transaction is pending
                // Balance will update when fetched from blockchain after actual broadcast

                // Reset and close
                setSendTo('')
                setSendAmount('')
                setShowSendDialog(false)
                setShowOwnWallets(false)
              }}
            >
              Send Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Receive {selectedWallet && CHAINS.find((c) => c.id === selectedWallet.chain)?.symbol}
            </DialogTitle>
            <DialogDescription>Share your address to receive funds</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-6 bg-muted rounded-lg text-center">
              <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center text-6xl">
                📱
              </div>
              <code className="text-sm font-mono break-all">{selectedWallet?.address}</code>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => {
                emitClick('ui:wallet:copy-address')
                navigator.clipboard.writeText(selectedWallet?.address || '')
              }}
            >
              Copy Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={showRenameDialog}
        onOpenChange={(open) => {
          setShowRenameDialog(open)
          if (!open) setWalletName('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Wallet</DialogTitle>
            <DialogDescription>Give your wallet a memorable name to distinguish it from others</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Savings, Trading, Personal"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!walletName.trim()}
              onClick={() => {
                if (selectedWallet && walletName.trim()) {
                  renameWallet(selectedWallet.id, walletName.trim())
                  setShowRenameDialog(false)
                  setWalletName('')
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Wallet Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) {
            setDeleteConfirmText('')
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <span className="text-5xl">⚠️</span>
            </div>
            <DialogTitle className="text-center text-2xl">Delete Wallet?</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. The wallet and all associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedWallet && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-semibold mb-1">
                  {selectedWallet.name || CHAINS.find((c) => c.id === selectedWallet.chain)?.name}
                </div>
                <code className="text-xs text-muted-foreground break-all">{selectedWallet.address}</code>
              </div>
            )}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">⚠️ Warning</p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Make sure you have backed up your private key or recovery phrase before deleting. Without it, you will
                lose access to any funds in this wallet forever.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Type "DELETE" to confirm</label>
              <Input
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== 'DELETE'}
              onClick={() => selectedWallet && deleteWallet(selectedWallet.id)}
              className="flex-1"
            >
              🗑️ Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function generateAddress(chainId: string): string {
  const chars = '0123456789abcdef'
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  switch (chainId) {
    case 'btc':
      return `bc1q${Array.from({ length: 38 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    case 'sol':
      return Array.from({ length: 44 }, () => base58Chars[Math.floor(Math.random() * 58)]).join('')
    case 'sui':
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    default:
      return `0x${Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
  }
}

function generatePrivateKey(chainId: string): string {
  const chars = '0123456789abcdef'
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  switch (chainId) {
    case 'btc':
      // WIF format simulation
      return `5${Array.from({ length: 50 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    case 'sol':
      // Base58 private key
      return Array.from({ length: 88 }, () => base58Chars[Math.floor(Math.random() * 58)]).join('')
    default:
      // Ethereum-style hex private key
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
  }
}
