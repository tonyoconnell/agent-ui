/**
 * POST /api/ingest/stripe — Stripe webhook events → mark/warn
 *
 * Body: { event: StripeEvent }
 * Maps checkout.completed → mark, refund → warn×2, dispute → warn×3
 * Weights per ingestion.md Tier 5 taxonomy. High-value events promote to Sui via mirrorPay.
 */
import type { APIRoute } from 'astro'
import { mirrorPay } from '@/engine/bridge'
import { getNet } from '@/lib/net'

type StripeEventObject = {
  customer?: string
  id?: string
  amount_total?: number
  amount?: number
  amount_refunded?: number
}

type StripeEvent = {
  type: string
  data: { object: StripeEventObject }
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as { event?: StripeEvent }
  const event = body.event
  if (!event?.type || !event?.data?.object) {
    return Response.json({ error: 'stripe event required' }, { status: 400 })
  }

  const net = await getNet()
  const obj = event.data.object
  const customer = (obj.customer ?? 'anon').slice(0, 255)
  const productId = (obj.id ?? 'unknown').slice(0, 255)
  const edge = `${customer}→${productId}`

  let action: 'mark' | 'warn' | 'skip' = 'skip'
  let weight = 0

  switch (event.type) {
    case 'checkout.session.completed':
      weight = ((obj.amount_total ?? 0) / 100) * 1.0
      action = 'mark'
      break
    case 'charge.refunded':
      weight = ((obj.amount_refunded ?? obj.amount ?? 0) / 100) * 2.0
      action = 'warn'
      break
    case 'charge.dispute.created':
      weight = ((obj.amount ?? 0) / 100) * 3.0
      action = 'warn'
      break
    case 'charge.dispute.won':
      weight = ((obj.amount ?? 0) / 100) * 0.5
      action = 'mark'
      break
  }

  if (action === 'skip' || weight <= 0) {
    return Response.json({ ok: true, action: 'skip', event: event.type })
  }

  if (action === 'mark') {
    net.mark(edge, weight)
    // Paid events promote to Sui (threshold met by any real payment)
    mirrorPay(customer, productId, weight).catch(() => {})
  } else {
    net.warn(edge, weight)
  }

  return Response.json({ ok: true, action, edge, weight })
}
