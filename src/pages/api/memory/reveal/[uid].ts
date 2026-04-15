/**
 * GET /api/memory/reveal/:uid — Full memory card for an actor
 *
 * Returns all 6-dimension data for the given uid:
 * actor, hypotheses, highways, signals, groups, capabilities, frontier.
 *
 * GDPR Article 20 — data portability export.
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
  const card = await net.reveal(uid)

  return new Response(JSON.stringify(card), {
    headers: { 'Content-Type': 'application/json' },
  })
}
