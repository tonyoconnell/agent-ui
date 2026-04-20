// src/__tests__/integration/u-vault-non-extractable.test.ts
import { describe, expect, it } from 'vitest'
import { deriveKeyFromPassword, importMasterSecret, randomBytes, SALT_LENGTH } from '@/components/u/lib/vault/crypto'

describe('u-vault: masterKey is non-extractable', () => {
  it('PBKDF2-derived key is marked non-extractable', async () => {
    const password = 'test-password-123'
    const salt = randomBytes(SALT_LENGTH)

    const key = await deriveKeyFromPassword(password, salt)

    // Non-extractable key should throw on exportKey
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow()
  })

  it('PBKDF2-derived key cannot be exported in jwk format', async () => {
    const password = 'test-password-456'
    const salt = randomBytes(SALT_LENGTH)

    const key = await deriveKeyFromPassword(password, salt)

    await expect(crypto.subtle.exportKey('jwk', key)).rejects.toThrow()
  })

  it('importMasterSecret key is non-extractable', async () => {
    const secret = randomBytes(32)
    const masterKey = await importMasterSecret(secret)

    // HKDF keys are non-extractable by spec — cannot export as raw
    await expect(crypto.subtle.exportKey('raw', masterKey)).rejects.toThrow()
  })

  it('importMasterSecret key has HKDF algorithm', async () => {
    const secret = randomBytes(32)
    const masterKey = await importMasterSecret(secret)

    // CryptoKey.algorithm.name should be HKDF
    expect(masterKey.algorithm.name).toBe('HKDF')
    expect(masterKey.extractable).toBe(false)
  })
})
