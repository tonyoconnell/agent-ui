// src/__tests__/integration/u-vault-cross-domain.test.ts
import { describe, expect, it } from 'vitest'
import {
  decryptWithKey,
  deriveSubKey,
  encryptWithKey,
  importMasterSecret,
  randomBytes,
} from '@/components/u/lib/vault/crypto'
import { HKDF_DOMAINS } from '@/components/u/lib/vault/types'

describe('u-vault: HKDF domain isolation prevents cross-wallet decryption', () => {
  it('wallet-A subkey cannot decrypt wallet-B record', async () => {
    const masterSecret = randomBytes(32)
    const masterKey = await importMasterSecret(masterSecret)

    // Derive two different wallet subkeys using canonical domain strings
    const walletAId = 'wallet-aaa-111'
    const walletBId = 'wallet-bbb-222'

    const domainA = HKDF_DOMAINS.walletPrivateKey(walletAId)
    const domainB = HKDF_DOMAINS.walletPrivateKey(walletBId)

    expect(domainA).not.toBe(domainB)

    const keyA = await deriveSubKey(masterKey, domainA)
    const keyB = await deriveSubKey(masterKey, domainB)

    // Encrypt data with key A
    const plaintext = new TextEncoder().encode('secret-private-key-data')
    const record = await encryptWithKey(plaintext, keyA, domainA)

    // Decrypt with key B should fail (different domain → different subkey)
    await expect(decryptWithKey(record, keyB)).rejects.toThrow()
  })

  it('mnemonic and privateKey domains produce different subkeys for same wallet', async () => {
    const masterSecret = randomBytes(32)
    const masterKey = await importMasterSecret(masterSecret)

    const walletId = 'wallet-test-xyz'
    const mnemonicKey = await deriveSubKey(masterKey, HKDF_DOMAINS.walletMnemonic(walletId))
    const pkKey = await deriveSubKey(masterKey, HKDF_DOMAINS.walletPrivateKey(walletId))

    // Encrypt under mnemonic key, try decrypt with pk key — should fail
    const plaintext = new TextEncoder().encode('test-mnemonic-data')
    const record = await encryptWithKey(plaintext, mnemonicKey, HKDF_DOMAINS.walletMnemonic(walletId))

    await expect(decryptWithKey(record, pkKey)).rejects.toThrow()
  })

  it('same domain + same master key decrypts successfully', async () => {
    const masterSecret = randomBytes(32)
    const masterKey = await importMasterSecret(masterSecret)

    const walletId = 'wallet-roundtrip-test'
    const domain = HKDF_DOMAINS.walletPrivateKey(walletId)

    const keyEnc = await deriveSubKey(masterKey, domain)
    const keyDec = await deriveSubKey(masterKey, domain)

    const plaintext = new TextEncoder().encode('roundtrip-data')
    const record = await encryptWithKey(plaintext, keyEnc, domain)
    const decrypted = await decryptWithKey(record, keyDec)

    expect(decrypted).toEqual(plaintext)
  })
})
