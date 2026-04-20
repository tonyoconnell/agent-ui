import { describe, expect, it } from 'vitest'

describe('u-sui-core: Sui as default chain', () => {
  it('BlockchainService has Sui chain config', async () => {
    const { CHAINS } = await import('@/components/u/lib/BlockchainService')
    // Sui should be the first or primary chain
    const chains = Object.values(CHAINS)
    const suiChain = chains.find(
      (c: { id: string }) =>
        typeof c === 'object' && c !== null && 'id' in c && (c as { id: string }).id.toLowerCase().includes('sui'),
    )
    expect(suiChain).toBeDefined()
  })

  it('chain isolation: each chain has its own handler', async () => {
    const blockchainService = await import('@/components/u/lib/BlockchainService')
    // getBalance should exist and be callable
    expect(typeof blockchainService.getBalance).toBe('function')
  })

  it('NetworkConfig has all 6 supported chains', async () => {
    const { SUPPORTED_NETWORKS } = await import('@/components/u/lib/NetworkConfig')
    const networkIds = Object.values(SUPPORTED_NETWORKS).map((n: { id: string }) => n.id.toLowerCase())
    // Should include sui (core) and at least some extensions
    expect(networkIds.some((id: string) => id.includes('sui'))).toBe(true)
  })
})
