import { describe, expect, it } from 'vitest'

describe('u-signer: interface conformance', () => {
  it('signer/index.ts exports required symbols', async () => {
    // The signer module should be createable after C3 lands
    // Structural test: verify the barrel exports exist
    const signerModule = await import('@/components/u/lib/signer/index')
    expect(typeof signerModule.resolveSigner).toBe('function')
    expect(typeof signerModule.createVaultSigner).toBe('function')
    expect(typeof signerModule.useSigner).toBe('function')
  })

  it('resolveSigner returns null when no session/vault/dappkit', async () => {
    const { resolveSigner } = await import('@/components/u/lib/signer/resolve')
    const signer = resolveSigner(null, null, null)
    expect(signer).toBeNull()
  })



  it('createVaultSigner conforms to Signer interface', async () => {
    const { createVaultSigner } = await import('@/components/u/lib/signer/vault-signer')
    const signer = createVaultSigner({
      address: '0xvault-test',
      chain: 'sui',
      getPrivateKey: async () => new Uint8Array(32),
    })
    expect(signer.kind).toBe('vault')
    expect(signer.address).toBe('0xvault-test')
    expect(signer.canSign('sui')).toBe(true)
    expect(signer.canSign('btc')).toBe(true) // vault is multi-chain
    expect(signer.canSign('eth')).toBe(true)
  })

})
