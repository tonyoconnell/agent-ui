// ported from ontology-ui/crypto/payments/PaymentLink.tsx on 2026-04-20

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 3600000 },
  { label: '24 hours', value: 86400000 },
  { label: '7 days', value: 604800000 },
  { label: '30 days', value: 2592000000 },
  { label: 'Never', value: 0 },
]

// Response shape from POST /api/pay/create-link
interface CreateLinkResponse {
  linkUrl: string
  qr?: string
  intent?: string
}

// Generated link state
interface GeneratedLink {
  url: string
  qr?: string
  amount: string
  currency: string
  description?: string
  expiresAt?: number
}

interface CryptoPaymentLinkProps {
  /** The seller's uid — required so /api/pay/create-link knows who receives the payment */
  sellerUid: string
  defaultAmount?: string
  defaultCurrency?: string
  onLinkCreated?: (url: string) => void
  variant?: 'default' | string
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
}

export function CryptoPaymentLink({
  sellerUid,
  defaultAmount,
  defaultCurrency = 'ETH',
  onLinkCreated,
  variant = 'default',
  size = 'md',
  interactive = true,
  className,
}: CryptoPaymentLinkProps) {
  const [amount, setAmount] = useState(defaultAmount || '')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [description, setDescription] = useState('')
  const [expiryTime, setExpiryTime] = useState(EXPIRY_OPTIONS[1].value)
  const [sku, setSku] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateLink = async () => {
    if (!amount) return

    emitClick('ui:pay:crypto-link-create')
    setIsGenerating(true)
    setError(null)

    try {
      const body: {
        to: string
        amount: string
        rail: 'crypto'
        memo?: string
        sku?: string
      } = {
        to: sellerUid,
        amount,
        rail: 'crypto',
      }

      if (description) body.memo = description
      if (sku) body.sku = sku

      const res = await fetch('/api/pay/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data = (await res.json()) as CreateLinkResponse

      const link: GeneratedLink = {
        url: data.linkUrl,
        qr: data.qr,
        amount,
        currency,
        description: description || undefined,
        expiresAt: expiryTime > 0 ? Date.now() + expiryTime : undefined,
      }

      setGeneratedLink(link)
      onLinkCreated?.(link.url)
    } catch (err) {
      console.error('Failed to generate payment link:', err)
      setError((err as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (!generatedLink || typeof navigator === 'undefined' || !navigator.share) return
    try {
      await navigator.share({
        title: 'Payment Request',
        text: description || `Pay ${amount} ${currency}`,
        url: generatedLink.url,
      })
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }

  // Format expiry as human-readable relative time (minimal inline impl)
  const formatExpiry = (ts: number): string => {
    const diff = ts - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d`
    const hours = Math.floor(diff / 3600000)
    if (hours > 0) return `${hours}h`
    return `${Math.floor(diff / 60000)}m`
  }

  return (
    <Card
      className={cn(
        'group relative transition-all duration-200',
        interactive && 'hover:shadow-lg',
        size === 'sm' && 'p-3',
        size === 'md' && 'p-4',
        size === 'lg' && 'p-6',
        className,
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              <span>Payment Link</span>
            </CardTitle>
            <CardDescription className="mt-1">Create a shareable payment link with custom settings</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!generatedLink ? (
          <>
            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.000001"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="DAI">DAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description / Memo */}
            <div className="space-y-2">
              <Label htmlFor="description">Description / Memo</Label>
              <Textarea
                id="description"
                placeholder="What is this payment for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* SKU (optional product reference) */}
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Product ID (Optional)</Label>
              <Input
                id="sku"
                type="text"
                placeholder="product-sku-123"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiry">Link Expiration</Label>
              <Select value={expiryTime.toString()} onValueChange={(val) => setExpiryTime(parseInt(val, 10))}>
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <>
            {/* Generated Link Preview */}
            <div className="space-y-4">
              {/* QR Code (if returned by API) */}
              {generatedLink.qr && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img
                    src={generatedLink.qr}
                    alt="Payment Link QR Code"
                    className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                  />
                </div>
              )}

              {/* Link Details */}
              <div className="space-y-3 p-4 bg-secondary rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-bold">
                    {generatedLink.amount} {generatedLink.currency}
                  </span>
                </div>
                {generatedLink.description && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-muted-foreground">Description</span>
                    <span className="text-sm text-right max-w-[200px]">{generatedLink.description}</span>
                  </div>
                )}
                {generatedLink.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <Badge variant="outline">{formatExpiry(generatedLink.expiresAt)}</Badge>
                  </div>
                )}
              </div>

              {/* Payment URL */}
              <div className="space-y-2">
                <Label>Payment URL</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-secondary rounded-lg font-mono text-xs break-all">
                    {generatedLink.url}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                    {copied ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              {copied && (
                <Alert>
                  <AlertDescription>Copied to clipboard!</AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!generatedLink ? (
          <Button className="w-full" onClick={handleGenerateLink} disabled={!amount || isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Payment Link'}
          </Button>
        ) : (
          <>
            <Button className="flex-1" onClick={() => setGeneratedLink(null)} variant="outline">
              Create New
            </Button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <Button onClick={handleShare}>Share Link</Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
