import { LinkAuthenticationElement, PaymentElement } from '@stripe/react-stripe-js'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'
import { useStripeConfirm } from './use-stripe-confirm'

interface Props {
  uid: string
  defaultEmail?: string
  amountMinor: number
  currency?: string
  returnUrl?: string
  metadata?: Record<string, string>
}

export function LinkAutofill({ uid, defaultEmail = '', amountMinor, currency = 'usd', returnUrl, metadata }: Props) {
  const { confirm, pending, error } = useStripeConfirm()

  const linkOptions = useMemo(() => ({ defaultValues: { email: defaultEmail } }), [defaultEmail])
  const paymentOptions = useMemo(() => ({ defaultValues: { billingDetails: { email: defaultEmail } } }), [defaultEmail])

  const onPay = () => {
    emitClick('ui:pay:link', { amount: amountMinor })
    confirm({ uid, email: defaultEmail, amountMinor, currency, returnUrl, metadata })
  }

  return (
    <div className="space-y-4">
      <LinkAuthenticationElement options={linkOptions} />
      <PaymentElement options={paymentOptions} />
      <Button type="button" onClick={onPay} disabled={pending} className="w-full">
        {pending ? 'Confirming…' : 'Pay with Touch ID'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
