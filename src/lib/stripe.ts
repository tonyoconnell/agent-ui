import Stripe from 'stripe'

let _stripe: Stripe | null | undefined

export function getStripeClient(): Stripe | null {
  if (_stripe !== undefined) return _stripe
  const key = import.meta.env.STRIPE_SECRET_KEY
  _stripe = key ? new Stripe(key, { apiVersion: '2026-03-25.dahlia', typescript: true }) : null
  return _stripe
}
