/**
 * CEOPanel — Hire, fire, commend, and flag agents.
 * Shows full agent roster + top performers. CEO-only view.
 */

import { useState, useEffect, useCallback } from 'react'
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
  fid: string
  tid: string
  s: number
  r: number
  t: number
}

type Action = 'commend' | 'flag' | 'hire' | 'fire'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function srColor(sr: number) {
  if (sr >= 0.75) return 'text-emerald-400'
  if (sr >= 0.5) return 'text-slate-300'
  if (sr >= 0.25) return 'text-amber-400'
  return 'text-red-400'
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full',
      active
        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
        : 'bg-slate-600'
    )} />
  )
}

function SrBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.75 ? 'bg-emerald-500' : value >= 0.5 ? 'bg-blue-500' : value >= 0.25 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#252538] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-xs tabular-nums', srColor(value))}>{pct}%</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CEOPanel() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [highways, setHighways] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/state').then(r => r.json()) as {
      units: Agent[]
      edges: Edge[]
    }
    const sorted = [...(res.units || [])].sort((a, b) => b.sr - a.sr)
    setAgents(sorted)
    // Highways = edges where strength > resistance
    const hw = (res.edges || [])
      .filter(e => e.s > e.r)
      .sort((a, b) => (b.s - b.r) - (a.s - a.r))
      .slice(0, 10)
    setHighways(hw)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [load])

  async function act(id: string, action: Action) {
    setPending(p => ({ ...p, [id + action]: true }))
    try {
      if (action === 'hire' || action === 'fire') {
        await fetch(`/api/agents/${encodeURIComponent(id)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action === 'hire' ? 'active' : 'inactive' }),
        })
        setAgents(a => a.map(u => u.id === id ? { ...u, status: action === 'hire' ? 'active' : 'inactive' } : u))
        showToast(action === 'hire' ? `${id} hired` : `${id} fired`)
      } else {
        await fetch(`/api/agents/${encodeURIComponent(id)}/${action}`, { method: 'POST' })
        // Optimistic sr update
        setAgents(a => a.map(u => {
          if (u.id !== id) return u
          const delta = action === 'commend' ? 0.1 : -0.15
          return { ...u, sr: Math.min(0.95, Math.max(0.05, u.sr + delta)) }
        }))
        showToast(action === 'commend' ? `${id} commended` : `${id} flagged`)
      }
    } finally {
      setPending(p => ({ ...p, [id + action]: false }))
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const activeCount = agents.filter(a => a.status === 'active').length
  const avgSr = agents.length ? agents.reduce((s, a) => s + a.sr, 0) / agents.length : 0
  const atRisk = agents.filter(a => a.sr < 0.35).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-slate-500 text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a1a2e] border border-[#252538] rounded-lg px-4 py-2 text-sm text-emerald-400 shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">CEO Control Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Hire · Fire · Commend · Flag</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
            <div className="text-xs text-slate-500">Active</div>
          </div>
          <div>
            <div className={cn('text-2xl font-bold', avgSr >= 0.6 ? 'text-emerald-400' : avgSr >= 0.4 ? 'text-amber-400' : 'text-red-400')}>
              {Math.round(avgSr * 100)}%
            </div>
            <div className="text-xs text-slate-500">Avg SR</div>
          </div>
          <div>
            <div className={cn('text-2xl font-bold', atRisk > 0 ? 'text-red-400' : 'text-slate-500')}>{atRisk}</div>
            <div className="text-xs text-slate-500">At Risk</div>
          </div>
        </div>
      </div>

      {/* Highways — top 10 performers */}
      {highways.length > 0 && (
        <div className="bg-[#161622] border border-[#252538] rounded-xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Top Paths</h2>
          <div className="space-y-1.5">
            {highways.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-slate-600 w-4">{i + 1}</span>
                <span className="text-slate-300 font-mono">{e.fid}</span>
                <span className="text-slate-600">→</span>
                <span className="text-slate-300 font-mono">{e.tid}</span>
                <span className="ml-auto text-emerald-400">+{e.s.toFixed(1)}</span>
                {e.r > 0 && <span className="text-red-400">−{e.r.toFixed(1)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Roster */}
      <div className="bg-[#161622] border border-[#252538] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#252538]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Agent Roster — {agents.length} units
          </h2>
        </div>
        <div className="divide-y divide-[#1e1e30]">
          {agents.map(agent => (
            <div
              key={agent.id}
              className={cn(
                'flex items-center gap-4 px-4 py-3 hover:bg-[#1a1a2e] transition-colors',
                agent.status === 'inactive' && 'opacity-50'
              )}
            >
              {/* Status dot + name */}
              <StatusDot active={agent.status === 'active'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200 truncate">{agent.name || agent.id}</div>
                <div className="text-xs text-slate-600 truncate">{agent.id}</div>
              </div>

              {/* Gen badge */}
              {agent.g > 0 && (
                <span className="text-xs text-purple-400 border border-purple-400/30 rounded px-1.5 py-0.5">
                  gen {agent.g}
                </span>
              )}

              {/* SR bar */}
              <SrBar value={agent.sr} />

              {/* Actions */}
              <div className="flex gap-1">
                <ActionBtn
                  label="★"
                  title="Commend — boost success-rate"
                  color="text-emerald-400 hover:bg-emerald-400/10"
                  loading={pending[agent.id + 'commend']}
                  disabled={agent.status === 'inactive'}
                  onClick={() => act(agent.id, 'commend')}
                />
                <ActionBtn
                  label="⚑"
                  title="Flag — lower success-rate, increase resistance"
                  color="text-amber-400 hover:bg-amber-400/10"
                  loading={pending[agent.id + 'flag']}
                  disabled={agent.status === 'inactive'}
                  onClick={() => act(agent.id, 'flag')}
                />
                {agent.status === 'active' ? (
                  <ActionBtn
                    label="✕"
                    title="Fire — set inactive"
                    color="text-red-400 hover:bg-red-400/10"
                    loading={pending[agent.id + 'fire']}
                    onClick={() => act(agent.id, 'fire')}
                  />
                ) : (
                  <ActionBtn
                    label="↑"
                    title="Hire — set active"
                    color="text-blue-400 hover:bg-blue-400/10"
                    loading={pending[agent.id + 'hire']}
                    onClick={() => act(agent.id, 'hire')}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs text-slate-600">
        <span><span className="text-emerald-400">★</span> Commend — boosts SR +10%, strengthens paths</span>
        <span><span className="text-amber-400">⚑</span> Flag — lowers SR −15%, adds resistance</span>
        <span><span className="text-red-400">✕</span> Fire — marks inactive, excluded from routing</span>
        <span><span className="text-blue-400">↑</span> Hire — reactivates agent</span>
      </div>
    </div>
  )
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

function ActionBtn({
  label, title, color, loading, disabled, onClick
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
        (loading || disabled) && 'opacity-30 cursor-not-allowed'
      )}
    >
      {loading ? '…' : label}
    </button>
  )
}
