/// <reference types="@cloudflare/workers-types" />
/**
 * Edge reads — all from KV JSON snapshots, never TypeDB direct.
 * <1ms reads. TypeDB → KV sync happens every 5s-60s.
 *
 * In-process cache (globalThis) — 0ms reads within 30s TTL.
 * KV is the fallback; TypeDB is never touched from the edge.
 */

// ── In-process cache ─────────────────────────────────────────────────────────
// globalThis survives across requests within the same Worker isolate (~seconds).
// Safe to cast: each KV key holds a known shape.

declare global {
  var _edgeKvCache: Record<string, { v: unknown; ts: number }> | undefined
}
const _cache = (globalThis._edgeKvCache ??= {})
const TTL = 30_000 // 30 seconds per isolate

async function kvGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const now = Date.now()
  const hit = _cache[key]
  if (hit && now - hit.ts < TTL) return hit.v as T
  const json = await kv.get(key, { cacheTtl: 60 }) // also tell CF CDN to cache 60s
  const v = json ? JSON.parse(json) : null
  _cache[key] = { v, ts: now }
  return v as T
}

/** Invalidate a single key (call after a KV write to keep cache consistent) */
export function kvInvalidate(key: string) {
  delete _cache[key]
}

// ── Readers ───────────────────────────────────────────────────────────────────

export async function getPaths(kv: KVNamespace) {
  return (await kvGet<Record<string, { strength: number; resistance: number }>>(kv, 'paths.json')) ?? {}
}

export async function getUnits(kv: KVNamespace) {
  return (await kvGet<Record<string, { kind: string; status: string }>>(kv, 'units.json')) ?? {}
}

export async function getSkills(kv: KVNamespace) {
  return (await kvGet<Record<string, { providers: string[]; price: number }>>(kv, 'skills.json')) ?? {}
}

export async function isToxic(kv: KVNamespace, edge: string): Promise<boolean> {
  const toxic = (await kvGet<string[]>(kv, 'toxic.json')) ?? []
  return toxic.includes(edge)
}

export async function getHighways(kv: KVNamespace, limit = 10) {
  const highways = (await kvGet<Array<{ from: string; to: string; strength: number }>>(kv, 'highways.json')) ?? []
  return highways.slice(0, limit)
}

export async function discover(kv: KVNamespace, skill: string) {
  const skills = await getSkills(kv)
  return skills[skill]?.providers || []
}

export async function optimalRoute(kv: KVNamespace, from: string, skill: string) {
  const [paths, skills] = await Promise.all([getPaths(kv), getSkills(kv)])

  const providers = skills[skill]?.providers || []
  if (!providers.length) return null

  let best: string | null = null
  let bestWeight = -Infinity

  for (const provider of providers) {
    const edge = `${from}\u2192${provider}`
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
