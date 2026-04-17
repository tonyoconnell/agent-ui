/**
 * MobileOnboarding - Mobile-first wallet onboarding experience
 *
 * Designed for what users see "above the fold" on mobile devices.
 *
 * Mobile (320-428px):
 * - Hero: Logo, tagline, single CTA
 * - Chain grid: 2x3 (all visible)
 * - "Create All" button
 *
 * Tablet (768-1024px):
 * - Hero with more text
 * - Chain grid: 3x2
 * - Feature cards below
 *
 * Desktop (1024px+):
 * - Full experience
 */

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useResponsive } from './hooks/useResponsive'

interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  icon: string
  description: string
}

interface MobileOnboardingProps {
  chains: Chain[]
  existingWallets: string[]
  onGenerateWallet: (chainId: string) => void
  onGenerateAll: () => void
  isGenerating: string | null
  isGeneratingAll: boolean
}

export function MobileOnboarding({
  chains,
  existingWallets,
  onGenerateWallet,
  onGenerateAll,
  isGenerating,
  isGeneratingAll,
}: MobileOnboardingProps) {
  const { isMobile } = useResponsive()
  const [showDetails, setShowDetails] = useState(false)

  const hasWalletForChain = (chainId: string) => existingWallets.includes(chainId)
  const allWalletsCreated = chains.every((c) => hasWalletForChain(c.id))
  const someWalletsCreated = chains.some((c) => hasWalletForChain(c.id))

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Animated Background - Simplified on mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-64 md:w-96 h-64 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 sm:mb-6 shadow-xl">
            <span className="text-3xl sm:text-4xl font-bold text-primary">u</span>
          </div>

          {/* Title - Responsive sizing */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">
            {isMobile ? 'Universal Wallet' : 'Your Universal Wallet'}
          </h1>

          {/* Subtitle - Hide details on mobile */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-1 sm:mb-2">
            {isMobile ? 'One identity. Every blockchain.' : 'One identity. Every blockchain. Zero friction.'}
          </p>

          {/* Trust indicators - Compact on mobile */}
          {!isMobile && (
            <p className="text-xs sm:text-sm text-muted-foreground/70">
              Keys generated locally • Never leaves your device • Powered by one-protocol
            </p>
          )}
        </motion.div>

        {/* Chain Selection Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`
            grid gap-3 sm:gap-4 mb-6 sm:mb-8
            ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}
          `}
        >
          {chains.map((chain, index) => {
            const hasWallet = hasWalletForChain(chain.id)
            const isCurrentlyGenerating = isGenerating === chain.id

            return (
              <motion.div
                key={chain.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !hasWallet && !isGenerating && onGenerateWallet(chain.id)}
                className={`
                  relative cursor-pointer
                  ${hasWallet ? 'cursor-default' : ''}
                `}
              >
                <Card
                  className={`
                    relative overflow-hidden transition-all duration-300
                    ${
                      hasWallet
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-dashed border-muted-foreground/20 hover:border-primary/40 bg-card/50 backdrop-blur-sm'
                    }
                    ${isCurrentlyGenerating ? 'animate-pulse border-primary/50' : ''}
                    ${!hasWallet && !isGenerating ? 'hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]' : ''}
                  `}
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${chain.color} opacity-0 ${!hasWallet ? 'group-hover:opacity-10' : ''} transition-opacity`}
                  />

                  <CardContent className={`relative ${isMobile ? 'p-3' : 'p-4 sm:p-5'} text-center`}>
                    {/* Chain Icon */}
                    <div
                      className={`
                        ${isMobile ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14'}
                        mx-auto mb-2 sm:mb-3 rounded-xl sm:rounded-2xl
                        flex items-center justify-center
                        ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'}
                        shadow-lg transition-all
                        ${
                          hasWallet
                            ? `bg-gradient-to-br ${chain.color} text-white`
                            : 'bg-muted/50 text-muted-foreground'
                        }
                      `}
                    >
                      {isCurrentlyGenerating ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        chain.icon
                      )}
                    </div>

                    {/* Chain Name */}
                    <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} mb-0.5`}>{chain.name}</h3>

                    {/* Description - Hide on mobile for space */}
                    {!isMobile && <p className="text-xs text-muted-foreground mb-2">{chain.description}</p>}

                    {/* Status Badge */}
                    {hasWallet ? (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">Created</Badge>
                    ) : (
                      <Badge variant="outline" className={`text-xs ${isMobile ? 'text-[10px] px-2' : ''}`}>
                        {isMobile ? '+ Add' : '+ Add Wallet'}
                      </Badge>
                    )}
                  </CardContent>

                  {/* Bottom gradient line */}
                  <div
                    className={`h-1 bg-gradient-to-r ${chain.color} ${hasWallet ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  />
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Create All Button - Prominent on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 sm:mb-12"
        >
          <Button
            size="lg"
            onClick={onGenerateAll}
            disabled={isGeneratingAll || allWalletsCreated}
            className={`
              ${isMobile ? 'w-full h-14' : 'h-14 px-8'}
              text-base sm:text-lg
              bg-gradient-to-r from-primary to-purple-600
              hover:opacity-90 shadow-xl font-semibold
            `}
          >
            {isGeneratingAll ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                Creating...
              </>
            ) : allWalletsCreated ? (
              <>All Wallets Created</>
            ) : (
              <>
                <span className="mr-2 text-xl">✨</span>
                {someWalletsCreated ? 'Create Remaining Wallets' : 'Create All Wallets'}
              </>
            )}
          </Button>
          {!isMobile && (
            <p className="text-xs text-muted-foreground mt-3">Generate wallets for all supported chains at once</p>
          )}
        </motion.div>

        {/* Features - Simplified on mobile */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            <FeatureCard icon="🔐" title="Self-Custodial" description="Your keys never leave your device." />
            <FeatureCard icon="⚡" title="Instant" description="Generate wallets in milliseconds." />
            <FeatureCard icon="🌐" title="Multi-Chain" description="ETH, BTC, SOL, SUI and more." />
          </motion.div>
        )}

        {/* Mobile: Expandable info section */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-muted-foreground flex items-center gap-2 mx-auto"
            >
              <span>{showDetails ? 'Hide' : 'Learn more'}</span>
              <motion.svg
                animate={{ rotate: showDetails ? 180 : 0 }}
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="space-y-3 text-left">
                    <InfoItem icon="🔐" text="Keys are generated locally and never leave your device" />
                    <InfoItem icon="💾" text="Stored encrypted in your browser's local storage" />
                    <InfoItem icon="📱" text="Back up your seed phrase to recover on any device" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Security Notes - Desktop only */}
        {isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-3xl mx-auto space-y-4"
          >
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-2xl shrink-0">
                  🛡️
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bank-Grade Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Keys are generated using cryptographically secure random numbers via the Web Crypto API. Your seed
                    phrase is stored encrypted in your browser's local storage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted">
      <CardContent className="pt-6 text-center">
        <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{icon}</div>
        <h3 className="font-semibold text-sm sm:text-base mb-1">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function InfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
      <span className="text-lg shrink-0">{icon}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
