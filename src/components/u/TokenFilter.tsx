/**
 * TokenFilter - Token selection and filtering buttons
 *
 * Displays 6 token buttons in a centered, grid layout:
 * ETH, BTC, SOL, SUI, USDC, ONE
 *
 * Allows users to filter wallet view by token/chain
 */

import { useState } from 'react'

interface Token {
  id: string
  name: string
  symbol: string
  icon: string
  color: string
  decimals: number
}

const TOKENS: Token[] = [
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', icon: '⟠', color: 'from-blue-500 to-indigo-600', decimals: 18 },
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', icon: '₿', color: 'from-orange-400 to-orange-600', decimals: 8 },
  { id: 'SOL', name: 'Solana', symbol: 'SOL', icon: '◎', color: 'from-purple-500 to-pink-500', decimals: 9 },
  { id: 'SUI', name: 'Sui', symbol: 'SUI', icon: '💧', color: 'from-cyan-400 to-blue-500', decimals: 9 },
  { id: 'USDC', name: 'USDC', symbol: 'USDC', icon: '💵', color: 'from-blue-400 to-blue-600', decimals: 6 },
  { id: 'ONE', name: 'ONE', symbol: 'ONE', icon: '①', color: 'from-emerald-400 to-teal-600', decimals: 18 },
]

interface TokenFilterProps {
  selectedToken?: string
  onTokenChange?: (tokenId: string) => void
}

export function TokenFilter({ selectedToken, onTokenChange }: TokenFilterProps) {
  const [selected, setSelected] = useState<string | undefined>(selectedToken)

  const handleTokenSelect = (tokenId: string) => {
    setSelected(tokenId)
    onTokenChange?.(tokenId)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-8">
      {/* Grid of token buttons - 3x2 centered layout */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {TOKENS.map((token) => {
          const isSelected = selected === token.id

          return (
            <button
              key={token.id}
              onClick={() => handleTokenSelect(token.id)}
              className={`
                flex flex-col items-center justify-center gap-2 p-4 rounded-lg
                border-2 transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? `border-primary bg-primary/10 shadow-lg scale-105`
                    : 'border-border/50 hover:border-border/80 hover:bg-muted/50'
                }
              `}
            >
              {/* Icon */}
              <span className="text-2xl sm:text-3xl">{token.icon}</span>

              {/* Symbol */}
              <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {token.symbol}
              </span>

              {/* Name - hidden on very small screens */}
              <span className="text-xs text-muted-foreground hidden sm:block">{token.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Optional: Show selected token info */}
      {selected && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">Showing {TOKENS.find((t) => t.id === selected)?.name} tokens</p>
        </div>
      )}
    </div>
  )
}

export type { Token }
export { TOKENS }
