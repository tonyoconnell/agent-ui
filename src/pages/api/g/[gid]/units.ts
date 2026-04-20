/**
 * GET /api/g/:gid/units — Public units for a specific group
 *
 * Mirrors /api/export/units but filtered by group membership.
 * Returns units that belong to the given group only.
 * No auth required — public data.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const prerender = false

type UnitListing = {
  uid: string
  name: string
  kind?: string
  successRate?: number
  generation?: number
}

export const GET: APIRoute = async ({ params }) => {
  const gid = params.gid as string

  try {
    const rows = await readParsed(`
      match
        $g isa group, has gid "${gid}";
        $u isa unit, has uid $id, has name $n;
        (member: $u, group: $g) isa membership;
      select $id, $n;
    `)

    const units: UnitListing[] = rows.map((r) => ({
      uid: r.id as string,
      name: r.n as string,
    }))

    return Response.json(units, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
