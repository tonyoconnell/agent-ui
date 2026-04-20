// src/__tests__/integration/u-vault-auto-lock.test.ts
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('u-vault: auto-lock on idle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('setAutoLockMs is exported from vault', async () => {
    const vaultModule = await import('@/components/u/lib/vault/vault')
    expect(typeof vaultModule.setAutoLockMs).toBe('function')
  })

  it('setLockOnTabClose is exported from vault', async () => {
    const vaultModule = await import('@/components/u/lib/vault/vault')
    expect(typeof vaultModule.setLockOnTabClose).toBe('function')
  })

  it('isLocked is exported and returns boolean', async () => {
    const { isLocked } = await import('@/components/u/lib/vault/vault')
    expect(typeof isLocked()).toBe('boolean')
    // Without a session, vault should be locked
    expect(isLocked()).toBe(true)
  })

  it('lock is exported from vault', async () => {
    const vaultModule = await import('@/components/u/lib/vault/vault')
    expect(typeof vaultModule.lock).toBe('function')
  })

  it('lock() is idempotent when already locked', async () => {
    const { lock } = await import('@/components/u/lib/vault/vault')
    // Calling lock when already locked should not throw
    expect(() => lock()).not.toThrow()
    expect(() => lock()).not.toThrow()
  })
})
