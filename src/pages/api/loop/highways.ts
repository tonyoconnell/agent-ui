/**
 * GET /api/loop/highways — top loop:* stage transitions, ranked by net pheromone
 *
 * Query: ?limit=10
 * Response: { highways: [{ path, strength, resistance }] }
 *
 * Compare against the canonical order in docs/work-loop.md.
 * Divergence is the learning — stages that fade aren't paying off.
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)
  const net = await getNet()
  const highways = Object.entries(net.strength)
    .filter(([p]) => p.includes('loop:'))
    .map(([path, strength]) => ({
      path,
      strength,
      resistance: net.resistance[path] ?? 0,
      net: strength - (net.resistance[path] ?? 0),
    }))
    .sort((a, b) => b.net - a.net)
    .slice(0, limit)
  return new Response(JSON.stringify({ highways }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
