/**
 * agentverse-connect.test.ts — connectAgentverse() + /api/av/in webhook
 *
 * Locks the namespace contract: `av:<address>` is a substrate receiver.
 *   - Outbound: send('addr', data) → world.signal({ receiver: 'av:addr', data })
 *   - Inbound:  receive(from, to, data) → world.signal({ receiver: to, data }, 'av:from')
 *
 * Pheromone accumulates on `av:*` edges in the caller's world — no separate world.
 * Slow/failing AV agents get routed around via the standard 4-outcome loop.
 *
 * Locks the webhook contract:
 *   - Missing/invalid secret → 401
 *   - Malformed body → 400
 *   - Valid body → 202 + net.signal(to, data, 'av:from')
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('connectAgentverse — namespace + fail-closed', () => {
  let originalFetch: typeof globalThis.fetch
  const originalKey = process.env.AGENTVERSE_API_KEY

  beforeEach(() => {
    vi.resetModules()
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.AGENTVERSE_API_KEY
    else process.env.AGENTVERSE_API_KEY = originalKey
  })

  it('returns null when AGENTVERSE_API_KEY is unset (boot must not break)', async () => {
    delete process.env.AGENTVERSE_API_KEY
    const { world } = await import('@/engine/world')
    const { connectAgentverse } = await import('@/engine/agentverse-connect')

    const w = world()
    const av = await connectAgentverse(w)

    expect(av).toBeNull()
  })

  it('send(addr, data) routes through world as av:addr receiver', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as unknown as typeof fetch

    const { world } = await import('@/engine/world')
    const { connectAgentverse } = await import('@/engine/agentverse-connect')

    const w = world()
    const signalSpy = vi.spyOn(w, 'signal')
    const av = await connectAgentverse(w, { apiKey: 'test-key' })
    expect(av).not.toBeNull()

    av?.send('agent1abc', { hello: 'world' }, 'writer')

    expect(signalSpy).toHaveBeenCalledWith({ receiver: 'av:agent1abc', data: { hello: 'world' } }, 'writer')
  })

  it('receive(from, to, data) emits into world with av:from as sender', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as unknown as typeof fetch

    const { world } = await import('@/engine/world')
    const { connectAgentverse } = await import('@/engine/agentverse-connect')

    const w = world()
    const signalSpy = vi.spyOn(w, 'signal')
    const av = await connectAgentverse(w, { apiKey: 'test-key' })

    av?.receive('agent2xyz', 'writer:edit', { payload: 'from AV' })

    expect(signalSpy).toHaveBeenCalledWith({ receiver: 'writer:edit', data: { payload: 'from AV' } }, 'av:agent2xyz')
  })

  it('highways filters to only edges crossing the av boundary', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as unknown as typeof fetch

    const { world } = await import('@/engine/world')
    const { connectAgentverse } = await import('@/engine/agentverse-connect')

    const w = world()
    w.add('writer')
    w.add('editor')
    w.add('av:agent1abc')
    // Seed pheromone on both local and AV edges
    w.mark('writer→editor', 10)
    w.mark('writer→av:agent1abc', 5)

    const av = await connectAgentverse(w, { apiKey: 'test-key' })
    const highways = av?.highways(20) ?? []

    expect(highways.every((h) => h.path.includes('av:'))).toBe(true)
    expect(highways.some((h) => h.path === 'writer→av:agent1abc')).toBe(true)
    expect(highways.some((h) => h.path === 'writer→editor')).toBe(false)
  })
})

describe('POST /api/av/in — inbound webhook', () => {
  const mockSignal = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    mockSignal.mockReset()
    delete process.env.AGENTVERSE_WEBHOOK_SECRET
  })

  afterEach(() => {
    delete process.env.AGENTVERSE_WEBHOOK_SECRET
  })

  const loadRoute = async () => {
    vi.doMock('@/lib/net', () => ({
      getNet: vi.fn().mockResolvedValue({ signal: mockSignal }),
    }))
    const mod = await import('@/pages/api/av/in')
    return mod.POST
  }

  it('rejects when secret set and header missing → 401', async () => {
    process.env.AGENTVERSE_WEBHOOK_SECRET = 'shh'
    const POST = await loadRoute()

    const res = await POST({
      request: new Request('http://test/api/av/in', {
        method: 'POST',
        body: JSON.stringify({ from: 'a', to: 'b' }),
      }),
    } as Parameters<typeof POST>[0])

    expect(res.status).toBe(401)
    expect(mockSignal).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON → 400', async () => {
    const POST = await loadRoute()

    const res = await POST({
      request: new Request('http://test/api/av/in', {
        method: 'POST',
        body: 'not json',
      }),
    } as Parameters<typeof POST>[0])

    expect(res.status).toBe(400)
  })

  it('rejects invalid uid format (injection guard) → 400', async () => {
    const POST = await loadRoute()

    const res = await POST({
      request: new Request('http://test/api/av/in', {
        method: 'POST',
        body: JSON.stringify({ from: 'a b c', to: 'writer', data: {} }),
      }),
    } as Parameters<typeof POST>[0])

    expect(res.status).toBe(400)
    expect(mockSignal).not.toHaveBeenCalled()
  })

  it('valid body → 202 + net.signal(to, data, av:from)', async () => {
    const POST = await loadRoute()

    const res = await POST({
      request: new Request('http://test/api/av/in', {
        method: 'POST',
        body: JSON.stringify({ from: 'agent1abc', to: 'writer', data: { text: 'hi' } }),
      }),
    } as Parameters<typeof POST>[0])

    expect(res.status).toBe(202)
    expect(mockSignal).toHaveBeenCalledWith({ receiver: 'writer', data: { text: 'hi' } }, 'av:agent1abc')
  })

  it('valid body with matching secret → 202', async () => {
    process.env.AGENTVERSE_WEBHOOK_SECRET = 'shh'
    const POST = await loadRoute()

    const res = await POST({
      request: new Request('http://test/api/av/in', {
        method: 'POST',
        headers: { 'X-Agentverse-Secret': 'shh' },
        body: JSON.stringify({ from: 'agent1abc', to: 'writer', data: {} }),
      }),
    } as Parameters<typeof POST>[0])

    expect(res.status).toBe(202)
    expect(mockSignal).toHaveBeenCalledTimes(1)
  })
})
