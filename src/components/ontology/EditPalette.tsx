import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

export type DraftKind = 'person' | 'thing' | 'group' | 'insight'

interface Props {
  visible: boolean
  enabled: boolean
  onDragStart?: (kind: DraftKind) => void
}

const CHIPS: { id: DraftKind; label: string; subtitle: string; color: string; icon: string }[] = [
  { id: 'person', label: 'Person', subtitle: 'human or agent', color: '#3b82f6', icon: '◯' },
  { id: 'thing', label: 'Thing', subtitle: 'skill or task', color: '#10b981', icon: '▢' },
  { id: 'group', label: 'Group', subtitle: 'world or team', color: '#6366f1', icon: '▭' },
  { id: 'insight', label: 'Insight', subtitle: 'what was learned', color: '#a855f7', icon: '⬡' },
]

export function EditPalette({ visible, enabled, onDragStart }: Props) {
  if (!visible) return null

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, kind: DraftKind) => {
    if (!enabled) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/ontology-draft', kind)
    emitClick('ui:ontology:palette-drag', { kind })
    onDragStart?.(kind)
  }

  return (
    <div
      className="absolute bottom-4 left-4 z-10 flex gap-1.5 rounded-lg border border-[#252538] bg-[#0d0d14]/95 p-2 backdrop-blur"
      title={enabled ? 'Drag onto canvas to add' : 'Sign in + edit mode to add units'}
    >
      {CHIPS.map((c) => (
        <button
          key={c.id}
          type="button"
          draggable={enabled}
          onDragStart={(e) => handleDragStart(e, c.id)}
          disabled={!enabled}
          className={cn(
            'flex w-20 flex-col items-start rounded-md border px-2 py-1.5 text-left text-xs transition',
            enabled
              ? 'border-[#252538] bg-[#161622] text-slate-100 hover:border-[#3b82f6] cursor-grab active:cursor-grabbing'
              : 'cursor-not-allowed border-transparent bg-transparent text-slate-600',
          )}
          aria-disabled={!enabled}
        >
          <span className="text-base leading-none" style={{ color: enabled ? c.color : undefined }}>
            {c.icon}
          </span>
          <span className="mt-1 font-medium">{c.label}</span>
          <span className="text-[10px] text-slate-500">{c.subtitle}</span>
        </button>
      ))}
    </div>
  )
}
