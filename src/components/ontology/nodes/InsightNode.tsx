import type { NodeProps } from '@xyflow/react'
import { emitClick } from '@/lib/ui-signal'

export interface InsightNodeData {
  label: string
  hid: string
  confidence?: number
  status?: string
}

// Insight nodes intentionally have no Handles — they float; connections are
// dotted lines drawn externally (per spec).

export function InsightNode({ data, selected }: NodeProps<{ data: InsightNodeData }>) {
  const { label, hid, confidence, status } = data

  return (
    <div
      className="flex items-center justify-center cursor-pointer select-none"
      style={{
        width: 96,
        height: 88,
        // Hexagon: flat-top, 6-sided
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        background: 'rgba(168, 85, 247, 0.20)',
        border: `2px solid ${selected ? '#c084fc' : '#a855f7'}`,
        outline: selected ? '2px solid #a855f7' : 'none',
        outlineOffset: '3px',
      }}
      onClick={() => emitClick('ui:ontology:node-click', { id: hid, kind: 'insight' })}
    >
      {/* Inner content — sits inside the clip-path region */}
      <div className="flex flex-col items-center justify-center gap-0.5 px-4">
        {/* Confidence percentage at top */}
        {confidence !== undefined && (
          <span className="text-[9px] font-semibold text-purple-300 leading-none">
            {(confidence * 100).toFixed(0)}%
          </span>
        )}

        {/* Label */}
        <span className="text-slate-200 text-[10px] font-medium text-center leading-tight line-clamp-2">{label}</span>

        {/* Status */}
        {status && <span className="text-[9px] text-purple-400 leading-none uppercase tracking-wide">{status}</span>}
      </div>
    </div>
  )
}
