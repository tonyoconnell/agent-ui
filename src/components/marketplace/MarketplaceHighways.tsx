import { useCallback, useEffect, useState } from 'react'
import { sdk } from '@/lib/sdk'
import { emitClick } from '@/lib/ui-signal'

interface Highway {
  from: string
  to: string
  strength: number
  resistance: number
  revenue?: number
  traversals?: number
  successRate?: number
}

export function MarketplaceHighways() {
  const [highways, setHighways] = useState<Highway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHighways = useCallback(async () => {
    try {
      const data = (await sdk.exportData('highways')) as Highway[]
      setHighways(Array.isArray(data) ? data.slice(0, 10) : [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHighways()
  }, [fetchHighways])

  const handleRowClick = (h: Highway) => {
    emitClick('ui:marketplace:highway-select', { from: h.from, to: h.to })
  }

  if (loading) return <div className="text-muted-foreground text-sm py-4">Loading highways…</div>
  if (error) return <div className="text-muted-foreground text-sm py-4">Highways unavailable — {error}</div>
  if (highways.length < 3) {
    return (
      <div className="text-muted-foreground text-sm py-6 border border-border rounded-xl bg-card/20 text-center">
        Not enough proven paths yet. Trade volume will reveal highways.
      </div>
    )
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Highways</h2>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {highways.map((h, i) => {
          const strengthPct = Math.min(100, (h.strength / 100) * 100)
          return (
            <button
              key={`${h.from}→${h.to}`}
              type="button"
              onClick={() => handleRowClick(h)}
              aria-label={`Highway from ${h.from} to ${h.to}, strength ${h.strength.toFixed(1)}`}
              className="w-full flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 text-left transition-colors"
            >
              <span className="text-muted-foreground text-xs font-mono w-6">#{i + 1}</span>
              <span className="font-mono text-sm text-font truncate flex-1">
                {h.from} <span className="text-muted-foreground/50">→</span> {h.to}
              </span>
              <div aria-hidden="true" className="w-24 h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[hsl(var(--color-primary-bright))] to-[hsl(var(--color-secondary-bright))] rounded-full"
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              <span className="font-mono text-xs text-[hsl(var(--color-tertiary-bright)/0.7)] w-20 text-right">
                {h.strength.toFixed(1)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
