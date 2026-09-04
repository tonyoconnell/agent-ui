import { Handle, type NodeProps, Position } from '@xyflow/react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

export interface PersonNodeData {
  label: string
  uid: string
  kind?: 'human' | 'agent' | 'animal' | 'world'
  successRate?: number
}

function successDotColor(rate?: number): string {
  if (rate === undefined) return 'hsl(var(--color-muted-foreground))' // unknown
  if (rate >= 0.65) return 'hsl(var(--color-tertiary-bright))' // green
  if (rate >= 0.3) return 'hsl(var(--color-gold))' // yellow
  return 'hsl(var(--color-destructive))' // red
}

export function PersonNode({ data, selected }: NodeProps<{ data: PersonNodeData }>) {
  const { label, uid, kind = 'human', successRate } = data

  // Agents get a slightly darker border shade
  const borderColor = kind === 'agent' ? 'hsl(var(--color-primary-mid))' : 'hsl(var(--color-primary-bright))'
  const bgColor = kind === 'agent' ? 'hsl(var(--color-card))' : 'hsl(var(--color-background))'

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Circle node */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 cursor-pointer',
          'text-foreground text-[10px] font-semibold',
        )}
        style={{
          width: 80,
          height: 80,
          borderColor: selected ? 'hsl(var(--color-primary-bright))' : borderColor,
          background: bgColor,
          outline: selected ? `2px solid ${borderColor}` : 'none',
          outlineOffset: '2px',
        }}
        onClick={() => emitClick('ui:ontology:node-click', { id: uid, kind: kind ?? 'human' })}
      >
        <Handle type="target" position={Position.Left} id="left" style={{ background: borderColor, top: '50%' }} />
        <Handle type="source" position={Position.Right} id="right" style={{ background: borderColor, top: '50%' }} />

        {/* Kind initial */}
        <span className="text-[18px] leading-none opacity-60 select-none pointer-events-none">
          {kind === 'agent' ? '⬡' : kind === 'animal' ? '◉' : kind === 'world' ? '◎' : '○'}
        </span>

        {/* Success rate dot — bottom-right */}
        <span
          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-card"
          style={{ background: successDotColor(successRate) }}
          title={successRate !== undefined ? `${(successRate * 100).toFixed(0)}% success` : 'unknown'}
        />
      </div>

      {/* Label below */}
      <span className="max-w-[96px] text-center text-foreground text-[11px] font-medium truncate leading-tight">
        {label}
      </span>
    </div>
  )
}
