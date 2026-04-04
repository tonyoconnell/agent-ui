/**
 * GET /api/health — System health check
 *
 * Returns: { status, typedb, version, uptime, timestamp }
 * Pings TypeDB to verify connectivity.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

const startTime = Date.now()

export const GET: APIRoute = async () => {
  let typedbStatus: 'ok' | 'error' = 'error'
  let typedbLatency = -1

  const t0 = Date.now()
  try {
    await readParsed('match $u isa unit; limit 1;')
    typedbStatus = 'ok'
    typedbLatency = Date.now() - t0
  } catch {
    typedbLatency = Date.now() - t0
  }

  const uptimeMs = Date.now() - startTime
  const uptimeSeconds = Math.floor(uptimeMs / 1000)

  const health = {
    status: typedbStatus === 'ok' ? 'healthy' : 'degraded',
    typedb: {
      status: typedbStatus,
      latencyMs: typedbLatency,
    },
    version: '0.6.0',
    phase: 'scale',
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
  }

  const statusCode = typedbStatus === 'ok' ? 200 : 503

  return new Response(JSON.stringify(health), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  })
}
