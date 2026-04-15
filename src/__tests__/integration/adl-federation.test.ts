/**
 * adl-federation.test.ts — ADL Cycle 3: register() fires ADL fetch from peer endpoint
 *
 * Verifies:
 * 1. register() with endpoint → fetch called for /.well-known/agents.json
 * 2. register() without endpoint → fetch NOT called
 * 3. Peer has ADL → syncAdl() called with the document
 * 4. Peer returns 404 → fail-open (syncAdl not called, no throw)
 * 5. Peer fetch throws → fail-open (no throw from register)
 *
 * Strategy: mock globalThis.fetch + @/engine/adl; call register(); await microtask queue.
 * Real world() runs — no mock needed for the substrate layer.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const syncAdlMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/engine/adl', () => ({
  syncAdl: syncAdlMock,
  augmentPromptWithADL: vi.fn().mockImplementation((_uid: string, p: string) => Promise.resolve(p)),
  adlFromUnit: vi.fn().mockResolvedValue(null),
  default: {},
}))

const SAMPLE_ADL = {
  id: 'https://peer.example.com/agent',
  name: 'Peer Agent',
  version: '1.0.0',
  adlVersion: '0.2.0',
  status: 'active',
}

describe('ADL Cycle 3: federation — register() ADL fetch', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('register() with endpoint → fetches /.well-known/agents.json', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SAMPLE_ADL),
    }) as unknown as typeof fetch

    const { agentverse } = await import('@/engine/agentverse')
    const av = agentverse(vi.fn())
    av.register({ address: 'agent1', name: 'Test', domains: [], endpoint: 'https://peer.example.com' })

    // Wait for fire-and-forget promise chain to settle
    await new Promise((r) => setTimeout(r, 50))

    expect(globalThis.fetch).toHaveBeenCalledWith('https://peer.example.com/.well-known/agents.json')
  })

  it('register() with endpoint + valid ADL → syncAdl called with document', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SAMPLE_ADL),
    }) as unknown as typeof fetch

    const { agentverse } = await import('@/engine/agentverse')
    const av = agentverse(vi.fn())
    av.register({ address: 'agent1', name: 'Test', domains: [], endpoint: 'https://peer.example.com' })

    await new Promise((r) => setTimeout(r, 50))

    expect(syncAdlMock).toHaveBeenCalledWith(SAMPLE_ADL)
  })

  it('register() without endpoint → fetch NOT called', async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch

    const { agentverse } = await import('@/engine/agentverse')
    const av = agentverse(vi.fn())
    av.register({ address: 'agent1', name: 'Test', domains: [] })

    await new Promise((r) => setTimeout(r, 50))

    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('peer returns 404 → fail-open, syncAdl not called', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch

    const { agentverse } = await import('@/engine/agentverse')
    const av = agentverse(vi.fn())
    av.register({ address: 'agent1', name: 'Test', domains: [], endpoint: 'https://peer.example.com' })

    await new Promise((r) => setTimeout(r, 50))

    expect(syncAdlMock).not.toHaveBeenCalled()
  })

  it('peer fetch throws → fail-open, register() does not throw', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch

    const { agentverse } = await import('@/engine/agentverse')
    const av = agentverse(vi.fn())

    // register() itself must not throw — fire-and-forget swallows the error
    expect(() =>
      av.register({ address: 'agent1', name: 'Test', domains: [], endpoint: 'https://peer.example.com' }),
    ).not.toThrow()

    await new Promise((r) => setTimeout(r, 50))

    // syncAdl must not have been called when fetch threw
    expect(syncAdlMock).not.toHaveBeenCalled()
  })
})
