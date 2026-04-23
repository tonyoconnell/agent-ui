import { describe, expect, it } from 'vitest'
import { type Cursor, decodeCursor, encodeCursor, isCursorStale, nextCursor } from '../cursor'

const ONE_HOUR_MS = 3_600_000

// ---------------------------------------------------------------------------
// encodeCursor / decodeCursor round-trip
// ---------------------------------------------------------------------------

describe('encodeCursor / decodeCursor', () => {
  it('round-trips a well-formed cursor', () => {
    const c: Cursor = { sid: 'abc123', epochMs: 1_700_000_000_000, seq: 7 }
    const encoded = encodeCursor(c)
    expect(encoded).toBe('abc123:1700000000000:7')
    const decoded = decodeCursor(encoded)
    expect(decoded).toEqual(c)
  })

  it('round-trips seq=0 (first cursor)', () => {
    const c: Cursor = { sid: 's1', epochMs: 1000, seq: 0 }
    expect(decodeCursor(encodeCursor(c))).toEqual(c)
  })

  it('returns null for empty string', () => {
    expect(decodeCursor('')).toBeNull()
  })

  it('returns null when a segment is missing', () => {
    expect(decodeCursor('abc:12345')).toBeNull()
  })

  it('returns null when epochMs is not a number', () => {
    expect(decodeCursor('abc:notanumber:0')).toBeNull()
  })

  it('returns null when seq is not a number', () => {
    expect(decodeCursor('abc:1000000:notanumber')).toBeNull()
  })

  it('handles sid that contains no special characters', () => {
    const c: Cursor = { sid: 'session-uuid-v4', epochMs: 9999, seq: 42 }
    expect(decodeCursor(encodeCursor(c))).toEqual(c)
  })
})

// ---------------------------------------------------------------------------
// nextCursor
// ---------------------------------------------------------------------------

describe('nextCursor', () => {
  it('increments seq by 1', () => {
    const prev: Cursor = { sid: 's1', epochMs: 1000, seq: 3 }
    const next = nextCursor(prev)
    expect(next.seq).toBe(4)
  })

  it('preserves sid', () => {
    const prev: Cursor = { sid: 'my-sid', epochMs: 1000, seq: 0 }
    expect(nextCursor(prev).sid).toBe('my-sid')
  })

  it('sets epochMs to approximately now', () => {
    const before = Date.now()
    const next = nextCursor({ sid: 's', epochMs: 0, seq: 0 })
    const after = Date.now()
    expect(next.epochMs).toBeGreaterThanOrEqual(before)
    expect(next.epochMs).toBeLessThanOrEqual(after)
  })
})

// ---------------------------------------------------------------------------
// isCursorStale
// ---------------------------------------------------------------------------

describe('isCursorStale', () => {
  const base = Date.now()

  it('returns false when sequences are equal and times match', () => {
    const a: Cursor = { sid: 's1', epochMs: base, seq: 5 }
    expect(isCursorStale(a, a)).toBe(false)
  })

  it('returns false when incoming seq is ahead of lastKnown', () => {
    const incoming: Cursor = { sid: 's1', epochMs: base + 1000, seq: 10 }
    const lastKnown: Cursor = { sid: 's1', epochMs: base, seq: 5 }
    expect(isCursorStale(incoming, lastKnown)).toBe(false)
  })

  it('returns true when same sid and incoming seq is behind lastKnown', () => {
    const incoming: Cursor = { sid: 's1', epochMs: base + 1000, seq: 3 }
    const lastKnown: Cursor = { sid: 's1', epochMs: base, seq: 5 }
    expect(isCursorStale(incoming, lastKnown)).toBe(true)
  })

  it('returns false for same sid when incoming seq equals lastKnown seq', () => {
    const c: Cursor = { sid: 's1', epochMs: base, seq: 5 }
    // equal seq is not stale (resuming from the same point)
    expect(isCursorStale(c, c)).toBe(false)
  })

  it('returns false when time gap is exactly 1h (boundary — allowed)', () => {
    const incoming: Cursor = { sid: 's2', epochMs: base, seq: 0 }
    const lastKnown: Cursor = { sid: 's2', epochMs: base + ONE_HOUR_MS, seq: 0 }
    // incoming.epochMs === lastKnown.epochMs - ONE_HOUR_MS — exactly on boundary
    // The condition is strictly less-than, so boundary is not stale
    expect(isCursorStale(incoming, lastKnown)).toBe(false)
  })

  it('returns true when time gap exceeds 1h (device-swap too old)', () => {
    const incoming: Cursor = { sid: 's2', epochMs: base, seq: 0 }
    const lastKnown: Cursor = { sid: 's2', epochMs: base + ONE_HOUR_MS + 1, seq: 0 }
    expect(isCursorStale(incoming, lastKnown)).toBe(true)
  })

  it('returns false when sids differ even if incoming seq is lower', () => {
    // Different session — seq comparison doesn't apply
    const incoming: Cursor = { sid: 's1', epochMs: base, seq: 1 }
    const lastKnown: Cursor = { sid: 's2', epochMs: base, seq: 5 }
    expect(isCursorStale(incoming, lastKnown)).toBe(false)
  })

  it('1h tolerance: within tolerance window is fresh (device-swap scenario)', () => {
    // User disconnects, comes back 55 min later on another device
    const FIFTY_FIVE_MIN = 55 * 60 * 1000
    const incoming: Cursor = { sid: 'd1', epochMs: base, seq: 0 }
    const lastKnown: Cursor = { sid: 'd1', epochMs: base + FIFTY_FIVE_MIN, seq: 0 }
    expect(isCursorStale(incoming, lastKnown)).toBe(false)
  })

  it('1h tolerance: beyond tolerance is stale', () => {
    // User disconnects, comes back 70 min later
    const SEVENTY_MIN = 70 * 60 * 1000
    const incoming: Cursor = { sid: 'd1', epochMs: base, seq: 0 }
    const lastKnown: Cursor = { sid: 'd1', epochMs: base + SEVENTY_MIN, seq: 0 }
    expect(isCursorStale(incoming, lastKnown)).toBe(true)
  })
})
