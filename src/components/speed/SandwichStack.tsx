'use client'

import { cn } from '@/lib/utils'

interface Layer {
  name: string
  role: string
  budget: string
  cost: string
  isLlm?: boolean
}

const LAYERS: Layer[] = [
  { name: 'ADL gate', role: 'permission check', budget: '<1ms', cost: '$0.00' },
  { name: 'isToxic', role: '3 integer compares', budget: '<0.001ms', cost: '$0.00' },
  { name: 'capability', role: '1 KV lookup', budget: '<1ms', cost: '$0.00' },
  { name: 'LLM', role: 'the probabilistic step', budget: '~1,500ms', cost: '~$0.0001', isLlm: true },
  { name: 'mark/warn', role: 'edge memory', budget: '<0.001ms', cost: '$0.00' },
]

export function SandwichStack() {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-center py-1">
        <span className="text-[hsl(var(--color-primary-bright))] text-xs font-mono">signal ↓</span>
      </div>
      {LAYERS.map((layer, i) => (
        <div key={layer.name}>
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md border',
              layer.isLlm
                ? 'bg-[hsl(var(--color-gold)/0.15)] border-[hsl(var(--color-gold)/0.2)]'
                : 'bg-muted/30 border-border/50',
            )}
          >
            <div className="w-28 font-mono text-xs text-foreground/70 shrink-0">{layer.name}</div>
            <div className="flex-1 text-xs text-muted-foreground">{layer.role}</div>
            <div className="text-xs font-mono text-muted-foreground/70 shrink-0">{layer.budget}</div>
            <div
              className={cn(
                'text-xs font-mono shrink-0 w-16 text-right',
                layer.isLlm ? 'text-[hsl(var(--color-gold))]' : 'text-muted-foreground',
              )}
            >
              {layer.cost}
            </div>
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                layer.isLlm ? 'bg-[hsl(var(--color-gold))]' : 'bg-[hsl(var(--color-tertiary-bright))]',
              )}
            />
          </div>
          {i < LAYERS.length - 1 && (
            <div className="flex justify-center py-0.5">
              <span className="text-muted-foreground/50 text-xs">↓</span>
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-center py-1">
        <span className="text-[hsl(var(--color-gold))] text-xs font-mono">result ↑</span>
      </div>
      <p className="text-xs text-muted-foreground/60 pt-1 text-center">4 of 5 layers cost $0.00. One costs physics.</p>
    </div>
  )
}
