/**
 * GET /api/stats — World statistics
 *
 * Reads from in-memory world. No TypeDB call per request.
 */
import type { APIRoute } from 'astro'
import { getNet, getUnitMeta, getAllTags } from '@/lib/net'

export const GET: APIRoute = async () => {
  const net = await getNet()
  const units = getUnitMeta()
  const tags = getAllTags()

  const unitList = Object.values(units)
  const highwayEdges = net.highways(500)
  const totalRevenue = Object.values(net.revenue).reduce((s, v) => s + v, 0)
  const gdp = highwayEdges.reduce((s, e) => s + (net.revenue[e.path] || 0), 0)

  return new Response(JSON.stringify({
    units: {
      total: unitList.length,
      proven: unitList.filter(u => u.status === 'proven').length,
      atRisk: unitList.filter(u => u.status === 'at-risk').length,
    },
    skills: { total: tags.length },
    highways: { count: highwayEdges.length, totalEdges: Object.keys(net.strength).length },
    revenue: { total: totalRevenue, gdp },
    signals: { total: 0, recent: 0 },
    timestamp: new Date().toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } })
}
