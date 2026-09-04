import { cn } from '@/lib/utils'
import type { TradeStage, VisibleStage } from './useTradeLifecycle'
import { visibleStage } from './useTradeLifecycle'

interface Props {
  stage: TradeStage
  className?: string
}

const VISIBLE_STAGES: VisibleStage[] = ['BROWSE', 'TRADE', 'DONE']

const LABELS: Record<VisibleStage, string> = {
  BROWSE: 'Browse',
  TRADE: 'Trade',
  DONE: 'Done',
  DISPUTE: 'Dispute',
}

const SUB_STAGE: Partial<Record<TradeStage, string>> = {
  OFFER: 'Offer placed',
  ESCROW: 'Funds locked',
  EXECUTE: 'In progress',
  VERIFY: 'Verifying',
}

export function LifecycleRail({ stage, className }: Props) {
  const current = visibleStage(stage)
  const isDispute = current === 'DISPUTE'
  const subLabel = SUB_STAGE[stage]

  const activeIndex = VISIBLE_STAGES.indexOf(current)

  return (
    <div
      className={cn('flex items-center gap-0', className)}
      role="progressbar"
      aria-label="Trade progress"
      aria-valuenow={activeIndex + 1}
      aria-valuemax={VISIBLE_STAGES.length}
    >
      {VISIBLE_STAGES.map((vs, i) => {
        const isDone = activeIndex > i
        const isActive = activeIndex === i && !isDispute
        return (
          <div key={vs} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-6 h-6 rounded-full text-[10px] font-mono flex items-center justify-center border',
                  isDone &&
                    'bg-[hsl(var(--color-primary-bright))] border-[hsl(var(--color-primary-bright))] text-white',
                  isActive && 'bg-card border-[hsl(var(--color-primary-mid))] text-[hsl(var(--color-primary-bright))]',
                  !isDone && !isActive && 'bg-card border-border text-muted-foreground',
                )}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 font-mono tracking-widest',
                  isActive && 'text-[hsl(var(--color-primary-bright))]',
                  isDone && 'text-muted-foreground',
                  !isDone && !isActive && 'text-muted-foreground/70',
                )}
              >
                {LABELS[vs]}
                {isActive && subLabel ? (
                  <span className="ml-1 text-muted-foreground/60 normal-case tracking-normal">{subLabel}</span>
                ) : null}
              </span>
            </div>
            {i < VISIBLE_STAGES.length - 1 && (
              <div
                aria-hidden="true"
                className={cn('w-12 h-px mx-1 mb-4', isDone ? 'bg-[hsl(var(--color-primary-bright))]' : 'bg-border')}
              />
            )}
          </div>
        )
      })}
      {isDispute && (
        <div className="ml-3 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-destructive))]" />
          <span className="text-[10px] font-mono tracking-widest text-[hsl(var(--color-destructive))]">DISPUTE</span>
        </div>
      )}
    </div>
  )
}
