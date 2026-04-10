/**
 * GET /api/export/public/paths.json — List public paths only
 *
 * For visitor mode: highways and proven paths for demo world
 * Caching: 5s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type PathExport = {
  from: string
  to: string
  strength: number
  resistance?: number
  isHighway: boolean
  isToxic: boolean
}

export const GET: APIRoute = async () => {
  try {
    // Get proven paths (highways) from the public demo world
    const results = await readParsed(`
      match
        $p (provider: $from, receiver: $to) isa path,
          has strength $str,
          has resistance $res;
      select $from, $to, $str, $res;
    `)

    const paths: PathExport[] = []

    for (const r of results) {
      const strength = (r.str as number) || 0
      const resistance = (r.res as number) || 0
      const isHighway = strength >= 10 && strength > resistance * 2
      const isToxic = resistance >= 10 && resistance > strength * 2

      paths.push({
        from: r.from as string,
        to: r.to as string,
        strength,
        resistance,
        isHighway,
        isToxic,
      })
    }

    return Response.json(paths, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
