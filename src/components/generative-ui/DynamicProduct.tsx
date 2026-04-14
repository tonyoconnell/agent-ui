/**
 * DynamicProduct Component
 *
 * Product card for generative UI with working Add to Cart functionality
 * Uses design system colors and follows 6-dimension ontology (Things)
 */

import { CheckCircle2, Package, ShoppingCart, Star } from 'lucide-react'
import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export interface ProductData {
  title: string
  description?: string
  price: number
  originalPrice?: number
  image?: string
  rating?: number
  reviewCount?: number
  stock?: number
  badge?: string
  category?: string
}

// Simple cart state (in a real app, this would use a global state management solution)
let cartTotal = 0
const cartItems: Array<{ title: string; price: number; quantity: number }> = []

export function DynamicProduct({
  data,
  onAddToCart,
}: {
  data: ProductData
  onAddToCart?: (data: ProductData, quantity: number) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [processing, setProcessing] = useState(false)
  const [_currentTotal, setCurrentTotal] = useState(cartTotal)
  const checkoutRef = React.useRef<HTMLDivElement>(null)

  // Calculate item total based on current quantity
  const itemTotal = data.price * quantity

  const handleAddToCart = () => {
    // Add to cart
    cartTotal += itemTotal
    cartItems.push({ title: data.title, price: data.price, quantity })

    console.log('Cart updated:', {
      items: cartItems,
      total: cartTotal.toFixed(2),
    })

    setCurrentTotal(cartTotal)
    setAddedToCart(true)
    setShowCheckout(true)

    // Trigger callback to show follow-up message and checkout
    if (onAddToCart) {
      onAddToCart(data, quantity)
    }

    // Scroll to checkout section after it appears
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }, 100)

    // Reset "Added to Cart!" button text after 2 seconds, but keep checkout visible
    setTimeout(() => {
      setAddedToCart(false)
    }, 2000)
  }

  const handleProceedToCheckout = () => {
    // Show email collection form (ChatGPT-style flow)
    setShowEmailForm(true)
  }

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email?.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    setProcessing(true)

    try {
      // Call Stripe checkout API
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productTitle: data.title,
          productDescription: data.description,
          productImage: data.image,
          price: data.price,
          quantity: quantity,
          email: email,
        }),
      })

      const json: unknown = await response.json()
      if (typeof json !== 'object' || json === null) throw new Error('Invalid response format')
      const result = json as { error?: string; url?: string }

      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed')
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed. Please try again.'
      alert(errorMessage)
      setProcessing(false)
    }
  }

  const discount = data.originalPrice ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100) : 0

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        {/* Product Image */}
        {data.image && (
          <div className="relative aspect-square overflow-hidden bg-foreground/5">
            <img
              src={data.image}
              alt={data.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {discount > 0 && (
              <Badge className="absolute top-3 right-3 bg-destructive text-white" variant="destructive">
                -{discount}%
              </Badge>
            )}
            {data.badge && <Badge className="absolute top-3 left-3 bg-tertiary text-white">{data.badge}</Badge>}
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-font line-clamp-2">{data.title}</CardTitle>
              {data.category && <CardDescription className="text-font/60 mt-1">{data.category}</CardDescription>}
            </div>
          </div>

          {/* Rating */}
          {data.rating !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(data.rating!) ? 'fill-primary text-primary' : 'fill-font/10 text-font/20'
                    }`}
                  />
                ))}
              </div>
              {data.reviewCount !== undefined && (
                <span className="text-xs text-font/60">({data.reviewCount} reviews)</span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {data.description && <p className="text-sm text-font/80 line-clamp-2">{data.description}</p>}

          {/* Stock Status */}
          {data.stock !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-font/60" />
              <span className={`text-font/80 ${data.stock < 10 ? 'text-destructive' : ''}`}>
                {data.stock > 0 ? `${data.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">${data.price.toFixed(2)}</span>
            {data.originalPrice && data.originalPrice > data.price && (
              <span className="text-sm text-font/40 line-through">${data.originalPrice.toFixed(2)}</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {/* Quantity Selector */}
          <div className="flex w-full items-center gap-2">
            <label className="text-sm text-font/80 font-medium">Qty:</label>
            <div className="flex items-center border border-border rounded-md bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 p-0 text-font"
                disabled={quantity <= 1 || (data.stock !== undefined && data.stock === 0)}
              >
                −
              </Button>
              <span className="w-12 text-center text-sm text-font font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.min(data.stock || 999, quantity + 1))}
                className="h-8 w-8 p-0 text-font"
                disabled={data.stock !== undefined && quantity >= data.stock}
              >
                +
              </Button>
            </div>
          </div>

          {/* Add to Cart Button - Secondary Color */}
          <Button
            variant="secondary"
            className="w-full bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))] hover:bg-[hsl(var(--color-secondary))]/90"
            onClick={handleAddToCart}
            disabled={addedToCart || (data.stock !== undefined && data.stock === 0)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {addedToCart ? '✓ Added to Cart!' : data.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          {/* Item Total Display - Updates with quantity */}
          <div className="w-full pt-2 border-t border-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-font/80">Total:</span>
              <span className="font-bold text-primary">${itemTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Follow-up Message and Checkout (shown after adding to cart) */}
      {showCheckout && (
        <div ref={checkoutRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Success Message */}
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium">
                  <span className="font-semibold">{data.title}</span> has been added to your cart
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Cart */}
          <Card className="overflow-hidden">
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
                        <span className="text-sm text-muted-foreground line-through">
                          ${data.originalPrice.toFixed(2)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          Save {discount}%
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">${itemTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t text-center text-xs">
                <div className="flex flex-col items-center gap-1">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <span>Free Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>90-Day Returns</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 p-6 pt-0">
              {/* Checkout Button or Email Form */}
              {!showEmailForm ? (
                <>
                  <Button
                    className="w-full bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90 h-12"
                    onClick={handleProceedToCheckout}
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Proceed to Checkout
                  </Button>

                  {/* Additional Info */}
                  <p className="text-xs text-center text-muted-foreground">Secure payment powered by Stripe</p>
                </>
              ) : (
                <form onSubmit={handleSubmitEmail} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Enter your email to continue
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      disabled={processing}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEmailForm(false)}
                      disabled={processing}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={processing || !email}
                      className="flex-1 bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90"
                    >
                      {processing ? 'Processing...' : 'Continue to Payment'}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">We'll send your receipt to this email</p>
                </form>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
