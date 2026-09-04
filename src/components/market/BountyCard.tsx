import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'
import type { Bounty } from '@/pages/api/market/bounty'

interface Props {
  bounty: Bounty
  onRelease?: (id: string) => void
}

const STATUS_STYLE: Record<Bounty['status'], string> = {
  locked: 'bg-[hsl(var(--color-gold)/0.15)] text-[hsl(var(--color-gold))] border-[hsl(var(--color-gold)/0.3)]',
  delivered:
    'bg-[hsl(var(--color-primary-bright)/0.15)] text-[hsl(var(--color-primary-bright))] border-[hsl(var(--color-primary-mid))]',
  released:
    'bg-[hsl(var(--color-tertiary-bright)/0.15)] text-[hsl(var(--color-tertiary-bright))] border-[hsl(var(--color-tertiary-mid))]',
  refunded: 'bg-muted/30 text-muted-foreground border-border/30',
}

export function BountyCard({ bounty, onRelease }: Props) {
  const expired = bounty.deadline && Date.now() > bounty.deadline

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-font truncate">{bounty.skillId}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{bounty.edge}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${STATUS_STYLE[bounty.status]}`}>
          {bounty.status}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{bounty.price} FET</span>
        {bounty.deadline > 0 && (
          <span className={expired ? 'text-[hsl(var(--color-destructive))]' : ''}>
            {expired ? 'expired' : `due ${new Date(bounty.deadline).toLocaleDateString()}`}
          </span>
        )}
      </div>

      {/* Rubric */}
      {Object.keys(bounty.rubric).length > 0 && (
        <div className="flex gap-3 text-xs">
          {(['fit', 'form', 'truth', 'taste'] as const).map((dim) => {
            const val = bounty.rubric[dim]
            if (val === undefined) return null
            return (
              <span key={dim} className="text-muted-foreground">
                {dim} <span className="text-foreground">{Math.round(val * 100)}%</span>
              </span>
            )
          })}
        </div>
      )}

      {bounty.status === 'delivered' && onRelease && (
        <Button
          size="sm"
          className="w-full bg-[hsl(var(--color-tertiary-bright))] hover:bg-[hsl(var(--color-tertiary-mid))] text-xs"
          onClick={() => {
            emitClick('ui:market:bounty-release', {
              type: 'payment',
              payment: { receiver: bounty.sellerUid, amount: bounty.price, action: 'release' },
            })
            onRelease(bounty.id)
          }}
        >
          Release escrow
        </Button>
      )}
    </div>
  )
}
