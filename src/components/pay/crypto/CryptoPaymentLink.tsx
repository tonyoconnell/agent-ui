// Payment-link creator for the pay showcase — rewritten 2026-04-20
// Guarantees a working pay.one.ie URL (deterministic, computed client-side)
// and a working QR. The /api/pay/create-link call is a best-effort upgrade
// to a shortlink — if it fails, the deterministic long URL still works.

import { ArrowUpRight, Check, Copy, Link2, Share2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getPaymentQRForData, getPaymentUrl } from '@/components/u/lib/PayService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
] as const

interface CreateLinkResponse {
  linkUrl?: string
  qr?: string
}

interface CryptoPaymentLinkProps {
  sellerUid: string
  defaultAmount?: string
  defaultCurrency?: 'ETH' | 'USDC' | 'USDT' | 'DAI' | string
  onLinkCreated?: (url: string) => void
  className?: string
}

export function CryptoPaymentLink({
  sellerUid,
  defaultAmount = '',
  defaultCurrency = 'USDC',
  onLinkCreated,
  className,
}: CryptoPaymentLinkProps) {
  const [amount, setAmount] = useState(defaultAmount)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [memo, setMemo] = useState('')
  const [sku, setSku] = useState('')
  const [expiry, setExpiry] = useState<number>(EXPIRY_OPTIONS[1].value)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Deterministic long URL — always resolves because it's just pay.one.ie?params
  const longUrl = useMemo(() => {
    if (!amount) return null
    return getPaymentUrl({
      to: sellerUid,
      amount,
      token: currency,
      chain: String(currency).toLowerCase(),
      memo: memo || undefined,
      product: sku || undefined,
    })
  }, [sellerUid, amount, currency, memo, sku])

  // Prefer shortlink once server has minted one, fall back to the long URL
  const activeUrl = shortUrl ?? longUrl
  const qrUrl = useMemo(() => (activeUrl ? getPaymentQRForData(activeUrl, 280) : null), [activeUrl])

  const formatExpiry = (ms: number): string => {
    if (ms <= 0) return 'Never'
    const days = Math.floor(ms / 86400000)
    if (days > 0) return `${days}d`
    const hours = Math.floor(ms / 3600000)
    if (hours > 0) return `${hours}h`
    return `${Math.floor(ms / 60000)}m`
  }

  // Best-effort: POST /api/pay/create-link to mint a shortlink. If it fails,
  // the long URL already works — we never leave the user without a link.
  const handleGenerate = async () => {
    if (!amount || !longUrl) return
    emitClick('ui:pay:crypto-link-create', { amount, currency })
    setGenerating(true)
    setShortUrl(null)
    try {
      const res = await fetch('/api/pay/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sellerUid,
          amount,
          rail: 'crypto',
          memo: memo || undefined,
          sku: sku || undefined,
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as CreateLinkResponse
        if (data.linkUrl) {
          setShortUrl(data.linkUrl)
          onLinkCreated?.(data.linkUrl)
        } else {
          onLinkCreated?.(longUrl)
        }
      } else {
        // Server didn't mint a shortlink — long URL is still valid
        onLinkCreated?.(longUrl)
      }
    } catch {
      // Network error — the long URL still works
      onLinkCreated?.(longUrl)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!activeUrl) return
    emitClick('ui:pay:crypto-link-copy')
    try {
      await navigator.clipboard.writeText(activeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* no-op */
    }
  }

  const handleOpen = () => {
    emitClick('ui:pay:crypto-link-open', { rail: 'link', amount, currency })
  }

  const handleShare = async () => {
    if (!activeUrl) return
    emitClick('ui:pay:crypto-link-share')
    if (typeof navigator === 'undefined' || !navigator.share) return
    try {
      await navigator.share({
        title: 'Payment link',
        text: memo || `Pay ${amount} ${currency}`,
        url: activeUrl,
      })
    } catch {
      /* user cancelled */
    }
  }

  const handleReset = () => {
    emitClick('ui:pay:crypto-link-reset')
    setShortUrl(null)
    setAmount('')
    setMemo('')
    setSku('')
  }

  return (
    <div className={cn('rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 mb-0.5">Request</div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            Create a payment link
          </h3>
        </div>
        {activeUrl && <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-800">live</Badge>}
      </div>

      {!activeUrl || !longUrl ? (
        // ── FORM ──────────────────────────────────────────────────────
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="link-amount" className="text-xs text-zinc-500">
                Amount *
              </Label>
              <Input
                id="link-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.000001"
                min="0"
                className="bg-zinc-950 border-zinc-800"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-currency" className="text-xs text-zinc-500">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="link-currency" className="bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-memo" className="text-xs text-zinc-500">
              Description
            </Label>
            <Textarea
              id="link-memo"
              placeholder="What is this payment for?"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="bg-zinc-950 border-zinc-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="link-sku" className="text-xs text-zinc-500">
                SKU (optional)
              </Label>
              <Input
                id="link-sku"
                type="text"
                placeholder="sku-123"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-expiry" className="text-xs text-zinc-500">
                Expiry
              </Label>
              <Select value={String(expiry)} onValueChange={(v) => setExpiry(parseInt(v, 10))}>
                <SelectTrigger id="link-expiry" className="bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!amount || generating}
            className="w-full h-11 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold"
          >
            {generating ? (
              <>Generating…</>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate payment link
              </>
            )}
          </Button>
        </div>
      ) : (
        // ── GENERATED LINK ────────────────────────────────────────────
        <div className="p-5 space-y-5">
          {/* QR */}
          {qrUrl && (
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl">
                <img src={qrUrl} alt="Payment link QR code" className="w-[220px] h-[220px]" width={220} height={220} />
              </div>
            </div>
          )}

          {/* Link summary */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 divide-y divide-zinc-800/60">
            <Row label="Amount" value={`${amount} ${currency}`} mono />
            {memo && <Row label="Memo" value={memo} />}
            {sku && <Row label="SKU" value={sku} mono />}
            <Row label="Expires" value={formatExpiry(expiry)} />
            <Row label="Route" value={shortUrl ? 'shortlink' : 'direct'} pill={shortUrl ? 'emerald' : 'zinc'} />
          </div>

          {/* Link box */}
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 break-all">
              {activeUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0 border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
              aria-label="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* BIG CTA */}
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpen}
            className="group flex items-center justify-between w-full px-5 py-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold transition-all shadow-lg shadow-emerald-900/30"
          >
            <div className="flex flex-col items-start">
              <span className="text-xs font-normal text-emerald-100/80 uppercase tracking-widest">Open checkout</span>
              <span className="text-lg">pay.one.ie</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono opacity-90">
                {amount} {currency}
              </span>
              <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-200"
            >
              New link
            </Button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex-1 border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-200"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            )}
          </div>

          {copied && (
            <Alert className="border-emerald-900/60 bg-emerald-950/30 text-emerald-300">
              <AlertDescription>Link copied to clipboard.</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  pill,
}: {
  label: string
  value: string
  mono?: boolean
  pill?: 'emerald' | 'zinc'
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-zinc-500 text-xs uppercase tracking-wider">{label}</span>
      {pill ? (
        <span
          className={cn(
            'text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border',
            pill === 'emerald' && 'text-emerald-300 bg-emerald-950/40 border-emerald-900/60',
            pill === 'zinc' && 'text-zinc-400 bg-zinc-900 border-zinc-800',
          )}
        >
          {value}
        </span>
      ) : (
        <span className={cn('text-zinc-200', mono && 'font-mono text-xs')}>{value}</span>
      )}
    </div>
  )
}
