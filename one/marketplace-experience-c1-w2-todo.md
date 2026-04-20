---
title: TODO Marketplace Experience — Cycle 1 W2 Decisions
type: artifact
parent: TODO-marketplace-experience.md
wave: W2
cycle: 1
status: ACTIVE
---

# Cycle 1 W2 — Journey spec + component tree

**Shards folded:** S1 (journey rail) + S2 (component tree) reconciled in one pass.
Scope collapsed to **3 files** in W3 (not 10) — `useTradeLifecycle.ts` deferred
to Cycle 2 per TODO "skeleton only" framing.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Stage state lives as `useState<TradeStage>('LIST')` in `Marketplace.tsx` — no reducer, no hook extraction | Cycle 1 is the rail; Cycle 2 extracts `useTradeLifecycle` once transition rules are proven |
| D2 | Rail renders 10 stages as one horizontal div w/ flex + opacity on non-active | One component, one file, zero new exports |
| D3 | 4 `emitClick` receivers: `ui:marketplace:filter`, `ui:marketplace:select`, `ui:marketplace:offer`, `ui:marketplace:offer-close` | Hits the exit-condition `≥ 4 hits` exactly; no dead receivers |
| D4 | `OfferPanel` as absolute-positioned drawer (right-side slide), not shadcn Sheet | Siblings (`/tasks`, `/world`) use zero shadcn imports — match local idiom |
| D5 | `marketplace.astro:7` stays `client:load` — do **not** churn to `client:only="react"` | Drift sits under `taste` (0.15); not worth a W3 edit slot |
| D6 | Submit in OfferPanel stubs — logs receipt id, no real `/api/signal` call | Cycle 2 wires the real signal path; Cycle 1 is the drawer shape |
| D7 | Dark tokens: reuse `bg-[#161622]` card, `border-[#252538]`, `bg-[#0a0a0f]` panel-bg | Match established Marketplace palette, no new tokens |

## Component tree (W3 target)

```
Marketplace.tsx (EDIT)
├─ useState<TradeStage>('LIST')           D1
├─ useState<Service | null>(offerTarget)  D4
├─ <LifecycleRail stage={stage} />        D2 — inline in file
├─ filter buttons  → emitClick('ui:marketplace:filter', {filter})  D3
├─ <ServiceCard onSelect={...} />         → emitClick('ui:marketplace:select', {...})  D3
└─ <OfferPanel service={offerTarget} onClose={...} onOffer={...} />  D4

OfferPanel.tsx (NEW, ~80 LOC)
├─ props: { service, onClose, onOffer }
├─ emitClick('ui:marketplace:offer-close', {}) on close  D3
├─ Submit → emitClick('ui:marketplace:offer', {receiver, price})  D3 + D6
└─ Stub receipt: { id: 'receipt_' + crypto.randomUUID().slice(0,8) }
```

## Diff specs

### E1 — `src/components/Marketplace.tsx`

Six edits (all by anchor, exact match):

**E1.a — add import**
```
ANCHOR: import { useEffect, useState, useCallback } from 'react'
NEW:    import { useEffect, useState, useCallback } from 'react'
        import { emitClick } from '@/lib/ui-signal'
        import { OfferPanel } from './marketplace/OfferPanel'

        type TradeStage = 'LIST' | 'DISCOVER' | 'OFFER' | 'ESCROW' | 'EXECUTE' | 'VERIFY' | 'SETTLE' | 'RECEIPT' | 'DISPUTE' | 'FADE'
        const STAGES: TradeStage[] = ['LIST','DISCOVER','OFFER','ESCROW','EXECUTE','VERIFY','SETTLE','RECEIPT','DISPUTE','FADE']
```

**E1.b — add stage + offerTarget state**
```
ANCHOR: const [loading, setLoading] = useState(true)
NEW:    const [loading, setLoading] = useState(true)
        const [stage, setStage] = useState<TradeStage>('LIST')
        const [offerTarget, setOfferTarget] = useState<Service | null>(null)
```

**E1.c — wire filter emitClick** (exact anchor TBD by edit agent after reading file — filter click handler at ~lines 118–140)
```
INTENT: Each filter button's onClick must call emitClick('ui:marketplace:filter', { filter: <value> }) before setFilter
```

**E1.d — wire ServiceCard select**
```
INTENT: ServiceCard gains onSelect={() => { emitClick('ui:marketplace:select', { provider: service.provider, task: service.task, price: service.price }); setStage('OFFER'); setOfferTarget(service) }}
```

