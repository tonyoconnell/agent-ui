/**
 * UnitProfile — Display actor info, capabilities, edges, reputation
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
  actor: UnitData
  capabilities: Capability[]
  edges: Edge[]
}

export function UnitProfile({ actor, capabilities, edges }: Props) {
  const kindColors: Record<string, string> = {
    human: 'bg-[hsl(var(--color-primary-bright)/0.15)] text-primary-bright border-[hsl(var(--color-primary-mid)/0.2)]',
    agent:
      'bg-[hsl(var(--color-secondary-bright)/0.15)] text-secondary-bright border-[hsl(var(--color-secondary-mid)/0.2)]',
    llm: 'bg-[hsl(var(--color-gold)/0.15)] text-[hsl(var(--color-gold))] border-[hsl(var(--color-gold)/0.2)]',
    system: 'bg-muted/10 text-muted-foreground border-border',
  }

  const statusColors: Record<string, string> = {
    active:
      'bg-[hsl(var(--color-tertiary-bright)/0.15)] text-tertiary-bright border-[hsl(var(--color-tertiary-mid)/0.2)]',
    proven:
      'bg-[hsl(var(--color-secondary-bright)/0.15)] text-secondary-bright border-[hsl(var(--color-secondary-mid)/0.2)]',
    'at-risk':
      'bg-[hsl(var(--color-destructive)/0.15)] text-[hsl(var(--color-destructive))] border-[hsl(var(--color-destructive)/0.2)]',
  }

  const strengthBar = (strength: number, max = 100) => {
    const pct = Math.min(strength / max, 1) * 100
    return (
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--color-secondary-bright))] to-[hsl(var(--color-secondary-bright)/0.6)] transition-all"
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--color-secondary-bright))] to-[hsl(var(--color-secondary-mid))] text-2xl font-bold text-white">
            {actor.name[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white font-mono">{actor.name}</h1>
              <Badge className={kindColors[actor.unitKind] || kindColors.system}>{actor.unitKind}</Badge>
              <Badge className={statusColors[actor.status] || statusColors.active}>{actor.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground font-mono">{actor.name}.one.ie</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Reputation', value: actor.reputation.toFixed(1), color: 'text-secondary-bright' },
          { label: 'Success Rate', value: `${(actor.successRate * 100).toFixed(0)}%`, color: 'text-tertiary-bright' },
          { label: 'Activity', value: actor.activityScore.toFixed(1), color: 'text-primary-bright' },
          { label: 'Signals', value: actor.sampleCount.toString(), color: 'text-[hsl(var(--color-gold))]' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Wallet */}
      {actor.wallet && (
        <div className="mb-8 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Sui Wallet</div>
              <div className="mt-1 font-mono text-sm text-white truncate max-w-[300px]">{actor.wallet}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Balance</div>
              <div className="mt-1 font-mono text-sm text-tertiary-bright">{actor.balance.toFixed(4)} SUI</div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Capabilities
          {capabilities.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({capabilities.length})</span>
          )}
        </h2>

        {capabilities.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
            No capabilities registered
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((cap, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-white">{cap.taskName}</span>
                  <span className="font-mono text-sm text-tertiary-bright">
                    {cap.price} {cap.currency || 'SUI'}
                  </span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-secondary-bright/10 text-secondary-bright text-[10px] border-secondary-bright/20"
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
          {edges.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({edges.length})</span>}
        </h2>

        {edges.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
            No paths yet
          </div>
        ) : (
          <div className="space-y-2">
            {edges
              .sort((a, b) => b.strength - a.strength)
              .map((edge, i) => (
                <a
                  key={i}
                  href={`/u/${edge.targetName}`}
                  className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-border hover:bg-muted"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-white group-hover:text-[hsl(var(--color-secondary-bright))] transition-colors">
                        {edge.targetName}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                        {edge.targetKind}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{edge.traversals} signals</span>
                      <span className="font-mono text-tertiary-bright">{edge.revenue.toFixed(4)} SUI</span>
                    </div>
                  </div>
                  {strengthBar(edge.strength)}
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>edge strength</span>
                    <span>{edge.strength.toFixed(1)}</span>
                  </div>
                </a>
              ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="mt-12 flex justify-center gap-6 text-sm text-muted-foreground">
        <a href="/discover" className="hover:text-secondary-bright transition-colors">
          Discover
        </a>
        <span>|</span>
        <a href="/build" className="hover:text-secondary-bright transition-colors">
          Build
        </a>
        <span>|</span>
        <a href="/signup" className="hover:text-secondary-bright transition-colors">
          Sign up
        </a>
      </div>
    </div>
  )
}
