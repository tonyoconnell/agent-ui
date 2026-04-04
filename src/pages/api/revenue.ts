/**
 * GET /api/revenue — Revenue aggregates
 *
 * Returns total_revenue, top earners, GDP (sum of all payments).
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  // Get all paths with revenue
  const edges = await readParsed(`
    match
      $from isa unit, has uid $from_id;
      $to isa unit, has uid $to_id;
      $e (source: $from, target: $to) isa path,
        has revenue $rev, has strength $str, has traversals $t;
      $rev > 0;
    select $from_id, $to_id, $rev, $str, $t;
  `).catch(() => [])

  // Get payment signals for time-series data
  const signals = await readParsed(`
    match
      $from isa unit, has uid $from_id;
      $to isa unit, has uid $to_id;
      $sig (sender: $from, receiver: $to) isa signal,
        has amount $amt, has ts $ts;
      $amt > 0;
    select $from_id, $to_id, $amt, $ts;
  `).catch(() => [])

  // Aggregate GDP
  let gdp = 0
  const earners = new Map<string, number>()

  for (const edge of edges) {
    const rev = Number(edge.rev) || 0
    gdp += rev
    const provider = String(edge.to_id)
    earners.set(provider, (earners.get(provider) || 0) + rev)
  }

  // Top earners sorted by revenue
  const topEarners = [...earners.entries()]
    .map(([uid, revenue]) => ({ uid, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)

  return new Response(JSON.stringify({
    gdp,
    total_revenue: gdp,
    total_transactions: signals.length,
    top_earners: topEarners,
    edges: edges.length,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
