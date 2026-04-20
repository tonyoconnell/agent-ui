import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()

describe('u-chain: SOL integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('getBalance returns a balance for sol', async () => {
    // SOL: Solana RPC then CoinGecko price
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { context: { slot: 1 }, value: 5000000000 }, // 5 SOL in lamports
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ solana: { usd: 150 } }),
      })

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('testSolAddress123', 'sol')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('balance')
    expect(result).toHaveProperty('usdValue')
    expect(typeof result.balance).toBe('string')
    expect(typeof result.usdValue).toBe('number')
    // 5000000000 lamports / 1e9 = 5 SOL
    expect(parseFloat(result.balance)).toBeCloseTo(5, 4)
    expect(result.usdValue).toBeCloseTo(750, 0)
  })

  it('getBalance handles missing result value gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { context: { slot: 1 }, value: null },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ solana: { usd: 150 } }),
      })

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('testSolAddress123', 'sol')

    expect(parseFloat(result.balance)).toBe(0)
    expect(result.usdValue).toBe(0)
  })

  it('getBalance falls back gracefully on RPC error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('solana rpc error'))

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('testSolAddress123', 'sol')

    expect(result).toHaveProperty('balance')
    expect(result.usdValue).toBe(0)
  })

  it('getTransactions returns an array for sol', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: [
          { signature: 'sig1abc', blockTime: 1700000000, err: null },
          { signature: 'sig2def', blockTime: 1699999000, err: { InstructionError: [0, 'Custom'] } },
        ],
      }),
    })

    const { getTransactions } = await import('@/components/u/lib/BlockchainService')
    const result = await getTransactions('testSolAddress123', 'sol')

    expect(Array.isArray(result)).toBe(true)
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('hash', 'sig1abc')
      expect(result[0]).toHaveProperty('chain', 'sol')
      expect(result[0]).toHaveProperty('status', 'confirmed')
      // Solana doesn't distinguish send/receive — type is 'interact'
      expect(result[0]).toHaveProperty('type', 'interact')
    }
    if (result.length > 1) {
      expect(result[1]).toHaveProperty('status', 'failed')
    }
  })

  it('CHAINS.sol has correct config shape', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    expect(CHAINS.sol).toBeDefined()
    expect(CHAINS.sol.id).toBe('sol')
    expect(CHAINS.sol.symbol).toBe('SOL')
    expect(CHAINS.sol.decimals).toBe(9)
    expect(CHAINS.sol.rpc).toContain('solana.com')
  })
})
