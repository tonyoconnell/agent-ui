// src/__tests__/integration/u-vault-migration.test.ts
// Structural tests for the v1 → v2 migration path.
//
// The vitest environment is 'node' (no jsdom/localStorage). The migration.ts
// code guards every localStorage access with `typeof localStorage === 'undefined'`
// and returns safe defaults in that case. Tests here verify:
//   1. The fixture JSON matches the LegacyPlainWallet / LegacySecureWallet shapes.
//   2. The exported API surface matches what callers expect.
//   3. inspectLegacy() returns empty inventory in Node (no localStorage).
//   4. hasLegacyData() returns false in Node.
//   5. requiresOldPassword() returns false in Node.
//   6. migrateLegacy() returns an empty result (no-op) in Node.
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

  // --- API surface ---

  it('migrateLegacy is an exported function', async () => {
    const { migrateLegacy } = await import('@/components/u/lib/migration')
    expect(typeof migrateLegacy).toBe('function')
  })

  it('requiresOldPassword is an exported function', async () => {
    const { requiresOldPassword } = await import('@/components/u/lib/migration')
    expect(typeof requiresOldPassword).toBe('function')
  })

  it('hasLegacyData is an exported function', async () => {
    const { hasLegacyData } = await import('@/components/u/lib/migration')
    expect(typeof hasLegacyData).toBe('function')
  })

  it('inspectLegacy is an exported function', async () => {
    const { inspectLegacy } = await import('@/components/u/lib/migration')
    expect(typeof inspectLegacy).toBe('function')
  })

  it('ensureHasLegacy is an exported function', async () => {
    const { ensureHasLegacy } = await import('@/components/u/lib/migration')
    expect(typeof ensureHasLegacy).toBe('function')
  })

  // --- Node-environment safe-default behaviour ---
  // migration.ts guards all localStorage reads with typeof === 'undefined'.
  // In Node these return empty/false/zero so callers can safely call them.

  it('inspectLegacy returns empty inventory in Node (no localStorage)', async () => {
    const { inspectLegacy } = await import('@/components/u/lib/migration')
    const inv = inspectLegacy()
    expect(inv.plaintextCount).toBe(0)
    expect(inv.encryptedCount).toBe(0)
    expect(inv.hasOldPasswordCheck).toBe(false)
  })

  it('hasLegacyData returns false in Node', async () => {
    const { hasLegacyData } = await import('@/components/u/lib/migration')
    expect(hasLegacyData()).toBe(false)
  })

  it('requiresOldPassword returns false in Node', async () => {
    const { requiresOldPassword } = await import('@/components/u/lib/migration')
    expect(requiresOldPassword()).toBe(false)
  })

  it('migrateLegacy returns a no-op MigrationResult in Node (localStorage absent)', async () => {
    const { migrateLegacy } = await import('@/components/u/lib/migration')
    // In Node, localStorage is undefined — migrateLegacy returns early with zeros.
    // We pass a dummy CryptoKey-shaped object; it is never used because the function
    // returns before reaching crypto operations.
    const result = await migrateLegacy({} as CryptoKey)
    expect(result.migratedPlaintext).toBe(0)
    expect(result.migratedEncrypted).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  // --- function signature (structural) ---

  it('migrateLegacy takes masterKey as first arg and optional oldPassword as second', async () => {
    const { migrateLegacy } = await import('@/components/u/lib/migration')
    // TypeScript `?` optional compiles to a plain param in JS — Function.length counts it.
    // Only `= default` parameters are excluded. Both params counted → length 2.
    expect(migrateLegacy.length).toBe(2)
  })
})
