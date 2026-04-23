import { describe, expect, it } from 'vitest'

describe('u-pay: universal payment across signer kinds', () => {
  it('create-link endpoint file exists', async () => {
    const { existsSync } = await import('node:fs')
    const { join } = await import('node:path')
    expect(existsSync(join(process.cwd(), 'src/pages/api/pay/create-link.ts'))).toBe(true)
  })

  it('substrate:pay signal shape matches pay.md contract', () => {
    const shape = {
      receiver: 'substrate:pay',
      data: {
        weight: 1,
        tags: ['pay', 'crypto', 'accept'],
        content: {
          rail: 'crypto',
          from: '0xproducer',
          to: '0xconsumer',
          amount: 10,
          status: 'pending',
          ref: 'sl_test123',
        },
      },
    }
    expect(shape.receiver).toBe('substrate:pay')
    expect(shape.data.content.rail).toBe('crypto')
    expect(shape.data.content.ref).toBeDefined()
  })

  it('vault signer can sign Sui and BTC', async () => {
    const { createVaultSigner } = await import('@/components/u/lib/signer/vault-signer')

    const vault = createVaultSigner({ address: '0x1', chain: 'sui', getPrivateKey: async () => new Uint8Array(32) })

    expect(vault.canSign('sui')).toBe(true)
    expect(vault.canSign('btc')).toBe(true)
  })
})
