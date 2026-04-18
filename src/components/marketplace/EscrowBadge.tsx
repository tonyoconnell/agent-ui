import { useEffect, useState } from 'react'

interface EscrowView {
  locked: boolean
  amount: number
  claimant: string | null
  deadline: number
}

interface Props {
  escrowObjectId: string | null
}

export function EscrowBadge({ escrowObjectId }: Props) {
  const [view, setView] = useState<EscrowView | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!escrowObjectId) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/sui/escrow/${encodeURIComponent(escrowObjectId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v: unknown) => {
        if (!cancelled) setView(v as EscrowView | null)
      })
      .catch(() => {
        if (!cancelled) setView(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [escrowObjectId])

  if (!escrowObjectId) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>pending</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>loading…</span>
      </div>
    )
  }

  if (!view) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>not found</span>
      </div>
    )
  }

  const truncated = `${escrowObjectId.slice(0, 6)}…${escrowObjectId.slice(-4)}`

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
      <span className="font-mono tracking-widest">ESCROW</span>
      <span className="font-mono">{view.amount}</span>
      <span className="text-indigo-500">·</span>
      <span className="font-mono text-indigo-400/80">{truncated}</span>
      {view.locked ? <span className="text-emerald-400">locked</span> : <span className="text-slate-400">open</span>}
    </div>
  )
}
