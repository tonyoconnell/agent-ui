import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { sdk } from '@/lib/sdk'
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
  if (confidence >= 0.7)
    return 'border-transparent bg-[hsl(var(--color-tertiary-bright)/0.2)] text-[hsl(var(--color-tertiary-bright))]'
  if (confidence >= 0.5) return 'border-transparent bg-[hsl(var(--color-gold)/0.2)] text-[hsl(var(--color-gold))]'
  return 'border-transparent bg-muted/50 text-muted-foreground'
}

export function LearningPanel({ groupId: _groupId }: Props) {
  const [hypotheses, setHypotheses] = useState<HypothesisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchHypotheses() {
      try {
        const raw = await sdk.recall()
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
        <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {hypotheses.length}
        </span>
      </div>

      {loading && <p className="text-sm text-muted-foreground py-4">Loading hypotheses…</p>}

      {!loading && error && <p className="text-sm text-[hsl(var(--color-destructive))] py-4">{error}</p>}

      {!loading && !error && hypotheses.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          No patterns learned yet. Run <code className="text-xs font-mono text-font">/api/tick</code> to start the
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
