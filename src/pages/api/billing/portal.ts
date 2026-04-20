import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'

export const prerender = false

/** GET /api/billing/portal — redirect to Stripe Customer Portal */
export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const secretKey = import.meta.env.STRIPE_SECRET_KEY as string | undefined
  if (!secretKey) return Response.json({ error: 'billing not configured' }, { status: 503 })

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey)

    const customers = await stripe.customers.list({ limit: 1, email: auth.user })
    const customerId = customers.data[0]?.id
    if (!customerId) {
      return Response.redirect('https://one.ie/pricing', 302)
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://one.ie/dashboard',
    })
    return Response.redirect(session.url, 302)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'stripe error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
