/**
 * SwapSheet - DEX aggregator interface for token swaps
 *
 * Features:
 * - Token selection
 * - Price quotes from multiple DEXs
 * - Slippage settings
 * - Real-time rate updates
 */
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomSheet, BottomSheetContent, BottomSheetFooter } from '../BottomSheet'

interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  icon: string
}

interface Wallet {
  id: string
  address: string
  balance: string
  usdValue: number
}

interface Token {
  symbol: string
  name: string
  icon: string
  balance?: string
}

interface SwapSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: Wallet
  chain: Chain
  onSwap: (fromAmount: string, toToken: string) => void
}

// Available tokens for swap (simplified)
const SWAP_TOKENS: Token[] = [
  { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
  { symbol: 'USDT', name: 'Tether', icon: '💴' },
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
]

export function SwapSheet({ open, onOpenChange, wallet, chain, onSwap }: SwapSheetProps) {
  const [fromAmount, setFromAmount] = useState('')
  const [toToken, setToToken] = useState<Token | null>(null)
  const [toAmount, setToAmount] = useState('')
  const [showTokenSelect, setShowTokenSelect] = useState(false)
  const [slippage] = useState('0.5')

  // Simulated exchange rate (in production, fetch from DEX aggregator)
  const exchangeRate = toToken ? (Math.random() * 0.5 + 0.8).toFixed(4) : '0'

  // Calculate to amount based on rate
  useEffect(() => {
    if (fromAmount && toToken && parseFloat(exchangeRate) > 0) {
      const calculated = parseFloat(fromAmount) * parseFloat(exchangeRate)
      setToAmount(calculated.toFixed(6))
    } else {
      setToAmount('')
    }
  }, [fromAmount, toToken, exchangeRate])

  // Price per token
  const pricePerToken = parseFloat(wallet.balance) > 0 ? wallet.usdValue / parseFloat(wallet.balance) : 0
  const fromUsd = parseFloat(fromAmount || '0') * pricePerToken

  // Network fee estimate
  const networkFee = 0.002

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setFromAmount('')
        setToToken(null)
        setToAmount('')
        setShowTokenSelect(false)
      }, 300)
    }
  }, [open])

  const handleSwap = () => {
    if (fromAmount && toToken) {
      onSwap(fromAmount, toToken.symbol)
      onOpenChange(false)
    }
  }

  const handleReverseTokens = () => {
    // In a real app, this would swap the from/to tokens
    // For now, just a visual feedback
  }

  // Filter out current chain token from swap options
  const availableTokens = SWAP_TOKENS.filter((t) => t.symbol !== chain.symbol)

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Swap ${chain.symbol}`}
      description="Best rates from top DEXs"
      headerGradient={chain.color}
      headerIcon={
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      }
    >
      <BottomSheetContent className="space-y-4">
        {/* You Pay Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">You Pay</Label>
            <span className="text-xs text-muted-foreground">Balance: {parseFloat(wallet.balance).toFixed(4)}</span>
          </div>
          <div className="relative bg-muted/50 rounded-2xl p-4 border-2 border-transparent focus-within:border-primary/30 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  setFromAmount(value)
                }}
                className="text-3xl font-bold border-0 bg-transparent p-0 focus-visible:ring-0 flex-1"
              />
              <div
                className={`
                  flex items-center gap-2
                  bg-gradient-to-r ${chain.color}
                  text-white px-4 py-2.5 rounded-full
                  font-medium
                `}
              >
                <span className="text-lg">{chain.icon}</span>
                <span>{chain.symbol}</span>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>${fromUsd.toFixed(2)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                onClick={() => {
                  const maxAmount = Math.max(0, parseFloat(wallet.balance) - networkFee)
                  setFromAmount(maxAmount.toFixed(6))
                }}
              >
                Max
              </Button>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-1">
          <button
            onClick={handleReverseTokens}
            className="w-12 h-12 rounded-full bg-background border-4 border-muted flex items-center justify-center text-xl cursor-pointer hover:bg-muted active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        {/* You Receive Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">You Receive</Label>
          <div className="relative bg-muted/30 rounded-2xl p-4 border-2 border-dashed border-muted-foreground/20">
            <div className="flex items-center justify-between gap-3">
              <div className="text-3xl font-bold text-muted-foreground flex-1">{toAmount || '0.00'}</div>
              <button
                onClick={() => setShowTokenSelect(true)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-full
                  ${toToken ? 'bg-muted text-foreground' : 'bg-primary/10 text-primary border-2 border-primary/30'}
                  font-medium transition-colors
                  hover:opacity-80 active:scale-95
                `}
              >
                {toToken ? (
                  <>
                    <span className="text-lg">{toToken.icon}</span>
                    <span>{toToken.symbol}</span>
                  </>
                ) : (
                  <span>Select</span>
                )}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {toToken && fromAmount
                ? `1 ${chain.symbol} = ${exchangeRate} ${toToken.symbol}`
                : 'Select token to see rate'}
            </div>
          </div>
        </div>

        {/* Token Selection Overlay */}
        {showTokenSelect && (
          <div className="absolute inset-0 bg-background z-10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Token</h3>
              <button
                onClick={() => setShowTokenSelect(false)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {availableTokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    setToToken(token)
                    setShowTokenSelect(false)
                  }}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl
                    ${
                      toToken?.symbol === token.symbol
                        ? 'bg-primary/10 border-2 border-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                    }
                    transition-colors active:scale-[0.99]
                  `}
                >
                  <span className="text-2xl">{token.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">{token.name}</div>
                  </div>
                  {toToken?.symbol === token.symbol && (
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Swap Details */}
        {toToken && fromAmount && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Rate
              </span>
              <span>
                1 {chain.symbol} = {exchangeRate} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
                Network Fee
              </span>
              <span>~${(networkFee * pricePerToken).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Slippage
              </span>
              <Badge variant="outline" className="text-xs">
                {slippage}%
              </Badge>
            </div>
          </div>
        )}

        {/* DEX Sources */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Powered by</span>
          <Badge variant="secondary" className="text-xs">
            Uniswap
          </Badge>
          <Badge variant="secondary" className="text-xs">
            1inch
          </Badge>
          <Badge variant="secondary" className="text-xs">
            0x
          </Badge>
        </div>
      </BottomSheetContent>

      <BottomSheetFooter className="flex gap-3">
        <Button variant="outline" className="flex-1 h-13 text-base font-medium" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          className={`flex-1 h-13 text-base font-semibold bg-gradient-to-r ${chain.color} text-white hover:opacity-90`}
          onClick={() => {
            emitClick('ui:swap:submit')
            handleSwap()
          }}
          disabled={
            !fromAmount ||
            !toToken ||
            parseFloat(fromAmount) <= 0 ||
            parseFloat(fromAmount) > parseFloat(wallet.balance)
          }
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          Swap
        </Button>
      </BottomSheetFooter>
    </BottomSheet>
  )
}
