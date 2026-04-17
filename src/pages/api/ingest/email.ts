/**
 * POST /api/ingest/email — Email events → mark/warn
 *
 * Body: { event: { type, sender, recipient } }
 * Tier 4 weights from ingestion.md: opened=0.2, click=0.5, reply=1.0, spam=2.0, unsub=3.0
 * Unsubscribe mirrors to Sui (irrevocable commercial signal).
 */
import type { APIRoute } from 'astro'
import { mirrorWarn } from '@/engine/bridge'
import { getNet } from '@/lib/net'

type EmailEvent = {
  type: 'sent' | 'opened' | 'link-click' | 'reply' | 'spam' | 'unsubscribe'
  sender: string
  recipient: string
}

const WEIGHTS: Record<string, { weight: number; dir: 'mark' | 'warn' | 'provisional' }> = {
  sent: { weight: 0.1, dir: 'provisional' },
  opened: { weight: 0.2, dir: 'mark' },
  'link-click': { weight: 0.5, dir: 'mark' },
  reply: { weight: 1.0, dir: 'mark' },
  spam: { weight: 2.0, dir: 'warn' },
  unsubscribe: { weight: 3.0, dir: 'warn' },
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as { event?: EmailEvent }
  const event = body.event
  if (!event?.type || !event?.sender || !event?.recipient) {
    return Response.json({ error: 'event with type, sender, recipient required' }, { status: 400 })
  }

  const classification = WEIGHTS[event.type]
  if (!classification || classification.dir === 'provisional') {
    return Response.json({ ok: true, action: 'skip', event: event.type })
  }

  const net = await getNet()
  const from = event.sender.slice(0, 255)
  const to = event.recipient.slice(0, 255)
  const edge = `${from}→${to}`

  if (classification.dir === 'mark') {
    net.mark(edge, classification.weight)
  } else {
    net.warn(edge, classification.weight)
    if (event.type === 'unsubscribe') {
      mirrorWarn(from, to, classification.weight).catch(() => {})
    }
  }

  return Response.json({ ok: true, action: classification.dir, edge, weight: classification.weight })
}
