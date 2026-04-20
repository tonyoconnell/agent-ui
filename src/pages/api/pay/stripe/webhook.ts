// ported from /Users/toc/Server/ONE/web/src/pages/api/webhooks/stripe.ts on 2026-04-20
// Merged pheromone logic from /Users/toc/Server/envelopes/src/pages/api/ingest/stripe.ts
// Added: substrate:pay signal emission, redaction of sensitive fields, warn() on refund
/**
 * POST /api/pay/stripe/webhook
 * Stripe webhook handler. Verifies signature, maps events to substrate:pay signals.
 *
 * Events handled:
 *   payment_intent.succeeded → substrate:pay {status: "captured", rail: "card"}
 *   charge.refunded          → substrate:pay {status: "refunded"} + warn() × 2 on path
 *
 * Rule 7: Redacts pan, cvc, buyer.email, cardholder_name before any signal emission.
 */
import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { mirrorPay } from '@/engine/bridge'
import { getNet } from '@/lib/net'

export const prerender = false

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY as string | undefined
const STRIPE_WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET as string | undefined

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
  : null

// Emit substrate:pay — redacted per rule 7 (no pan, cvc, buyer.email, cardholder_name)
function emitPaySignal(opts: {
  rail: string
  from: string
  to: string
  ref: string
  sku?: string
  status: string
  provider: string
  amount: number
}): void {
  const baseUrl =
    typeof import.meta !== 'undefined'
      ? ((import.meta as { env?: Record<string, string> }).env?.ONE_API_URL ?? 'http://localhost:4321')
      : 'http://localhost:4321'

  // Rule 7: only ref, amount, status, rail, from, to, sku, provider — never email/pan/cvc
  fetch(`${baseUrl}/api/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiver: 'substrate:pay',
      data: {
        weight: opts.amount,
        tags: ['pay', opts.rail, opts.status === 'refunded' ? 'refund' : 'accept'],
        content: {
          rail: opts.rail,
          from: opts.from,
          to: opts.to,
          ref: opts.ref,
          sku: opts.sku,
          status: opts.status,
          provider: opts.provider,
        },
      },
    }),
  }).catch(() => {})
}

export const POST: APIRoute = async ({ request }) => {
  if (!stripe) {
    return Response.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'missing stripe-signature' }, { status: 400 })
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe signature verification failed:', err)
    return Response.json({ error: 'invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent

        // Extract from/to from metadata — redact everything else
        const from = (pi.metadata?.from as string) || (pi.metadata?.customer as string) || 'anon'
        const to = (pi.metadata?.to as string) || 'anon'
        const sku = pi.metadata?.sku as string | undefined
        const amount = pi.amount / 100

        // Merged from ingest/stripe.ts: strengthen path via pheromone
        const net = await getNet().catch(() => null)
        if (net) {
          const edge = `${from}→${to}`
          net.mark(edge, amount)
          // Mirror to Sui for high-value payments
          mirrorPay(from, to, amount).catch(() => {})
        }

        // Emit substrate:pay AFTER rail confirms (rule 5)
        emitPaySignal({ rail: 'card', from, to, ref: pi.id, sku, status: 'captured', provider: 'stripe', amount })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        // Redact: do not include charge.billing_details.email or card details
        const from = (charge.metadata?.from as string) || (charge.customer as string) || 'anon'
        const to = (charge.metadata?.to as string) || 'anon'
        const amount = (charge.amount_refunded || charge.amount || 0) / 100
        const weight = amount * 2 // 2× weight on refund per ingest/stripe.ts pattern

        // Pheromone: warn on the path (merged from ingest/stripe.ts)
        const net = await getNet().catch(() => null)
        if (net) {
          const edge = `${from}→${to}`
          net.warn(edge, weight)
        }

        // Emit substrate:pay AFTER confirmation
        emitPaySignal({ rail: 'card', from, to, ref: charge.id, status: 'refunded', provider: 'stripe', amount })
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent

        // Redact: extract only from/to/sku from metadata — no email/pan/cvc
        const from = (pi.metadata?.from as string) || (pi.metadata?.customer as string) || 'anon'
        const to = (pi.metadata?.to as string) || 'anon'
        const sku = pi.metadata?.sku as string | undefined
        const amount = pi.amount / 100

        // Pheromone: warn on the path — payment failure weakens the edge
        const net = await getNet().catch(() => null)
        if (net) {
          const edge = `${from}→${to}`
          net.warn(edge, 1)
        }

        emitPaySignal({ rail: 'card', from, to, ref: pi.id, sku, status: 'failed', provider: 'stripe', amount })
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute

        // Redact: extract from/to/sku from charge metadata — no email/pan/cvc
        const chargeObj = typeof dispute.charge === 'string' ? null : (dispute.charge as Stripe.Charge | null)
        const from = (chargeObj?.metadata?.from as string) || 'anon'
        const to = (chargeObj?.metadata?.to as string) || 'anon'
        const sku = chargeObj?.metadata?.sku as string | undefined
        const amount = (dispute.amount || 0) / 100

        // Pheromone: warn 2× on dispute — stronger signal than a refund
        const net = await getNet().catch(() => null)
        if (net) {
          const edge = `${from}→${to}`
          net.warn(edge, amount * 2)
        }

        emitPaySignal({ rail: 'card', from, to, ref: dispute.id, sku, status: 'disputed', provider: 'stripe', amount })
        break
      }

      default:
        // Unhandled event types silently ignored — substrate learns from what's processed
        break
    }

    return Response.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return Response.json({ error: 'webhook processing failed' }, { status: 500 })
  }
}
