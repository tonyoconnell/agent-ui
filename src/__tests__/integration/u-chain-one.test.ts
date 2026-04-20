import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()

describe('u-chain: ONE integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('CHAINS.one config exists with correct shape', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    expect(CHAINS.one).toBeDefined()
    expect(CHAINS.one.id).toBe('one')
    expect(CHAINS.one.symbol).toBe('ONE')
    expect(CHAINS.one.name).toBe('ONEIE')
    expect(CHAINS.one.decimals).toBe(18)
    // ONE uses ETH infrastructure until native chain
    expect(CHAINS.one.rpc).toContain('llamarpc.com')
  })

  it('getBalance returns a defined result for one (falls through to default)', async () => {
    // ONE has no dedicated handler in getBalance — falls to default { balance: '0', usdValue: 0 }
    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('0xtest-one-address', 'one')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('balance')
    expect(result).toHaveProperty('usdValue')
    // Default path
    expect(result.balance).toBe('0')
    expect(result.usdValue).toBe(0)
  })

  it('getBalance does not call fetch for one (no RPC handler)', async () => {
    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    await getBalance('0xtest-one-address', 'one')

    // No fetch calls expected since ONE falls to default return immediately
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('getTokenPrice returns 0 for one (no coingeckoId)', async () => {
    // ONE has no coingeckoId in CHAINS config — returns 0 without fetch
    const { getTokenPrice } = await import('@/components/u/lib/BlockchainService')
    const price = await getTokenPrice('one')

    expect(price).toBe(0)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('getTransactions returns empty array for one (no dedicated handler)', async () => {
    const { getTransactions } = await import('@/components/u/lib/BlockchainService')
    const result = await getTransactions('0xtest-one-address', 'one')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  it('getChain resolves one correctly and is case-insensitive', async () => {
    const { getChain } = await import('@/components/u/lib/BlockchainService')

    const chain = getChain('one')
    expect(chain.id).toBe('one')
    expect(chain.name).toBe('ONEIE')

    const chainUpper = getChain('ONE')
    expect(chainUpper.id).toBe('one')
  })

  it('getChain falls back to eth for unknown chain ids', async () => {
    const { getChain } = await import('@/components/u/lib/BlockchainService')

    const chain = getChain('unknown-chain-xyz')
    expect(chain.id).toBe('eth')
  })

  it('one explorer URLs use etherscan infrastructure', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    const addrUrl = CHAINS.one.explorerAddress('0xtest')
    const txUrl = CHAINS.one.explorerTx('0xtxhash')

    expect(addrUrl).toContain('etherscan.io')
    expect(txUrl).toContain('etherscan.io')
  })
})
