/**
 * VIEW AS DROPDOWN — TaskBoard actor-perspective switcher
 *
 * Allows switching the TaskBoard filter context between the 7 ONE world actors.
 * URL-param driven (?as=<actorId>) for shareability + browser-nav compatibility.
 * Emits ui:tasks:view-as on trigger click and item selection.
 *
 * Exports:
 *   ActorId, ActorDef, ACTORS — actor definitions
 *   ViewAsDropdown           — the dropdown component
 *   taskMatchesActor         — filter helper for TaskBoard
 */

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ─── Actor definitions ────────────────────────────────────────────────────────

export type ActorId = 'you' | 'ceo' | 'cmo' | 'cro' | 'cco' | 'cxo' | 'cto'

export interface ActorDef {
  id: ActorId
  uid: string
  label: string
  role: string
  tagDomain: string[]
  avatarColor: string
}

export const ACTORS: readonly ActorDef[] = [
  {
    id: 'you',
    uid: 'one:you',
    label: 'You (chairman)',
    role: 'chairman',
    tagDomain: [],
    avatarColor: '#fbbf24',
  },
  {
    id: 'ceo',
    uid: 'one:ceo',
    label: 'CEO',
    role: 'ceo',
    tagDomain: [],
    avatarColor: '#c084fc',
  },
  {
    id: 'cmo',
    uid: 'one:cmo',
    label: 'CMO — Marketing',
    role: 'director',
    tagDomain: ['marketing', 'content', 'seo', 'social', 'ads', 'brand', 'pitch', 'chat'],
    avatarColor: '#67e8f9',
  },
  {
    id: 'cro',
    uid: 'one:cro',
    label: 'CRO — Sales',
    role: 'director',
    tagDomain: ['sales', 'deal', 'pipeline', 'close', 'lead', 'qualify', 'propose', 'negotiate'],
    avatarColor: '#6ee7b7',
  },
  {
    id: 'cco',
    uid: 'one:cco',
    label: 'CCO — Community',
    role: 'director',
    tagDomain: ['community', 'forum', 'discord', 'ambassador', 'contributor', 'event', 'moderation'],
    avatarColor: '#f472b6',
  },
  {
    id: 'cxo',
    uid: 'one:cxo',
    label: 'CXO — Service',
    role: 'director',
    tagDomain: ['service', 'support', 'onboarding', 'retention', 'refund', 'bug', 'help', 'ticket'],
    avatarColor: '#fb923c',
  },
  {
    id: 'cto',
    uid: 'one:cto',
    label: 'CTO — Engineering',
    role: 'director',
    tagDomain: ['substrate', 'routing', 'schema', 'deploy', 'build', 'test', 'sui', 'typedb', 'engine', 'infra'],
    avatarColor: '#a78bfa',
  },
] as const

// ─── Filter helper ────────────────────────────────────────────────────────────

/**
 * Returns true if a task's tags match the actor's tag domain.
 * Chairman and CEO return true for all tasks (no filter).
 * Directors match tasks whose tags intersect their tagDomain.
 */
export function taskMatchesActor(task: { tags: string[] }, actorId: ActorId): boolean {
  const actor = ACTORS.find((a) => a.id === actorId)
  if (!actor) return true
  if (actor.tagDomain.length === 0) return true
  return task.tags.some((t) => actor.tagDomain.includes(t))
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const roleBadgeClass: Record<string, string> = {
  chairman: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ceo: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  director: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium leading-4',
        roleBadgeClass[role] ?? roleBadgeClass.director,
      )}
    >
      {role}
    </span>
  )
}

// ─── Avatar dot ───────────────────────────────────────────────────────────────

function AvatarDot({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <span
      className={cn('inline-block shrink-0 rounded-full')}
      style={{ width: size, height: size, backgroundColor: color }}
    />
  )
}

// ─── URL helpers (SSR-safe) ───────────────────────────────────────────────────

function readActorFromUrl(): ActorId | null {
  if (typeof window === 'undefined') return null
  const id = new URLSearchParams(window.location.search).get('as') as ActorId | null
  return id && ACTORS.some((a) => a.id === id) ? id : null
}

function writeActorToUrl(id: ActorId): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('as', id)
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  selected: ActorId
  onChange: (id: ActorId) => void
  className?: string
}

export function ViewAsDropdown({ selected, onChange, className }: Props) {
  const [syncedFromUrl, setSyncedFromUrl] = useState(false)

  // Sync from URL on mount (once, client-side only)
  useEffect(() => {
    if (syncedFromUrl) return
    const fromUrl = readActorFromUrl()
    if (fromUrl && fromUrl !== selected) {
      onChange(fromUrl)
    }
    setSyncedFromUrl(true)
  }, [syncedFromUrl, selected, onChange])

  const selectedActor = ACTORS.find((a) => a.id === selected) ?? ACTORS[0]

  const handleTriggerClick = () => {
    emitClick('ui:tasks:view-as', { action: 'open', current: selected })
  }

  const handleSelect = (actor: ActorDef) => {
    if (actor.id === selected) return
    emitClick('ui:tasks:view-as', { from: selected, to: actor.id })
    writeActorToUrl(actor.id)
    onChange(actor.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border border-[#252538]',
            'bg-[#0f0f1a] px-3 py-1.5 text-sm text-slate-300',
            'transition-colors hover:border-[#3b3b5c] hover:bg-[#161625] hover:text-slate-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500',
            className,
          )}
        >
          <AvatarDot color={selectedActor.avatarColor} size={6} />
          <span className="truncate max-w-[180px]">View as: {selectedActor.label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-72 border-[#252538] bg-[#0f0f1a] text-slate-300"
        style={{ maxHeight: 400 }}
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Switch perspective
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#252538]" />

        <DropdownMenuGroup>
          {ACTORS.map((actor) => {
            const isSelected = actor.id === selected
            const previewTags = actor.tagDomain.slice(0, 3)

            return (
              <DropdownMenuItem
                key={actor.id}
                onClick={() => handleSelect(actor)}
                className={cn(
                  'group flex cursor-pointer flex-col items-start gap-0.5 rounded-sm px-3 py-2.5',
                  'focus:bg-[#1e1e32] focus:text-slate-100',
                  isSelected && 'bg-[#1a1a2e] text-slate-100',
                )}
              >
                {/* Row 1: dot + label + role badge + checkmark */}
                <div className="flex w-full items-center gap-2">
                  <AvatarDot color={actor.avatarColor} size={6} />
                  <span className="flex-1 text-sm font-medium">{actor.label}</span>
                  <RoleBadge role={actor.role} />
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                </div>

                {/* Row 2: tag domain preview */}
                {previewTags.length > 0 && (
                  <p className="pl-[14px] text-xs text-slate-500">
                    {previewTags.join(', ')}
                    {actor.tagDomain.length > 3 && (
                      <span className="text-slate-600"> +{actor.tagDomain.length - 3} more</span>
                    )}
                  </p>
                )}
                {previewTags.length === 0 && <p className="pl-[14px] text-xs text-slate-600">all tasks</p>}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~155 lines. Actor-perspective switcher for TaskBoard.
// URL-param driven (?as=actorId). emitClick on trigger + selection.
// Exports: ActorId, ActorDef, ACTORS, ViewAsDropdown, taskMatchesActor
// ═══════════════════════════════════════════════════════════════════════════════
