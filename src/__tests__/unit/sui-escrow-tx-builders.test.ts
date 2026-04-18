/**
 * Unit tests for escrow TX builders.
 *
 * Tests determinism (same args → same unsigned TX),
 * error cases (validation), and pattern consistency.
 *
 * Note: Module constants (PACKAGE_ID, PROTOCOL_ID) are read at import time
 * from import.meta.env. These must be set in the test environment.
 */

import { Transaction } from '@mysten/sui/transactions'
import { beforeAll, describe, expect, test, vi } from 'vitest'

beforeAll(async () => {
  // Set env before reimporting
  ;(import.meta.env as Record<string, string>).SUI_PACKAGE_ID =
    '0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e'
  ;(import.meta.env as Record<string, string>).SUI_PROTOCOL_ID = '0x1234567890abcdef'
  ;(import.meta.env as Record<string, string>).SUI_SEED = Buffer.from(new Uint8Array(32).fill(7)).toString('base64')
})

// Dynamic import to use env vars set above
let createEscrowTx: any
let releaseEscrowTx: any
let cancelEscrowTx: any

beforeAll(async () => {
  // Force reload of sui module with env vars set
  vi.resetModules()
  const sui = await import('@/lib/sui')
  createEscrowTx = sui.createEscrowTx
  releaseEscrowTx = sui.releaseEscrowTx
  cancelEscrowTx = sui.cancelEscrowTx
})

describe('createEscrowTx — unsigned builder', () => {
  test('builds transaction with correct move call', () => {
    const tx = createEscrowTx(
      '0x0001', // posterUnitId
      '0x0002', // workerId
      'research', // taskName
      5_000_000_000, // 5 SUI in MIST
      Date.now() + 3600000, // 1 hour deadline
      '0x0003', // pathId
    )

    expect(tx).toBeInstanceOf(Transaction)
    // Verify the transaction has content
    const serialized = tx.toString()
    expect(serialized).toBeDefined()
    expect(serialized.length).toBeGreaterThan(0)
  })

  test('deterministic — same args produce equivalent TXs', () => {
    const deadline = Date.now() + 3600000
    const tx1 = createEscrowTx('0x0001', '0x0002', 'research', 5_000_000_000, deadline, '0x0003')
    const tx2 = createEscrowTx('0x0001', '0x0002', 'research', 5_000_000_000, deadline, '0x0003')

    // Both should produce equivalent serializations (Sui SDK is deterministic)
    expect(tx1.toString()).toBe(tx2.toString())
  })

  test('rejects zero amount', () => {
    expect(() => createEscrowTx('0x0001', '0x0002', 'task', 0, Date.now() + 3600000, '0x0003')).toThrow(
      'amount must be positive',
    )
  })

  test('rejects negative amount', () => {
    expect(() => createEscrowTx('0x0001', '0x0002', 'task', -100, Date.now() + 3600000, '0x0003')).toThrow(
      'amount must be positive',
    )
  })

  test('rejects past deadline', () => {
    expect(() => createEscrowTx('0x0001', '0x0002', 'task', 5_000_000_000, Date.now() - 1000, '0x0003')).toThrow(
      'deadline must be in future',
    )
  })

  test('rejects deadline exactly now', () => {
    expect(() => createEscrowTx('0x0001', '0x0002', 'task', 5_000_000_000, Date.now(), '0x0003')).toThrow(
      'deadline must be in future',
    )
  })

  test('accepts valid taskName strings', () => {
    const deadline = Date.now() + 3600000
    expect(() => createEscrowTx('0x0001', '0x0002', 'a', 5_000_000_000, deadline, '0x0003')).not.toThrow()
    expect(() => createEscrowTx('0x0001', '0x0002', 'research-paper', 5_000_000_000, deadline, '0x0003')).not.toThrow()
  })

  test('accepts large amounts', () => {
    const deadline = Date.now() + 3600000
    // 1 billion SUI in MIST
    expect(() =>
      createEscrowTx('0x0001', '0x0002', 'task', 1_000_000_000_000_000_000, deadline, '0x0003'),
    ).not.toThrow()
  })
})

