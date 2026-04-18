import type { LucideIcon } from 'lucide-react'
import type { Dimension } from '@/data/in-types'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

export interface NavigationItem {
  id: Dimension
  icon: LucideIcon
  label: string
  count: number
}

interface NavigationProps {
  items: NavigationItem[]
  active: Dimension
  onChange: (dim: Dimension) => void
}

export function Navigation({ items, active, onChange }: NavigationProps) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map(({ id, icon: Icon, label, count }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              emitClick('ui:in:nav', { dimension: id })
              onChange(id)
            }}
            className={cn(
              'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              isActive
                ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className={cn('h-4 w-4 flex-shrink-0 transition-transform', isActive && 'scale-110 text-primary')} />
            <span className="flex-1 text-left font-semibold">{label}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors',
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-accent',
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
