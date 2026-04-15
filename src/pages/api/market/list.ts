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
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const tag = url.searchParams.get('tag')
    const maxPrice = url.searchParams.getAll('maxPrice')[0]

    // 1. Core: capabilities with skill name + price + provider uid + success-rate
    const capRows = await readParsed(`
      match
        (provider: $u, offered: $s) isa capability, has price $p;
        $s isa skill, has skill-id $sid, has name $sname;
        $u has uid $uid, has name $uname, has success-rate $sr;
      select $sid, $sname, $p, $uid, $uname, $sr;
    `)

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

    // 3. Build listings
    let capabilities: CapabilityListing[] = capRows.map((r) => {
      const price = r.p as number
      return {
        skillId: r.sid as string,
        name: r.sname as string,
        price,
        pricingMode: price > 0 ? 'static' : 'free',
        sellerUid: r.uid as string,
        sellerName: r.uname as string,
        successRate: r.sr as number,
        tags: tagMap.get(r.sid as string) ?? [],
      }
    })

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
