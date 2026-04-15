import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../types'
import { recall } from './recall'

function makeDB(rows: Record<string, unknown>[] = []) {
  const stmt = {
    bind: vi.fn(),
    first: vi.fn(async () => rows[0] ?? null),
    run: vi.fn(async () => ({ success: true })),
    all: vi.fn(async () => ({ results: rows })),
  }
  stmt.bind.mockReturnValue(stmt)
  return { prepare: vi.fn(() => stmt), _stmt: stmt }
}

function makeKV() {
  return { get: vi.fn(async () => null), put: vi.fn(), delete: vi.fn() }
}

// Mock substrate module — actorHighways and recallHypotheses both return empty arrays
vi.mock('../lib/substrate', () => ({
  actorHighways: vi.fn(async () => []),
  recallHypotheses: vi.fn(async () => []),
  mark: vi.fn(async () => {}),
  warn: vi.fn(async () => {}),
}))

describe('recall', () => {
  it('returns empty ContextPack on cold start', async () => {
    const db = makeDB([])
    const env = { DB: db, KV: makeKV(), GATEWAY_URL: 'http://localhost' } as unknown as Env
    const pack = await recall(env, 'conv:telegram:42:nanoclaw', 'telegram:42', '@alice')
    expect(pack.profile.uid).toBe('telegram:42')
    expect(pack.profile.handle).toBe('@alice')
    expect(pack.profile.messageCount).toBe(0)
    expect(pack.hypotheses).toEqual([])
    expect(pack.highways).toEqual([])
    expect(pack.recent).toEqual([])
    expect(pack.tools).toEqual([])
  })

  it('returns recent messages from D1 (reversed chronological)', async () => {
    const db = makeDB([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ])
    const env = { DB: db, KV: makeKV(), GATEWAY_URL: 'http://localhost' } as unknown as Env
    const pack = await recall(env, 'group-1', 'telegram:42', '@alice')
    // results are reversed inside recall() — already in chronological order
    expect(pack.recent.length).toBeGreaterThan(0)
  })

  it('handles D1 errors gracefully (returns empty recent)', async () => {
    const db = {
      prepare: vi.fn(() => {
        throw new Error('D1 down')
      }),
    }
    const env = { DB: db, KV: makeKV(), GATEWAY_URL: 'http://localhost' } as unknown as Env
    const pack = await recall(env, 'group-1', 'telegram:42', '@alice')
    expect(pack.recent).toEqual([])
  })
})
