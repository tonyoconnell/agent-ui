import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

export type TqlAction =
  | { kind: 'mark'; from: string; to: string; strength?: number }
  | { kind: 'warn'; from: string; to: string; weight?: number }
  | { kind: 'add-unit'; uid: string; name: string; actorType: 'agent' | 'human' }
  | { kind: 'rename-group'; gid: string; oldName: string; newName: string }
  | { kind: 'set-sensitivity'; gid: string; sensitivity: number }
  | { kind: 'set-fade-rate'; gid: string; fadeRate: number }
  | { kind: 'set-toxicity-threshold'; gid: string; threshold: number }
  | { kind: 'mint-capability'; uid: string; skillId: string; price: number; scope: 'group' | 'public' }
  | { kind: 'set-price'; tid: string; price: number }
  | { kind: 'add-tag'; uid: string; tag: string }
  | { kind: 'invite-member'; gid: string; uid: string; role: string }

interface TqlRendered {
  tql: string
  summary: string
  endpoint: string
  method: 'POST' | 'PATCH'
  body: unknown
}

interface Props {
  open: boolean
  action: TqlAction | null
  onApplied?: (action: TqlAction) => void
  onClose: () => void
}

// ─── TQL Renderer ────────────────────────────────────────────────────────────

export function renderTql(action: TqlAction): TqlRendered {
  switch (action.kind) {
    case 'mark': {
      const s = action.strength ?? 1
      return {
        summary: `Strengthen path from ${action.from} to ${action.to} by ${s}`,
        tql: `match $a isa actor, has aid "${action.from}"; $b isa actor, has aid "${action.to}"; $p (source: $a, target: $b) isa path; insert $p has strength += ${s};`,
        endpoint: '/api/mark',
        method: 'POST',
        body: { from: action.from, to: action.to, strength: s },
      }
    }
    case 'warn': {
      const w = action.weight ?? 1
      return {
        summary: `Add resistance to path from ${action.from} to ${action.to} by ${w}`,
        tql: `match $a isa actor, has aid "${action.from}"; $b isa actor, has aid "${action.to}"; $p (source: $a, target: $b) isa path; insert $p has resistance += ${w};`,
        endpoint: '/api/warn',
        method: 'POST',
        body: { from: action.from, to: action.to, weight: w },
      }
    }
    case 'add-unit': {
      return {
        summary: `Register unit ${action.name} as ${action.actorType}`,
        tql: `insert $u isa actor, has aid "${action.uid}", has name "${action.name}", has actor-type "${action.actorType}", has generation 1;`,
        endpoint: '/api/agents/register',
        method: 'POST',
        body: { uid: action.uid, kind: action.actorType },
      }
    }
    case 'rename-group': {
      return {
        summary: `Rename group ${action.gid}: '${action.oldName}' → '${action.newName}'`,
        tql: `match $g isa group, has gid "${action.gid}", has name $oldn; delete $g has $oldn; insert $g has name "${action.newName}";`,
        endpoint: `/api/groups/${action.gid}`,
        method: 'PATCH',
        body: { name: action.newName },
      }
    }
    case 'set-sensitivity': {
      return {
        summary: `Set sensitivity of group ${action.gid} to ${action.sensitivity}`,
        tql: `match $g isa group, has gid "${action.gid}", has sensitivity $old; delete $g has $old; insert $g has sensitivity ${action.sensitivity};`,
        endpoint: `/api/groups/${action.gid}`,
        method: 'PATCH',
        body: { sensitivity: action.sensitivity },
      }
    }
    case 'set-fade-rate': {
      return {
        summary: `Set fade rate of group ${action.gid} to ${action.fadeRate}`,
        tql: `match $g isa group, has gid "${action.gid}", has fade-rate $old; delete $g has $old; insert $g has fade-rate ${action.fadeRate};`,
        endpoint: `/api/groups/${action.gid}`,
        method: 'PATCH',
        body: { fadeRate: action.fadeRate },
      }
    }
    case 'set-toxicity-threshold': {
      return {
        summary: `Set toxicity threshold of group ${action.gid} to ${action.threshold}`,
        tql: `match $g isa group, has gid "${action.gid}", has toxicity-threshold $old; delete $g has $old; insert $g has toxicity-threshold ${action.threshold};`,
        endpoint: `/api/groups/${action.gid}`,
        method: 'PATCH',
        body: { toxicityThreshold: action.threshold },
      }
    }
    case 'mint-capability': {
      return {
        summary: `Mint capability ${action.skillId} on ${action.uid} priced ${action.price} in scope ${action.scope}`,
        tql: `match $u isa actor, has aid "${action.uid}"; insert $s isa thing, has tid "${action.skillId}", has thing-type "skill", has price ${action.price}; (provider: $u, offered: $s) isa capability, has price ${action.price};`,
        endpoint: '/api/capabilities/publish',
        method: 'POST',
        body: { skillId: action.skillId, price: action.price, opts: { scope: action.scope } },
      }
    }
    case 'set-price': {
      return {
        summary: `Set price of ${action.tid} to ${action.price}`,
        tql: `match $t isa thing, has tid "${action.tid}", has price $old; delete $t has $old; insert $t has price ${action.price};`,
        endpoint: `/api/skills/${action.tid}/price`,
        method: 'PATCH',
        body: { price: action.price },
      }
    }
    case 'add-tag': {
      return {
        summary: `Tag ${action.uid} with '${action.tag}'`,
        tql: `match $u isa actor, has aid "${action.uid}"; insert $u has tag "${action.tag}";`,
        endpoint: `/api/agents/${action.uid}/tags`,
        method: 'POST',
        body: { tag: action.tag },
      }
    }
    case 'invite-member': {
      return {
        summary: `Invite ${action.uid} to ${action.gid} as ${action.role}`,
        tql: `match $g isa group, has gid "${action.gid}"; $u isa actor, has aid "${action.uid}"; insert (group: $g, member: $u) isa membership, has member-role "${action.role}";`,
        endpoint: `/api/groups/${action.gid}/invite`,
        method: 'POST',
        body: { uid: action.uid, role: action.role },
      }
    }
    default: {
      // Exhaustiveness check
      const _never: never = action
      throw new Error(`Unhandled TqlAction kind: ${(_never as TqlAction).kind}`)
    }
  }
}

