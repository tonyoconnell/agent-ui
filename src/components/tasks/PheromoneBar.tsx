import { cn } from '@/lib/utils'

type PheromoneStatus = 'fresh' | 'active' | 'highway' | 'toxic' | 'fading'

function classify(s: number, r: number): PheromoneStatus {
  if (r >= 10 && r > s * 2 && s + r > 5) return 'toxic'
  if (s >= 50) return 'highway'
  if (s > 0 && s >= r) return s < 10 ? 'fresh' : 'active'
  if (r > s) return 'fading'
  return 'fresh'
}

const STATUS_COLOR: Record<PheromoneStatus, string> = {
  fresh: 'hsl(var(--color-primary-bright))',
  active: 'hsl(var(--color-tertiary-bright))',
  highway: 'hsl(var(--color-secondary-bright))',
  fading: 'hsl(var(--color-gold))',
  toxic: 'hsl(var(--color-destructive))',
}

const STATUS_BG: Record<PheromoneStatus, string> = {
  fresh: 'bg-[hsl(var(--color-primary-bright))]',
  active: 'bg-[hsl(var(--color-tertiary-bright))]',
  highway: 'bg-[hsl(var(--color-secondary-bright))]',
  fading: 'bg-[hsl(var(--color-gold))]',
  toxic: 'bg-[hsl(var(--color-destructive))]',
}

export interface PheromoneBarProps {
  strength: number
  resistance: number
  /** Compact mode: no labels, 8px height. */
  compact?: boolean
  /** Show numeric badges alongside. */
  showValues?: boolean
}

export function PheromoneBar({
  strength: rawS,
  resistance: rawR,
  compact = false,
  showValues = true,
}: PheromoneBarProps) {
  const strength = Number.isFinite(rawS) ? rawS : 0
  const resistance = Number.isFinite(rawR) ? rawR : 0

  const status = classify(strength, resistance)
  const isToxic = status === 'toxic'

  const strengthPct = Math.min(100, (strength / 100) * 100)
  const resistancePct = Math.min(100, (resistance / 100) * 100)

  const barHeight = compact ? 'h-2' : 'h-[14px]'

  const noActivity = strength === 0 && resistance === 0

  const valueLabel = (() => {
    if (noActivity) return null
    if (strength > 0 && resistance > 0) return `↗\u202f${strength.toFixed(1)} ↘\u202f${resistance.toFixed(1)}`
    if (strength > 0) return `↗\u202f${strength.toFixed(1)}`
    return `↘\u202f${resistance.toFixed(1)}`
  })()

  return (
    <div className="w-full space-y-1">
      {/* Bar */}
      <div
        role="progressbar"
        aria-valuenow={strength}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Pheromone: strength ${strength}, resistance ${resistance}, status ${status}`}
        className={cn(
          'relative rounded-full bg-background overflow-hidden w-full',
          barHeight,
          isToxic && 'animate-pheromone-pulse',
        )}
        title={compact ? undefined : `strength ${strength} · resistance ${resistance} · ${status}`}
      >
        {/* Resistance bar — behind (renders first) */}
        {resistance > 0 && (
          <div
            className="absolute inset-y-0 right-0 bg-[hsl(var(--color-destructive)/0.5)]"
            style={{ width: `${resistancePct}%` }}
          />
        )}
        {/* Strength bar — in front */}
        {strength > 0 && (
          <div className={cn('absolute inset-y-0 left-0', STATUS_BG[status])} style={{ width: `${strengthPct}%` }} />
        )}
      </div>

      {/* Label row — hidden in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          {/* Left: strength */}
          <span>
            {noActivity || resistance === 0 || strength > 0
              ? strength > 0
                ? `↗\u202f${strength.toFixed(1)}`
                : null
              : null}
          </span>

          {/* Middle: status */}
          <span style={{ color: STATUS_COLOR[status] }}>{status}</span>

          {/* Right: resistance */}
          <span>{resistance > 0 ? `↘\u202f${resistance.toFixed(1)}` : null}</span>
        </div>
      )}

      {/* Numeric display when showValues and not compact */}
      {showValues && !compact && (
        <div className="text-xs font-mono text-center">
          {noActivity ? (
            <span className="text-muted-foreground">no activity</span>
          ) : (
            <span className="text-muted-foreground">{valueLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
