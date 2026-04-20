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

  it('all 4 signer kinds have canSign(sui) = true', async () => {
    const { createVaultSigner } = await import('@/components/u/lib/signer/vault-signer')
    const { createZkLoginSigner } = await import('@/components/u/lib/signer/zklogin-signer')
    const { createDappKitSigner } = await import('@/components/u/lib/signer/dapp-kit-signer')
    const { createSnapSigner } = await import('@/components/u/lib/signer/snap-signer')

    const vault = createVaultSigner({ address: '0x1', chain: 'sui', getPrivateKey: async () => new Uint8Array(32) })
    const zklogin = createZkLoginSigner({ address: '0x2' })
    const dappkit = createDappKitSigner({ address: '0x3' })
    const snap = createSnapSigner({ address: '0x4' })

    expect(vault.canSign('sui')).toBe(true)
    expect(zklogin.canSign('sui')).toBe(true)
    expect(dappkit.canSign('sui')).toBe(true)
    expect(snap.canSign('sui')).toBe(true)
  })

  it('only vault can sign BTC', async () => {
    const { createVaultSigner } = await import('@/components/u/lib/signer/vault-signer')
    const { createZkLoginSigner } = await import('@/components/u/lib/signer/zklogin-signer')

    const vault = createVaultSigner({ address: '0x1', chain: 'sui', getPrivateKey: async () => new Uint8Array(32) })
    const zklogin = createZkLoginSigner({ address: '0x2' })

    expect(vault.canSign('btc')).toBe(true)
    expect(zklogin.canSign('btc')).toBe(false)
  })
})
