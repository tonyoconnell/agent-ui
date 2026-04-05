import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  // Toxic: resistance >= 10, resistance > 2x strength, total samples > 5
  const results = await readParsed(`
    match
      $p isa path,
        has source $s,
        has target $t,
        has strength $str,
        has resistance $r;
      $r >= 10;
      $r > $str * 2;
    select $s, $t;
  `)

  const toxic = results
    .filter(r => ((r.r as number) + (r.str as number)) > 5)
    .map(r => `${r.s}\u2192${r.t}`)

  return Response.json(toxic, {
    headers: { 'Cache-Control': 'public, max-age=5' },
  })
}
