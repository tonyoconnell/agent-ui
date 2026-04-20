// src/__tests__/integration/u-vault-recovery-roundtrip.test.ts
import { describe, expect, it } from 'vitest'
import { generateRecoveryPhrase, isValidRecoveryPhrase, recoveryToVaultSecret } from '@/components/u/lib/vault/recovery'

describe('u-vault: recovery phrase round-trip', () => {
  it('generates a valid 24-word BIP-39 phrase', async () => {
    const phrase = generateRecoveryPhrase()
    const words = phrase.trim().split(/\s+/)
    expect(words.length).toBe(24)
    expect(isValidRecoveryPhrase(phrase)).toBe(true)
  })

  it('same phrase always produces same vault secret', async () => {
    const phrase = generateRecoveryPhrase()
    const secret1 = await recoveryToVaultSecret(phrase)
    const secret2 = await recoveryToVaultSecret(phrase)

    // Both should produce identical 32-byte arrays
    expect(secret1.length).toBe(32)
    expect(secret2.length).toBe(32)
    expect(secret1.length).toBe(secret2.length)

    let equal = true
    for (let i = 0; i < secret1.length; i++) {
      if (secret1[i] !== secret2[i]) {
        equal = false
        break
      }
    }
    expect(equal).toBe(true)
  })

  it('different phrases produce different secrets', async () => {
    const phrase1 = generateRecoveryPhrase()
    const phrase2 = generateRecoveryPhrase()

    // Extremely unlikely to be the same, but test the mechanism
    if (phrase1 === phrase2) return // astronomically unlikely but skip if equal

    const secret1 = await recoveryToVaultSecret(phrase1)
    const secret2 = await recoveryToVaultSecret(phrase2)

    let allSame = true
    for (let i = 0; i < secret1.length; i++) {
      if (secret1[i] !== secret2[i]) {
        allSame = false
        break
      }
    }
    expect(allSame).toBe(false)
  })

  it('vault secret is exactly 32 bytes', async () => {
    const phrase = generateRecoveryPhrase()
    const secret = await recoveryToVaultSecret(phrase)
    expect(secret.length).toBe(32)
    expect(secret).toBeInstanceOf(Uint8Array)
  })

  it('invalid phrase throws VaultError', async () => {
    const { VaultError } = await import('@/components/u/lib/vault/types')
    await expect(recoveryToVaultSecret('invalid phrase')).rejects.toBeInstanceOf(VaultError)
  })
})
