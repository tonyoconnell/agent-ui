import type { Node } from '@xyflow/react'
import { useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import type { TqlAction } from './TqlPreview'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  node: Node | null
  mode: 'view' | 'edit'
  groupRole: string | undefined
  onTqlAction: (action: TqlAction) => void
  onClose: () => void
}

interface MemoryRecord {
  actor?: Record<string, unknown>
  highways?: Array<Record<string, unknown>>
  signals?: Array<Record<string, unknown>>
  groups?: Array<Record<string, unknown>>
  capabilities?: Array<Record<string, unknown>>
  hypotheses?: Array<Record<string, unknown>>
  frontier?: Array<Record<string, unknown>>
}

interface FetchState {
  loading: boolean
  error: string | null
  record: MemoryRecord | null
  wallet: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** True when id looks like an actor (contains a colon e.g. "agent:scout") */
function isActorId(id: string): boolean {
  return id.includes(':')
}

/** Shorten a Sui address for display: first 6 + "…" + last 4 chars */
function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Human-readable relative time from an ISO / epoch-ms / Unix-s timestamp */
function relativeTime(ts: unknown): string {
  if (!ts) return '?'
  const raw = typeof ts === 'string' ? Date.parse(ts) : typeof ts === 'number' ? ts : NaN
  if (Number.isNaN(raw)) return '?'
  // If ts looks like Unix seconds (< year 3000 in ms) treat as ms, else s
  const ms = raw < 1e12 ? raw * 1000 : raw
  const diff = Date.now() - ms
  if (diff < 0) return 'just now'
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return `${Math.round(diff / 86_400_000)}d ago`
}

/** Extract a display label from a signal record */
function signalLabel(sig: Record<string, unknown>): string {
  const receiver = sig.receiver ?? sig.to ?? sig.skill ?? ''
  return String(receiver).slice(0, 40) || '—'
}

/** Detect outcome from a signal record */
function signalOutcome(sig: Record<string, unknown>): 'result' | 'timeout' | 'dissolved' | 'failure' {
  if (sig.outcome) return sig.outcome as ReturnType<typeof signalOutcome>
  if (sig.result !== undefined) return 'result'
  if (sig.timeout) return 'timeout'
  if (sig.dissolved) return 'dissolved'
  return 'failure'
}

const OUTCOME_COLOR: Record<string, string> = {
  result: 'text-emerald-400',
  timeout: 'text-amber-400',
  dissolved: 'text-sky-400',
  failure: 'text-red-400',
}

const CAN_MARK_ROLES = new Set(['chairman', 'ceo', 'operator', 'agent'])
const CAN_MINT_ROLES = new Set(['chairman', 'ceo'])

// ─── Component ────────────────────────────────────────────────────────────────

export function InspectorV2({ node, mode, groupRole, onTqlAction, onClose }: Props) {
  const [state, setState] = useState<FetchState>({
    loading: false,
    error: null,
    record: null,
    wallet: null,
  })

  // Fetch memory record + wallet whenever the node changes — SSR-safe (useEffect only)
  useEffect(() => {
    if (!node || !isActorId(node.id)) {
      setState({ loading: false, error: null, record: null, wallet: null })
      return
    }

    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const encoded = encodeURIComponent(node.id)

    Promise.all([
      fetch(`/api/memory/reveal/${encoded}`)
        .then((r) => (r.ok ? (r.json() as Promise<MemoryRecord>) : Promise.reject(new Error(`${r.status}`))))
        .catch((e: unknown) => {
          return { _err: e instanceof Error ? e.message : String(e) }
        }),
      fetch(`/api/identity/${encoded}/address`)
        .then((r) => (r.ok ? (r.json() as Promise<{ address?: string; wallet?: string }>) : Promise.resolve(null)))
        .catch(() => null),
    ]).then(([recordOrErr, walletRes]) => {
      if (cancelled) return
      const isErr = recordOrErr && '_err' in (recordOrErr as object)
      setState({
        loading: false,
        error: isErr ? String((recordOrErr as Record<string, unknown>)._err) : null,
        record: isErr ? null : (recordOrErr as MemoryRecord),
        wallet:
          ((walletRes as Record<string, unknown> | null)?.address as string | null) ??
          ((walletRes as Record<string, unknown> | null)?.wallet as string | null) ??
          null,
      })
    })

    return () => {
      cancelled = true
    }
  }, [node?.id, node])

  if (!node) return null

  const data = (node.data ?? {}) as Record<string, unknown>
  const kind = (data.kind as string | undefined) ?? node.id.split(':')[0] ?? 'unknown'
  const generation = (data.generation as number | undefined) ?? (state.record?.actor?.generation as number | undefined)

  // Attributes from actor record
  const actor = state.record?.actor ?? {}
  const attrName = (actor.name ?? data.label ?? '') as string
  const attrModel = (actor.model ?? data.model ?? '') as string
  const attrSensitivity = (actor.sensitivity ?? data.sensitivity) as number | undefined
  const rawTags: unknown = actor.tags ?? data.tags
  const attrTags: string[] = Array.isArray(rawTags)
    ? (rawTags as unknown[]).map(String)
    : typeof rawTags === 'string'
      ? rawTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []
  const rawPrompt = (actor['system-prompt'] ?? actor.prompt ?? '') as string
  const promptPreview = rawPrompt.trim().slice(0, 120)

  // Outgoing paths: top 5 highways where from === node.id, sorted by strength desc
  const allHighways = (state.record?.highways ?? []) as Array<Record<string, unknown>>
  const outgoing = allHighways
    .filter((h) => String(h.from ?? h.source ?? '') === node.id)
    .sort((a, b) => (Number(b.strength) || 0) - (Number(a.strength) || 0))
    .slice(0, 5)

  // Recent signals: last 5
  const allSignals = (state.record?.signals ?? []) as Array<Record<string, unknown>>
  const recentSignals = [...allSignals]
    .sort((a, b) => {
      const ta = Number(a.ts ?? a.timestamp ?? 0)
      const tb = Number(b.ts ?? b.timestamp ?? 0)
      return tb - ta
    })
    .slice(0, 5)

  // Action permissions
  const editable = mode === 'edit'
  const canMark = editable && CAN_MARK_ROLES.has(groupRole ?? '')
  const canMint = editable && CAN_MINT_ROLES.has(groupRole ?? '')
  const topOutgoing = outgoing[0]
  const markTarget = topOutgoing ? String(topOutgoing.to ?? topOutgoing.target ?? '') : null

  const handleMark = (kind: 'mark' | 'warn') => {
    if (!markTarget) return
    emitClick(`ui:ontology:${kind}`, { node: node.id, to: markTarget })
    onTqlAction({ kind, from: node.id, to: markTarget })
  }

  const handleMintCapability = () => {
    emitClick('ui:ontology:mint-capability', { node: node.id })
    onTqlAction({
      kind: 'mint-capability',
      uid: node.id,
      skillId: `skill:new-${Date.now()}`,
      price: 0.01,
      scope: 'group',
    })
  }

  const handleViewOnSui = () => {
    if (!state.wallet) return
    emitClick('ui:ontology:inspect-onchain', { node: node.id, wallet: state.wallet })
    window.open(`https://suiscan.xyz/testnet/account/${state.wallet}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-[#252538] bg-[#0d0d14] text-slate-200 overflow-y-auto">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#252538] px-3 py-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Inspector</span>
        <button
          type="button"
          onClick={() => {
            emitClick('ui:ontology:inspector-close', { node: node.id })
            onClose()
          }}
          className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-[#161622] hover:text-slate-100"
          aria-label="Close inspector"
        >
          ✕
        </button>
      </header>

      {/* Identity row */}
      <div className="shrink-0 space-y-1.5 px-3 py-3 text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">ID</span>
          <div className="mt-0.5 break-all font-mono text-slate-200">{node.id}</div>
        </div>
        <div className="flex gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">kind</span>
            <div className="mt-0.5 text-slate-300">{kind}</div>
          </div>
          {generation !== undefined && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">gen</span>
              <div className="mt-0.5 text-slate-300">{generation}</div>
            </div>
          )}
        </div>
      </div>

      {/* Attributes */}
      <div className="shrink-0 border-t border-[#252538] px-3 py-3 text-xs">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Attributes</div>

        {state.loading ? (
          <div className="text-slate-500 italic">Loading…</div>
        ) : state.error ? (
          <div className="text-red-400 text-[11px]">Could not load: {state.error}</div>
        ) : !state.record && !attrName ? (
          <div className="text-slate-500 italic text-[11px]">No record yet — this node may have just been created.</div>
        ) : (
          <table className="w-full text-[11px]">
            <tbody>
              {attrName && (
                <tr>
                  <td className="pr-2 py-0.5 text-slate-500 w-24 align-top">name</td>
                  <td className="text-slate-200 break-words">{attrName}</td>
                </tr>
              )}
              {attrModel && (
                <tr>
                  <td className="pr-2 py-0.5 text-slate-500 align-top">model</td>
                  <td className="font-mono text-slate-300 break-all">{attrModel}</td>
                </tr>
              )}
              {attrSensitivity !== undefined && (
                <tr>
                  <td className="pr-2 py-0.5 text-slate-500 align-top">sensitivity</td>
                  <td className="text-slate-300">{attrSensitivity}</td>
                </tr>
              )}
              {promptPreview && (
                <tr>
                  <td className="pr-2 py-0.5 text-slate-500 align-top">prompt</td>
                  <td className="text-slate-400 italic break-words">{promptPreview}…</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {attrTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {attrTags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-[#1a1a2e] px-1.5 py-0.5 text-[10px] text-sky-400 border border-[#252538]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing paths */}
      <div className="shrink-0 border-t border-[#252538] px-3 py-3 text-xs">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Outgoing paths (top 5)</div>
        {state.loading ? (
          <div className="text-slate-500 italic">Loading…</div>
        ) : outgoing.length === 0 ? (
          <div className="text-slate-600 italic">None yet</div>
        ) : (
          <ul className="space-y-1">
            {outgoing.map((h, i) => {
              const to = String(h.to ?? h.target ?? '—')
              const strength = Number(h.strength ?? 0)
              return (
                <li
                  key={i}
                  className="flex items-center justify-between rounded px-1.5 py-1 hover:bg-[#161622] cursor-pointer"
                  onClick={() => {
                    emitClick('ui:ontology:edge-click', { from: node.id, to })
                  }}
                >
                  <span className="font-mono text-slate-300">→ {to}</span>
                  <span className="text-slate-500 ml-2 tabular-nums">str {strength.toFixed(1)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Recent signals */}
      <div className="shrink-0 border-t border-[#252538] px-3 py-3 text-xs">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Recent signals (last 5)</div>
        {state.loading ? (
          <div className="text-slate-500 italic">Loading…</div>
        ) : recentSignals.length === 0 ? (
          <div className="text-slate-600 italic">None yet</div>
        ) : (
          <ul className="space-y-1">
            {recentSignals.map((sig, i) => {
              const outcome = signalOutcome(sig)
              const label = signalLabel(sig)
              const age = relativeTime(sig.ts ?? sig.timestamp)
              return (
                <li key={i} className="flex items-center gap-1.5 text-[11px] leading-snug">
                  <span className="text-slate-500 tabular-nums w-12 shrink-0">{age}</span>
                  <span className={cn('shrink-0', OUTCOME_COLOR[outcome])}>{outcome}</span>
                  <span className="text-slate-400 truncate">{label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* On-chain twin */}
      <div className="shrink-0 border-t border-[#252538] px-3 py-3 text-xs">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">On-chain twin</div>
        {state.wallet ? (
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-300 text-[11px]">{shortenAddress(state.wallet)}</span>
            <button
              type="button"
              onClick={handleViewOnSui}
              className="ml-2 rounded border border-[#252538] bg-[#161622] px-2 py-0.5 text-[10px] text-sky-400 hover:border-sky-500 hover:text-sky-300 transition-colors"
            >
              View on Sui
            </button>
          </div>
        ) : (
          <div className="text-slate-600 italic text-[11px]">{state.loading ? 'Loading…' : 'No on-chain twin yet'}</div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 border-t border-[#252538] px-3 py-3 space-y-1.5">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Actions</div>

        {/* Mark path */}
        <button
          type="button"
          disabled={!canMark || !markTarget}
          onClick={() => canMark && markTarget && handleMark('mark')}
          title={
            !editable
              ? 'Switch to edit mode'
              : !CAN_MARK_ROLES.has(groupRole ?? '')
                ? 'Operator role required'
                : !markTarget
                  ? 'No outgoing path yet'
                  : `Strengthen path to ${markTarget}`
          }
          className={cn(
            'w-full rounded-md border px-2 py-1.5 text-left text-xs transition',
            canMark && markTarget
              ? 'border-[#252538] bg-[#161622] text-slate-100 hover:border-[#3b82f6]'
              : 'cursor-not-allowed border-transparent bg-transparent text-slate-600',
          )}
          aria-disabled={!canMark || !markTarget}
        >
          <div className="font-medium">Mark path</div>
          <div className="text-[10px] text-slate-500">
            {!editable
              ? 'Switch to edit mode'
              : !CAN_MARK_ROLES.has(groupRole ?? '')
                ? 'Operator role required'
                : markTarget
                  ? `Strengthen → ${markTarget}`
                  : 'No outgoing path yet'}
          </div>
        </button>

        {/* Warn path */}
        <button
          type="button"
          disabled={!canMark || !markTarget}
          onClick={() => canMark && markTarget && handleMark('warn')}
          title={
            !editable
              ? 'Switch to edit mode'
              : !CAN_MARK_ROLES.has(groupRole ?? '')
                ? 'Operator role required'
                : !markTarget
                  ? 'No outgoing path yet'
                  : `Add resistance to path to ${markTarget}`
          }
          className={cn(
            'w-full rounded-md border px-2 py-1.5 text-left text-xs transition',
            canMark && markTarget
              ? 'border-[#252538] bg-[#161622] text-slate-100 hover:border-amber-500'
              : 'cursor-not-allowed border-transparent bg-transparent text-slate-600',
          )}
          aria-disabled={!canMark || !markTarget}
        >
          <div className="font-medium">Warn path</div>
          <div className="text-[10px] text-slate-500">
            {!editable
              ? 'Switch to edit mode'
              : !CAN_MARK_ROLES.has(groupRole ?? '')
                ? 'Operator role required'
                : markTarget
                  ? `Add resistance → ${markTarget}`
                  : 'No outgoing path yet'}
          </div>
        </button>

        {/* Mint Capability — chairman/ceo only */}
        <button
          type="button"
          disabled={!canMint}
          onClick={() => canMint && handleMintCapability()}
          title={
            !editable
              ? 'Switch to edit mode'
              : !CAN_MINT_ROLES.has(groupRole ?? '')
                ? 'Chairman role required'
                : 'Grant scoped authority on Sui'
          }
          className={cn(
            'w-full rounded-md border px-2 py-1.5 text-left text-xs transition',
            canMint
              ? 'border-[#252538] bg-[#161622] text-slate-100 hover:border-emerald-500'
              : 'cursor-not-allowed border-transparent bg-transparent text-slate-600',
          )}
          aria-disabled={!canMint}
        >
          <div className="font-medium">Mint Capability</div>
          <div className="text-[10px] text-slate-500">
            {!editable
              ? 'Switch to edit mode'
              : !CAN_MINT_ROLES.has(groupRole ?? '')
                ? 'Chairman role required'
                : 'Grant scoped authority on Sui'}
          </div>
        </button>

        {/* View on Sui — always available if wallet present */}
        <button
          type="button"
          disabled={!state.wallet}
          onClick={() => state.wallet && handleViewOnSui()}
          title={state.wallet ? `Open ${shortenAddress(state.wallet)} in suiscan` : 'No wallet address'}
          className={cn(
            'w-full rounded-md border px-2 py-1.5 text-left text-xs transition',
            state.wallet
              ? 'border-[#252538] bg-[#161622] text-slate-100 hover:border-sky-500'
              : 'cursor-not-allowed border-transparent bg-transparent text-slate-600',
          )}
          aria-disabled={!state.wallet}
        >
          <div className="font-medium">View on Sui</div>
          <div className="text-[10px] text-slate-500">
            {state.wallet ? `Open on suiscan.xyz testnet` : 'No on-chain twin yet'}
          </div>
        </button>
      </div>
    </aside>
  )
}
