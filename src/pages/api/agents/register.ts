/**
 * POST /api/agents/register
 *
 * Register a new agent unit with optional capabilities.
 *
 * Body:
 *   { uid: string, kind?: string, capabilities?: { skill: string, price?: number }[] }
 *
 * Returns:
 *   { uid: string, status: "registered", capabilities: number }
 *
 * Lifecycle gate: creates unit + capability relations in one call.
 */

import type { APIRoute } from 'astro'
import { world } from '@/engine/persist'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      uid?: string
      kind?: string
      capabilities?: { skill: string; price?: number }[]
    }

    if (!body.uid) {
      return Response.json({ error: 'uid required' }, { status: 400 })
    }

    const net = world()
    const kind = body.kind || 'agent'

    // Create the unit (register stage)
    net.actor(body.uid, kind)

    // Declare capabilities if provided
    if (body.capabilities?.length) {
      for (const cap of body.capabilities) {
        // Gate: create skill if needed, then capability relation
        net.thing(cap.skill, { price: cap.price || 0 })
        net.capable(body.uid, cap.skill, cap.price || 0)
      }
    }

    return Response.json({
      ok: true,
      uid: body.uid,
      status: 'registered',
      kind,
      capabilities: body.capabilities?.length || 0,
    })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
