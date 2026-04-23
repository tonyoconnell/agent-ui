import { AlertTriangle, Clock, Fingerprint, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PreSignCardSchema, type PreSignCard as PreSignCardType } from '@/interfaces/rich-message/pre-sign-card'
import { emitClick } from '@/lib/ui-signal'

interface PreSignCardProps {
  payload: PreSignCardType
  onSign: () => Promise<void>
  onReject: () => void
}

function shortenAddress(addr: string): string {
  if (addr.length <= 16) return addr
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return '0s'
  const totalSeconds = Math.floor(msRemaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function PreSignCard({ payload: rawPayload, onSign, onReject }: PreSignCardProps) {
  const payload = PreSignCardSchema.parse(rawPayload)

  const [isPending, setIsPending] = useState(false)
  const [msRemaining, setMsRemaining] = useState(() => payload.expiresAt - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setMsRemaining(payload.expiresAt - Date.now())
    }, 500)
    return () => clearInterval(id)
  }, [payload.expiresAt])

  const isExpired = msRemaining <= 0

  const toDisplay = payload.resolvedName ?? shortenAddress(payload.recipient)

  const handleSign = async () => {
    emitClick('ui:chat:pre-sign')
    setIsPending(true)
    try {
      await onSign()
    } finally {
      setIsPending(false)
    }
  }

  const handleReject = () => {
    emitClick('ui:chat:pre-sign-cancel')
    onReject()
  }

  return (
    <Card className="border-[#252538] bg-[#161622] text-slate-100 w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Fingerprint className="h-5 w-5 text-primary" />
          Confirm Transaction
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tx summary */}
        <p className="text-sm text-slate-300">{payload.txSummary}</p>

        {/* Recipient row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">To</span>
          <span className="font-mono text-slate-200">{toDisplay}</span>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            Expires in
          </span>
          <span className={isExpired ? 'text-destructive font-semibold' : 'text-slate-200'}>
            {isExpired ? 'Expired' : formatCountdown(msRemaining)}
          </span>
        </div>

        {/* Expired banner */}
        {isExpired && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This request has expired
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button className="w-full" onClick={handleSign} disabled={isPending || isExpired}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing…
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4" />
              Sign with Touch ID
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </CardFooter>
    </Card>
  )
}
