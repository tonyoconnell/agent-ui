import type { Node } from '@xyflow/react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

interface Props {
  node: Node | null
  mode: 'view' | 'edit'
  canMark: boolean
  canMintCapability: boolean
  onClose: () => void
}

interface ActionButton {
  id: string
  label: string
  desc: string
  enabled: boolean
  reason?: string
}

export function Inspector({ node, mode, canMark, canMintCapability, onClose }: Props) {
  if (!node) return null

  const editable = mode === 'edit'
  const data = (node.data ?? {}) as Record<string, unknown>
  const label = (data.label as string | undefined) ?? node.id

  const actions: ActionButton[] = [
    {
      id: 'mark',
      label: 'Mark path',
      desc: "Strengthen this node's outgoing path",
      enabled: editable && canMark,
      reason: !editable ? 'Switch to edit mode' : !canMark ? 'Operator role required' : undefined,
    },
    {
      id: 'warn',
      label: 'Warn path',
      desc: "Add resistance to this node's outgoing path",
      enabled: editable && canMark,
      reason: !editable ? 'Switch to edit mode' : !canMark ? 'Operator role required' : undefined,
    },
    {
      id: 'mint-capability',
      label: 'Mint Capability',
      desc: 'Grant scoped authority on Sui',
      enabled: editable && canMintCapability,
      reason: !editable ? 'Switch to edit mode' : !canMintCapability ? 'Chairman role required' : undefined,
    },
    {
      id: 'inspect-onchain',
      label: 'View on Sui',
      desc: "Open this node's on-chain twin in suiscan",
      enabled: true, // read-only — always available
    },
  ]

  const handleAction = (id: string) => {
    emitClick(`ui:ontology:${id}`, { node: node.id, kind: data.kind ?? 'unknown' })
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-[#252538] bg-[#0d0d14] text-slate-200">
      <header className="flex items-center justify-between border-b border-[#252538] px-3 py-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Inspector</span>
        <button
          type="button"
          onClick={() => {
            emitClick('ui:ontology:inspector-close', { node: node.id })
            onClose()
          }}
          className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-[#161622] hover:text-slate-100"
        >
          ✕
        </button>
      </header>

      <div className="space-y-3 px-3 py-3 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">id</div>
          <div className="mt-0.5 break-all font-mono text-slate-200">{node.id}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">label</div>
          <div className="mt-0.5 text-slate-200">{label}</div>
        </div>
        {data.kind ? (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">kind</div>
            <div className="mt-0.5 text-slate-200">{String(data.kind)}</div>
          </div>
        ) : null}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">position</div>
          <div className="mt-0.5 font-mono text-slate-300">
            ({Math.round(node.position.x)}, {Math.round(node.position.y)})
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-[#252538] px-3 py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Actions</div>
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={!a.enabled}
            onClick={() => a.enabled && handleAction(a.id)}
            title={a.reason ?? a.desc}
            className={cn(
              'w-full rounded-md border px-2 py-1.5 text-left text-xs transition',
              a.enabled
                ? 'border-[#252538] bg-[#161622] text-slate-100 hover:border-[#3b82f6]'
                : 'cursor-not-allowed border-transparent bg-transparent text-slate-600',
            )}
            aria-disabled={!a.enabled}
          >
            <div className="font-medium">{a.label}</div>
            <div className="text-[10px] text-slate-500">{a.reason ?? a.desc}</div>
          </button>
        ))}
      </div>
    </aside>
  )
}
