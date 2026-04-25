import { useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  gid: string
}

interface KpiValues {
  revenue: string
  members: number
  capabilities: number
  hypotheses: number
  topHighway: string
  toxic: number
}

interface KpiState {
  loading: boolean
  kpis: KpiValues
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_KPIS: KpiValues = {
  revenue: '$0.00',
  members: 0,
  capabilities: 0,
  hypotheses: 0,
  topHighway: '—',
  toxic: 0,
}

function formatRevenue(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function isToxic(s: number, r: number): boolean {
  return r >= 10 && r > s * 2 && r + s > 5
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KpiStrip({ gid }: Props) {
  const [state, setState] = useState<KpiState>({ loading: true, kpis: DEFAULT_KPIS })

  // All fetches are inside useEffect — SSR-safe, never run at module top level
  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch('/api/state')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/revenue')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/hypotheses?status=confirmed')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/agents/list')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([stateData, revenueData, hypoData, agentsData]) => {
      if (cancelled) return

      // Revenue — sum path.revenue; fallback to GDP from /api/revenue
      let totalRevenue = 0
      const edges: Array<Record<string, unknown>> = (stateData?.edges ?? []) as Array<Record<string, unknown>>
      if (edges.length > 0) {
        for (const edge of edges) {
          totalRevenue += Number(edge.revenue ?? 0)
        }
      } else if (revenueData?.gdp) {
        totalRevenue = Number(revenueData.gdp) || 0
      }

      // Members — agents whose group prefix matches gid, else total count
      const agents: Array<Record<string, unknown>> = (agentsData?.agents ?? []) as Array<Record<string, unknown>>
      const matchingAgents = agents.filter((a) => {
        const agentGroup = String(a.group ?? '')
        return agentGroup === gid || agentGroup.startsWith(gid + ':')
      })
      const members = matchingAgents.length > 0 ? matchingAgents.length : agents.length

      // Capabilities — distinct skill IDs across all agents
      const allSkillIds = new Set<string>()
      for (const agent of agents) {
        const skills = (agent.skills ?? []) as Array<Record<string, unknown>>
        for (const skill of skills) {
          const name = String(skill.name ?? skill.skillId ?? '')
          if (name) allSkillIds.add(name)
        }
      }
      const capabilities = allSkillIds.size

      // Hypotheses — count from /api/hypotheses?status=confirmed
      const hypoList: unknown[] = hypoData?.hypotheses ?? hypoData?.data ?? (Array.isArray(hypoData) ? hypoData : [])
      const hypotheses = hypoList.length

      // Top highway — strongest edge from state
      const highways: Array<Record<string, unknown>> = (stateData?.highways ?? []) as Array<Record<string, unknown>>
      let topHighway = '—'
      if (highways.length > 0) {
        const top = highways[0]
        const from = String(top.from ?? top.source ?? '')
        const to = String(top.to ?? top.target ?? '')
        const strength = Number(top.strength ?? 0)
        if (from && to) {
          topHighway = `${from} → ${to} (${strength.toFixed(1)})`
        }
      } else if (revenueData?.top_earners?.length) {
        const earner = revenueData.top_earners[0] as Record<string, unknown>
        topHighway = String(earner.uid ?? '—')
      }

      // Toxic — paths where resistance > strength * 2 && resistance >= 10
      let toxic = 0
      for (const edge of edges) {
        const s = Number(edge.strength ?? 0)
        const r = Number(edge.resistance ?? 0)
        if (isToxic(s, r)) toxic++
      }
      // Fallback: check stateData.stats if edges not populated
      if (toxic === 0 && stateData?.stats?.toxic !== undefined) {
        toxic = Number(stateData.stats.toxic) || 0
      }

      setState({
        loading: false,
        kpis: {
          revenue: formatRevenue(totalRevenue),
          members,
          capabilities,
          hypotheses,
          topHighway,
          toxic,
        },
      })
    })

    return () => {
      cancelled = true
    }
  }, [gid])

  const { loading, kpis } = state

  const tiles: Array<{
    key: keyof KpiValues
    label: string
    value: string | number
    wide?: boolean
    danger?: boolean
  }> = [
    { key: 'revenue', label: 'Revenue', value: loading ? '—' : kpis.revenue },
    { key: 'members', label: 'Members', value: loading ? '—' : kpis.members },
    { key: 'capabilities', label: 'Capabilities', value: loading ? '—' : kpis.capabilities },
    { key: 'hypotheses', label: 'Hypotheses', value: loading ? '—' : kpis.hypotheses },
    { key: 'topHighway', label: 'Top highway', value: loading ? '—' : kpis.topHighway, wide: true },
    {
      key: 'toxic',
      label: 'Toxic',
      value: loading ? '—' : kpis.toxic,
      danger: !loading && kpis.toxic > 0,
    },
  ]

  return (
    <div className="flex shrink-0 border-b border-[#252538] bg-[#0d0d14]" role="region" aria-label="World KPIs">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          onClick={() => emitClick('ui:ontology:kpi-click', { kpi: tile.key })}
          className={cn(
            'flex flex-1 flex-col px-3 py-2 text-left',
            'border-r border-[#252538] last:border-r-0',
            'hover:bg-[#161622] transition-colors',
            tile.wide && 'min-w-0',
          )}
        >
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{tile.label}</span>
          <span
            className={cn(
              'mt-0.5 font-mono text-sm text-slate-100',
              tile.wide && 'truncate text-xs',
              tile.danger && 'text-red-400',
            )}
            title={tile.wide ? String(tile.value) : undefined}
          >
            {tile.value}
          </span>
        </button>
      ))}
    </div>
  )
}
