/**
 * adl-evolution.test.ts — ADL Cycle 3: evolved prompts get [OPERATIONAL CONSTRAINTS]
 *
 * Verifies that augmentPromptWithADL is called on every evolved prompt before
 * writing to TypeDB, and fails open when augmentation throws.
 *
 * Strategy: mock augmentPromptWithADL + complete fn + readParsed, trigger tick(),
 * assert augmentPromptWithADL was called with correct uid + prompt.
 *
 * tick(net, complete) signature — state (lastEvolve etc.) is module-level in loop.ts,
 * initialized to 0, so the first tick call with a complete fn always runs evolution.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  // writeSilent is called with .catch() chained on it — must return a Promise
  writeSilent: vi.fn().mockResolvedValue(undefined),
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
  inferDocsFromTags: vi.fn(() => []),
}))
vi.mock('@/engine/task-parse', () => ({
  EFFORT_MODEL: 'test-model',
  WAVE_MODEL: 'test-model',
}))

// Mock augmentPromptWithADL — this is what we're verifying gets called
const mockAugment = vi.fn().mockImplementation((_uid: string, prompt: string) =>
  Promise.resolve(`${prompt}\n\n[OPERATIONAL CONSTRAINTS]\nData classification: internal`),
)
vi.mock('@/engine/adl', () => ({
  augmentPromptWithADL: mockAugment,
  default: {},
}))

import { readParsed, writeSilent } from '@/lib/typedb'

// A unit whose success-rate (sr) is below EVOLUTION_THRESHOLD (0.5)
// and sample-count (sc) is above EVOLUTION_MIN_SAMPLES (20).
// loop.ts query selects: $id, $sp, $sr, $sc, $g, $sid, $tag
const STRUGGLING_UNIT = {
  id: 'test-agent',
  sp: 'You are a test agent.',
  sr: 0.3,
  sc: 25,
  g: 1,
  sid: 'test-agent:task',
  tag: 'test',
}

// Minimal PersistentWorld mock satisfying all net.* calls in tick()
function makeMockNet() {
  return {
    select: vi.fn().mockReturnValue(null),
    follow: vi.fn().mockReturnValue(null),
    signal: vi.fn(),
    drain: vi.fn(),
    fade: vi.fn(),
    mark: vi.fn(),
    warn: vi.fn(),
    sense: vi.fn().mockReturnValue(0),
    danger: vi.fn().mockReturnValue(0),
    ask: vi.fn().mockResolvedValue({ dissolved: true }),
    enqueue: vi.fn(),
    recall: vi.fn().mockResolvedValue([]),
    know: vi.fn().mockResolvedValue([]),
    frontier: vi.fn().mockResolvedValue([]),
    taskBlockers: vi.fn().mockResolvedValue([]),
    highways: vi.fn().mockReturnValue([]),
    list: vi.fn().mockReturnValue([]),
    // strength is accessed as a property in loop.ts (Object.keys(net.strength))
    strength: {} as Record<string, number>,
  } as unknown as import('@/engine/persist').PersistentWorld
}

describe('ADL Cycle 3: evolution prompt augmentation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('augmentPromptWithADL is called with uid and the raw evolved prompt', async () => {
    // readParsed returns the struggling unit for the evolution query, empty for all others
    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((q: string) => {
      if (q.includes('success-rate') && q.includes('sample-count')) {
        return Promise.resolve([STRUGGLING_UNIT])
      }
      // rollback hypothesis query (hid contains "evolve-")
      if (q.includes('evolve-')) return Promise.resolve([])
      // revenue query
      if (q.includes('revenue')) return Promise.resolve([])
      return Promise.resolve([])
    })

    const evolvedPrompt = 'You are an improved test agent.'
    const mockComplete = vi.fn().mockResolvedValue(evolvedPrompt)

    const { augmentPromptWithADL } = await import('@/engine/adl')
    const { tick } = await import('@/engine/loop')

    const mockNet = makeMockNet()

    await tick(mockNet, mockComplete)

    expect(augmentPromptWithADL).toHaveBeenCalledWith('test-agent', evolvedPrompt)
  })

  it('augmentPromptWithADL receives the raw LLM output (not the original prompt)', async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((q: string) => {
      if (q.includes('success-rate') && q.includes('sample-count')) {
        return Promise.resolve([STRUGGLING_UNIT])
      }
      if (q.includes('evolve-')) return Promise.resolve([])
      if (q.includes('revenue')) return Promise.resolve([])
      return Promise.resolve([])
    })

    const evolvedPrompt = 'Completely rewritten prompt.'
    const mockComplete = vi.fn().mockResolvedValue(evolvedPrompt)

    const { augmentPromptWithADL } = await import('@/engine/adl')
    const { tick } = await import('@/engine/loop')

    await tick(makeMockNet(), mockComplete)

    // Second arg must be the evolved (LLM-rewritten) prompt, not the original
    const calls = (augmentPromptWithADL as ReturnType<typeof vi.fn>).mock.calls
    expect(calls[0][1]).toBe(evolvedPrompt)
    expect(calls[0][1]).not.toBe(STRUGGLING_UNIT.sp)
  })

  it('fails open: writeSilent is still called with original prompt when augmentPromptWithADL throws', async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((q: string) => {
      if (q.includes('success-rate') && q.includes('sample-count')) {
        return Promise.resolve([STRUGGLING_UNIT])
      }
      if (q.includes('evolve-')) return Promise.resolve([])
      if (q.includes('revenue')) return Promise.resolve([])
      return Promise.resolve([])
    })

    const evolvedPrompt = 'You are an improved test agent.'
    const mockComplete = vi.fn().mockResolvedValue(evolvedPrompt)

    // Make augmentation throw to exercise the .catch(() => prompt) fallback in loop.ts
    mockAugment.mockRejectedValueOnce(new Error('TypeDB unavailable'))

    const { tick } = await import('@/engine/loop')
    const mockNet = makeMockNet()

    // tick must not throw even when augmentPromptWithADL rejects
    await expect(tick(mockNet, mockComplete)).resolves.toBeDefined()

    // writeSilent should still be called with a system-prompt update containing the evolved text
    const writeCalls = (writeSilent as ReturnType<typeof vi.fn>).mock.calls
    const systemPromptWrite = writeCalls.find(
      ([q]: [string]) => typeof q === 'string' && q.includes('system-prompt') && q.includes('improved'),
    )
    expect(systemPromptWrite).toBeDefined()
  })
})
