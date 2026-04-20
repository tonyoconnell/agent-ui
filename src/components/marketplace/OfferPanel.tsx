import { useOptimistic, useTransition } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Service {
  provider: string
  task: string
  price: number
  strength: number
  revenue: number
  calls: number
  successRate?: number
}

interface OfferReceipt {
  id: string
  receiver: string
  price: number
}

interface Props {
  service: Service | null
  onClose: () => void
  onOffer: (receipt: OfferReceipt) => void
}

type OfferPhase = 'idle' | 'offered' | 'error'

export function OfferPanel({ service, onClose, onOffer }: Props) {
  const [isPending, startTransition] = useTransition()
  const [optimisticPhase, setOptimisticPhase] = useOptimistic<OfferPhase, OfferPhase>('idle', (_, next) => next)

  if (!service) return null

  const handleClose = () => {
    emitClick('ui:marketplace:offer-close', {})
    onClose()
  }

  const handleOffer = () => {
    if (isPending) return
    emitClick('ui:marketplace:offer', { receiver: service.provider, price: service.price })

    startTransition(async () => {
      // Optimistic: show offered state immediately (0ms perceived latency)
      setOptimisticPhase('offered')

      const id = `receipt_${crypto.randomUUID().slice(0, 8)}`

      try {
        await fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: service.provider,
            data: { type: 'offer', task: service.task, price: service.price, receiptId: id },
          }),
        })
        onOffer({ id, receiver: service.provider, price: service.price })
      } catch {
        // Rollback: optimistic state reverts automatically when transition ends
        setOptimisticPhase('error')
      }
    })
  }

  const label =
    optimisticPhase === 'offered'
      ? 'Offered ✓'
      : optimisticPhase === 'error'
        ? 'Failed — retry?'
        : `Offer $${service.price.toFixed(2)}`

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Offer panel">
      <button type="button" className="flex-1 bg-black/60" onClick={handleClose} aria-label="Close offer panel" />
      <div className="w-full max-w-md bg-[#161622] border-l border-[#252538] p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-slate-500">OFFER</div>
            <div className="text-lg text-white mt-1">{service.task}</div>
            <div className="text-sm text-slate-400 mt-0.5">{service.provider}</div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">PRICE</dt>
            <dd className="text-white font-mono mt-0.5">${service.price.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">Path strength</dt>
            <dd className="text-white font-mono mt-0.5">{service.strength.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">Revenue (30d)</dt>
            <dd className="text-white font-mono mt-0.5">${service.revenue.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">Times used</dt>
            <dd className="text-white font-mono mt-0.5">{service.calls}</dd>
          </div>
          {service.successRate !== undefined && service.successRate > 0 && (
            <div>
              <dt className="text-[10px] font-mono tracking-widest text-slate-500">Success rate</dt>
              <dd className="text-white font-mono mt-0.5">{(service.successRate * 100).toFixed(0)}%</dd>
            </div>
          )}
        </dl>

        <div className="h-px bg-[#252538] my-2" />

        <div aria-live="polite">
          <button
            type="button"
            onClick={handleOffer}
            disabled={isPending || optimisticPhase === 'offered'}
            aria-label={`Send offer of $${service.price.toFixed(2)} to ${service.provider}`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-sm font-medium"
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  )
}
