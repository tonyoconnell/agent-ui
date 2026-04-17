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
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
            <p className="text-sm text-slate-500">
              {stats.count} skills · {stats.proven} proven · ranked by pheromone
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills…"
              className="bg-[#161622] border border-[#252538] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
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
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'text-slate-400 border-[#252538] hover:border-slate-600 hover:text-slate-100'
              }`}
            >
              {LENS_LABELS[l]}
            </button>
          ))}
        </div>

        {/* Sort + tag filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Sort:</span>
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
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                  : 'text-slate-400 border-slate-700 hover:border-slate-600'
              }`}
            >
              {mode === 'weight' ? 'Recommended' : mode === 'price' ? 'Cheapest' : 'Success rate'}
            </button>
          ))}

          {allTags.length > 0 && (
            <>
              <span className="text-xs text-slate-500 ml-4">Tags:</span>
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTags.has(tag)
                      ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                      : 'text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allTags.length > 8 && <span className="text-xs text-slate-600">+{allTags.length - 8}</span>}
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
              className="text-xs text-slate-600 hover:text-slate-400 ml-2"
            >
              clear
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center gap-2 py-12 justify-center text-sm text-slate-500">
            <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            Loading listings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No skills found.</div>
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
          <div className="rounded-xl border border-[#252538] bg-[#0a0a0f] shadow-2xl">
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
    <Card className="bg-[#161622] border border-[#252538] hover:border-[#353548] transition-colors group">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-100 text-sm leading-tight truncate">{name}</h3>
            <p className="text-xs text-slate-500 truncate">{skillId}</p>
          </div>
          <span
            className={`shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded ${
              pricingMode === 'free'
                ? 'bg-slate-700/50 text-slate-400'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {pricingMode === 'free' ? 'Free' : `$${price.toFixed(2)}`}
          </span>
        </div>

        {/* Pheromone bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isToxic
                  ? 'bg-red-500/70'
                  : isProven
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                    : 'bg-indigo-500/50'
              }`}
              style={{ width: `${Math.min(100, (weight / 50) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 font-mono w-10 text-right">{weight.toFixed(1)}</span>
        </div>

        {/* Seller + success */}
        <div className="flex items-center justify-between gap-2">
          <a
            href={`/u/${sellerUid}`}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors truncate"
            onClick={() => emitClick('ui:market:seller', { sellerUid })}
          >
            {sellerName}
          </a>
          <span className="text-xs text-slate-500">
            {settleRate !== null ? `${settleRate}% settle` : `${Math.round(successRate * 100)}% success`}
            {tradeCount > 0 ? ` · ${tradeCount} trades` : ''}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 text-slate-400 border-slate-700/50">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && <span className="text-xs text-slate-600">+{tags.length - 3}</span>}
          </div>
        )}

        {/* Status badges */}
        {(isProven || isToxic) && (
          <div className="flex gap-1.5">
            {isProven && (
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">proven</Badge>
            )}
            {isToxic && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">toxic</Badge>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={`/market/${skillId}`}
            onClick={() => emitClick('ui:market:view', { skillId })}
            className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg border border-[#252538] text-slate-300 hover:bg-[#1d1d2b] hover:border-[#353548] transition-colors"
          >
            View
          </a>
          <button
            type="button"
            onClick={() => {
              emitClick('ui:market:bounty-open', { skillId, sellerUid })
              onBounty(listing)
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#252538] text-slate-400 hover:text-slate-100 hover:border-[#353548] transition-colors"
          >
            Bounty
          </button>
          <button
            type="button"
            onClick={() => onHire(listing)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Hire
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
