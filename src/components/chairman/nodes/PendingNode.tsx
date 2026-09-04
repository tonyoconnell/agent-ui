import { Handle, type NodeProps, Position } from '@xyflow/react'

interface PendingData {
  role: string
  [key: string]: unknown
}

const C = {
  bg: 'hsl(var(--color-background))',
  border: 'hsl(var(--color-border))',
  accent: 'hsl(var(--color-muted-foreground))',
  text: 'hsl(var(--color-foreground))',
}

export function PendingNode({ data }: NodeProps) {
  const d = data as PendingData
  return (
    <div
      className="rounded-xl select-none px-4 py-3 min-w-[168px] animate-pulse"
      style={{
        backgroundColor: 'hsl(var(--color-card))',
        border: `1.5px dashed ${C.border}`,
        boxShadow: 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 8, height: 8, backgroundColor: C.accent, border: `2px solid ${C.bg}`, top: -4 }}
      />
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold" style={{ color: C.text }}>
          {d.role.toUpperCase()}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${C.accent}25`, color: C.text }}
        >
          hiring…
        </span>
      </div>
      <div className="text-[10px] font-mono text-muted-foreground">minting wallet</div>
    </div>
  )
}
