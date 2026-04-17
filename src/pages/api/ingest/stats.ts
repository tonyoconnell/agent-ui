/**
 * GET /api/ingest/stats — Ingestion flywheel metrics
 *
 * Returns 5 numbers from ingestion.md § Measuring the Ingestion Flywheel:
 *   eventsPerSec, edgesTouchedPerHour, highwaysFormed, pathsHardened, coveragePct
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const net = await getNet()

  // Highways = proven paths (strength above threshold)
  const highways = net.highways(10_000)
  const highwaysFormed = highways.length

  // All in-memory edges
  const allEdges = net.highways(100_000)
  const totalEdges = allEdges.length
  const coveredEdges = allEdges.filter((e) => e.strength > 1).length
  const coveragePct = totalEdges > 0 ? Math.round((coveredEdges / totalEdges) * 100) : 0

  // Hardened paths (Sui-promoted)
  const hardenedRows = await readParsed(`
    match $p isa path, has sui-highway-id $h;
    select $h;
  `).catch(() => [] as unknown[])
  const pathsHardened = hardenedRows.length

  // Signal rate: count signals in last 60s as proxy for events/sec
  const oneMinAgo = new Date(Date.now() - 60_000).toISOString().slice(0, 19)
  const recentSignals = await readParsed(`
    match $s isa signal, has ts $t;
    $t >= ${oneMinAgo};
    select $s;
  `).catch(() => [] as unknown[])
  const eventsPerSec = parseFloat((recentSignals.length / 60).toFixed(3))

  // Edges touched per hour = covered edges (approximation from current memory state)
  const edgesTouchedPerHour = coveredEdges

  return Response.json({
    eventsPerSec,
    edgesTouchedPerHour,
    highwaysFormed,
    pathsHardened,
    coveragePct,
    timestamp: new Date().toISOString(),
  })
}
