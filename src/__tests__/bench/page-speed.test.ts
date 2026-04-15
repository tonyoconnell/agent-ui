/**
 * Wave 5 — Pages + TypeDB boot.
 *
 * Measures the cost of SSR-adjacent work that runs on every page request
 * (JSON serialization, data shape assembly) and the TypeDB read path we
 * hit on cold boot.
 *
 * Astro's container API spins up a full render context which is heavy and
 * brittle for CI. Instead we measure the PAYLOAD SHAPING that happens
 * inside each page's frontmatter — which is where the substrate cost lives.
 */
import { describe, test } from 'vitest'
import { measure, measureSync } from '@/__tests__/helpers/speed'

describe('system speed — page SSR payloads', () => {
  test('page:ssr:world — build payload from KV snapshots', async () => {
    const { getPaths, getUnits, getHighways } = await import('@/lib/edge')
    const kv = {
      get: async (k: string) => {
        if (k === 'paths.json') {
          const out: Record<string, { strength: number; resistance: number }> = {}
          for (let i = 0; i < 200; i++) {
            out[`u0→u${i}`] = { strength: Math.random() * 10, resistance: Math.random() * 2 }
          }
          return JSON.stringify(out)
        }
        if (k === 'units.json') {
          const out: Record<string, { kind: string; status: string }> = {}
          for (let i = 0; i < 50; i++) out[`u${i}`] = { kind: 'agent', status: 'active' }
          return JSON.stringify(out)
        }
        if (k === 'highways.json') {
          return JSON.stringify(
            Array.from({ length: 20 }, (_, i) => ({
              from: 'u0',
              to: `u${i}`,
              strength: 10 - i,
            })),
          )
        }
        return null
      },
    } as unknown as KVNamespace
    // Prime caches
    await Promise.all([getPaths(kv), getUnits(kv), getHighways(kv)])
    // Measure the "typical page payload assembly" — parallel cache reads
    await measure('page:ssr:world', () => Promise.all([getPaths(kv), getUnits(kv), getHighways(kv, 20)]), 500)
  })

  test('page:ssr:chat — minimal payload (config only)', async () => {
    // Chat page reads a small config object — baseline for "lightest page"
    measureSync(
      'page:ssr:chat:config',
      () => ({
        model: 'meta-llama/llama-4-maverick',
        maxTokens: 2048,
        temperature: 0.7,
      }),
      5_000,
    )
  })
})

describe('system speed — TypeDB read path (stubbed)', () => {
  test('typedb:read:parse — row array deserialization', () => {
    // readParsed's expensive part is JSON parsing + row reshaping.
    // Measure that with a realistic response payload size.
    const rows = Array.from({ length: 50 }, (_, i) => ({
      'u.uid': { value: `unit-${i}` },
      'u.name': { value: `Unit ${i}` },
      'u.model': { value: 'claude-sonnet-4' },
      'u.sample-count': { value: String(Math.floor(Math.random() * 100)) },
      'u.success-rate': { value: String(Math.random()) },
    }))
    const payload = JSON.stringify({ data: rows })
    measureSync(
      'typedb:read:parse',
      () => {
        const parsed = JSON.parse(payload) as { data: Array<Record<string, { value: string }>> }
        return parsed.data.map((r) => {
          const out: Record<string, string> = {}
          for (const [k, v] of Object.entries(r)) {
            out[k.replace(/^[^.]+\./, '')] = v.value
          }
          return out
        })
      },
      1_000,
    )
  })

  test('typedb:read:boot — parallel hydration (5 queries)', async () => {
    const fakeFetch = async () => new Response(JSON.stringify({ data: [] }), { status: 200 })
    await measure('typedb:read:boot', () => Promise.all(Array.from({ length: 5 }, fakeFetch)), 200)
  })
})
