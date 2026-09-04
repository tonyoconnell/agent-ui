/**
 * HireButton — Interactive pay flow for skill detail page
 *
 * States: idle → confirming → paying → settled | failed
 * POSTs /api/pay with { from, to, task, amount } on confirm.
 */

import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

type Stage = 'idle' | 'confirm' | 'paying' | 'settled' | 'failed'

interface Props {
  skillId: string
  sellerUid: string
  sellerName: string
  price: number
  buyerUid?: string
}

export function HireButton({ skillId, sellerUid, sellerName, price, buyerUid = 'visitor' }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const isFree = price <= 0

  const openConfirm = () => {
    emitClick('ui:market:hire-open', { skillId, sellerUid })
    setStage('confirm')
  }

  const cancel = () => {
    emitClick('ui:market:hire-cancel', { skillId })
    setStage('idle')
    setResult(null)
  }

  const submit = async () => {
    emitClick('ui:market:hire-confirm', { skillId, sellerUid, price })
    setStage('paying')
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: buyerUid, to: sellerUid, task: skillId, amount: isFree ? 0.001 : price }),
      })
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; amount: number }
        setResult({ ok: true, message: `Paid ${data.amount.toFixed(3)} to ${sellerName}` })
        setStage('settled')
      } else {
        const text = await res.text()
        setResult({ ok: false, message: text || 'Payment failed' })
        setStage('failed')
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' })
      setStage('failed')
    }
  }

  if (stage === 'settled' && result) {
    return (
      <div className="rounded-lg border border-[hsl(var(--color-tertiary-bright)/0.3)] bg-[hsl(var(--color-tertiary-bright)/0.1)] px-5 py-4 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-[hsl(var(--color-tertiary-bright))] animate-pulse" />
        <span className="text-sm text-[hsl(var(--color-tertiary-bright)/0.85)]">{result.message}</span>
        <button
          type="button"
          onClick={() => {
            setStage('idle')
            setResult(null)
          }}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        >
          hire again
        </button>
      </div>
    )
  }

  if (stage === 'failed' && result) {
    return (
      <div className="rounded-lg border border-[hsl(var(--color-destructive)/0.3)] bg-[hsl(var(--color-destructive)/0.1)] px-5 py-4 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-[hsl(var(--color-destructive))]" />
        <span className="text-sm text-[hsl(var(--color-destructive)/0.85)]">{result.message}</span>
        <button type="button" onClick={cancel} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
          retry
        </button>
      </div>
    )
  }

  if (stage === 'confirm' || stage === 'paying') {
    return (
      <div className="rounded-lg border border-border bg-card px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Hire <span className="text-font">{sellerName}</span> for {isFree ? 'free' : `$${price.toFixed(2)}`}?
          </span>
          <span className="text-xs font-mono text-muted-foreground">{skillId}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={stage === 'paying'}
            className="flex-1 rounded bg-[hsl(var(--color-primary-bright))] hover:bg-[hsl(var(--color-primary-bright)/0.9)] disabled:opacity-50 disabled:cursor-wait px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {stage === 'paying' ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Paying…
              </span>
            ) : (
              `Confirm ${isFree ? 'hire' : `$${price.toFixed(2)}`}`
            )}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={stage === 'paying'}
            className="rounded border border-border hover:border-[hsl(var(--color-primary-mid))] px-4 py-2 text-sm text-muted-foreground disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={openConfirm}
      className="rounded bg-[hsl(var(--color-primary-bright))] hover:bg-[hsl(var(--color-primary-bright)/0.9)] px-5 py-2 text-sm font-medium text-white transition-colors"
    >
      {isFree ? 'Hire free' : `Hire — $${price.toFixed(2)}`}
    </button>
  )
}
