/**
 * useCurrencyConversion - Real-time currency price conversion
 *
 * Fetches live prices from CoinGecko API and provides conversion
 * utilities for crypto to fiat currencies.
 *
 * Features:
 * - Real-time price updates every 10 seconds
 * - Support for multiple tokens (ETH, BTC, SOL, SUI, USDC, ONE)
 * - Multiple fiat currencies (USD, EUR, GBP, etc.)
 * - Caching with automatic invalidation
 * - Error handling with fallback values
 */

import { useCallback, useEffect, useState } from 'react'

interface ConversionRates {
  [tokenSymbol: string]: {
    [currency: string]: number
  }
}

const COINGECKO_PRICE_ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price'

// Map token symbols to CoinGecko IDs
const TOKEN_COINGECKO_MAP: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  SOL: 'solana',
  SUI: 'sui',
  USDC: 'usd-coin',
  ONE: 'one-inch-governance-token', // Adjust if needed
}

const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy', 'aud', 'cad']

interface UseCurrencyConversionReturn {
  prices: ConversionRates
  isLoading: boolean
  error: string | null
  getRate: (tokenSymbol: string, currency?: string) => number
  convertToFiat: (tokenSymbol: string, amount: number, currency?: string) => number
  convert24hChange: (tokenSymbol: string) => number
  formatPrice: (tokenSymbol: string, amount: number, currency?: string) => string
}

export function useCurrencyConversion(): UseCurrencyConversionReturn {
  const [prices, setPrices] = useState<ConversionRates>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const tokenIds = Object.values(TOKEN_COINGECKO_MAP).join(',')
      const currencies = SUPPORTED_CURRENCIES.join(',')

      const params = new URLSearchParams({
        ids: tokenIds,
        vs_currencies: currencies,
        include_market_cap: 'true',
        include_24hr_vol: 'true',
        include_24hr_change: 'true',
      })

      const response = await fetch(`${COINGECKO_PRICE_ENDPOINT}?${params}`, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`)
      }

      type CoinGeckoQuote = {
        usd?: number
        eur?: number
        gbp?: number
        jpy?: number
        aud?: number
        cad?: number
        usd_24h_change?: number
      }
      const data = (await response.json()) as Record<string, CoinGeckoQuote>

      // Transform CoinGecko response to our format
      const rates: ConversionRates = {}

      Object.entries(TOKEN_COINGECKO_MAP).forEach(([symbol, coingeckoId]) => {
        if (data[coingeckoId]) {
          rates[symbol] = {
            usd: data[coingeckoId].usd ?? 0,
            eur: data[coingeckoId].eur ?? 0,
            gbp: data[coingeckoId].gbp ?? 0,
            jpy: data[coingeckoId].jpy ?? 0,
            aud: data[coingeckoId].aud ?? 0,
            cad: data[coingeckoId].cad ?? 0,
            change_24h: data[coingeckoId].usd_24h_change ?? 0,
          }
        }
      })

      setPrices(rates)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch prices'
      setError(message)
      console.error('Currency conversion error:', message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch prices on mount
  useEffect(() => {
    fetchPrices()

    // Set up auto-refresh every 10 seconds
    const interval = setInterval(fetchPrices, 10000)

    return () => clearInterval(interval)
  }, [fetchPrices])

  const getRate = useCallback(
    (tokenSymbol: string, currency: string = 'usd'): number => {
      return prices[tokenSymbol]?.[currency] ?? 0
    },
    [prices],
  )

  const convertToFiat = useCallback(
    (tokenSymbol: string, amount: number, currency: string = 'usd'): number => {
      const rate = getRate(tokenSymbol, currency)
      return amount * rate
    },
    [getRate],
  )

  const convert24hChange = useCallback(
    (tokenSymbol: string): number => {
      return prices[tokenSymbol]?.change_24h ?? 0
    },
    [prices],
  )

  const formatPrice = useCallback(
    (tokenSymbol: string, amount: number, currency: string = 'usd'): string => {
      const fiatAmount = convertToFiat(tokenSymbol, amount, currency)
      const currencySymbol = getCurrencySymbol(currency)

      if (fiatAmount >= 1000000) {
        return `${currencySymbol}${(fiatAmount / 1000000).toFixed(2)}M`
      } else if (fiatAmount >= 1000) {
        return `${currencySymbol}${(fiatAmount / 1000).toFixed(2)}K`
      } else {
        return `${currencySymbol}${fiatAmount.toFixed(2)}`
      }
    },
    [convertToFiat],
  )

  return {
    prices,
    isLoading,
    error,
    getRate,
    convertToFiat,
    convert24hChange,
    formatPrice,
  }
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    jpy: '¥',
    aud: 'A$',
    cad: 'C$',
  }
  return symbols[currency.toLowerCase()] ?? '$'
}

/**
 * Format a price with proper currency symbol and decimal places
 */
export function formatCurrency(amount: number, currency: string = 'usd'): string {
  const currencySymbol = getCurrencySymbol(currency)
  return `${currencySymbol}${amount.toFixed(2)}`
}

/**
 * Format percentage change with color indication
 */
export function formatPriceChange(change: number): {
  text: string
  color: string
  icon: string
} {
  const isPositive = change > 0
  const icon = isPositive ? '📈' : '📉'
  const color = isPositive ? 'text-green-600' : 'text-red-600'
  const text = `${isPositive ? '+' : ''}${change.toFixed(2)}%`

  return { text, color, icon }
}
