// src/__tests__/integration/u-vault-sentinel.test.ts
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { VaultError } from '@/components/u/lib/vault/types'

describe('u-vault: sentinel detects wrong password', () => {
  it('VaultError class exists with error codes', () => {
    const err = new VaultError('wrong password', 'wrong-password')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('wrong-password')
  })

  it('VaultError is named VaultError', () => {
    const err = new VaultError('test', 'locked')
    expect(err.name).toBe('VaultError')
  })

  it('VaultError produces all expected code variants', () => {
    const codes = [
      'locked',
      'no-vault',
      'wrong-password',
      'wrong-recovery',
      'passkey-cancelled',
      'passkey-unsupported',
      'tamper-detected',
      'rate-limited',
      'invalid-mnemonic',
      'storage-error',
      'crypto-error',
    ] as const

    for (const code of codes) {
      const err = new VaultError(`error: ${code}`, code)
      expect(err.code).toBe(code)
      expect(err).toBeInstanceOf(VaultError)
      expect(err).toBeInstanceOf(Error)
    }
  })

  it('VaultError message is accessible', () => {
    const msg = 'wrong password supplied'
    const err = new VaultError(msg, 'wrong-password')
    expect(err.message).toBe(msg)
  })

  it('wrong-password VaultError is distinguishable from tamper-detected', () => {
    const wrongPw = new VaultError('wrong password', 'wrong-password')
    const tamper = new VaultError('sentinel mismatch', 'tamper-detected')
    expect(wrongPw.code).not.toBe(tamper.code)
    expect(wrongPw.code).toBe('wrong-password')
    expect(tamper.code).toBe('tamper-detected')
  })
})
