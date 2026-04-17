import { Activity, Folder, GitBranch, Lightbulb, Package, Search, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Toaster } from 'sonner'
import inboxData from '@/data/in.json'
import {
  countBy,
  DIMENSION_LABEL,
  DIMENSIONS,
  type Dimension,
  filterInbox,
  type InboxData,
  type Status,
} from '@/data/in-types'
import { useIsMobile } from '@/hooks/use-mobile'
import { emitClick } from '@/lib/ui-signal'
import { EntityCard } from './EntityCard'
import { EntityDetail } from './EntityDetail'
import { Navigation, type NavigationItem } from './Navigation'
import { ProfileHeader } from './ProfileHeader'
import { StatusTabs } from './StatusTabs'

const DATA = inboxData as InboxData

const ICONS: Record<Dimension, NavigationItem['icon']> = {
  groups: Folder,
  actors: User,
  things: Package,
  paths: GitBranch,
  events: Activity,
  learning: Lightbulb,
}

export function Inbox() {
  const isMobile = useIsMobile()

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
    [],
  )

  const entities = useMemo(() => filterInbox(DATA, dimension, status, query), [dimension, status, query])

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = { now: 0, top: 0, todo: 0, done: 0 }
    for (const e of DATA.entities) if (e.dimension === dimension) counts[e.status]++
    return counts
  }, [dimension])

  const selected = entities.find((e) => e.id === selectedId) ?? entities[0] ?? null

  useEffect(() => {
    setSelectedId(null)
  }, [])

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
      <div className="flex h-full flex-col bg-[#0a0a0f]">
        <Toaster position="top-right" theme="dark" />
        {mobileView === 'list' ? (
          <>
            <ProfileHeader name="Anthony O'Connell" initial="A" />
            <StatusTabs active={status} counts={statusCounts} onChange={setStatus} />
            <SearchBar value={query} onChange={setQuery} />
            <div className="flex gap-2 overflow-x-auto border-b border-[#252538] bg-[#0d0d14] px-4 py-3 scrollbar-hide">
              {nav.map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDimension(id)}
                  className={
                    'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
                    (dimension === id
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-[#161622] text-muted-foreground')
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
            <div className="flex h-12 items-center border-b border-[#252538] bg-[#0d0d14] px-4">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="text-sm font-medium text-emerald-400"
              >
                ← Back
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <EntityDetail entity={selected} />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      className="grid h-full bg-[#0a0a0f] text-foreground"
      style={{ gridTemplateColumns: '240px minmax(340px, 1fr) 1.5fr' }}
    >
      <Toaster position="top-right" theme="dark" />

      <aside className="flex flex-col border-r border-[#252538] bg-[#0d0d14]">
        <ProfileHeader name="Anthony O'Connell" initial="A" />
        <Navigation items={nav} active={dimension} onChange={setDimension} />
        <div className="border-t border-[#252538] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{DATA.meta.name}</span>
            <span className="font-mono">v{DATA.meta.version}</span>
          </div>
        </div>
      </aside>

      <section className="flex flex-col border-r border-[#252538]">
        <StatusTabs active={status} counts={statusCounts} onChange={setStatus} />
        <SearchBar value={query} onChange={setQuery} />
        <div className="flex-1 overflow-y-auto p-4">
          <EntityList entities={entities} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
        </div>
      </section>

      <section className="overflow-hidden">
        <EntityDetail entity={selected} />
      </section>
    </div>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="border-b border-[#252538] bg-[#0d0d14] px-5 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            emitClick('ui:in:search', { query: e.target.value })
          }}
          placeholder="Search inbox…"
          className="w-full rounded-lg border border-[#252538] bg-[#0a0a0f] pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
