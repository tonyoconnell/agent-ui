/**
 * CEOPanel — Hire, fire, commend, and flag agents.
 * Shows top performers, at-risk agents, stats bar, toxic paths, and full roster.
 * CEO-only view.
 */

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agent {
  id: string
  name: string
  status: 'active' | 'inactive'
  sr: number
  g: number
  kind: string
}

interface Edge {
  from: string
  to: string
  strength: number
  resistance: number
  revenue: number
  toxic: boolean
}

interface Stats {
  units: number
  proven: number
  highways: number
  edges: number
  tags: number
  revenue: number
}

interface StateResponse {
  units: Agent[]
  edges: Edge[]
  highways: Edge[]
  stats: Stats
}

type Action = 'commend' | 'flag' | 'hire' | 'fire'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function srColor(sr: number) {
  if (sr >= 0.75) return 'text-emerald-400'
  if (sr >= 0.5) return 'text-slate-300'
  if (sr >= 0.25) return 'text-amber-400'
  return 'text-red-400'
}

function netStrength(id: string, edges: Edge[]): number {
  return edges.filter((e) => e.from === id).reduce((sum, e) => sum + (e.strength - e.resistance), 0)
}

function topSkill(id: string, edges: Edge[]): string | null {
  const out = edges.filter((e) => e.from === id).sort((a, b) => b.strength - b.resistance - (a.strength - a.resistance))
  return out[0]?.to ?? null
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full flex-shrink-0',
        active ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-slate-600',
      )}
    />
  )
}

function SrBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    value >= 0.75 ? 'bg-emerald-500' : value >= 0.5 ? 'bg-blue-500' : value >= 0.25 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#252538] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-xs tabular-nums w-8', srColor(value))}>{pct}%</span>
    </div>
  )
}

function NetStrengthBadge({ value }: { value: number }) {
  const color = value > 10 ? 'text-emerald-400' : value > 0 ? 'text-slate-400' : 'text-red-400'
  return (
    <span className={cn('text-xs tabular-nums font-mono w-12 text-right', color)}>
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}
    </span>
  )
}

// ─── Agent Row ────────────────────────────────────────────────────────────────

interface AgentRowProps {
  agent: Agent
  net: number
  skill: string | null
  pending: Record<string, boolean>
  onAction: (id: string, action: Action) => void
  showNet?: boolean
}

function AgentRow({ agent, net, skill, pending, onAction, showNet = false }: AgentRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a2e] transition-colors',
        agent.status === 'inactive' && 'opacity-50',
      )}
    >
      <StatusDot active={agent.status === 'active'} />

      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 truncate">{agent.name || agent.id}</div>
        {skill && <div className="text-xs text-slate-600 truncate">→ {skill}</div>}
      </div>

      {agent.g > 0 && (
        <span className="text-xs text-purple-400 border border-purple-400/30 rounded px-1.5 py-0.5 flex-shrink-0">
          gen {agent.g}
        </span>
      )}

      <SrBar value={agent.sr} />

      {showNet && <NetStrengthBadge value={net} />}

      <div className="flex gap-1 flex-shrink-0">
        <ActionBtn
          label="★"
          title="Commend — boost success-rate +10%, strengthen outgoing paths"
          color="text-emerald-400 hover:bg-emerald-400/10"
          loading={pending[`${agent.id}commend`]}
          disabled={agent.status === 'inactive'}
          onClick={() => onAction(agent.id, 'commend')}
        />
        <ActionBtn
          label="⚑"
          title="Flag — lower success-rate −15%, add resistance"
          color="text-amber-400 hover:bg-amber-400/10"
          loading={pending[`${agent.id}flag`]}
          disabled={agent.status === 'inactive'}
          onClick={() => onAction(agent.id, 'flag')}
        />
        {agent.status === 'active' ? (
          <ActionBtn
            label="✕"
            title="Deactivate — remove from routing"
            color="text-slate-500 hover:bg-slate-500/10"
            loading={pending[`${agent.id}fire`]}
            onClick={() => onAction(agent.id, 'fire')}
          />
        ) : (
          <ActionBtn
            label="↑"
            title="Activate — restore to routing"
            color="text-blue-400 hover:bg-blue-400/10"
            loading={pending[`${agent.id}hire`]}
            onClick={() => onAction(agent.id, 'hire')}
          />
        )}
      </div>
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="Total Units" value={stats.units} color="text-slate-200" />
      <StatCard label="Proven" value={stats.proven} color="text-emerald-400" />
      <StatCard label="Highways" value={stats.highways} color="text-blue-400" />
      <StatCard label="Revenue" value={`$${stats.revenue.toFixed(2)}`} color="text-amber-400" />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#161622] border border-[#252538] rounded-xl p-4 text-center">
      <div className={cn('text-2xl font-bold tabular-nums', color)}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

// ─── Toxic Paths ─────────────────────────────────────────────────────────────