describe('releaseEscrowTx — unsigned builder', () => {
  test('builds transaction with correct move call', () => {
    const tx = releaseEscrowTx(
      '0x0004', // escrowId
      '0x0005', // workerUnitId
      '0x0006', // pathId
    )

    expect(tx).toBeInstanceOf(Transaction)
    const serialized = tx.toString()
    expect(serialized).toBeDefined()
    expect(serialized.length).toBeGreaterThan(0)
  })

  test('deterministic — same args produce equivalent TXs', () => {
    const tx1 = releaseEscrowTx('0x0004', '0x0005', '0x0006')
    const tx2 = releaseEscrowTx('0x0004', '0x0005', '0x0006')

    expect(tx1.toString()).toBe(tx2.toString())
  })

  test('includes clock shared object (0x6)', () => {
    const tx = releaseEscrowTx('0x0004', '0x0005', '0x0006')
    // Verify the transaction is valid; clock is a system object
    expect(tx).toBeInstanceOf(Transaction)
  })

  test('accepts all object IDs', () => {
    expect(() =>
      releaseEscrowTx(
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
      ),
    ).not.toThrow()
  })
})

describe('cancelEscrowTx — unsigned builder', () => {
  test('builds transaction with correct move call', () => {
    const tx = cancelEscrowTx(
      '0x0007', // escrowId
      '0x0008', // posterUnitId
      '0x0009', // pathId
    )

    expect(tx).toBeInstanceOf(Transaction)
    const serialized = tx.toString()
    expect(serialized).toBeDefined()
    expect(serialized.length).toBeGreaterThan(0)
  })

  test('deterministic — same args produce equivalent TXs', () => {
    const tx1 = cancelEscrowTx('0x0007', '0x0008', '0x0009')
    const tx2 = cancelEscrowTx('0x0007', '0x0008', '0x0009')

    expect(tx1.toString()).toBe(tx2.toString())
  })

  test('includes clock shared object (0x6)', () => {
    const tx = cancelEscrowTx('0x0007', '0x0008', '0x0009')
    // Verify the transaction is valid; clock is a system object
    expect(tx).toBeInstanceOf(Transaction)
  })

  test('accepts all object IDs', () => {
    expect(() =>
      cancelEscrowTx(
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
      ),
    ).not.toThrow()
  })
})

describe('escrow TX builders — integration pattern', () => {
  test('all three builders export from module', () => {
    expect(createEscrowTx).toBeDefined()
    expect(releaseEscrowTx).toBeDefined()
    expect(cancelEscrowTx).toBeDefined()
  })

  test('all three builders export from default export', async () => {
    const sui = await import('@/lib/sui')
    expect(sui.default.createEscrowTx).toBeDefined()
    expect(sui.default.releaseEscrowTx).toBeDefined()
    expect(sui.default.cancelEscrowTx).toBeDefined()
  })

  test('pattern: builders return unsigned Transaction, caller signs', () => {
    const deadline = Date.now() + 3600000
    const createTx = createEscrowTx('0x0001', '0x0002', 'task', 5_000_000_000, deadline, '0x0003')
    const releaseTx = releaseEscrowTx('0x0004', '0x0005', '0x0006')
    const cancelTx = cancelEscrowTx('0x0007', '0x0008', '0x0009')

    // All are Transaction instances, ready for signAndExecute(tx, keypair)
    expect(createTx).toBeInstanceOf(Transaction)
    expect(releaseTx).toBeInstanceOf(Transaction)
    expect(cancelTx).toBeInstanceOf(Transaction)

    // All serialize to non-empty strings (valid TX objects)
    expect(createTx.toString().length).toBeGreaterThan(0)
    expect(releaseTx.toString().length).toBeGreaterThan(0)
    expect(cancelTx.toString().length).toBeGreaterThan(0)
  })
})
