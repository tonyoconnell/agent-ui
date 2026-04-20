import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()

describe('u-chain: ETH integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('getBalance returns a balance for eth via Etherscan', async () => {
    // ETH: Etherscan balance then CoinGecko price
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: '1',
          result: '1500000000000000000', // 1.5 ETH in wei
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: 3000 } }),
      })

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('0xtest-eth-address', 'eth')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('balance')
    expect(result).toHaveProperty('usdValue')
    expect(typeof result.balance).toBe('string')
    expect(typeof result.usdValue).toBe('number')
    // 1.5 ETH
    expect(parseFloat(result.balance)).toBeCloseTo(1.5, 4)
  })

  it('getBalance falls back to RPC when Etherscan fails', async () => {
    // First call (Etherscan) fails, second call (RPC) succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Etherscan unavailable'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: '0x16345785d8a0000', // 0.1 ETH in hex
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ethereum: { usd: 3000 } }),
      })

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('0xtest-eth-address', 'eth')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('balance')
    expect(result).toHaveProperty('usdValue')
  })

  it('getBalance falls back gracefully on total RPC error', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('0xtest-eth-address', 'eth')

    expect(result).toHaveProperty('balance')
    expect(result.usdValue).toBe(0)
  })

  it('getTransactions returns an array for eth', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: '1',
        result: [
          {
            hash: '0xabc123',
            from: '0xtest-eth-address',
            to: '0xother',
            value: '1000000000000000000',
            timeStamp: '1700000000',
            gasUsed: '21000',
            gasPrice: '20000000000',
            txreceipt_status: '1',
          },
        ],
      }),
    })

    const { getTransactions } = await import('@/components/u/lib/BlockchainService')
    const result = await getTransactions('0xtest-eth-address', 'eth')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('hash', '0xabc123')
    expect(result[0]).toHaveProperty('chain', 'eth')
    expect(result[0]).toHaveProperty('status', 'confirmed')
    expect(result[0]).toHaveProperty('type', 'send')
  })

  it('CHAINS.eth has correct config shape', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    expect(CHAINS.eth).toBeDefined()
    expect(CHAINS.eth.id).toBe('eth')
    expect(CHAINS.eth.symbol).toBe('ETH')
    expect(CHAINS.eth.decimals).toBe(18)
    expect(CHAINS.eth.rpc).toContain('llamarpc.com')
  })
})
