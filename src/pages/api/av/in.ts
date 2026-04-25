/**
 * POST /api/av/in — Inbound webhook from Agentverse.
 *
 * An AV agent is signalling a local unit. We translate the HTTP POST
 * into a substrate signal with `av:<from>` as the sender — so pheromone
 * accumulates on the `av:<from>→<to>` edge automatically.
 *
 * Body: { from: string, to: string, data?: unknown }
 *
 * Auth (optional): if AGENTVERSE_WEBHOOK_SECRET is set in env, requires
 * matching `X-Agentverse-Secret` header. Otherwise open.
 *
 * Response: 202 Accepted (fire-and-forget; result flows back through substrate).
 */

import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

const UID_FORMAT = /^[a-zA-Z0-9:_-]+$/

export const POST: APIRoute = async ({ request }) => {
  const secret = (typeof process !== 'undefined' && process.env?.AGENTVERSE_WEBHOOK_SECRET) ? process.env.AGENTVERSE_WEBHOOK_SECRET : undefined
  if (secret && request.headers.get('X-Agentverse-Secret') !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { from?: string; to?: string; data?: unknown }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { from, to, data } = body
  if (!from || !to || !UID_FORMAT.test(from) || !UID_FORMAT.test(to)) {
    return new Response(JSON.stringify({ error: 'Invalid from/to' }), { status: 400 })
  }

  const net = await getNet()
  net.signal({ receiver: to, data }, `av:${from}`)

  return new Response(null, { status: 202 })
}
