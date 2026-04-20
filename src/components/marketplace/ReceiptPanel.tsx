import { emitClick } from '@/lib/ui-signal'
import { EscrowBadge } from './EscrowBadge'
import type { TradeState } from './useTradeLifecycle'
import { visibleStage } from './useTradeLifecycle'

interface Props {
  state: TradeState
  onDispute: () => void
  onClose: () => void
}

function truncate(hex: string | null, chars = 6): string {
  if (!hex) return '—'
  if (hex.length <= chars * 2 + 2) return hex
  return `${hex.slice(0, chars + 2)}…${hex.slice(-chars)}`
}

export function ReceiptPanel({ state, onDispute, onClose }: Props) {
  const vs = visibleStage(state.stage)
  const visible = vs === 'DONE' || vs === 'DISPUTE'
  if (!visible) return null

  const handleDispute = () => {
    emitClick('ui:marketplace:dispute', { receiver: state.provider ?? '', receiptId: state.receiptId ?? '' })
    onDispute()
  }

  const handleClose = () => {
    emitClick('ui:marketplace:receipt-close', {})
    onClose()
  }

  const disputed = state.stage === 'DISPUTE'

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Receipt panel">
      <button type="button" className="flex-1 bg-black/60" onClick={handleClose} aria-label="Close receipt panel" />
      <div className="w-full max-w-md bg-[#161622] border-l border-[#252538] p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-slate-500">
              {disputed ? 'DISPUTE' : 'RECEIPT'}
            </div>
            <div className="text-lg text-white mt-1">{state.task ?? '—'}</div>
            <div className="text-sm text-slate-400 mt-0.5">{state.provider ?? '—'}</div>
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

        <EscrowBadge escrowObjectId={state.receiptId} />

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">Trade ID</dt>
            <dd className="text-white font-mono mt-0.5">{truncate(state.receiptId, 4)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">Amount</dt>
            <dd className="text-white font-mono mt-0.5">${state.price.toFixed(2)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">Transaction</dt>
            <dd className="text-white font-mono mt-0.5">{truncate(state.txHash ?? '0x0000000000000000', 8)}</dd>
          </div>
        </dl>

        <div className="h-px bg-[#252538] my-2" />

        {disputed ? (
          <div className="text-sm text-rose-400" aria-live="assertive">
            Disputed — other traders will see lower trust for this route.
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDispute}
            aria-label="Raise a dispute for this trade"
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-sm font-medium"
          >
            Dispute
          </button>
        )}
      </div>
    </div>
  )
}
