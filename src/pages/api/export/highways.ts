import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '100', 10)

  const results = await readParsed(`
    match
      $p isa path,
        has source $s,
        has target $t,
        has strength $str,
        has resistance $r;
      $str > 30;
    sort $str desc;
    limit ${limit};
    select $s, $t, $str, $r;
  `)

  const highways = results.map(r => ({
    from: r.s as string,
    to: r.t as string,
    strength: r.str as number,
    resistance: r.r as number,
  }))

  return Response.json(highways, {
    headers: { 'Cache-Control': 'public, max-age=5' },
  })
}
