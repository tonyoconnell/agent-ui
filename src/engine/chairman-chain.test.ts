/**
 * chairman-chain.test.ts — Zero-LLM Chairman→CEO→Director→Specialist routing.
 *
 * Run: bun vitest run src/engine/chairman-chain.test.ts
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetClassifierForTests, setClassifierForTests } from './ceo-classifier'
import {
  createDirector,
  DEFAULT_MARKETING_TEAM,
  makeRouteHandler,
  pickRoute,
  registerLeavesFromEdges,
  type Specialist,
  seedDirectorTeam,
  wireChairmanChain,
} from './chairman-chain'
import { world as createWorld } from './world'

type Captured = { receiver: string; data: unknown }

const withSpecialists = (net: ReturnType<typeof createWorld>, specialists: Specialist[], capture: Captured[]) => {
  for (const sp of specialists) {
    net.add(sp.uid).on('respond', (data) => {
      capture.push({ receiver: `${sp.uid}:respond`, data })
      return { ok: true, uid: sp.uid }
    })
  }
}

describe('chairman-chain', () => {
  it('wireChairmanChain registers ceo + marketing-director with route handlers', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    const { ceo, directors } = wireChairmanChain(net)

    expect(ceo.id).toBe('ceo')
    expect(ceo.has('route')).toBe(true)
    expect(directors).toHaveLength(1)
    expect(directors[0].id).toBe('marketing-director')
    expect(directors[0].has('route')).toBe(true)
  })

  it('CEO forwards marketing signals to marketing-director', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const captured: Captured[] = []
    withSpecialists(net, DEFAULT_MARKETING_TEAM, captured)

    // marketing-director intercepts route: but we already wired it in wireChairmanChain.
    // For this test we verify the hop by capturing at the specialist.
    net.signal({
      receiver: 'ceo:route',
      data: { content: 'headline copy please', tags: ['marketing', 'copy'] },
    })
    await new Promise((r) => setTimeout(r, 20))

    expect(captured).toHaveLength(1)
    const out = captured[0]
    expect(out.receiver).toMatch(/^marketing-/)
  })

  it('CEO returns dissolved when no route exists for tag', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const out = await net.ask({
      receiver: 'ceo:route',
      data: { content: 'mystery', tags: ['unknown-tag'] },
    })

    // ask wraps the handler's return in {result: ...}; our handler returns {dissolved:true}
    const res = out.result as { dissolved?: boolean } | undefined
    expect(res?.dissolved).toBe(true)
  })

  it('director forwards to specialist via tag', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const captured: Captured[] = []
    withSpecialists(net, DEFAULT_MARKETING_TEAM, captured)

    net.signal({
      receiver: 'marketing-director:route',
      data: { content: 'optimize title tags', tags: ['seo'] },
    })
    await new Promise((r) => setTimeout(r, 20))

    expect(captured).toHaveLength(1)
    expect(captured[0].receiver).toBe('marketing-seo:respond')
  })

  it('chain breadcrumb accumulates across hops', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const captured: Captured[] = []
    withSpecialists(net, DEFAULT_MARKETING_TEAM, captured)

    net.signal({
      receiver: 'ceo:route',
      data: { content: 'ad copy', tags: ['marketing', 'copy'] },
    })
    await new Promise((r) => setTimeout(r, 20))

    expect(captured).toHaveLength(1)
    const chain = (captured[0].data as { chain: string[] }).chain
    // chairman (implicit starting default) → ceo → marketing-director
    expect(chain).toEqual(['chairman', 'ceo', 'marketing-director'])
  })

  it('routing latency p50 < 1ms for follow()', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const samples: number[] = []
    for (let i = 0; i < 1000; i++) {
      const t0 = performance.now()
      pickRoute(net, 'marketing')
      samples.push(performance.now() - t0)
    }
    samples.sort((a, b) => a - b)
    const p50 = samples[Math.floor(samples.length / 2)]
    const p95 = samples[Math.floor(samples.length * 0.95)]
    console.log(`[chairman-chain] routing p50=${p50.toFixed(4)}ms p95=${p95.toFixed(4)}ms`)
    expect(p50).toBeLessThan(1)
  })

  it('seedDirectorTeam is idempotent', () => {
    const net = createWorld() as Parameters<typeof seedDirectorTeam>[0]
    const team: Specialist[] = [{ uid: 'marketing-creative', tags: ['creative', 'copy'] }]

    seedDirectorTeam(net, 'marketing-director', team)
    const afterFirst = net.sense('creative→marketing-creative')

    seedDirectorTeam(net, 'marketing-director', team)
    seedDirectorTeam(net, 'marketing-director', team)
    const afterThird = net.sense('creative→marketing-creative')

    expect(afterFirst).toBeGreaterThan(0)
    expect(afterThird).toBe(afterFirst)
  })

  it('handler respects zero-returns: missing specialist = signal dissolves, no throw', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    // Specialist target is seeded but never added as a unit — signal dissolves silently.
    expect(() =>
      net.signal({
        receiver: 'ceo:route',
        data: { content: 'something', tags: ['marketing', 'copy'] },
      }),
    ).not.toThrow()
    // CEO hands off to marketing-director which hands off to marketing:creative (not added) — dissolves.
  })

  it('createDirector seeds the director on its own domain tag', () => {
    const net = createWorld() as Parameters<typeof createDirector>[0]
    createDirector(net, 'ops-director', 'ops', [{ uid: 'ops-deploy', tags: ['deploy'] }])
    expect(pickRoute(net, 'ops')).toBe('ops-director')
  })

  it('pickRoute(tag) returns the correct specialist uid after seeding', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    expect(pickRoute(net, 'marketing')).toBe('marketing-director')
    expect(pickRoute(net, 'seo')).toBe('marketing-seo')
    expect(pickRoute(net, 'copy')).toBe('marketing-creative')
  })
})

describe('chairman-chain CEO low-confidence LLM fallback', () => {
  afterEach(() => {
    resetClassifierForTests()
  })

  // Helper: capture director-hop signals; verify via deposits to `*-director:route`.
  const captureDirectorHop = (
    net: ReturnType<typeof createWorld>,
    directorUid: string,
  ): { hits: Array<{ data: unknown }> } => {
    const hits: Array<{ data: unknown }> = []
    const d = net.has(directorUid) ? net.get(directorUid)! : net.add(directorUid)
    d.on('route', (data) => {
      hits.push({ data })
      // Return dissolved so ask() resolves cleanly and we can observe outcome.
      return { dissolved: true }
    })
    return hits
  }

  it('1. happy path unchanged: classifier NOT called when pickRoute succeeds', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const classifier = vi.fn(async () => null)
    setClassifierForTests(classifier)

    const hits = captureDirectorHop(net as unknown as ReturnType<typeof createWorld>, 'marketing-director')

    // confidence=0.2 is low — but pickRoute('marketing') finds marketing-director.
    await net.ask({
      receiver: 'ceo:route',
      data: { content: 'seo audit please', tags: ['marketing', 'seo'], confidence: 0.2 },
    })

    expect(classifier).toHaveBeenCalledTimes(0)
    expect(hits.length).toBeGreaterThan(0)
  })

  it('2. fallback triggers on low confidence + missing path: classifier called, edge marked, signal forwarded', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    // Add a director with NO seeded edges on its domain — pickRoute fails.
    const d = net.add('ops-director')
    d.on('route', (data) => {
      return { data, handled: true }
    })

    const classifier = vi.fn(async () => ({
      directorUid: 'ops-director',
      tag: 'ops',
      confidence: 0.9,
      latencyMs: 12,
    }))
    setClassifierForTests(classifier)

    // Tag 'infra' has no edges. Low confidence triggers LLM fallback.
    const edgeBefore = net.sense('ops→ops-director')
    await net.ask({
      receiver: 'ceo:route',
      data: { content: 'server is down', tags: ['infra'], confidence: 0.1 },
    })

    expect(classifier).toHaveBeenCalledTimes(1)
    const edgeAfter = net.sense('ops→ops-director')
    expect(edgeAfter).toBeGreaterThan(edgeBefore)
  })

  it('3. fallback does NOT trigger on high confidence even with missing path', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const classifier = vi.fn(async () => null)
    setClassifierForTests(classifier)

    const out = await net.ask({
      receiver: 'ceo:route',
      data: { content: 'unknown thing', tags: ['no-such-tag'], confidence: 0.8 },
    })

    expect(classifier).toHaveBeenCalledTimes(0)
    const res = out.result as { dissolved?: boolean } | undefined
    expect(res?.dissolved).toBe(true)
  })

  it('4. LLM failure = dissolve: classifier returns null → dissolved, no throw, no mark', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    // Add a candidate director so listDirectors() returns something.
    net.add('ops-director').on('route', (data) => ({ data }))

    const classifier = vi.fn(async () => null)
    setClassifierForTests(classifier)

    const out = await net.ask({
      receiver: 'ceo:route',
      data: { content: 'mystery', tags: ['weird'], confidence: 0.1 },
    })

    expect(classifier).toHaveBeenCalledTimes(1)
    const res = out.result as { dissolved?: boolean } | undefined
    expect(res?.dissolved).toBe(true)
    // No edge should have been marked with the mystery tag.
    expect(net.sense('weird→ops-director')).toBe(0)
  })

  it('5. LLM returns invalid director uid → dissolve, no mark', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    net.add('ops-director').on('route', (data) => ({ data }))

    const classifier = vi.fn(async () => ({
      directorUid: 'not-a-real-unit',
      tag: 'ops',
      confidence: 0.9,
      latencyMs: 10,
    }))
    setClassifierForTests(classifier)

    const edgeBefore = net.sense('ops→not-a-real-unit')
    const out = await net.ask({
      receiver: 'ceo:route',
      data: { content: 'x', tags: ['x'], confidence: 0.1 },
    })

    expect(classifier).toHaveBeenCalledTimes(1)
    const res = out.result as { dissolved?: boolean } | undefined
    expect(res?.dissolved).toBe(true)
    // No mark on an invalid uid — defensive guard.
    expect(net.sense('ops→not-a-real-unit')).toBe(edgeBefore)
  })

  it('5b. classifier returning a uid the CEO filters (same as self or in chain) → dissolve', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    // Classifier returns 'ceo' — CEO-self should be rejected, triggers dissolve.
    const classifier = vi.fn(async () => ({
      directorUid: 'ceo',
      tag: 'self-loop',
      confidence: 0.99,
      latencyMs: 5,
    }))
    setClassifierForTests(classifier)

    const out = await net.ask({
      receiver: 'ceo:route',
      data: { content: 'x', tags: ['y'], confidence: 0.1 },
    })

    expect(classifier).toHaveBeenCalledTimes(1)
    const res = out.result as { dissolved?: boolean } | undefined
    expect(res?.dissolved).toBe(true)
    expect(net.sense('self-loop→ceo')).toBe(0)
  })

  it('6. second same-tag message is zero-LLM (bootstrap cost is one call per new topic)', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    // Add a reachable director.
    net.add('ops-director').on('route', (data) => {
      return { data, ok: true }
    })

    const classifier = vi.fn(async () => ({
      directorUid: 'ops-director',
      tag: 'ops',
      confidence: 0.95,
      latencyMs: 8,
    }))
    setClassifierForTests(classifier)

    // First call: cold path, classifier fires.
    await net.ask({
      receiver: 'ceo:route',
      data: { content: 'pipeline broken', tags: ['infra'], confidence: 0.1 },
    })
    expect(classifier).toHaveBeenCalledTimes(1)

    // Second call: same message, but now edge `ops→ops-director` exists from
    // the first mark. pickRoute(tags[0]='infra') still fails, but ChainData
    // also asks tags[0] — we marked on `ops`, not `infra`. So we need the
    // signal to include `ops` in tags OR the content to be re-classified.
    // The learning substrate saves future calls ONLY if the new tag matches
    // the marked tag. Simulate that by tagging the next call with 'ops'.
    await net.ask({
      receiver: 'ceo:route',
      data: { content: 'pipeline broken again', tags: ['ops'], confidence: 0.1 },
    })

    // pickRoute('ops') returns 'ops-director' from the mark — no LLM call.
    expect(classifier).toHaveBeenCalledTimes(1)
  })

  it('llmFallback=false disables fallback even at low confidence', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const classifier = vi.fn(async () => ({
      directorUid: 'marketing-director',
      tag: 'marketing',
      confidence: 0.99,
      latencyMs: 1,
    }))
    setClassifierForTests(classifier)

    await net.ask({
      receiver: 'ceo:route',
      data: { content: 'x', tags: ['no-such-tag'], confidence: 0.05, llmFallback: false },
    })

    expect(classifier).toHaveBeenCalledTimes(0)
  })

  it('classifier is injectable (not via fetch mock) and does NOT fire for hot path', async () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    wireChairmanChain(net)

    const classifier = vi.fn(async () => null)
    setClassifierForTests(classifier)

    // 200 hot-path requests, all with seeded edges (marketing).
    for (let i = 0; i < 200; i++) {
      await net.ask({
        receiver: 'ceo:route',
        data: { content: 'copy request', tags: ['marketing', 'copy'], confidence: 0.2 },
      })
    }

    expect(classifier).toHaveBeenCalledTimes(0)
  })
})

describe('chairman-chain dynamic leaf registration', () => {
  const stubFactory = (uid: string) => (_data: unknown) => ({ ok: true, uid })

  it('registerLeavesFromEdges registers respond handlers for all seeded specialists', () => {
    const net = createWorld() as Parameters<typeof registerLeavesFromEdges>[0]
    net.add('marketing-director').on('route', () => ({ ok: true }))
    // Seed like the real seed script: director→specialist AND tag→specialist.
    net.mark('marketing→marketing-director', 0.5)
    net.mark('marketing-director→marketing-seo-specialist', 0.5)
    net.mark('seo→marketing-seo-specialist', 0.5)
    net.mark('marketing-director→marketing-content-writer', 0.5)
    net.mark('content→marketing-content-writer', 0.5)
    net.mark('marketing-director→marketing-ads-manager', 0.5)
    net.mark('ads→marketing-ads-manager', 0.5)

    const { registered, skipped } = registerLeavesFromEdges(net, ['marketing-director'], stubFactory)
    expect(registered).toEqual(
      expect.arrayContaining(['marketing-seo-specialist', 'marketing-content-writer', 'marketing-ads-manager']),
    )
    expect(skipped).toHaveLength(0)
    for (const uid of registered) expect(net.get(uid)?.has('respond')).toBe(true)
  })

  it('re-running registerLeavesFromEdges is idempotent', () => {
    const net = createWorld() as Parameters<typeof registerLeavesFromEdges>[0]
    net.add('marketing-director').on('route', () => ({ ok: true }))
    net.mark('marketing-director→marketing-seo-specialist', 0.5)
    net.mark('seo→marketing-seo-specialist', 0.5)
    net.mark('marketing-director→marketing-content-writer', 0.5)
    net.mark('content→marketing-content-writer', 0.5)

    const first = registerLeavesFromEdges(net, ['marketing-director'], stubFactory)
    expect(first.registered.length).toBeGreaterThanOrEqual(2)

    const second = registerLeavesFromEdges(net, ['marketing-director'], stubFactory)
    expect(second.registered).toHaveLength(0)
    expect(second.skipped.length).toBeGreaterThanOrEqual(2)
  })

  it('wireChairmanChain auto-registers leaves from seed-script-shaped edges', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    // Simulate what scripts/seed-chairman-chain.ts writes: real specialist uids.
    const seed: Specialist[] = [
      { uid: 'marketing-seo-specialist', tags: ['seo'] },
      { uid: 'marketing-content-writer', tags: ['content'] },
      { uid: 'marketing-ads-manager', tags: ['ads'] },
      { uid: 'marketing-social-media', tags: ['social'] },
    ]

    const { registered } = wireChairmanChain(net, { specialists: seed })

    for (const sp of seed) {
      expect(registered).toContain(sp.uid)
      expect(net.get(sp.uid)?.has('respond')).toBe(true)
    }
  })

  it('wireChairmanChain does not re-register specialists that already have a respond handler', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    // Pre-register a specialist with a stub. wireChairmanChain should NOT overwrite.
    let hits = 0
    net.add('marketing-seo-specialist').on('respond', () => {
      hits++
      return { ok: true }
    })

    const { registered, skipped } = wireChairmanChain(net, {
      specialists: [{ uid: 'marketing-seo-specialist', tags: ['seo'] }],
    })

    expect(registered).not.toContain('marketing-seo-specialist')
    expect(skipped).toContain('marketing-seo-specialist')

    // The pre-existing handler is still the one wired.
    net.signal({ receiver: 'marketing-seo-specialist:respond', data: { content: 'x' } })
    expect(hits).toBe(1)
  })

  it('registerSpecialists=false skips auto-registration', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]
    const { registered } = wireChairmanChain(net, { registerSpecialists: false })
    expect(registered).toHaveLength(0)
  })
})

describe('Cycle 3: scope enforcement', () => {
  // Tests call makeRouteHandler directly to exercise the uid-prefix scope guard.
  // world.ts splits receivers on the FIRST colon (unitId = receiver.split(':')[0]),
  // so units with ':' in their uid cannot receive signals via normal routing.
  // makeRouteHandler is exported for test-only direct invocation.

  it('Test A — scope=public routes across groups (guard does not fire)', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]

    // Seed cross-group edge: tag 'seo' → 'debby:seo-specialist'
    net.mark('seo→debby:seo-specialist', 0.8)

    // Handler uid 'marketing:director' gives callerPrefix='marketing'.
    // Target 'debby:seo-specialist' gives targetPrefix='debby'.
    // With scope='public', the guard is skipped entirely.
    const handler = makeRouteHandler(net, 'marketing:director', ':respond')

    const sent: { receiver: string; data: unknown }[] = []
    const send = (s: { receiver: string; data: unknown }) => sent.push(s)

    const result = handler(
      { content: 'seo audit', tags: ['seo'], scope: 'public' },
      send as Parameters<typeof handler>[1],
      { from: 'chairman', self: 'marketing:director:route' },
    )

    // scope=public — guard is bypassed, send() is called
    expect(sent).toHaveLength(1)
    expect(sent[0].receiver).toBe('debby:seo-specialist:respond')
    expect(result).toBeUndefined()
  })

  it('Test B — scope=group dissolves cross-group route (debby: !== marketing:)', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]

    net.mark('seo→debby:seo-specialist', 0.8)

    const handler = makeRouteHandler(net, 'marketing:director', ':respond')

    const sent: { receiver: string; data: unknown }[] = []
    const send = (s: { receiver: string; data: unknown }) => sent.push(s)

    const result = handler(
      { content: 'seo audit', tags: ['seo'], scope: 'group' },
      send as Parameters<typeof handler>[1],
      { from: 'chairman', self: 'marketing:director:route' },
    )

    // callerPrefix='marketing', targetPrefix='debby' — dissolved
    const res = result as { dissolved?: boolean } | undefined
    expect(res?.dissolved).toBe(true)
    expect(sent).toHaveLength(0)
  })

  it('Test C — scope=group within same group still routes (marketing: === marketing:)', () => {
    const net = createWorld() as Parameters<typeof wireChairmanChain>[0]

    net.mark('copy→marketing:copywriter', 0.8)

    const handler = makeRouteHandler(net, 'marketing:director', ':respond')

    const sent: { receiver: string; data: unknown }[] = []
    const send = (s: { receiver: string; data: unknown }) => sent.push(s)

    const result = handler(
      { content: 'write copy', tags: ['copy'], scope: 'group' },
      send as Parameters<typeof handler>[1],
      { from: 'chairman', self: 'marketing:director:route' },
    )

    // callerPrefix='marketing', targetPrefix='marketing' — same prefix, routes through
    expect(sent).toHaveLength(1)
    expect(sent[0].receiver).toBe('marketing:copywriter:respond')
    expect(result).toBeUndefined()
  })
})
