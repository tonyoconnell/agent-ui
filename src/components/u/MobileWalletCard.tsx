/**
 * MobileWalletCard - Apple Wallet-style card optimized for mobile
 *
 * Features:
 * - 44pt minimum touch targets (Apple HIG)
 * - Swipe actions
 * - Haptic feedback ready
 * - Above-the-fold optimized height
 * - Large, readable balance
 */

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  icon: string
  decimals: number
}

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  createdAt: number
  name?: string
}

interface MobileWalletCardProps {
  wallet: Wallet
  chain: Chain
  onSend: () => void
  onReceive: () => void
  onSwap: () => void
  onCopyAddress: () => void
  onCardPress?: () => void
  compact?: boolean
}

export function MobileWalletCard({
  wallet,
  chain,
  onSend,
  onReceive,
  onSwap,
  onCopyAddress,
  onCardPress,
  compact = false,
}: MobileWalletCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopyAddress()
  }

  // Truncate address for mobile (show first 6 and last 4)
  const truncatedAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`

  return (
    <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
      <Card
        className={`
          relative overflow-hidden cursor-pointer
          active:opacity-90 transition-all duration-200
          ${compact ? 'min-h-[120px]' : 'min-h-[180px]'}
        `}
        onClick={onCardPress}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${chain.color} opacity-10`} />

        {/* Top Accent Line */}
        <div className={`h-1 bg-gradient-to-r ${chain.color}`} />

        <CardContent className={`relative ${compact ? 'p-4' : 'p-5'}`}>
          {/* Header Row - Chain Info + Balance */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Chain Icon - Larger for touch */}
              <div
                className={`
                  ${compact ? 'w-10 h-10' : 'w-12 h-12'}
                  rounded-2xl bg-gradient-to-br ${chain.color}
                  flex items-center justify-center text-white shadow-lg
                  ${compact ? 'text-lg' : 'text-xl'}
                `}
              >
                {chain.icon}
              </div>
              <div>
                <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{wallet.name || chain.name}</h3>
                <Badge variant="secondary" className="text-xs font-medium">
                  {chain.symbol}
                </Badge>
              </div>
            </div>

            {/* Balance - Right aligned */}
            <div className="text-right">
              <div className={`font-bold ${compact ? 'text-lg' : 'text-2xl'}`}>
                {parseFloat(wallet.balance).toLocaleString(undefined, {
                  maximumFractionDigits: compact ? 4 : 6,
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                $
                {wallet.usdValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {/* Address - Tappable to Copy */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            className={`
              w-full ${compact ? 'py-2' : 'py-3'} px-3
              bg-muted/50 rounded-xl
              flex items-center justify-between gap-2
              active:bg-muted transition-colors
              min-h-[44px]
            `}
          >
            <code className="text-xs font-mono text-muted-foreground">{truncatedAddress}</code>
            <span className={`text-xs ${copied ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>

          {/* Quick Actions - Large Touch Targets */}
          {!compact && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <ActionButton
                label="Send"
                icon="arrow-up"
                color="green"
                onClick={(e) => {
                  e.stopPropagation()
                  onSend()
                }}
              />
              <ActionButton
                label="Receive"
                icon="arrow-down"
                color="blue"
                onClick={(e) => {
                  e.stopPropagation()
                  onReceive()
                }}
              />
              <ActionButton
                label="Swap"
                icon="arrows"
                color="purple"
                onClick={(e) => {
                  e.stopPropagation()
                  onSwap()
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Action Button with Apple-style design
function ActionButton({
  label,
  icon,
  color,
  onClick,
}: {
  label: string
  icon: 'arrow-up' | 'arrow-down' | 'arrows'
  color: 'green' | 'blue' | 'purple'
  onClick: (e: React.MouseEvent) => void
}) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-600 hover:bg-green-500/20 active:bg-green-500/30',
    blue: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:bg-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 active:bg-purple-500/30',
  }

  const icons = {
    'arrow-up': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ),
    'arrow-down': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    ),
    arrows: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    ),
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1.5
        py-3 px-2 rounded-xl
        min-h-[56px]
        font-medium text-sm
        transition-colors duration-150
        ${colorClasses[color]}
      `}
    >
      {icons[icon]}
      <span>{label}</span>
    </button>
  )
}

/**
 * Compact wallet display for horizontal scroll on mobile
 */
export function MobileWalletChip({
  wallet,
  chain,
  isActive,
  onClick,
}: {
  wallet: Wallet
  chain: Chain
  isActive?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 flex items-center gap-2.5 px-4 py-3
        rounded-2xl transition-all duration-200
        min-w-[140px]
        ${isActive ? `bg-gradient-to-br ${chain.color} text-white shadow-lg` : 'bg-muted/50 hover:bg-muted'}
      `}
    >
      <span className={`text-lg ${isActive ? '' : ''}`}>{chain.icon}</span>
      <div className="text-left">
        <div className={`text-xs ${isActive ? 'text-white/70' : 'text-muted-foreground'}`}>{chain.symbol}</div>
        <div className={`font-semibold text-sm ${isActive ? 'text-white' : ''}`}>
          {parseFloat(wallet.balance).toFixed(4)}
        </div>
      </div>
    </button>
  )
}
