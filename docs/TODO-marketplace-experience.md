---
title: TODO Marketplace Experience
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 28
completed: 0
status: ACTIVE
---

# TODO: Marketplace Experience

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning =
> cycles-per-path. (See `.claude/rules/engine.md` → Three Locked Rules.)
>
> **Parallelism directive:** W1 ≥ 5 Haiku (current page + lifecycle.md trade arc
> + /api/marketplace shape + /api/revenue shape + sibling pages index/tasks/world
> for voice). W2 ≥ 2 Opus shards (journey shard vs component-tree shard, fold
> at end). W3 = one Sonnet per file (Marketplace.tsx plus each new panel file
> goes to its own agent — never batch). W4 ≥ 4 Sonnet verifiers (rubric × 4).
>
> **Goal:** Every stage of the trade lifecycle — LIST → DISCOVER → OFFER →
> ESCROW → EXECUTE → VERIFY → SETTLE → RECEIPT → DISPUTE → FADE — is a visible,
> interactive surface on `/marketplace`. The page stops being a catalog and
> becomes the substrate's commerce layer, rendered.
>
> **Source of truth:**
> [lifecycle.md](lifecycle.md) — trade arc (§ Trade Lifecycle — Zooming into SIGNAL),
> [TODO-marketplace.md](TODO-marketplace.md) — schema + SKUs + revenue (backend sibling — do not duplicate),
> [buy-and-sell.md](buy-and-sell.md) — trade mechanics,
> [DSL.md](DSL.md) — signal language (`capability`, `price`, `mark`, `warn`, `ask`),
> [dictionary.md](dictionary.md) — canonical names,
> [rubrics.md](rubrics.md) — fit / form / truth / taste,
> [routing.md](routing.md) — L4 economic loop (how revenue becomes pheromone),
> [ui.md](../.claude/rules/ui.md) — every onClick MUST `emitClick('ui:marketplace:…')`,
> [react.md](../.claude/rules/react.md) — React 19 patterns (Actions, useOptimistic, useTransition).
>
> **Shape:** 3 cycles × 4 waves. Cycle exits at rubric ≥ 0.65 across all four
> dimensions. Non-duplication rule: backend schema changes belong in
> `TODO-marketplace.md`; this TODO owns only the **view + UX surface**.
>
> **Schema:** Tasks map to `world.tql` dim 3b — `task` entity with `task-wave`,
> `task-context` (doc keys: lifecycle, buy-and-sell, rubrics), `blocks`. Each
> deliverable creates a matching `skill` on `unit:marketplace-ui` for routing.

---

## Deliverables

### Wave Deliverables (universal)

| Wave | Deliverable | Goal | Rubric weights (fit/form/truth/taste) | Exit condition |
|------|-------------|------|---------------------------------------|----------------|
| **W1** | Recon reports (5 parallel) | Truth on disk: current `Marketplace.tsx`, `/api/marketplace`, `/api/revenue`, `lifecycle.md` trade arc, sibling page voice | 0.15 / 0.10 / **0.65** / 0.10 | 4/5 agents return `result` with file:line citations |
| **W2** | Journey spec + component tree | Every lifecycle stage → panel, state, data source, empty state, error state, emitClick receiver | **0.40** / 0.15 / **0.35** / 0.10 | Every trade stage has an entry OR an explicit "out of scope this cycle" |
| **W3** | Applied edits (M parallel) | Code changes per spec, named exports, typed props, dark theme tokens, `client:load` on page | 0.30 / 0.25 / **0.35** / 0.10 | All anchors matched; `npm run build` green |
| **W4** | Verification report | Rubric ≥ 0.65 × 4, biome clean, tsc clean, vitest no regressions, dev server renders `/marketplace` with no console errors | 0.25 / 0.15 / **0.45** / 0.15 | `npm run verify` green + manual: all lifecycle stages visible |

### Cycle Deliverables

#### Cycle 1 — WIRE (shell + lifecycle skeleton)

