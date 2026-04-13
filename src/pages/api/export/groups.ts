/**
 * GET /api/export/groups.json — List all groups and memberships
 *
 * Returns: { id, name, type, color, members[] }
 * Caching: 1s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  try {
    const results = await readParsed(`
      match
        $g isa group, has gid $id, has name $name, has group-type $type;
      select $id, $name, $type;
    `)

    const groups: Record<string, { id: string; name: string; type: string; color: string; members: string[] }> = {}

    for (const r of results) {
      const groupId = r.id as string
      groups[groupId] = {
        id: groupId,
        name: r.name as string,
        type: r.type as string,
        color: colorForType(r.type as string),
        members: [],
      }
    }

    // Fetch memberships
    const memberRows = await readParsed(`
      match
        (group: $g, member: $m) isa membership;
        $g has gid $gid;
        $m has uid $mid;
      select $gid, $mid;
    `).catch(() => [])

    for (const r of memberRows) {
      const groupId = r.gid as string
      const memberId = r.mid as string
      if (groups[groupId]) {
        groups[groupId].members.push(memberId)
      }
    }

    return Response.json(Object.values(groups), {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  }
}

function colorForType(type: string): string {
  const colors: Record<string, string> = {
    persona: '#6366f1', // indigo
    team: '#3b82f6', // blue
    colony: '#8b5cf6', // purple
    dao: '#ec4899', // pink
  }
  return colors[type] || '#6b7280' // gray fallback
}
