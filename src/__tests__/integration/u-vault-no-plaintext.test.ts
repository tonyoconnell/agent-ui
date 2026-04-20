// src/__tests__/integration/u-vault-no-plaintext.test.ts

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('u-vault: no plaintext keys on disk', () => {
  it('storage.ts never calls JSON.stringify with a privateKey field', () => {
    const storageCode = readFileSync(join(process.cwd(), 'src/components/u/lib/vault/storage.ts'), 'utf-8')
    // Should not stringify raw private key strings
    expect(storageCode).not.toMatch(/JSON\.stringify\(.*privateKey/)
    expect(storageCode).not.toMatch(/JSON\.stringify\(.*mnemonic/)
  })

  it('vault.ts never persists session (VaultSession has no IndexedDB write)', () => {
    const vaultCode = readFileSync(join(process.cwd(), 'src/components/u/lib/vault/vault.ts'), 'utf-8')
    // Session should be module-level only, not written to DB
    expect(vaultCode).not.toMatch(/putMeta.*session/)
    expect(vaultCode).not.toMatch(/putWallet.*masterKey/)
  })
})
