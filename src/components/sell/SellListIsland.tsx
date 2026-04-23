/**
 * SellListIsland — grid of the current user's active capability listings.
 *
 * Fetches from /api/capabilities/list?as=seller on mount.
 * Shows each listing as a Card with name, price, tags, status badge.
 * "New listing" button links to /sell/new.
 * Empty state prompts "Create your first listing".
 */
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface CapabilityItem {
  sid: string
  name: string
  price: number
  providerUid: string
  tags: string[]
}

function statusFromTags(tags: string[]): 'active' | 'paused' {
  return tags.includes('status:paused') ? 'paused' : 'active'
}

export function SellListIsland() {
  const [listings, setListings] = useState<CapabilityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/capabilities/list?as=seller')
      .then((r) => {
        if (r.status === 401) throw new Error('Sign in to see your listings.')
        if (!r.ok) throw new Error(`Failed to load (${r.status})`)
        return r.json() as Promise<{ capabilities: CapabilityItem[] }>
      })
      .then((data) => {
        setListings(data.capabilities ?? [])
        setLoading(false)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not load listings')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-zinc-500">
        <div className="h-4 w-4 animate-spin rounded-full border border-indigo-500 border-t-transparent" />
        Loading listings…
      </div>
    )
  }

  if (error) {
    return <div className="rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</div>
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">No listings yet.</p>
        <a
          href="/sell/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Create your first listing
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((cap) => {
        const status = statusFromTags(cap.tags)
        const visibleTags = cap.tags.filter(
          (t) => !t.startsWith('status:') && !t.startsWith('mode:') && !t.startsWith('description:'),
        )

        return (
          <Card key={cap.sid} className="border-zinc-800 bg-zinc-900/60 transition-colors hover:bg-zinc-900/80">
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="truncate text-sm font-medium text-white">{cap.name}</span>
                <Badge
                  variant="outline"
                  className={
                    status === 'active'
                      ? 'shrink-0 border-emerald-700 bg-emerald-900/40 text-emerald-300'
                      : 'shrink-0 border-zinc-700 bg-zinc-800/60 text-zinc-400'
                  }
                >
                  {status}
                </Badge>
              </div>

              <p className="mb-3 text-sm tabular-nums text-zinc-300">
                {cap.price != null ? `${cap.price.toFixed(4)} SUI` : '—'}
              </p>

              {visibleTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {visibleTags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="border-zinc-700 px-1.5 py-0 text-xs text-zinc-500">
                      {tag}
                    </Badge>
                  ))}
                  {visibleTags.length > 4 && <span className="text-xs text-zinc-600">+{visibleTags.length - 4}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
