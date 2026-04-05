import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  try {
    const results = await readParsed(`
      match
        (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid $sid;
        $t has uid $tid;
      select $sid, $tid, $str, $r;
    `)

    const paths: Record<string, { strength: number; resistance: number }> = {}
    for (const r of results) {
      const edge = `${r.sid}\u2192${r.tid}`
      paths[edge] = { strength: r.str as number, resistance: r.r as number }
    }

    return Response.json(paths, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json({}, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
