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

export const GET: APIRoute = async ({ request }) => {
  const gid = new URL(request.url).searchParams.get('group')
  try {
    const tql = gid
      ? `match
        $p (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
        (group: $g, member: $s) isa membership;
        (group: $g, member: $t) isa membership;
        $g has gid "${gid.replace(/"/g, '\\"')}";
        select $sid, $tid, $str, $r;`
      : `match
        $p (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
        select $sid, $tid, $str, $r;`
    const results = await readParsed(tql)

    const paths: PathExport[] = results.map((r) => {
      const strength = r.str as number
      const resistance = r.r as number
      return {
        from: r.sid as string,
        to: r.tid as string,
        strength,
        resistance,
        toxic: resistance > strength && resistance >= 10.0,
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
