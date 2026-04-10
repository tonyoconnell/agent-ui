/**
 * GET /api/health — System health check
 *
 * Reports on in-memory world state. No per-request TypeDB ping.
 * Returns: { status, world, version, uptime, timestamp }
 */
import type { APIRoute } from 'astro'
import { getNet, getUnitMeta, loadedAt } from '@/lib/net'

const startTime = Date.now()

export const GET: APIRoute = async () => {
  const net = await getNet()
  const units = getUnitMeta()
  const loaded = loadedAt()

  const unitCount = Object.keys(units).length
  const edgeCount = Object.keys(net.strength).length
  const highwayCount = net.highways(100).length
  const ageMs = loaded ? Date.now() - loaded : -1

  // Degraded if world never loaded or has no data
  const status = loaded && (unitCount > 0 || edgeCount > 0) ? 'healthy' : 'degraded'

  return new Response(JSON.stringify({
    status,
    world: {
      units: unitCount,
      edges: edgeCount,
      highways: highwayCount,
      loadedAgoMs: ageMs,
    },
    version: '0.6.0',
    phase: 'scale',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  }), {
    status: status === 'healthy' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  })
}
