/**
 * DELETE /api/memory/forget/:uid — Structural erasure for an actor
 *
 * Deletes all TypeDB records for uid (signals, paths, memberships,
 * capabilities, unit entity) and invalidates the edge KV cache.
 *
 * GDPR Article 17 — right to erasure.
 */
import type { APIRoute } from 'astro'
import { kvInvalidate } from '@/lib/edge'
import { getNet } from '@/lib/net'

export const DELETE: APIRoute = async ({ params }) => {
  const uid = params.uid
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const net = await getNet()
  await net.forget(uid)

  // E13: invalidate edge cache — paths, units, highways all change after erasure
  kvInvalidate('paths.json')
  kvInvalidate('units.json')
  kvInvalidate('highways.json')

  return new Response(null, { status: 204 })
}
