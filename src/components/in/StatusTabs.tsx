import { STATUS_FILTERS, type Status } from '@/data/in-types'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

interface StatusTabsProps {
  active: Status
  counts: Record<Status, number>
  onChange: (s: Status) => void
}

const LABEL: Record<Status, string> = {
  now: 'Now',
  top: 'Top',
  todo: 'ToDo',
  done: 'Done',
}

export function StatusTabs({ active, counts, onChange }: StatusTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-[#252538] bg-[#0d0d14] px-5 py-3">
      {STATUS_FILTERS.map((status) => {
        const isActive = active === status
        const n = counts[status] ?? 0
        return (
          <button
            key={status}
            type="button"
            onClick={() => {
              emitClick('ui:in:status', { status })
              onChange(status)
            }}
            className={cn(
              'relative flex items-center gap-2 rounded-md px-1 py-2 text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {LABEL[status]}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums transition-colors',
                isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#161622] text-muted-foreground',
              )}
            >
              {n}
            </span>
            {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />}
          </button>
        )
      })}
    </div>
  )
}
