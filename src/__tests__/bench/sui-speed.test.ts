/**
 * Wave 1 — Sui + Bridge speed.
 *
 * Measures everything on the HARDEN cold path that our code contributes:
 * keypair derivation, transaction building, signing, and bridge overhead.
 * Network RPC is stubbed — we measure our substrate layer, not the chain.
 *
 * Records only; verdicts in docs/speed-test.md.
 */

import { Transaction } from '@mysten/sui/transactions'
import { beforeAll, describe, test, vi } from 'vitest'
import { measure, measureSync } from '@/__tests__/helpers/speed'

beforeAll(() => {
  ;(import.meta.env as Record<string, string>).SUI_SEED = Buffer.from(new Uint8Array(32).fill(7)).toString('base64')
})

describe('system speed — sui identity + signing', () => {
  test('deriveKeypair() per call', async () => {
    vi.resetModules()
    const { deriveKeypair } = await import('@/lib/sui')
    await measure('sui:keypair:derive', () => deriveKeypair(`unit-${Math.random()}`), 100)
  })

  test('platformKeypair() memoized', async () => {
    vi.resetModules()
    const { platformKeypair } = await import('@/lib/sui')
    await platformKeypair() // prime
    await measure('sui:keypair:platform', () => platformKeypair(), 1_000)
  })

  test('Transaction build (empty)', () => {
    measureSync('sui:tx:build', () => new Transaction(), 5_000)
  })

  test('Transaction with one moveCall', () => {
    measureSync(
      'sui:tx:build:movecall',
      () => {
        const tx = new Transaction()
        tx.moveCall({
          target: '0x2::coin::value',
          arguments: [tx.pure.u64(1)],
        })
        return tx
      },
      1_000,
    )
  })

  test('sign bytes with derived keypair (Ed25519)', async () => {
    vi.resetModules()
    const { deriveKeypair } = await import('@/lib/sui')
    const kp = await deriveKeypair('signer')
    // tx.build() needs real RPC; measure raw Ed25519 sign —
    // that's what Sui wraps when actually sending transactions.
    const bytes = new Uint8Array(256)
    await measure('sui:sign', () => kp.signTransaction(bytes), 200)
  })
})

describe('system speed — bridge (TypeDB ↔ Sui)', () => {
  // Bridge functions hit both TypeDB and Sui RPC. We stub both and measure
  // only the substrate-side cost of building + dispatching the calls.

  test('bridge:mirror:unit (stubbed RPC)', async () => {
    vi.doMock('@/lib/typedb', () => ({
      read: async () => ({ data: [] }),
      readParsed: async () => [],
      write: async () => ({ ok: true }),
      writeSilent: () => {},
      callFunction: async () => [],
    }))
    vi.doMock('@/lib/sui', async () => {
      const actual = await vi.importActual<typeof import('@/lib/sui')>('@/lib/sui')
      return {
        ...actual,
        createUnit: async () => ({ unitId: '0xfake', digest: 'dig' }),
        ensureFunded: async () => {},
        addressFor: async () => '0xaddr',
      }
    })
    const { mirrorActor } = await import('@/engine/bridge')
    await measure('bridge:mirror:unit', () => mirrorActor('bench:unit', 'Bench'), 20)
    vi.doUnmock('@/lib/typedb')
    vi.doUnmock('@/lib/sui')
  })

  test('bridge:mirror:mark (stubbed RPC)', async () => {
    vi.resetModules()
    vi.doMock('@/lib/typedb', () => ({
      readParsed: async () => [],
      writeSilent: () => {},
    }))
    vi.doMock('@/lib/sui', () => ({
      mark: async () => ({ digest: 'dig' }),
    }))
    const { mirrorMark } = await import('@/engine/bridge')
    await measure('bridge:mirror:mark', () => mirrorMark('a', 'b', 1), 50)
    vi.doUnmock('@/lib/typedb')
    vi.doUnmock('@/lib/sui')
  })
})
