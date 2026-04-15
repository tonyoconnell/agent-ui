import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  groupId: string
}

type HypothesisRow = {
  id: string
  statement: string
  confidence: number
  source: string
  status: string
}

function parseRow(item: Record<string, unknown>, index: number): HypothesisRow {
  return {
    id: String(item.id ?? index),
    statement: String(item.statement ?? item.pattern ?? '(no statement)'),
    confidence: Number(item.confidence ?? 0),
    source: String(item.source ?? 'observed'),
    status: String(item.status ?? 'testing'),
  }
}

function confidenceClass(confidence: number): string {
  if (confidence >= 0.7) return 'border-transparent bg-emerald-500/20 text-emerald-400'
  if (confidence >= 0.5) return 'border-transparent bg-yellow-500/20 text-yellow-400'
  return 'border-transparent bg-slate-500/20 text-slate-400'
}

export function LearningPanel({ groupId: _groupId }: Props) {
  const [hypotheses, setHypotheses] = useState<HypothesisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchHypotheses() {
      try {
        const res = await fetch('/api/hypotheses')
        if (!res.ok) {
          if (active) setError(`Request failed: ${res.status}`)
          return
        }
        const raw: unknown = await res.json()
        if (!Array.isArray(raw)) {
          if (active) setError('Unexpected response shape')
          return
        }
        const rows = (raw as Record<string, unknown>[]).map(parseRow)
        if (active) {
          setHypotheses(rows)
          setError(null)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Fetch failed')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchHypotheses()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Learned patterns</span>
        <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-400">
          {hypotheses.length}
        </span>
      </div>

      {loading && <p className="text-sm text-muted-foreground py-4">Loading hypotheses…</p>}

      {!loading && error && <p className="text-sm text-red-400 py-4">{error}</p>}

      {!loading && !error && hypotheses.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          No patterns learned yet. Run <code className="text-xs font-mono text-slate-300">/api/tick</code> to start the
          learning loop.
        </p>
      )}

      {!loading && !error && hypotheses.length > 0 && (
        <div className="flex flex-col gap-2 overflow-auto flex-1">
          {hypotheses.map((h) => (
            <div key={h.id} className="border border-border rounded-lg p-3 flex flex-col gap-2">
              <p className="text-sm text-foreground leading-snug">{h.statement}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn('text-xs px-2 py-0.5 h-auto', confidenceClass(h.confidence))}>
                  {(h.confidence * 100).toFixed(0)}%
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 h-auto">
                  {h.source}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 h-auto">
                  {h.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
