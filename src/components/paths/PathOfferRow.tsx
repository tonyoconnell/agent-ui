import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'

interface PathOfferRowProps {
  sid: string
  name: string
  price: number
  mode?: 'static' | 'pheromone' | 'auction' | 'bounty' | 'bonding'
  visibility?: 'public' | 'group' | 'private'
  strength?: number
  resistance?: number
  providerUid?: string
  providerName?: string
  tags?: string[]
  variant?: 'buy' | 'sell'
  onHire?: (sid: string) => void
  onEdit?: (sid: string) => void
  onExport?: (sid: string) => void
}

const MODE_LABEL: Record<NonNullable<PathOfferRowProps['mode']>, string> = {
  static: 'Static',
  pheromone: 'Phero',
  auction: 'Auction',
  bounty: 'Bounty',
  bonding: 'Bonding',
}

const VIS_COLOR: Record<NonNullable<PathOfferRowProps['visibility']>, string> = {
  public:
    'bg-[hsl(var(--color-tertiary-bright)/0.15)] text-[hsl(var(--color-tertiary-bright))] border-[hsl(var(--color-tertiary-mid))]',
  group:
    'bg-[hsl(var(--color-primary-bright)/0.15)] text-[hsl(var(--color-primary-bright))] border-[hsl(var(--color-primary-mid))]',
  private: 'bg-muted text-muted-foreground border-border',
}

export function PathOfferRow({
  sid,
  name,
  price,
  mode = 'static',
  visibility = 'public',
  strength = 0,
  resistance = 0,
  providerName,
  tags = [],
  variant = 'buy',
  onHire,
  onEdit,
  onExport,
}: PathOfferRowProps) {
  function handleAction() {
    if (variant === 'buy') {
      emitClick('ui:buy:hire', { sid })
      onHire?.(sid)
    } else {
      emitClick('ui:sell:edit', { sid })
      onEdit?.(sid)
    }
  }

  function handleExport() {
    emitClick('ui:path:export', { sid })
    onExport?.(sid)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border hover:border-[hsl(var(--color-primary-mid)/0.5)] transition-colors">
      {/* Left: name + provider + tags */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-medium text-font truncate">{name}</span>
        {variant === 'buy' && providerName && (
          <span className="text-xs text-muted-foreground truncate">{providerName}</span>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Middle: strength/resistance + mode + visibility */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--color-tertiary-bright)/0.15)] text-[hsl(var(--color-tertiary-bright))] border border-[hsl(var(--color-tertiary-mid))]">
          ↑{strength.toFixed(1)}
        </span>
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--color-destructive)/0.15)] text-[hsl(var(--color-destructive))] border border-[hsl(var(--color-destructive)/0.3)]">
          ↓{resistance.toFixed(1)}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground border border-border capitalize">
          {MODE_LABEL[mode]}
        </span>
        <Badge className={`text-[10px] px-2 py-0.5 border capitalize ${VIS_COLOR[visibility]}`}>{visibility}</Badge>
      </div>

      {/* Right: price + action + export */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-base font-semibold text-font tabular-nums">
          {price} <span className="text-xs text-muted-foreground font-normal">SUI</span>
        </span>
        <Button
          size="sm"
          variant={variant === 'buy' ? 'default' : 'outline'}
          onClick={handleAction}
          className={
            variant === 'buy'
              ? 'bg-[hsl(var(--color-primary-bright))] hover:bg-[hsl(var(--color-primary-bright)/0.9)] text-white'
              : 'border-border text-foreground hover:text-font'
          }
        >
          {variant === 'buy' ? 'Hire' : 'Edit'}
        </Button>
        <button
          type="button"
          title="Export as markdown"
          onClick={handleExport}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
        >
          ↓md
        </button>
      </div>
    </div>
  )
}
