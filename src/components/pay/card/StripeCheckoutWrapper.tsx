// ported from ecommerce/interactive/StripeCheckoutWrapper.tsx on 2026-04-20

/**
 * Stripe Checkout Wrapper Component
 * Provides Stripe Elements context and handles payment intent creation
 *
 * Dissolved deps (not in envelopes):
 *   @/lib/stripe        → createPaymentIntent, getStripe, getStripeAppearance inlined below
 *   @/stores/cart       → cart items must be passed explicitly via `items` prop
 *   @/types/ecommerce   → ShippingAddress inlined below
 */

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StripeCheckoutForm } from './StripeCheckoutForm'

// ---------------------------------------------------------------------------
// Inlined from dissolved @/types/ecommerce
// ---------------------------------------------------------------------------
interface ShippingAddress {
  fullName: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
}

// ---------------------------------------------------------------------------
// Inlined from dissolved @/lib/stripe
// ---------------------------------------------------------------------------
let _stripePromise: Promise<Stripe | null> | null = null

function getStripe(): Promise<Stripe | null> {
  if (!_stripePromise) {
    const key = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('Missing PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable')
      return Promise.resolve(null)
    }
    _stripePromise = loadStripe(key)
  }
  return _stripePromise!
}

function getStripeAppearance() {
  return {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(222.2 47.4% 11.2%)',
      colorBackground: 'hsl(0 0% 100%)',
      colorText: 'hsl(222.2 84% 4.9%)',
      colorDanger: 'hsl(0 84.2% 60.2%)',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  }
}

async function createPaymentIntent(params: {
  amount: number
  currency: string
  metadata?: Record<string, string>
  items: { productId: string; quantity: number }[]
}): Promise<{ clientSecret: string } | null> {
  const res = await fetch('/api/pay/stripe/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: params.items, metadata: params.metadata }),
  })
  if (!res.ok) return null
  return res.json()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StripeCheckoutWrapperProps {
  amount: number
  currency?: string
  metadata?: Record<string, string>
  items?: { productId: string; quantity: number }[]
  shippingAddress?: ShippingAddress
  sellerUid?: string
  onSuccess: (paymentIntentId: string) => void
  onError?: (error: string) => void
}

export function StripeCheckoutWrapper({
  amount,
  currency = 'usd',
  metadata = {},
  items,
  shippingAddress,
  sellerUid = 'unknown',
  onSuccess,
  onError,
}: StripeCheckoutWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initializePayment() {
      try {
        // Cart items must be passed explicitly — @/stores/cart is dissolved
        const cartItems = items ?? []

        const result = await createPaymentIntent({
          amount,
          currency,
          metadata: {
            ...metadata,
            ...(shippingAddress && {
              shipping_name: shippingAddress.fullName,
              shipping_address: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
              shipping_country: shippingAddress.country,
            }),
          },
          items: cartItems,
        })

        if (result) {
          setClientSecret(result.clientSecret)
        } else {
          setError('Failed to initialize payment. Please try again.')
        }
      } catch (_err) {
        setError('An error occurred while setting up payment.')
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [amount, currency, items?.length, shippingAddress, metadata, items])

  // On success: close the loop with a fire-and-forget substrate signal (server webhook is authoritative)
  const handleSuccess = (paymentIntentId: string) => {
    fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver: 'substrate:pay',
        data: {
          weight: amount,
          tags: ['pay', 'card', 'accept'],
          content: {
            rail: 'card',
            from: 'anon',
            to: sellerUid,
            ref: paymentIntentId,
            status: 'pending',
            provider: 'stripe',
          },
        },
      }),
    }).catch(() => {})

    onSuccess(paymentIntentId)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Setting up secure checkout...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Unable to initialize payment. Please refresh and try again.</AlertDescription>
      </Alert>
    )
  }

  const stripePromise = getStripe()

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: getStripeAppearance(),
        loader: 'auto',
      }}
    >
      <StripeCheckoutForm amount={amount} currency={currency} onSuccess={handleSuccess} onError={onError} />
    </Elements>
  )
}