// ─── Syntax Highlighter ──────────────────────────────────────────────────────

export function highlightTql(tql: string): React.ReactNode {
  // We tokenize by splitting at keyword, string, and number boundaries in order.
  // Strategy: build a list of segments with their types, then render spans.
  type Segment = { text: string; type: 'keyword' | 'string' | 'number' | 'plain' }
  const segments: Segment[] = []

  // Collect all matches with their positions
  type Match = { start: number; end: number; type: 'keyword' | 'string' | 'number' }
  const matches: Match[] = []

  // Strings first (highest priority — keywords inside strings should not highlight)
  let m: RegExpExecArray | null
  const strRegex = /"([^"\\]|\\.)*"/g
  while ((m = strRegex.exec(tql)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'string' })
  }

  // Keywords — only outside string ranges
  const kwRegex = /\b(match|insert|delete|has|isa|select|sort|limit)\b/g
  while ((m = kwRegex.exec(tql)) !== null) {
    const inString = matches.some((s) => s.type === 'string' && m !== null && m.index >= s.start && m.index < s.end)
    if (!inString) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: 'keyword' })
    }
  }

  // Numbers — only outside string and keyword ranges
  const numRegex = /(?<!["\w])\b\d+(\.\d+)?\b(?!["\w])/g
  while ((m = numRegex.exec(tql)) !== null) {
    const covered = matches.some((s) => m !== null && m.index >= s.start && m.index < s.end)
    if (!covered) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: 'number' })
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start)

  // Build segments
  let cursor = 0
  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ text: tql.slice(cursor, match.start), type: 'plain' })
    }
    segments.push({ text: tql.slice(match.start, match.end), type: match.type })
    cursor = match.end
  }
  if (cursor < tql.length) {
    segments.push({ text: tql.slice(cursor), type: 'plain' })
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'keyword') {
          return (
            <span key={i} className="text-sky-400">
              {seg.text}
            </span>
          )
        }
        if (seg.type === 'string') {
          return (
            <span key={i} className="text-emerald-400">
              {seg.text}
            </span>
          )
        }
        if (seg.type === 'number') {
          return (
            <span key={i} className="text-amber-400">
              {seg.text}
            </span>
          )
        }
        return <span key={i}>{seg.text}</span>
      })}
    </>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TqlPreview({ open, action, onApplied, onClose }: Props) {
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!action) return null

  const rendered = renderTql(action)

  const handleApply = async () => {
    emitClick('ui:ontology:tql-apply', { kind: action.kind })
    setApplying(true)
    setError(null)
    try {
      const res = await fetch(rendered.endpoint, {
        method: rendered.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(rendered.body),
      })
      if (res.ok) {
        onApplied?.(action)
        onClose()
      } else {
        setError(`Failed: ${res.status} ${res.statusText}`)
      }
    } catch (err) {
      setError(`Failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setApplying(false)
    }
  }

  const handleCancel = () => {
    emitClick('ui:ontology:tql-cancel')
    setError(null)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="TQL Preview"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 h-[50vh]',
          'flex flex-col',
          'bg-[#0d0d14] border-t border-[#252538]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#252538] shrink-0">
          <span className="text-sm font-semibold text-slate-200 tracking-wide">TQL Preview</span>
          <button
            type="button"
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Summary */}
          <p className="text-sm text-slate-300 leading-relaxed">{rendered.summary}</p>

          {/* TQL block */}
          <pre className="font-mono text-xs leading-relaxed bg-[#0a0a10] border border-[#1e1e30] rounded-md px-4 py-3 overflow-x-auto text-slate-200 whitespace-pre-wrap break-words">
            {highlightTql(rendered.tql)}
          </pre>

          {/* Endpoint */}
          <p className="text-xs text-slate-500">
            Endpoint:{' '}
            <span className="text-sky-400 font-mono">
              {rendered.method} {rendered.endpoint}
            </span>
          </p>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 font-mono" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#252538] shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-medium rounded-md border border-[#252538] text-slate-300 hover:bg-[#1a1a2e] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className={cn(
              'px-4 py-2 text-xs font-medium rounded-md transition-colors',
              'bg-sky-600 hover:bg-sky-500 text-white',
              applying && 'opacity-50 cursor-not-allowed',
            )}
          >
            {applying ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </>
  )
}