```
DELIVERABLE: Lifecycle-aware Marketplace page
PATH:        src/components/Marketplace.tsx  +  src/pages/marketplace.astro
GOAL:        The existing catalog gains a "lifecycle rail" — a horizontal 10-step
             indicator (LIST → DISCOVER → OFFER → ESCROW → EXECUTE → VERIFY →
             SETTLE → RECEIPT → DISPUTE → FADE) that highlights the user's
             current stage as they interact. No real trade yet — skeleton only.
CONSUMERS:   Humans browsing /marketplace, agents introspecting via /api/state
RUBRIC:      fit=0.35 form=0.25 truth=0.25 taste=0.15
EXIT:        grep 'emitClick("ui:marketplace:' returns ≥ 4 hits; rail renders
             10 stages; clicking a service card sets stage → OFFER
SKILL:       marketplace-ui:browse

DELIVERABLE: OfferPanel (drawer)
PATH:        src/components/marketplace/OfferPanel.tsx (new)
GOAL:        Opens on service-card click. Shows provider, task, price,
             reputation (strength bar), 30-day revenue history, "Offer" button.
             Stub submit emits signal, toast, returns receipt id.
CONSUMERS:   Humans committing to a trade; future escrow flow
RUBRIC:      fit=0.35 form=0.30 truth=0.20 taste=0.15
EXIT:        Drawer opens; form validates; submit emits `ui:marketplace:offer`
             with `{receiver, price}`; happy-path renders "offered" receipt
SKILL:       marketplace-ui:offer
```

#### Cycle 2 — PROVE (real trade loop + pheromone surfacing)

```
DELIVERABLE: Trade lifecycle state machine (client)
PATH:        src/components/marketplace/useTradeLifecycle.ts (new)
GOAL:        React 19 `useReducer`-backed state: LIST→DISCOVER→OFFER→ESCROW→
             EXECUTE→VERIFY→SETTLE→RECEIPT→{DISPUTE|FADE}. Every transition
             emits a signal through `/api/signal` with scope=private, tags
             carrying both `marketplace` and the stage name.
CONSUMERS:   OfferPanel, EscrowBadge, ReceiptPanel, DisputePanel
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        Unit tests (`useTradeLifecycle.test.ts`) cover all 10 transitions;
             invalid transitions throw; L4 economic loop receives `payment`
             signal on SETTLE
SKILL:       marketplace-ui:trade-state

DELIVERABLE: Pheromone overlay on service cards
PATH:        src/components/Marketplace.tsx  (ServiceCard extended)
GOAL:        Reputation bar (already there) plus NEW toxic-edge warning when
             resistance > 2x strength AND (r+s) > 5 (mirrors `isToxic` in
             world.ts). NEW "rising" chevron when 7-day calls > 1.5× 30-day
             average. NEW "fading" marker when calls=0 for > 7 cycles.
CONSUMERS:   Discoverers; the UI IS the routing made visible
RUBRIC:      fit=0.30 form=0.25 truth=0.35 taste=0.10
EXIT:        At least one service shows each of {toxic, rising, fading,
             cheapest} badges; badges derive from /api/marketplace data only
SKILL:       marketplace-ui:pheromone-view

DELIVERABLE: ReceiptPanel
PATH:        src/components/marketplace/ReceiptPanel.tsx (new)
GOAL:        Rendered on SETTLE/RECEIPT. Shows: buyer, provider, task, amount,
             signed receipt id, Sui tx hash (stub this cycle), "Dispute" button
             that transitions state to DISPUTE.
CONSUMERS:   Humans closing a trade; future revenue.md dashboard
RUBRIC:      fit=0.30 form=0.25 truth=0.30 taste=0.15
EXIT:        Renders under a completed offer; Dispute click emits
             `ui:marketplace:dispute`; tx hash formatted as truncated mono
SKILL:       marketplace-ui:receipt
```

#### Cycle 3 — GROW (Sui escrow + learning visibility)

```
DELIVERABLE: Sui escrow integration (read-side first)
PATH:        src/components/marketplace/EscrowBadge.tsx (new)
             src/lib/sui.ts (reuse; no changes unless absolutely needed)
GOAL:        On ESCROW stage, show locked amount + object id (testnet). No
             signing this cycle — read-only display sourced from existing sui.ts
             helpers. Phase 2 wallet work unblocks interactive signing.
CONSUMERS:   Humans watching escrow; /sui skill for future phases
RUBRIC:      fit=0.30 form=0.20 truth=0.40 taste=0.10
EXIT:        EscrowBadge renders for a known testnet object; falls back to
             "pending" when no sui-path-id yet; no runtime error when SUI_SEED
             is absent (dev mode graceful)
SKILL:       marketplace-ui:escrow

DELIVERABLE: Live highways panel (marketplace-scoped)
PATH:        src/components/marketplace/MarketplaceHighways.tsx (new)
GOAL:        Top 10 `provider→buyer` paths by strength across last 7 cycles.
             Pulls `/api/export/highways?tag=marketplace`. Clicking a row
             deep-links the OfferPanel pre-filled with that provider.
CONSUMERS:   Discoverers; proves "revenue is pheromone" visually
RUBRIC:      fit=0.30 form=0.30 truth=0.25 taste=0.15
EXIT:        Panel loads < 10ms from KV (in-process cache hit); empty state
             shown when `<3` marketplace-tagged paths; WS updates strength bars
             via existing useTaskWebSocket pattern
SKILL:       marketplace-ui:highways
```

