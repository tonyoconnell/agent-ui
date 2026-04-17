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

export const GET: APIRoute = async ({ url }) => {
  try {
    const tag = url.searchParams.get('tag')
    const maxPrice = url.searchParams.getAll('maxPrice')[0]

    // 1. Capabilities + skill info only — fast, narrow query
    const capRows = await readParsed(`
      match
        (provider: $u, offered: $s) isa capability, has price $p;
        $s isa skill, has skill-id $sid, has name $sname;
        $u has uid $uid;
      select $sid, $sname, $p, $uid;
    `).catch(() => [])

    // 1a. Unit info (name + success-rate) — separate query, fast independently
    const unitRows = await readParsed(`
      match
        $u isa unit, has uid $uid, has name $uname;
        try { $u has success-rate $sr; };
      select $uid, $uname, $sr;
    `).catch(async () =>
      // Fallback without try{} for schemas that don't support it
      readParsed(`
        match
          $u isa unit, has uid $uid, has name $uname, has success-rate $sr;
        select $uid, $uname, $sr;
      `).catch(() => []),
    )

    const unitMap = new Map<string, { name: string; successRate: number }>()
    for (const r of unitRows) {
      unitMap.set(r.uid as string, {
        name: (r.uname as string) ?? '',
        successRate: (r.sr as number) ?? 0.5,
      })
    }

    // 1b. Path pheromone (strength/resistance) for each seller
    const pathRows = await readParsed(`
      match
        (source: $from, target: $to) isa path, has strength $s, has resistance $r;
        $to has uid $uid;
      select $uid, $s, $r;
    `).catch(() => [])

    const pheromoneMap = new Map<string, { strength: number; resistance: number }>()
    for (const r of pathRows) {
      const uid = r.uid as string
      const existing = pheromoneMap.get(uid) ?? { strength: 0, resistance: 0 }
      existing.strength += r.s as number
      existing.resistance += r.r as number
      pheromoneMap.set(uid, existing)
    }

    if (!capRows.length) {
      return Response.json(
        { capabilities: [] },
        {
          headers: { 'Cache-Control': 'public, max-age=5' },
        },
      )
    }

    // 2. Tags for each skill
    const tagRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid, has tag $t;
      select $sid, $t;
    `).catch(() => [])

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

    // Sort by weight (pheromone ranking) by default
    capabilities.sort((a, b) => b.weight - a.weight)

    // Optional server-side filters
    if (tag) {
      capabilities = capabilities.filter((c) => c.tags.includes(tag))
    }
    if (maxPrice !== undefined) {
      const max = parseFloat(maxPrice)
      if (!Number.isNaN(max)) {
        capabilities = capabilities.filter((c) => c.price <= max)
      }
    }

    return Response.json(
      { capabilities },
      {
        headers: { 'Cache-Control': 'public, max-age=5' },
      },
    )
  } catch {
    return Response.json(
      { capabilities: [] },
      {
        headers: { 'Cache-Control': 'public, max-age=5' },
      },
    )
  }
}
