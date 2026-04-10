/**
 * GET /api/export/paths.json — List all paths with strength/resistance
 *
 * Returns: { from, to, strength, resistance, revenue, lastUsedAt, toxic }
 * Caching: 1s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type PathExport = {
  from: string
  to: string
  strength: number
  resistance: number
  revenue?: number
  lastUsedAt?: string
  toxic: boolean
}

export const GET: APIRoute = async () => {
  try {
    const results = await readParsed(`
      match
        (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
        ?$p has revenue $rev;
        ?$p has last-used $lu;
      select $sid, $tid, $str, $r, $rev, $lu;
    `)

    const paths: PathExport[] = results.map(r => {
      const strength = r.str as number
      const resistance = r.r as number
      const isToxic = resistance > strength && resistance >= 10.0

      return {
        from: r.sid as string,
        to: r.tid as string,
        strength,
        resistance,
        ...(r.rev && { revenue: r.rev as number }),
        ...(r.lu && { lastUsedAt: r.lu as string }),
        toxic: isToxic,
      }
    })

    return Response.json(paths, {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  }
}
