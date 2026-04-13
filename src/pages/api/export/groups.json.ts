import type { APIRoute } from 'astro'
import { getUnitMeta } from '@/lib/net'

export const GET: APIRoute = async () => {
  const unitMeta = getUnitMeta()
  const groupMap = new Map<string, string[]>()

  for (const id of Object.keys(unitMeta)) {
    const groupId = id.includes(':') ? id.split(':')[0] : 'ungrouped'
    if (!groupMap.has(groupId)) groupMap.set(groupId, [])
    groupMap.get(groupId)!.push(id)
  }

  const groups = Array.from(groupMap.entries()).map(([id, members]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    type: 'team',
    color: '#6366f1',
    members,
  }))

  return new Response(JSON.stringify(groups), {
    headers: { 'Content-Type': 'application/json' },
  })
}
