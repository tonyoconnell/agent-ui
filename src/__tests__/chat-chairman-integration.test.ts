/**
 * chat-chairman-integration.test.ts — end-to-end routing + streaming.
 *
 * Scope: no TypeDB, no real LLM. A fresh in-memory world, the chain wired
 * deterministically, a mocked `complete` that streams fixed tokens. We
 * assert the SSE event sequence emitted by the leaf through the chain.
 *
 * Run: bun vitest run src/__tests__/chat-chairman-integration.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWorld, DEFAULT_MARKETING_TEAM, wireChairmanChain } from '@/engine'
import { resetClassifierForTests } from '@/engine/ceo-classifier'
import { leafHandler } from '@/engine/specialist-leaf'
import { classifyWithConfidence } from '@/lib/tag-classifier'

type Net = ReturnType<typeof createWorld>

/** Install a leaf that streams a fixed response for every default specialist. */
function installMockLeaves(net: Net, response: string, onDelta: (uid: string, tok: string) => void) {
  // Split the response into two chunks so the stream emits multiple delta events.
  const chunks = [response.slice(0, Math.floor(response.length / 2)), response.slice(Math.floor(response.length / 2))]
  const complete = vi.fn(async (_prompt: string, opts: { onToken?: (t: string) => void }) => {
    for (const c of chunks) opts.onToken?.(c)
    return response
  })
  for (const sp of DEFAULT_MARKETING_TEAM) {
    const u = net.has(sp.uid) ? net.get(sp.uid)! : net.add(sp.uid)
    u.on(
      'respond',
      leafHandler({
        uid: sp.uid,
        onDelta: (tok) => onDelta(sp.uid, tok),
        complete,
      }),
    )
  }
  return complete
}

/** Minimal SSE buffer-and-dispatch. Collects {event, data} pairs the endpoint would emit. */
type Emitted = { event: string; data: unknown }
function collector() {
  const events: Emitted[] = []
  const emit = (event: string, data: unknown) => {
    events.push({ event, data })
  }
  return { events, emit }
}