**E1.e — add LifecycleRail component at bottom of file (before default/named export line)**
```
function LifecycleRail({ stage }: { stage: TradeStage }) {
  const idx = STAGES.indexOf(stage)
  return (
    <div className="flex items-center gap-1 mb-6 text-[10px] font-mono tracking-widest" aria-label="trade lifecycle">
      {STAGES.map((s, i) => (
        <span key={s} className={i === idx ? 'text-emerald-400' : i < idx ? 'text-slate-400' : 'text-slate-600'}>
          {s}{i < STAGES.length - 1 ? <span className="mx-1 text-slate-700">→</span> : null}
        </span>
      ))}
    </div>
  )
}
```

**E1.f — render LifecycleRail + OfferPanel in JSX**
```
INTENT: Insert <LifecycleRail stage={stage} /> at top of the rendered grid area
        Insert <OfferPanel service={offerTarget} onClose={() => { setOfferTarget(null); setStage('DISCOVER') }} onOffer={(receipt) => { setStage('ESCROW'); console.info('offered', receipt) }} /> at bottom of main return
```

### E2 — `src/components/marketplace/OfferPanel.tsx` (NEW)

```tsx
import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Service {
  provider: string
  task: string
  price: number
  strength: number
  revenue: number
  calls: number
}

interface Props {
  service: Service | null
  onClose: () => void
  onOffer: (receipt: { id: string; receiver: string; price: number }) => void
}

export function OfferPanel({ service, onClose, onOffer }: Props) {
  const [submitting, setSubmitting] = useState(false)
  if (!service) return null

  const handleClose = () => { emitClick('ui:marketplace:offer-close', {}); onClose() }
  const handleOffer = () => {
    emitClick('ui:marketplace:offer', { receiver: service.provider, price: service.price })
    setSubmitting(true)
    const receipt = { id: `receipt_${crypto.randomUUID().slice(0,8)}`, receiver: service.provider, price: service.price }
    setTimeout(() => { setSubmitting(false); onOffer(receipt) }, 200)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Offer panel">
      <button type="button" className="flex-1 bg-black/60" onClick={handleClose} aria-label="Close" />
      <div className="w-full max-w-md bg-[#161622] border-l border-[#252538] p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-slate-500">OFFER</div>
            <div className="text-lg text-white mt-1">{service.task}</div>
            <div className="text-sm text-slate-400 mt-0.5">{service.provider}</div>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">PRICE</dt>
            <dd className="text-white font-mono mt-0.5">${service.price.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">STRENGTH</dt>
            <dd className="text-white font-mono mt-0.5">{service.strength.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">30-DAY REVENUE</dt>
            <dd className="text-white font-mono mt-0.5">${service.revenue.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono tracking-widest text-slate-500">CALLS</dt>
            <dd className="text-white font-mono mt-0.5">{service.calls}</dd>
          </div>
        </dl>

        <div className="h-px bg-[#252538] my-2" />

        <button
          type="button"
          onClick={handleOffer}
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-sm font-medium"
        >
          {submitting ? 'Offering…' : `Offer $${service.price.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
```

### E3 — no edit this cycle

`marketplace.astro:7` `client:load` stays (D5). `docs/TODO-marketplace-experience.md` Status section already updated in W1.

## W3 spawn plan

2 Sonnet agents, single message:

| Agent | File | LOC delta |
|-------|------|-----------|
| E1 | `src/components/Marketplace.tsx` | ~+35 (rail + state + emitClick on filter & card) |
| E2 | `src/components/marketplace/OfferPanel.tsx` | ~+85 (new file) |

Hard rule to each: "Use Edit/Write tool only. Match anchor exactly. If anchor
doesn't match, read file and report dissolved with the actual text nearby —
do not guess."

## W4 exit checks

- `grep -c "emitClick(\"ui:marketplace:" src/components/Marketplace.tsx src/components/marketplace/OfferPanel.tsx` → ≥ 4
- Rail renders 10 stages (DOM assertion or visual)
- Clicking a ServiceCard sets stage → OFFER (RTL test optional this cycle)
- `bun run verify` green (biome + tsc + vitest on new/touched files)
- Rubric: fit ≥ 0.65, form ≥ 0.65, truth ≥ 0.65, taste ≥ 0.65

---

*W2 complete. 7 decisions, fan-out = 2 W3 agents.*
