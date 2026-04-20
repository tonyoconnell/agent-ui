import type { APIRoute } from 'astro'
import type { Tier } from '@/lib/tier-limits'
import { setTier } from '@/lib/tier-limits'

export const prerender = false

const PRICE_TO_TIER: Record<string, Tier> = {
  [import.meta.env.STRIPE_PRICE_BUILDER ?? 'price_builder']: 'builder',
  [import.meta.env.STRIPE_PRICE_SCALE ?? 'price_scale']: 'scale',
  [import.meta.env.STRIPE_PRICE_WORLD ?? 'price_world']: 'world',
}

/** POST /api/billing/webhook — Stripe subscription lifecycle events */
export const POST: APIRoute = async ({ request, locals }) => {
  const { getD1 } = await import('@/lib/cf-env')
  const db = await getD1(locals)

  const secretKey = import.meta.env.STRIPE_SECRET_KEY as string | undefined
  const webhookSecret = import.meta.env.STRIPE_BILLING_WEBHOOK_SECRET as string | undefined
  if (!secretKey || !webhookSecret) return new Response('not configured', { status: 503 })

  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey)
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const sub = event.data.object as {
        client_reference_id?: string
        items?: { data?: { price?: { id?: string } }[] }
      }
      const userId = sub.client_reference_id
      const priceId = sub.items?.data?.[0]?.price?.id ?? ''
      const tier = PRICE_TO_TIER[priceId] ?? 'free'
      if (userId) await setTier(userId, tier, db)
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as { client_reference_id?: string }
      if (sub.client_reference_id) await setTier(sub.client_reference_id, 'free', db)
    }

    return Response.json({ received: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'webhook error'
    return Response.json({ error: msg }, { status: 400 })
  }
}
