import { useEffect, useState } from 'react'

type Usage = {
  tier: string
  calls_this_month: number
  agents_count: number
  api_limit: number
  agent_limit: number
  loops: string[]
  highways_count: number
  upgrade_url: string
}

type Agent = { uid: string; name: string }

export function DevDashboard() {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [authed, setAuthed] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [u, a] = await Promise.all([
          fetch('/api/dashboard/usage', { credentials: 'include' }),
          fetch('/api/dashboard/agents', { credentials: 'include' }),
        ])
        if (cancelled) return
        if (u.status === 401) {
          setAuthed(false)
          return
        }
        const usageJson = (await u.json()) as Usage
        const agentsJson = (await a.json()) as { agents: Agent[] }
        setUsage(usageJson)
        setAgents(agentsJson.agents ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  if (!authed) {
    return (
      <div className="mx-auto max-w-md text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Sign in to see your dashboard</h2>
        <p className="text-muted-foreground text-sm mb-6">
          This dashboard is scoped to your API key — calls you made, agents you own, your tier.
        </p>
        <a
          href="/signup"
          className="inline-block px-6 py-3 bg-[hsl(var(--color-tertiary-bright))] text-black font-semibold rounded-lg hover:opacity-90"
        >
          Sign up or log in →
        </a>
      </div>
    )
  }

  if (loading || !usage) {
    return <div className="mx-auto max-w-md text-center py-20 text-muted-foreground text-sm font-mono">loading…</div>
  }

  const pct = usage.api_limit > 0 ? Math.min(100, (usage.calls_this_month / usage.api_limit) * 100) : 0
  const agentPct = usage.agent_limit > 0 ? Math.min(100, (usage.agents_count / usage.agent_limit) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Tier + usage */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Tier</p>
          <p className="text-3xl font-bold text-[hsl(var(--color-tertiary-bright))] capitalize">{usage.tier}</p>
          <p className="text-xs text-muted-foreground mt-2">Loops enabled: {usage.loops.join(', ')}</p>
          <a href="/platform" className="text-xs text-tertiary-bright hover:underline mt-3 inline-block">
            Compare tiers →
          </a>
        </div>

        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            API calls (this month)
          </p>
          <p className="text-3xl font-bold text-white">
            {usage.calls_this_month.toLocaleString()}
            <span className="text-sm text-muted-foreground font-normal ml-2">/ {usage.api_limit.toLocaleString()}</span>
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${pct > 80 ? 'bg-[hsl(var(--color-gold))]' : 'bg-[hsl(var(--color-tertiary))]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{pct.toFixed(0)}% used</p>
        </div>

        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Agents</p>
          <p className="text-3xl font-bold text-white">
            {usage.agents_count}
            <span className="text-sm text-muted-foreground font-normal ml-2">/ {usage.agent_limit}</span>
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${agentPct > 80 ? 'bg-[hsl(var(--color-gold))]' : 'bg-[hsl(var(--color-tertiary))]'}`}
              style={{ width: `${agentPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{usage.highways_count} hardened highways in your graph</p>
        </div>
      </section>

      {/* Agents */}
      <section className="border border-border rounded-lg bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Your agents</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Actors you've registered. Each has a Sui wallet derived from its UID.
            </p>
          </div>
          <a
            href="/build"
            className="px-4 py-2 bg-[hsl(var(--color-tertiary))] text-black text-sm font-semibold rounded-md hover:bg-[hsl(var(--color-tertiary)/0.9)]"
          >
            + New agent
          </a>
        </div>
        <div className="divide-y divide-zinc-800">
          {agents.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No agents yet.{' '}
              <a href="/build" className="text-[hsl(var(--color-tertiary-bright))] hover:underline">
                Create one
              </a>{' '}
              or{' '}
              <a href="/quickstart" className="text-[hsl(var(--color-tertiary-bright))] hover:underline">
                follow the quickstart
              </a>
              .
            </div>
          ) : (
            agents.map((a) => (
              <a
                key={a.uid}
                href={`/u/${encodeURIComponent(a.uid)}`}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{a.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.uid}</p>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 md:grid-cols-4">
        <a href="/settings/keys" className="border border-border rounded-md p-4 hover:border-border bg-card">
          <p className="text-[hsl(var(--color-tertiary-bright))] text-sm font-semibold mb-1">→ API keys</p>
          <p className="text-xs text-muted-foreground">Rotate, revoke, create new</p>
        </a>
        <a href="/quickstart" className="border border-border rounded-md p-4 hover:border-border bg-card">
          <p className="text-[hsl(var(--color-tertiary-bright))] text-sm font-semibold mb-1">→ Quickstart</p>
          <p className="text-xs text-muted-foreground">Send your first signal</p>
        </a>
        <a href="/market" className="border border-border rounded-md p-4 hover:border-border bg-card">
          <p className="text-[hsl(var(--color-tertiary-bright))] text-sm font-semibold mb-1">→ Marketplace</p>
          <p className="text-xs text-muted-foreground">Discover capabilities</p>
        </a>
        <a href="/platform" className="border border-border rounded-md p-4 hover:border-border bg-card">
          <p className="text-[hsl(var(--color-tertiary-bright))] text-sm font-semibold mb-1">→ Upgrade</p>
          <p className="text-xs text-muted-foreground">More calls, more loops</p>
        </a>
      </section>
    </div>
  )
}
