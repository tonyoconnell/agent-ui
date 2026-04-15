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
    if (confidence >= 0.7) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (confidence >= 0.5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  const recentSignals = signals.slice(-5)

  return (
    <div className="flex flex-col gap-3 p-4 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-100">{actor.uid}</span>
          <span className="text-xs text-slate-500">{actor.kind}</span>
          <span className="text-xs text-slate-500">Since {new Date(actor.firstSeen).toLocaleDateString()}</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-100"
            onClick={() => { emitClick('ui:memory:close'); onClose() }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hypotheses */}
      {hypotheses.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Learned</p>
          <div className="flex flex-col gap-1.5">
            {hypotheses.map((h, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <span className="text-slate-300 flex-1">{h.pattern}</span>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Proven paths</p>
          <div className="flex flex-col gap-1.5">
            {highways.map((h, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-slate-300">
                  {h.from} → {h.to}
                </span>
                <div className="h-1 w-[100px] rounded-full bg-slate-700">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, h.strength)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      {groups.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Groups</p>
          <div className="flex flex-wrap gap-1">
            {groups.map((group, i) => (
              <Badge key={i} variant="outline" className="text-xs text-slate-300 border-slate-600">
                {group}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Skills</p>
          <div className="flex flex-col gap-1">
            {capabilities.map((cap, i) => (
              <div key={i} className="flex items-center justify-between text-slate-300">
                <span>{cap.name}</span>
                <span className="text-slate-500 text-xs">{cap.price > 0 ? `$${cap.price}` : 'free'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frontier */}
      {frontier.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Unexplored</p>
          <div className="flex flex-wrap gap-1">
            {frontier.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs text-slate-500 border-slate-700">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent signals */}
      {recentSignals.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Recent</p>
          <div className="flex flex-col gap-1">
            {recentSignals.map((signal, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${signal.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-slate-400 truncate">
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
          className="text-xs text-slate-400 border-slate-700 hover:text-slate-100 hover:border-slate-500"
          onClick={() => { emitClick('ui:memory:export'); handleExport() }}
        >
          Export memory.json
        </Button>
      </div>
    </div>
  )
}
