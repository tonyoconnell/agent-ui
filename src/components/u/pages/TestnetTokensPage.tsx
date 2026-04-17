/**
 * TestnetTokensPage - Get Testnet Tokens
 *
 * A guide to requesting test tokens for development across multiple blockchain networks.
 * Quick access to testnet faucets, with step-by-step instructions for each chain.
 *
 * Features:
 * - Multiple chain support (Ethereum, Solana, Polygon, etc.)
 * - List of testnet faucets per chain
 * - Step-by-step request instructions
 * - Direct links to faucets
 * - Safety tips for testnet development
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UNav } from '../UNav'

// Supported testnet chains
const TESTNET_CHAINS = [
  { id: 'ethereum-sepolia', name: 'Ethereum Sepolia', symbol: 'ETH', icon: '⟠', color: 'from-blue-500 to-indigo-600' },
  { id: 'solana-devnet', name: 'Solana Devnet', symbol: 'SOL', icon: '◎', color: 'from-purple-500 to-pink-500' },
  { id: 'polygon-mumbai', name: 'Polygon Mumbai', symbol: 'MATIC', icon: '💜', color: 'from-purple-400 to-purple-600' },
  { id: 'arbitrum-sepolia', name: 'Arbitrum Sepolia', symbol: 'ETH', icon: '🔵', color: 'from-blue-400 to-blue-600' },
  { id: 'optimism-sepolia', name: 'Optimism Sepolia', symbol: 'ETH', icon: '🔴', color: 'from-red-400 to-red-600' },
  { id: 'base-sepolia', name: 'Base Sepolia', symbol: 'ETH', icon: '⚪', color: 'from-blue-300 to-blue-500' },
]

// Testnet faucets
const TESTNET_FAUCETS = [
  {
    id: 'ethereum-sepolia-faucet',
    chain: 'ethereum-sepolia',
    name: 'Ethereum Sepolia Faucet',
    icon: '💧',
    description: 'Official Ethereum Sepolia testnet faucet',
    url: 'https://www.infura.io/faucet/sepolia',
    steps: [
      'Visit the Ethereum Sepolia faucet',
      'Enter your wallet address (0x...)',
      'Solve the CAPTCHA if required',
      "Click 'Send Me ETH'",
      'Wait for confirmation (usually within 1 minute)',
      "Check your wallet - you'll receive test ETH",
    ],
    amount: '0.05 ETH per request',
    frequency: 'Once every 24 hours',
  },
  {
    id: 'ethereum-sepolia-alchemy',
    chain: 'ethereum-sepolia',
    name: 'Alchemy Sepolia Faucet',
    icon: '⚗️',
    description: "Alchemy's high-speed Sepolia faucet",
    url: 'https://sepoliafaucet.com',
    steps: [
      'Navigate to sepoliafaucet.com',
      'Connect your wallet or enter address',
      "Click 'Send Me ETH'",
      'Receive test ETH instantly',
      'Use in your Sepolia dApps',
    ],
    amount: '0.5 ETH per request',
    frequency: 'Once per day',
  },
  {
    id: 'solana-devnet-faucet',
    chain: 'solana-devnet',
    name: 'Solana Devnet Faucet',
    icon: '🚀',
    description: 'Official Solana devnet token faucet',
    url: 'https://solfaucet.com',
    steps: [
      'Visit solfaucet.com',
      'Enter your Solana wallet address',
      'Select devnet from dropdown',
      "Click 'Request SOL'",
      'Receive test SOL in your wallet (instant)',
      'Start testing on Solana devnet',
    ],
    amount: 'Up to 10 SOL per request',
    frequency: 'Every 24 hours',
  },
  {
    id: 'polygon-mumbai-faucet',
    chain: 'polygon-mumbai',
    name: 'Polygon Faucet',
    icon: '🪙',
    description: 'Official Polygon Mumbai testnet faucet',
    url: 'https://faucet.polygon.technology',
    steps: [
      'Go to faucet.polygon.technology',
      "Select 'Mumbai' network",
      'Enter your wallet address',
      "Click 'Submit'",
      'Confirm the transaction',
      'Receive test MATIC tokens',
    ],
    amount: '0.5 MATIC per request',
    frequency: 'Every 4 hours',
  },
  {
    id: 'arbitrum-sepolia-faucet',
    chain: 'arbitrum-sepolia',
    name: 'Arbitrum Faucet',
    icon: '⚙️',
    description: 'Arbitrum Sepolia testnet faucet',
    url: 'https://faucet.arbitrum.io',
    steps: [
      'Visit faucet.arbitrum.io',
      'Connect your wallet',
      'Select Sepolia testnet',
      "Click 'Send test ETH'",
      'Sign the transaction',
      'Receive test ETH (usually instant)',
    ],
    amount: '0.05 ETH per request',
    frequency: 'Once daily',
  },
  {
    id: 'optimism-sepolia-faucet',
    chain: 'optimism-sepolia',
    name: 'Optimism Faucet',
    icon: '🌈',
    description: 'Optimism Sepolia testnet faucet',
    url: 'https://app.optimism.io/faucets',
    steps: [
      'Go to app.optimism.io/faucets',
      'Connect your wallet',
      'Select Sepolia from network dropdown',
      "Click 'Send ETH to me'",
      'Approve the request',
      'Receive test ETH instantly',
    ],
    amount: '0.05 ETH per request',
    frequency: 'Once every 24 hours',
  },
  {
    id: 'base-sepolia-faucet',
    chain: 'base-sepolia',
    name: 'Base Faucet',
    icon: '🔷',
    description: 'Base Sepolia testnet faucet',
    url: 'https://www.base.org/faucets',
    steps: [
      'Visit www.base.org/faucets',
      'Connect your Base-compatible wallet',
      "Click 'Send me base ETH'",
      'Confirm the transaction',
      'Receive test ETH instantly',
      'Start building on Base Sepolia',
    ],
    amount: '0.05 ETH per request',
    frequency: 'Once daily',
  },
]

export function TestnetTokensPage() {
  const [selectedChain, setSelectedChain] = useState('ethereum-sepolia')
  const [expandedFaucet, setExpandedFaucet] = useState<string | null>(null)

  const filteredFaucets = TESTNET_FAUCETS.filter((faucet) => faucet.chain === selectedChain)

  const selectedChainData = TESTNET_CHAINS.find((c) => c.id === selectedChain)

  return (
    <div className="min-h-screen bg-background">
      <UNav active="testnet-tokens" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Animated background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </div>

          {/* Main Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-6 shadow-2xl">
            <span className="text-5xl sm:text-6xl">💧</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">Get Testnet Tokens</h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            Request free test tokens for development and testing
          </p>
          <p className="text-sm sm:text-base text-muted-foreground/70">
            Access multiple testnet faucets with quick guides
          </p>

          {/* Badge */}
          <div className="mt-8 flex justify-center">
            <Badge className="bg-blue-600/20 text-blue-600 border-blue-600/30 text-base px-4 py-2">
              <span className="inline-block mr-2">🧪</span>
              Development & Testing
            </Badge>
          </div>
        </div>

        {/* Quick Info Card */}
        <Card className="mb-8 sm:mb-12 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              What are Testnet Tokens?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="text-3xl">🎮</div>
                <h4 className="font-semibold">Test for Free</h4>
                <p className="text-sm text-muted-foreground">No real value - safe to test smart contracts</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">⚡</div>
                <h4 className="font-semibold">Instant Access</h4>
                <p className="text-sm text-muted-foreground">Request tokens instantly from faucets</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">🔧</div>
                <h4 className="font-semibold">Development Only</h4>
                <p className="text-sm text-muted-foreground">Used exclusively for testing and development</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chain Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Select a Network</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {TESTNET_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => {
                  setSelectedChain(chain.id)
                  setExpandedFaucet(null)
                }}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                  selectedChain === chain.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary'
                    : 'border-muted hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1">{chain.icon}</div>
                <div className="font-semibold text-xs sm:text-sm">{chain.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Testnet Faucets for Selected Chain */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{selectedChainData?.icon}</span>
            <div>
              <h2 className="text-2xl font-bold">Faucets on {selectedChainData?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {filteredFaucets.length} {filteredFaucets.length === 1 ? 'faucet' : 'faucets'} available
              </p>
            </div>
          </div>

          {filteredFaucets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-5xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">Faucets for {selectedChainData?.name} are coming soon</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredFaucets.map((faucet) => (
                <Card
                  key={faucet.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setExpandedFaucet(expandedFaucet === faucet.id ? null : faucet.id)}
                >
                  {/* Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">{faucet.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="mb-1">{faucet.name}</CardTitle>
                          <CardDescription>{faucet.description}</CardDescription>
                          {/* Amount & Frequency */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {faucet.amount}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {faucet.frequency}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-muted-foreground">{expandedFaucet === faucet.id ? '▼' : '▶'}</div>
                    </div>
                  </CardHeader>

                  {/* Expanded Content - Steps */}
                  {expandedFaucet === faucet.id && (
                    <CardContent className="pt-0 border-t">
                      <div className="py-4">
                        <h4 className="font-semibold mb-4">How to Request Tokens</h4>
                        <ol className="space-y-3">
                          {faucet.steps.map((step, index) => (
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
                          <a href={faucet.url} target="_blank" rel="noopener noreferrer">
                            <span className="mr-2">→</span>
                            Open Faucet
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  )}

                  {/* Collapsed View - Quick Action */}
                  {expandedFaucet !== faucet.id && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3 py-2">
                        <span className="text-sm text-muted-foreground flex-1">Click to see how to request tokens</span>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <a href={faucet.url} target="_blank" rel="noopener noreferrer">
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

        {/* Tips Section */}
        <Card className="mt-8 sm:mt-12 bg-amber-500/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Testnet Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">1.</span>
                <span className="text-sm">
                  <strong>Use testnet networks</strong> - Make sure your wallet is set to the testnet, not mainnet
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">2.</span>
                <span className="text-sm">
                  <strong>Save your requests</strong> - Most faucets have rate limits (1 request per day/week)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">3.</span>
                <span className="text-sm">
                  <strong>No real value</strong> - Testnet tokens have zero value and reset periodically
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">4.</span>
                <span className="text-sm">
                  <strong>Different from mainnet</strong> - Testnet is a separate network with different addresses
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 font-bold">5.</span>
                <span className="text-sm">
                  <strong>For testing only</strong> - Never use mainnet addresses or keys on testnet faucets
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Common Networks Card */}
        <Card className="mt-8 sm:mt-12 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-slate-900/50 dark:to-slate-800/50 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📡</span>
              Add Networks to Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Ethereum Sepolia</h4>
                <div className="text-xs font-mono bg-background p-2 rounded border">
                  RPC: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Solana Devnet</h4>
                <div className="text-xs font-mono bg-background p-2 rounded border">
                  RPC: https://api.devnet.solana.com
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Use MetaMask, Phantom, or other wallet tools to add these networks. Check official documentation for
                latest RPC endpoints.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Testnet tokens are free for developers •
            <a
              href="https://docs.ethereum.org/en/developers/docs/test-networks"
              className="text-primary hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about testnets
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
