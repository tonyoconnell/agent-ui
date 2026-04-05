import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const results = await readParsed(`
    match
      $u isa unit,
        has uid $id,
        has unit-kind $k;
    select $id, $k;
  `)

  const units: Record<string, { kind: string; status: string }> = {}
  for (const r of results) {
    units[r.id as string] = { kind: r.k as string, status: 'active' }
  }

  return Response.json(units, {
    headers: { 'Cache-Control': 'public, max-age=5' },
  })
}
