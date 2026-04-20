/**
 * GET /api/market/list — Marketplace capability listings
 *
 * Returns: { capabilities: CapabilityListing[] }
 * Each entry: skillId, name, price, pricingMode, sellerUid, sellerName, successRate, tags[]
 * Caching: 5s (composition endpoint — not in KV sync)
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export type CapabilityListing = {
  skillId: string
  name: string
  price: number
  pricingMode: 'static' | 'free'
  sellerUid: string
  sellerName: string
  successRate: number
  tags: string[]
  strength: number
  resistance: number
  weight: number
}

// 30s in-process cache keyed on (tag, maxPrice, limit).
// CF isolate-local — warms on first hit, cleared on redeploy.
declare global {
  var _marketListCache: Map<string, { v: unknown; ts: number }> | undefined
}
const _mCache = (globalThis._marketListCache ??= new Map())
const CACHE_TTL = 30_000
const DEFAULT_LIMIT = 50

export const GET: APIRoute = async ({ url }) => {
  try {
    const tag = url.searchParams.get('tag')
    const maxPrice = url.searchParams.getAll('maxPrice')[0]
    const rawLimit = Number(url.searchParams.get('limit'))
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : DEFAULT_LIMIT

    const cacheKey = `${tag ?? ''}|${maxPrice ?? ''}|${limit}`
    const now = Date.now()
    const hit = _mCache.get(cacheKey)
    if (hit && now - hit.ts < CACHE_TTL) {
      return Response.json(hit.v, { headers: { 'Cache-Control': 'public, max-age=5' } })
    }

    // All 4 reads run in parallel — they're independent.
    // Split (not joined) because TypeDB 3.x's planner hangs on
    // relation-join + multi-attr projection in a single match.
    const unitFallback = () =>
      readParsed(`
        match
          $u isa unit, has uid $uid, has name $uname, has success-rate $sr;
        select $uid, $uname, $sr;
      `).catch(() => [])

    // Race the paths query against a 2s timeout — it hits TypeDB's planner
    // trio issue (relation-join + attribute-filter + multi-attr projection
    // hangs 30s+). If we can't get it fast, fall back to zero pheromone so
    // the page still loads. Cache then memoizes the slow read for 30s.
    const pathsFast: Promise<Array<Record<string, unknown>>> = Promise.race([
      readParsed(`
        match
          (source: $from, target: $to) isa path, has strength $s, has resistance $r;
          $to has uid $uid;
        select $uid, $s, $r;
      `).catch(() => []),
      new Promise<Array<Record<string, unknown>>>((resolve) => setTimeout(() => resolve([]), 2000)),
    ])

    // Overall 4s ceiling on the whole fetch block. If TypeDB is degraded, we
    // return empty immediately rather than hanging the browser for 30s. Cache
    // absorbs the next request in prod; dev re-pays the ceiling until TypeDB
    // recovers.
    const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
      Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])

    const [capRows, unitRows, pathRows, tagRows] = await withTimeout(
      Promise.all([
        readParsed(`
          match
            (provider: $u, offered: $s) isa capability, has price $p;
            $s isa skill, has skill-id $sid, has name $sname;
            $u has uid $uid;
          select $sid, $sname, $p, $uid;
        `).catch(() => []),
        readParsed(`
          match
            $u isa unit, has uid $uid, has name $uname;
            try { $u has success-rate $sr; };
          select $uid, $uname, $sr;
        `).catch(unitFallback),
        pathsFast,
        readParsed(`
          match
            $s isa skill, has skill-id $sid, has tag $t;
          select $sid, $t;
        `).catch(() => []),
      ]),
      4000,
      [[], [], [], []] as [
        Array<Record<string, unknown>>,
        Array<Record<string, unknown>>,
        Array<Record<string, unknown>>,
        Array<Record<string, unknown>>,
      ],
    )

    const unitMap = new Map<string, { name: string; successRate: number }>()
    for (const r of unitRows) {
      unitMap.set(r.uid as string, {
        name: (r.uname as string) ?? '',
        successRate: (r.sr as number) ?? 0.5,
      })
    }

    const pheromoneMap = new Map<string, { strength: number; resistance: number }>()
    for (const r of pathRows) {
      const uid = r.uid as string
      const existing = pheromoneMap.get(uid) ?? { strength: 0, resistance: 0 }
      existing.strength += r.s as number
      existing.resistance += r.r as number
      pheromoneMap.set(uid, existing)
    }

    if (!capRows.length) {
      const empty = { capabilities: [], total: 0 }
      _mCache.set(cacheKey, { v: empty, ts: now })
      return Response.json(empty, { headers: { 'Cache-Control': 'public, max-age=5' } })
    }

    const tagMap = new Map<string, string[]>()
    for (const r of tagRows) {
      const sid = r.sid as string
      if (!tagMap.has(sid)) tagMap.set(sid, [])
      tagMap.get(sid)!.push(r.t as string)
    }

    // 3. Build listings with pheromone
    const SENSITIVITY = 0.7
    let capabilities: CapabilityListing[] = capRows.map((r) => {
      const price = r.p as number
      const uid = r.uid as string
      const pheromone = pheromoneMap.get(uid) ?? { strength: 0, resistance: 0 }
      const unit = unitMap.get(uid) ?? { name: uid, successRate: 0.5 }
      const weight = 1 + Math.max(0, pheromone.strength - pheromone.resistance) * SENSITIVITY
      return {
        skillId: r.sid as string,
        name: r.sname as string,
        price,
        pricingMode: price > 0 ? 'static' : 'free',
        sellerUid: uid,
        sellerName: unit.name,
        successRate: unit.successRate,
        tags: tagMap.get(r.sid as string) ?? [],
        strength: pheromone.strength,
        resistance: pheromone.resistance,
        weight,
      }
    })

    // Filter BEFORE sort+slice so the cap counts visible results, not pre-filter.
    if (tag) {
      capabilities = capabilities.filter((c) => c.tags.includes(tag))
    }
    if (maxPrice !== undefined) {
      const max = parseFloat(maxPrice)
      if (!Number.isNaN(max)) {
        capabilities = capabilities.filter((c) => c.price <= max)
      }
    }

    const total = capabilities.length
    capabilities.sort((a, b) => b.weight - a.weight)
    capabilities = capabilities.slice(0, limit)

    const payload = { capabilities, total }
    _mCache.set(cacheKey, { v: payload, ts: now })
    return Response.json(payload, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json(
      { capabilities: [] },
      {
        headers: { 'Cache-Control': 'public, max-age=5' },
      },
    )
  }
}
