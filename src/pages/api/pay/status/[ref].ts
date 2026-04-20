// ported from pay-plan.md spec on 2026-04-20
/**
 * GET /api/pay/status/[ref]    — check payment status
 * DELETE /api/pay/status/[ref] — cancel pending payment
 *
 * Ref prefixes:
 *   pi_  → Stripe PaymentIntent
 *   0x   → Sui transaction digest
 *   sl_  → pay.one.ie shortlink
 */
import type { APIRoute } from 'astro'
import * as PayService from '@/components/u/lib/PayService'

// Emit substrate:pay signal (fire-and-forget)
function emitPaySignal(opts: {
  rail: string
  from: string
  to: string
  ref: string
  status: string
  provider: string
  amount: number
}): void {
  const baseUrl =
    typeof import.meta !== 'undefined'
      ? ((import.meta as { env?: Record<string, string> }).env?.ONE_API_URL ?? 'http://localhost:4321')
      : 'http://localhost:4321'

  fetch(`${baseUrl}/api/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiver: 'substrate:pay',
      data: {
        weight: opts.amount,
        tags: ['pay', opts.rail, opts.status === 'refunded' ? 'refund' : 'status'],
        content: {
          rail: opts.rail,
          from: opts.from,
          to: opts.to,
          ref: opts.ref,
          status: opts.status,
          provider: opts.provider,
        },
      },
    }),
  }).catch(() => {})
}

export const GET: APIRoute = async ({ params }) => {
  const ref = params.ref as string

  if (!ref) {
    return Response.json({ error: 'ref required' }, { status: 400 })
  }

  try {
    // Stripe PaymentIntent
    if (ref.startsWith('pi_')) {
      const stripeKey = (import.meta as { env?: Record<string, string> }).env?.STRIPE_SECRET_KEY
      if (!stripeKey) {
        return Response.json({ error: 'Stripe not configured' }, { status: 503 })
      }

      const res = await fetch(`https://api.stripe.com/v1/payment_intents/${ref}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: { message?: string } }
        return Response.json({ error: err.error?.message || 'Stripe lookup failed' }, { status: res.status })
      }

      const pi = (await res.json()) as {
        id: string
        status: string
        amount: number
        currency: string
      }

      return Response.json({
        status: pi.status,
        ref: pi.id,
        amount: pi.amount / 100,
        rail: 'card',
      })
    }

    // Sui on-chain digest
    if (ref.startsWith('0x')) {
      // Sui transaction lookup — return pending until absorb() syncs
      return Response.json({
        status: 'pending',
        ref,
        rail: 'crypto',
      })
    }

    // pay.one.ie shortlink (sl_ prefix)
    if (ref.startsWith('sl_')) {
      const code = ref.slice(3) // strip sl_ prefix for escrow lookup
      const result = await PayService.getEscrowStatus(code)

      if (!result.success || !result.data) {
        return Response.json({ error: result.error?.message || 'status lookup failed' }, { status: 502 })
      }

      return Response.json({
        status: result.data.status,
        ref: result.data.paymentId,
        amount: result.data.receivedAmount ? parseFloat(result.data.receivedAmount) : undefined,
        rail: 'crypto',
      })
    }

    return Response.json({ error: 'unrecognized ref prefix' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'lookup failed' }, { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ params }) => {
  const ref = params.ref as string

  if (!ref) {
    return Response.json({ error: 'ref required' }, { status: 400 })
  }

  try {
    // Only Stripe PaymentIntents can be canceled
    if (ref.startsWith('pi_')) {
      const stripeKey = (import.meta as { env?: Record<string, string> }).env?.STRIPE_SECRET_KEY
      if (!stripeKey) {
        return Response.json({ error: 'Stripe not configured' }, { status: 503 })
      }

      const res = await fetch(`https://api.stripe.com/v1/payment_intents/${ref}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: { message?: string } }
        return Response.json({ error: err.error?.message || 'cancel failed' }, { status: res.status })
      }

      const pi = (await res.json()) as { id: string; status: string; amount: number }

      if (pi.status === 'canceled') {
        // Only emit after confirmed cancellation
        emitPaySignal({
          rail: 'card',
          from: 'anon',
          to: 'anon',
          ref: pi.id,
          status: 'refunded',
          provider: 'stripe',
          amount: pi.amount / 100,
        })
      }

      return Response.json({ canceled: true, ref: pi.id, status: pi.status })
    }

    return Response.json({ error: 'cancel only supported for Stripe (pi_ prefix)' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'cancel failed' }, { status: 500 })
  }
}