function ToxicPaths({ edges }: { edges: Edge[] }) {
  const toxic = edges.filter((e) => e.toxic || (e.resistance >= 10 && e.resistance > e.strength * 2))
  if (toxic.length === 0) return null

  return (
    <div className="bg-[#1a0f0f] border border-red-900/50 rounded-xl p-4">
      <h2 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">
        ⚠ Toxic Paths — {toxic.length}
      </h2>
      <div className="space-y-1.5">
        {toxic.slice(0, 8).map((e, i) => (
          <div key={i} className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400 truncate flex-1">{e.from}</span>
            <span className="text-slate-600">→</span>
            <span className="text-slate-400 truncate flex-1">{e.to}</span>
            <span className="text-emerald-400/60">+{e.strength.toFixed(1)}</span>
            <span className="text-red-400">−{e.resistance.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CEOPanel() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [stats, setStats] = useState<Stats>({ units: 0, proven: 0, highways: 0, edges: 0, tags: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = (await fetch('/api/state').then((r) => r.json())) as StateResponse
      setAgents([...(res.units || [])])
      setEdges(res.edges || [])
      setStats(res.stats || { units: 0, proven: 0, highways: 0, edges: 0, tags: 0, revenue: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [load])

  async function act(id: string, action: Action) {
    setPending((p) => ({ ...p, [id + action]: true }))
    try {
      if (action === 'hire' || action === 'fire') {
        const status = action === 'hire' ? 'active' : 'inactive'
        await fetch(`/api/agents/${encodeURIComponent(id)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        setAgents((a) => a.map((u) => (u.id === id ? { ...u, status } : u)))
        showToast(action === 'hire' ? `${id} activated` : `${id} deactivated`)
      } else {
        await fetch(`/api/agents/${encodeURIComponent(id)}/${action}`, { method: 'POST' })
        setAgents((a) =>
          a.map((u) => {
            if (u.id !== id) return u
            const delta = action === 'commend' ? 0.1 : -0.15
            return { ...u, sr: Math.min(0.95, Math.max(0.05, u.sr + delta)) }
          }),
        )
        showToast(action === 'commend' ? `★ ${id} commended` : `⚑ ${id} flagged`)
      }
    } finally {
      setPending((p) => ({ ...p, [id + action]: false }))
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Derived views
  const agentsWithNet = agents.map((a) => ({
    ...a,
    net: netStrength(a.id, edges),
    topSkill: topSkill(a.id, edges),
  }))

  const topPerformers = [...agentsWithNet]
    .filter((a) => a.status === 'active')
    .sort((a, b) => b.net - a.net)
    .slice(0, 10)

  const atRisk = agentsWithNet.filter((a) => a.sr < 0.4 && a.status === 'active').sort((a, b) => a.sr - b.sr)

  const avgSr = agents.length ? agents.reduce((s, a) => s + a.sr, 0) / agents.length : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading world state…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-6 space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a1a2e] border border-[#252538] rounded-lg px-4 py-2 text-sm text-emerald-400 shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">CEO Control Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Avg SR: <span className={cn('font-mono', srColor(avgSr))}>{Math.round(avgSr * 100)}%</span>
            {' · '}
            {agents.filter((a) => a.status === 'active').length} active
            {atRisk.length > 0 && <span className="text-red-400 ml-2">· {atRisk.length} at risk</span>}
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded border border-[#252538] hover:border-slate-500"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-[#161622] border border-[#252538] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#252538] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Top Performers</h2>
            <span className="text-xs text-slate-600">net strength = mark − warn</span>
          </div>
          <div className="divide-y divide-[#1e1e30]">
            {topPerformers.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                net={agent.net}
                skill={agent.topSkill}
                pending={pending}
                onAction={act}
                showNet
              />
            ))}
          </div>
        </div>
      )}

      {/* At-Risk Agents */}
      {atRisk.length > 0 && (
        <div className="bg-[#161622] border border-red-900/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-900/40">
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-widest">
              At-Risk Agents — SR &lt; 40%
            </h2>
          </div>
          <div className="divide-y divide-[#1e1e30]">
            {atRisk.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                net={agent.net}
                skill={agent.topSkill}
                pending={pending}
                onAction={act}
              />
            ))}
          </div>
        </div>
      )}

      {/* Toxic Paths */}
      <ToxicPaths edges={edges} />

      {/* Full Roster */}
      <div className="bg-[#161622] border border-[#252538] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#252538]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Full Roster — {agents.length} units
          </h2>
        </div>
        <div className="divide-y divide-[#1e1e30]">
          {agentsWithNet
            .sort((a, b) => b.sr - a.sr)
            .map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                net={agent.net}
                skill={agent.topSkill}
                pending={pending}
                onAction={act}
              />
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600 pb-2">
        <span>
          <span className="text-emerald-400">★</span> Commend — SR +10%, strengthen outgoing paths
        </span>
        <span>
          <span className="text-amber-400">⚑</span> Flag — SR −15%, add resistance to paths
        </span>
        <span>
          <span className="text-slate-400">✕</span> Deactivate — exclude from routing
        </span>
        <span>
          <span className="text-blue-400">↑</span> Activate — restore to routing
        </span>
      </div>
    </div>
  )
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

function ActionBtn({
  label,
  title,
  color,
  loading,
  disabled,
  onClick,
}: {
  label: string
  title: string
  color: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className={cn(
        'w-7 h-7 rounded text-sm font-mono transition-colors flex items-center justify-center',
        color,
        (loading || disabled) && 'opacity-30 cursor-not-allowed',
      )}
    >
      {loading ? '…' : label}
    </button>
  )
}
