import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

type BountyStatus = 'posted' | 'accepted' | 'delivered' | 'scoring' | 'paid' | 'refunded'

interface Props {
  bountyId: string
  status: BountyStatus
  price: number
  deadlineMs: number
  providerName?: string
  txHash?: string
}

const STATUS_COLOR: Record<BountyStatus, string> = {
  posted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  accepted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  delivered: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  scoring: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  refunded: 'bg-red-500/20 text-red-300 border-red-500/30',
}

function useCountdown(deadlineMs: number) {
  const [remaining, setRemaining] = useState(deadlineMs - Date.now())
  useEffect(() => {
    const id = setInterval(() => setRemaining(deadlineMs - Date.now()), 1000)
    return () => clearInterval(id)
  }, [deadlineMs])
  if (remaining <= 0) return 'Expired'
  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1000)
  return `${h}h ${m}m ${s}s`
}

const SUI_EXPLORER = 'https://suiscan.xyz/testnet/tx/'

export function BountyCard({ bountyId, status, price, deadlineMs, providerName, txHash }: Props) {
  const countdown = useCountdown(deadlineMs)
  const isDone = status === 'paid' || status === 'refunded'

  return (
    <Card className="bg-[#0a0a0f] border-white/10 text-white">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm font-mono text-white/60 truncate">{bountyId}</CardTitle>
        <Badge className={`text-xs border shrink-0 ${STATUS_COLOR[status]}`}>{status}</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Price</span>
          <span className="font-semibold">{price} SUI</span>
        </div>

        {providerName && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Provider</span>
            <span className="text-white/80">{providerName}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Deadline</span>
          <span className={countdown === 'Expired' ? 'text-red-400' : 'text-white/80'}>{countdown}</span>
        </div>

        {txHash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Tx</span>
            <a
              href={`${SUI_EXPLORER}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-violet-400 hover:text-violet-300 truncate max-w-[140px]"
            >
              {txHash.slice(0, 8)}…{txHash.slice(-6)}
            </a>
          </div>
        )}

        {!isDone && (
          <div className="flex gap-2 pt-1">
            {status === 'delivered' && (
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                onClick={() =>
                  emitClick('ui:buy:bounty-release', {
                    type: 'payment',
                    content: bountyId,
                    payment: { receiver: bountyId, amount: price, action: 'release' },
                  })
                }
              >
                Release
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 border border-white/10 text-white/50 hover:text-white text-xs"
              onClick={() =>
                emitClick('ui:buy:bounty-cancel', {
                  type: 'text',
                  content: bountyId,
                })
              }
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
