// ported from shop/buy-in-chatgpt/AddressForm.tsx on 2026-04-20
/**
 * Address Form Component
 *
 * Collects shipping address from user in conversational format
 * Updates checkout session with fulfillment address
 */

import { Loader2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { emitClick } from '@/lib/ui-signal'

interface AddressFormProps {
  sessionId: string
  onAddressSubmitted: (updatedSession: any) => void
}

export function AddressForm({ sessionId, onAddressSubmitted }: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    line_one: '',
    line_two: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    emitClick('ui:pay:chat-address-submit')
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/checkout_sessions/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.PUBLIC_COMMERCE_API_KEY}`,
        },
        body: JSON.stringify({
          fulfillment_address: formData,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ message: 'Unknown error' }))) as { message?: string }
        console.error('[AddressForm] API error:', errorData)
        throw new Error(errorData.message || 'Failed to update address')
      }

      const updatedSession = await response.json()
      console.log('[AddressForm] Updated session:', updatedSession)

      onAddressSubmitted(updatedSession)
    } catch (err) {
      console.error('[AddressForm] Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="line_one">Street Address</Label>
            <Input
              id="line_one"
              value={formData.line_one}
              onChange={(e) => updateField('line_one', e.target.value)}
              placeholder="123 Main St"
              required
            />
          </div>

          <div>
            <Label htmlFor="line_two">Apt, Suite, etc. (optional)</Label>
            <Input
              id="line_two"
              value={formData.line_two}
              onChange={(e) => updateField('line_two', e.target.value)}
              placeholder="Apt 4B"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="San Francisco"
                required
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="CA"
                required
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="postal_code">ZIP Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => updateField('postal_code', e.target.value)}
              placeholder="94102"
              required
            />
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving address...
              </>
            ) : (
              'Continue to Shipping'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
