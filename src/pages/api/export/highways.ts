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
  contextHint?: string // top doc keys that led to success on this path
}

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '100', 10)
  const withContext = url.searchParams.has('context')

  try {
    const results = await readParsed(`
      match
        $p (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $p has traversals $tv;
        $p has revenue $rev;
        $s has uid $sid;
        $t has uid $tid;
        $str >= 20.0;
      sort $str desc;
      limit ${limit};
      select $sid, $tid, $str, $r, $tv, $rev;
    `)

    const highways: HighwayExport[] = results.map((r) => {
      const str = r.str as number
      const res = r.r as number
      // traversals + revenue come from TypeDB; successRate derived (no hits/misses attr on path)
      const traversals = r.tv as number
      const revenue = r.rev as number
      const successRate = str / (str + res + 1)
      return {
        from: r.sid as string,
        to: r.tid as string,
        strength: str,
        resistance: res,
        traversals,
        revenue,
        successRate,
      }
    })

    if (withContext) {
      // Batch-query docs:*→taskId:success hypotheses — 1 query, join in memory
      const hypoRows = await readParsed(`
        match $h isa hypothesis, has statement $s;
        $s contains "success";
        select $s;
      `).catch(() => [] as Record<string, unknown>[])
      const contextMap = new Map<string, string>()
      for (const r of hypoRows) {
        const m = (r.s as string).match(/^docs:([^→]+)→([^:]+):success$/)
        if (m) contextMap.set(m[2], m[1])
      }
      for (const h of highways) {
        const taskId = h.to.match(/builder:(.+)$/)?.[1]
        if (taskId && contextMap.has(taskId)) h.contextHint = contextMap.get(taskId)
      }
    }

    return Response.json(highways, {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  }
}
