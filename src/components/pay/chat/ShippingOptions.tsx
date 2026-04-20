// ported from shop/buy-in-chatgpt/ShippingOptions.tsx on 2026-04-20
/**
 * Shipping Options Component
 *
 * Shows available shipping methods with delivery estimates
 * Updates checkout session with selected shipping method
 *
 * NOTE: @/components/ui/radio-group is not present in envelopes.
 * A minimal inline radio group is used instead.
 */

import { Loader2, Truck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface ShippingOption {
  id: string
  title: string
  subtitle?: string
  total: number
  earliest_delivery_time: string
  latest_delivery_time: string
}

interface ShippingOptionsProps {
  sessionId: string
  options: ShippingOption[]
  onShippingSelected: (optionId: string) => void
}

export function ShippingOptions({ sessionId, options, onShippingSelected }: ShippingOptionsProps) {
  const [selectedOption, setSelectedOption] = useState(options[0]?.id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedOption) return
    emitClick('ui:pay:chat-shipping-select')
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('[ShippingOptions] Updating shipping option:', selectedOption)

      const response = await fetch(`/api/checkout_sessions/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.PUBLIC_COMMERCE_API_KEY}`,
        },
        body: JSON.stringify({
          fulfillment_option_id: selectedOption,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ message: 'Unknown error' }))) as { message?: string }
        console.error('[ShippingOptions] API error:', errorData)
        throw new Error(errorData.message || 'Failed to update shipping option')
      }

      const updatedSession = await response.json()
      console.log('[ShippingOptions] Updated session:', updatedSession)
      console.log('[ShippingOptions] Calling onShippingSelected')

      onShippingSelected(selectedOption)
    } catch (err) {
      console.error('[ShippingOptions] Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDeliveryDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'TBD'
    }
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inline radio group — radio-group shadcn component not present in envelopes */}
        <div role="radiogroup" className="space-y-2">
          {options.map((option) => (
            <div
              key={option.id}
              role="radio"
              aria-checked={selectedOption === option.id}
              tabIndex={0}
              className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer"
              onClick={() => setSelectedOption(option.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  setSelectedOption(option.id)
                }
              }}
            >
              <input
                type="radio"
                id={option.id}
                name="shipping"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                className="h-4 w-4 accent-primary"
              />
              <label htmlFor={option.id} className="flex-1 cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{option.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.subtitle ||
                        `${formatDeliveryDate(option.earliest_delivery_time)} - ${formatDeliveryDate(option.latest_delivery_time)}`}
                    </p>
                  </div>
                  <p className="font-bold">{option.total === 0 ? 'FREE' : `$${(option.total / 100).toFixed(2)}`}</p>
                </div>
              </label>
            </div>
          ))}
        </div>

        {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

        <Button className="w-full" onClick={handleSubmit} disabled={!selectedOption || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating shipping...
            </>
          ) : (
            'Continue to Payment'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
