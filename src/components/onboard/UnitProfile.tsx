/**
 * UnitProfile — Display unit info, capabilities, edges, reputation
 *
 * Server-fetched data passed as props from the [name].astro page.
 */

import { Badge } from '@/components/ui/badge'

interface Capability {
  taskName: string
  taskType: string
  price: number
  currency: string
}

interface Edge {
  targetName: string
  targetKind: string
  strength: number
  traversals: number
  revenue: number
}

interface UnitData {
  uid: string
  name: string
  unitKind: string
  wallet: string
  status: string
  balance: number
  reputation: number
  successRate: number
  activityScore: number
  sampleCount: number
}

interface Props {
  unit: UnitData
  capabilities: Capability[]
  edges: Edge[]
}

export function UnitProfile({ unit, capabilities, edges }: Props) {
  const kindColors: Record<string, string> = {
    human: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    agent: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    llm: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    system: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    proven: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'at-risk': 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const strengthBar = (strength: number, max = 100) => {
    const pct = Math.min(strength / max, 1) * 100
    return (
      <div className="h-1.5 w-full rounded-full bg-[#252538] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-2xl font-bold text-white">
            {unit.name[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white font-mono">{unit.name}</h1>
              <Badge className={kindColors[unit.unitKind] || kindColors.system}>{unit.unitKind}</Badge>
              <Badge className={statusColors[unit.status] || statusColors.active}>{unit.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500 font-mono">{unit.name}.one.ie</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Reputation', value: unit.reputation.toFixed(1), color: 'text-violet-400' },
          { label: 'Success Rate', value: `${(unit.successRate * 100).toFixed(0)}%`, color: 'text-emerald-400' },
          { label: 'Activity', value: unit.activityScore.toFixed(1), color: 'text-blue-400' },
          { label: 'Signals', value: unit.sampleCount.toString(), color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#252538] bg-[#161622] p-4">
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Wallet */}
      {unit.wallet && (
        <div className="mb-8 rounded-xl border border-[#252538] bg-[#161622] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Sui Wallet</div>
              <div className="mt-1 font-mono text-sm text-white truncate max-w-[300px]">{unit.wallet}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Balance</div>
              <div className="mt-1 font-mono text-sm text-emerald-400">{unit.balance.toFixed(4)} SUI</div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Capabilities
          {capabilities.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-500">({capabilities.length})</span>
          )}
        </h2>

        {capabilities.length === 0 ? (
          <div className="rounded-xl border border-[#252538] bg-[#161622] p-6 text-center text-slate-500 text-sm">
            No capabilities registered
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((cap, i) => (
              <div key={i} className="rounded-xl border border-[#252538] bg-[#161622] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-white">{cap.taskName}</span>
                  <span className="font-mono text-sm text-emerald-400">
                    {cap.price} {cap.currency || 'SUI'}
                  </span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-violet-500/10 text-violet-400 text-[10px] border-violet-500/20"
                  >
                    {cap.taskType}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edge History */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Connections
          {edges.length > 0 && <span className="ml-2 text-sm font-normal text-slate-500">({edges.length})</span>}
        </h2>

        {edges.length === 0 ? (
          <div className="rounded-xl border border-[#252538] bg-[#161622] p-6 text-center text-slate-500 text-sm">
            No connections yet
          </div>
        ) : (
          <div className="space-y-2">
            {edges
              .sort((a, b) => b.strength - a.strength)
              .map((edge, i) => (
                <a
                  key={i}
                  href={`/u/${edge.targetName}`}
                  className="group block rounded-xl border border-[#252538] bg-[#161622] p-4 transition-all hover:border-violet-500/40 hover:bg-[#1a1a2a]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                        {edge.targetName}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-[#353548] text-slate-500">
                        {edge.targetKind}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{edge.traversals} signals</span>
                      <span className="font-mono text-emerald-400">{edge.revenue.toFixed(4)} SUI</span>
                    </div>
                  </div>
                  {strengthBar(edge.strength)}
                  <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                    <span>edge strength</span>
                    <span>{edge.strength.toFixed(1)}</span>
                  </div>
                </a>
              ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="mt-12 flex justify-center gap-6 text-sm text-slate-500">
        <a href="/discover" className="hover:text-violet-400 transition-colors">
          Discover
        </a>
        <span>|</span>
        <a href="/build" className="hover:text-violet-400 transition-colors">
          Build
        </a>
        <span>|</span>
        <a href="/signup" className="hover:text-violet-400 transition-colors">
          Sign up
        </a>
      </div>
    </div>
  )
}