---

## Routing

```
   Browser         /api/marketplace        /api/revenue         /api/signal
   ───────         ────────────────        ─────────────        ───────────
   ServiceCard ──► list services            pheromone snapshot   emitClick(...)
      │            cheapest/toxic/rising                            │
      ▼                                                              │
   OfferPanel ─► POST /api/signal  { receiver: provider, data: {   │
      │            offer, price, tags:['marketplace','offer'] } }   │
      ▼                                    ┌─ L4 economic loop ──◄──┘
   useTradeLifecycle(reducer)              │  payment signal
      │   state ∈ 10 stages                │  marks path (revenue=strength)
      ▼                                    │
   EscrowBadge  ──◄─ /api/sui/:obj         │
      │                                    │
      ▼                                    │
   ReceiptPanel ─► on SETTLE: signal       │
      │            scope=private, tags=    │
      ▼            ['receipt', provider]  ─┘
   DisputePanel ─► warn(edge, 0.5..1)  — path resistance rises next tick
```

Context accumulates down (stage → stage). Quality marks flow up (each settled
trade marks the `buyer→provider` path by revenue). Feedback from disputes
raises resistance. L3 fade asymmetry (resistance forgives 2× faster) means
single disputes don't kill a provider — repeat disputes do.

---

## Testing — Deterministic Sandwich

### W0 (before every cycle)

```bash
bun run verify         # biome + tsc + vitest
bun astro check        # marketplace.astro has Layout import, no SSR errors
```

Record baseline. `Marketplace.tsx` currently has fallback data — its unit tests
must continue to pass. `marketplace.astro` frontmatter regression (today's
fix) is the canary — if that breaks, stop.

### W4 (after every cycle)

