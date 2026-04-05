import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const results = await readParsed(`
    match
      $p isa path,
        has source $s,
        has target $t,
        has strength $str,
        has resistance $r;
    select $s, $t, $str, $r;
  `)

  const paths: Record<string, { strength: number; resistance: number }> = {}
  for (const r of results) {
    const edge = `${r.s}\u2192${r.t}`
    paths[edge] = { strength: r.str as number, resistance: r.r as number }
  }

  return Response.json(paths, {
    headers: { 'Cache-Control': 'public, max-age=5' },
  })
}
