// ported from shop/buy-in-chatgpt/PaymentProcessor.tsx on 2026-04-20
/**
 * Payment Processor Component
 *
 * Handles SPT (Shared Payment Token) payment completion
 * This is the key integration point for ChatGPT payments
 */

import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { emitClick } from '@/lib/ui-signal'

interface PaymentProcessorProps {
  sessionId: string
  totalAmount: number
  onPaymentComplete: (orderId: string, paymentIntentId?: string) => void
}

export function PaymentProcessor({ sessionId, totalAmount, onPaymentComplete }: PaymentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingSpt, setIsGeneratingSpt] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [sptToken, setSptToken] = useState<string>('')

  const generateTestSpt = async () => {
    emitClick('ui:pay:chat-pay')
    setIsGeneratingSpt(true)
    setError(null)

    try {
      // Generate a test SPT using Stripe's test helpers
      // In production, ChatGPT creates this automatically
      const response = await fetch('/api/stripe/test-spt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.PUBLIC_COMMERCE_API_KEY}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'usd',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate test SPT')
      }

      const data = (await response.json()) as { token: string }
      setSptToken(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test token')
    } finally {
      setIsGeneratingSpt(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    emitClick('ui:pay:chat-confirm')
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/checkout_sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.PUBLIC_COMMERCE_API_KEY}`,
        },
        body: JSON.stringify({
          buyer: {
            email,
          },
          payment_data: {
            provider: 'stripe',
            token: sptToken,
          },
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string }
        throw new Error(errorData.message || 'Payment failed')
      }

      const result = (await response.json()) as { status?: string; order?: { id: string }; payment_intent_id?: string }

      if (result.status === 'completed' && result.order) {
        // Pass both order ID and payment intent ID (if available from session storage)
        const paymentIntentId = result.payment_intent_id
        onPaymentComplete(result.order.id, paymentIntentId)
      } else {
        throw new Error('Payment did not complete successfully')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Order confirmation will be sent to this email</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md space-y-3">
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">How Payment Works</p>
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                <strong>In Production:</strong> When a customer shops in ChatGPT, ChatGPT automatically creates a Shared
                Payment Token (SPT) using the customer saved payment method. The SPT is sent to us and we charge it via
                Stripe.
              </p>
            </div>
            <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                <strong>For This Demo:</strong> We will create a real Stripe test transaction using a test card. Click
                below to generate a test payment method - this will appear in your Stripe dashboard.
              </p>
            </div>
          </div>

          {!sptToken ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={generateTestSpt}
              disabled={isGeneratingSpt}
            >
              {isGeneratingSpt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Test SPT...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Generate Test Payment Token
                </>
              )}
            </Button>
          ) : (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-md">
              <p className="text-xs font-mono text-green-800 dark:text-green-200 break-all">{sptToken}</p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                Token generated successfully. Ready to complete purchase.
              </p>
            </div>
          )}

          <div className="bg-accent p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-2xl font-bold">${(totalAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full" disabled={isProcessing || !sptToken}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing payment...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete Purchase
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">Your payment is processed securely via Stripe</p>
        </form>
      </CardContent>
    </Card>
  )
}
