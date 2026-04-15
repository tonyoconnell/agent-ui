/**
 * GET /api/brand/highways — top brand:*→thing:* pheromone paths, ranked by strength
 *
 * Query: ?limit=10
 * Response: { highways: [{ brand, thingId?, groupId?, strength, edge }], threshold }
 *
 * Used by the design editor to surface brand→thing suggestions based on
 * accumulated pheromone. threshold=20 marks proven vs weak paths.
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

const HIGHWAY_THRESHOLD = 20

export const GET: APIRoute = async ({ url }) => {
  const raw = url.searchParams.get('limit') ?? '10'
  const limit = Math.min(100, Math.max(1, parseInt(raw, 10) || 10))

  const net = await getNet()

  const highways = Object.entries(net.strength)
    .filter(([p]) => p.startsWith('brand:') && p.includes('→'))
    .map(([edge, strength]) => {
      const [source, target] = edge.split('→')
      const brand = (source ?? '').replace(/^brand:/, '')
      const thingId = target?.startsWith('thing:') ? target.replace(/^thing:/, '') : undefined
      const groupId = target?.startsWith('group:') ? target.replace(/^group:/, '') : undefined
      return { brand, thingId, groupId, strength, edge }
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)

  return new Response(JSON.stringify({ highways, threshold: HIGHWAY_THRESHOLD }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=60',
    },
  })
}
