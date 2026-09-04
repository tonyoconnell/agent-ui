import { useEffect, useState, useTransition } from 'react'
import type { CapabilityListing } from '@/pages/api/market/list'
import { BountyComposer } from './BountyComposer'
import { MarketRow } from './MarketRow'

type Lens = 'highways' | 'frontier' | 'tags' | 'all'

export function MarketShell() {
  const [lens, setLens] = useState<Lens>('all')
  const [listings, setListings] = useState<CapabilityListing[]>([])
  const [tagFilter, setTagFilter] = useState('')
  const [bountyTarget, setBountyTarget] = useState<CapabilityListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tagFilter) params.set('tag', tagFilter)
    fetch(`/api/market/list?${params}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<{ capabilities: CapabilityListing[] }>) : Promise.resolve({ capabilities: [] }),
      )
      .then((data) => {
        setListings(data.capabilities)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tagFilter])

  const handleHire = (listing: CapabilityListing) => {
    startTransition(async () => {
      await fetch('/api/market/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: listing.skillId, sellerUid: listing.sellerUid }),
      })
    })
  }

  const LENS_LABELS: Record<Lens, string> = {
    all: 'All',
    highways: 'Highways',
    frontier: 'Frontier',
    tags: 'By tag',
  }

  const filtered =
    lens === 'highways'
      ? listings.filter((l) => l.successRate > 0.8)
      : lens === 'frontier'
        ? listings.filter((l) => l.successRate === 0)
        : listings

  return (
    <div className="flex flex-col gap-4">
      {/* Lens + tag filter */}
      <div className="flex items-center gap-3 flex-wrap">
        {(Object.keys(LENS_LABELS) as Lens[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLens(l)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              lens === l
                ? 'bg-[hsl(var(--color-primary-bright))] text-white'
                : 'border border-border text-muted-foreground hover:text-font'
            }`}
          >
            {LENS_LABELS[l]}
          </button>
        ))}
        {lens === 'tags' && (
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Filter by tag…"
            className="ml-2 bg-card border border-border rounded px-3 py-1 text-xs text-font placeholder-muted-foreground"
          />
        )}
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <div className="h-4 w-4 rounded-full border border-[hsl(var(--color-primary-bright))] border-t-transparent animate-spin" />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">No capabilities found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((l) => (
            <MarketRow key={l.skillId} listing={l} onHire={handleHire} onBounty={setBountyTarget} />
          ))}
        </div>
      )}

      {/* Bounty composer overlay */}
      {bountyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl border border-border bg-background">
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
