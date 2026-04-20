import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()

describe('u-chain: SUI integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('getBalance returns a balance for sui', async () => {
    // SUI balance RPC then CoinGecko price
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { totalBalance: '5000000000' }, // 5 SUI in MIST
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sui: { usd: 2.5 } }),
      })

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('0xtest-sui-address', 'sui')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('balance')
    expect(result).toHaveProperty('usdValue')
    expect(typeof result.balance).toBe('string')
    expect(typeof result.usdValue).toBe('number')
    // 5000000000 MIST / 1e9 = 5 SUI
    expect(parseFloat(result.balance)).toBeCloseTo(5, 4)
  })

  it('getBalance falls back gracefully on RPC error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('0xtest-sui-address', 'sui')

    expect(result).toEqual({ balance: '0', usdValue: 0 })
  })

  it('getTransactions returns an array for sui', async () => {
    const txFixture = {
      digest: 'Cx7abcdef',
      transaction: { data: { sender: '0xtest-sui-address' } },
      effects: { status: { status: 'success' } },
      timestampMs: '1700000000000',
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: { data: [txFixture] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 2, result: { data: [] } }),
      })

    const { getTransactions } = await import('@/components/u/lib/BlockchainService')
    const result = await getTransactions('0xtest-sui-address', 'sui')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('hash')
    expect(result[0]).toHaveProperty('chain', 'sui')
    expect(result[0]).toHaveProperty('status', 'confirmed')
  })

  it('CHAINS.sui has correct config shape', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    expect(CHAINS.sui).toBeDefined()
    expect(CHAINS.sui.id).toBe('sui')
    expect(CHAINS.sui.symbol).toBe('SUI')
    expect(CHAINS.sui.decimals).toBe(9)
    expect(CHAINS.sui.rpc).toContain('sui.io')
  })
})
