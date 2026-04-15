/**
 * RECALL — Query hypotheses from TypeDB
 *
 * persist().recall(match?) queries the brain for learned patterns.
 * Supports: no-arg (all), string keyword, {subject?, at?} bi-temporal.
 *
 * Run: bun vitest run src/engine/recall.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistentWorld } from './persist'

// ── Mock TypeDB — isolate recall from the database ────────────────────────

vi.mock('@/lib/typedb', () => ({
  read: vi.fn().mockResolvedValue('[]'),
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn().mockResolvedValue(undefined),
  parseAnswers: vi.fn().mockReturnValue([]),
}))

// Bridge mocks
vi.mock('./bridge', () => ({
  mirrorMark: vi.fn().mockResolvedValue(undefined),
  mirrorWarn: vi.fn().mockResolvedValue(undefined),
  mirrorActor: vi.fn().mockResolvedValue(undefined),
}))

// Context mocks
vi.mock('./context', () => ({
  ingestDocs: vi.fn().mockResolvedValue(0),
  loadContext: vi.fn().mockReturnValue(''),
}))

import { readParsed } from '@/lib/typedb'
import { world } from './persist'

// ═══════════════════════════════════════════════════════════════════════════
// RECALL: Query hypotheses from TypeDB — four query modes
//
// (a) recall() no-arg returns all confirmed + pending + failed hypotheses
// (b) recall("build") filters by string keyword in statement
// (c) recall({subject: "api"}) filters by subject field
// (d) recall({at: timestamp}) bi-temporal: hypotheses valid at that moment
// ═══════════════════════════════════════════════════════════════════════════

describe('recall() — Query hypotheses from TypeDB', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('(a) recall() with no args returns confirmed + pending + failed hypotheses', async () => {
    // When no search string, recall() only makes 2 readParsed calls: withSrc and noSrc
    // (pending and failed queries require a search string and resolve to empty promises)
    ;(readParsed as any).mockImplementation(async (query: string) => {
      if (query.includes('has source $src')) {
        // confirmedWithSrc
        return [
          { s: 'path A is faster', p: 0.1, src: 'observed' },
          { s: 'B leads to C', p: 0.2, src: 'verified' },
        ]
      }
      if (query.includes('not { $h has source')) {
        // confirmedNoSrc
        return [{ s: 'legacy learning', p: 0.15 }]
      }
      return []
    })

    const results = await w.recall()

    // No-arg recall returns only confirmed (from withSrc + noSrc)
    expect(results.length).toBeGreaterThanOrEqual(3)
    expect(results.some((r) => r.pattern === 'path A is faster')).toBe(true)
    expect(results.some((r) => r.pattern === 'legacy learning')).toBe(true)

    // Verify confidence calculations
    const fastest = results.find((r) => r.pattern === 'path A is faster')
    expect(fastest?.confidence).toBeCloseTo(0.9) // 1 - 0.1, from withSrc

    const legacy = results.find((r) => r.pattern === 'legacy learning')
    expect(legacy?.confidence).toBeCloseTo(0.85) // 1 - 0.15, from noSrc
  })

  it('(b) recall("build") filters hypotheses by keyword match in statement', async () => {
    // With a search string, recall makes 4 calls, but only some produce results
    ;(readParsed as any).mockImplementation(async (query: string) => {
      if (query.includes('has source $src') && query.includes('contains "build"')) {
        return [{ s: 'build pipeline is faster', p: 0.05, src: 'observed' }]
      }
      return [] // noSrc, pending, failed all empty for "build" search
    })

    const results = await w.recall('build')

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((r) => r.pattern === 'build pipeline is faster')).toBe(true)

    const buildResult = results.find((r) => r.pattern === 'build pipeline is faster')
    expect(buildResult?.confidence).toBeCloseTo(0.95) // 1 - 0.05

    // Verify the query included the keyword filter
    const queryCalls = (readParsed as any).mock.calls.map((c: any) => c[0])
    expect(queryCalls.some((q: string) => q.includes('contains "build"'))).toBe(true)
  })

  it('(c) recall({subject: "api"}) filters by subject field', async () => {
    ;(readParsed as any).mockImplementation(async (query: string) => {
      if (query.includes('has source $src') && query.includes('contains "api"')) {
        return [
          { s: 'api responds in <10ms', p: 0.08, src: 'observed' },
          { s: 'api is reliable', p: 0.12, src: 'verified' },
        ]
      }
      return [] // noSrc, pending, failed empty for "api"
    })

    const results = await w.recall({ subject: 'api' })

    expect(results.length).toBeGreaterThanOrEqual(2)
    expect(results.some((r) => r.pattern === 'api responds in <10ms')).toBe(true)
    expect(results.some((r) => r.pattern === 'api is reliable')).toBe(true)

    const queryCalls = (readParsed as any).mock.calls.map((c: any) => c[0])
    expect(queryCalls.some((q: string) => q.includes('contains "api"'))).toBe(true)
  })

  it('(d) recall({at: "2026-04-15"}) returns hypotheses valid at that timestamp', async () => {
    const timestamp = '2026-04-15'
    const mockResults = [{ s: 'pattern X was true on April 15', p: 0.2 }]

    ;(readParsed as any).mockResolvedValue(mockResults)

    const results = await w.recall({ at: timestamp })

    expect(results).toHaveLength(1)
    expect(results[0].confidence).toBeCloseTo(0.8)

    // Check that temporal clause was included in query
    const firstCall = (readParsed as any).mock.calls[0][0] as string
    expect(firstCall).toContain('valid-from')
    expect(firstCall).toContain('valid-until')
    expect(firstCall).toContain(timestamp)
  })

  it('deduplicates confirmed > pending > failed by pattern', async () => {
    // Same pattern in multiple buckets — confirmed wins
    const withSrc = [{ s: 'duplicate pattern', p: 0.1, src: 'observed' }]
    const noSrc = [{ s: 'duplicate pattern', p: 0.2 }] // ignored, already in withSrc
    const pending = [{ s: 'duplicate pattern', p: 0.5 }] // ignored
    const failed = [] // none

    let callCount = 0
    ;(readParsed as any).mockImplementation(async () => {
      callCount++
      if (callCount === 1) return withSrc
      if (callCount === 2) return noSrc
      if (callCount === 3) return pending
      return []
    })

    const results = await w.recall()

    expect(results).toHaveLength(1)
    expect(results[0].pattern).toBe('duplicate pattern')
    expect(results[0].confidence).toBeCloseTo(0.9) // from withSrc, not pending or noSrc
  })

  it('caps asserted hypotheses at 0.30 confidence (until corroborated)', async () => {
    const mockWithSrc = [{ s: 'asserted pattern', p: 0.1, src: 'asserted' }]

    ;(readParsed as any).mockResolvedValue(mockWithSrc)

    const results = await w.recall()

    expect(results).toHaveLength(1)
    // raw confidence = 1 - 0.1 = 0.9, but capped at 0.3 for asserted source
    expect(results[0].confidence).toBe(0.3)
  })

  it('combines string + temporal filters: recall({subject: "task", at: "2026-04-14"})', async () => {
    ;(readParsed as any).mockImplementation(async (query: string) => {
      if (query.includes('contains "task"') && query.includes('valid-from')) {
        return [{ s: 'task scheduling improved', p: 0.07, src: 'observed' }]
      }
      return []
    })

    const results = await w.recall({ subject: 'task', at: '2026-04-14' })

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((r) => r.pattern === 'task scheduling improved')).toBe(true)

    // Verify both filters in the query
    const queryCalls = (readParsed as any).mock.calls.map((c: any) => c[0])
    const relevantCall = queryCalls.find((q: string) => q.includes('contains "task"'))
    expect(relevantCall).toContain('valid-from')
    expect(relevantCall).toContain('2026-04-14')
  })

  it('escapes special characters in match string to prevent injection', async () => {
    const maliciousInput = 'test"; $h delete; //'
    const mockResults = [] // no matches

    ;(readParsed as any).mockResolvedValue(mockResults)

    const results = await w.recall(maliciousInput)

    expect(results).toHaveLength(0)

    // Verify the query contains escaped quotes
    const firstCall = (readParsed as any).mock.calls[0][0] as string
    expect(firstCall).toContain('\\"') // escaped quotes
  })
})
