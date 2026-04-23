/**
 * Per-chain address derivation tests.
 *
 * Three invariants per chain:
 *   1. Determinism  — same uid → same address on repeated calls
 *   2. Uniqueness   — different uid → different address
 *   3. URI format   — payment URI has the expected scheme prefix
 */

import { describe, expect, it } from 'vitest'

// Inject a test seed before importing chain modules
// (SUI_SEED is read lazily inside each module)
const TEST_SEED = btoa(String.fromCharCode(...new Uint8Array(32).fill(0x42)))
process.env.SUI_SEED = TEST_SEED

import { buildPaymentUriBtc, deriveAddressBtc } from '../btc.ts'
import { buildPaymentUriArb, deriveAddressArb } from '../chain-arb.ts'
import { buildPaymentUriBase, deriveAddressBase } from '../chain-base.ts'
import { buildPaymentUriOpt, deriveAddressOpt } from '../chain-opt.ts'
import { buildPaymentUriEth, deriveAddressEth } from '../eth.ts'
import { buildPaymentUriSol, deriveAddressSol } from '../sol.ts'
import { buildPaymentUriSui, deriveAddressSui } from '../sui.ts'

const UID_ALICE = 'user:alice'
const UID_BOB = 'user:bob'

// ─── ETH ─────────────────────────────────────────────────────────────────────

