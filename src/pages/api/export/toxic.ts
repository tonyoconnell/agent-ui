import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  try {
    const results = await readParsed(`
      match
        (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
        $r >= 10;
        $r > $str * 2;
      select $sid, $tid, $str, $r;
    `)

    const toxic = results
      .filter(r => ((r.r as number) + (r.str as number)) > 5)
      .map(r => `${r.sid}\u2192${r.tid}`)

    return Response.json(toxic, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
