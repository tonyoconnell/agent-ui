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
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'text-muted-foreground hover:bg-[#161622] hover:text-foreground',
            )}
          >
            <Icon
              className={cn('h-4 w-4 flex-shrink-0 transition-transform', isActive && 'scale-110 text-emerald-400')}
            />
            <span className="flex-1 text-left font-semibold">{label}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-[#161622] text-muted-foreground group-hover:bg-[#1e1e2a]',
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
