// src/__tests__/integration/u-vault-hkdf-unique.test.ts
import { describe, expect, it } from 'vitest'
import { HKDF_DOMAINS } from '@/components/u/lib/vault/types'

describe('u-vault: HKDF info strings are unique', () => {
  it('HKDF_DOMAINS has expected structure', () => {
    expect(HKDF_DOMAINS).toBeDefined()
    expect(typeof HKDF_DOMAINS).toBe('object')
    expect(typeof HKDF_DOMAINS.walletMnemonic).toBe('function')
    expect(typeof HKDF_DOMAINS.walletPrivateKey).toBe('function')
    expect(typeof HKDF_DOMAINS.masterCheck).toBe('function')
    expect(typeof HKDF_DOMAINS.recoveryCheck).toBe('function')
    expect(typeof HKDF_DOMAINS.backupExport).toBe('function')
  })

  it('walletMnemonic and walletPrivateKey produce different domains for same wallet', () => {
    const walletId = 'wallet-test-001'
    const mnemonicDomain = HKDF_DOMAINS.walletMnemonic(walletId)
    const privateDomain = HKDF_DOMAINS.walletPrivateKey(walletId)
    expect(mnemonicDomain).not.toBe(privateDomain)
    expect(mnemonicDomain).toContain(walletId)
    expect(privateDomain).toContain(walletId)
  })

  it('same domain function produces different strings for different wallet IDs', () => {
    const domain1 = HKDF_DOMAINS.walletPrivateKey('wallet-aaa')
    const domain2 = HKDF_DOMAINS.walletPrivateKey('wallet-bbb')
    expect(domain1).not.toBe(domain2)
  })

  it('masterCheck and recoveryCheck are different domains', () => {
    const masterDomain = HKDF_DOMAINS.masterCheck()
    const recoveryDomain = HKDF_DOMAINS.recoveryCheck()
    expect(masterDomain).not.toBe(recoveryDomain)
  })

  it('all fixed domains are unique among themselves', () => {
    const fixed = [HKDF_DOMAINS.masterCheck(), HKDF_DOMAINS.recoveryCheck(), HKDF_DOMAINS.backupExport()]
    const unique = new Set(fixed)
    expect(unique.size).toBe(fixed.length)
  })

  it('domains include the schema version string', () => {
    const domain = HKDF_DOMAINS.masterCheck()
    // Should reference the vault schema version to prevent cross-version decryption
    expect(domain).toMatch(/vault\.v\d+/)
  })
})
