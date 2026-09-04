/**
 * GroupList — Browse, filter, and create groups.
 *
 * Fetches from GET /api/groups (auth-aware: own + public).
 * Create form POSTs to POST /api/groups.
 * Clicking a card → /{gid} (dynamic group route).
 */

import { Bot, Building2, Globe, Heart, Lock, Plus, Search, Users, X } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { useEffect, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Group {
  gid: string
  name: string
  'group-type': string
  visibility: string
  role: string | null
  memberCount?: number
}

// ─── Group type config ───────────────────────────────────────────────────────

interface TypeConfig {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  color: string
  bg: string
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  team: {
    label: 'Team',
    icon: Users,
    color: 'text-[hsl(var(--color-primary-bright))]',
    bg: 'bg-[hsl(var(--color-primary-bright)/0.1)] border-[hsl(var(--color-primary-bright)/0.2)]',
  },
  community: {
    label: 'Community',
    icon: Globe,
    color: 'text-[hsl(var(--color-tertiary-bright))]',
    bg: 'bg-[hsl(var(--color-tertiary-bright)/0.1)] border-[hsl(var(--color-tertiary-bright)/0.2)]',
  },
  dao: {
    label: 'DAO',
    icon: Users,
    color: 'text-[hsl(var(--color-destructive))]',
    bg: 'bg-[hsl(var(--color-destructive)/0.1)] border-[hsl(var(--color-destructive)/0.2)]',
  },
  org: { label: 'Org', icon: Building2, color: 'text-muted-foreground', bg: 'bg-muted/10 border-border' },
  persona: {
    label: 'Persona',
    icon: Bot,
    color: 'text-[hsl(var(--color-secondary-bright))]',
    bg: 'bg-[hsl(var(--color-secondary-bright)/0.1)] border-[hsl(var(--color-secondary-bright)/0.2)]',
  },
  pod: {
    label: 'Pod',
    icon: Users,
    color: 'text-[hsl(var(--color-gold))]',
    bg: 'bg-[hsl(var(--color-gold)/0.1)] border-[hsl(var(--color-gold)/0.2)]',
  },
  friends: {
    label: 'Friends',
    icon: Heart,
    color: 'text-[hsl(var(--color-destructive)/0.8)]',
    bg: 'bg-[hsl(var(--color-destructive)/0.1)] border-[hsl(var(--color-destructive)/0.2)]',
  },
  personal: { label: 'Personal', icon: Lock, color: 'text-muted-foreground', bg: 'bg-muted/10 border-border' },
  world: {
    label: 'World',
    icon: Globe,
    color: 'text-[hsl(var(--color-primary-mid))]',
    bg: 'bg-[hsl(var(--color-primary-bright)/0.1)] border-[hsl(var(--color-primary-bright)/0.2)]',
  },
}

const FALLBACK_TYPE: TypeConfig = {
  label: 'Group',
  icon: Users,
  color: 'text-muted-foreground',
  bg: 'bg-muted/20 border-border',
}

const ALL_TYPES = Object.keys(TYPE_CONFIG)

// ─── Create form ─────────────────────────────────────────────────────────────

interface CreateFormProps {
  onCreated: (g: Group) => void
  onCancel: () => void
}

function CreateGroupForm({ onCreated, onCancel }: CreateFormProps) {
  const [name, setName] = useState('')
  const [gid, setGid] = useState('')
  const [type, setType] = useState('team')
  const [visibility, setVisibility] = useState('private')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const autoGid = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const submit = () => {
    const resolvedGid = gid.trim() || autoGid
    if (!resolvedGid || !name.trim()) {
      setError('Name is required')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gid: resolvedGid, name: name.trim(), 'group-type': type, visibility }),
        })
        const data = (await res.json()) as { ok?: boolean; error?: string }
        if (!res.ok) {
          setError(data.error ?? 'Failed')
          return
        }
        emitClick('ui:groups:create', { gid: resolvedGid, type, visibility })
        onCreated({ gid: resolvedGid, name: name.trim(), 'group-type': type, visibility, role: 'chairman' })
      } catch {
        setError('Network error')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">New group</h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <Input
            placeholder="e.g. Marketing Pod"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            ID <span className="text-muted-foreground/60">(auto)</span>
          </label>
          <Input
            placeholder={autoGid || 'group-id'}
            value={gid}
            onChange={(e) => setGid(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t]?.label ?? t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending || !name.trim()}>
          {pending ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </div>
  )
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: Group }) {
  const cfg = TYPE_CONFIG[group['group-type']] ?? FALLBACK_TYPE
  const Icon = cfg.icon

  const roleColor =
    group.role === 'chairman'
      ? 'text-[hsl(var(--color-gold))]'
      : group.role === 'board' || group.role === 'ceo'
        ? 'text-[hsl(var(--color-secondary-bright))]'
        : group.role
          ? 'text-[hsl(var(--color-tertiary-bright))]'
          : null

  return (
    <a href={`/${group.gid}`} onClick={() => emitClick('ui:groups:open', { gid: group.gid })} className="block group">
      <Card className="h-full transition-colors hover:border-border/80 hover:bg-muted/30 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg border shrink-0', cfg.bg)}>
              <Icon className={cn('w-4 h-4', cfg.color)} />
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {group.role && roleColor && (
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', roleColor)}>
                  {group.role}
                </Badge>
              )}
              {group.visibility === 'public' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  public
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-sm font-semibold mt-2 group-hover:text-foreground transition-colors">
            {group.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {cfg.label}
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground/60">{group.gid}</span>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GroupListProps {
  initialData?: Group[] | null
}

export function GroupList({ initialData }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>(initialData ?? [])
  const [loading, setLoading] = useState(!initialData)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (initialData) return
    fetch('/api/groups')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Group[]) => {
        setGroups(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [initialData])

  const filtered = groups.filter((g) => {
    // Hide internal ownership groups
    if (g.gid.startsWith('g:owns:')) return false
    if (typeFilter && g['group-type'] !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return g.name.toLowerCase().includes(q) || g.gid.toLowerCase().includes(q)
    }
    return true
  })

  const typeCounts = groups.reduce<Record<string, number>>((acc, g) => {
    if (g.gid.startsWith('g:owns:')) return acc
    acc[g['group-type']] = (acc[g['group-type']] ?? 0) + 1
    return acc
  }, {})

  const activeTypes = ALL_TYPES.filter((t) => typeCounts[t])

  const handleCreated = (g: Group) => {
    setGroups((prev) => [g, ...prev])
    setShowCreate(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono tracking-widest text-[hsl(var(--color-secondary-bright))] uppercase mb-1">
            Groups
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">Your groups</h1>
          <p className="text-sm text-muted-foreground mt-1">Teams, communities, DAOs — organised by group.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            emitClick('ui:groups:new')
            setShowCreate((v) => !v)
          }}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New group
        </Button>
      </div>

      {/* Create form */}
      {showCreate && <CreateGroupForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {/* Search + type filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeTypes.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter(null)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-md border transition-colors',
                !typeFilter
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
              )}
            >
              All ({groups.filter((g) => !g.gid.startsWith('g:owns:')).length})
            </button>
            {activeTypes.map((t) => {
              const cfg = TYPE_CONFIG[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-md border transition-colors',
                    typeFilter === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                  )}
                >
                  {cfg?.label ?? t} ({typeCounts[t]})
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {search || typeFilter ? (
            <p className="text-sm">No groups match your filter.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">No groups yet.</p>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create your first group
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GroupCard key={g.gid} group={g} />
          ))}
        </div>
      )}
    </div>
  )
}
