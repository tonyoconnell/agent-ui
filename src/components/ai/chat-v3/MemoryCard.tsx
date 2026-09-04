import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MemoryCard as MemoryCardData } from '@/engine/persist'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  data: MemoryCardData
  onClose?: () => void
}

export function MemoryCard({ data, onClose }: Props) {
  const { actor, hypotheses, highways, signals, groups, capabilities, frontier } = data

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'memory.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-tertiary/20 text-tertiary-bright border-tertiary/40'
    if (confidence >= 0.5) return 'bg-gold/20 text-gold border-gold/40'
    return 'bg-muted text-muted-foreground border-border'
  }

  const recentSignals = signals.slice(-5)

  return (
    <div className="flex flex-col gap-3 p-4 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-font">{actor.uid}</span>
          <span className="text-xs text-muted-foreground">{actor.kind}</span>
          <span className="text-xs text-muted-foreground">Since {new Date(actor.firstSeen).toLocaleDateString()}</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-font"
            onClick={() => {
              emitClick('ui:memory:close')
              onClose()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hypotheses */}
      {hypotheses.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Learned</p>
          <div className="flex flex-col gap-1.5">
            {hypotheses.map((h, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <span className="text-foreground flex-1">{h.pattern}</span>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium ${confidenceColor(h.confidence)}`}
                >
                  {(h.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highways */}
      {highways.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Proven paths</p>
          <div className="flex flex-col gap-1.5">
            {highways.map((h, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-foreground">
                  {h.from} → {h.to}
                </span>
                <div className="h-1 w-[100px] rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary-bright"
                    style={{ width: `${Math.min(100, h.strength)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      {groups.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Groups</p>
          <div className="flex flex-wrap gap-1">
            {groups.map((group, i) => (
              <Badge key={i} variant="outline" className="text-xs text-foreground border-border">
                {group}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Skills</p>
          <div className="flex flex-col gap-1">
            {capabilities.map((cap, i) => (
              <div key={i} className="flex items-center justify-between text-foreground">
                <span>{cap.name}</span>
                <span className="text-muted-foreground text-xs">{cap.price > 0 ? `$${cap.price}` : 'free'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frontier */}
      {frontier.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Unexplored</p>
          <div className="flex flex-wrap gap-1">
            {frontier.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs text-muted-foreground border-border">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent signals */}
      {recentSignals.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Recent</p>
          <div className="flex flex-col gap-1">
            {recentSignals.map((signal, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${signal.success ? 'bg-tertiary-bright' : 'bg-destructive'}`}
                />
                <span className="text-muted-foreground truncate">
                  {signal.data.length > 40 ? `${signal.data.slice(0, 40)}…` : signal.data}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="pt-1">
        <Button
          variant="outline"
          size="sm"
          className="text-xs text-muted-foreground border-border hover:text-font hover:border-border"
          onClick={() => {
            emitClick('ui:memory:export')
            handleExport()
          }}
        >
          Export memory.json
        </Button>
      </div>
    </div>
  )
}
