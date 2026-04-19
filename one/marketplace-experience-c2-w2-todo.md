---
title: TODO Marketplace Experience — Cycle 2 W2 Decisions
type: artifact
parent: TODO-marketplace-experience.md
wave: W2
cycle: 2
status: ACTIVE
---

# Cycle 2 W2 — Trade lifecycle state machine + pheromone surfacing

## Decisions (8)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | `useTradeLifecycle.ts` is a pure `useReducer` hook — no side-effects inside the reducer | Matches local idiom (`src/hooks/ai/useChat.ts:10-73`); side-effects (signal emission) happen in hook-wrapper callbacks |
| D2 | 10-stage reducer with discriminated `Action` type. Invalid transitions throw | `lifecycle.md:214` locks the order; throwing makes violations loud in dev + captures them in tests |
| D3 | Hook emits `emitClick('ui:marketplace:transition:<toStage>', payload)` on every transition | Reuses single contract; substrate already ingests via `/api/signal` |
| D4 | Extend `/api/marketplace.ts` to fetch `resistance` + `traversals` from TypeDB | `one.tql:56-62` confirms both are path attributes already — purely additive query change |
| D5 | Ship **toxic** + existing **cheapest** badges. **Defer rising/fading** to future cycle | Rising/fading need signal-timestamp aggregation that `/api/marketplace` does not expose and `one.tql` does not store as a path attribute. Ship what's truthy; don't fake pheromone |
| D6 | `isToxic` computed client-side: `resistance >= 10 && resistance > strength * 2 && (resistance+strength) > 5` | Matches CLAUDE.md formula verbatim; engine doesn't enforce it yet, so UI does projection from raw attrs |
| D7 | `ReceiptPanel.tsx` renders on SETTLE/RECEIPT stages, shows receipt id + Sui tx hash (stub `0x00…` this cycle), Dispute button dispatches `DISPUTE` | Tx hash stub because Cycle 3 owns Sui read-side; panel shape stabilizes now |
| D8 | `DisputePanel` is a branch of `ReceiptPanel` (no new file) — same component, conditional render | Avoid file proliferation for a single button + confirmation |

## W3 spawn plan — 6 Sonnet agents, single message

| Agent | File | Type | LOC delta |
|-------|------|------|-----------|
| E1 | `src/components/marketplace/useTradeLifecycle.ts` | NEW | ~120 |
| E2 | `src/components/marketplace/useTradeLifecycle.test.ts` | NEW | ~140 |
| E3 | `src/pages/api/marketplace.ts` | EDIT | +3 TQL fields, +2 response fields |
| E4 | `src/components/Marketplace.tsx` | EDIT | extend Service type, wire hook, toxic badge, integrate ReceiptPanel |
| E5 | `src/components/marketplace/ReceiptPanel.tsx` | NEW | ~100 |
| E6 | `src/components/marketplace/OfferPanel.tsx` | EDIT | `onOffer` now fires real `emitClick` via hook; no local setTimeout stub |

## E1 — `useTradeLifecycle.ts` (NEW)

