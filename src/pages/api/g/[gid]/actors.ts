/**
 * GET /api/g/:gid/actors — Public actors for a specific group
 *
 * Mirrors /api/export/actors but filtered by group membership.
 * Returns actors that belong to the given group only.
 * No auth required — public data.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const prerender = false

type ActorListing = {
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
        $u isa actor, has aid $id, has name $n;
        (member: $u, group: $g) isa membership;
      select $id, $n;
    `)

    const actors: ActorListing[] = rows.map((r) => ({
      uid: r.id as string,
      name: r.n as string,
    }))

    return Response.json(actors, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
