/**
 * Edge cache — TTL, invalidation, hit speed.
 *
 * The three-layer cache (TypeDB → KV → globalThis) is the speed story.
 * If this breaks silently, every API route slows by 10–100ms. These tests
 * pin the contract: hits are ~0ms, invalidation works, readers shape-check.
 */
import { beforeEach, describe, expect, test } from 'vitest'
import { measureSync } from '@/__tests__/helpers/speed'

// Minimal in-memory KVNamespace mock — only the methods edge.ts uses.
function mockKv(store: Record<string, string>) {
  return {
    get: async (key: string, _opts?: { cacheTtl?: number }) => store[key] ?? null,
    put: async () => {},
    delete: async () => {},
    list: async () => ({ keys: [], list_complete: true, cursor: '' }),
  } as unknown as KVNamespace
}

beforeEach(async () => {
  // edge.ts captures `_cache` by reference at module load, so we must clear
  // keys on the existing object — not reassign globalThis._edgeKvCache.
  await import('./edge')
  const cache = (globalThis as { _edgeKvCache?: Map<string, unknown> })._edgeKvCache
  cache?.clear()
})

describe('edge cache — TTL + invalidation', () => {
  test('second call hits in-process cache (no KV read)', async () => {
    const { getPaths } = await import('./edge')
    let kvReads = 0
    const kv = {
      get: async (k: string) => {
        kvReads++
        return k === 'paths.json' ? JSON.stringify({ 'a→b': { strength: 1, resistance: 0 } }) : null
      },
    } as unknown as KVNamespace
    await getPaths(kv)
    await getPaths(kv)
    await getPaths(kv)
    // fetchFromKv reads data + version:key in parallel (2 reads on cold miss), then cached
    expect(kvReads).toBe(2)
  })

  test('kvInvalidate forces next read to hit KV', async () => {
    const { getPaths, kvInvalidate } = await import('./edge')
    let kvReads = 0
    const kv = {
      get: async () => {
        kvReads++
        return JSON.stringify({})
      },
    } as unknown as KVNamespace
    await getPaths(kv)
    kvInvalidate('paths.json')
    await getPaths(kv)
    // 2 reads per cold miss (data + version key)
    expect(kvReads).toBe(4)
  })

  test('missing key returns empty object (not null)', async () => {
    const { getPaths, getUnits, getSkills } = await import('./edge')
    const kv = mockKv({})
    expect(await getPaths(kv)).toEqual({})
    expect(await getUnits(kv)).toEqual({})
    expect(await getSkills(kv)).toEqual({})
  })

  test('isToxic returns false for missing edge', async () => {
    const { isToxic } = await import('./edge')
    const kv = mockKv({ 'toxic.json': JSON.stringify(['a→b']) })
    expect(await isToxic(kv, 'a→b')).toBe(true)
    expect(await isToxic(kv, 'c→d')).toBe(false)
  })
})

describe('edge — routing helpers', () => {
  test('discover returns providers for a known skill', async () => {
    const { discover } = await import('./edge')
    const kv = mockKv({
      'skills.json': JSON.stringify({
        copy: { providers: ['creative', 'writer'], price: 0.02 },
      }),
    })
    expect(await discover(kv, 'copy')).toEqual(['creative', 'writer'])
    expect(await discover(kv, 'unknown')).toEqual([])
  })

  test('optimalRoute picks provider with highest (strength - resistance)', async () => {
    const { optimalRoute } = await import('./edge')
    const kv = mockKv({
      'skills.json': JSON.stringify({
        copy: { providers: ['alice', 'bob'], price: 0 },
      }),
      'paths.json': JSON.stringify({
        'caller→alice': { strength: 5, resistance: 4 }, // weight 1
        'caller→bob': { strength: 3, resistance: 0 }, // weight 3 ← winner
      }),
    })
    expect(await optimalRoute(kv, 'caller', 'copy')).toBe('bob')
  })

  test('optimalRoute returns null when no provider has a path', async () => {
    const { optimalRoute } = await import('./edge')
    const kv = mockKv({
      'skills.json': JSON.stringify({ copy: { providers: ['alice'], price: 0 } }),
      'paths.json': JSON.stringify({}),
    })
    expect(await optimalRoute(kv, 'caller', 'copy')).toBe(null)
  })
})

describe('edge — speed', () => {
  test('in-process cache hit is sub-millisecond', async () => {
    const { getPaths } = await import('./edge')
    const kv = mockKv({ 'paths.json': JSON.stringify({ 'a→b': { strength: 1, resistance: 0 } }) })
    await getPaths(kv) // prime cache
    // warm read path — pure object read from globalThis
    const perOp = measureSync(
      'edge:cache:hit:sync-path',
      () => {
        ;(globalThis as { _edgeKvCache?: Map<string, unknown> })._edgeKvCache?.get('paths.json')
      },
      10_000,
    )
    expect(perOp).toBeLessThan(0.1)
  })
})