describe('ETH', () => {
  it('determinism: same uid → same address', () => {
    const a1 = deriveAddressEth(UID_ALICE)
    const a2 = deriveAddressEth(UID_ALICE)
    expect(a1).toBe(a2)
  })

  it('uniqueness: different uid → different address', () => {
    expect(deriveAddressEth(UID_ALICE)).not.toBe(deriveAddressEth(UID_BOB))
  })

  it('address format: 0x-prefixed, 42 chars', () => {
    const addr = deriveAddressEth(UID_ALICE)
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('URI format: ethereum: prefix with value', () => {
    const addr = deriveAddressEth(UID_ALICE)
    const uri = buildPaymentUriEth(addr, 1_000_000_000_000_000_000n)
    expect(uri).toMatch(/^ethereum:0x/)
    expect(uri).toContain('?value=')
  })
})

// ─── SOL ─────────────────────────────────────────────────────────────────────

describe('SOL', () => {
  it('determinism: same uid → same address', () => {
    const a1 = deriveAddressSol(UID_ALICE)
    const a2 = deriveAddressSol(UID_ALICE)
    expect(a1).toBe(a2)
  })

  it('uniqueness: different uid → different address', () => {
    expect(deriveAddressSol(UID_ALICE)).not.toBe(deriveAddressSol(UID_BOB))
  })

  it('address format: base58 string, 32-44 chars', () => {
    const addr = deriveAddressSol(UID_ALICE)
    expect(addr).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
  })

  it('URI format: solana: prefix with amount', () => {
    const addr = deriveAddressSol(UID_ALICE)
    const uri = buildPaymentUriSol(addr, 1_000_000n)
    expect(uri).toMatch(/^solana:/)
    expect(uri).toContain('?amount=')
  })
})

// ─── BTC ─────────────────────────────────────────────────────────────────────

describe('BTC', () => {
  it('determinism: same uid → same address', () => {
    const a1 = deriveAddressBtc(UID_ALICE)
    const a2 = deriveAddressBtc(UID_ALICE)
    expect(a1).toBe(a2)
  })

  it('uniqueness: different uid → different address', () => {
    expect(deriveAddressBtc(UID_ALICE)).not.toBe(deriveAddressBtc(UID_BOB))
  })

  it('address format: bech32 bc1q... prefix', () => {
    const addr = deriveAddressBtc(UID_ALICE)
    expect(addr).toMatch(/^bc1q[a-z0-9]{38,42}$/)
  })

  it('URI format: bitcoin: prefix with amount in BTC', () => {
    const addr = deriveAddressBtc(UID_ALICE)
    const uri = buildPaymentUriBtc(addr, 100_000_000n) // 1 BTC
    expect(uri).toMatch(/^bitcoin:/)
    expect(uri).toContain('?amount=1.')
  })
})

// ─── BASE ─────────────────────────────────────────────────────────────────────

describe('BASE', () => {
  it('determinism: same uid → same address', () => {
    const a1 = deriveAddressBase(UID_ALICE)
    const a2 = deriveAddressBase(UID_ALICE)
    expect(a1).toBe(a2)
  })

  it('uniqueness: different uid → different address', () => {
    expect(deriveAddressBase(UID_ALICE)).not.toBe(deriveAddressBase(UID_BOB))
  })

  it('address format: 0x-prefixed, 42 chars', () => {
    const addr = deriveAddressBase(UID_ALICE)
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('URI format: eip681: with chainId 8453', () => {
    const addr = deriveAddressBase(UID_ALICE)
    const uri = buildPaymentUriBase(addr, 1n)
    expect(uri).toMatch(/^eip681:0x/)
    expect(uri).toContain('@8453')
  })

  it('chain isolation: BASE address ≠ ETH address for same uid', () => {
    expect(deriveAddressBase(UID_ALICE)).not.toBe(deriveAddressEth(UID_ALICE))
  })
})

// ─── ARB ─────────────────────────────────────────────────────────────────────

describe('ARB', () => {
  it('determinism: same uid → same address', () => {
    const a1 = deriveAddressArb(UID_ALICE)
    const a2 = deriveAddressArb(UID_ALICE)
    expect(a1).toBe(a2)
  })

  it('uniqueness: different uid → different address', () => {
    expect(deriveAddressArb(UID_ALICE)).not.toBe(deriveAddressArb(UID_BOB))
  })

  it('address format: 0x-prefixed, 42 chars', () => {
    const addr = deriveAddressArb(UID_ALICE)
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('URI format: eip681: with chainId 42161', () => {
    const addr = deriveAddressArb(UID_ALICE)
    const uri = buildPaymentUriArb(addr, 1n)
    expect(uri).toMatch(/^eip681:0x/)
    expect(uri).toContain('@42161')
  })

  it('chain isolation: ARB address ≠ ETH address for same uid', () => {
    expect(deriveAddressArb(UID_ALICE)).not.toBe(deriveAddressEth(UID_ALICE))
  })
})

// ─── OPT ─────────────────────────────────────────────────────────────────────

describe('OPT', () => {
  it('determinism: same uid → same address', () => {
    const a1 = deriveAddressOpt(UID_ALICE)
    const a2 = deriveAddressOpt(UID_ALICE)
    expect(a1).toBe(a2)
  })

  it('uniqueness: different uid → different address', () => {
    expect(deriveAddressOpt(UID_ALICE)).not.toBe(deriveAddressOpt(UID_BOB))
  })

  it('address format: 0x-prefixed, 42 chars', () => {
    const addr = deriveAddressOpt(UID_ALICE)
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('URI format: eip681: with chainId 10', () => {
    const addr = deriveAddressOpt(UID_ALICE)
    const uri = buildPaymentUriOpt(addr, 1n)
    expect(uri).toMatch(/^eip681:0x/)
    expect(uri).toContain('@10')
  })

  it('chain isolation: OPT address ≠ ETH address for same uid', () => {
    expect(deriveAddressOpt(UID_ALICE)).not.toBe(deriveAddressEth(UID_ALICE))
  })
})

// ─── SUI ─────────────────────────────────────────────────────────────────────

describe('SUI', () => {
  it('determinism: same uid → same address', async () => {
    const a1 = await deriveAddressSui(UID_ALICE)
    const a2 = await deriveAddressSui(UID_ALICE)
    expect(a1).toBe(a2)
  })

  it('uniqueness: different uid → different address', async () => {
    const addrAlice = await deriveAddressSui(UID_ALICE)
    const addrBob = await deriveAddressSui(UID_BOB)
    expect(addrAlice).not.toBe(addrBob)
  })

  it('address format: 0x-prefixed hex', async () => {
    const addr = await deriveAddressSui(UID_ALICE)
    expect(addr).toMatch(/^0x[0-9a-f]{64}$/)
  })

  it('URI format: sui: prefix with amount', async () => {
    const addr = await deriveAddressSui(UID_ALICE)
    const uri = buildPaymentUriSui(addr, 1_000_000_000n)
    expect(uri).toMatch(/^sui:0x/)
    expect(uri).toContain('?amount=')
  })
})

// ─── cross-chain isolation ────────────────────────────────────────────────────

describe('cross-chain isolation', () => {
  it('all 6 synchronous chains produce distinct addresses for same uid', () => {
    const addresses = [
      deriveAddressEth(UID_ALICE),
      deriveAddressSol(UID_ALICE),
      deriveAddressBtc(UID_ALICE),
      deriveAddressBase(UID_ALICE),
      deriveAddressArb(UID_ALICE),
      deriveAddressOpt(UID_ALICE),
    ]
    const unique = new Set(addresses)
    expect(unique.size).toBe(addresses.length)
  })
})
