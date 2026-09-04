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
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
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
              'h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary-bright))/0.4]',
              isSelected
                ? 'bg-card border-l-2 border-[hsl(var(--color-primary-bright))] pl-[10px] text-font'
                : 'border-l-2 border-transparent pl-[10px] text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.color ? (
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            ) : (
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  isSelected
                    ? 'text-[hsl(var(--color-primary-bright))]'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
            )}

            <span className="flex-1 truncate text-left">{item.label}</span>

            {item.hint && !item.count && <span className="truncate text-xs text-muted-foreground">{item.hint}</span>}

            {item.count > 0 ? (
              <span
                className={cn(
                  'flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums',
                  isSelected
                    ? 'bg-[hsl(var(--color-primary-bright)/0.2)] text-[hsl(var(--color-primary-bright))]'
                    : 'bg-muted text-muted-foreground group-hover:bg-[hsl(var(--color-primary-bright)/0.1)]',
                )}
              >
                {item.count}
              </span>
            ) : (
              <span className="flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground/50">
                0
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
