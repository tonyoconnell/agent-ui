// src/__tests__/integration/u-vault-migration.test.ts
// Structural tests for the v1 → v2 migration path.
//
// migration.ts and useVault.ts have been removed. Only the fixture-shape tests
// and structural checks on the fixture JSON remain active. The API-surface tests
// that imported from migration.ts are skipped (TODO: migration functions removed).
import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// ---------------------------------------------------------------------------
// Load fixture
// ---------------------------------------------------------------------------
const fixturePath = join(process.cwd(), 'src/__tests__/fixtures/vault-v1.json')
const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8')) as {
  _note: string
  u_wallets: Array<{
    id: string
    chain: string
    address: string
    publicKey?: string
    mnemonic?: string
    balance?: string
    usdValue?: number
    name?: string
  }>
  u_secure_wallets: unknown[]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('u-vault: v1 → v2 migration', () => {
  // --- fixture shape ---

  it('fixture has the _note field marking it as synthetic', () => {
    expect(fixture._note).toBe('test-only-fixture — synthetic mnemonic, no real keys')
  })

  it('fixture u_wallets is an array', () => {
    expect(Array.isArray(fixture.u_wallets)).toBe(true)
    expect(fixture.u_wallets.length).toBeGreaterThan(0)
  })

  it('fixture u_wallets[0] has required LegacyPlainWallet fields', () => {
    const w = fixture.u_wallets[0]
    expect(typeof w.id).toBe('string')
    expect(typeof w.chain).toBe('string')
    expect(typeof w.address).toBe('string')
  })

  it('fixture u_wallets[0] mnemonic is the BIP-39 test phrase', () => {
    expect(fixture.u_wallets[0].mnemonic).toBe(
      'test test test test test test test test test test test test test test test test test test test test test test test sauce',
    )
  })

  it('fixture u_secure_wallets is an empty array (no encrypted wallets in this fixture)', () => {
    expect(Array.isArray(fixture.u_secure_wallets)).toBe(true)
    expect(fixture.u_secure_wallets).toHaveLength(0)
  })

  // --- API surface (skipped: migration.ts removed) ---
  // TODO: migration functions removed — migrateLegacy, hasLegacyData, inspectLegacy,
  // requiresOldPassword, ensureHasLegacy no longer exist. Tests below are disabled.
})
