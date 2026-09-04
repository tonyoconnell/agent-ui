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
  id?: string
  active?: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export function Stop({ step, title, vocab, liveNumber, code, children, id, active }: Props) {
  return (
    <Card
      id={id}
      className={cn(
        'bg-card border-border p-5 space-y-4 scroll-mt-20 transition-all',
        active &&
          'ring-1 ring-[hsl(var(--color-primary-bright))/0.4] shadow-lg shadow-[hsl(var(--color-primary-bright))/0.1]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-mono text-muted-foreground">
          {step}
        </div>
        <h3 className="text-lg font-medium text-font">{title}</h3>
        {liveNumber && (
          <Badge
            variant="secondary"
            className="ml-auto font-mono text-xs bg-tertiary-bright/10 text-tertiary-bright border-tertiary-bright/20"
          >
            {liveNumber}
          </Badge>
        )}
      </div>

      {/* Vocab */}
      {vocab.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {vocab.map((v) => (
            <Badge key={v} variant="outline" className="text-xs font-mono text-muted-foreground border-border">
              {v}
            </Badge>
          ))}
        </div>
      )}

      {/* Children (stop-specific content) */}
      {children && <div className="text-sm text-font">{children}</div>}

      {/* Code block */}
      {code && (
        <div className="relative">
          <pre
            className={cn(
              'text-xs font-mono p-3 rounded-md overflow-x-auto',
              'bg-background text-muted-foreground border border-border',
            )}
          >
            <code>{code}</code>
          </pre>
        </div>
      )}
    </Card>
  )
}
