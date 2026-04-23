/**
 * BuyDiscoveryIsland — pheromone-weighted skill discovery grid.
 *
 * On mount: GET /api/market/list?limit=20 (sorted by pheromone weight)
 * Emits: ui:buy:discover on load, ui:buy:card-click on card click
 * Search: client-side filter by name/tag
 * Buy: navigates to /pay?skillId=X or /chat?skillId=X
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import type { CapabilityListing } from '@/pages/api/market/list'

// ── ListingCard ────────────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: CapabilityListing
  onBuy: (listing: CapabilityListing) => void
}

function ListingCard({ listing, onBuy }: ListingCardProps) {
  const priceLabel =
    listing.pricingMode === 'free' || listing.price === 0 ? 'Free' : `${listing.price} FET`

  const pheromoneStrength = Math.max(0, listing.strength - listing.resistance)

  return (
    <Card
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-[#252538] bg-[#161622] p-4',
        'transition-colors hover:border-[#353550]',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-100">{listing.name}</div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
            {listing.sellerUid}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-slate-200">{priceLabel}</div>
          {listing.pricingMode === 'free' && (
            <Badge variant="secondary" className="mt-0.5 text-[10px]">
              free
            </Badge>
          )}
        </div>
      </div>

      {/* Tags */}
      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {listing.tags.slice(0, 5).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] text-slate-400">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Pheromone bar */}
      {pheromoneStrength > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#252538]">
            <div
              className="h-full rounded-full bg-indigo-500/70"
              style={{ width: `${Math.min(100, pheromoneStrength)}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] text-slate-600">
            {Math.round(listing.successRate * 100)}% success
          </span>
        </div>
      )}

      {/* Buy button */}
      <Button
        size="sm"
        className="mt-auto w-full"
        onClick={() => {
          emitClick('ui:buy:card-click', { skillId: listing.skillId, price: listing.price })
          onBuy(listing)
        }}
      >
        Buy
      </Button>
    </Card>
  )
}

// ── BuyDiscoveryIsland ─────────────────────────────────────────────────────────

export function BuyDiscoveryIsland() {
  const [listings, setListings] = useState<CapabilityListing[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch on mount; emit discover signal
  useEffect(() => {
    emitClick('ui:buy:discover')
    setLoading(true)
    fetch('/api/market/list?limit=20')
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ capabilities: CapabilityListing[] }>)
          : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((data) => {
        // Sort by pheromone weight descending (substrate learning surface)
        const sorted = [...data.capabilities].sort((a, b) => b.weight - a.weight)
        setListings(sorted)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError((err as Error).message)
        setLoading(false)
      })
  }, [])

  // Client-side filter by name or tag
  const filtered = listings.filter((l) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      l.name.toLowerCase().includes(q) ||
      l.sellerUid.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const handleBuy = (listing: CapabilityListing) => {
    // Navigate to pay flow — /pay/[skillId] uses Sui dapp-kit
    // Fall back to /pay/chat/[skillId] for conversational checkout
    window.location.href = `/pay/${encodeURIComponent(listing.skillId)}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or tag…"
          aria-label="Search skills"
          className={cn(
            'w-full rounded-xl border border-[#252538] bg-[#161622]',
            'px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600',
            'focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30',
          )}
        />
      </div>

      {/* State: loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border border-indigo-500 border-t-transparent" />
          Discovering skills…
        </div>
      )}

      {/* State: error */}
      {!loading && error && (
        <p className="py-8 text-center text-sm text-red-400">
          Could not load skills: {error}
        </p>
      )}

      {/* State: empty */}
      {!loading && !error && filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-slate-500">
          {search ? 'No skills match your search.' : 'No skills available yet.'}
        </p>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="text-xs text-slate-600">
            {filtered.length} skill{filtered.length !== 1 ? 's' : ''} · sorted by pheromone strength
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => (
              <ListingCard key={l.skillId} listing={l} onBuy={handleBuy} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
