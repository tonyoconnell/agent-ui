import type { LucideIcon } from 'lucide-react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

export type SmartListId = 'inbox' | 'now' | 'this-cycle' | 'highways' | 'escape' | 'all-plans' | 'all-tags'

export type SmartListItem = {
  id: SmartListId | string
  icon: LucideIcon
  label: string
  count: number
  hint?: string
  color?: string
}

interface Props {
  items: SmartListItem[]
  selectedId?: string
  onSelect: (id: string) => void
  heading?: string
  className?: string
}

export function SmartList({ items, selectedId, onSelect, heading, className }: Props) {
  return (
    <div role="listbox" aria-label={heading ?? 'Smart list'} className={cn('flex flex-col gap-0.5', className)}>
      {heading && (
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
          {heading}
        </div>
      )}

      {items.map((item) => {
        const isSelected = item.id === selectedId
        const Icon = item.icon

        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              emitClick('ui:tasks:smartlist-select', { id: item.id })
              onSelect(item.id)
            }}
            className={cn(
              'group flex w-full items-center gap-2.5 rounded-md px-3 text-sm transition-colors',
              'h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40',
              isSelected
                ? 'bg-[#1a1a24] border-l-2 border-cyan-500 pl-[10px] text-slate-100'
                : 'border-l-2 border-transparent pl-[10px] text-slate-400 hover:bg-[#16161f] hover:text-slate-300',
            )}
          >
            {item.color ? (
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            ) : (
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400',
                )}
              />
            )}

            <span className="flex-1 truncate text-left">{item.label}</span>

            {item.hint && !item.count && <span className="truncate text-xs text-slate-500">{item.hint}</span>}

            {item.count > 0 ? (
              <span
                className={cn(
                  'flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums',
                  isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-[#1e1e2d] text-slate-400 group-hover:bg-[#252538]',
                )}
              >
                {item.count}
              </span>
            ) : (
              <span className="flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums text-slate-600">
                0
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
