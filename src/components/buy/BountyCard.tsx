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
  posted:
    'bg-[hsl(var(--color-primary-bright)/0.15)] text-[hsl(var(--color-primary-bright))] border-[hsl(var(--color-primary-mid))]',
  accepted: 'bg-[hsl(var(--color-gold)/0.15)] text-[hsl(var(--color-gold))] border-[hsl(var(--color-gold)/0.3)]',
  delivered:
    'bg-[hsl(var(--color-secondary-bright)/0.15)] text-[hsl(var(--color-secondary-bright))] border-[hsl(var(--color-secondary-mid))]',
  scoring: 'bg-[hsl(var(--color-gold)/0.15)] text-[hsl(var(--color-gold))] border-[hsl(var(--color-gold)/0.3)]',
  paid: 'bg-[hsl(var(--color-tertiary-bright)/0.15)] text-[hsl(var(--color-tertiary-bright))] border-[hsl(var(--color-tertiary-mid))]',
  refunded:
    'bg-[hsl(var(--color-destructive)/0.15)] text-[hsl(var(--color-destructive))] border-[hsl(var(--color-destructive)/0.3)]',
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
    <Card className="bg-background border-border text-font">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm font-mono text-muted-foreground truncate">{bountyId}</CardTitle>
        <Badge className={`text-xs border shrink-0 ${STATUS_COLOR[status]}`}>{status}</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price</span>
          <span className="font-semibold text-font">{price} SUI</span>
        </div>

        {providerName && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Provider</span>
            <span className="text-foreground">{providerName}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Deadline</span>
          <span className={countdown === 'Expired' ? 'text-destructive' : 'text-foreground'}>{countdown}</span>
        </div>

        {txHash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tx</span>
            <a
              href={`${SUI_EXPLORER}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[hsl(var(--color-secondary-bright))] hover:text-[hsl(var(--color-secondary-bright))]/90 truncate max-w-[140px]"
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
                className="flex-1 bg-[hsl(var(--color-tertiary-bright))] hover:bg-[hsl(var(--color-tertiary-bright))]/90 text-[hsl(var(--color-tertiary-foreground))] text-xs"
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
              className="flex-1 border border-border text-muted-foreground hover:text-foreground text-xs"
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
