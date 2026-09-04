// Receive-address card for the pay showcase — rewritten 2026-04-20
// Guarantees a working pay.one.ie link and QR, no API dependency.

import { ArrowUpRight, Check, Copy, Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getPaymentQRForData, getPaymentUrl } from '@/components/u/lib/PayService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

const DEFAULT_CURRENCIES = ['ETH', 'USDC', 'USDT', 'DAI'] as const
type Currency = (typeof DEFAULT_CURRENCIES)[number] | string

interface CryptoAcceptAddressProps {
  address: string
  chainId?: number
  currencies?: readonly string[]
  showQR?: boolean
  onCopy?: () => void
  className?: string
}

export function CryptoAcceptAddress({
  address,
  chainId = 1,
  currencies = DEFAULT_CURRENCIES,
  showQR = true,
  onCopy,
  className,
}: CryptoAcceptAddressProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0])
  const [amount, setAmount] = useState('')
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const chainSlug = useMemo(
    () => (chainId === 1 ? 'eth' : String(selectedCurrency).toLowerCase()),
    [chainId, selectedCurrency],
  )

  // Deterministic, guaranteed-to-resolve pay link — computed from inputs, no API
  const paymentLink = useMemo(
    () =>
      getPaymentUrl({
        to: address,
        amount: amount || undefined,
        token: String(selectedCurrency),
        chain: chainSlug,
      }),
    [address, amount, selectedCurrency, chainSlug],
  )

  // QR encodes the full pay.one.ie URL so scanning opens a real checkout
  const qrUrl = useMemo(() => getPaymentQRForData(paymentLink, 280), [paymentLink])

  const handleCopyAddress = async () => {
    emitClick('ui:pay:crypto-copy-address', { address })
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(true)
      onCopy?.()
      setTimeout(() => setCopiedAddress(false), 1800)
    } catch {
      /* no-op */
    }
  }

  const handleCopyLink = async () => {
    emitClick('ui:pay:crypto-copy-link')
    try {
      await navigator.clipboard.writeText(paymentLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 1800)
    } catch {
      /* no-op */
    }
  }

  const handleOpenPay = () => {
    emitClick('ui:pay:crypto-open-payone', { rail: 'receive', amount, token: selectedCurrency })
  }

  const handleShare = async () => {
    emitClick('ui:pay:crypto-share-receive')
    if (typeof navigator === 'undefined' || !navigator.share) return
    try {
      await navigator.share({
        title: 'Payment request',
        text: amount ? `Send ${amount} ${selectedCurrency}` : `Send any amount of ${selectedCurrency}`,
        url: paymentLink,
      })
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className={cn('rounded-2xl border border-border bg-card/60 overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-border bg-card/80 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary-bright mb-0.5">Receive</div>
          <h3 className="text-base font-semibold text-font">QR · address · shareable link</h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted border border-border">
          chain · {chainSlug}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* ── QR ───────────────────────────────────────── */}
        {showQR && (
          <div className="flex justify-center">
            <div className="p-3 bg-background rounded-xl">
              <img
                src={qrUrl}
                alt={`QR code for ${address}`}
                className="w-[240px] h-[240px]"
                width={240}
                height={240}
              />
            </div>
          </div>
        )}

        {/* ── Address ─────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Your address</Label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-lg bg-muted border border-border font-mono text-xs text-foreground break-all">
              {address}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyAddress}
              className="shrink-0 border-border bg-muted hover:bg-muted"
              aria-label="Copy address"
            >
              {copiedAddress ? <Check className="w-4 h-4 text-tertiary-bright" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* ── Currency + Amount ───────────────────────── */}
        <div className="grid grid-cols-[1fr_1fr] gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="receive-currency">
              Token
            </Label>
            <Select value={String(selectedCurrency)} onValueChange={(v) => setSelectedCurrency(v as Currency)}>
              <SelectTrigger id="receive-currency" className="bg-muted border-border">
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="receive-amount">
              Amount (optional)
            </Label>
            <Input
              id="receive-amount"
              type="number"
              inputMode="decimal"
              placeholder="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.000001"
              min="0"
              className="bg-muted border-border"
            />
          </div>
        </div>

        {/* ── BIG CTA to pay.one.ie ──────────────────── */}
        <a
          href={paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenPay}
          className="group flex items-center justify-between w-full px-5 py-4 rounded-xl bg-gradient-to-br from-[hsl(var(--color-tertiary-bright))] to-[hsl(var(--color-primary-bright))] hover:opacity-80 text-font font-semibold transition-all shadow-lg"
        >
          <div className="flex flex-col items-start">
            <span className="text-xs font-normal text-[hsl(var(--color-tertiary-bright)_/_0.8)] uppercase tracking-widest">
              Open checkout
            </span>
            <span className="text-lg">pay.one.ie</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono opacity-90">
              {amount ? `${amount} ${selectedCurrency}` : String(selectedCurrency)}
            </span>
            <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </a>

        {/* ── Secondary actions ──────────────────────── */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="flex-1 border-border bg-muted hover:bg-muted text-font"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 mr-2 text-tertiary-bright" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" /> Copy link
              </>
            )}
          </Button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1 border-border bg-muted hover:bg-muted text-font"
            >
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          )}
        </div>

        {copiedLink && (
          <Alert className="border-tertiary-bright/40 bg-card/50 text-tertiary-bright">
            <AlertDescription>Link copied. Paste it into any chat.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
