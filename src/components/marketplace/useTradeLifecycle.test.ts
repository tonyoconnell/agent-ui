import { describe, expect, it } from 'vitest'
import { INITIAL, reducer, STAGES, type TradeState } from './useTradeLifecycle'

describe('useTradeLifecycle reducer', () => {
  it('starts at LIST', () => {
    expect(INITIAL.stage).toBe('LIST')
  })

  it('defines all 10 stages', () => {
    expect(STAGES).toHaveLength(10)
  })

  it('LIST → DISCOVER', () => {
    const next = reducer(INITIAL, { type: 'DISCOVER' })
    expect(next.stage).toBe('DISCOVER')
  })

  it('DISCOVER → OFFER captures provider, task, price', () => {
    const d = reducer(INITIAL, { type: 'DISCOVER' })
    const o = reducer(d, { type: 'OFFER', provider: 'oracle', task: 'complete', price: 0.05 })
    expect(o.stage).toBe('OFFER')
    expect(o.provider).toBe('oracle')
    expect(o.task).toBe('complete')
    expect(o.price).toBe(0.05)
  })

  it('OFFER → ESCROW captures receiptId', () => {
    const s: TradeState = { ...INITIAL, stage: 'OFFER' }
    const next = reducer(s, { type: 'ESCROW', receiptId: 'receipt_abc' })
    expect(next.stage).toBe('ESCROW')
    expect(next.receiptId).toBe('receipt_abc')
  })

  it('ESCROW → EXECUTE', () => {
    const next = reducer({ ...INITIAL, stage: 'ESCROW' }, { type: 'EXECUTE' })
    expect(next.stage).toBe('EXECUTE')
  })

  it('EXECUTE → VERIFY', () => {
    const next = reducer({ ...INITIAL, stage: 'EXECUTE' }, { type: 'VERIFY' })
    expect(next.stage).toBe('VERIFY')
  })

  it('VERIFY → SETTLE captures txHash', () => {
    const next = reducer({ ...INITIAL, stage: 'VERIFY' }, { type: 'SETTLE', txHash: '0xabc' })
    expect(next.stage).toBe('SETTLE')
    expect(next.txHash).toBe('0xabc')
  })

  it('SETTLE → RECEIPT', () => {
    const next = reducer({ ...INITIAL, stage: 'SETTLE' }, { type: 'RECEIPT' })
    expect(next.stage).toBe('RECEIPT')
  })

  it('ESCROW → DISPUTE is valid', () => {
    const next = reducer({ ...INITIAL, stage: 'ESCROW' }, { type: 'DISPUTE' })
    expect(next.stage).toBe('DISPUTE')
  })

  it('RECEIPT → FADE', () => {
    const next = reducer({ ...INITIAL, stage: 'RECEIPT' }, { type: 'FADE' })
    expect(next.stage).toBe('FADE')
  })

  it('invalid transition throws: LIST → OFFER', () => {
    expect(() => reducer(INITIAL, { type: 'OFFER', provider: 'x', task: 'y', price: 1 })).toThrow(/invalid transition/)
  })

  it('invalid transition throws: SETTLE → OFFER', () => {
    expect(() =>
      reducer({ ...INITIAL, stage: 'SETTLE' }, { type: 'OFFER', provider: 'x', task: 'y', price: 1 }),
    ).toThrow(/invalid transition/)
  })

  it('RESET returns to INITIAL from any stage', () => {
    const s: TradeState = { ...INITIAL, stage: 'DISPUTE', provider: 'x' }
    expect(reducer(s, { type: 'RESET' })).toEqual(INITIAL)
  })
})
