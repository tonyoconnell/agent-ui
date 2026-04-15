/**
 * Wave 2 — Lifecycle stage speed.
 *
 * Walks each stage of lifecycle.md (REGISTER → CAPABLE → DISCOVER → SIGNAL →
 * MARK → HIGHWAY → FEDERATE) and records the substrate-side cost of each
 * transition. TypeDB writes are stubbed; Sui is stubbed. We measure the
 * code we wrote, not the network.
 */
import { beforeAll, describe, test, vi } from 'vitest'
import { measure, measureSync } from '@/__tests__/helpers/speed'
import { createWorld } from '@/engine'
import { parse } from '@/engine/agent-md'

async function freshSui() {
  ;(import.meta.env as Record<string, string>).SUI_SEED = Buffer.from(new Uint8Array(32).fill(3)).toString('base64')
  vi.resetModules()
  return import('@/lib/sui')
}

const SAMPLE_MD = `---
name: bench-agent
model: claude-sonnet-4-20250514
channels: [telegram]
skills:
  - name: translate
    price: 0.01
    tags: [language, translate]
  - name: summarize
    price: 0.02
    tags: [content, summary]
sensitivity: 0.6
---

You are a bench agent. Translate and summarize.`

beforeAll(() => {
  ;(import.meta.env as Record<string, string>).SUI_SEED = Buffer.from(new Uint8Array(32).fill(3)).toString('base64')
})

describe('system speed — lifecycle stages', () => {
  test('REGISTER — parse + derive + wire (substrate-side only)', async () => {
    const { deriveKeypair } = await freshSui()
    await measure(
      'lifecycle:register',
      async () => {
        const spec = parse(SAMPLE_MD)
        await deriveKeypair(spec.name)
        const net = createWorld()
        net.add(spec.name)
      },
      30,
    )
  })

  test('CAPABLE — insert capability record (in-memory shape)', () => {
    const spec = parse(SAMPLE_MD)
    // Models the TQL insert shape without hitting TypeDB. Measures
    // serialization + the string concat we do before writeSilent().
    measureSync(
      'lifecycle:capable:build',
      () => {
        const skills = spec.skills ?? []
        return skills.map((s) => `insert $c (provider: $u, offered: $s) isa capability, has price ${s.price};`)
      },
      2_000,
    )
  })

  test('DISCOVER — optimalRoute over paths', async () => {
    const { optimalRoute } = await import('@/lib/edge')
    const kv = {
      get: async (k: string) => {
        if (k === 'skills.json') {
          return JSON.stringify({ translate: { providers: ['a', 'b', 'c', 'd'], price: 0.01 } })
        }
        if (k === 'paths.json') {
          return JSON.stringify({
            'caller→a': { strength: 5, resistance: 2 },
            'caller→b': { strength: 8, resistance: 1 },
            'caller→c': { strength: 3, resistance: 0 },
            'caller→d': { strength: 10, resistance: 5 },
          })
        }
        return null
      },
    } as unknown as KVNamespace
    await optimalRoute(kv, 'caller', 'translate') // prime cache
    await measure('lifecycle:discover', () => optimalRoute(kv, 'caller', 'translate'), 2_000)
  })

  test('SIGNAL → MARK — full round (in-memory chain)', async () => {
    const net = createWorld()
    net.add('a').on('default', async () => 'ok')
    await measure(
      'lifecycle:signal+mark',
      async () => {
        const r = await net.ask({ receiver: 'a', data: {} })
        if (r.result) net.mark('caller→a', 1)
      },
      200,
    )
  })

  test('HIGHWAY — select routes straight to proven path', () => {
    const net = createWorld()
    // Proven highway + many weaker alternatives
    net.add('proven')
    net.mark('caller→proven', 50)
    for (let i = 0; i < 50; i++) {
      net.add(`weak-${i}`)
      net.mark(`caller→weak-${i}`, 0.1)
    }
    measureSync('lifecycle:highway:select', () => net.follow(), 5_000)
  })

  test('FEDERATE — cross-group signal dispatch', () => {
    // Model: same runtime, two group namespaces. Dispatch time should be
    // identical to intra-group; federation adds TypeDB write not latency.
    const net = createWorld()
    net.add('groupA:agent').on('default', () => Promise.resolve('ok'))
    net.add('groupB:agent').on('default', () => Promise.resolve('ok'))
    measureSync(
      'lifecycle:federate:hop',
      () => net.signal({ receiver: 'groupB:agent', data: { from: 'groupA:agent' } }),
      2_000,
    )
  })

  test('E2E — REGISTER → SIGNAL → MARK → HIGHWAY (one sample)', async () => {
    const { deriveKeypair } = await freshSui()
    await measure(
      'lifecycle:e2e',
      async () => {
        const spec = parse(SAMPLE_MD)
        await deriveKeypair(spec.name)
        const net = createWorld()
        net.add(spec.name).on('default', async () => 'done')
        for (let i = 0; i < 10; i++) {
          const r = await net.ask({ receiver: spec.name, data: {} })
          if (r.result) net.mark(`caller→${spec.name}`, 1)
        }
        net.follow() // highway exists
      },
      5,
    )
  })
})
