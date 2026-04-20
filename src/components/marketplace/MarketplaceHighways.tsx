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

  if (loading) return <div className="text-slate-500 text-sm py-4">Loading highways…</div>
  if (error) return <div className="text-slate-500 text-sm py-4">Highways unavailable — {error}</div>
  if (highways.length < 3) {
    return (
      <div className="text-slate-500 text-sm py-6 border border-[#252538] rounded-xl bg-[#161622]/40 text-center">
        Not enough proven paths yet. Trade volume will reveal highways.
      </div>
    )
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Highways</h2>
      <div className="bg-[#161622] rounded-xl border border-[#252538] overflow-hidden">
        {highways.map((h, i) => {
          const strengthPct = Math.min(100, (h.strength / 100) * 100)
          return (
            <button
              key={`${h.from}→${h.to}`}
              type="button"
              onClick={() => handleRowClick(h)}
              className="w-full flex items-center gap-3 px-5 py-3 border-b border-[#252538] last:border-b-0 hover:bg-[#1a1a28] text-left transition-colors"
            >
              <span className="text-slate-500 text-xs font-mono w-6">#{i + 1}</span>
              <span className="font-mono text-sm text-white truncate flex-1">
                {h.from} <span className="text-slate-600">→</span> {h.to}
              </span>
              <div className="w-24 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              <span className="font-mono text-xs text-emerald-400/70 w-20 text-right">{h.strength.toFixed(1)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
