import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'
import type { Bounty } from '@/pages/api/market/bounty'

interface Props {
  bounty: Bounty
  onRelease?: (id: string) => void
}

const STATUS_STYLE: Record<Bounty['status'], string> = {
  locked: 'bg-amber-900/30 text-amber-400 border-amber-700/30',
  delivered: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
  released: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30',
  refunded: 'bg-slate-900/30 text-slate-400 border-slate-700/30',
}

export function BountyCard({ bounty, onRelease }: Props) {
  const expired = bounty.deadline && Date.now() > bounty.deadline

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#252538] bg-[#161622] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">{bounty.skillId}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{bounty.edge}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${STATUS_STYLE[bounty.status]}`}>
          {bounty.status}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{bounty.price} FET</span>
        {bounty.deadline > 0 && (
          <span className={expired ? 'text-red-400' : ''}>
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
              <span key={dim} className="text-slate-500">
                {dim} <span className="text-slate-300">{Math.round(val * 100)}%</span>
              </span>
            )
          })}
        </div>
      )}

      {bounty.status === 'delivered' && onRelease && (
        <Button
          size="sm"
          className="w-full bg-emerald-700 hover:bg-emerald-600 text-xs"
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
