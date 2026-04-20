// ported from shop/buy-in-chatgpt/OrderSummary.tsx on 2026-04-20
/**
 * Order Summary Component
 *
 * Shows final order total with itemization
 * Displays before payment confirmation
 */

import { Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Total {
  type: 'subtotal' | 'shipping' | 'tax' | 'total'
  label: string
  amount: number
}

interface OrderSummaryProps {
  totals: Total[]
  currency: string
}

export function OrderSummary({ totals, currency }: OrderSummaryProps) {
  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`
  }

  const subtotal = totals.find((t) => t.type === 'subtotal')
  const shipping = totals.find((t) => t.type === 'shipping')
  const tax = totals.find((t) => t.type === 'tax')
  const total = totals.find((t) => t.type === 'total')

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subtotal && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatAmount(subtotal.amount)}</span>
          </div>
        )}

        {shipping && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {shipping.amount === 0 ? (
                <span className="text-green-600 font-bold">FREE</span>
              ) : (
                formatAmount(shipping.amount)
              )}
            </span>
          </div>
        )}

        {tax && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatAmount(tax.amount)}</span>
          </div>
        )}

        <Separator />

        {total && (
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatAmount(total.amount)}</span>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground pt-2">Secure payment via Stripe</div>
      </CardContent>
    </Card>
  )
}
