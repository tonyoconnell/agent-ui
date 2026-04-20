// ported from shop/buy-in-chatgpt/OrderConfirmation.tsx on 2026-04-20
/**
 * Order Confirmation Component
 *
 * Shows successful order completion with order details
 * Displayed after payment is processed
 */

import { ArrowRight, CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface OrderConfirmationProps {
  orderId: string
  orderUrl: string
  email?: string
  paymentIntentId?: string
}

export function OrderConfirmation({ orderId, orderUrl, email, paymentIntentId }: OrderConfirmationProps) {
  return (
    <Card className="border-green-500">
      <CardHeader className="bg-green-50 dark:bg-green-950">
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-6 w-6" />
          Order Confirmed!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Order Number</p>
          <p className="font-mono text-lg font-bold">{orderId}</p>
        </div>

        {email && (
          <div className="bg-accent p-4 rounded-lg">
            <p className="text-sm">
              A confirmation email has been sent to <span className="font-medium">{email}</span>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">What's next?</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Your order is being processed</li>
            <li>✓ You'll receive a shipping notification soon</li>
            <li>✓ Expected delivery: 5-7 business days</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <a
              href={`/shop/orders/thank-you-chatgpt${paymentIntentId ? `?payment_intent=${paymentIntentId}` : ''}`}
              onClick={() => emitClick('ui:pay:chat-confirm')}
            >
              <Download className="mr-2 h-4 w-4" />
              View Order
            </a>
          </Button>

          <Button className="flex-1" asChild>
            <a href="/shop/buy-in-chatgpt" onClick={() => emitClick('ui:pay:chat-next')}>
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2">Questions? Contact us at support@one.ie</div>
      </CardContent>
    </Card>
  )
}
