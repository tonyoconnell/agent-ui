/**
 * GET /api/state — Full world state for UI
 *
 * Reads from in-memory world. No TypeDB call per request.
 * Returns: { units, edges, highways, tags, stats }
 */
import type { APIRoute } from 'astro'
import { getNet, getUnitMeta, getTagMap, getAllTags } from '@/lib/net'

export const GET: APIRoute = async () => {
  const net = await getNet()
  const unitMeta = getUnitMeta()
  const tagMap = getTagMap()
  const allTags = getAllTags()

  const units = Object.entries(unitMeta).map(([id, m]) => ({
    id, name: m.name, kind: m.kind, status: m.status, sr: m.successRate, g: m.generation,
  }))

  const edges = Object.entries(net.strength).map(([path, s]) => {
    const [fid, tid] = path.split('→')
    return {
      fid, tid,
      s,
      rs: net.resistance[path] || 0,
      r: net.revenue[path] || 0,
      t: 0,
    }
  })

  const highways = edges.filter(e => e.s >= 50 && e.rs < 10)

  return new Response(JSON.stringify({
    units,
    edges,
    highways,
    tags: allTags,
    tagMap,
    stats: {
      units: units.length,
      proven: units.filter(u => u.status === 'proven').length,
      highways: highways.length,
      edges: edges.length,
      tags: allTags.length,
      revenue: edges.reduce((s, e) => s + e.r, 0),
    },
  }), { headers: { 'Content-Type': 'application/json' } })
}
