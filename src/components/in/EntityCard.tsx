import type { InboxEntity } from '@/data/in-types'
import { cn } from '@/lib/utils'

interface EntityCardProps {
  entity: InboxEntity
  selected: boolean
  onClick: () => void
}

export function EntityCard({ entity, selected, onClick }: EntityCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-xl border p-4 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        selected
          ? 'border-emerald-500/40 bg-[#14142a] shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_8px_24px_-12px_rgba(16,185,129,0.3)]'
          : 'border-[#252538] bg-[#0d0d14] hover:border-[#3a3a52] hover:bg-[#14141e]',
      )}
    >
      {entity.unread && (
        <span className="absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      )}

      <div className="mb-1.5 flex items-start justify-between gap-3">
        <h3 className="truncate text-sm font-semibold leading-tight text-foreground">{entity.title}</h3>
        <time className="mt-0.5 whitespace-nowrap text-[11px] font-medium tabular-nums text-muted-foreground">
          {formatTimestamp(entity.timestamp)}
        </time>
      </div>

      {entity.code && (
        <div className="mb-1.5 font-mono text-[10px] tracking-wider text-muted-foreground/70">{entity.code}</div>
      )}

      <div className="mb-2 truncate text-xs font-medium text-muted-foreground">{entity.subtitle}</div>

      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground/90">{entity.preview}</p>

      {entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entity.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#161622] px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-[#252538]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
  const days = Math.floor(diff / 86_400_000)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  return `${weeks}w`
}
