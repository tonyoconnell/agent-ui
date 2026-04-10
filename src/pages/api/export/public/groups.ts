/**
 * GET /api/export/public/groups.json — List public groups only
 *
 * For visitor mode: org structure for demo world
 * Caching: 5s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type GroupExport = {
  id: string
  name: string
  members: number
  description?: string
}

export const GET: APIRoute = async () => {
  try {
    const results = await readParsed(`
      match
        $g isa group,
          has gid $id,
          has name $n;
        ?$g has description $d;
        (group: $g, member: $m) isa membership;
      select $id, $n, $d;
    `)

    const groupMap = new Map<string, { id: string; name: string; description?: string; count: number }>()

    for (const r of results) {
      const key = r.id as string
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: key,
          name: r.n as string,
          ...(r.d && { description: r.d as string }),
          count: 0,
        })
      }
      const group = groupMap.get(key)
      if (group) group.count++
    }

    const groups: GroupExport[] = Array.from(groupMap.values()).map((g) => ({
      id: g.id,
      name: g.name,
      members: g.count,
      ...(g.description && { description: g.description }),
    }))

    return Response.json(groups, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
