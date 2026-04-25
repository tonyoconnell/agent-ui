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
  if (rate === undefined) return '#64748b' // slate-500 — unknown
  if (rate >= 0.65) return '#22c55e' // green
  if (rate >= 0.3) return '#eab308' // yellow
  return '#ef4444' // red
}

export function PersonNode({ data, selected }: NodeProps<{ data: PersonNodeData }>) {
  const { label, uid, kind = 'human', successRate } = data

  // Agents get a slightly darker border shade
  const borderColor = kind === 'agent' ? '#1d4ed8' : '#3b82f6'
  const bgColor = kind === 'agent' ? '#0f172a' : '#0c1428'

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Circle node */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 cursor-pointer',
          'text-slate-200 text-[10px] font-semibold',
        )}
        style={{
          width: 80,
          height: 80,
          borderColor: selected ? '#60a5fa' : borderColor,
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
          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-[#161622]"
          style={{ background: successDotColor(successRate) }}
          title={successRate !== undefined ? `${(successRate * 100).toFixed(0)}% success` : 'unknown'}
        />
      </div>

      {/* Label below */}
      <span className="max-w-[96px] text-center text-slate-200 text-[11px] font-medium truncate leading-tight">
        {label}
      </span>
    </div>
  )
}
