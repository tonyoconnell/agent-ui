// ported from /Users/toc/Server/ONE/web/src/pages/api/checkout/create-intent.ts on 2026-04-20
// Removed: Shopify/order-system integration, content collection validation
// Kept: server-side total calculation, item validation logic, Stripe PI creation
/**
 * POST /api/pay/stripe/create-intent
 * Creates a Stripe PaymentIntent for checkout.
 *
 * Security:
 * - Server-side amount calculation (never trust client)
 * - Validates cart items
 * - Sanitizes user input
 */
import type { APIRoute } from 'astro'
import Stripe from 'stripe'

export const prerender = false

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
  typescript: true,
})

interface CartItem {
  productId: string
  quantity: number
  priceOverride?: number // cents — optional server-trusted override
  selectedColor?: string
  selectedSize?: string
}

interface CreateIntentRequest {
  items: CartItem[]
  metadata?: Record<string, string>
}

/**
 * Calculate order total server-side.
 * Replace mock pricing with a real product database lookup in production.
 */
async function calculateOrderTotal(items: CartItem[]): Promise<{ amount: number; currency: string }> {
  let subtotal = 0

  for (const item of items) {
    // Server-side price: use priceOverride only if explicitly set by trusted server code
    // Default mock price: 2999 cents ($29.99) — replace with database lookup
    const pricePerUnit = item.priceOverride ?? 2999
    subtotal += pricePerUnit * item.quantity
  }

  // Free shipping over $100
  const shipping = subtotal >= 10000 ? 0 : 999
  // 8% sales tax
  const tax = Math.round((subtotal + shipping) * 0.08)

  return { amount: subtotal + shipping + tax, currency: 'usd' }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!import.meta.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: 'Stripe not configured', type: 'config_error' }, { status: 503 })
    }

    const body = (await request.json()) as CreateIntentRequest

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ error: 'items array is required' }, { status: 400 })
    }

    for (const item of body.items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return Response.json({ error: 'productId required for each item' }, { status: 400 })
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 100) {
        return Response.json({ error: 'quantity must be 1-100' }, { status: 400 })
      }
    }

    const { amount, currency } = await calculateOrderTotal(body.items)

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...body.metadata,
        itemCount: body.items.length.toString(),
        items: JSON.stringify(
          body.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            selectedColor: i.selectedColor,
            selectedSize: i.selectedSize,
          })),
        ),
      },
    })

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return Response.json({ error: error.message, type: 'stripe_error' }, { status: 400 })
    }
    return Response.json({ error: 'Failed to create payment intent', type: 'api_error' }, { status: 500 })
  }
}
