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
        <span className="text-cyan-500 text-xs font-mono">signal ↓</span>
      </div>
      {LAYERS.map((layer, i) => (
        <div key={layer.name}>
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md border',
              layer.isLlm ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/50 border-slate-700/50',
            )}
          >
            <div className="w-28 font-mono text-xs text-slate-300 shrink-0">{layer.name}</div>
            <div className="flex-1 text-xs text-slate-500">{layer.role}</div>
            <div className="text-xs font-mono text-slate-400 shrink-0">{layer.budget}</div>
            <div
              className={cn(
                'text-xs font-mono shrink-0 w-16 text-right',
                layer.isLlm ? 'text-amber-400' : 'text-slate-600',
              )}
            >
              {layer.cost}
            </div>
            <div className={cn('w-2 h-2 rounded-full shrink-0', layer.isLlm ? 'bg-amber-500' : 'bg-emerald-500')} />
          </div>
          {i < LAYERS.length - 1 && (
            <div className="flex justify-center py-0.5">
              <span className="text-slate-600 text-xs">↓</span>
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-center py-1">
        <span className="text-amber-400 text-xs font-mono">result ↑</span>
      </div>
      <p className="text-xs text-slate-500 pt-1 text-center">4 of 5 layers cost $0.00. One costs physics.</p>
    </div>
  )
}