```tsx
import { useReducer, useCallback } from 'react'
import { emitClick } from '@/lib/ui-signal'

export type TradeStage =
  | 'LIST' | 'DISCOVER' | 'OFFER' | 'ESCROW' | 'EXECUTE'
  | 'VERIFY' | 'SETTLE' | 'RECEIPT' | 'DISPUTE' | 'FADE'

export const STAGES: TradeStage[] = [
  'LIST', 'DISCOVER', 'OFFER', 'ESCROW', 'EXECUTE',
  'VERIFY', 'SETTLE', 'RECEIPT', 'DISPUTE', 'FADE',
]

export interface TradeState {
  stage: TradeStage
  provider: string | null
  task: string | null
  price: number
  receiptId: string | null
  txHash: string | null
}

export type TradeAction =
  | { type: 'DISCOVER'; filter?: string }
  | { type: 'OFFER'; provider: string; task: string; price: number }
  | { type: 'ESCROW'; receiptId: string }
  | { type: 'EXECUTE' }
  | { type: 'VERIFY' }
  | { type: 'SETTLE'; txHash: string }
  | { type: 'RECEIPT' }
  | { type: 'DISPUTE' }
  | { type: 'FADE' }
  | { type: 'RESET' }

const INITIAL: TradeState = {
  stage: 'LIST',
  provider: null,
  task: null,
  price: 0,
  receiptId: null,
  txHash: null,
}

const VALID: Record<TradeStage, TradeAction['type'][]> = {
  LIST:     ['DISCOVER'],
  DISCOVER: ['OFFER', 'DISCOVER'],
  OFFER:    ['ESCROW', 'DISCOVER'],
  ESCROW:   ['EXECUTE', 'DISPUTE'],
  EXECUTE:  ['VERIFY', 'DISPUTE'],
  VERIFY:   ['SETTLE', 'DISPUTE'],
  SETTLE:   ['RECEIPT'],
  RECEIPT:  ['DISPUTE', 'FADE', 'RESET'],
  DISPUTE:  ['FADE', 'RESET'],
  FADE:     ['RESET'],
}

function reducer(state: TradeState, action: TradeAction): TradeState {
  if (action.type === 'RESET') return INITIAL
  const allowed = VALID[state.stage]
  if (!allowed.includes(action.type)) {
    throw new Error(`invalid transition: ${state.stage} → ${action.type}`)
  }
  switch (action.type) {
    case 'DISCOVER': return { ...state, stage: 'DISCOVER' }
    case 'OFFER':    return { ...state, stage: 'OFFER', provider: action.provider, task: action.task, price: action.price }
    case 'ESCROW':   return { ...state, stage: 'ESCROW', receiptId: action.receiptId }
    case 'EXECUTE':  return { ...state, stage: 'EXECUTE' }
    case 'VERIFY':   return { ...state, stage: 'VERIFY' }
    case 'SETTLE':   return { ...state, stage: 'SETTLE', txHash: action.txHash }
    case 'RECEIPT':  return { ...state, stage: 'RECEIPT' }
    case 'DISPUTE':  return { ...state, stage: 'DISPUTE' }
    case 'FADE':     return { ...state, stage: 'FADE' }
  }
}

export function useTradeLifecycle() {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  const emit = useCallback((stage: TradeStage, payload: Record<string, unknown> = {}) => {
    emitClick(`ui:marketplace:transition:${stage.toLowerCase()}`, { tags: ['marketplace', 'transition', stage], ...payload } as never)
  }, [])

  const go = useCallback((action: TradeAction) => {
    dispatch(action)
    if (action.type !== 'RESET') emit(action.type as TradeStage, action as unknown as Record<string, unknown>)
  }, [emit])

  return { state, go, reducer }
}

export { reducer, INITIAL, VALID }
```

## E2 — `useTradeLifecycle.test.ts` (NEW)

