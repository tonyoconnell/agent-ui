/**
 * AgentList — Filterable agent directory organized by group clusters
 *
 * Fetches all agents via SDK useAgentList hook.
 * Tag pills filter across groups. Click a card → /agents/[id].
 * Uses shadcn Card/Badge from /design system.
 */

import type { AgentSummary, ListAgentsResponse } from '@oneie/sdk'
import { useAgentList } from '@oneie/sdk/react'
import { useMemo, useState } from 'react'
import { SdkProvider } from '@/components/providers/SdkProvider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

const FALLBACK: ListAgentsResponse = { agents: [], groups: {}, tags: [], count: 0 }

// ─── Component ─────────────────────────────────────────────────────────────

export function AgentList({ initialData }: { initialData?: ListAgentsResponse | null }) {
  return (
    <SdkProvider>
      <AgentListInner initialData={initialData} />
    </SdkProvider>
  )
}

function AgentListInner({ initialData }: { initialData?: ListAgentsResponse | null }) {
  const { data: rawData, loading: hookLoading } = useAgentList()
  // Prefer SSR-seeded data on first paint; once the hook resolves, swap to the
  // live value (keeps cache fresh without a visible flash).
  const data = rawData ?? initialData ?? FALLBACK
  const loading = hookLoading && !initialData && !rawData
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return data.agents.filter((a) => {
      if (selectedGroup && a.group !== selectedGroup) return false
      if (selectedTags.size > 0 && ![...selectedTags].some((t) => a.tags.includes(t))) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          a.group.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.promptPreview.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [data.agents, selectedTags, selectedGroup, search])

  const groupedFiltered = useMemo(() => {
    const groups = new Map<string, AgentSummary[]>()
    for (const a of filtered) {
      const list = groups.get(a.group) || []
      list.push(a)
      groups.set(a.group, list)
    }
    return groups
  }, [filtered])

  const topTags = useMemo(() => {
    const freq = new Map<string, number>()
    for (const a of data.agents) {
      for (const t of a.tags) freq.set(t, (freq.get(t) || 0) + 1)
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)
  }, [data.agents])

  const groups = useMemo(() => [...new Set(data.agents.map((a) => a.group))].sort(), [data.agents])

  const toggleTag = (tag: string) => {
    emitClick('ui:agents:filter-tag', { tag })
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agents</h1>
        <p className="text-muted-foreground">
          {data.count} agents across {groups.length} groups. Filter by tag or search.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents by name, group, or tag..."
          className="w-full max-w-md rounded-xl border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Group filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => {
            emitClick('ui:agents:filter-group', { group: null })
            setSelectedGroup(null)
          }}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            selectedGroup === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground border'
          }`}
        >
          All groups
        </button>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              emitClick('ui:agents:filter-group', { group: g })
              setSelectedGroup((prev) => (prev === g ? null : g))
            }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedGroup === g
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border'
            }`}
          >
            {g}
            <span className="ml-1.5 text-xs opacity-60">{data.groups[g]?.length || 0}</span>
          </button>
        ))}
      </div>

      {/* Tag pills */}
      <div className="flex gap-1.5 mb-8 flex-wrap">
        {topTags.map(([tag, count]) => (
          <button key={tag} type="button" onClick={() => toggleTag(tag)}>
            <Badge variant={selectedTags.has(tag) ? 'default' : 'outline'} className="cursor-pointer">
              {tag}
              <span className="ml-1 opacity-50">{count}</span>
            </Badge>
          </button>
        ))}
        {selectedTags.size > 0 && (
          <button type="button" onClick={() => setSelectedTags(new Set())}>
            <Badge variant="destructive" className="cursor-pointer">
              clear
            </Badge>
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground mb-4">
        {filtered.length} of {data.count} agents
      </div>

      {/* Agent groups */}
      {loading ? (
        <div className="text-muted-foreground text-center py-12">Loading agents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground text-center py-12">No agents match your filters.</div>
      ) : (
        <div className="space-y-10">
          {[...groupedFiltered.entries()].map(([group, agents]) => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold">{group}</h2>
                <span className="text-xs text-muted-foreground font-mono">{agents.length} agents</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Agent Card ────────────────────────────────────────────────────────────

// Track which agent ids we've already warmed so hovering over the same card
// repeatedly doesn't fire duplicate network requests. Lives at module scope
// so it survives across card re-renders within the session.
const prefetched = new Set<string>()

function prefetchAgent(id: string) {
  if (prefetched.has(id)) return
  prefetched.add(id)
  // Fire and forget — the response populates the in-process cache on the
  // server side and (via Cache-Control) the browser's HTTP cache. Errors
  // are non-fatal; the click-triggered fetch will retry normally.
  fetch(`/api/agents/detail?id=${encodeURIComponent(id)}`, { priority: 'low' } as RequestInit).catch(() => {
    prefetched.delete(id) // allow retry on next hover
  })
}

function AgentCard({ agent }: { agent: AgentSummary }) {
  const totalPrice = agent.skills.reduce((sum, s) => sum + s.price, 0)
  const modelShort = agent.model.split('/').pop() || agent.model

  return (
    <a
      href={`/agents/${agent.id}`}
      onClick={() => emitClick('ui:agents:select', { id: agent.id })}
      onMouseEnter={() => prefetchAgent(agent.id)}
      onFocus={() => prefetchAgent(agent.id)}
      className="block hover:ring-1 hover:ring-primary/40 rounded-xl transition-all"
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-mono">{agent.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{agent.group}</CardDescription>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {agent.channels.map((ch) => (
                <Badge key={ch} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {ch}
                </Badge>
              ))}
              {totalPrice > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                  {totalPrice.toFixed(3)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Skills */}
          {agent.skills.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {agent.skills.slice(0, 4).map((s) => (
                <Badge key={s.name} variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                  {s.name}
                </Badge>
              ))}
              {agent.skills.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{agent.skills.length - 4}</span>
              )}
            </div>
          )}

          {/* Tags */}
          {agent.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {agent.tags.slice(0, 5).map((t) => (
                <span key={t} className="text-[10px] text-muted-foreground">
                  #{t}
                </span>
              ))}
              {agent.tags.length > 5 && (
                <span className="text-[10px] text-muted-foreground/50">+{agent.tags.length - 5}</span>
              )}
            </div>
          )}

          {/* Preview */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{agent.promptPreview}</p>
        </CardContent>

        <CardFooter className="justify-between text-[10px] text-muted-foreground border-t pt-4">
          <span className="font-mono">{modelShort}</span>
          <span className="text-primary">
            {agent.skills.length} skill{agent.skills.length !== 1 ? 's' : ''}
          </span>
        </CardFooter>
      </Card>
    </a>
  )
}
