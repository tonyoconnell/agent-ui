/**
 * GET /api/memory/frontier/:uid — Unexplored tag clusters for an actor
 *
 * Returns the tags the world knows about that this actor has never
 * touched via paths. Answers "what haven't we learned about you?"
 *
 * Used for proactive capability suggestions and coverage metrics.
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

export const GET: APIRoute = async ({ params }) => {
  const uid = params.uid
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const net = await getNet()
  const tags = await net.frontier(uid)

  return new Response(JSON.stringify({ uid, frontier: tags }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
