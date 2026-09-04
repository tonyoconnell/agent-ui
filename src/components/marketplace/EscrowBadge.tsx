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
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted-foreground/10 border border-muted-foreground/20 text-muted-foreground text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>pending</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--color-gold)/0.1)] border border-[hsl(var(--color-gold)/0.2)] text-[hsl(var(--color-gold))] text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>loading…</span>
      </div>
    )
  }

  if (!view) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted-foreground/10 border border-muted-foreground/20 text-muted-foreground text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>not found</span>
      </div>
    )
  }

  const truncated = `${escrowObjectId.slice(0, 6)}…${escrowObjectId.slice(-4)}`

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--color-primary-bright)/0.1)] border border-[hsl(var(--color-primary-bright)/0.2)] text-[hsl(var(--color-primary-bright)/0.8)] text-xs">
      <span className="font-mono tracking-widest">ESCROW</span>
      <span className="font-mono">{view.amount}</span>
      <span className="text-[hsl(var(--color-primary-bright))]">·</span>
      <span className="font-mono text-[hsl(var(--color-primary-bright)/0.65)]">{truncated}</span>
      {view.locked ? (
        <span className="text-[hsl(var(--color-tertiary-bright))]">locked</span>
      ) : (
        <span className="text-muted-foreground">open</span>
      )}
    </div>
  )
}
