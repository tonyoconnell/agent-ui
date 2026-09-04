import { Handle, type NodeProps, Position } from '@xyflow/react'
import { emitClick } from '@/lib/ui-signal'

export interface GroupNodeData {
  label: string
  gid: string
  visibility?: 'public' | 'private'
  memberCount?: number
}

export function GroupNode({ data, selected }: NodeProps<{ data: GroupNodeData }>) {
  const { label, gid, visibility, memberCount } = data

  return (
    <div
      className="relative min-w-[160px] min-h-[80px] rounded-2xl border-2 bg-card px-3 py-2 cursor-pointer"
      style={{
        borderColor: selected ? 'hsl(var(--color-primary-bright))' : 'hsl(var(--color-primary-mid))',
        outline: selected ? '2px solid hsl(var(--color-primary-mid))' : 'none',
        outlineOffset: '2px',
      }}
      onClick={() => emitClick('ui:ontology:node-click', { id: gid, kind: 'group' })}
    >
      {/* Handles on all four sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ background: 'hsl(var(--color-primary-bright))' }}
      />

      {/* Header row: label + member count badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-font text-xs font-semibold truncate leading-tight">{label}</span>
        {memberCount !== undefined && (
          <span
            className="flex-shrink-0 text-[10px] font-medium rounded-full px-1.5 py-0.5 leading-none"
            style={{ background: 'hsl(var(--color-primary-bright)/0.15)', color: 'hsl(var(--color-primary-bright))' }}
          >
            {memberCount}
          </span>
        )}
      </div>

      {/* Visibility tag */}
      {visibility && (
        <span className="mt-1 inline-block text-[9px] text-muted-foreground uppercase tracking-wide">{visibility}</span>
      )}
    </div>
  )
}