```tsx
import { describe, it, expect } from 'vitest'
import { reducer, INITIAL, STAGES } from './useTradeLifecycle'

describe('useTradeLifecycle reducer', () => {
  it('starts at LIST', () => {
    expect(INITIAL.stage).toBe('LIST')
  })

  it('defines all 10 stages', () => {
    expect(STAGES).toHaveLength(10)
  })

  it('LIST → DISCOVER', () => {
    const next = reducer(INITIAL, { type: 'DISCOVER' })
    expect(next.stage).toBe('DISCOVER')
  })

  it('DISCOVER → OFFER captures provider/task/price', () => {
    const d = reducer(INITIAL, { type: 'DISCOVER' })
    const o = reducer(d, { type: 'OFFER', provider: 'oracle', task: 'complete', price: 0.05 })
    expect(o.stage).toBe('OFFER')
    expect(o.provider).toBe('oracle')
    expect(o.price).toBe(0.05)
  })

  it('OFFER → ESCROW captures receiptId', () => {
    const state = { ...INITIAL, stage: 'OFFER' as const }
    const next = reducer(state, { type: 'ESCROW', receiptId: 'receipt_abc' })
    expect(next.stage).toBe('ESCROW')
    expect(next.receiptId).toBe('receipt_abc')
  })

  it('ESCROW → EXECUTE', () => {
    const next = reducer({ ...INITIAL, stage: 'ESCROW' }, { type: 'EXECUTE' })
    expect(next.stage).toBe('EXECUTE')
  })

  it('EXECUTE → VERIFY', () => {
    const next = reducer({ ...INITIAL, stage: 'EXECUTE' }, { type: 'VERIFY' })
    expect(next.stage).toBe('VERIFY')
  })

  it('VERIFY → SETTLE captures txHash', () => {
    const next = reducer({ ...INITIAL, stage: 'VERIFY' }, { type: 'SETTLE', txHash: '0xabc' })
    expect(next.stage).toBe('SETTLE')
    expect(next.txHash).toBe('0xabc')
  })

  it('SETTLE → RECEIPT', () => {
    const next = reducer({ ...INITIAL, stage: 'SETTLE' }, { type: 'RECEIPT' })
    expect(next.stage).toBe('RECEIPT')
  })

  it('ESCROW → DISPUTE is valid', () => {
    const next = reducer({ ...INITIAL, stage: 'ESCROW' }, { type: 'DISPUTE' })
    expect(next.stage).toBe('DISPUTE')
  })

  it('RECEIPT → FADE', () => {
    const next = reducer({ ...INITIAL, stage: 'RECEIPT' }, { type: 'FADE' })
    expect(next.stage).toBe('FADE')
  })

  it('invalid transition throws: LIST → OFFER', () => {
    expect(() => reducer(INITIAL, { type: 'OFFER', provider: 'x', task: 'y', price: 1 })).toThrow(/invalid transition/)
  })

  it('invalid transition throws: SETTLE → OFFER', () => {
    expect(() => reducer({ ...INITIAL, stage: 'SETTLE' }, { type: 'OFFER', provider: 'x', task: 'y', price: 1 })).toThrow(/invalid transition/)
  })

  it('RESET returns to INITIAL from any stage', () => {
    const s = { ...INITIAL, stage: 'DISPUTE' as const, provider: 'x' }
    expect(reducer(s, { type: 'RESET' })).toEqual(INITIAL)
  })
})
```

## E3 — `/api/marketplace.ts` edit (TQL + response)

**Anchor 1** — extend TQL to fetch resistance + traversals:
```
OLD: $e (source: $from, target: $to) isa path,
    has strength $str, has revenue $rev;
NEW: $e (source: $from, target: $to) isa path,
    has strength $str, has revenue $rev, has resistance $res, has traversals $trv;
```

**Anchor 2** — extend select clause:
```
OLD: select $from_id, $to_id, $task, $amt, $str, $rev;
NEW: select $from_id, $to_id, $task, $amt, $str, $rev, $res, $trv;
```

**Anchor 3** — extend aggregation: add `resistance`, `traversals` fields to output (agent reads file and patches aggregate-by-key loop accordingly).

## E4 — `Marketplace.tsx` (EDIT)

**Scope:** extend `Service` interface (+2 fields), remove inline stage state + STAGES+TradeStage (import from hook), import `useTradeLifecycle`, wire `go()` into ServiceCard onSelect + filter buttons + OfferPanel, add `isToxic` + `ToxicBadge`, integrate `ReceiptPanel` render after OfferPanel.

(Full anchors resolved by W3 agent reading the file.)

## E5 — `ReceiptPanel.tsx` (NEW ~100 LOC)

Renders when `stage === 'SETTLE' || stage === 'RECEIPT' || stage === 'DISPUTE'`. Props: `{ state: TradeState, onDispute: () => void, onClose: () => void }`. Shows receipt id (truncated mono), Sui tx hash (truncated mono, placeholder `0x00…` this cycle per D7), Dispute button (if stage !== 'DISPUTE'), Close button. emitClick receivers: `ui:marketplace:dispute`, `ui:marketplace:receipt-close`.

## E6 — `OfferPanel.tsx` (EDIT)

Remove the local `setTimeout` + local `receipt` construction. Panel props gain `onOffer(receipt)` as real callback — the **parent** (Marketplace.tsx) will dispatch `ESCROW` via `go()` on receipt, no in-panel state mutation beyond `submitting`.

## W4 exit checks

- `bun vitest run src/components/marketplace/useTradeLifecycle` → all pass including invalid-transition throws
- `bun biome check .` on touched files → clean
- Toxic badge renders for a service w/ synthetic `resistance=20, strength=5` (fallback data OK)
- `/api/marketplace` response includes `resistance` + `traversals` fields
- No regressions in 948-test suite
- Rubric ≥ 0.65 × 4

---

*W2 complete. 8 decisions, fan-out = 6 W3 agents.*
