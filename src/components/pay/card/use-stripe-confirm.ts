import { useElements, useStripe } from '@stripe/react-stripe-js'
import { useCallback, useState } from 'react'

interface ConfirmInput {
  uid: string
  email?: string
  amountMinor: number
  currency: string
  returnUrl?: string
  metadata?: Record<string, string>
}

interface ConfirmResult {
  confirm: (input: ConfirmInput) => Promise<void>
  pending: boolean
  error: string | null
  reset: () => void
}

export function useStripeConfirm(): ConfirmResult {
  const stripe = useStripe()
  const elements = useElements()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = useCallback(
    async (input: ConfirmInput) => {
      if (!stripe || !elements) return
      setError(null)
      setPending(true)
      try {
        const { error: submitError } = await elements.submit()
        if (submitError) return setError(submitError.message ?? 'submit failed')

        const res = await fetch('/api/pay/stripe/express-intent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        })
        const json = (await res.json()) as { clientSecret?: string; error?: string }
        if (!res.ok || !json.clientSecret) return setError(json.error ?? 'intent failed')

        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          clientSecret: json.clientSecret,
          confirmParams: {
            return_url: input.returnUrl ?? `${window.location.origin}/pay/done`,
          },
        })
        if (confirmError) setError(confirmError.message ?? 'confirm failed')
      } finally {
        setPending(false)
      }
    },
    [stripe, elements],
  )

  const reset = useCallback(() => setError(null), [])

  return { confirm, pending, error, reset }
}
