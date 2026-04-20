/**
 * KnowledgePanel — Hypotheses, frontiers, and objectives
 *
 * Three sections with status badges. Hypotheses show p-value progress bar.
 * Frontiers show expected value. Objectives show progress bar.
 */

import { useCallback, useEffect, useState } from 'react'
import { sdk } from '@/lib/sdk'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Hypothesis {
  hid: string
  statement: string
  status: string
  observations: number
  pValue: number
  actionReady: boolean
}

interface Frontier {
  fid: string
  type: string
  description: string
  expectedValue: number
  status: string
}

interface Objective {
  oid: string
  type: string
  description: string
  priority: number
  progress: number
  status: string
}

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_HYPOTHESES: Hypothesis[] = [
  {
    hid: 'h-001',
    statement: 'Agents self-organize around high-revenue tasks',
    status: 'testing',
    observations: 42,
    pValue: 0.12,
    actionReady: false,
  },
  {
    hid: 'h-002',
    statement: 'Pheromone decay rate 5% optimal for trail stability',
    status: 'confirmed',
    observations: 120,
    pValue: 0.003,
    actionReady: true,
  },
  {
    hid: 'h-003',
    statement: 'Three-hop signal chains outperform direct routing',
    status: 'pending',
    observations: 8,
    pValue: 0.85,
    actionReady: false,
  },
  {
    hid: 'h-004',
    statement: 'Alarm pheromone prevents cascading failures',
    status: 'testing',
    observations: 34,
    pValue: 0.24,
    actionReady: false,
  },
]

const FALLBACK_FRONTIERS: Frontier[] = [
  {
    fid: 'f-001',
    type: 'capability',
    description: 'Multi-agent negotiation protocols',
    expectedValue: 0.82,
    status: 'open',
  },
  {
    fid: 'f-002',
    type: 'market',
    description: 'Cross-group service arbitrage',
    expectedValue: 0.71,
    status: 'exploring',
  },
  {
    fid: 'f-003',
    type: 'learning',
    description: 'Emergent task specialization patterns',
    expectedValue: 0.65,
    status: 'open',
  },
  {
    fid: 'f-004',
    type: 'capability',
    description: 'Real-time hypothesis testing via signal analysis',
    expectedValue: 0.58,
    status: 'exploring',
  },
]

const FALLBACK_OBJECTIVES: Objective[] = [
  {
    oid: 'o-001',
    type: 'growth',
    description: 'Reach 100 active agents',
    priority: 0.9,
    progress: 0.35,
    status: 'active',
  },
  {
    oid: 'o-002',
    type: 'revenue',
    description: '10 tokens GDP per cycle',
    priority: 0.85,
    progress: 0.58,
    status: 'active',
  },
  {
    oid: 'o-003',
    type: 'resilience',
    description: 'Zero cascading failures in 1000 signals',
    priority: 0.7,
    progress: 0.82,
    status: 'active',
  },
  {
    oid: 'o-004',
    type: 'learning',
    description: 'Confirm 5 hypotheses',
    priority: 0.6,
    progress: 0.2,
    status: 'active',
  },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function KnowledgePanel() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(FALLBACK_HYPOTHESES)
  const [frontiers, setFrontiers] = useState<Frontier[]>(FALLBACK_FRONTIERS)
  const [objectives, _setObjectives] = useState<Objective[]>(FALLBACK_OBJECTIVES)
  const [newStatement, setNewStatement] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [hData, fRes] = await Promise.all([
        sdk.recall().catch(() => null),
        fetch('/api/frontiers').catch(() => null),
      ])
      if (hData && typeof hData === 'object' && 'hypotheses' in hData) {
        const hs = (hData as { hypotheses?: Hypothesis[] }).hypotheses
        if (hs?.length) setHypotheses(hs)
      }
      if (fRes?.ok) {
        const fData = (await fRes.json()) as { frontiers?: Frontier[] }
        if (fData.frontiers?.length) setFrontiers(fData.frontiers)
      }
    } catch {
      // Fallback data already set
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmitHypothesis = async () => {
    if (!newStatement.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/hypotheses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: newStatement.trim() }),
      })
      if (res.ok) {
        const { hid } = (await res.json()) as any
        setHypotheses((prev) => [
          { hid, statement: newStatement.trim(), status: 'pending', observations: 0, pValue: 1.0, actionReady: false },
          ...prev,
        ])
        setNewStatement('')
      }
    } catch {
      // Silent fail
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Intelligence</h1>
        <p className="text-slate-400">Hypotheses, frontiers, objectives. The colony learns.</p>
      </div>

      {/* Hypotheses */}
      <Section title="Hypotheses" count={hypotheses.length}>
        {/* Add new */}
        <div className="flex gap-2 mb-4">
          <input
            value={newStatement}
            onChange={(e) => setNewStatement(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitHypothesis()}
            placeholder="State a hypothesis..."
            className="flex-1 bg-[#0a0a0f] border border-[#252538] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={handleSubmitHypothesis}
            disabled={submitting || !newStatement.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '...' : 'Add'}
          </button>
        </div>

        {hypotheses.map((h) => (
          <div key={h.hid} className="bg-[#161622] rounded-xl border border-[#252538] p-4 mb-3">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-white flex-1 mr-3">{h.statement}</p>
              <StatusBadge status={h.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
              <span>{h.observations} observations</span>
              <span>p = {h.pValue.toFixed(3)}</span>
              {h.actionReady && <span className="text-emerald-400">action ready</span>}
            </div>
            {/* p-value progress: lower is better, bar fills as p approaches 0 */}
            <div className="h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  h.pValue < 0.05 ? 'bg-emerald-500' : h.pValue < 0.25 ? 'bg-amber-500' : 'bg-slate-600'
                }`}
                style={{ width: `${Math.max(2, (1 - h.pValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </Section>

      {/* Frontiers */}
      <Section title="Frontiers" count={frontiers.length}>
        {frontiers.map((f) => (
          <div key={f.fid} className="bg-[#161622] rounded-xl border border-[#252538] p-4 mb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 mr-3">
                <p className="text-sm text-white">{f.description}</p>
                <span className="text-xs text-slate-500">{f.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={f.status} />
              </div>
            </div>
            {/* Expected value bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${f.expectedValue * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-mono w-10 text-right">{f.expectedValue.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </Section>

      {/* Objectives */}
      <Section title="Objectives" count={objectives.length}>
        {objectives.map((o) => (
          <div key={o.oid} className="bg-[#161622] rounded-xl border border-[#252538] p-4 mb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 mr-3">
                <p className="text-sm text-white">{o.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-slate-500">{o.type}</span>
                  <span className="text-xs text-slate-500">priority {o.priority.toFixed(1)}</span>
                </div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    o.progress >= 0.8 ? 'bg-emerald-500' : o.progress >= 0.5 ? 'bg-indigo-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${o.progress * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-mono w-10 text-right">{Math.round(o.progress * 100)}%</span>
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="px-2 py-0.5 rounded-full text-xs bg-[#252538] text-slate-400">{count}</span>
      </div>
      {children}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  testing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  open: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  exploring: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  active: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  complete: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending
  return <span className={`px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${colors}`}>{status}</span>
}