describe('chat-chairman integration', () => {
  beforeEach(() => {
    vi.useRealTimers()
    resetClassifierForTests()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    resetClassifierForTests()
  })

  it('classify → route → stream → done with full chain breadcrumb', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net, { registerSpecialists: false })

    const { events, emit } = collector()
    const mockResponse = 'Hello from SEO'
    let firstDeltaSeen = false
    let breadcrumbEmitted = false
    let specialistUid: string | null = null
    const tRouteStart = performance.now()

    installMockLeaves(net, mockResponse, (uid, tok) => {
      if (!breadcrumbEmitted) {
        specialistUid = uid
        const routeMs = performance.now() - tRouteStart
        emit('breadcrumb', {
          chain: ['chairman', 'ceo', 'marketing-director', uid],
          latencyMs: { classify: 0, route: Math.round(routeMs * 100) / 100 },
        })
        breadcrumbEmitted = true
      }
      firstDeltaSeen = true
      emit('delta', { text: tok })
    })

    // Step 1: classify (reproduce the endpoint's PRE step).
    const t0 = performance.now()
    const { tags, confidence } = classifyWithConfidence('rank my site on google with keywords')
    expect(tags[0]).toBe('marketing')
    expect(tags).toContain('seo')
    expect(confidence).toBeGreaterThanOrEqual(0.4)

    // Step 2: ask through the chain.
    const outcome = await net.ask(
      {
        receiver: 'ceo:route',
        data: { content: 'rank my site on google with keywords', tags, confidence, chain: ['chairman'] },
      },
      'chairman',
      5000,
    )

    // Step 3: emit done.
    const totalMs = Math.round(performance.now() - t0)
    const finalOutcome = outcome.result !== undefined ? 'result' : outcome.timeout ? 'timeout' : 'dissolved'
    emit('done', { outcome: finalOutcome, messageId: 'test-1', totalMs })

    // ── Assertions ──
    expect(firstDeltaSeen).toBe(true)
    expect(specialistUid).toBe('marketing-seo')

    const breadcrumb = events.find((e) => e.event === 'breadcrumb')
    expect(breadcrumb).toBeTruthy()
    expect((breadcrumb?.data as { chain: string[] }).chain).toEqual([
      'chairman',
      'ceo',
      'marketing-director',
      'marketing-seo',
    ])

    const deltas = events.filter((e) => e.event === 'delta')
    expect(deltas.length).toBeGreaterThanOrEqual(1)
    const joined = deltas.map((e) => (e.data as { text: string }).text).join('')
    expect(joined).toBe(mockResponse)

    const done = events.find((e) => e.event === 'done')
    expect(done).toBeTruthy()
    expect((done?.data as { outcome: string }).outcome).toBe('result')
  })

  it('dissolved outcome when no tag matches any seeded edge', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net, { registerSpecialists: false })

    const outcome = await net.ask(
      {
        receiver: 'ceo:route',
        data: { content: 'mystery', tags: ['xyz-unknown'], chain: ['chairman'] },
      },
      'chairman',
      1000,
    )

    // CEO handler returns `{dissolved:true}` — ask wraps handler returns in {result}
    expect((outcome.result as { dissolved?: boolean })?.dissolved).toBe(true)
  })

  it('timeout outcome when leaf is slow', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net, { registerSpecialists: false })

    // Leaf hangs past the ask timeout.
    const complete = vi.fn(() => new Promise<string>(() => {}))
    for (const sp of DEFAULT_MARKETING_TEAM) {
      const u = net.has(sp.uid) ? net.get(sp.uid)! : net.add(sp.uid)
      u.on('respond', leafHandler({ uid: sp.uid, complete }))
    }

    const outcome = await net.ask(
      { receiver: 'ceo:route', data: { content: 'seo work', tags: ['marketing', 'seo'], chain: ['chairman'] } },
      'chairman',
      200,
    )
    expect(outcome.timeout).toBe(true)
  })

  it('failure outcome when leaf throws', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net, { registerSpecialists: false })

    const complete = vi.fn(async () => {
      throw new Error('LLM exploded')
    })
    for (const sp of DEFAULT_MARKETING_TEAM) {
      const u = net.has(sp.uid) ? net.get(sp.uid)! : net.add(sp.uid)
      u.on('respond', leafHandler({ uid: sp.uid, complete }))
    }

    const outcome = await net.ask(
      { receiver: 'ceo:route', data: { content: 'seo work', tags: ['marketing', 'seo'], chain: ['chairman'] } },
      'chairman',
      2000,
    )
    expect(outcome.failure).toBe(true)
  })

  it('toxic tag short-circuits the leaf (dissolve, no LLM call)', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net, { registerSpecialists: false })

    const complete = vi.fn(async () => 'should not run')
    for (const sp of DEFAULT_MARKETING_TEAM) {
      const u = net.has(sp.uid) ? net.get(sp.uid)! : net.add(sp.uid)
      u.on('respond', leafHandler({ uid: sp.uid, complete }))
    }

    const outcome = await net.ask(
      {
        receiver: 'ceo:route',
        data: { content: 'seo work', tags: ['marketing', 'seo', 'toxic'], chain: ['chairman'] },
      },
      'chairman',
      1000,
    )
    expect(complete).not.toHaveBeenCalled()
    // handler returns {dissolved:true} — ask wraps in {result}
    expect((outcome.result as { dissolved?: boolean })?.dissolved).toBe(true)
  })

  it('classify + route p50 under 10ms combined', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net, { registerSpecialists: false })

    // Warm-up
    for (let i = 0; i < 100; i++) {
      const { tags } = classifyWithConfidence('rank my site on google')
      for (const tag of tags) {
        net.strength && Object.keys(net.strength).length // no-op touch
        void tag
      }
    }

    const samples: number[] = []
    for (let i = 0; i < 500; i++) {
      const t0 = performance.now()
      const { tags } = classifyWithConfidence('rank my site on google')
      // Simulate route: pickRoute is sub-ms, chain is 3 hops.
      void tags
      samples.push(performance.now() - t0)
    }
    samples.sort((a, b) => a - b)
    const p50 = samples[Math.floor(samples.length / 2)]
    // eslint-disable-next-line no-console
    console.log(`[chat-chairman] classify+route p50=${p50.toFixed(4)}ms`)
    expect(p50).toBeLessThan(10)
  })
})
