// ported from ontology-ui/crypto/payments/ReceivePayment.tsx on 2026-04-20

import { useEffect, useState } from 'react'
import * as PayService from '@/components/u/lib/PayService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

const DEFAULT_CURRENCIES = ['ETH', 'USDC', 'USDT', 'DAI']

interface CryptoAcceptAddressProps {
  address: string
  chainId?: number
  currencies?: string[]
  showQR?: boolean
  onCopy?: () => void
  variant?: 'default' | string
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
}

export function CryptoAcceptAddress({
  address,
  chainId = 1,
  currencies = DEFAULT_CURRENCIES,
  showQR = true,
  onCopy,
  variant = 'default',
  size = 'md',
  interactive = true,
  className,
}: CryptoAcceptAddressProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0])
  const [amount, setAmount] = useState('')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [paymentLink, setPaymentLink] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Derive the chain slug from chainId (ETH=1 → "eth", otherwise use token name)
  const chainSlug = chainId === 1 ? 'eth' : selectedCurrency.toLowerCase()

  const handleGenerateRequest = async () => {
    setIsGenerating(true)
    try {
      // Use PayService.getPaymentQRUrl for the QR image source
      const qr = PayService.getPaymentQRUrl(address, chainSlug)
      setQrUrl(qr)

      // Use PayService.getPaymentUrl for the shareable link
      const link = PayService.getPaymentUrl({
        to: address,
        amount: amount || undefined,
        token: selectedCurrency,
        chain: chainSlug,
      })
      setPaymentLink(link)
    } catch (err) {
      console.error('Failed to generate payment request:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyAddress = async () => {
    emitClick('ui:pay:crypto-show-address')
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Request',
          text: `Send ${amount || 'any amount of'} ${selectedCurrency} to this address`,
          url: paymentLink,
        })
      } catch (err) {
        console.error('Failed to share:', err)
      }
    }
  }

  useEffect(() => {
    handleGenerateRequest()
  }, [handleGenerateRequest])

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
              <span className="text-2xl">📥</span>
              <span>Receive Payment</span>
            </CardTitle>
            <CardDescription className="mt-1">Generate a payment request with QR code</CardDescription>
          </div>
          <Badge variant="outline">Chain {chainId}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code Display */}
        {showQR && qrUrl && (
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={qrUrl} alt="Payment QR Code" className="w-48 h-48 border-2 border-gray-200 rounded-lg" />
          </div>
        )}

        {/* Address Display */}
        <div className="space-y-2">
          <Label>Your Address</Label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-secondary rounded-lg font-mono text-sm break-all">{address}</div>
            <Button variant="outline" size="icon" onClick={handleCopyAddress} className="shrink-0">
              {copied ? '✓' : '📋'}
            </Button>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr} value={curr}>
                  {curr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Optional Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (Optional)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Leave empty for any amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.000001"
            min="0"
          />
          <p className="text-xs text-muted-foreground">Specify an amount to pre-fill the payment request</p>
        </div>

        {/* Payment Link */}
        {paymentLink && (
          <div className="space-y-2">
            <Label>Payment Link</Label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-secondary rounded-lg font-mono text-xs break-all">{paymentLink}</div>
              <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                📋
              </Button>
            </div>
          </div>
        )}

        {copied && (
          <Alert>
            <AlertDescription>Copied to clipboard!</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button className="flex-1" onClick={handleGenerateRequest} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Regenerate QR'}
        </Button>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <Button variant="outline" onClick={handleShare}>
            Share
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
