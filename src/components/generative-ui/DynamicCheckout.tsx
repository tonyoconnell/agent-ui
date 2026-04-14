/**
 * DynamicCheckout Component
 *
 * Checkout cart for generative UI - ChatGPT-style purchase flow
 * Similar to /shop/buy-in-chatgpt checkout experience
 */

import { CreditCard, Shield, ShoppingCart, Truck } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export interface CheckoutData {
  title: string
  price: number
  originalPrice?: number
  image?: string
  quantity: number
}

export function DynamicCheckout({ data }: { data: CheckoutData }) {
  const [quantity, setQuantity] = useState(data.quantity)
  const [processing, setProcessing] = useState(false)

  const subtotal = data.price * quantity
  const shipping = 0 // Free shipping
  const total = subtotal + shipping

  const discount = data.originalPrice ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100) : 0

  const handleCheckout = async () => {
    setProcessing(true)

    // Simulate checkout process
    setTimeout(() => {
      setProcessing(false)
      alert('Checkout would proceed here with Stripe integration')
    }, 1500)
  }

  return (
    <Card className="overflow-hidden max-w-2xl mx-auto">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Your Cart
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {/* Cart Item */}
        <div className="flex gap-4 mb-6">
          {data.image && (
            <div className="w-24 h-24 flex-shrink-0">
              <img src={data.image} alt={data.title} className="w-full h-full object-cover rounded-lg border" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{data.title}</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xl font-bold text-primary">${data.price.toFixed(2)}</span>
              {data.originalPrice && data.originalPrice > data.price && (
                <>
                  <span className="text-sm text-muted-foreground line-through">${data.originalPrice.toFixed(2)}</span>
                  <Badge variant="destructive" className="text-xs">
                    Save {discount}%
                  </Badge>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-2 mt-3">
              <label className="text-sm text-muted-foreground">Qty:</label>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 p-0"
                  disabled={quantity <= 1}
                >
                  −
                </Button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping:</span>
            <span className="font-bold text-green-600">FREE</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="font-semibold">Total:</span>
            <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t text-center text-xs">
          <div className="flex flex-col items-center gap-1">
            <Truck className="h-4 w-4 text-primary" />
            <span>Free Shipping</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="h-4 w-4 text-primary" />
            <span>90-Day Returns</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-6 pt-0">
        {/* Checkout Button */}
        <Button
          className="w-full bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90 h-12"
          onClick={handleCheckout}
          disabled={processing}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {processing ? 'Processing...' : 'Proceed to Checkout'}
        </Button>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground">Secure payment powered by Stripe</p>
      </CardFooter>
    </Card>
  )
}
