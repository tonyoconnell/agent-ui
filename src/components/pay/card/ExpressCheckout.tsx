import { ExpressCheckoutElement } from '@stripe/react-stripe-js'
import { useMemo } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { useStripeConfirm } from './use-stripe-confirm'

interface Props {
  uid: string
  email?: string
  amountMinor: number
  currency?: string
  returnUrl?: string
  metadata?: Record<string, string>
}

const EXPRESS_OPTIONS = {
  emailRequired: true,
  billingAddressRequired: true,
  phoneNumberRequired: false,
} as const

export function ExpressCheckout({ uid, email, amountMinor, currency = 'usd', returnUrl, metadata }: Props) {
  const { confirm, pending, error } = useStripeConfirm()

  const onConfirm = useMemo(
    () => () => {
      emitClick('ui:pay:apple-pay', { amount: amountMinor, currency })
      confirm({ uid, email, amountMinor, currency, returnUrl, metadata })
    },
    [confirm, uid, email, amountMinor, currency, returnUrl, metadata],
  )

  return (
    <div className="space-y-2">
      <ExpressCheckoutElement options={EXPRESS_OPTIONS} onConfirm={onConfirm} />
      {pending && <p className="text-xs text-muted-foreground">Confirming…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
