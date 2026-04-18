/**
 * DiscoverGrid — Browse agents by capability
 *
 * Buyer-facing surface: flattens markdown agents into (skill, provider) rows,
 * groups by capability. Same data source as /agents (`/api/agents/list`), same
 * shadcn theme tokens. Click "Run →" to expand AgentAd inline.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AgentAd } from '@/components/AgentAd/AgentAd'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { emitClick } from '@/lib/ui-signal'

interface Skill {
  name: string
  price: number
  tags: string[]
}

interface AgentSummary {
  id: string
  name: string
  group: string
  model: string
  tags: string[]
  skills: Skill[]
  channels: string[]
  sensitivity: number
  promptPreview: string
}

interface ListResponse {
  agents: AgentSummary[]
  groups: Record<string, AgentSummary[]>
  tags: string[]
  count: number
}

interface Listing {
  agent: AgentSummary
  skill: Skill
}

const FALLBACK: ListResponse = { agents: [], groups: {}, tags: [], count: 0 }

export function DiscoverGrid() {
  const [data, setData] = useState<ListResponse>(FALLBACK)
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeRun, setActiveRun] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/list', { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const json = (await res.json()) as ListResponse
        if (json.agents?.length) setData(json)
      }
    } catch {
      // Fallback stays empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Flatten: each skill on each agent is a listing
  const listings = useMemo<Listing[]>(() => {
    return data.agents.flatMap((a) => a.skills.map((s) => ({ agent: a, skill: s })))
  }, [data.agents])

  const filtered = useMemo(() => {
    return listings.filter(({ agent, skill }) => {
      if (selectedTags.size > 0) {
        const allTags = [...agent.tags, ...skill.tags]
        if (![...selectedTags].some((t) => allTags.includes(t))) return false
      }
      if (search) {
        const q = search.toLowerCase()
        return (
          skill.name.toLowerCase().includes(q) ||
          agent.name.toLowerCase().includes(q) ||
          agent.group.toLowerCase().includes(q) ||
          skill.tags.some((t) => t.toLowerCase().includes(q)) ||
          agent.tags.some((t) => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [listings, search, selectedTags])

  // Group by skill name (capability)
  const grouped = useMemo(() => {
    const map = new Map<string, Listing[]>()
    for (const l of filtered) {
      const key = l.skill.name || 'uncategorized'
      const list = map.get(key) || []
      list.push(l)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const topTags = useMemo(() => {
    const freq = new Map<string, number>()
    for (const { skill, agent } of listings) {
      for (const t of skill.tags) freq.set(t, (freq.get(t) || 0) + 1)
      for (const t of agent.tags) freq.set(t, (freq.get(t) || 0) + 1)
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)
  }, [listings])

  const toggleTag = (tag: string) => {
    emitClick('ui:discover:filter-tag', { tag })
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">
          {listings.length} capabilities across {data.count} agents. Filter by tag or search.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by capability... translate, classify, analyze"
          className="max-w-md"
        />
      </div>

      {/* Tag pills */}
      {topTags.length > 0 && (
        <div className="flex gap-1.5 mb-8 flex-wrap">
          {topTags.map(([tag, count]) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}>
              <Badge
                variant={selectedTags.has(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {tag}
                <span className="ml-1 opacity-50">{count}</span>
              </Badge>
            </button>
          ))}
          {selectedTags.size > 0 && (
            <button
              type="button"
              onClick={() => {
                emitClick('ui:discover:clear-tags')
                setSelectedTags(new Set())
              }}
            >
              <Badge variant="destructive" className="cursor-pointer">
                clear
              </Badge>
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-muted-foreground mb-4">
        {filtered.length} of {listings.length} capabilities
      </div>

      {/* Grouped by capability */}
      {loading ? (
        <div className="text-muted-foreground text-center py-12">Loading capabilities...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No capabilities match your filters.</p>
          <a href="/build" className="mt-4 inline-block text-sm text-primary hover:underline">
            Build an agent →
          </a>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([capability, rows]) => (
            <div key={capability}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold font-mono">{capability}</h2>
                <span className="text-xs text-muted-foreground font-mono">
                  {rows.length} provider{rows.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows
                  .sort((a, b) => a.skill.price - b.skill.price)
                  .map((listing, i) => (
                    <ListingCard
                      key={`${listing.agent.id}-${listing.skill.name}-${i}`}
                      listing={listing}
                      runKey={`${listing.agent.id}:${listing.skill.name}`}
                      activeRun={activeRun}
                      setActiveRun={setActiveRun}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer links */}
      <div className="mt-16 flex justify-center gap-6 text-sm text-muted-foreground">
        <a href="/agents" className="hover:text-foreground transition-colors">
          All agents
        </a>
        <span>·</span>
        <a href="/build" className="hover:text-foreground transition-colors">
          Build an agent
        </a>
        <span>·</span>
        <a href="/signup" className="hover:text-foreground transition-colors">
          Sign up
        </a>
      </div>
    </div>
  )
}

// ─── Listing Card ──────────────────────────────────────────────────────────

function ListingCard({
  listing,
  runKey,
  activeRun,
  setActiveRun,
}: {
  listing: Listing
  runKey: string
  activeRun: string | null
  setActiveRun: (key: string | null) => void
}) {
  const { agent, skill } = listing
  const modelShort = agent.model.split('/').pop() || agent.model
  const isOpen = activeRun === runKey

  return (
    <div className="flex flex-col gap-2">
      <Card className="h-full transition-all hover:ring-1 hover:ring-primary/40">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-mono truncate">{skill.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                by{' '}
                <a
                  href={`/agents/${agent.id}`}
                  onClick={() => emitClick('ui:discover:select-agent', { id: agent.id })}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {agent.name}
                </a>
                <span className="text-muted-foreground"> · {agent.group}</span>
              </CardDescription>
            </div>
            {skill.price > 0 && (
              <Badge variant="outline" className="font-mono shrink-0">
                {skill.price.toFixed(3)} SUI
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Skill tags */}
          {skill.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {skill.tags.slice(0, 6).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {/* Channels + model */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex gap-1.5">
              {agent.channels.slice(0, 3).map((ch) => (
                <span key={ch} className="font-mono">
                  {ch}
                </span>
              ))}
            </div>
            <span className="font-mono truncate ml-2">{modelShort}</span>
          </div>

          {/* Run button */}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-[10px] text-muted-foreground">
              sensitivity · {agent.sensitivity.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => {
                emitClick('ui:discover:run', { agent: agent.id, skill: skill.name })
                setActiveRun(isOpen ? null : runKey)
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              {isOpen ? 'collapse ↑' : 'Run →'}
            </button>
          </div>
        </CardContent>
      </Card>

      {isOpen && (
        <AgentAd
          agentId={agent.id}
          skill={skill.name}
          price={skill.price}
          headline={`${agent.name} — ${skill.name}`}
        />
      )}
    </div>
  )
}
