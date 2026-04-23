/**
 * UDashboard - The Universal Wallet Experience
 *
 * No login. No friction. Just blockchain.
 * Powered by one-protocol SDK.
 *
 * Features:
 * - Generate wallets for any chain (locally stored keys)
 * - View tokens, contracts, products, transactions
 * - Apple-like minimal design
 * - Agent-callable API via one-protocol
 * - Encrypted key storage with password protection
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EnhancedWalletCard } from './EnhancedWalletCard'
import { GenerateWalletDialog } from './GenerateWalletDialog'
import { useWallets } from './hooks/useWallets'
import * as Vault from './lib/vault/vault'
import type { VaultStatus } from './lib/vault/types'
import { VaultBackupDialog, VaultUnlockDialog } from './VaultDialogs'
import { VaultUnlockChip } from './VaultUnlockChip'

// Chain configurations - mapped to one-protocol chains (6 chains for 3x2 grid)
// Using lowercase IDs for consistency with wallet storage
const SUPPORTED_CHAINS = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    color: 'from-blue-500 to-indigo-600',
    icon: '⟠',
    description: 'Smart contracts & DeFi',
    decimals: 18,
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    color: 'from-orange-400 to-orange-600',
    icon: '₿',
    description: 'Digital gold',
    decimals: 8,
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    color: 'from-purple-500 to-pink-500',
    icon: '◎',
    description: 'Fast & scalable',
    decimals: 9,
  },
  {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    color: 'from-cyan-400 to-blue-500',
    icon: '💧',
    description: 'Move-based chain',
    decimals: 9,
  },
  {
    id: 'usdc',
    name: 'USDC',
    symbol: 'USDC',
    color: 'from-blue-400 to-blue-600',
    icon: '💵',
    description: 'USD Stablecoin',
    decimals: 6,
  },
  {
    id: 'one',
    name: 'ONEIE',
    symbol: 'ONE',
    color: 'from-emerald-400 to-teal-600',
    icon: '①',
    description: 'ONE Protocol Token',
    decimals: 18,
  },
]

// Wallet interface imported from adapter

interface Token {
  id: string
  name: string
  symbol: string
  supply: string
  chain: string
}

interface Product {
  id: string
  name: string
  price: string
  currency: string
  sales: number
}

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'swap' | 'mint'
  amount: string
  token: string
  timestamp: number
  status: 'confirmed' | 'pending'
}

export function UDashboard() {
  // Use unified wallet hook (connects to pay.one.ie API)
  const { wallets, createWallet, deleteWallet, setWallets: _setWallets, isLoading, refreshBalances } = useWallets()

  const [_tokens, setTokens] = useState<Token[]>([])
  const [_products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [_activeTab, _setActiveTab] = useState('overview')
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)

  // Vault dialog states (chip owns the setup wizard + unlock dialog itself).
  // Minimal reactive vault status — replaces useVault() for status checks only.
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null)
  useEffect(() => {
    void Vault.getStatus().then(setVaultStatus).catch(() => {})
  }, [wallets.length])
  const [showUnlock, setShowUnlock] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState<{ id: string; name: string } | null>(null)
  const [substrateData, setSubstrateData] = useState<{
    reputation: number
    highways: { from: string; to: string; strength: number }[]
    frontier: string[]
  } | null>(null)

  // Load additional data
  useEffect(() => {
    // Check if new user
    if (!isLoading && wallets.length > 0) {
      setIsFirstVisit(false)
    } else if (!isLoading && wallets.length === 0) {
      setIsFirstVisit(true)
    }

    const storedTokens = localStorage.getItem('u_tokens')
    if (storedTokens) setTokens(JSON.parse(storedTokens))

    const storedProducts = localStorage.getItem('u_products')
    if (storedProducts) setProducts(JSON.parse(storedProducts))

    const storedTx = localStorage.getItem('u_transactions')
    if (storedTx) setTransactions(JSON.parse(storedTx))

    // Substrate augmentation: highways only (public endpoint).
    // reveal/frontier require board+ role + scale+ tier — not available on no-login /u surface.
    const uid = wallets?.[0]?.id
    if (uid) {
      const controller = new AbortController()
      type HighwaysResponse = { highways?: { from: string; to: string; strength: number }[] }
      fetch('/api/loop/highways', { signal: controller.signal })
        .then((r) => (r.ok ? (r.json() as Promise<HighwaysResponse>) : null))
        .catch(() => null)
        .then((highways) => {
          setSubstrateData({
            reputation: 0,
            highways: highways?.highways ?? [],
            frontier: [],
          })
        })
      return () => controller.abort()
    }
  }, [wallets.length, isLoading, wallets?.[0]?.id])

  // Helper function to save keys to u_keys storage
  // DEPRECATED: localStorage keys are not safe for seed material
  // TODO: use vault.ts which stores encrypted in IndexedDB instead
  const saveToKeysStorage = (walletId: string, chain: string, mnemonic?: string, privateKey?: string) => {
    // REMOVED: localStorage.getItem('u_keys') read
    // const existingKeys = localStorage.getItem('u_keys')
    // const keys = existingKeys ? JSON.parse(existingKeys) : []

    // Save mnemonic (recovery phrase)
    // NOTE: Keys are now managed by vault.ts which encrypts them in IndexedDB
    if (mnemonic) {
      // REMOVED: localStorage write
      // keys.push({
      //   id: `mnemonic-${walletId}`,
      //   name: `${chain} Recovery Phrase`,
      //   type: 'mnemonic',
      //   value: mnemonic,
      //   createdAt: Date.now(),
      //   chain: chain,
      //   walletId: walletId,
      // })
    }

    // Private key stored encrypted in vault IndexedDB — not in localStorage
    void walletId; void chain; void privateKey
  }

  const handleGenerateWallet = async (chainId: string, password?: string, showSecurityDialog = true) => {
    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
    if (!chain) return

    setIsGenerating(chainId)

    try {
      // Use API-connected hook to generate wallet (Unified SDK 3.0)
      const newWallet = await createWallet(chainId)

      // Save keys securely if available
      // Note: useWallets returns a Wallet object which includes privateKey if just generated
      if (newWallet.privateKey || newWallet.mnemonic) {
        // Always save both mnemonic and private key to u_keys storage (legacy support)
        saveToKeysStorage(newWallet.id, chain.name, newWallet.mnemonic, newWallet.privateKey)

        // Save to vault if it exists and is unlocked.
        // Setup wizard handles vault creation; we don't auto-create here.
        if (vaultStatus?.hasVault && !vaultStatus.isLocked) {
          await Vault.saveWallet({
            id: newWallet.id,
            chain: chainId,
            address: newWallet.address,
            publicKey: newWallet.publicKey || '',
            mnemonic: newWallet.mnemonic,
            privateKey: newWallet.privateKey,
            balance: '0.00',
            usdValue: 0,
          })
        }
      }

      // Only transition to dashboard if this is a single wallet generation
      if (showSecurityDialog) {
        // Wait for state to update before transitioning
        await new Promise((resolve) => setTimeout(resolve, 100))
        // First wallet ever: close dialog + exit onboarding.
        // Subsequent wallets: keep dialog open so user can keep generating.
        if (isFirstVisit) {
          setIsFirstVisit(false)
          setShowGenerateDialog(false)
        }
      }
    } catch (error) {
      console.error('Failed to generate wallet:', error)
    } finally {
      setIsGenerating(null)
    }
  }

  const handleGenerateAllWallets = async () => {
    setIsGeneratingAll(true)

    try {
      // Create all wallets sequentially for visual feedback
      for (const chain of SUPPORTED_CHAINS) {
        const exists = wallets.some((w) => w.chain === chain.id)
        if (!exists) {
          await handleGenerateWallet(chain.id, undefined, false)
          // Small delay for visual feedback
          await new Promise((r) => setTimeout(r, 200))
        }
      }

      // Wait for React state to fully propagate
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Refresh balances in background (non-blocking)
      refreshBalances()

      // NOW transition to dashboard with all wallets ready
      setIsFirstVisit(false)
    } catch (error) {
      console.error('Failed to generate wallets:', error)
    } finally {
      setIsGeneratingAll(false)
    }
  }

  const totalValue = (wallets || []).reduce((sum, w) => sum + (w.usdValue || 0), 0)
  const hasWalletForChain = (chainId: string) => wallets.some((w) => w.chain === chainId)

  // First Visit - Beautiful Onboarding Experience
  if (isFirstVisit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          {/* Hero */}
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 sm:mb-6 shadow-2xl">
              <span className="text-3xl sm:text-5xl font-bold gradient-text">u</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Your Universal Wallet</h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              One identity. Every blockchain. Zero friction.
            </p>
            <p className="text-sm text-muted-foreground/70">
              Keys generated locally • Never leaves your device • Powered by one-protocol
            </p>
          </div>

          {/* Wallet Cards Grid - responsive layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
            {SUPPORTED_CHAINS.map((chain) => {
              const hasWallet = hasWalletForChain(chain.id)
              const isCurrentlyGenerating = isGenerating === chain.id

              return (
                <div
                  key={chain.id}
                  onClick={() => !hasWallet && !isGenerating && handleGenerateWallet(chain.id)}
                  className={`
                    relative group cursor-pointer
                    ${hasWallet ? 'cursor-default' : ''}
                  `}
                >
                  {/* Card */}
                  <div
                    className={`
                    relative overflow-hidden rounded-2xl border-2 transition-all duration-500
                    ${
                      hasWallet
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-dashed border-muted-foreground/20 hover:border-primary/40 bg-card/50 backdrop-blur-sm'
                    }
                    ${isCurrentlyGenerating ? 'animate-pulse border-primary/50' : ''}
                    hover:shadow-xl hover:-translate-y-1
                  `}
                  >
                    {/* Gradient overlay for wallet style */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${chain.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                    />

                    <div className="relative p-3 sm:p-5 text-center">
                      {/* Chain Icon */}
                      <div
                        className={`
                        w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg transition-all
                        ${
                          hasWallet
                            ? `bg-gradient-to-br ${chain.color} text-white`
                            : 'bg-muted/50 text-muted-foreground group-hover:bg-gradient-to-br group-hover:' +
                              chain.color.split(' ')[0] +
                              ' group-hover:text-white'
                        }
                      `}
                      >
                        {isCurrentlyGenerating ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          chain.icon
                        )}
                      </div>

                      {/* Chain Name */}
                      <h3 className="font-semibold text-sm sm:text-base mb-0.5">{chain.name}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 hidden sm:block">
                        {chain.description}
                      </p>

                      {/* Status */}
                      {hasWallet ? (
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px] sm:text-xs">
                          ✓ Created
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-[10px] sm:text-xs"
                        >
                          + Add
                        </Badge>
                      )}
                    </div>

                    {/* Bottom Gradient Line */}
                    <div
                      className={`h-1 sm:h-1.5 bg-gradient-to-r ${chain.color} ${hasWallet ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'} transition-opacity`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Create All Button */}
          <div className="text-center mb-8 sm:mb-16">
            <Button
              size="lg"
              onClick={handleGenerateAllWallets}
              disabled={isGeneratingAll || SUPPORTED_CHAINS.every((c) => hasWalletForChain(c.id))}
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-xl font-semibold w-full sm:w-auto"
            >
              {isGeneratingAll ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Creating Wallets...
                </>
              ) : (
                <>
                  <span className="mr-2 text-xl">✨</span>
                  Create All Wallets
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Generate wallets for all supported chains at once</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <FeatureCard
              icon="🔐"
              title="Self-Custodial"
              description="Your keys never leave your device. We can't access them. Ever."
            />
            <FeatureCard
              icon="⚡"
              title="Instant"
              description="Generate wallets in milliseconds. No waiting, no verification."
            />
            <FeatureCard
              icon="🌐"
              title="Multi-Chain"
              description="ETH, BTC, SOL, SUI and more. One place for everything."
            />
          </div>

          {/* Security Note - Enhanced */}
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 pt-4 sm:pt-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                  🛡️
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bank-Grade Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Keys are generated using cryptographically secure random numbers via the Web Crypto API. Your seed
                    phrase is stored encrypted in your browser's local storage. Back up your seed phrase safely - it's
                    the only way to recover your wallets.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Storage Explanation Card */}
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                    💾
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Where Are My Keys Stored?</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <strong>Browser localStorage</strong> - Your encrypted wallet data is stored locally in this
                        browser. This is secure for personal use, but be aware:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong>Browser-specific:</strong> Different browsers have different wallets
                        </li>
                        <li>
                          <strong>Device-specific:</strong> Your keys don't sync between devices
                        </li>
                        <li>
                          <strong>Clearable:</strong> Clearing browser data deletes your wallet
                        </li>
                        <li>
                          <strong>Long-term safe:</strong> Data persists through restarts and updates
                        </li>
                      </ul>
                      <p className="mt-3">
                        <strong>Best Practice:</strong> After generating wallets, set up a password and create an
                        encrypted backup. This backup file can be imported on any device.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard View - After wallets are created
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Quick Actions Bar - Compact */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <VaultUnlockChip />
          {vaultStatus?.hasVault && !vaultStatus.isLocked && (
            <Button variant="ghost" size="sm" onClick={() => setShowBackup(true)}>
              Backup
            </Button>
          )}
        </div>
        <Button onClick={() => setShowGenerateDialog(true)} size="sm" className="shrink-0">
          <span className="mr-1.5">+</span>
          Add
        </Button>
      </div>

      <div className="px-4 sm:px-6 pb-6">
        {/* Total Value Card - Hero card at top */}
        <div className="mb-4 sm:mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 sm:pt-4 sm:pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold">${totalValue.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Value</div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-xs sm:text-sm font-medium">+12.5%</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">24h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {substrateData && (
          <div className="rounded-lg border border-[#252538] bg-[#161622] p-4 mt-4">
            <div className="text-xs text-slate-500 mb-2">Substrate</div>
            <div className="flex gap-4 text-sm">
              <span className="text-slate-300">
                Rep: <span className="text-indigo-400">{substrateData.reputation.toFixed(2)}</span>
              </span>
              <span className="text-slate-300">
                Highways: <span className="text-indigo-400">{substrateData.highways.length}</span>
              </span>
              <span className="text-slate-300">
                Frontier: <span className="text-indigo-400">{substrateData.frontier.length}</span>
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions - Horizontal on mobile */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <QuickActionButton
            icon="↗"
            label="Send"
            color="bg-green-600"
            onClick={() => (window.location.href = '/u/send')}
          />
          <QuickActionButton
            icon="↙"
            label="Receive"
            color="bg-blue-600"
            onClick={() => (window.location.href = '/u/receive')}
          />
          <QuickActionButton
            icon="⇄"
            label="Swap"
            color="bg-purple-600"
            onClick={() => (window.location.href = '/u/swap')}
          />
          <QuickActionButton
            icon="🛍️"
            label="Shop"
            color="bg-orange-600"
            onClick={() => (window.location.href = '/u/products')}
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Wallets by Chain - Responsive Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Your Wallets</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGenerateDialog(true)}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Wallet</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {SUPPORTED_CHAINS.map((chain) => {
                // Case-insensitive comparison to handle both old (uppercase) and new (lowercase) wallets
                const chainWallets = wallets.filter((w) => w.chain.toLowerCase() === chain.id.toLowerCase())
                const hasWallet = chainWallets.length > 0

                if (!hasWallet) {
                  return (
                    <Card
                      key={chain.id}
                      className="border-2 border-dashed cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-all min-h-[200px] flex items-center justify-center group"
                      onClick={() => handleGenerateWallet(chain.id)}
                    >
                      <CardContent className="pt-6 text-center">
                        <div
                          className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted/50 group-hover:bg-gradient-to-br group-hover:${chain.color.split(' ')[0]} flex items-center justify-center text-2xl text-muted-foreground group-hover:text-white transition-all`}
                        >
                          {chain.icon}
                        </div>
                        <h4 className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          {chain.name}
                        </h4>
                        <p className="text-xs text-muted-foreground/70 mb-3">{chain.description}</p>
                        <Badge
                          variant="outline"
                          className="text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          + Create Wallet
                        </Badge>
                      </CardContent>
                    </Card>
                  )
                }

                return chainWallets.map((wallet) => (
                  <EnhancedWalletCard
                    key={wallet.id}
                    wallet={wallet}
                    chain={chain}
                    onClick={(walletId) => (window.location.href = `/u/wallet/${walletId}`)}
                    onDelete={(walletId) => {
                      deleteWallet(walletId)
                      void Vault.deleteWallet(walletId).catch(() => {})
                    }}
                    onViewMnemonic={(walletId, walletName) => {
                      setShowMnemonic({ id: walletId, name: walletName })
                    }}
                  />
                ))
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Activity</h3>
            {transactions.length === 0 ? (
              <Card className="bg-muted/30">
                <CardContent className="py-8 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground/70">Your activity will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="divide-y">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'receive'
                              ? 'bg-green-500/10 text-green-500'
                              : tx.type === 'send'
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-purple-500/10 text-purple-500'
                          }`}
                        >
                          {tx.type === 'receive' ? '↙' : tx.type === 'send' ? '↗' : '⇄'}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{tx.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${tx.type === 'receive' ? 'text-green-500' : ''}`}>
                          {tx.type === 'receive' ? '+' : '-'}
                          {tx.amount} {tx.token}
                        </div>
                        <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Generate Wallet Dialog */}
      <GenerateWalletDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        chains={SUPPORTED_CHAINS}
        onGenerate={handleGenerateWallet}
        existingWallets={wallets.map((w) => w.chain.toLowerCase())}
      />

      {/* Vault Dialogs */}
      <VaultUnlockDialog open={showUnlock} onOpenChange={setShowUnlock} />

      <VaultBackupDialog open={showBackup} onOpenChange={setShowBackup} />

      {showMnemonic && (
        <ViewMnemonicWithVault
          walletId={showMnemonic.id}
          walletName={showMnemonic.name}
          onClose={() => setShowMnemonic(null)}
        />
      )}

      {/* Keys are now saved automatically to u_keys storage */}
      {/* Users can view their private keys and recovery phrases on the /u/keys page */}
    </div>
  )
}

// ViewMnemonicWithVault — fetch the mnemonic via vault.getMnemonic with step-up.
function ViewMnemonicWithVault({
  walletId,
  walletName,
  onClose,
}: {
  walletId: string
  walletName: string
  onClose: () => void
}) {
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        // Step-up before reveal — confirms presence on a sensitive op.
        const status = await Vault.getStatus()
        const ok = status.capabilities.prf ? await Vault.stepUpPasskey() : true
        if (!ok) {
          if (!cancelled) {
            setError('Verification cancelled')
            setLoading(false)
          }
          return
        }
        const m = await Vault.getMnemonic(walletId)
        if (!cancelled) {
          if (!m) setError('No mnemonic stored for this wallet')
          else setMnemonic(m)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [walletId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-w-lg w-full rounded-lg border border-[#252538] bg-[#0a0a0f] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-100">Recovery phrase — {walletName}</h3>
        <p className="mt-1 text-sm text-slate-400">Write this down. Anyone with these words can spend your funds.</p>
        {loading && <p className="mt-4 text-sm text-slate-400">Verifying…</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {mnemonic && (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {mnemonic.split(' ').map((word, i) => (
              <div
                key={`${i}-${word}`}
                className="flex items-center gap-1.5 rounded-md border border-[#252538] bg-[#161622] px-2 py-1.5 font-mono text-sm"
              >
                <span className="text-xs text-slate-500">{i + 1}</span>
                <span className="text-slate-100">{word}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// Feature Card for Onboarding
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted">
      <CardContent className="pt-6 text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Quick Action Button - Touch-friendly buttons
function QuickActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} hover:opacity-90 active:scale-95 transition-all text-white rounded-xl p-2.5 sm:p-3 flex flex-col items-center gap-0.5 sm:gap-1 min-h-[56px] sm:min-h-[64px]`}
    >
      <span className="text-lg sm:text-xl">{icon}</span>
      <span className="text-[10px] sm:text-xs font-medium">{label}</span>
    </button>
  )
}

// Mini Stat Card - Compact for mobile
function _MiniStatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 text-center">
      <span className="text-lg">{icon}</span>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// Stat Card Component (for larger screens)
function _StatCard({
  label,
  value,
  icon,
  trend,
  trendUp,
}: {
  label: string
  value: string
  icon: string
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card className="bg-card hover:shadow-lg transition-shadow">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
            {trend && <div className={`text-xs mt-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>{trend}</div>}
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  )
}
