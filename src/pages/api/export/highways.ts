/**
 * GET /api/export/highways.json — Top weighted paths (strength > 20)
 *
 * Returns: { from, to, strength, revenue, successRate, reasoning? }
 * Query: ?limit=100
 * Caching: 1s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type HighwayExport = {
  from: string
  to: string
  strength: number
  resistance: number
  revenue?: number
  successRate?: number
  traversals?: number
}

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '100', 10)

  try {
    const results = await readParsed(`
      match
        (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
        $str >= 20;
        ?$p has revenue $rev;
        ?$p has traversals $trav;
      sort $str desc;
      limit ${limit};
      select $sid, $tid, $str, $r, $rev, $trav;
    `)

    const highways: HighwayExport[] = results.map(r => ({
      from: r.sid as string,
      to: r.tid as string,
      strength: r.str as number,
      resistance: r.r as number,
      ...(r.rev && { revenue: r.rev as number }),
      ...(r.trav && { traversals: r.trav as number }),
    }))

    return Response.json(highways, {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  }
}
