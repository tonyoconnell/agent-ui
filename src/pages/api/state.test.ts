/**
 * GET /api/state — World state for UI tests
 *
 * Tests the state endpoint: KV snapshot reading, TypeDB fallback,
 * stat calculation, toxicity detection, highway filtering.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock TypeDB
vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn().mockResolvedValue([]),
  write: vi.fn().mockResolvedValue(undefined),
  writeSilent: vi.fn(),
}))

import { readParsed } from '@/lib/typedb'
import { GET } from './state'

describe('GET /api/state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeCtx(kvData?: Record<string, string | null>) {
    const kv = kvData
      ? {
          get: vi.fn((key: string) => Promise.resolve(kvData[key] ?? null)),
        }
      : undefined

    return {
      url: new URL('http://localhost:4321/api/state'),
      locals: kv ? { runtime: { env: { KV: kv } } } : {},
    } as any
  }

  // ── KV path ────────────────────────────────────────────────────────────

  it('returns units and edges from KV snapshots', async () => {
    const units = [
      { uid: 'scout', name: 'Scout', kind: 'agent', successRate: 0.9, generation: 2 },
      { uid: 'analyst', name: 'Analyst', kind: 'agent', successRate: 0.7, generation: 1 },
    ]
    const paths = [{ from: 'scout', to: 'analyst', strength: 60, resistance: 5, revenue: 0.5 }]

    const ctx = makeCtx({
      'units.json': JSON.stringify(units),
      'paths.json': JSON.stringify(paths),
      'toxic.json': JSON.stringify([]),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.units).toHaveLength(2)
    expect(body.units[0].id).toBe('scout')
    expect(body.units[0].name).toBe('Scout')
    expect(body.units[0].kind).toBe('agent')
    expect(body.units[0].sr).toBe(0.9)
    expect(body.units[0].g).toBe(2)

    expect(body.edges).toHaveLength(1)
    expect(body.edges[0].from).toBe('scout')
    expect(body.edges[0].to).toBe('analyst')
    expect(body.edges[0].strength).toBe(60)
    expect(body.edges[0].resistance).toBe(5)
    expect(body.edges[0].revenue).toBe(0.5)
  })

  it('calculates stats correctly from KV data', async () => {
    const units = [
      { uid: 'a', name: 'A' },
      { uid: 'b', name: 'B' },
      { uid: 'c', name: 'C' },
    ]
    const paths = [
      { from: 'a', to: 'b', strength: 60, resistance: 2, revenue: 1.5 },
      { from: 'b', to: 'c', strength: 80, resistance: 3, revenue: 2.0 },
      { from: 'a', to: 'c', strength: 10, resistance: 1, revenue: 0.5 },
    ]

    const ctx = makeCtx({
      'units.json': JSON.stringify(units),
      'paths.json': JSON.stringify(paths),
      'toxic.json': JSON.stringify([]),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.stats.units).toBe(3)
    expect(body.stats.edges).toBe(3)
    // highways: strength >= 50 and not toxic
    expect(body.stats.highways).toBe(2) // a→b (60) and b→c (80)
    expect(body.stats.revenue).toBe(4.0) // 1.5 + 2.0 + 0.5
  })

  it('filters highways correctly (strength >= 50 and not toxic)', async () => {
    const paths = [
      { from: 'a', to: 'b', strength: 55, resistance: 2 },
      { from: 'c', to: 'd', strength: 49, resistance: 1 }, // below threshold
      { from: 'e', to: 'f', strength: 100, resistance: 0 },
    ]

    const ctx = makeCtx({
      'units.json': JSON.stringify([]),
      'paths.json': JSON.stringify(paths),
      'toxic.json': JSON.stringify([]),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.highways).toHaveLength(2)
    expect(body.highways[0].from).toBe('a')
    expect(body.highways[1].from).toBe('e')
  })

  it('marks edges as toxic from toxic.json set', async () => {
    const paths = [{ from: 'a', to: 'b', strength: 5, resistance: 2 }]

    const ctx = makeCtx({
      'units.json': JSON.stringify([]),
      'paths.json': JSON.stringify(paths),
      'toxic.json': JSON.stringify(['a\u2192b']),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.edges[0].toxic).toBe(true)
  })

  it('detects toxic edges via p.toxic flag on path data', async () => {
    const paths = [
      { from: 'x', to: 'y', strength: 3, resistance: 12, toxic: true },
      { from: 'a', to: 'b', strength: 50, resistance: 5, toxic: false },
    ]

    const ctx = makeCtx({
      'units.json': JSON.stringify([]),
      'paths.json': JSON.stringify(paths),
      'toxic.json': JSON.stringify([]),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    const toxicEdge = body.edges.find((e: any) => e.from === 'x')
    const safeEdge = body.edges.find((e: any) => e.from === 'a')
    expect(toxicEdge.toxic).toBe(true)
    expect(safeEdge.toxic).toBe(false)
  })

  it('toxic fallback uses toxicSet when p.toxic is undefined', async () => {
    // When p.toxic is undefined, ?? falls through to toxicSet.has()
    const paths = [{ from: 'x', to: 'y', strength: 3, resistance: 12 }]

    const ctx = makeCtx({
      'units.json': JSON.stringify([]),
      'paths.json': JSON.stringify(paths),
      'toxic.json': JSON.stringify(['x\u2192y']),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.edges[0].toxic).toBe(true)
  })

  // ── Empty / fallback ──────────────────────────────────────────────────

  it('returns empty state when KV has no data', async () => {
    const ctx = makeCtx({
      'units.json': null,
      'paths.json': null,
      'toxic.json': null,
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.units).toEqual([])
    expect(body.edges).toEqual([])
    expect(body.highways).toEqual([])
    expect(body.stats.units).toBe(0)
    expect(body.stats.edges).toBe(0)
    expect(body.stats.highways).toBe(0)
  })

  // ── TypeDB fallback (no KV) ────────────────────────────────────────────

  it('falls back to TypeDB when no KV namespace', async () => {
    const mockReadParsed = readParsed as any
    // First call: units query
    mockReadParsed.mockResolvedValueOnce([{ id: 'agent-1', n: 'Agent One', k: 'agent', sr: 0.85, g: 1 }])
    // Second call: paths query
    mockReadParsed.mockResolvedValueOnce([{ sid: 'agent-1', tid: 'agent-2', str: 70, r: 3 }])

    const ctx = makeCtx() // no KV
    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(readParsed).toHaveBeenCalled()
    expect(body.units).toHaveLength(1)
    expect(body.units[0].id).toBe('agent-1')
    expect(body.units[0].name).toBe('Agent One')
    expect(body.edges).toHaveLength(1)
    expect(body.edges[0].strength).toBe(70)
  })

  it('handles TypeDB failure gracefully', async () => {
    const mockReadParsed = readParsed as any
    mockReadParsed.mockRejectedValue(new Error('TypeDB down'))

    const ctx = makeCtx() // no KV, TypeDB fails
    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    // Should return empty state, not crash
    expect(body.units).toEqual([])
    expect(body.edges).toEqual([])
    expect(body.stats.units).toBe(0)
  })

  // ── Defaults ───────────────────────────────────────────────────────────

  it('defaults kind to agent and generation to 1 when missing', async () => {
    const units = [{ uid: 'minimal', name: 'Minimal' }]
    const ctx = makeCtx({
      'units.json': JSON.stringify(units),
      'paths.json': JSON.stringify([]),
      'toxic.json': JSON.stringify([]),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.units[0].kind).toBe('agent')
    expect(body.units[0].g).toBe(1)
    expect(body.units[0].sr).toBe(0)
  })

  it('defaults revenue to 0 when missing from paths', async () => {
    const paths = [{ from: 'a', to: 'b', strength: 10, resistance: 1 }]
    const ctx = makeCtx({
      'units.json': JSON.stringify([]),
      'paths.json': JSON.stringify(paths),
      'toxic.json': JSON.stringify([]),
    })

    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.edges[0].revenue).toBe(0)
  })

  // ── Response shape ─────────────────────────────────────────────────────

  it('returns application/json content type', async () => {
    const ctx = makeCtx({
      'units.json': JSON.stringify([]),
      'paths.json': JSON.stringify([]),
      'toxic.json': JSON.stringify([]),
    })
    const res = await GET(ctx)
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  it('returns tags and tagMap as empty by default', async () => {
    const ctx = makeCtx({
      'units.json': JSON.stringify([]),
      'paths.json': JSON.stringify([]),
      'toxic.json': JSON.stringify([]),
    })
    const res = await GET(ctx)
    const body = (await res.json()) as Record<string, any>

    expect(body.tags).toEqual([])
    expect(body.tagMap).toEqual({})
  })
})
