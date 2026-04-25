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

  it('resolveSigner returns null when vault is unavailable', async () => {
    const { resolveSigner } = await import('@/components/u/lib/signer/resolve')
    // Outside a browser the vault module has no IndexedDB; getStatus throws
    // and resolveSigner catches → null.
    const signer = await resolveSigner('sui')
    expect(signer).toBeNull()
  })

  it('createVaultSigner conforms to Signer interface', async () => {
    const { createVaultSigner } = await import('@/components/u/lib/signer/vault-signer')
    const signer = createVaultSigner({
      address: '0xvault-test',
      walletId: 'wallet-test',
      chain: 'sui',
    })
    expect(signer.kind).toBe('vault')
    expect(signer.address).toBe('0xvault-test')
    // Vault signer is sui-only by current design (vault stores Ed25519 secrets);
    // multi-chain support would require per-chain keypair derivation.
    expect(signer.canSign('sui')).toBe(true)
    expect(signer.canSign('btc')).toBe(false)
    expect(signer.canSign('eth')).toBe(false)
  })
})
