import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import type { CapabilityListing } from '@/pages/api/market/list'
import { BountyComposer } from './BountyComposer'

type SortMode = 'weight' | 'price' | 'success'
type Lens = 'all' | 'highways' | 'frontier'

const LENS_LABELS: Record<Lens, string> = {
  all: 'All',
  highways: 'Highways',
  frontier: 'Frontier',
}

export function MarketView() {
  const [listings, setListings] = useState<CapabilityListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [sortMode, setSortMode] = useState<SortMode>('weight')
  const [lens, setLens] = useState<Lens>('all')
  const [search, setSearch] = useState('')
  const [bountyTarget, setBountyTarget] = useState<CapabilityListing | null>(null)
  const [, startTransition] = useTransition()

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const tagParam = params.get('tag')
      if (tagParam) setSelectedTags(new Set([tagParam]))

      const res = await fetch('/api/market/list')
      if (res.ok) {
        const data = (await res.json()) as { capabilities: CapabilityListing[] }
        setListings(data.capabilities)
      }
    } catch {
      // empty fallback
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleHire = (listing: CapabilityListing) => {
    emitClick('ui:market:hire', { skillId: listing.skillId, sellerUid: listing.sellerUid })
    startTransition(async () => {
      await fetch('/api/market/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: listing.skillId, sellerUid: listing.sellerUid }),
      })
    })
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const l of listings) for (const t of l.tags) tags.add(t)
    return Array.from(tags).sort()
  }, [listings])

  const filtered = useMemo(() => {
    let result = listings

    if (lens === 'highways') result = result.filter((l) => l.successRate > 0.8)
    else if (lens === 'frontier') result = result.filter((l) => l.successRate === 0)

    if (selectedTags.size > 0) {
      result = result.filter((l) => l.tags.some((t) => selectedTags.has(t)))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.sellerName.toLowerCase().includes(q))
    }

    return [...result].sort((a, b) => {
      if (sortMode === 'weight') return b.weight - a.weight
      if (sortMode === 'price') return a.price - b.price
      return b.successRate - a.successRate
    })
  }, [listings, lens, selectedTags, search, sortMode])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)

      const url = new URL(window.location.href)
      if (next.size === 1) url.searchParams.set('tag', Array.from(next)[0])
      else url.searchParams.delete('tag')
      window.history.replaceState({}, '', url)

      return next
    })
  }

  const stats = useMemo(() => {
    const provenCount = listings.filter((l) => l.weight > 10).length
    return { count: listings.length, proven: provenCount }
  }, [listings])

  return (
    <div className="min-h-screen bg-background text-font p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
            <p className="text-sm text-muted-foreground">
              {stats.count} skills · {stats.proven} proven · ranked by pheromone
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills…"
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-font placeholder-muted-foreground w-48 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Lens tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(LENS_LABELS) as Lens[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLens(l)
                emitClick('ui:market:lens', { lens: l })
              }}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                lens === l
                  ? 'bg-primary text-white border-primary'
                  : 'text-muted-foreground border-border hover:border-border hover:text-font'
              }`}
            >
              {LENS_LABELS[l]}
            </button>
          ))}
        </div>

        {/* Sort + tag filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Sort:</span>
          {(['weight', 'price', 'success'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setSortMode(mode)
                emitClick('ui:market:sort', { mode })
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                sortMode === mode
                  ? 'bg-primary/20 text-primary-bright border-primary/40'
                  : 'text-muted-foreground border-muted hover:border-border'
              }`}
            >
              {mode === 'weight' ? 'Recommended' : mode === 'price' ? 'Cheapest' : 'Success rate'}
            </button>
          ))}

          {allTags.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground ml-4">Tags:</span>
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTags.has(tag)
                      ? 'bg-secondary-bright/20 text-secondary-bright border-secondary-bright/40'
                      : 'text-muted-foreground border-muted hover:border-border'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allTags.length > 8 && <span className="text-xs text-muted-foreground">+{allTags.length - 8}</span>}
            </>
          )}

          {(selectedTags.size > 0 || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedTags(new Set())
                setSearch('')
                window.history.replaceState({}, '', window.location.pathname)
              }}
              className="text-xs text-muted-foreground hover:text-foreground ml-2"
            >
              clear
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center gap-2 py-12 justify-center text-sm text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading listings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No skills found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((l) => (
              <SkillCard
                key={`${l.skillId}:${l.sellerUid}`}
                listing={l}
                onHire={handleHire}
                onBounty={setBountyTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bounty composer overlay */}
      {bountyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-xl border border-border bg-background shadow-2xl">
            <BountyComposer
              listing={bountyTarget}
              posterUid="user"
              onCreated={() => setBountyTarget(null)}
              onClose={() => setBountyTarget(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface SkillCardProps {
  listing: CapabilityListing
  onHire: (listing: CapabilityListing) => void
  onBounty: (listing: CapabilityListing) => void
}

function SkillCard({ listing, onHire, onBounty }: SkillCardProps) {
  const { skillId, name, price, pricingMode, sellerName, sellerUid, successRate, tags, weight, strength, resistance } =
    listing

  const isProven = weight > 10
  const isToxic = resistance >= 10 && resistance > strength * 2
  const total = strength + resistance
  const settleRate = total > 0 ? Math.round((1 - resistance / total) * 100) : null
  const tradeCount = Math.round(weight)

  return (
    <Card className="bg-card border border-border hover:border-border transition-colors group">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-font text-sm leading-tight truncate">{name}</h3>
            <p className="text-xs text-muted-foreground truncate">{skillId}</p>
          </div>
          <span
            className={`shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded ${
              pricingMode === 'free'
                ? 'bg-muted text-muted-foreground'
                : 'bg-tertiary-bright/20 text-tertiary-bright border border-tertiary-bright/30'
            }`}
          >
            {pricingMode === 'free' ? 'Free' : `$${price.toFixed(2)}`}
          </span>
        </div>

        {/* Pheromone bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isToxic
                  ? 'bg-destructive/70'
                  : isProven
                    ? 'bg-gradient-to-r from-primary to-secondary'
                    : 'bg-primary/50'
              }`}
              style={{ width: `${Math.min(100, (weight / 50) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono w-10 text-right">{weight.toFixed(1)}</span>
        </div>

        {/* Seller + success */}
        <div className="flex items-center justify-between gap-2">
          <a
            href={`/u/${sellerUid}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
            onClick={() => emitClick('ui:market:seller', { sellerUid })}
          >
            {sellerName}
          </a>
          <span className="text-xs text-muted-foreground">
            {settleRate !== null ? `${settleRate}% settle` : `${Math.round(successRate * 100)}% success`}
            {tradeCount > 0 ? ` · ${tradeCount} trades` : ''}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground border-border">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>}
          </div>
        )}

        {/* Status badges */}
        {(isProven || isToxic) && (
          <div className="flex gap-1.5">
            {isProven && (
              <Badge className="bg-secondary-bright/20 text-secondary-bright border-secondary-bright/30 text-xs">proven</Badge>
            )}
            {isToxic && <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">toxic</Badge>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={`/market/${skillId}`}
            onClick={() => emitClick('ui:market:view', { skillId })}
            className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted hover:border-border transition-colors"
          >
            View
          </a>
          <button
            type="button"
            onClick={() => {
              emitClick('ui:market:bounty-open', { skillId, sellerUid })
              onBounty(listing)
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-font hover:border-border transition-colors"
          >
            Bounty
          </button>
          <button
            type="button"
            onClick={() => onHire(listing)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            Hire
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
