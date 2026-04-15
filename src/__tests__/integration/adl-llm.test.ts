/**
 * adl-llm.test.ts — ADL Cycle 2: LLM env permission gate in llm.ts
 *
 * Verifies that canCallLLM(callerId) correctly:
 * 1. Fails open when no perm-env is set (no rows)
 * 2. Allows callers with wildcard '*' access
 * 3. Allows callers with OPENROUTER_API_KEY in access list
 * 4. Blocks callers with restricted env (no matching key) → dissolved
 * 5. Fails open on malformed perm-env JSON
 *
 * Strategy: create a world(), inject an llm unit into net.units directly
 * (units is a Record<string, Unit> on the World interface), signal it,
 * then assert whether mockComplete was called.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
  parseAnswers: vi.fn(() => []),
  read: vi.fn(() => []),
}))
vi.mock('@/lib/security-signals', () => ({ emitSecurityEvent: vi.fn() }))
vi.mock('@/engine/bridge', () => ({
  mirrorActor: vi.fn(),
  mirrorMark: vi.fn(),
  mirrorWarn: vi.fn(),
  settleEscrow: vi.fn(),
}))
vi.mock('@/lib/ws-server', () => ({
  wsManager: { broadcast: vi.fn() },
  relayToGateway: vi.fn(),
}))
vi.mock('@/engine/context', () => ({
  ingestDocs: vi.fn(),
  loadContext: vi.fn(() => ({})),
}))

import { readParsed } from '@/lib/typedb'

describe('ADL Cycle 2: LLM env permission gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('caller with no perm-env → fail-open, LLM allowed', async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const mockComplete = vi.fn().mockResolvedValue('response text')
    const { world } = await import('@/engine/world')
    const { llm } = await import('@/engine/llm')

    const net = world()
    const llmUnit = llm('test-llm', mockComplete)
    net.units['test-llm'] = llmUnit

    net.signal({ receiver: 'test-llm:complete', data: { prompt: 'test' } }, 'caller-id')
    await new Promise((r) => setTimeout(r, 50))

    expect(mockComplete).toHaveBeenCalled()
  })

  it("caller with wildcard '*' access → LLM allowed", async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([{ pe: JSON.stringify({ access: ['*'] }) }])

    const mockComplete = vi.fn().mockResolvedValue('response text')
    const { world } = await import('@/engine/world')
    const { llm } = await import('@/engine/llm')

    const net = world()
    const llmUnit = llm('test-llm', mockComplete)
    net.units['test-llm'] = llmUnit

    net.signal({ receiver: 'test-llm:complete', data: { prompt: 'test' } }, 'caller-id')
    await new Promise((r) => setTimeout(r, 50))

    expect(mockComplete).toHaveBeenCalled()
  })

  it('caller with OPENROUTER_API_KEY in access → LLM allowed', async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([
      { pe: JSON.stringify({ access: ['OPENROUTER_API_KEY'] }) },
    ])

    const mockComplete = vi.fn().mockResolvedValue('response text')
    const { world } = await import('@/engine/world')
    const { llm } = await import('@/engine/llm')

    const net = world()
    const llmUnit = llm('test-llm', mockComplete)
    net.units['test-llm'] = llmUnit

    net.signal({ receiver: 'test-llm:complete', data: { prompt: 'test' } }, 'caller-id')
    await new Promise((r) => setTimeout(r, 50))

    expect(mockComplete).toHaveBeenCalled()
  })

  it('caller with restricted env (no matching key) → dissolved, complete NOT called', async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([
      { pe: JSON.stringify({ access: ['SOME_OTHER_KEY', 'ANOTHER_KEY'] }) },
    ])

    const mockComplete = vi.fn().mockResolvedValue('response text')
    const { world } = await import('@/engine/world')
    const { llm } = await import('@/engine/llm')

    const net = world()
    const llmUnit = llm('test-llm', mockComplete)
    net.units['test-llm'] = llmUnit

    net.signal({ receiver: 'test-llm:complete', data: { prompt: 'test' } }, 'caller-id')
    await new Promise((r) => setTimeout(r, 50))

    expect(mockComplete).not.toHaveBeenCalled()
  })

  it('malformed perm-env JSON → fail-open, LLM allowed', async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([{ pe: 'not-valid-json{{{{' }])

    const mockComplete = vi.fn().mockResolvedValue('response text')
    const { world } = await import('@/engine/world')
    const { llm } = await import('@/engine/llm')

    const net = world()
    const llmUnit = llm('test-llm', mockComplete)
    net.units['test-llm'] = llmUnit

    net.signal({ receiver: 'test-llm:complete', data: { prompt: 'test' } }, 'caller-id')
    await new Promise((r) => setTimeout(r, 50))

    expect(mockComplete).toHaveBeenCalled()
  })
})
