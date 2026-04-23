/**
 * Reconciliation — balance vs ledger comparison
 *
 * Three scenarios, all without network:
 *   1. Balances match (within dust threshold) → status "ok"
 *   2. Mismatch > threshold → status "mismatch", pause signal emitted
 *   3. RPC error → status "error"
 *
 * Rule 3: every assertion is a concrete number or a typed status string.
 *
 * Run: bun test reconcile.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── mocks ────────────────────────────────────────────────────────────────

// Mock the Sui client — never hits the network
vi.mock('@/lib/sui', () => ({
  getClient: vi.fn(),
}))

// Mock TypeDB — no real DB connection
vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn().mockResolvedValue(undefined),
}))

// ─── imports ──────────────────────────────────────────────────────────────

import { getClient } from '@/lib/sui'
import { readParsed, writeSilent } from '@/lib/typedb'
import { MIST_DUST_THRESHOLD, reconcileWallet } from './reconcile'

const mockGetClient = vi.mocked(getClient)
const mockReadParsed = vi.mocked(readParsed)
const mockWriteSilent = vi.mocked(writeSilent)

// ─── helpers ──────────────────────────────────────────────────────────────

/** Build a fake Sui client with getBalance returning totalBalance */
function makeSuiClient(totalBalance: bigint) {
  return {
    getBalance: vi.fn().mockResolvedValue({ totalBalance: totalBalance.toString() }),
  } as unknown as ReturnType<typeof getClient>
}

/** Stub readParsed to return fund and spend rows in order */
function stubLedger(fundMist: bigint, spendMist: bigint) {
  mockReadParsed
    // First call: fund signals
    .mockResolvedValueOnce(fundMist > 0n ? [{ w: fundMist.toString() }] : [])
    // Second call: spend signals
    .mockResolvedValueOnce(spendMist > 0n ? [{ w: spendMist.toString() }] : [])
}

