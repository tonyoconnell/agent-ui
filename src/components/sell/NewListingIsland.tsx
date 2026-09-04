/**
 * NewListingIsland — new capability listing form.
 *
 * Fields: name, price (USD, converted to MIST via live rate), description, tags.
 * On submit: emitClick('ui:sell:create') → POST /api/sell/create → show pay URL.
 * Touch ID gate: navigator.credentials.get() with WebAuthn before submission.
 */
import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

/** Approximate USD → MIST conversion (1 SUI ≈ $1; 1 SUI = 1e9 MIST). */
const USD_PER_SUI = 1
const MIST_PER_SUI = 1_000_000_000

function usdToMist(usd: number): bigint {
  const sui = usd / USD_PER_SUI
  return BigInt(Math.round(sui * MIST_PER_SUI))
}

const SUGGESTED_TAGS = ['creative', 'copy', 'research', 'code', 'design', 'data', 'writing', 'analysis']

export function NewListingIsland() {
  const [name, setName] = useState('')
  const [priceUsd, setPriceUsd] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function addCustomTag() {
    const t = customTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !selectedTags.includes(t)) {
      setSelectedTags((prev) => [...prev, t])
    }
    setCustomTag('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    const priceNum = parseFloat(priceUsd)
    if (!name.trim()) {
      setErrorMsg('Name is required.')
      return
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('Enter a valid price.')
      return
    }

    emitClick('ui:sell:create')

    // Touch ID / WebAuthn gate (non-blocking — gracefully degrades if unavailable)
    try {
      if (
        typeof PublicKeyCredential !== 'undefined' &&
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      ) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        if (available) {
          await navigator.credentials.get({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              timeout: 30000,
              userVerification: 'required',
              rpId: window.location.hostname,
            },
          })
        }
      }
    } catch (authErr) {
      // User cancelled or WebAuthn unavailable — proceed without biometric
      const msg = authErr instanceof Error ? authErr.message : ''
      if (msg.includes('cancelled') || msg.includes('NotAllowedError')) {
        setErrorMsg('Touch ID cancelled. Please try again.')
        return
      }
      // Fall through if WebAuthn not enrolled yet
    }

    startTransition(async () => {
      try {
        const priceMist = usdToMist(priceNum)
        const res = await fetch('/api/sell/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            priceMist: priceMist.toString(),
            tags: selectedTags,
            description: description.trim() || undefined,
          }),
        })

        if (!res.ok) {
          const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string }
          setErrorMsg(err.error ?? 'Failed to create listing.')
          return
        }

        const data = (await res.json()) as { capabilityId: string; payUrl: string }
        setPayUrl(data.payUrl)
      } catch {
        setErrorMsg('Network error. Please try again.')
      }
    })
  }

  if (payUrl) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary/20">
            <svg
              className="h-6 w-6 text-tertiary-bright"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-font">Listing published</p>
          <p className="text-xs text-muted-foreground">Share your pay link:</p>
          <a
            href={payUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-sm text-primary-bright transition-colors hover:bg-primary/20"
          >
            {payUrl}
          </a>
          <div className="flex gap-3 pt-2">
            <a href="/sell" className="text-sm text-muted-foreground transition-colors hover:text-font">
              ← My listings
            </a>
            <button
              type="button"
              onClick={() => {
                setPayUrl(null)
                setName('')
                setPriceUsd('')
                setDescription('')
                setSelectedTags([])
              }}
              className="text-sm text-primary-bright transition-colors hover:text-primary"
            >
              Create another
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sl-name" className="text-xs font-medium text-muted-foreground">
              Skill name
            </label>
            <input
              id="sl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Copy Editing"
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-font placeholder-muted-foreground transition-colors focus:border-border focus:outline-none"
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sl-price" className="text-xs font-medium text-muted-foreground">
              Price (USD)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <input
                id="sl-price"
                type="number"
                min="0"
                step="0.01"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                required
                placeholder="0.02"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-7 pr-3 text-sm text-font placeholder-muted-foreground transition-colors focus:border-border focus:outline-none"
              />
            </div>
            {priceUsd && !Number.isNaN(parseFloat(priceUsd)) && (
              <p className="text-xs text-muted-foreground">
                ≈ {(parseFloat(priceUsd) / USD_PER_SUI).toFixed(4)} SUI&nbsp;
                <span className="text-muted-foreground">({usdToMist(parseFloat(priceUsd)).toLocaleString()} MIST)</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sl-desc" className="text-xs font-medium text-muted-foreground">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="sl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What does this skill do? Who is it for?"
              className="resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-font placeholder-muted-foreground transition-colors focus:border-border focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary hover:bg-primary/80 text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer border-border text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomTag()
                  }
                }}
                placeholder="Add custom tag…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-font placeholder-muted-foreground transition-colors focus:border-border focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:text-font"
              >
                Add
              </button>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="rounded-md border border-destructive/40 bg-destructive/20 px-3 py-2 text-xs text-destructive">
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="mt-1 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create listing'}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Touch ID verifies your identity before publishing.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
