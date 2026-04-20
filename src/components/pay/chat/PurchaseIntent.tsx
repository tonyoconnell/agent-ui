// ported from shop/buy-in-chatgpt/PurchaseIntent.tsx on 2026-04-20
/**
 * Purchase Intent Component
 *
 * Displayed when user expresses intent to buy
 * Creates checkout session and guides user through purchase flow
 */

import { Loader2, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface PurchaseIntentProps {
  productId: string
  productName: string
  productPrice: number
  onSessionCreated: (sessionId: string) => void
}

export function PurchaseIntent({ productId, productName, productPrice, onSessionCreated }: PurchaseIntentProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckoutSession = async () => {
    emitClick('ui:pay:chat-start')
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.PUBLIC_COMMERCE_API_KEY}`,
        },
        body: JSON.stringify({
          items: [
            {
              id: productId,
              quantity: 1,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ message: 'Unknown error' }))) as { message?: string }
        console.error('[PurchaseIntent] API error:', errorData)
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create checkout session`)
      }

      const session = (await response.json()) as { id: string }
      console.log('[PurchaseIntent] Session created:', session)
      onSessionCreated(session.id)
    } catch (err) {
      console.error('[PurchaseIntent] Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Ready to purchase?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{productName}</span>
          <span className="text-lg font-bold">${productPrice.toFixed(2)}</span>
        </div>

        {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

        <Button className="w-full" onClick={createCheckoutSession} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating checkout...
            </>
          ) : (
            'Start Checkout'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">Free shipping • 90-day returns • 3-year warranty</p>
      </CardContent>
    </Card>
  )
}
