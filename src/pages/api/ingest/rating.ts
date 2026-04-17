/**
 * POST /api/ingest/rating — Support tickets and NPS scores → mark/warn
 *
 * Body: { agent: string, skill?: string, rating?: number, type?: 'nps' | 'ticket', resolution?: 'resolved' | 'escalated' | 'opened' }
 * Tier 6 weights from ingestion.md.
 * NPS 9-10 and paid-tier resolved tickets mirror to Sui.
 */
import type { APIRoute } from 'astro'
import { mirrorMark, mirrorWarn } from '@/engine/bridge'
import { getNet } from '@/lib/net'

type RatingBody = {
  agent: string
  skill?: string
  rating?: number
  type?: 'nps' | 'ticket'
  resolution?: 'resolved' | 'escalated' | 'opened'
  paidTier?: boolean
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as RatingBody
  if (!body.agent) {
    return Response.json({ error: 'agent required' }, { status: 400 })
  }

  const net = await getNet()
  const agent = body.agent.slice(0, 255)
  let action: 'mark' | 'warn' | 'skip' = 'skip'
  let weight = 0
  let edge = ''

  if (body.type === 'nps' && body.rating != null) {
    edge = `brand→${agent}`
    if (body.rating >= 9) {
      weight = 1.5
      action = 'mark'
      mirrorMark('brand', agent, weight).catch(() => {})
    } else if (body.rating <= 6) {
      weight = 1.5
      action = 'warn'
      mirrorWarn('brand', agent, weight).catch(() => {})
    }
  } else if (body.type === 'ticket') {
    const playbook = body.skill ?? `${agent}:support`
    edge = `${agent}→${playbook}`
    if (body.resolution === 'resolved') {
      weight = body.paidTier ? 2.0 : 1.0
      action = 'mark'
      if (body.paidTier) mirrorMark(agent, playbook, weight).catch(() => {})
    } else if (body.resolution === 'escalated') {
      weight = 1.5
      action = 'warn'
    }
  }

  if (action === 'skip' || weight === 0) {
    return Response.json({ ok: true, action: 'skip' })
  }

  if (action === 'mark') {
    net.mark(edge, weight)
  } else {
    net.warn(edge, weight)
  }

  return Response.json({ ok: true, action, edge, weight })
}
