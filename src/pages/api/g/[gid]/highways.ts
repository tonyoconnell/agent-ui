/**
 * GET /api/g/:gid/highways — Proven paths within a group
 *
 * Returns strength-sorted paths where both endpoints are members
 * of the given group. Mirrors /api/export/highways but group-scoped.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const prerender = false

type Highway = {
  from: string
  to: string
  strength: number
  resistance: number
}

export const GET: APIRoute = async ({ params, url }) => {
  const gid = params.gid as string
  const limit = Number(url.searchParams.get('limit') ?? '20')

  try {
    const rows = await readParsed(`
      match
        $g isa group, has group-id "${gid}";
        $u1 isa unit, has uid $from;
        $u2 isa unit, has uid $to;
        (member: $u1, group: $g) isa membership;
        (member: $u2, group: $g) isa membership;
        $p (source: $u1, target: $u2) isa path, has strength $s;
      select $from, $to, $s;
      sort $s desc;
      limit ${limit};
    `)

    const highways: Highway[] = rows.map((r) => ({
      from: r.from as string,
      to: r.to as string,
      strength: r.s as number,
      resistance: 0,
    }))

    return Response.json(highways, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
