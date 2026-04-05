import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '100', 10)

  try {
    const results = await readParsed(`
      match
        (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
        $str > 30;
      sort $str desc;
      limit ${limit};
      select $sid, $tid, $str, $r;
    `)

    const highways = results.map(r => ({
      from: r.sid as string,
      to: r.tid as string,
      strength: r.str as number,
      resistance: r.r as number,
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
