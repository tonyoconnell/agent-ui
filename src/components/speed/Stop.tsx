'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  step: number
  title: string
  vocab: string[]
  liveNumber?: string
  code?: string
  children?: React.ReactNode
}

// ── Component ────────────────────────────────────────────────────────────────

export function Stop({ step, title, vocab, liveNumber, code, children }: Props) {
  return (
    <Card className="bg-[#161622] border-[#252538] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-mono text-slate-400">
          {step}
        </div>
        <h3 className="text-lg font-medium text-slate-100">{title}</h3>
        {liveNumber && (
          <Badge
            variant="secondary"
            className="ml-auto font-mono text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            {liveNumber}
          </Badge>
        )}
      </div>

      {/* Vocab */}
      {vocab.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {vocab.map((v) => (
            <Badge key={v} variant="outline" className="text-xs font-mono text-slate-400 border-slate-700">
              {v}
            </Badge>
          ))}
        </div>
      )}

      {/* Children (stop-specific content) */}
      {children && <div className="text-sm text-slate-300">{children}</div>}

      {/* Code block */}
      {code && (
        <div className="relative">
          <pre
            className={cn(
              'text-xs font-mono p-3 rounded-md overflow-x-auto',
              'bg-[#0a0a0f] text-slate-400 border border-slate-800',
            )}
          >
            <code>{code}</code>
          </pre>
        </div>
      )}
    </Card>
  )
}
