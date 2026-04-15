/**
 * GET  /api/market/bundle        — list highways as bundleable SKUs
 * POST /api/market/bundle        — activate a highway as a purchasable skill bundle
 *
 * A bundle is a proven highway (strength ≥ 20) packaged as a composite skill.
 * Buyers pay once to run the full route; the platform takes margin on the bundle.
 */
import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

export interface BundleListing {
  pathId: string
  from: string
  to: string
  strength: number
  resistance: number
  compositePrice: number
  status: 'available' | 'active'
}

export const GET: APIRoute = async () => {
  try {
    // path is a relation — join through unit uid attributes (mirrors highways.ts pattern)
    const rows = await readParsed(`
      match (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
        $str >= 20.0;
      sort $str desc;
      limit 50;
      select $sid, $tid, $str, $r;
    `)

    const bundles: BundleListing[] = rows.map((r) => {
      const from = r.sid as string
      const to = r.tid as string
      const strength = r.str as number
      const resistance = (r.r as number) ?? 0
      return {
        pathId: `${from}→${to}`,
        from,
        to,
        strength,
        resistance,
        compositePrice: Math.round(strength * 0.001 * 100) / 100,
        status: 'available' as const,
      }
    })

    return Response.json({ bundles }, { headers: { 'Cache-Control': 'public, max-age=10' } })
  } catch {
    return Response.json({ bundles: [] })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { from?: string; to?: string; price?: number; name?: string }
    if (!body.from || !body.to) {
      return Response.json({ error: 'from and to are required' }, { status: 400 })
    }

    const safeFrom = body.from.replace(/['"\\]/g, '')
    const safeTo = body.to.replace(/['"\\]/g, '')
    const price = body.price ?? 0.02
    const name = body.name ?? `${body.from} → ${body.to}`
    const skillId = `bundle:${safeFrom}:${safeTo}`

    await write(`
      insert $s isa skill,
        has skill-id "${skillId}",
        has name "${name}",
        has price ${price},
        has tag "bundle",
        has tag "highway";
    `)

    return Response.json({ ok: true, skillId, name, price }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
