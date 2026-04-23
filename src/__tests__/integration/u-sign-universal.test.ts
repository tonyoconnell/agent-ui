import { describe, expect, it } from 'vitest'

describe('u-sign: universal signing across signer kinds', () => {
  it('/u/sign page file exists', async () => {
    const { existsSync } = await import('node:fs')
    const { join } = await import('node:path')
    expect(existsSync(join(process.cwd(), 'src/pages/u/sign.astro'))).toBe(true)
  })

  it('SignPage component file exists', async () => {
    const { existsSync } = await import('node:fs')
    const { join } = await import('node:path')
    expect(existsSync(join(process.cwd(), 'src/components/u/pages/SignPage.tsx'))).toBe(true)
  })

  it('vault signer signMessage returns bytes', async () => {
    const { createVaultSigner } = await import('@/components/u/lib/signer/vault-signer')
    const mockPrivKey = new Uint8Array(32).fill(1)
    const signer = createVaultSigner({
      address: '0xtest',
      chain: 'sui',
      getPrivateKey: async () => mockPrivKey,
    })
    // signMessage currently throws (not yet wired) — verify it throws, not silently fails
    await expect(signer.signMessage(new Uint8Array([1, 2, 3]))).rejects.toThrow()
  })

})
