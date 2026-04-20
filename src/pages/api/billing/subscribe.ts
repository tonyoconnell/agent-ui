import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import type { Tier } from '@/lib/tier-limits'

export const prerender = false

const PRICE_TO_TIER: Record<string, Tier> = {
  [import.meta.env.STRIPE_PRICE_BUILDER ?? 'price_builder']: 'builder',
  [import.meta.env.STRIPE_PRICE_SCALE ?? 'price_scale']: 'scale',
  [import.meta.env.STRIPE_PRICE_WORLD ?? 'price_world']: 'world',
}

/** POST /api/billing/subscribe — create Stripe Checkout session for tier upgrade */
export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    tier?: string
    successUrl?: string
    cancelUrl?: string
  }
  const tier = (body.tier ?? 'builder') as Tier

  const priceId = Object.entries(PRICE_TO_TIER).find(([, t]) => t === tier)?.[0]
  if (!priceId || priceId.startsWith('price_')) {
    return Response.json({ error: 'billing not configured — set STRIPE_PRICE_* env vars' }, { status: 503 })
  }

  const secretKey = import.meta.env.STRIPE_SECRET_KEY as string | undefined
  if (!secretKey) return Response.json({ error: 'billing not configured' }, { status: 503 })

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: auth.user,
      success_url: body.successUrl ?? 'https://one.ie/dashboard?upgraded=1',
      cancel_url: body.cancelUrl ?? 'https://one.ie/pricing',
    })
    return Response.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'stripe error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
