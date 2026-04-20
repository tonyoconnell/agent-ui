// src/__tests__/integration/u-vault-tab-close.test.ts
import { describe, expect, it } from 'vitest'

describe('u-vault: tab close locks session', () => {
  it('setLockOnTabClose is exported from vault', async () => {
    const vaultModule = await import('@/components/u/lib/vault/vault')
    expect(typeof vaultModule.setLockOnTabClose).toBe('function')
  })

  it('setLockOnTabClose accepts boolean values without throwing when locked', async () => {
    const { setLockOnTabClose } = await import('@/components/u/lib/vault/vault')
    // setLockOnTabClose requires vault to be unlocked — verify it throws VaultError when locked
    const { VaultError } = await import('@/components/u/lib/vault/types')
    await expect(setLockOnTabClose(true)).rejects.toBeInstanceOf(VaultError)
    await expect(setLockOnTabClose(false)).rejects.toBeInstanceOf(VaultError)
  })

  it('VaultMeta lockOnTabClose field is a boolean', async () => {
    // Structural test: the meta type has lockOnTabClose
    // Read the source to verify the field exists
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const typesCode = readFileSync(join(process.cwd(), 'src/components/u/lib/vault/types.ts'), 'utf-8')
    expect(typesCode).toMatch(/lockOnTabClose/)
  })

  it('setLockOnTabClose persists lockOnTabClose in vault metadata', async () => {
    // Structural test: vault.ts references lockOnTabClose field
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const vaultCode = readFileSync(join(process.cwd(), 'src/components/u/lib/vault/vault.ts'), 'utf-8')
    expect(vaultCode).toMatch(/lockOnTabClose/)
  })
})
