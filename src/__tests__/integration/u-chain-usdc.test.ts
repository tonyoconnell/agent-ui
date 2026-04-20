import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()

describe('u-chain: USDC integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('CHAINS.usdc config exists with correct shape', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    expect(CHAINS.usdc).toBeDefined()
    expect(CHAINS.usdc.id).toBe('usdc')
    expect(CHAINS.usdc.symbol).toBe('USDC')
    expect(CHAINS.usdc.decimals).toBe(6)
    // USDC uses ETH infrastructure
    expect(CHAINS.usdc.rpc).toContain('llamarpc.com')
    expect(CHAINS.usdc.explorer).toContain('etherscan.io')
  })

  it('getBalance returns a defined result for usdc (falls through to default)', async () => {
    // USDC has no dedicated handler in getBalance — falls to default { balance: '0', usdValue: 0 }
    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('0xtest-usdc-address', 'usdc')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('balance')
    expect(result).toHaveProperty('usdValue')
    // Default path: '0' balance
    expect(result.balance).toBe('0')
    expect(result.usdValue).toBe(0)
  })

  it('getTokenPrice returns 1.0 for usdc stablecoin', async () => {
    // USDC has no coingeckoId → stablecoin path returns 1.0 without fetch
    const { getTokenPrice } = await import('@/components/u/lib/BlockchainService')
    const price = await getTokenPrice('usdc')

    expect(price).toBe(1.0)
    // Should not have called fetch for a stablecoin
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('getTransactions returns empty array for usdc (no dedicated handler)', async () => {
    const { getTransactions } = await import('@/components/u/lib/BlockchainService')
    const result = await getTransactions('0xtest-usdc-address', 'usdc')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  it('getChain resolves usdc correctly', async () => {
    const { getChain } = await import('@/components/u/lib/BlockchainService')

    const chain = getChain('usdc')
    expect(chain.id).toBe('usdc')
    expect(chain.name).toBe('USDC')

    // Case-insensitive lookup
    const chainUpper = getChain('USDC')
    expect(chainUpper.id).toBe('usdc')
  })

  it('USDC explorerAddress URL includes tokentxns fragment for token tracking', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    const url = CHAINS.usdc.explorerAddress('0xtest')
    expect(url).toContain('tokentxns')
  })
})
