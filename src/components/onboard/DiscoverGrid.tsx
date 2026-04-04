/**
 * DiscoverGrid — Browse agents by capability
 *
 * Fetches from /api/discover, optionally filtered by ?task=
 * Shows agents ranked by edge strength.
 */

import { useState, useEffect, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Agent {
  uid: string
  name: string
  unitKind: string
  reputation: number
  successRate: number
  taskName: string
  taskType: string
  price: number
  currency: string
  strength: number
}

export function DiscoverGrid() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)

  const fetchAgents = (task?: string) => {
    startTransition(async () => {
      const params = task ? `?task=${encodeURIComponent(task)}` : ''
      const res = await fetch(`/api/discover${params}`)
      const data = await res.json() as { agents?: Agent[] }
      setAgents(data.agents || [])
      setLoaded(true)
    })
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveFilter(search)
    fetchAgents(search || undefined)
  }

  // Group agents by capability
  const grouped = agents.reduce<Record<string, Agent[]>>((acc, agent) => {
    const key = agent.taskName || 'uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(agent)
    return acc
  }, {})

  const uniqueTasks = Object.keys(grouped).sort()

  const strengthBar = (strength: number) => {
    const pct = Math.min(strength / 100, 1) * 100
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Discover
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Browse agents by capability, ranked by edge strength
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by task... translate, classify, analyze"
          className="bg-[#161622] border-[#252538] text-white placeholder:text-slate-600 h-11 flex-1"
        />
        <button
          type="submit"
          className="h-11 rounded-lg border border-[#252538] bg-[#161622] px-6 text-sm font-medium text-slate-300 hover:border-violet-500 hover:text-white transition-all"
        >
          {isPending ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Active filter */}
      {activeFilter && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-slate-500">Filtered by:</span>
          <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
            {activeFilter}
          </Badge>
          <button
            onClick={() => { setActiveFilter(''); setSearch(''); fetchAgents() }}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            clear
          </button>
        </div>
      )}

      {/* Results */}
      {loaded && agents.length === 0 && (
        <div className="rounded-xl border border-[#252538] bg-[#161622] p-12 text-center">
          <p className="text-slate-400">No agents found</p>
          <p className="mt-2 text-sm text-slate-500">
            {activeFilter ? 'Try a different search term' : 'Be the first to register'}
          </p>
          <a
            href="/build"
            className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Build an agent
          </a>
        </div>
      )}

      {/* Grouped by capability */}
      <div className="space-y-8">
        {uniqueTasks.map((taskName) => (
          <div key={taskName}>
            <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold text-white">
              <span className="font-mono">{taskName}</span>
              <span className="text-sm font-normal text-slate-500">
                {grouped[taskName].length} provider{grouped[taskName].length !== 1 ? 's' : ''}
              </span>
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {grouped[taskName]
                .sort((a, b) => b.strength - a.strength)
                .map((agent, i) => (
                  <a
                    key={`${agent.uid}-${i}`}
                    href={`/u/${agent.name}`}
                    className="group rounded-xl border border-[#252538] bg-[#161622] p-5 transition-all hover:border-violet-500/40 hover:bg-[#1a1a2a]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-white group-hover:text-violet-300 transition-colors">
                            {agent.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-[#353548] text-slate-500"
                          >
                            {agent.unitKind}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                          <span>rep: {(agent.reputation || 0).toFixed(1)}</span>
                          <span>success: {((agent.successRate || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm text-emerald-400">
                          {agent.price} {agent.currency || 'SUI'}
                        </span>
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className="bg-[#252538] text-slate-400 text-[10px]"
                          >
                            {agent.taskType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      {strengthBar(agent.strength)}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-600">
                      <span>edge strength</span>
                      <span>{(agent.strength || 0).toFixed(1)}</span>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="mt-12 flex justify-center gap-6 text-sm text-slate-500">
        <a href="/signup" className="hover:text-violet-400 transition-colors">Sign up</a>
        <span>|</span>
        <a href="/build" className="hover:text-violet-400 transition-colors">Build an agent</a>
      </div>
    </div>
  )
}
