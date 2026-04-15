import { Check, Copy, Link, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  nonce: string
  isClaiming: boolean
  isClaimed: boolean
  onCancel: () => void
}

export function ClaimDialog({ nonce, isClaiming, isClaimed, onCancel }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`/link ${nonce}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-border bg-background shadow-2xl">
        <CardContent className="pt-6 pb-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/15">
                <Link className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Link Telegram Memory</p>
                <p className="text-xs text-muted-foreground mt-0.5">Share your memory across web + Telegram</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { emitClick('ui:claim:cancel'); onCancel() }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isClaimed ? (
            /* Success state */
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Check className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Linked! Your Telegram memory is now active.
              </p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 shrink-0 mt-0.5">1</span>
                  Open Telegram and message <span className="font-medium text-foreground">@onedotbot</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 shrink-0 mt-0.5">2</span>
                  Send this command (tap to copy):
                </li>
              </ol>

              {/* Nonce copy block */}
              <button
                type="button"
                onClick={() => { emitClick('ui:claim:copy'); handleCopy() }}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg',
                  'font-mono text-sm border transition-colors cursor-pointer',
                  'bg-muted/60 hover:bg-muted border-border hover:border-primary/40',
                )}
              >
                <span className="truncate">/link {nonce}</span>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Polling status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isClaiming ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Waiting for Telegram confirmation…</span>
                  </>
                ) : (
                  <span>Nonce expires in 5 minutes.</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
