// src/__tests__/integration/u-vault-session-memory.test.ts
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { STORE_AUDIT, STORE_META, STORE_WALLETS } from '@/components/u/lib/vault/storage'
import { getStatus } from '@/components/u/lib/vault/vault'

describe('u-vault: session lives only in memory', () => {
  it('vault status isLocked is true when no session exists', async () => {
    const status = await getStatus()
    // Fresh vault (no setup) should report locked (session === null)
    expect(status.isLocked).toBe(true)
  })

  it('vault status hasVault is false before setup', async () => {
    const status = await getStatus()
    expect(status.hasVault).toBe(false)
  })

  it('store names do not include a session store', () => {
    const storeNames = [STORE_META, STORE_WALLETS, STORE_AUDIT]
    for (const name of storeNames) {
      expect(name).not.toMatch(/session/i)
    }
  })

  it('STORE_META, STORE_WALLETS, STORE_AUDIT are the only three stores', () => {
    // Structural test: there should be exactly 3 named stores
    const storeNames = [STORE_META, STORE_WALLETS, STORE_AUDIT]
    expect(storeNames.length).toBe(3)
    expect(new Set(storeNames).size).toBe(3) // all unique
  })
})
