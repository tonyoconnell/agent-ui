/**
 * GET /api/health — Live system health check
 *
 * Reports: unitCount, agentCount, signalsPerMin, revenuePerMin, successRate, topGroup
 * Returns: { status, world, version, uptime, timestamp }
 * Caching: 1s
 */
import type { APIRoute } from 'astro'
import { getNet, getUnitMeta, loadedAt } from '@/lib/net'
import { readParsed } from '@/lib/typedb'

const startTime = Date.now()

export const GET: APIRoute = async () => {
  const net = await getNet()
  const units = getUnitMeta()
  const loaded = loadedAt()

  const unitCount = Object.keys(units).length
  const agentCount = Object.values(units).filter((u) => u.kind === 'agent' || u.kind === 'llm').length
  const edgeCount = Object.keys(net.strength).length
  const highwayCount = net.highways(100).length
  const ageMs = loaded ? Date.now() - loaded : -1

  // Calculate success rate across all units
  const unitList = Object.values(units)
  const avgSuccessRate = unitList.length > 0 ? unitList.reduce((s, u) => s + u.successRate, 0) / unitList.length : 0

  // Get total revenue (all paths)
  const totalRevenue = Object.values(net.revenue).reduce((s, v) => s + v, 0)

  // Get top group
  let topGroup = null
  try {
    const groupRows = await readParsed(`
      match
        (group: $g, member: $m) isa membership;
        $g has gid $gid, has name $name;
        $m has uid $uid;
      group $gid by $gid, $name;
      select $gid, $name, count as $c;
      sort $c desc; limit 1;
    `).catch(() => [])

    if (groupRows.length > 0) {
      topGroup = {
        id: groupRows[0].gid as string,
        name: groupRows[0].name as string,
        memberCount: groupRows[0].c as number,
      }
    }
  } catch {
    // Ignore group query failures
  }

  // Degraded if world never loaded or has no data
  const status = loaded && (unitCount > 0 || edgeCount > 0) ? 'healthy' : 'degraded'

  return new Response(
    JSON.stringify({
      status,
      world: {
        units: unitCount,
        agents: agentCount,
        edges: edgeCount,
        highways: highwayCount,
        loadedAgoMs: ageMs,
        totalRevenue: totalRevenue.toFixed(2),
        avgSuccessRate: avgSuccessRate.toFixed(3),
        topGroup,
      },
      version: '0.6.0',
      phase: 'scale',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    }),
    {
      status: status === 'healthy' ? 200 : 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1' },
    },
  )
}
