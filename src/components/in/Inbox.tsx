import { Activity, Folder, GitBranch, Lightbulb, Package, Search, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Toaster } from 'sonner'
import {
  countBy,
  DIMENSION_LABEL,
  DIMENSIONS,
  type Dimension,
  filterInbox,
  type InboxData,
  type InboxEntity,
  type Status,
} from '@/data/in-types'
import { useIsMobile } from '@/hooks/use-mobile'
import { emitClick } from '@/lib/ui-signal'
import { EntityCard } from './EntityCard'
import { EntityDetail } from './EntityDetail'
import { Navigation, type NavigationItem } from './Navigation'
import { ProfileHeader } from './ProfileHeader'
import { StatusTabs } from './StatusTabs'

const ICONS: Record<Dimension, NavigationItem['icon']> = {
  groups: Folder,
  actors: User,
  things: Package,
  paths: GitBranch,
  events: Activity,
  learning: Lightbulb,
}

export function Inbox({
  clawUrl = 'https://debby-claw.oneie.workers.dev',
  groupId,
  groups = [],
}: {
  clawUrl?: string
  groupId?: string
  groups?: Array<{ gid: string; name: string; role: string }>
}) {
  const isMobile = useIsMobile()
  const [liveEntities, setLiveEntities] = useState<InboxEntity[]>([])
  const DATA: InboxData = useMemo(
    () => ({ meta: { name: 'ONE Inbox', version: '2.0', generated: Date.now() }, entities: liveEntities }),
    [liveEntities],
  )

  const [dimension, setDimension] = useState<Dimension>('events')
  const [status, setStatus] = useState<Status>('now')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const nav: NavigationItem[] = useMemo(
    () =>
      DIMENSIONS.map((id) => ({
        id,
        icon: ICONS[id],
        label: DIMENSION_LABEL[id],
        count: countBy(DATA, id),
      })),
    [DATA],
  )

  const entities = useMemo(() => filterInbox(DATA, dimension, status, query), [dimension, status, query])

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = { now: 0, top: 0, todo: 0, done: 0 }
    for (const e of DATA.entities) if (e.dimension === dimension) counts[e.status]++
    return counts
  }, [DATA, dimension])

  const selected = entities.find((e) => e.id === selectedId) ?? entities[0] ?? null

  useEffect(() => {
    setSelectedId(null)
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      const [unitsRes, convRes, sessRes] = await Promise.allSettled([
        fetch('/api/export/units'),
        fetch(`${clawUrl}/conversations`),
        fetch(groupId ? `/api/in/sessions?group=${encodeURIComponent(groupId)}` : '/api/in/sessions'),
      ])
      const units =
        unitsRes.status === 'fulfilled' && unitsRes.value.ok
          ? ((await unitsRes.value.json().catch(() => [])) as Array<Record<string, unknown>>)
          : []
      const convData =
        convRes.status === 'fulfilled' && convRes.value.ok
          ? ((await convRes.value.json().catch(() => ({}))) as { conversations?: Array<Record<string, unknown>> })
          : {}
      const sessions =
        sessRes.status === 'fulfilled' && sessRes.value.ok
          ? ((await sessRes.value.json().catch(() => [])) as InboxEntity[])
          : []

      const actorEntities: InboxEntity[] = units.map((u) => ({
        id: `actor:${String(u.uid)}`,
        dimension: 'actors' as const,
        type: 'actor' as const,
        title: String(u.name ?? u.uid),
        subtitle: String(u.uid),
        preview: String(u.model ?? ''),
        timestamp: Date.now(),
        unread: false,
        status: 'now' as const,
        tags: Array.isArray(u.tags) ? (u.tags as string[]) : [],
      }))

      const convEntities: InboxEntity[] = (convData.conversations ?? []).map((c) => ({
        id: `conv:${String(c.group ?? c.id)}`,
        dimension: 'events' as const,
        type: 'conversation' as const,
        title: String(c.group ?? c.id),
        subtitle: `${String(c.messageCount ?? 0)} messages`,
        preview: String(c.lastMessage ?? ''),
        timestamp: c.ts ? new Date(String(c.ts)).getTime() : Date.now(),
        unread: false,
        status: 'now' as const,
        tags: ['claw', 'conversation'],
      }))

      setLiveEntities([...actorEntities, ...convEntities, ...sessions])
    }
    void fetchAll()
    const id = setInterval(() => void fetchAll(), 5000)
    return () => clearInterval(id)
  }, [clawUrl])

  const handleReply = useCallback(
    async (entityId: string, text: string, entityType?: string, entitySessionId?: string) => {
      emitClick('ui:in:send', { entityId, text })
      if (entityType === 'session' && entitySessionId) {
        await fetch('/api/in/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: entitySessionId, sender: 'admin', content: text }),
        }).catch(() => {})
      } else if (entityType === 'conversation') {
        const convId = entityId.replace(/^conv:/, '')
        await fetch(`${clawUrl}/conversations/${encodeURIComponent(convId)}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, sender: 'admin' }),
        }).catch(() => {})
      }
    },
    [clawUrl],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const idx = entities.findIndex((x) => x.id === (selected?.id ?? null))
      if (e.key === 'j' && idx < entities.length - 1) {
        setSelectedId(entities[idx + 1].id)
      } else if (e.key === 'k' && idx > 0) {
        setSelectedId(entities[idx - 1].id)
      } else if (e.key === 'Escape' && isMobile) {
        setMobileView('list')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entities, selected, isMobile])

  if (isMobile) {
    return (
      <div className="flex h-full flex-col bg-background">
        <Toaster position="top-right" theme="dark" />
        {mobileView === 'list' ? (
          <>
            <ProfileHeader name="Anthony O'Connell" initial="A" />
            <StatusTabs active={status} counts={statusCounts} onChange={setStatus} />
            <SearchBar value={query} onChange={setQuery} />
            <div className="flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-3 scrollbar-hide">
              {nav.map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDimension(id)}
                  className={
                    'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
                    (dimension === id
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                      : 'bg-muted text-muted-foreground')
                  }
                >
                  {label}
                  <span className="tabular-nums opacity-60">{count}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <EntityList
                entities={entities}
                selectedId={selected?.id ?? null}
                onSelect={(id) => {
                  setSelectedId(id)
                  setMobileView('detail')
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex h-12 items-center border-b border-border bg-card px-4">
              <button type="button" onClick={() => setMobileView('list')} className="text-sm font-medium text-primary">
                ← Back
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <EntityDetail entity={selected} onReply={handleReply} />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" theme="dark" />
      <div className="grid h-full bg-background text-foreground" style={{ gridTemplateColumns: '20% 30% 50%' }}>
        <aside className="flex flex-col border-r border-border bg-card">
          <ProfileHeader name="Anthony O'Connell" initial="A" />
          {groups.length > 1 && (
            <div className="border-b border-border px-4 py-2">
              <select
                value={groupId ?? groups[0]?.gid ?? ''}
                onChange={(e) => {
                  emitClick('ui:in:switch-group', { groupId: e.target.value })
                  window.location.href = `/in/${e.target.value}`
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {groups.map((g) => (
                  <option key={g.gid} value={g.gid}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Navigation items={nav} active={dimension} onChange={setDimension} />
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{DATA.meta.name}</span>
              <span className="font-mono">v{DATA.meta.version}</span>
            </div>
          </div>
        </aside>

        <section className="flex flex-col border-r border-border">
          <StatusTabs active={status} counts={statusCounts} onChange={setStatus} />
          <SearchBar value={query} onChange={setQuery} />
          <div className="flex-1 overflow-y-auto p-4">
            <EntityList entities={entities} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
          </div>
        </section>

        <BroadcastBar clawUrl={clawUrl} />
        <section className="overflow-hidden">
          <EntityDetail entity={selected} onReply={handleReply} />
        </section>
      </div>
    </>
  )
}

function BroadcastBar({ clawUrl }: { clawUrl: string }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)
  const send = async () => {
    if (!text.trim()) return
    const res = await fetch(`${clawUrl}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), sender: 'admin' }),
    }).catch(() => null)
    if (res?.ok) {
      const data = (await res.json()) as { sent: number; total: number }
      setResult(data)
      setText('')
      emitClick('ui:in:broadcast', { text: text.trim() })
      setTimeout(() => setResult(null), 4000)
    }
  }
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void send()
        }}
        placeholder="Broadcast to all…"
        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="button"
        onClick={() => void send()}
        disabled={!text.trim()}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
      >
        {result ? `Sent ${result.sent}/${result.total}` : 'Broadcast'}
      </button>
    </div>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="border-b border-border bg-card px-5 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            emitClick('ui:in:search', { query: e.target.value })
          }}
          placeholder="Search inbox…"
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  )
}

function EntityList({
  entities,
  selectedId,
  onSelect,
}: {
  entities: ReturnType<typeof filterInbox>
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (entities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="text-3xl opacity-50">📭</div>
          <p className="text-sm font-medium text-muted-foreground">Nothing here yet</p>
          <p className="text-xs text-muted-foreground/70">Try a different status or dimension</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entities.map((entity) => (
        <EntityCard
          key={entity.id}
          entity={entity}
          selected={selectedId === entity.id}
          onClick={() => {
            emitClick('ui:in:select', { entityId: entity.id })
            onSelect(entity.id)
          }}
        />
      ))}
    </div>
  )
}
