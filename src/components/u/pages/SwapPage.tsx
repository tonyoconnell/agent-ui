/**
 * SwapPage - Swap Tokens (Coming Soon)
 *
 * We're building a real-time, seamless token swap system.
 * In the meantime, here are the best places to swap your tokens,
 * with step-by-step instructions for each platform.
 *
 * Features:
 * - Coming soon notification
 * - List of top swap providers by chain
 * - Step-by-step guides for each platform
 * - Direct links to each DEX
 * - Chain-specific recommendations
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import { UNav } from '../UNav'

// Supported chains for swapping
const SWAP_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: '⟠', color: 'from-blue-500 to-indigo-600' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎', color: 'from-purple-500 to-pink-500' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: '💜', color: 'from-purple-400 to-purple-600' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', icon: '🔵', color: 'from-blue-400 to-blue-600' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', icon: '🔴', color: 'from-red-400 to-red-600' },
  { id: 'base', name: 'Base', symbol: 'BASE', icon: '⚪', color: 'from-blue-300 to-blue-500' },
]

// Swap providers with chain support
const SWAP_PROVIDERS = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    icon: '🦄',
    description: 'Largest decentralized exchange with deep liquidity',
    url: 'https://app.uniswap.org',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
    steps: [
      'Visit app.uniswap.org',
      'Connect your wallet (MetaMask, Coinbase Wallet, etc.)',
      'Enter the token you want to swap FROM',
      'Enter the token you want to swap TO',
      "Click 'Swap' to see the price quote",
      'Approve the token contract (one-time per token)',
      'Confirm the swap and sign with your wallet',
    ],
    features: ['Best prices', 'Flash swaps', 'LP farming', 'Governance'],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    icon: '🪐',
    description: 'Top swap aggregator on Solana with best routes',
    url: 'https://jup.ag',
    chains: ['solana'],
    steps: [
      'Visit jup.ag',
      'Connect your Solana wallet (Phantom, Magic Eden, etc.)',
      'Select the token pair to swap',
      'Jupiter finds the best route automatically',
      'Review the price and slippage',
      'Confirm the swap',
      'Sign with your wallet',
    ],
    features: ['Route optimization', 'Lower fees', 'Limit orders', 'DCA orders'],
  },
  {
    id: '1inch',
    name: '1inch',
    icon: '1️⃣',
    description: 'Smart DEX aggregator for the best prices',
    url: 'https://app.1inch.io',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
    steps: [
      'Go to app.1inch.io',
      'Connect your wallet',
      'Enter the amount to swap',
      'Select input and output tokens',
      '1inch shows the best route for your swap',
      'Review gas fees and slippage tolerance',
      "Click 'Swap' and sign with your wallet",
    ],
    features: ['Best rates', 'Gas optimization', 'Limit orders', 'Fusion mode'],
  },
  {
    id: 'raydium',
    name: 'Raydium',
    icon: '📊',
    description: "Solana's most liquid AMM with concentrated liquidity",
    url: 'https://raydium.io',
    chains: ['solana'],
    steps: [
      'Visit raydium.io',
      'Connect your Solana wallet',
      "Navigate to 'Swap'",
      'Input your source token and amount',
      'Select the destination token',
      'See your output amount',
      "Click 'Swap' and confirm",
    ],
    features: ['High liquidity', 'AcceleRaytor', 'Fusion pools', 'Low fees'],
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    icon: '🍣',
    description: 'Community-driven DEX with farming and staking',
    url: 'https://www.sushi.com/swap',
    chains: ['ethereum', 'polygon', 'arbitrum'],
    steps: [
      'Go to sushi.com/swap',
      'Connect your wallet',
      'Choose your input token and amount',
      'Select the output token',
      'Preview the trade details',
      'Set slippage tolerance (0.5-1%)',
      'Confirm the swap',
    ],
    features: ['Cross-chain swaps', 'Kashi lending', 'Farms', 'Community DAO'],
  },
  {
    id: 'aave',
    name: 'Aave',
    icon: '👻',
    description: 'Lending protocol with integrated swap for collateral management',
    url: 'https://aave.com',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    steps: [
      'Visit aave.com',
      'Connect your wallet',
      "Go to 'Swap' tab",
      'Enter amount to swap',
      'Select tokens',
      'View execution price and impact',
      'Confirm and execute',
    ],
    features: ['Flash swaps', 'Lending/borrowing', 'Safety module', 'Low slippage'],
  },
]

export function SwapPage() {
  const [selectedChain, setSelectedChain] = useState('ethereum')
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)

  const filteredProviders = SWAP_PROVIDERS.filter((provider) => provider.chains.includes(selectedChain))

  const selectedChainData = SWAP_CHAINS.find((c) => c.id === selectedChain)

  return (
    <div className="min-h-screen bg-background">
      <UNav active="swap" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section - Coming Soon */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Animated background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </div>

          {/* Main Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-6 shadow-2xl">
            <span className="text-5xl sm:text-6xl">⇄</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">Swap Tokens Seamlessly</h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            We're building a real-time swap system powered by the best DEX aggregators
          </p>
          <p className="text-sm sm:text-base text-muted-foreground/70">
            In the meantime, use these trusted platforms with step-by-step guides
          </p>

          {/* Coming Soon Badge */}
          <div className="mt-8 flex justify-center">
            <Badge className="bg-purple-600/20 text-purple-600 border-purple-600/30 text-base px-4 py-2">
              <span className="inline-block mr-2">🔨</span>
              Coming Soon
            </Badge>
          </div>
        </div>

        {/* Preview Card - What's Coming */}
        <Card className="mb-8 sm:mb-12 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              What We're Building
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="text-3xl">⚡</div>
                <h4 className="font-semibold">Real-Time Quotes</h4>
                <p className="text-sm text-muted-foreground">Best prices across all chains, instantly updated</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">🔄</div>
                <h4 className="font-semibold">One-Click Swap</h4>
                <p className="text-sm text-muted-foreground">
                  Swap directly from your u wallet without leaving the app
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">🌉</div>
                <h4 className="font-semibold">Cross-Chain</h4>
                <p className="text-sm text-muted-foreground">Bridge and swap across all supported networks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chain Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Select a Chain</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {SWAP_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => {
                  emitClick('ui:swap:chain-select', { chain: chain.id })
                  setSelectedChain(chain.id)
                }}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                  selectedChain === chain.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary'
                    : 'border-muted hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1">{chain.icon}</div>
                <div className="font-semibold text-sm">{chain.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Swap Providers for Selected Chain */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{selectedChainData?.icon}</span>
            <div>
              <h2 className="text-2xl font-bold">Best Swap Platforms on {selectedChainData?.name}</h2>
              <p className="text-sm text-muted-foreground">{filteredProviders.length} platforms available</p>
            </div>
          </div>

          {filteredProviders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-5xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">Swap providers for {selectedChainData?.name} are coming soon</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                >
                  {/* Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">{provider.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="mb-1">{provider.name}</CardTitle>
                          <CardDescription>{provider.description}</CardDescription>
                          {/* Features as badges */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {provider.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-muted-foreground">{expandedProvider === provider.id ? '▼' : '▶'}</div>
                    </div>
                  </CardHeader>

                  {/* Expanded Content - Steps */}
                  {expandedProvider === provider.id && (
                    <CardContent className="pt-0 border-t">
                      <div className="py-4">
                        <h4 className="font-semibold mb-4">How to Swap on {provider.name}</h4>
                        <ol className="space-y-3">
                          {provider.steps.map((step, index) => (
                            <li key={index} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                              </div>
                              <div className="flex-1 pt-0.5 text-sm">{step}</div>
                            </li>
                          ))}
                        </ol>

                        {/* Visit Button */}
                        <Button asChild className="w-full mt-6 h-11">
                          <a href={provider.url} target="_blank" rel="noopener noreferrer">
                            <span className="mr-2">→</span>
                            Visit {provider.name}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  )}

                  {/* Collapsed View - Quick Action */}
                  {expandedProvider !== provider.id && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3 py-2">
                        <span className="text-sm text-muted-foreground flex-1">Click to see how to swap</span>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <a href={provider.url} target="_blank" rel="noopener noreferrer">
                            Open →
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Safety Tips */}
        <Card className="mt-8 sm:mt-12 bg-amber-500/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              Swap Safety Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">1.</span>
                <span className="text-sm">
                  <strong>Always verify the URL</strong> - Make sure you're on the official website (not a phishing
                  site)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">2.</span>
                <span className="text-sm">
                  <strong>Check token addresses</strong> - Verify the token contract address before swapping
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">3.</span>
                <span className="text-sm">
                  <strong>Set slippage carefully</strong> - High slippage = higher chances of frontrunning
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">4.</span>
                <span className="text-sm">
                  <strong>Start small</strong> - Test with a small amount first if you're new to a token
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">5.</span>
                <span className="text-sm">
                  <strong>Use trusted wallets</strong> - MetaMask, Phantom, Coinbase Wallet, etc.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Newsletter CTA */}
        <Card className="mt-8 sm:mt-12 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardHeader>
            <CardTitle>Get Notified When We Launch</CardTitle>
            <CardDescription>Be the first to try one-click swaps directly in your u wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-lg border bg-background"
              />
              <Button className="sm:w-auto">Notify Me</Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Powered by the best DEX aggregators •
            <a
              href="https://1inch.io"
              className="text-primary hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              1inch
            </a>
            {', '}
            <a href="https://jup.ag" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Jupiter
            </a>
            {' & more'}
          </p>
        </div>
      </div>
    </div>
  )
}
