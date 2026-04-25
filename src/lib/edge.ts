/// <reference types="@cloudflare/workers-types" />
/**
 * Edge reads — all from KV JSON snapshots, never TypeDB direct.
 * <1ms reads. TypeDB → KV sync happens every 5s-60s.
 *
 * In-process cache (globalThis) — 0ms reads within FRESH_TTL.
 * SWR: stale (FRESH_TTL → STALE_TTL) returns immediately + background refresh.
 * KV is the fallback; TypeDB is never touched from the edge.
 */

// ── In-process cache ─────────────────────────────────────────────────────────

declare global {
  var _edgeKvCache: Map<string, { v: unknown; ts: number }> | undefined
  var _edgeKvInflight: Map<string, Promise<unknown>> | undefined
  var _edgeKvVersions: Map<string, string> | undefined
}

const _cache = (globalThis._edgeKvCache ??= new Map<string, { v: unknown; ts: number }>())
const _inflight = (globalThis._edgeKvInflight ??= new Map<string, Promise<unknown>>())
const _versions = (globalThis._edgeKvVersions ??= new Map<string, string>())
// Track when we last checked KV version per key — rate-limit to 1 check per 5s
const _lastVersionCheck = new Map<string, number>()

const FRESH_TTL = 30_000 // return from in-process cache
const STALE_TTL = 60_000 // return stale + refresh in background
const LRU_MAX = 200 // max keys; evict oldest 20 when hit

function lruSet(key: string, entry: { v: unknown; ts: number }) {
  if (_cache.has(key)) _cache.delete(key) // move to end
  _cache.set(key, entry)
  if (_cache.size > LRU_MAX) {
    // evict oldest 20 (first entries in Map iteration order)
    let evicted = 0
    for (const k of _cache.keys()) {
      _cache.delete(k)
      if (++evicted >= 20) break
    }
  }
}

async function fetchFromKv<T>(kv: KVNamespace, key: string): Promise<T | null> {
  // Fetch data + version in parallel; version key cached 1s at CF CDN layer
  const [json, ver] = await Promise.all([kv.get(key, { cacheTtl: 60 }), kv.get(`version:${key}`, { cacheTtl: 1 })])
  const v = json ? (JSON.parse(json) as T) : null
  lruSet(key, { v, ts: Date.now() })
  if (ver) _versions.set(key, ver)
  return v
}

async function checkVersionInBackground(kv: KVNamespace, key: string): Promise<void> {
  try {
    const ver = await kv.get(`version:${key}`, { cacheTtl: 1 })
    if (ver && ver !== _versions.get(key)) {
      // Version changed in another isolate — invalidate so next read is fresh
      kvInvalidate(key)
    }
  } catch {
    // non-blocking; ignore errors
  }
}

async function kvGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const now = Date.now()
  const hit = _cache.get(key)

  if (hit && now - hit.ts < FRESH_TTL) {
    // Touch LRU order on access
    _cache.delete(key)
    _cache.set(key, hit)
    // Background version check — only if we've seen a version bump before,
    // rate-limited to once per 5s to detect cross-isolate writes
    if (_versions.has(key)) {
      const lastCheck = _lastVersionCheck.get(key) ?? 0
      if (now - lastCheck > 5_000 && !_inflight.has(`ver:${key}`)) {
        _lastVersionCheck.set(key, now)
        const vp = checkVersionInBackground(kv, key).finally(() => _inflight.delete(`ver:${key}`))
        _inflight.set(`ver:${key}`, vp)
      }
    }
    return hit.v as T
  }

  if (hit && now - hit.ts < STALE_TTL) {
    // Stale-while-revalidate: return stale immediately, refresh in background
    if (!_inflight.has(key)) {
      const p = fetchFromKv<T>(kv, key).finally(() => _inflight.delete(key))
      _inflight.set(key, p)
    }
    return hit.v as T
  }

  // Singleflight: deduplicate concurrent cold reads
  const existing = _inflight.get(key)
  if (existing) return existing as Promise<T>

  const p = fetchFromKv<T>(kv, key).finally(() => _inflight.delete(key))
  _inflight.set(key, p)
  return p as unknown as T
}

/** Invalidate a single key (call after a KV write to keep in-process cache consistent) */
export function kvInvalidate(key: string) {
  _cache.delete(key)
  _inflight.delete(`ver:${key}`)
}

/**
 * Bump the version counter for a key in KV — propagates cache invalidation to
 * other isolates. Call this after any KV write so cross-isolate readers detect
 * the change within one FRESH_TTL window (~30s).
 */
export async function kvBumpVersion(kv: KVNamespace, key: string): Promise<void> {
  const ver = Date.now().toString()
  _versions.set(key, ver)
  kvInvalidate(key)
  await kv.put(`version:${key}`, ver, { expirationTtl: 3600 })
}

// ── Readers ───────────────────────────────────────────────────────────────────

export async function getPaths(kv: KVNamespace, group?: string) {
  const key = group ? `paths:${group}.json` : 'paths.json'
  return (await kvGet<Record<string, { strength: number; resistance: number }>>(kv, key)) ?? {}
}

export async function getUnits(kv: KVNamespace, group?: string) {
  const key = group ? `units:${group}.json` : 'units.json'
  return (await kvGet<Record<string, { kind: string; status: string }>>(kv, key)) ?? {}
}

export async function getSkills(kv: KVNamespace, group?: string) {
  const key = group ? `skills:${group}.json` : 'skills.json'
  return (await kvGet<Record<string, { providers: string[]; price: number }>>(kv, key)) ?? {}
}

export async function isToxic(kv: KVNamespace, edge: string, group?: string): Promise<boolean> {
  const key = group ? `toxic:${group}.json` : 'toxic.json'
  const toxic = (await kvGet<string[]>(kv, key)) ?? []
  return toxic.includes(edge)
}

export async function getHighways(kv: KVNamespace, limit = 10, group?: string) {
  const key = group ? `highways:${group}.json` : 'highways.json'
  const highways = (await kvGet<Array<{ from: string; to: string; strength: number }>>(kv, key)) ?? []
  return highways.slice(0, limit)
}

export async function discover(kv: KVNamespace, skill: string, group?: string) {
  const skills = await getSkills(kv, group)
  return skills[skill]?.providers || []
}

export async function optimalRoute(kv: KVNamespace, from: string, skill: string, group?: string) {
  const [paths, skills] = await Promise.all([getPaths(kv, group), getSkills(kv, group)])

  const providers = skills[skill]?.providers || []
  if (!providers.length) return null

  let best: string | null = null
  let bestWeight = -Infinity

  for (const provider of providers) {
    const edge = `${from}→${provider}`
    const path = paths[edge]
    if (path) {
      const weight = path.strength - path.resistance
      if (weight > bestWeight) {
        bestWeight = weight
        best = provider
      }
    }
  }

  return best
}
