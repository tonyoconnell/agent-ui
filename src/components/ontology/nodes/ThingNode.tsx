import { Handle, type NodeProps, Position } from '@xyflow/react'
import { emitClick } from '@/lib/ui-signal'

export interface ThingNodeData {
  label: string
  tid: string
  thingType?: 'skill' | 'task' | 'token' | 'service'
  price?: number
}

const TYPE_ICONS: Record<NonNullable<ThingNodeData['thingType']>, string> = {
  skill: '◇',
  task: '✓',
  token: '¤',
  service: '⚙',
}

export function ThingNode({ data, selected }: NodeProps<{ data: ThingNodeData }>) {
  const { label, tid, thingType, price } = data
  const icon = thingType ? TYPE_ICONS[thingType] : '◇'

  return (
    <div
      className="relative flex flex-col items-center justify-center gap-1 select-none"
      style={{ width: 64, height: 64 }}
    >
      {/* Square node */}
      <div
        className="relative flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer w-full h-full"
        style={{
          borderColor: selected ? '#34d399' : '#10b981',
          background: '#052e16',
          outline: selected ? '2px solid #10b981' : 'none',
          outlineOffset: '2px',
        }}
        onClick={() => emitClick('ui:ontology:node-click', { id: tid, kind: 'thing' })}
      >
        <Handle type="target" position={Position.Top} id="top" style={{ background: '#10b981' }} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#10b981' }} />

        {/* Type icon */}
        <span className="text-[16px] text-emerald-400 leading-none select-none pointer-events-none">{icon}</span>

        {/* Label truncated */}
        <span className="px-1 text-slate-200 text-[9px] font-medium leading-tight text-center truncate w-full">
          {label}
        </span>

        {/* Price badge — bottom-right */}
        {price !== undefined && price > 0 && (
          <span
            className="absolute -bottom-2 -right-2 text-[9px] font-semibold rounded px-1 py-0.5 leading-none"
            style={{ background: '#065f46', color: '#6ee7b7', border: '1px solid #10b981' }}
          >
            ${price.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  )
}
