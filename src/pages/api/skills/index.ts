/**
 * GET /api/skills — Pheromone-weighted skill discovery feed
 *
 * Query params:
 *   sort=strength   (default) — sort by effective pheromone weight descending
 *   limit=N         (default 20, max 100)
 *   tag=X           (optional) — filter by tag
 *
 * Returns: { skills: Listing[] }
 *
 * Shape aligns with BuyDiscoveryIsland.tsx Listing interface:
 *   priceMist: string  — price in MIST (bigint serialised as string)
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export type Listing = {
  skillId: string
  name: string
  priceMist: string      // bigint as string (1 SUI = 1_000_000_000 MIST)
  tags: string[]
  seller: string         // uid
  description?: string
  pheromoneStrength?: number
}

const MIST_PER_SUI = 1_000_000_000n
const CACHE_TTL = 30_000
const DEFAULT_LIMIT = 20

declare global {
  var _skillsIndexCache: Map<string, { v: unknown; ts: number }> | undefined
}
const _cache = (globalThis._skillsIndexCache ??= new Map())

export const GET: APIRoute = async ({ url }) => {
  try {
    const tag = url.searchParams.get('tag')
    const rawLimit = Number(url.searchParams.get('limit'))
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : DEFAULT_LIMIT

    const cacheKey = `${tag ?? ''}|${limit}`
    const now = Date.now()
    const hit = _cache.get(cacheKey)
    if (hit && now - hit.ts < CACHE_TTL) {
      return Response.json(hit.v, { headers: { 'Cache-Control': 'public, max-age=5' } })
    }

    // Fetch capability rows, path pheromone and tags in parallel.
    // 4s ceiling — fail gracefully if TypeDB is slow.
    const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
      Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])

    const [capRows, pathRows, tagRows] = await withTimeout(
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
            (source: $from, target: $to) isa path, has strength $s, has resistance $r;
            $to has uid $uid;
          select $uid, $s, $r;
        `).catch(() => []) as Promise<Array<Record<string, unknown>>>,
        readParsed(`
          match
            $s isa skill, has skill-id $sid, has tag $t;
          select $sid, $t;
        `).catch(() => []),
      ]),
      4000,
      [[], [], []] as [
        Array<Record<string, unknown>>,
        Array<Record<string, unknown>>,
        Array<Record<string, unknown>>,
      ],
    )

    if (!capRows.length) {
      const empty = { skills: [] }
      _cache.set(cacheKey, { v: empty, ts: now })
      return Response.json(empty, { headers: { 'Cache-Control': 'public, max-age=5' } })
    }

    // Build pheromone map per seller uid
    const pheromoneMap = new Map<string, { strength: number; resistance: number }>()
    for (const r of pathRows) {
      const uid = r.uid as string
      const existing = pheromoneMap.get(uid) ?? { strength: 0, resistance: 0 }
      existing.strength += (r.s as number) ?? 0
      existing.resistance += (r.r as number) ?? 0
      pheromoneMap.set(uid, existing)
    }

    // Build tag map per skill id
    const tagMap = new Map<string, string[]>()
    for (const r of tagRows) {
      const sid = r.sid as string
      if (!tagMap.has(sid)) tagMap.set(sid, [])
      tagMap.get(sid)!.push(r.t as string)
    }

    // Convert price (number, in SUI units) → MIST as bigint string
    let skills: Listing[] = capRows.map((r) => {
      const priceNum = (r.p as number) ?? 0
      // price stored as SUI float (e.g. 0.02) → convert to MIST bigint
      const priceMist = BigInt(Math.round(priceNum * Number(MIST_PER_SUI)))
      const uid = r.uid as string
      const pheromone = pheromoneMap.get(uid) ?? { strength: 0, resistance: 0 }
      const effectiveStrength = Math.max(0, pheromone.strength - pheromone.resistance)

      return {
        skillId: r.sid as string,
        name: r.sname as string,
        priceMist: priceMist.toString(),
        tags: tagMap.get(r.sid as string) ?? [],
        seller: uid,
        pheromoneStrength: effectiveStrength,
      }
    })

    // Filter by tag if provided
    if (tag) {
      skills = skills.filter((s) => s.tags.includes(tag))
    }

    // Sort by pheromone strength descending
    skills.sort((a, b) => (b.pheromoneStrength ?? 0) - (a.pheromoneStrength ?? 0))
    skills = skills.slice(0, limit)

    const payload = { skills }
    _cache.set(cacheKey, { v: payload, ts: now })
    return Response.json(payload, { headers: { 'Cache-Control': 'public, max-age=5' } })
  } catch {
    return Response.json({ skills: [] }, { headers: { 'Cache-Control': 'public, max-age=5' } })
  }
}
