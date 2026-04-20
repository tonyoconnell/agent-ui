import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()

describe('u-chain: BTC integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('getBalance returns a balance for btc', async () => {
    // BTC: Blockstream address endpoint then CoinGecko price
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chain_stats: {
            funded_txo_sum: 150000000, // 1.5 BTC in sats
            spent_txo_sum: 50000000, // 0.5 BTC spent
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 65000 } }),
      })

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('bc1qtest-btc-address', 'btc')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('balance')
    expect(result).toHaveProperty('usdValue')
    expect(typeof result.balance).toBe('string')
    expect(typeof result.usdValue).toBe('number')
    // (150000000 - 50000000) / 1e8 = 1.0 BTC
    expect(parseFloat(result.balance)).toBeCloseTo(1.0, 4)
    expect(result.usdValue).toBeCloseTo(65000, 0)
  })

  it('getBalance handles zero balance correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chain_stats: {
            funded_txo_sum: 0,
            spent_txo_sum: 0,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 65000 } }),
      })

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('bc1qtest-empty', 'btc')

    expect(result.balance).toBe('0.00000000')
    expect(result.usdValue).toBe(0)
  })

  it('getBalance falls back gracefully on Blockstream error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('blockstream unavailable'))

    const { getBalance } = await import('@/components/u/lib/BlockchainService')
    const result = await getBalance('bc1qtest-btc-address', 'btc')

    expect(result).toHaveProperty('balance')
    expect(result.usdValue).toBe(0)
  })

  it('getTransactions returns an array for btc', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          txid: 'abc123btc',
          status: { confirmed: true, block_time: 1700000000 },
        },
        {
          txid: 'def456btc',
          status: { confirmed: false },
        },
      ],
    })

    const { getTransactions } = await import('@/components/u/lib/BlockchainService')
    const result = await getTransactions('bc1qtest-btc-address', 'btc')

    expect(Array.isArray(result)).toBe(true)
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('hash', 'abc123btc')
      expect(result[0]).toHaveProperty('chain', 'btc')
      expect(result[0]).toHaveProperty('status', 'confirmed')
    }
    if (result.length > 1) {
      expect(result[1]).toHaveProperty('status', 'pending')
    }
  })

  it('CHAINS.btc has correct config shape', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')

    expect(CHAINS.btc).toBeDefined()
    expect(CHAINS.btc.id).toBe('btc')
    expect(CHAINS.btc.symbol).toBe('BTC')
    expect(CHAINS.btc.decimals).toBe(8)
    expect(CHAINS.btc.rpc).toContain('blockstream.info')
  })
})
