---
title: TODO Marketplace Experience — Cycle 3 W2 Decisions
type: artifact
parent: TODO-marketplace-experience.md
wave: W2
cycle: 3
status: ACTIVE
---

# Cycle 3 W2 — Sui escrow read + live highways

## Decisions (6)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Add **minimal** read-only `viewEscrow(escrowObjectId)` helper to `src/lib/sui.ts` — no signing, wraps `client.getObject()` | No `getEscrow`/`viewEscrow` exists (R1). This is the smallest possible surface — one function, no seed required |
| D2 | `viewEscrow` returns `{ locked, amount, claimant, deadline } \| null` — null on missing/malformed object | Dev-mode graceful; `EscrowBadge` falls back to "pending" per TODO exit |
| D3 | `EscrowBadge` renders inline on ReceiptPanel when `stage ∈ {ESCROW, EXECUTE, VERIFY}`. No separate fixed-position drawer | Escrow state is a PROPERTY of the active trade, not a separate surface |
| D4 | `MarketplaceHighways` fetches `/api/export/highways?limit=10` — no `?tag=marketplace` parameter added | Endpoint is backend-owned (non-duplication rule). Client filter isn't needed — marketplace paths dominate strength once real trade flows. If filter becomes urgent, raise in sibling TODO |
| D5 | Skip `useTaskWebSocket` integration this cycle; simple `useEffect`-mounted fetch | Hook is message-type-specific (mark/warn/complete); highways panel would need new message type. Exit condition is cache latency, not liveness |
| D6 | Highway row click → `emitClick('ui:marketplace:highway-select', {from,to})` + optional deep-link stub (console.info) | Real deep-link into OfferPanel requires lifting state; keep thin and ship the signal |

## W3 spawn plan — 4 Sonnet agents, single message

| Agent | File | Type | LOC delta |
|-------|------|------|-----------|
| E1 | `src/lib/sui.ts` | EDIT | +30 (viewEscrow helper) |
| E2 | `src/components/marketplace/EscrowBadge.tsx` | NEW | ~80 |
| E3 | `src/components/marketplace/MarketplaceHighways.tsx` | NEW | ~120 |
| E4 | `src/components/Marketplace.tsx` + `ReceiptPanel.tsx` | EDIT | +10 each (wiring) |

## E1 — `sui.ts` helper addition

Append at end of file (before last newline if present):

```ts
// ─── Read-only escrow view (no signing) ────────────────────────────────────

export interface EscrowView {
  locked: boolean
  amount: number
  claimant: string | null
  deadline: number
}

/**
 * Read an Escrow Move object by id. Does not sign — works without SUI_SEED.
 * Returns null if the object is missing, malformed, or not an Escrow.
 */
export async function viewEscrow(escrowObjectId: string): Promise<EscrowView | null> {
  try {
    const res = await client.getObject({ id: escrowObjectId, options: { showContent: true } })
    const content = res?.data?.content
    if (!content || content.dataType !== 'moveObject') return null
    const fields = (content as { fields?: Record<string, unknown> }).fields
    if (!fields) return null
    return {
      locked: Boolean(fields.locked ?? true),
      amount: Number(fields.amount ?? 0),
      claimant: typeof fields.claimant === 'string' ? fields.claimant : null,
      deadline: Number(fields.deadline ?? 0),
    }
  } catch {
    return null
  }
}
```

## E2 — `EscrowBadge.tsx`

```tsx
import { useEffect, useState } from 'react'
import { viewEscrow, type EscrowView } from '@/lib/sui'

interface Props {
  escrowObjectId: string | null
}

export function EscrowBadge({ escrowObjectId }: Props) {
  const [view, setView] = useState<EscrowView | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!escrowObjectId) return
    let cancelled = false
    setLoading(true)
    viewEscrow(escrowObjectId)
      .then((v) => { if (!cancelled) setView(v) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [escrowObjectId])

  if (!escrowObjectId) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>pending</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>loading…</span>
      </div>
    )
  }

  if (!view) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs">
        <span className="font-mono tracking-widest">ESCROW</span>
        <span>not found</span>
      </div>
    )
  }

  const truncated = `${escrowObjectId.slice(0, 6)}…${escrowObjectId.slice(-4)}`

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
      <span className="font-mono tracking-widest">ESCROW</span>
      <span className="font-mono">{view.amount}</span>
      <span className="text-indigo-500">·</span>
      <span className="font-mono text-indigo-400/80">{truncated}</span>
      {view.locked ? <span className="text-emerald-400">locked</span> : <span className="text-slate-400">open</span>}
    </div>
  )
}
```

## E3 — `MarketplaceHighways.tsx`

```tsx
import { useCallback, useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Highway {
  from: string
  to: string
  strength: number
  resistance: number
  revenue?: number
  traversals?: number
  successRate?: number
}

export function MarketplaceHighways() {
  const [highways, setHighways] = useState<Highway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHighways = useCallback(async () => {
    try {
      const res = await fetch('/api/export/highways?limit=10')
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = (await res.json()) as Highway[]
      setHighways(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchHighways() }, [fetchHighways])

  const handleRowClick = (h: Highway) => {
    emitClick('ui:marketplace:highway-select', { from: h.from, to: h.to })
  }

  if (loading) return <div className="text-slate-500 text-sm py-4">Loading highways…</div>
  if (error) return <div className="text-slate-500 text-sm py-4">Highways unavailable — {error}</div>
  if (highways.length < 3) {
    return (
      <div className="text-slate-500 text-sm py-6 border border-[#252538] rounded-xl bg-[#161622]/40 text-center">
        Not enough proven paths yet. Trade volume will reveal highways.
      </div>
    )
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Highways</h2>
      <div className="bg-[#161622] rounded-xl border border-[#252538] overflow-hidden">
        {highways.map((h, i) => {
          const strengthPct = Math.min(100, (h.strength / 100) * 100)
          return (
            <button
              key={`${h.from}→${h.to}`}
              type="button"
              onClick={() => handleRowClick(h)}
              className="w-full flex items-center gap-3 px-5 py-3 border-b border-[#252538] last:border-b-0 hover:bg-[#1a1a28] text-left transition-colors"
            >
              <span className="text-slate-500 text-xs font-mono w-6">#{i + 1}</span>
              <span className="font-mono text-sm text-white truncate flex-1">
                {h.from} <span className="text-slate-600">→</span> {h.to}
              </span>
              <div className="w-24 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              <span className="font-mono text-xs text-emerald-400/70 w-20 text-right">
                {h.strength.toFixed(1)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

## E4 — wiring edits

**`Marketplace.tsx`**: add `import { MarketplaceHighways } from './marketplace/MarketplaceHighways'` and render `<MarketplaceHighways />` after the Top Earners block.

**`ReceiptPanel.tsx`**: add `import { EscrowBadge } from './EscrowBadge'` and render `<EscrowBadge escrowObjectId={state.receiptId} />` in the grid above the existing tx hash row, only visible when `state.stage ∈ {ESCROW, EXECUTE, VERIFY, SETTLE, RECEIPT}`. Simpler: always render; EscrowBadge handles null-id gracefully.

## W4 exit checks

- `viewEscrow('invalid')` returns null — no unhandled rejection
- `EscrowBadge` renders `pending` when id is null; renders `not found` when id is invalid (tested by dev server)
- `MarketplaceHighways` empty state visible when `/api/export/highways` returns `[]`
- `bun biome check` clean on touched files
- `bun vitest run` green (no regressions)
- Rubric ≥ 0.65 × 4

---

*W2 complete. 6 decisions, fan-out = 4 W3 agents.*
