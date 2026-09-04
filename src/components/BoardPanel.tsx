/**
 * BoardPanel — Read-only governance dashboard for board members and auditors.
 * Shows system health: stats, proven highways, toxic paths, revenue summary.
 * No write actions. Pure observation.
 */

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Edge {
  from: string
  to: string
  strength: number
  resistance: number
  revenue: number
  toxic: boolean
}

interface Stats {
  actors: number
  proven: number
  highways: number
  edges: number
  tags: number
  revenue: number
}

interface StateResponse {
  edges: Edge[]
  highways: Edge[]
  stats: Stats
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className={cn('text-2xl font-bold tabular-nums', color)}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Total Actors" value={stats.actors} color="text-font" />
      <StatCard label="Proven Paths" value={stats.proven} color="text-tertiary-bright" />
      <StatCard label="Revenue" value={`$${stats.revenue.toFixed(2)}`} color="text-gold" />
    </div>
  )
}

function HighwayRow({ edge, rank, maxStrength }: { edge: Edge; rank: number; maxStrength: number }) {
  const net = edge.strength - edge.resistance
  const pct = Math.round((edge.strength / maxStrength) * 100)
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-xs text-muted-foreground w-4 tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-foreground truncate max-w-[130px]">{edge.from}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground truncate max-w-[130px]">{edge.to}</span>
        </div>
        <div className="mt-1 h-0.5 w-full bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary-bright/60 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex gap-3 flex-shrink-0 text-xs tabular-nums">
        <span className="text-tertiary-bright/70">+{edge.strength.toFixed(0)}</span>
        {edge.resistance > 0 && <span className="text-destructive/70">−{edge.resistance.toFixed(0)}</span>}
        <span className={cn('font-mono', net > 10 ? 'text-tertiary-bright' : 'text-muted-foreground')}>
          {net > 0 ? '+' : ''}
          {net.toFixed(0)} net
        </span>
      </div>
    </div>
  )
}

function HighwaysSection({ edges }: { edges: Edge[] }) {
  if (edges.length === 0)
    return <p className="text-xs text-muted-foreground px-1">No proven highways yet — paths need strength ≥ 50.</p>

  const maxStrength = Math.max(...edges.map((e) => e.strength), 1)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Proven Highways — top {edges.length}
        </h2>
        <span className="text-xs text-muted-foreground">strength · resistance · net</span>
      </div>
      <div className="divide-y divide-border">
        {edges.map((e, i) => (
          <HighwayRow key={`${e.from}→${e.to}`} edge={e} rank={i + 1} maxStrength={maxStrength} />
        ))}
      </div>
    </div>
  )
}

function ToxicPaths({ edges }: { edges: Edge[] }) {
  const toxic = edges.filter((e) => e.toxic || (e.resistance >= 10 && e.resistance > e.strength * 2))
  if (toxic.length === 0)
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground">
        No toxic paths — system routing is clean.
      </div>
    )

  return (
    <div className="bg-destructive/20 border border-destructive/50 rounded-xl p-4">
      <h2 className="text-xs font-semibold text-destructive uppercase tracking-widest mb-3">
        Blocked Paths — {toxic.length}
      </h2>
      <div className="space-y-1.5">
        {toxic.slice(0, 10).map((e, i) => (
          <div key={i} className="flex items-center gap-3 text-xs font-mono">
            <span className="text-muted-foreground truncate flex-1">{e.from}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-muted-foreground truncate flex-1">{e.to}</span>
            <span className="text-tertiary-bright/60">+{e.strength.toFixed(1)}</span>
            <span className="text-destructive">−{e.resistance.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RevenueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-gold tabular-nums font-mono">{value}</span>
    </div>
  )
}

function RevenueSummary({ stats, edges }: { stats: Stats; edges: Edge[] }) {
  const pathRevenue = edges.reduce((sum, e) => sum + (e.revenue ?? 0), 0)
  const avgPerPath = stats.proven > 0 ? pathRevenue / stats.proven : 0

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Revenue Summary</h2>
      </div>
      <div className="divide-y divide-border">
        <RevenueRow label="Total revenue" value={`$${stats.revenue.toFixed(4)}`} />
        <RevenueRow label="Path revenue" value={`$${pathRevenue.toFixed(4)}`} />
        <RevenueRow label="Avg per proven path" value={`$${avgPerPath.toFixed(4)}`} />
        <RevenueRow label="Active paths" value={String(stats.edges)} />
        <RevenueRow label="Proven highways" value={String(stats.proven)} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BoardPanel() {
  const [edges, setEdges] = useState<Edge[]>([])
  const [highways, setHighways] = useState<Edge[]>([])
  const [stats, setStats] = useState<Stats>({ actors: 0, proven: 0, highways: 0, edges: 0, tags: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const res = (await fetch('/api/state').then((r) => r.json())) as StateResponse
      setEdges(res.edges || [])
      setHighways((res.highways || []).slice(0, 10))
      setStats(res.stats || { actors: 0, proven: 0, highways: 0, edges: 0, tags: 0, revenue: 0 })
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading board view…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-font p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-font">Board Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Read-only · {stats.actors} actors · auto-refreshes every 30s
            {lastRefresh && <span className="ml-2">· updated {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <span className="text-xs text-muted-foreground border border-border rounded px-2 py-1">observer</span>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Proven Highways */}
      <HighwaysSection edges={highways} />

      {/* Toxic / Blocked Paths */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
          Routing Health
        </h2>
        <ToxicPaths edges={edges} />
      </div>

      {/* Revenue */}
      <RevenueSummary stats={stats} edges={edges} />

      {/* Footer note */}
      <p className="text-xs text-muted-foreground pb-2 text-center">
        Governance view — observation only. Contact ops to act on flagged paths.
      </p>
    </div>
  )
}
