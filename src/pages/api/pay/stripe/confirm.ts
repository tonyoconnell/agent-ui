// ported from /Users/toc/Server/ONE/web/src/pages/api/checkout/confirm.ts on 2026-04-20
// Removed: Shopify/order-system integration, sendConfirmationEmail, clearCart
// Added: substrate:pay signal emission on successful confirm
/**
 * POST /api/pay/stripe/confirm
 * Confirms a Stripe PaymentIntent and emits substrate:pay on success.
 *
 * Body: { paymentIntentId: string, billingAddress?: object }
 */
import type { APIRoute } from 'astro'
import Stripe from 'stripe'

export const prerender = false

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
  typescript: true,
})

interface BillingAddress {
  name?: string
  line1?: string
  city?: string
  country?: string
  postal_code?: string
  // email intentionally omitted — per rule 7: redact buyer.email from signals
}

interface ConfirmRequest {
  paymentIntentId: string
  billingAddress?: BillingAddress
}

// Emit substrate:pay — redacted of sensitive fields per rule 7
function emitPaySignal(pi: Stripe.PaymentIntent, from: string, to: string): void {
  const baseUrl =
    typeof import.meta !== 'undefined'
      ? ((import.meta as { env?: Record<string, string> }).env?.ONE_API_URL ?? 'http://localhost:4321')
      : 'http://localhost:4321'

  // Redact: pan, cvc, buyer.email, cardholder_name — per rule 7
  // Only ref, amount, status, rail, from, to, provider go in content
  fetch(`${baseUrl}/api/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiver: 'substrate:pay',
      data: {
        weight: pi.amount / 100,
        tags: ['pay', 'card', 'accept'],
        content: {
          rail: 'card',
          from,
          to,
          ref: pi.id,
          status: 'captured',
          provider: 'stripe',
        },
      },
    }),
  }).catch(() => {})
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ONE-${ts}-${rand}`
}

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured', type: 'config_error' }, { status: 503 })
  }

  let body: ConfirmRequest
  try {
    body = (await request.json()) as ConfirmRequest
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }

  if (!body.paymentIntentId) {
    return Response.json({ error: 'paymentIntentId required' }, { status: 400 })
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(body.paymentIntentId)

    if (pi.status !== 'succeeded') {
      return Response.json({ error: 'payment not completed', status: pi.status }, { status: 400 })
    }

    // Extract from/to from PI metadata if present
    const from = (pi.metadata?.from as string) || 'anon'
    const to = (pi.metadata?.to as string) || 'anon'

    // Emit substrate:pay AFTER rail confirms (rule 5 — no optimistic emission)
    emitPaySignal(pi, from, to)

    // TODO: email — send order confirmation email here
    // sendConfirmationEmail(order).catch(() => {})

    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7)

    return Response.json({
      success: true,
      orderId: pi.id,
      orderNumber: generateOrderNumber(),
      amount: pi.amount,
      currency: pi.currency,
      createdAt: Date.now(),
      estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return Response.json({ error: error.message, type: 'stripe_error' }, { status: 400 })
    }
    return Response.json({ error: 'failed to confirm payment', type: 'api_error' }, { status: 500 })
  }
}
