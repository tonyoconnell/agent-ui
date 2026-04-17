/**
 * V8/V9 tests for C4 UX commands:
 * - /memory returns readable card
 * - /forget double-confirms
 * - /explore returns questions
 * - Creepiness: low-confidence hypotheses never quoted verbatim in prompt
 */

import { describe, expect, it, vi } from 'vitest'
import { systemPromptWithPack } from '../lib/prompt'
import type { Env } from '../types'
import type { ContextPack } from '../units/types'
import { handleForgetCommand } from './forget'
import { handleMemoryCommand } from './memory'

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../lib/substrate', () => ({
  query: vi.fn(async () => []),
  actorHighways: vi.fn(async () => [{ to: 'seo', strength: 14 }]),
  recallHypotheses: vi.fn(async () => [
    { statement: 'user prefers code-examples', status: 'confirmed', confidence: 0.92 },
    { statement: 'user works in marketing', status: 'pending', confidence: 0.6 },
    { statement: 'user struggles with generics', status: 'speculative', confidence: 0.25 }, // should NOT appear
  ]),
}))

function makeDB(firstRow: Record<string, unknown> | null = null) {
  const stmt = {
    bind: vi.fn(),
    first: vi.fn(async () => firstRow),
    run: vi.fn(async () => ({ success: true })),
    all: vi.fn(async () => ({ results: [] })),
  }
  stmt.bind.mockReturnValue(stmt)
  return { prepare: vi.fn(() => stmt) }
}

function makeKV(store: Record<string, string> = {}) {
  return {
    get: vi.fn(async (k: string) => store[k] ?? null),
    put: vi.fn(async (k: string, v: string) => {
      store[k] = v
    }),
    delete: vi.fn(async (k: string) => {
      delete store[k]
    }),
  }
}

function makeEnv(dbRow: Record<string, unknown> | null = null, kv = makeKV()): Env {
  return {
    DB: makeDB(dbRow) as unknown as D1Database,
    KV: kv as unknown as KVNamespace,
    GATEWAY_URL: 'http://localhost',
    OPENROUTER_API_KEY: 'test',
  } as unknown as Env
}

// ─── V8: /memory ──────────────────────────────────────────────────────────

describe('/memory command (V8)', () => {
  it('returns a readable card with hypotheses and highways', async () => {
    const env = makeEnv({ cnt: 42 })
    const result = await handleMemoryCommand('telegram:42', '@alice', 'group-1', env)
    expect(result).toContain('@alice')
    expect(result).toContain('42 messages')
    expect(result).toContain('code-examples') // high-confidence → should appear
    expect(result).toContain('seo') // highway → should appear
  })

  it('returns cold-start message when nothing learned yet', async () => {
    // Override mocks to return empty for this test
    const { recallHypotheses, actorHighways } = await import('../lib/substrate')
    vi.mocked(recallHypotheses).mockResolvedValueOnce([])
    vi.mocked(actorHighways).mockResolvedValueOnce([])

    const env = makeEnv({ cnt: 0 })
    const result = await handleMemoryCommand('telegram:42', '@alice', 'group-1', env)
    expect(result).toContain('Nothing learned yet')
  })

  it('links to /forget and /explore', async () => {
    const env = makeEnv({ cnt: 5 })
    const result = await handleMemoryCommand('telegram:42', '@alice', 'group-1', env)
    expect(result).toContain('/forget')
    expect(result).toContain('/explore')
  })
})

// ─── V8: /forget double-confirm ───────────────────────────────────────────

describe('/forget command (V8)', () => {
  it('step 1: asks for confirmation and stores KV flag', async () => {
    const kv = makeKV()
    const env = makeEnv(null, kv)
    const result = await handleForgetCommand('telegram:42', '@alice', false, env)
    expect(result).toContain('Erase all memory')
    expect(result).toContain('/forget confirm')
    expect(kv.put).toHaveBeenCalledWith('forget_pending:telegram:42', '1', { expirationTtl: 300 })
  })

  it('step 2: confirms erasure when KV flag present', async () => {
    const kv = makeKV({ 'forget_pending:telegram:42': '1' })
    const env = makeEnv(null, kv)
    const result = await handleForgetCommand('telegram:42', '@alice', true, env)
    expect(result).toContain('Memory erased')
    expect(kv.delete).toHaveBeenCalledWith('forget_pending:telegram:42')
  })

  it('step 2: rejects if confirmation expired', async () => {
    const env = makeEnv(null, makeKV()) // empty KV — no pending flag
    const result = await handleForgetCommand('telegram:42', '@alice', true, env)
    expect(result).toContain('Confirmation expired')
  })
})

// ─── V9: Creepiness — low-confidence hypotheses never quoted verbatim ─────

describe('Creepiness test (V9)', () => {
  it('prompt does NOT quote low-confidence hypotheses verbatim', () => {
    const pack: ContextPack = {
      profile: { uid: 'telegram:42', handle: '@alice', messageCount: 2 },
      hypotheses: [
        { statement: 'user prefers typescript', status: 'speculative', confidence: 0.3 }, // below threshold
        { statement: 'user works in finance', status: 'speculative', confidence: 0.45 }, // below threshold
      ],
      highways: [],
      recent: [],
      tools: [],
    }
    // Low-confidence pack → should NOT add memory block (both below 0.5 threshold)
    const result = systemPromptWithPack('You are a helpful assistant.', pack)
    expect(result).toBe('You are a helpful assistant.')
    expect(result).not.toContain('typescript')
    expect(result).not.toContain('finance')
  })

  it('prompt uses [hint] language for mid-confidence, [fact] for high-confidence', () => {
    const pack: ContextPack = {
      profile: { uid: 'telegram:42', handle: '@alice', messageCount: 20 },
      hypotheses: [
        { statement: 'user prefers code-examples', status: 'confirmed', confidence: 0.92 }, // [fact]
        { statement: 'user works in marketing', status: 'pending', confidence: 0.65 }, // [hint]
        { statement: 'user dislikes long-prose', status: 'speculative', confidence: 0.2 }, // excluded
      ],
      highways: [],
      recent: [],
      tools: [],
    }
    const result = systemPromptWithPack('Base prompt.', pack)
    expect(result).toContain('[fact]')
    expect(result).toContain('code-examples')
    expect(result).toContain('[hint]')
    expect(result).toContain('marketing')
    expect(result).not.toContain('long-prose') // excluded (< 0.5)
  })
})
