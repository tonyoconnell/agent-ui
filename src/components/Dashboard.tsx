/**
 * Dashboard — Phase 6 monitoring dashboard
 *
 * Shows system health, real-time stats, revenue chart placeholder,
 * and alert list. Dark theme. Polls /api/health and /api/stats.
 */

import { useCallback, useEffect, useState } from 'react'
import { sdk } from '@/lib/sdk'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthData {
  status: 'healthy' | 'degraded'
  typedb: { status: 'ok' | 'error'; latencyMs: number }
  version: string
  phase: string
  uptime: number
  timestamp: string
}

interface StatsData {
  actors: { total: number; proven: number; atRisk: number }
  tasks: { total: number; ready: number; active: number; complete: number }
  highways: { count: number; totalEdges: number }
  revenue: { total: number; gdp: number }
  signals: { total: number; recent: number }
  timestamp: string
}

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: string
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function HealthDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full',
        ok
          ? 'bg-tertiary-bright shadow-[0_0_6px_hsl(var(--color-tertiary-bright)/0.5)]'
          : 'bg-destructive shadow-[0_0_6px_hsl(var(--color-destructive)/0.5)]',
      )}
    />
  )
}

function HealthRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <HealthDot ok={ok} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-2xl font-bold text-font tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function AlertRow({ alert }: { alert: Alert }) {
  const colors = {
    error: 'text-destructive bg-destructive/10 border-destructive/20',
    warning: 'text-gold bg-gold/10 border-gold/20',
    info: 'text-primary-bright bg-primary-bright/10 border-primary-bright/20',
  }
  const icons = { error: '!', warning: '!', info: 'i' }

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', colors[alert.type])}>
      <span className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center border border-current shrink-0 mt-0.5">
        {icons[alert.type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm">{alert.message}</div>
        <div className="text-xs opacity-60 mt-1">{alert.timestamp}</div>
      </div>
    </div>
  )
}

function RevenueBreakdown() {
  const [paths, setPaths] = useState<Array<{ from: string; to: string; revenue: number; strength: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sdk
      .state()
      .then((data) => {
        const edges = ((data.edges as Array<{ from: string; to: string; revenue: number; strength: number }>) || [])
          .filter((e) => e.revenue > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
        setPaths(edges)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-muted-foreground py-4">Loading revenue data...</div>
  if (paths.length === 0) return <div className="text-sm text-muted-foreground py-4">No revenue recorded yet</div>

  const maxRevenue = paths[0]?.revenue || 1

  return (
    <div className="space-y-2">
      {paths.map((p) => (
        <div key={`${p.from}-${p.to}`} className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground truncate">
              {p.from} → {p.to}
            </div>
          </div>
          <div className="w-24 h-1.5 rounded-full overflow-hidden bg-border">
            <div
              className="h-full rounded-full bg-tertiary-bright/60"
              style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-tertiary-bright w-16 text-right">${p.revenue.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  const fetchData = useCallback(async () => {
    const newAlerts: Alert[] = []
    const now = new Date().toLocaleTimeString()

    try {
      const [healthRes, statsRes] = await Promise.all([
        sdk.health().catch(() => null),
        sdk.stats().catch(() => null),
        sdk.know().catch(() => null), // growth loop (includes decay)
      ])

      if (healthRes) {
        const h = healthRes as unknown as HealthData
        setHealth(h)
        if (h.typedb?.status !== 'ok') {
          newAlerts.push({
            id: 'typedb-down',
            type: 'error',
            message: `TypeDB connectivity lost (${h.typedb?.latencyMs}ms)`,
            timestamp: now,
          })
        }
        if (h.typedb?.latencyMs > 1000) {
          newAlerts.push({
            id: 'typedb-slow',
            type: 'warning',
            message: `TypeDB latency spike: ${h.typedb.latencyMs}ms`,
            timestamp: now,
          })
        }
      } else {
        newAlerts.push({
          id: 'api-down',
          type: 'error',
          message: 'Health API unreachable',
          timestamp: now,
        })
      }

      if (statsRes) {
        const s = statsRes as unknown as StatsData
        setStats(s)
        if (s.actors?.atRisk > 0) {
          newAlerts.push({
            id: 'at-risk',
            type: 'warning',
            message: `${s.actors.atRisk} actor(s) at risk`,
            timestamp: now,
          })
        }
        if (s.highways?.count === 0 && s.highways?.totalEdges > 0) {
          newAlerts.push({
            id: 'no-highways',
            type: 'warning',
            message: 'No highways active (all paths below threshold)',
            timestamp: now,
          })
        }
      }

      if (newAlerts.length === 0) {
        newAlerts.push({
          id: 'all-clear',
          type: 'info',
          message: 'All systems nominal',
          timestamp: now,
        })
      }

      setAlerts(newAlerts)
      setLastRefresh(now)
    } catch {
      setAlerts([
        {
          id: 'fetch-error',
          type: 'error',
          message: 'Failed to fetch dashboard data',
          timestamp: now,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const formatRevenue = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
    return `$${amount}`
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-font">ONE World Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phase 6: Scale {health?.version && `/ v${health.version}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && <span className="text-xs text-muted-foreground">Updated {lastRefresh}</span>}
          <button
            onClick={fetchData}
            className="text-xs px-3 py-1.5 bg-border hover:bg-card text-foreground rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading dashboard...</div>
      ) : (
        <>
          {/* Health + Alerts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Health */}
            <div className="bg-background border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                System Health
              </h2>
              <HealthRow
                label="TypeDB"
                ok={health?.typedb?.status === 'ok'}
                detail={health?.typedb?.latencyMs !== undefined ? `${health.typedb.latencyMs}ms` : undefined}
              />
              <HealthRow
                label="Worker"
                ok={health?.status === 'healthy'}
                detail={health?.uptime !== undefined ? formatUptime(health.uptime) : undefined}
              />
              <HealthRow label="API" ok={!!health} detail={health?.phase ?? undefined} />
            </div>

            {/* Alerts */}
            <div className="bg-background border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alerts</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">World Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Actors" value={stats?.actors?.total ?? 0} sub={`${stats?.actors?.proven ?? 0} proven`} />
              <StatCard
                label="Tasks"
                value={stats?.tasks?.total ?? 0}
                sub={`${stats?.tasks?.ready ?? 0} ready / ${stats?.tasks?.active ?? 0} active`}
              />
              <StatCard
                label="Highways"
                value={stats?.highways?.count ?? 0}
                sub={`${stats?.highways?.totalEdges ?? 0} total paths`}
              />
              <StatCard
                label="Revenue"
                value={formatRevenue(stats?.revenue?.total ?? 0)}
                sub={`GDP ${formatRevenue(stats?.revenue?.gdp ?? 0)}`}
              />
              <StatCard
                label="Signals"
                value={stats?.signals?.total ?? 0}
                sub={`${stats?.signals?.recent ?? 0} last hour`}
              />
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-background border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue</h2>
            <RevenueBreakdown />
          </div>

          {/* Actions */}
          <div className="bg-background border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <ActionButton label="Run Decay Cycle" endpoint="/api/decay-cycle" method="POST" />
              <ActionButton label="Seed World" endpoint="/api/seed" method="POST" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ActionButton({ label, endpoint, method }: { label: string; endpoint: string; method: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleClick = async () => {
    setStatus('loading')
    try {
      const res = await fetch(endpoint, { method })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      className={cn(
        'text-sm px-4 py-2 rounded-md transition-colors',
        status === 'idle' && 'bg-border hover:bg-card text-foreground',
        status === 'loading' && 'bg-border text-muted-foreground cursor-wait',
        status === 'done' && 'bg-tertiary-bright/20 text-tertiary-bright border border-tertiary-bright/20',
        status === 'error' && 'bg-destructive/20 text-destructive border border-destructive/20',
      )}
    >
      {status === 'loading' ? 'Running...' : status === 'done' ? 'Done' : status === 'error' ? 'Failed' : label}
    </button>
  )
}
