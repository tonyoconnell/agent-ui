/**
 * Sui identity determinism — lose the seed, lose all wallets.
 *
 * What we pin:
 *  - addressFor(uid) is deterministic across calls
 *  - deriveKeypair(uid) produces identical keypair across calls
 *  - different UIDs produce different addresses
 *  - missing SUI_SEED throws a clear error (fail-closed)
 *  - address derivation stays inside a reasonable budget (speed recorded)
 *
 * NOT tested here (out of scope, needs network or mock):
 *  - transaction signing against live chain
 *  - faucet interactions
 */
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { measure } from '@/__tests__/helpers/speed'

const TEST_SEED = Buffer.from(new Uint8Array(32).fill(7)).toString('base64')

beforeAll(() => {
  // Populate SUI_SEED for import.meta.env — vitest exposes it via vite.
  // deriveKeypair reads import.meta.env.SUI_SEED at call time.
  ;(import.meta.env as Record<string, string>).SUI_SEED = TEST_SEED
})

afterAll(() => {
  delete (import.meta.env as Record<string, string>).SUI_SEED
})

describe('Sui identity — determinism', () => {
  test('addressFor(uid) is deterministic', async () => {
    const { addressFor } = await import('./sui')
    const a = await addressFor('marketing:creative')
    const b = await addressFor('marketing:creative')
    expect(a).toBe(b)
    expect(a).toMatch(/^0x[0-9a-f]+$/)
  })

  test('deriveKeypair(uid) produces identical public key across calls', async () => {
    const { deriveKeypair } = await import('./sui')
    const k1 = await deriveKeypair('donal:cmo')
    const k2 = await deriveKeypair('donal:cmo')
    expect(k1.getPublicKey().toSuiAddress()).toBe(k2.getPublicKey().toSuiAddress())
  })

  test('different UIDs produce different addresses', async () => {
    const { addressFor } = await import('./sui')
    const a = await addressFor('unit:a')
    const b = await addressFor('unit:b')
    expect(a).not.toBe(b)
  })

  test('platformKeypair uses __platform__ as its UID (stable)', async () => {
    const { platformKeypair, addressFor } = await import('./sui')
    const kp = await platformKeypair()
    const viaAddressFor = await addressFor('__platform__')
    expect(kp.getPublicKey().toSuiAddress()).toBe(viaAddressFor)
  })
})

describe('Sui identity — fail-closed', () => {
  test('missing SUI_SEED throws a clear error', async () => {
    // sui.ts captures SEED_B64 at module load, so resetModules + re-import.
    const prev = (import.meta.env as Record<string, string>).SUI_SEED
    ;(import.meta.env as Record<string, string>).SUI_SEED = ''
    vi.resetModules()
    const { deriveKeypair } = await import('./sui')
    await expect(deriveKeypair('x')).rejects.toThrow(/SUI_SEED/)
    ;(import.meta.env as Record<string, string>).SUI_SEED = prev
    vi.resetModules()
  })
})

describe('Sui identity — speed (recorded, not gated)', () => {
  test('addressFor sample recorded to speed.ndjson', async () => {
    const { addressFor } = await import('./sui')
    // Measurement only — the System Speed Report judges pass/fail against
    // budget. Absolute-threshold gating flakes under concurrent suite load.
    await measure('sui:address:derive', () => addressFor('bench:unit'), 100)
  })
})
