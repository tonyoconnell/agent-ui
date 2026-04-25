import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe'
import { getOrCreateCustomer } from '@/lib/stripe-bind'

export const prerender = false

interface ExpressIntentRequest {
  uid: string
  email?: string
  amountMinor: number
  currency?: string
  metadata?: Record<string, string>
}

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripeClient()
  if (!stripe) return Response.json({ error: 'Stripe not configured' }, { status: 503 })

  const body = (await request.json().catch(() => null)) as ExpressIntentRequest | null
  if (!body?.uid || !Number.isFinite(body.amountMinor) || body.amountMinor < 50) {
    return Response.json({ error: 'uid and amountMinor (>= 50) required' }, { status: 400 })
  }

  try {
    const customer = await getOrCreateCustomer(body.uid, body.email)
    const pi = await stripe.paymentIntents.create({
      amount: body.amountMinor,
      currency: (body.currency ?? 'usd').toLowerCase(),
      customer,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: 'off_session',
      metadata: { ...body.metadata, uid: body.uid },
    })

    return Response.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      customerId: customer,
      amount: pi.amount,
      currency: pi.currency,
    })
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      return Response.json({ error: err.message, type: 'stripe_error' }, { status: 400 })
    }
    return Response.json({ error: 'create failed', type: 'api_error' }, { status: 500 })
  }
}
