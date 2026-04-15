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
  public: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  group: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
  private: 'bg-slate-700/50 text-slate-400 border-slate-600',
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
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#161622] border border-[#252538] hover:border-indigo-700/50 transition-colors">
      {/* Left: name + provider + tags */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-medium text-slate-100 truncate">{name}</span>
        {variant === 'buy' && providerName && <span className="text-xs text-slate-500 truncate">{providerName}</span>}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Middle: strength/resistance + mode + visibility */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
          ↑{strength.toFixed(1)}
        </span>
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
          ↓{resistance.toFixed(1)}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-600 capitalize">
          {MODE_LABEL[mode]}
        </span>
        <Badge className={`text-[10px] px-2 py-0.5 border capitalize ${VIS_COLOR[visibility]}`}>{visibility}</Badge>
      </div>

      {/* Right: price + action + export */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-base font-semibold text-slate-100 tabular-nums">
          {price} <span className="text-xs text-slate-400 font-normal">SUI</span>
        </span>
        <Button
          size="sm"
          variant={variant === 'buy' ? 'default' : 'outline'}
          onClick={handleAction}
          className={
            variant === 'buy'
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'border-[#252538] text-slate-300 hover:text-slate-100'
          }
        >
          {variant === 'buy' ? 'Hire' : 'Edit'}
        </Button>
        <button
          type="button"
          title="Export as markdown"
          onClick={handleExport}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
        >
          ↓md
        </button>
      </div>
    </div>
  )
}
