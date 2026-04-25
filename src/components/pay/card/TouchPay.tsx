import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { useEffect, useMemo, useState } from 'react'
import { ExpressCheckout } from './ExpressCheckout'
import { LinkAutofill } from './LinkAutofill'

interface Props {
  uid: string
  email?: string
  amountMinor: number
  currency?: string
  returnUrl?: string
  metadata?: Record<string, string>
}

let stripePromise: Promise<Stripe | null> | null = null
function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) return null
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

export function TouchPay({ uid, email, amountMinor, currency = 'usd', returnUrl, metadata }: Props) {
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const p = getStripe()
    if (!p) {
      setError('Stripe publishable key missing')
      return
    }
    p.then(setStripe).catch(() => setError('Stripe failed to load'))
  }, [])

  const elementsOptions = useMemo(
    () =>
      ({
        mode: 'payment',
        amount: amountMinor,
        currency: currency.toLowerCase(),
        paymentMethodCreation: 'manual',
        appearance: { theme: 'night' },
      }) as const,
    [amountMinor, currency],
  )

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }
  if (!stripe) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <Elements stripe={stripe} options={elementsOptions}>
      <div className="space-y-6">
        <ExpressCheckout
          uid={uid}
          email={email}
          amountMinor={amountMinor}
          currency={currency}
          returnUrl={returnUrl}
          metadata={metadata}
        />
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
          <span className="h-px flex-1 bg-slate-700" />
          or
          <span className="h-px flex-1 bg-slate-700" />
        </div>
        <LinkAutofill
          uid={uid}
          defaultEmail={email}
          amountMinor={amountMinor}
          currency={currency}
          returnUrl={returnUrl}
          metadata={metadata}
        />
      </div>
    </Elements>
  )
}
