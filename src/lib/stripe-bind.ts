import { getStripeClient } from '@/lib/stripe'
import { escapeTqlString, readParsed, writeSilent } from '@/lib/typedb'

export async function getStripeCustomer(uid: string): Promise<string | null> {
  const rows = await readParsed(`
    match $u isa unit, has uid "${escapeTqlString(uid)}", has stripe-customer $sc;
    select $sc;
  `).catch(() => [] as Record<string, unknown>[])
  const sc = rows[0]?.sc
  return typeof sc === 'string' ? sc : null
}

export function bindStripeCustomer(uid: string, customerId: string): Promise<void> {
  return writeSilent(`
    match $u isa unit, has uid "${escapeTqlString(uid)}";
    insert $u has stripe-customer "${escapeTqlString(customerId)}";
  `)
}

export async function getOrCreateCustomer(uid: string, email?: string): Promise<string> {
  const stripe = getStripeClient()
  if (!stripe) throw new Error('Stripe not configured')

  const existing = await getStripeCustomer(uid)
  if (existing) return existing

  const search = await stripe.customers
    .search({ query: `metadata['uid']:'${uid.replace(/'/g, "\\'")}'`, limit: 1 })
    .catch(() => null)
  if (search?.data[0]) {
    bindStripeCustomer(uid, search.data[0].id)
    return search.data[0].id
  }

  const customer = await stripe.customers.create(
    { email, metadata: { uid } },
    { idempotencyKey: `stripe-customer:${uid}` },
  )
  bindStripeCustomer(uid, customer.id)
  return customer.id
}
