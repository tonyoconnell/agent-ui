/**
 * Bridge units — substrate integration tests.
 *
 * Verifies that bridge:evm, bridge:sol, bridge:btc register correctly
 * as substrate units and return schema-valid results. RPC calls are
 * mocked via vi.mock('@/lib/chains') — no live network required.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/chains', () => ({
  getBalance: vi.fn(),
  getTransactions: vi.fn(),
  getTokenPrice: vi.fn(),
  getChain: vi.fn().mockReturnValue({ id: 'eth', name: 'Ethereum', symbol: 'ETH', decimals: 18 }),
  CHAINS: {
    eth: { id: 'eth', name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    sol: { id: 'sol', name: 'Solana', symbol: 'SOL', decimals: 9 },
    btc: { id: 'btc', name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  },
}))

import { getBalance, getTokenPrice, getTransactions } from '@/lib/chains'
import { registerBridges } from './bridges'

// Minimal World stub satisfying the handler interface
function makeWorld() {
  const units: Record<string, Record<string, (data: unknown) => unknown>> = {}

  const unitProxy = (id: string) => {
    units[id] = {}
    const self = {
      on(name: string, fn: (data: unknown) => unknown) {
        units[id][name] = fn
        return self
      },
    }
    return self
  }

  return {
    add: (id: string) => unitProxy(id),
    _units: units,
  }
}

describe('registerBridges', () => {
  let world: ReturnType<typeof makeWorld>

  beforeEach(() => {
    vi.clearAllMocks()
    world = makeWorld()
    registerBridges(world as any)
  })

  it('registers bridge:evm, bridge:sol, bridge:btc units', () => {
    expect(world._units['bridge:evm']).toBeDefined()
    expect(world._units['bridge:sol']).toBeDefined()
    expect(world._units['bridge:btc']).toBeDefined()
  })

  it('does NOT register bridge:sui (Sui is home)', () => {
    expect(world._units['bridge:sui']).toBeUndefined()
  })

  it('each bridge has balance, history, and price handlers', () => {
    for (const bridge of ['bridge:evm', 'bridge:sol', 'bridge:btc']) {
      expect(world._units[bridge].balance).toBeDefined()
      expect(world._units[bridge].history).toBeDefined()
      expect(world._units[bridge].price).toBeDefined()
    }
  })
})

describe('bridge:evm handlers', () => {
  let world: ReturnType<typeof makeWorld>

  beforeEach(() => {
    vi.clearAllMocks()
    world = makeWorld()
    registerBridges(world as any)
  })

  it('balance handler returns BalanceResult on valid address', async () => {
    vi.mocked(getBalance).mockResolvedValue({ balance: '1.5', usdValue: 4200 })
    const result = await world._units['bridge:evm'].balance({ address: '0xabc' })
    expect(result).toEqual({ balance: '1.5', usdValue: 4200 })
    expect(getBalance).toHaveBeenCalledWith('0xabc', 'eth')
  })

  it('balance handler returns null when address is missing', async () => {
    const result = await world._units['bridge:evm'].balance({})
    expect(result).toBeNull()
    expect(getBalance).not.toHaveBeenCalled()
  })

  it('balance handler returns null on RPC error (zero-returns)', async () => {
    vi.mocked(getBalance).mockRejectedValue(new Error('RPC timeout'))
    const result = await world._units['bridge:evm'].balance({ address: '0xabc' })
    expect(result).toBeNull()
  })

  it('history handler returns Transaction[] on valid address', async () => {
    const mockTxs = [{ id: 'tx1', hash: '0xhash', type: 'send', chain: 'eth' }]
    vi.mocked(getTransactions).mockResolvedValue(mockTxs as any)
    const result = await world._units['bridge:evm'].history({ address: '0xabc' })
    expect(result).toEqual(mockTxs)
    expect(getTransactions).toHaveBeenCalledWith('0xabc', 'eth')
  })

  it('history handler returns null when address is missing', async () => {
    const result = await world._units['bridge:evm'].history(null)
    expect(result).toBeNull()
  })

  it('price handler returns { price } from CoinGecko cache', async () => {
    vi.mocked(getTokenPrice).mockResolvedValue(3200.5)
    const result = await world._units['bridge:evm'].price(undefined)
    expect(result).toEqual({ price: 3200.5 })
  })

  it('price handler returns 0 on CoinGecko failure', async () => {
    vi.mocked(getTokenPrice).mockRejectedValue(new Error('CG timeout'))
    const result = await world._units['bridge:evm'].price(undefined)
    expect(result).toEqual({ price: 0 })
  })
})

describe('bridge:sol and bridge:btc routing', () => {
  let world: ReturnType<typeof makeWorld>

  beforeEach(() => {
    vi.clearAllMocks()
    world = makeWorld()
    registerBridges(world as any)
  })

  it('bridge:sol balance calls getBalance with sol chainId', async () => {
    vi.mocked(getBalance).mockResolvedValue({ balance: '10', usdValue: 1400 })
    await world._units['bridge:sol'].balance({ address: 'SolAddr123' })
    expect(getBalance).toHaveBeenCalledWith('SolAddr123', 'sol')
  })

  it('bridge:btc history calls getTransactions with btc chainId', async () => {
    vi.mocked(getTransactions).mockResolvedValue([])
    await world._units['bridge:btc'].history({ address: 'bc1qabc' })
    expect(getTransactions).toHaveBeenCalledWith('bc1qabc', 'btc')
  })
})
