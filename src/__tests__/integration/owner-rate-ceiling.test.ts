/**
 * Owner hard rate ceiling tests (owner-todo Gap 5 task 5.t1).
 *
 * Acceptance: synthetic load at the per-second ceiling returns ok; the
 * 1001st call within 1s returns 429 with reason='sec-ceiling'. Different
 * keys have independent buckets. Window resets after the second rolls over.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkRateCeiling, resetRateCeilings } from '@/lib/metering'
import { OWNER_HARD_CEILING } from '@/lib/tier-limits'

beforeEach(() => {
  resetRateCeilings()
})

afterEach(() => {
  resetRateCeilings()
})

describe('OWNER_HARD_CEILING constants (5.s1)', () => {
  it('exposes perSec=1000 and perDay=100_000', () => {
    expect(OWNER_HARD_CEILING.perSec).toBe(1000)
    expect(OWNER_HARD_CEILING.perDay).toBe(100_000)
  })
})

describe('checkRateCeiling — per-second ceiling (5.t1)', () => {
  it('passes the first perSec calls within one second', () => {
    let okCount = 0
    for (let i = 0; i < OWNER_HARD_CEILING.perSec; i++) {
      const r = checkRateCeiling('owner-key')
      if (r.ok) okCount++
    }
    expect(okCount).toBe(OWNER_HARD_CEILING.perSec)
  })

  it('returns 429 reason="sec-ceiling" on the (perSec+1)th call', () => {
    for (let i = 0; i < OWNER_HARD_CEILING.perSec; i++) {
      checkRateCeiling('owner-key')
    }
    const blocked = checkRateCeiling('owner-key')
    expect(blocked.ok).toBe(false)
    if (blocked.ok) throw new Error('unreachable')
    expect(blocked.reason).toBe('sec-ceiling')
    expect(blocked.count).toBe(OWNER_HARD_CEILING.perSec + 1)
    expect(blocked.limit).toBe(OWNER_HARD_CEILING.perSec)
    expect(blocked.retryAfter).toBe(1)
  })

  it('synthetic 1500-rps burst → ~1000 ok, ~500 blocked', () => {
    let ok = 0
    let blocked = 0
    for (let i = 0; i < 1500; i++) {
      const r = checkRateCeiling('hot-loop-key')
      if (r.ok) ok++
      else blocked++
    }
    expect(ok).toBe(OWNER_HARD_CEILING.perSec)
    expect(blocked).toBe(1500 - OWNER_HARD_CEILING.perSec)
  })
})

describe('checkRateCeiling — independence + recovery', () => {
  it('different keys have independent buckets', () => {
    for (let i = 0; i < OWNER_HARD_CEILING.perSec; i++) {
      checkRateCeiling('key-A')
    }
    expect(checkRateCeiling('key-A').ok).toBe(false)
    expect(checkRateCeiling('key-B').ok).toBe(true)
  })

  it('per-second window resets after >=1s', async () => {
    for (let i = 0; i < OWNER_HARD_CEILING.perSec; i++) {
      checkRateCeiling('rolling-key')
    }
    expect(checkRateCeiling('rolling-key').ok).toBe(false)
    // Wait for the next unix-second window. 1100ms guarantees rollover.
    await new Promise((r) => setTimeout(r, 1100))
    const r = checkRateCeiling('rolling-key')
    expect(r.ok).toBe(true)
  })

  it('empty keyId is ungated (no-op)', () => {
    for (let i = 0; i < OWNER_HARD_CEILING.perSec + 100; i++) {
      const r = checkRateCeiling('')
      expect(r.ok).toBe(true)
    }
  })
})