// ─── reset between tests ──────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockWriteSilent.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════
// Act 1 — Matching balances → status "ok"
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: matching balances', () => {
  it('returns status ok when on-chain equals expected', async () => {
    const BALANCE = 5_000_000_000n // 5 SUI in MIST
    mockGetClient.mockReturnValue(makeSuiClient(BALANCE))
    stubLedger(BALANCE, 0n)

    const result = await reconcileWallet('unit:alice', '0xabc')

    expect(result.status).toBe('ok')
    expect(result.onChainMist).toBe(BALANCE)
    expect(result.expectedMist).toBe(BALANCE)
    expect(result.delta).toBe(0n)
  })

  it('returns status ok when delta is within dust threshold', async () => {
    const BALANCE = 5_000_000_000n
    const LEDGER = BALANCE - MIST_DUST_THRESHOLD // exactly at boundary
    mockGetClient.mockReturnValue(makeSuiClient(BALANCE))
    stubLedger(LEDGER, 0n)

    const result = await reconcileWallet('unit:bob', '0xdef')

    expect(result.status).toBe('ok')
    expect(result.delta).toBe(MIST_DUST_THRESHOLD)
  })

  it('does not emit pause signal when ok', async () => {
    const BALANCE = 1_000_000n
    mockGetClient.mockReturnValue(makeSuiClient(BALANCE))
    stubLedger(BALANCE, 0n)

    await reconcileWallet('unit:charlie', '0x123')

    // writeSilent should not have been called with pause-related content
    const pauseCalls = mockWriteSilent.mock.calls.filter((args) => String(args[0]).includes('agent:paused'))
    expect(pauseCalls).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Act 2 — Mismatch > threshold → status "mismatch", pause signal emitted
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: mismatch over threshold', () => {
  it('returns status mismatch when delta exceeds threshold', async () => {
    const ON_CHAIN = 10_000_000n
    const LEDGER = 8_000_000n // delta = 2_000_000n >> 1_000n threshold
    mockGetClient.mockReturnValue(makeSuiClient(ON_CHAIN))
    stubLedger(LEDGER, 0n)

    const result = await reconcileWallet('unit:eve', '0x456')

    expect(result.status).toBe('mismatch')
    expect(result.onChainMist).toBe(ON_CHAIN)
    expect(result.expectedMist).toBe(LEDGER)
    expect(result.delta).toBe(ON_CHAIN - LEDGER)
  })

  it('emits agent:paused signal on mismatch', async () => {
    mockGetClient.mockReturnValue(makeSuiClient(10_000_000n))
    stubLedger(8_000_000n, 0n)

    await reconcileWallet('unit:eve', '0x456')

    // Confirm writeSilent was called with agent:paused signal content
    const allCalls = mockWriteSilent.mock.calls.map((args) => String(args[0]))
    const hasPauseSignal = allCalls.some((q) => q.includes('agent:paused'))
    expect(hasPauseSignal).toBe(true)
  })

  it('emits scope-violation hypothesis on mismatch', async () => {
    mockGetClient.mockReturnValue(makeSuiClient(10_000_000n))
    stubLedger(8_000_000n, 0n)

    await reconcileWallet('unit:frank', '0x789')

    const allCalls = mockWriteSilent.mock.calls.map((args) => String(args[0]))
    const hasHypothesis = allCalls.some((q) => q.includes('reconcile-mismatch') && q.includes('hypothesis'))
    expect(hasHypothesis).toBe(true)
  })

  it('handles negative delta (on-chain less than ledger) as mismatch', async () => {
    const ON_CHAIN = 5_000_000n
    const LEDGER = 9_000_000n // more expected than on-chain
    mockGetClient.mockReturnValue(makeSuiClient(ON_CHAIN))
    stubLedger(LEDGER, 0n)

    const result = await reconcileWallet('unit:grace', '0xaaa')

    expect(result.status).toBe('mismatch')
    expect(result.delta).toBe(ON_CHAIN - LEDGER) // negative
  })

  it('accounts for both fund and spend signals in ledger', async () => {
    // funded 10 SUI, spent 3 SUI → expected 7 SUI on-chain
    const FUND = 10_000_000_000n
    const SPEND = 3_000_000_000n
    const ON_CHAIN = FUND - SPEND // perfect match
    mockGetClient.mockReturnValue(makeSuiClient(ON_CHAIN))
    stubLedger(FUND, SPEND)

    const result = await reconcileWallet('unit:henry', '0xbbb')

    expect(result.status).toBe('ok')
    expect(result.expectedMist).toBe(FUND - SPEND)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Act 3 — RPC error → status "error"
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: RPC error', () => {
  it('returns status error when Sui RPC throws', async () => {
    mockGetClient.mockReturnValue({
      getBalance: vi.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as ReturnType<typeof getClient>)

    const result = await reconcileWallet('unit:ivan', '0xccc')

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('connection refused')
  })

  it('returns status error when TypeDB throws during ledger query', async () => {
    mockGetClient.mockReturnValue(makeSuiClient(5_000_000n))
    mockReadParsed
      .mockResolvedValueOnce([{ w: '5000000' }]) // fund: ok
      .mockRejectedValueOnce(new Error('typedb timeout')) // spend: fails

    const result = await reconcileWallet('unit:judy', '0xddd')

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('typedb timeout')
  })

  it('does not emit pause signal on RPC error', async () => {
    mockGetClient.mockReturnValue({
      getBalance: vi.fn().mockRejectedValue(new Error('network unreachable')),
    } as unknown as ReturnType<typeof getClient>)

    await reconcileWallet('unit:karen', '0xeee')

    const pauseCalls = mockWriteSilent.mock.calls.filter((args) => String(args[0]).includes('agent:paused'))
    expect(pauseCalls).toHaveLength(0)
  })

  it('returns zero fields on RPC error to keep result typed', async () => {
    mockGetClient.mockReturnValue({
      getBalance: vi.fn().mockRejectedValue(new Error('rpc down')),
    } as unknown as ReturnType<typeof getClient>)

    const result = await reconcileWallet('unit:leo', '0xfff')

    expect(result.onChainMist).toBe(0n)
    expect(result.expectedMist).toBe(0n)
    expect(result.delta).toBe(0n)
  })
})
