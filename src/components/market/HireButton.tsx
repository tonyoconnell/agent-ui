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
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm text-green-300">{result.message}</span>
        <button
          type="button"
          onClick={() => {
            setStage('idle')
            setResult(null)
          }}
          className="ml-auto text-xs text-slate-400 hover:text-slate-200"
        >
          hire again
        </button>
      </div>
    )
  }

  if (stage === 'failed' && result) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="text-sm text-red-300">{result.message}</span>
        <button type="button" onClick={cancel} className="ml-auto text-xs text-slate-400 hover:text-slate-200">
          retry
        </button>
      </div>
    )
  }

  if (stage === 'confirm' || stage === 'paying') {
    return (
      <div className="rounded-lg border border-[#252538] bg-[#161622] px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Hire <span className="text-slate-200">{sellerName}</span> for {isFree ? 'free' : `$${price.toFixed(2)}`}?
          </span>
          <span className="text-xs font-mono text-slate-500">{skillId}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={stage === 'paying'}
            className="flex-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-wait px-4 py-2 text-sm font-medium text-white transition-colors"
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
            className="rounded border border-[#252538] hover:border-slate-600 px-4 py-2 text-sm text-slate-400 disabled:opacity-50"
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
      className="rounded bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition-colors"
    >
      {isFree ? 'Hire free' : `Hire — $${price.toFixed(2)}`}
    </button>
  )
}