1. `biome check src/components/marketplace src/components/Marketplace.tsx src/pages/marketplace.astro`
2. `tsc --noEmit`
3. `vitest run src/components/marketplace`
4. **New tests:** `useTradeLifecycle.test.ts`, `OfferPanel.test.tsx`, `ReceiptPanel.test.tsx`
5. **Manual:** `bun run dev` → visit `/marketplace` → click a card → offer → settle → receipt. No console errors.
6. **Rubric:** fit ≥ 0.65 (is this the right set of panels?), form ≥ 0.65 (is the code clean?), truth ≥ 0.65 (does the data match /api/*?), taste ≥ 0.65 (does it feel like ONE — sparse, dark, confident?).

---

## How lifecycle.md ties in

`lifecycle.md` defines the trade arc as "the shorter lifecycle that runs *inside*
the SIGNAL stage of the agent career arc." This TODO is the rendering of that
statement. Every UI panel listed above maps 1:1 to a named trade stage:

| Trade stage (lifecycle.md) | Surface (this TODO) | Signal emitted |
|----------------------------|---------------------|----------------|
| LIST | Marketplace grid | (none — read-only) |
| DISCOVER | Filter chips + cheapest/rising badges | `ui:marketplace:filter` |
| OFFER | OfferPanel | `ui:marketplace:offer` → `/api/signal` |
| ESCROW | EscrowBadge | reads sui-path-id |
| EXECUTE | Inline "running…" state on card | receiver emits normally |
| VERIFY | Checkmark transition | result → `mark()` |
| SETTLE | ReceiptPanel render | L4 payment signal |
| RECEIPT | Receipt row in Top Earners table | persistence via /api/signal |
| DISPUTE | DisputePanel | `ui:marketplace:dispute` → `warn()` |
| FADE | Card greys out after 7 cycles idle | L3 fade runs automatically |

The page becomes a live instrument for the trade half of `lifecycle.md`.
Agents see prices and pheromone; humans see the same graph with human affordances.
**One substrate. Two audiences. Same pheromone.**

---

## Task Table (28 tasks across 3 cycles)

| id | cycle | wave | persona | tags | blocks | exit |
|----|-------|------|---------|------|--------|------|
| mx.1.1 | 1 | W1 | haiku | recon,ui | — | Current `Marketplace.tsx` shape captured |
| mx.1.2 | 1 | W1 | haiku | recon,api | — | `/api/marketplace` response shape captured |
| mx.1.3 | 1 | W1 | haiku | recon,api | — | `/api/revenue` response shape captured |
| mx.1.4 | 1 | W1 | haiku | recon,docs | — | lifecycle.md trade arc quoted verbatim |
| mx.1.5 | 1 | W1 | haiku | recon,voice | — | `/tasks` + `/world` pages' design tokens captured |
| mx.1.6 | 1 | W2 | opus | decide,journey | mx.1.* | 10-stage rail spec |
| mx.1.7 | 1 | W2 | opus | decide,tree | mx.1.* | Component-tree spec (files, props, hooks) |
| mx.1.8 | 1 | W3 | sonnet | edit,ui | mx.1.6,mx.1.7 | Rail component landed in Marketplace.tsx |
| mx.1.9 | 1 | W3 | sonnet | edit,ui | mx.1.6,mx.1.7 | OfferPanel.tsx (new file) |
| mx.1.10 | 1 | W3 | sonnet | edit,ui | mx.1.6,mx.1.7 | emitClick wired on service cards |
| mx.1.11 | 1 | W4 | sonnet | verify,rubric | mx.1.8..10 | `npm run verify` green + rubric ≥ 0.65 |
| mx.2.1 | 2 | W1 | haiku | recon,signal | mx.1.11 | /api/signal shape + scope captured |
| mx.2.2 | 2 | W1 | haiku | recon,pheromone | mx.1.11 | world.ts isToxic + strength logic quoted |
| mx.2.3 | 2 | W2 | opus | decide,state | mx.2.1,mx.2.2 | Reducer spec for 10-state machine |
| mx.2.4 | 2 | W3 | sonnet | edit,hook | mx.2.3 | useTradeLifecycle.ts + test |
| mx.2.5 | 2 | W3 | sonnet | edit,ui | mx.2.3 | Toxic/rising/fading badges on ServiceCard |
| mx.2.6 | 2 | W3 | sonnet | edit,ui | mx.2.3 | ReceiptPanel.tsx + test |
| mx.2.7 | 2 | W3 | sonnet | edit,ui | mx.2.3 | DisputePanel wired to `warn()` |
| mx.2.8 | 2 | W4 | sonnet | verify,rubric | mx.2.4..7 | `npm run verify` + rubric ≥ 0.65 |
| mx.3.1 | 3 | W1 | haiku | recon,sui | mx.2.8 | sui.ts helpers + testnet object id path |
| mx.3.2 | 3 | W1 | haiku | recon,highways | mx.2.8 | /api/export/highways schema captured |
| mx.3.3 | 3 | W2 | opus | decide,escrow | mx.3.1 | EscrowBadge spec (read-only this cycle) |
| mx.3.4 | 3 | W2 | opus | decide,highways | mx.3.2 | Highways panel spec |
| mx.3.5 | 3 | W3 | sonnet | edit,ui | mx.3.3 | EscrowBadge.tsx + fallback |
| mx.3.6 | 3 | W3 | sonnet | edit,ui | mx.3.4 | MarketplaceHighways.tsx + WS wiring |
| mx.3.7 | 3 | W3 | sonnet | edit,ui | mx.3.3,mx.3.4 | Wire both into Marketplace.tsx grid |
| mx.3.8 | 3 | W4 | sonnet | verify,rubric | mx.3.5..7 | `npm run verify` + rubric ≥ 0.65 |
| mx.3.9 | 3 | W4 | sonnet | verify,e2e | mx.3.5..7 | Manual trade: list→discover→offer→settle→receipt, no console errors |

Each task row creates a matching TypeDB `skill` under `unit:marketplace-ui`.
On `/close mx.N.M`, path strength accumulates; future `/do` runs prefer the
proven persona × tag combos.

---

## See Also

- [lifecycle.md](lifecycle.md) — the arc this page renders
- [TODO-marketplace.md](TODO-marketplace.md) — backend/SKU sibling (schema, revenue)
- [buy-and-sell.md](buy-and-sell.md) — trade mechanics
- [DSL.md](DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [rubrics.md](rubrics.md) — quality dimensions
- [routing.md](routing.md) — L4 economic loop (revenue = pheromone)
- [TODO-template.md](TODO-template.md) — shape this TODO follows
- [TODO-task-management.md](TODO-task-management.md) — how `/do` advances waves
- [.claude/rules/ui.md](../.claude/rules/ui.md) — `emitClick` contract (non-negotiable)
