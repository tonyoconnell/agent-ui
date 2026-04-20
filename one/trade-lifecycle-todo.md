---
title: TODO Trade Lifecycle — LIST → DISCOVER → OFFER → ESCROW → EXECUTE → VERIFY → SETTLE → RECEIPT → DISPUTE → FADE
type: roadmap
version: 1.0.0
priority: Seller-First → Multi-Currency → Prove → Grow → Harden
total_tasks: 50
completed: 0
status: ACTIVE
syncs_with: TODO-lifecycle.md, TODO-marketplace.md, TODO-SUI.md
---

# TODO: Trade Lifecycle (every closed buy/sell loop)

> **Time units:** tasks → waves → cycles. Never days. Width = tasks-per-wave,
> depth = waves-per-cycle, learning = cycles-per-path. Rule 1: every signal
> closes its loop. Rule 3: every loop reports deterministic numbers.
> (See `.claude/rules/engine.md`.)
>
> **Goal:** The 10-stage trade lifecycle from [lifecycle.md § Trade Lifecycle](one/lifecycle.md#trade-lifecycle-zooming-into-signal)
> ships end-to-end. **Any unit can sell in any currency to any buyer paying in any currency.**
> First successful trade happens without the seller holding SUI. Rubric-gated VERIFY.
> Escrow-backed first-trade trust. Atomic SETTLE across three ledgers.
>
> **Source of truth:**
> - [lifecycle.md](one/lifecycle.md) — the 10-stage trade table + nesting diagram (primary)
> - [buy-and-sell.md](buy-and-sell.md) — the four-step mechanics + code pointers
> - [marketplace.md](marketplace.md) — SKUs, pricing modes, revenue flywheel
> - [SUI.md](SUI.md) — Move guarantees for ESCROW and SETTLE
> - [rubrics.md](rubrics.md) — quality scoring for VERIFY (fit/form/truth/taste)
> - [DSL.md](one/DSL.md) — signal language (`data.weight`)
> - [dictionary.md](dictionary.md) — canonical names (capability, path.revenue, skill)
> - [ADL-integration.md](ADL-integration.md) — PRE-gate shape for OFFER
>
> **Shape:** 5 cycles, four waves each. Each cycle ships 1-3 of the 10 stages plus its tests + rubrics + strategy pieces. Haiku reads, Opus decides, Sonnet writes, Sonnet verifies. Same loop as the substrate.
>
> **Schema:** Tasks map to `world.tql` dim 3b. New entity `settlement` (child of `signal`) with `currency` attribute. New relation `escrow` (shared, holds `Balance<T>`). Rubric edges via `markDims()` carry `fit/form/truth/taste` weights.

---

## The North Star: Seller-First, Currency-Agnostic

Everything in this TODO serves two strategic goals that compound.

### Goal A — Seller-first acquisition

A seller can list a skill, complete their first trade, and withdraw to their preferred chain **without ever touching SUI**. This inverts the normal Web3 onboarding trap: "install wallet → buy gas → only then you can participate." Our seller onboards by typing one markdown file.

```
Traditional Web3 marketplace              ONE marketplace (this TODO)
──────────────────────────────              ──────────────────────────
1. Install wallet                         1. Write agent markdown (one file)
2. Fund with native token                 2. `/sync agents` → listed
3. Sign listing tx (gas)                  3. First buyer pays in USDC/SUI/ETH/etc
4. Wait for first buyer                   4. You receive USDC (or your choice)
5. Settle in chain's native token         5. Platform eats the swap complexity
6. Manually bridge to real currency       6. You never see SUI
```

**Why seller-first?** The marketplace flywheel is gated by supply, not demand. With 1000 capabilities listed, buyers find reasons to show up. With 1000 buyers and no sellers, the platform is dead. Make listing frictionless, buying trivial, settlement invisible.

### Goal B — Accept every currency, pay in any currency

The `Coin<T>` generic in Move plus a simple on-chain oracle plus Sui DEX routing gives us **currency neutrality within Sui**. Seller lists at 0.02 USDC equivalent. Buyer pays 0.020001 USDT. Settlement swaps atomically via Cetus/Turbos DEX pools on Sui. Seller receives their preferred Sui-native `Coin<T>`.

```
Supported Day 1    SUI, USDC (Sui), USDT (Sui) — native Coin<T>
Supported Day 30   Any Coin<T> on Sui with a liquid Cetus/Turbos pool + oracle feed
Cross-chain        Handed off via `oneie launch` (agent-launch's lane).
                   Explicitly out of scope per docs/launch-handoff.md:
                   Wormhole bridging, ERC-20, BSC, FIAT onramps, EVM chains.
```

The accounting layer (`path.revenue`) stores a **normalized USDC value** — pheromone and reputation are currency-neutral. Revenue compounds identically whether the buyer paid SUI or USDT. The substrate doesn't care what color the money is; it only cares that `weight > 0` and the loop closed.

**"We accept every currency, and you can too"** — each agent on the platform inherits multi-currency capability the moment it lists. No seller-side integration work. The Escrow struct is generic over `T: Coin`, the Settle function auto-swaps on the fly.

---

## The 10 Stages (mapped to cycles)

| # | Stage | Cycle | New primitive | Multi-currency touch |
|---|-------|-------|---------------|----------------------|
| 1 | LIST | C1 | `capability` w/ `currency` attr | Seller lists in any `Coin<T>` |
| 2 | DISCOVER | C1 | `cheapest_provider($skill, $buyer_currency)` normalized via oracle | Buyer queries in their currency |
| 3 | OFFER | C2 | `signal({weight, currency})` + PRE gates | Currency mismatch → auto-route via swap quote |
| 4 | ESCROW | C2 | `Escrow<T>` generic Move struct | Locks any `Coin<T>` with deadline |
| 5 | EXECUTE | C3 | handler runs (substrate unchanged) | — (substrate is currency-neutral here) |
| 6 | VERIFY | C3 | `markDims(fit,form,truth,taste)` against rubric | — (quality is currency-neutral) |
| 7 | SETTLE | C4 | atomic: swap + pay + mark + fee | DEX swap in same tx as pay |
| 8 | RECEIPT | C4 | tx digest + `settlement` entity write | Normalized USDC + raw coin both recorded |
| 9 | DISPUTE | C5 | `warn(1)` + escrow refund | Refund in original currency, no swap loss |
| 10 | FADE | C5 | L3 decay (existing) | Rep decays currency-neutrally |

---

## Cycles

### Cycle 1 — LIST & DISCOVER (the seller-first wedge)

**Ships:** A seller can list a capability priced in any supported `Coin<T>`. A buyer can discover and rank providers whose prices have been normalized to the buyer's preferred currency via oracle.

**Deliverables:**
```
DELIVERABLE: capability.currency attribute
PATH:        src/schema/world.tql (dim 3)
GOAL:        Every capability carries its listing currency; default "USDC"
CONSUMERS:   agent-md.ts parser, cheapest_provider fn, UI
RUBRIC:      fit=0.35 form=0.15 truth=0.40 taste=0.10
EXIT:        grep 'owns currency' src/schema/world.tql && test round-trip
SKILL:       schema:capability-currency

DELIVERABLE: cheapest_provider w/ oracle normalization
PATH:        src/schema/world.tql + src/lib/oracle.ts
GOAL:        Return lowest-price seller normalized to buyer's currency
CONSUMERS:   persist.discover(), marketplace UI, /api/discover
RUBRIC:      fit=0.30 form=0.15 truth=0.45 taste=0.10
EXIT:        test: 3 sellers in USDC/SUI/USDT, buyer queries USDC, ranking correct
SKILL:       discovery:oracle-normalized

DELIVERABLE: seller-first onboarding doc
PATH:        docs/seller-first.md
GOAL:        Markdown-only path from "I have a skill" to "I earned $X"
CONSUMERS:   new sellers landing on /market
RUBRIC:      fit=0.40 form=0.25 truth=0.20 taste=0.15
EXIT:        doc describes: markdown → sync → list → first trade → withdraw
SKILL:       docs:seller-onboarding
```

**Tasks:**
| id | task | wave | exit | blocks |
|----|------|------|------|--------|
| c1.t1 | Add `currency` attribute to capability schema (default "USDC") | W3 | schema compiles, round-trip insert/read | c1.t2, c1.t4 |
| c1.t2 | Extend `agent-md.ts` to parse `currency:` field per skill | W3 | markdown → TQL carries currency | c2.t3 |
| c1.t3 | Add `src/lib/oracle.ts` with Pyth/Switchboard price feed adapter | W3 | `getPrice("USDC", "SUI")` returns live rate | c1.t4, c2.t5 |
| c1.t4 | Rewrite `cheapest_provider` as fn accepting `buyer_currency`, normalizing via oracle | W3 | test: 3-way price bake-off | c2.t5 |
| c1.t5 | `src/pages/api/discover.ts` endpoint: `GET /api/discover?skill=X&currency=USDC` | W3 | curl returns JSON ranked list | c2.t2 |
| c1.t6 | Test: `listing-currency.test.ts` — 6 assertions (parse, insert, query, oracle hit, ranking, cache) | W3 | 6/6 pass, <100ms total | — |
| c1.t7 | Test: `oracle.test.ts` — mock Pyth, verify normalization math and staleness rejection | W3 | 8/8 pass | — |
| c1.t8 | Write `docs/seller-first.md` — the full markdown-to-earnings path | W3 | doc covers all 5 steps, cross-links landing | — |
| c1.t9 | W4 rubric-score C1 deliverables + emit feedback signal | W4 | rubricAvg ≥ 0.65 across all deliverables | — |

---

### Cycle 2 — OFFER & ESCROW (the trust primitive)

**Ships:** Buyer posts an OFFER in any currency; PRE-gates enforce lifecycle/network/toxicity; for first-trade or high-value, system auto-creates `Escrow<T>` with configurable deadline. Currency mismatch triggers a swap quote at offer time.

**Deliverables:**
```
DELIVERABLE: Escrow<T> Move struct + lock/release/refund fns
PATH:        src/move/one/sources/escrow.move
GOAL:        Generic escrow holding any Coin<T> with deadline auto-refund
CONSUMERS:   SETTLE path (C4), DISPUTE path (C5)
RUBRIC:      fit=0.25 form=0.15 truth=0.50 taste=0.10
EXIT:        sui move test: lock, release (happy path), deadline-refund, double-release-reject
SKILL:       sui:escrow-generic

DELIVERABLE: Currency-aware OFFER PRE-gate
PATH:        src/engine/persist.ts (signal pre-check)
GOAL:        Quote swap rate at offer time; reject if slippage > threshold
CONSUMERS:   every buyer signal with data.weight > 0
RUBRIC:      fit=0.40 form=0.15 truth=0.35 taste=0.10
EXIT:        test: seller in USDT, buyer pays SUI, 5% slippage cap enforced
SKILL:       trade:offer-gate

DELIVERABLE: First-trade escrow auto-trigger
PATH:        src/engine/persist.ts + src/lib/sui.ts
GOAL:        If path.strength < threshold OR value > $100, auto-create Escrow
CONSUMERS:   buyers with untrusted sellers, high-value trades
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        test: new buyer-seller pair routes through escrow; 5th trade bypasses
SKILL:       trade:escrow-bootstrap
```

**Tasks:**
| id | task | wave | exit | blocks |
|----|------|------|------|--------|
| c2.t1 | Write `src/move/one/sources/escrow.move` — generic Escrow<T>, 4 entry fns | W3 | `sui move build` clean, 4 unit tests green | c2.t3, c4.t1 |
| c2.t2 | Add `Escrow` lifecycle test in Move: lock → release, lock → deadline → refund | W3 | 2 Move tests pass | c4.t2 |
| c2.t3 | TS client wrappers in `src/lib/sui.ts`: `lockEscrow`, `releaseEscrow`, `refundEscrow` | W3 | each fn signs + submits + returns digest | c2.t4, c5.t1 |
| c2.t4 | OFFER PRE-gate: currency quote via oracle, reject on slippage > configurable cap (default 5%) | W3 | test: 3 slippage scenarios | c2.t5 |
| c2.t5 | Auto-escrow trigger in `persist.ts.ask()` — branch on `path.strength < 5 \|\| weight > $100` | W3 | test: untrusted path routes through escrow, trusted bypasses | c3.t1 |
| c2.t6 | Test: `escrow.test.ts` — 10 assertions (happy, deadline, double-release, wrong-currency, zero-amount, etc.) | W3 | 10/10 pass on testnet | — |
| c2.t7 | Test: `offer-gate.test.ts` — PRE-gate matrix (lifecycle retired, network blocked, toxic path, currency mismatch, slippage cap) — 12 cases | W3 | 12/12 pass | — |
| c2.t8 | Doc: `docs/escrow.md` — when escrow fires, deadline semantics, dispute path preview | W3 | doc cross-links SUI.md + DISPUTE cycle | — |
| c2.t9 | W4 rubric-score C2 deliverables | W4 | rubricAvg ≥ 0.65 | — |

---

### Cycle 3 — EXECUTE & VERIFY (rubric-gated payment)

**Ships:** Seller's handler runs; its output is scored against the rubric declared at OFFER time. VERIFY is where bounties differ from commodity trades — commodity trades auto-pass VERIFY on `{result}`; bounty trades require rubric ≥ threshold to release escrow.

**Deliverables:**
```
DELIVERABLE: Rubric-gated VERIFY phase
PATH:        src/engine/verify.ts (new file)
GOAL:        Score seller's output against buyer's declared rubric; gate SETTLE
CONSUMERS:   persist.ask() post-handler, escrow release logic
RUBRIC:      fit=0.35 form=0.15 truth=0.40 taste=0.10
EXIT:        test: 4 rubric dims scored, weighted, threshold enforced
SKILL:       trade:verify-rubric

DELIVERABLE: Bounty-mode signals (rubric at offer time)
PATH:        src/engine/persist.ts (signal contract)
GOAL:        data.rubric = {fit,form,truth,taste, threshold} carried end-to-end
CONSUMERS:   bounty buyers, outcome-priced trades
RUBRIC:      fit=0.40 form=0.15 truth=0.35 taste=0.10
EXIT:        test: bounty with rubric flows through 10 stages, gates correctly
SKILL:       trade:bounty-mode

DELIVERABLE: Rubric scorer adapters (auto + LLM-judge + human-in-loop)
PATH:        src/engine/rubric-scorers/*.ts
GOAL:        Three strategies: deterministic (regex/assertion), LLM-judge, human
CONSUMERS:   VERIFY phase, different SKU types use different scorers
RUBRIC:      fit=0.35 form=0.20 truth=0.35 taste=0.10
EXIT:        3 scorer files, each with ≥ 3 tests
SKILL:       trade:rubric-adapters
```

**Tasks:**
| id | task | wave | exit | blocks |
|----|------|------|------|--------|
| c3.t1 | Create `src/engine/verify.ts` — signature `verify(output, rubric) → {fit,form,truth,taste,pass}` | W3 | type-safe, pure function | c3.t2, c3.t4 |
| c3.t2 | Extend Signal `data.rubric` convention in [DSL.md](one/DSL.md); update rubrics.md if missing | W3 | docs + types agree | c3.t3 |
| c3.t3 | Implement 3 scorer adapters: deterministic, llm-judge (via OpenRouter), human (via Telegram/human.ts) | W3 | each has ≥ 3 tests | c3.t4 |
| c3.t4 | Wire VERIFY into `persist.ts.ask()` — after handler, before SETTLE | W3 | test: failing rubric → no SETTLE, warn(1), escrow pending | c4.t1 |
| c3.t5 | Test: `verify.test.ts` — 16 assertions (4 dims × pass/fail × 2 strategies) | W3 | 16/16 pass, each <50ms | — |
| c3.t6 | Test: `bounty-e2e.test.ts` — full trade lifecycle for a bounty with rubric ≥ 0.7 | W3 | 1 test, asserts all 10 stage transitions | — |
| c3.t7 | Test: `verify-adversarial.test.ts` — seller returns plausible-looking garbage; rubric catches it | W3 | llm-judge flags it, deterministic passes (demonstrates why both matter) | — |
| c3.t8 | Doc: update `docs/rubrics.md` with VERIFY integration + scorer selection guide | W3 | rubrics.md lists the 3 adapters | — |
| c3.t9 | W4 rubric-score C3 | W4 | rubricAvg ≥ 0.65 | — |

---

### Cycle 4 — SETTLE & RECEIPT (atomic across three ledgers)

**Ships:** On VERIFY pass, SETTLE fires one atomic transaction that: swaps buyer's currency to seller's currency via DEX, transfers to seller, marks the Path object, takes the 2% protocol fee, and mirrors back to TypeDB. RECEIPT emits the tx digest + normalized USDC revenue number.

**Deliverables:**
```
DELIVERABLE: Atomic SETTLE with DEX swap
PATH:        src/move/one/sources/substrate.move (extend pay fn)
GOAL:        pay() accepts Coin<A>, swaps to Coin<B>, transfers, marks path, takes fee — all one tx
CONSUMERS:   every trade that closes successfully
RUBRIC:      fit=0.25 form=0.15 truth=0.50 taste=0.10
EXIT:        Move test: buyer SUI → seller USDC, path marked, fee collected, atomicity proven via abort-on-swap-fail
SKILL:       sui:settle-atomic

DELIVERABLE: RECEIPT emission + settlement entity
PATH:        src/schema/world.tql (new settlement entity) + src/pages/api/absorb.ts
GOAL:        Every settlement on-chain produces a TypeDB `settlement` row with normalized USDC
CONSUMERS:   analytics, seller dashboard, revenue.md projections
RUBRIC:      fit=0.30 form=0.15 truth=0.45 taste=0.10
EXIT:        absorb polls SettlementEvent, writes to TypeDB, dashboard shows it
SKILL:       trade:receipt-observability

DELIVERABLE: Seller withdrawal handoff (Sui-side only)
PATH:        src/pages/api/withdraw.ts
GOAL:        Seller posts withdrawal intent → emit signal → `oneie launch` routes it
CONSUMERS:   sellers cashing out cross-chain (via agent-launch)
RUBRIC:      fit=0.40 form=0.15 truth=0.35 taste=0.10
EXIT:        test: POST /api/withdraw emits withdraw-requested signal; handoff stub verified
SKILL:       trade:withdraw-handoff
```

**Boundary note:** C4 used to propose cross-chain bridging (Wormhole, Arbitrum, fiat). Per [launch-handoff.md § What ONE does not do](launch-handoff.md#what-one-does-not-do), that's agent-launch's lane reached via the `oneie launch` verb. ONE's SETTLE stays Sui-native: `Coin<A>` → DEX swap → `Coin<B>` on Sui, atomically.

**Tasks:**
| id | task | wave | exit | blocks |
|----|------|------|------|--------|
| c4.t1 | Extend Move `substrate::pay` to accept `Coin<A>`, call DEX pool (Cetus integration), transfer `Coin<B>` | W3 | Move test passes | c4.t2, c4.t4 |
| c4.t2 | Abort-on-swap-fail test in Move — if DEX pool fails, path NOT marked, coin NOT moved | W3 | test proves atomicity | c4.t3 |
| c4.t3 | `settlement` entity added to world.tql (owns: `txDigest`, `buyerCurrency`, `sellerCurrency`, `normalizedUSDC`, `feeBps`, `ts`) | W3 | schema round-trip | c4.t5 |
| c4.t4 | Extend `bridge.ts` absorb to handle `SettlementEvent` → write `settlement` + update `path.revenue` (USDC-normalized) | W3 | absorb test green | c4.t5 |
| c4.t5 | `/api/withdraw` endpoint — seller posts withdrawal intent → emit `withdraw-requested` signal + return `oneie launch` handoff URL | W3 | unit test: signal emitted; cross-chain routing stubbed to launch-handoff | c4.t6 |
| c4.t6 | Seller dashboard card `components/SellerEarnings.tsx` — shows normalized USDC + per-currency Sui breakdown | W3 | renders with mock + live data | — |
| c4.t7 | Test: `settle-atomic.test.ts` — 8 assertions (happy path × 3 Sui currency pairs + 5 failure modes) | W3 | 8/8 pass | — |
| c4.t8 | Test: `receipt-determinism.test.ts` — same trade twice produces identical RECEIPT (sans digest/ts) | W3 | asserts normalization stable | — |
| c4.t9 | Doc: `docs/settlement.md` — the atomic guarantee, Cetus/Turbos DEX integration on Sui, handoff note for cross-chain | W3 | cross-links SUI.md, revenue.md, launch-handoff.md | — |
| c4.t10| W4 rubric-score C4 | W4 | rubricAvg ≥ 0.65 | — |

---

### Cycle 5 — DISPUTE & FADE (trust recovery + decay)

**Ships:** Three dispute paths (rubric fail, seller timeout, escrow deadline), each with deterministic refund semantics. FADE already works at substrate level; this cycle ensures trade-specific path signals participate correctly and adds the human-arbitration escape hatch for edge cases.

**Deliverables:**
```
DELIVERABLE: Three-way DISPUTE resolver
PATH:        src/engine/dispute.ts
GOAL:        Handle rubric-fail, seller-timeout, deadline-expiry with correct refund
CONSUMERS:   every failed trade
RUBRIC:      fit=0.35 form=0.15 truth=0.40 taste=0.10
EXIT:        test: 3 dispute types × 2 currencies = 6 assertions, all refund correctly
SKILL:       trade:dispute-resolver

DELIVERABLE: Human arbitration escape hatch
PATH:        src/engine/arbitration.ts + Telegram flow
GOAL:        < 1% of disputes: escalate to human quorum for rubric ties
CONSUMERS:   genuinely ambiguous trades where auto-scoring disagrees
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        test: 3 human arbitrators vote, majority decides, on-chain record
SKILL:       trade:human-arbitration

DELIVERABLE: Trade-level fade integration
PATH:        src/engine/loop.ts (L3 tick)
GOAL:        Per-trade signal pheromone decays correctly; aggregate path reputation preserves
CONSUMERS:   L3 loop, long-tail reputation
RUBRIC:      fit=0.30 form=0.15 truth=0.45 taste=0.10
EXIT:        test: fade 10 trades, reputation preserves; fade 100, still stable
SKILL:       trade:fade-integration
```

**Tasks:**
| id | task | wave | exit | blocks |
|----|------|------|------|--------|
| c5.t1 | `src/engine/dispute.ts` — single entry point with three branches | W3 | pure function, 3 branches covered | c5.t2 |
| c5.t2 | Wire rubric-fail → `warn(1)` + `refundEscrow()` atomic | W3 | test: rubric=0.4, refund fires | c5.t5 |
| c5.t3 | Wire seller-timeout (>rubric.deadline) → `warn(0.5)` + refund | W3 | test: timeout mock | c5.t5 |
| c5.t4 | Wire deadline-expiry (escrow auto-refund on Sui side) → `warn(0.5)` in TypeDB via absorb | W3 | test: on-chain refund → TypeDB warn | c5.t5 |
| c5.t5 | `src/engine/arbitration.ts` — human quorum for ambiguous (rubric ∈ [0.6, 0.7] ± 0.05 disagreement) | W3 | test: 3 humans vote via Telegram mock | — |
| c5.t6 | Test: `dispute-matrix.test.ts` — 3 types × 3 currencies × 2 outcomes = 18 assertions | W3 | 18/18 pass | — |
| c5.t7 | Test: `fade-trade-reputation.test.ts` — 100 trades, fade, assert path.strength curve matches expectation | W3 | mathematical property verified | — |
| c5.t8 | Test: `arbitration-quorum.test.ts` — human vote race, majority wins, minority acknowledged | W3 | 5 assertions | — |
| c5.t9 | Doc: `docs/dispute.md` — the three paths, when humans get involved, refund guarantees | W3 | cross-links lifecycle.md § DISPUTE | — |
| c5.t10| W4 rubric-score C5 + final end-to-end trade lifecycle test | W4 | rubricAvg ≥ 0.65; `trade-e2e.test.ts` passes all 10 stages in order | — |

---

### Cycle 6 — Reusable Task Catalog (the `/sync tasks` extension)

**Ships:** A shared catalog of task templates (e.g. `seo:audit`, `content:draft`, `research:brief`) that any world can `/sync tasks` to import. Templates are markdown files with frontmatter; importing instantiates them as `{worldId}:{template.id}` tasks with their skill + capability wiring and optional rubric/price/currency pre-declared. This is how new sellers **start with a working catalog instead of an empty graph** — Goal A's seller-first wedge depends on it.

**Why this belongs in the trade lifecycle TODO:** every reusable task template is a pre-packaged LIST stage (Stage 1). Importing one gives a seller ten listed skills in one command instead of authoring each one by hand. Reusable tasks = cold-start inventory for the marketplace.

**Deliverables:**
```
DELIVERABLE: tasks/ catalog directory + schema
PATH:        tasks/ (new top-level) + src/engine/reusable-tasks.ts
GOAL:        Define the template format (YAML frontmatter + body); ship 3-5 starter templates
CONSUMERS:   /sync tasks, importReusableTasks(), seller-first onboarding
RUBRIC:      fit=0.35 form=0.15 truth=0.40 taste=0.10
EXIT:        3+ templates parse clean; schema documented in tasks/README.md
SKILL:       catalog:task-templates

DELIVERABLE: reusable-tasks.ts engine module
PATH:        src/engine/reusable-tasks.ts
GOAL:        parseTemplate, loadTemplates, instantiateTemplates, importReusableTasks
CONSUMERS:   /api/tasks/import, /sync tasks command, future remote catalog loaders
RUBRIC:      fit=0.30 form=0.15 truth=0.45 taste=0.10
EXIT:        all 4 functions typed + exported from @/engine
SKILL:       engine:reusable-tasks

DELIVERABLE: /sync tasks command extension
PATH:        .claude/commands/sync.md + scripts/sync-reusable-tasks.ts
GOAL:        New noun `/sync tasks [dir]` imports the catalog into current world
CONSUMERS:   developers bootstrapping a new world, agent onboarding flows
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        `/sync tasks` imports fixture catalog; TypeDB has world-scoped tasks + skills
SKILL:       sync:reusable-tasks
```

**Tasks:**
| id | task | wave | exit | blocks |
|----|------|------|------|--------|
| c6.t1 | Create `tasks/` directory + `tasks/README.md` documenting template format | W3 | README exists, format spec'd | c6.t2 |
| c6.t2 | Write 3 starter templates: `tasks/seo/audit.md`, `tasks/content/draft.md`, `tasks/research/brief.md` | W3 | 3 files parse through parseTemplate | c6.t3 |
| c6.t3 | `src/engine/reusable-tasks.ts` — parseTemplate, loadTemplates, instantiateTemplates, importReusableTasks | W3 | module typed, exported from `@/engine` | c6.t4, c6.t5 |
| c6.t4 | `src/engine/reusable-tasks.test.ts` — 10 assertions: frontmatter parse, scoping, idempotency, rubric, price, currency, blocks, tags, errors, integration | W3 | 10/10 pass, <100ms total | — |
| c6.t5 | Extend `.claude/commands/sync.md` with `tasks` noun section | W3 | doc describes the noun, cross-refs `reusable-tasks.ts` | — |
| c6.t6 | W4 rubric-score C6 | W4 | rubricAvg ≥ 0.65 | — |

**Invariants added to the catalogue:**
| Invariant | Stage | Test |
|-----------|-------|------|
| Template import is idempotent — re-sync doesn't duplicate tasks or skills | LIST (cold-start) | `reusable-tasks.test.ts § idempotency` |
| World scoping preserves template id — `seo:audit` imported into `donal` becomes `donal:seo:audit`, never collides across worlds | LIST | `reusable-tasks.test.ts § world-scoping` |
| Rubric metadata survives round-trip — template rubric weights land as TypeDB attributes queryable at VERIFY time | LIST → VERIFY | `reusable-tasks.test.ts § rubric-round-trip` |

---

## Beautiful Tests — Philosophy

Every test in this TODO follows four rules. Beautiful tests are deterministic, fast, revealing, and composable.

1. **One invariant per test.** Test name reads as the invariant. `settle_is_atomic_on_dex_failure` not `test_settle_edge_cases`.
2. **< 50ms per unit test.** If slower, it's an integration test and belongs in the `integration/` directory with explicit justification.
3. **Proof, not coverage.** Every test proves a property: atomicity, monotonicity, idempotency, currency-neutrality, refund-completeness. Tests that don't encode a property shouldn't exist.
4. **Multi-plane.** Mission-critical tests assert **memory + TypeDB + Sui** all agree after the operation. Not one. All three.

### The invariant catalogue (must-pass for this TODO to close)

| Invariant | Stage | Test file |
|-----------|-------|-----------|
| Listing survives round-trip through markdown → TQL → query | LIST | `listing-currency.test.ts` |
| Oracle normalization is monotonic (price_A > price_B → rank_A < rank_B) | DISCOVER | `oracle.test.ts` |
| OFFER PRE-gates reject in documented order (lifecycle → network → toxic → slippage) | OFFER | `offer-gate.test.ts` |
| Escrow release is exactly-once (double-release aborts) | ESCROW | `escrow.test.ts` |
| SETTLE is atomic — partial states impossible (prove via abort scenarios) | SETTLE | `settle-atomic.test.ts` |
| RECEIPT is deterministic given inputs (modulo ts/digest) | RECEIPT | `receipt-determinism.test.ts` |
| VERIFY rubric score is reproducible | VERIFY | `verify.test.ts` |
| DISPUTE refund preserves buyer's original currency | DISPUTE | `dispute-matrix.test.ts` |
| FADE preserves relative reputation ordering (anti-monopoly property) | FADE | `fade-trade-reputation.test.ts` |
| Three-plane consistency — memory, TypeDB, Sui agree after any SETTLE | ALL | `three-plane-consistency.test.ts` |

Ten invariants. Ten properties. Each is a theorem the substrate must satisfy. Tests are proofs.

---

## Rubrics

Per-wave rubric weights (from template) remain. **Per-stage overrides apply to cycle deliverables** where the default weights don't match what matters for that stage. Override table:

| Stage | fit | form | truth | taste | Why the override |
|-------|-----|------|-------|-------|------------------|
| LIST | 0.35 | 0.15 | 0.40 | 0.10 | Truth-heavy — schema correctness dominates |
| DISCOVER | 0.30 | 0.15 | 0.45 | 0.10 | Ranking correctness IS the product |
| OFFER | 0.40 | 0.15 | 0.35 | 0.10 | Fit-heavy — PRE-gate completeness is a design decision |
| ESCROW | 0.25 | 0.15 | 0.50 | 0.10 | Truth-dominant — Move correctness is non-negotiable |
| EXECUTE | 0.30 | 0.15 | 0.45 | 0.10 | The substrate is unchanged; rubric validates wiring |
| VERIFY | 0.35 | 0.15 | 0.40 | 0.10 | Balanced — scoring logic needs both fit and truth |
| SETTLE | 0.25 | 0.15 | 0.50 | 0.10 | Atomicity is a proof; truth dominates |
| RECEIPT | 0.30 | 0.15 | 0.45 | 0.10 | Determinism matters more than aesthetics |
| DISPUTE | 0.35 | 0.15 | 0.40 | 0.10 | Three-way correctness + refund truth |
| FADE | 0.30 | 0.15 | 0.45 | 0.10 | Mathematical property verification |

**W4 scoring threshold:** each deliverable must achieve **0.65 weighted** to pass. Below 0.50 → warn(1), re-spawn. 0.50-0.64 → weak mark, specialist escalation. ≥ 0.65 → mark(strength × 5), `know()` eligibility.

**Per-wave rubric check** (deterministic, not LLM-judged):

| Wave | Check | Pass criterion |
|------|-------|----------------|
| W1 | Every finding cites `file:line` | regex: 100% |
| W2 | Every W1 finding has a diff spec OR explicit "keep" | count: 100% |
| W3 | Every Edit's `old_string` anchor matched on first try | grep: zero anchor failures |
| W4 | All 10 invariants tests green AND `bun run verify` clean | `vitest run` exit 0 |

---

## Strategy — Get Sellers First, Currency Later

### Seller-first acquisition funnel

```
Stage          Action                           Friction removed              Conversion target
─────          ──────                           ─────────────────             ─────────────────
LAND           Visit /seller landing            None                          100%
DRAFT          Open in-browser markdown editor  No repo clone, no CLI         40% → 40k/100k MAU
COMPILE        Click "Sync to substrate"        No TypeDB creds, no wallet    80% → 32k
LIST LIVE      Capability visible at /market    No gas, no signing            95% → 30k
FIRST OFFER    Buyer sends any-currency signal  Platform hides SUI            25% → 7.5k
FIRST SETTLE   Seller earns (in their choice)   Platform routes withdrawal    85% → 6.4k
RETENTION      Cycle N+1 given cycle N          Compounds via pheromone       70% → returns monthly
```

Target: **6,400 earning sellers in the first 90 days post-launch.**

### The five seller-side levers (ordered by expected impact)

1. **Gas-free first 10 trades.** Platform pays Sui gas for seller's first 10 settlements. Cost: ~$0.50 × 10 × 10000 = $50k. ROI: every seller who clears 10 trades has >70% retention.
2. **Withdraw-to-anywhere.** Seller picks USDC on Arbitrum/Base/Solana at any time. Friction down 10x vs "bridge it yourself."
3. **Zero-config listing.** Markdown file = working seller. No contracts, no deploys, no wallets to fund.
4. **Pheromone honeymoon.** New sellers get a 2x pheromone boost on their first 20 trades to bootstrap discovery. Fades at trade 21. No permanent advantage.
5. **Frontier rewards.** Sellers who tag into an under-supplied cluster (`/see frontiers`) get platform fee waived on first 50 trades. Fills structural gaps.

### The multi-currency thesis (why buyers care)

Buyers don't switch platforms to save 10 basis points. They switch because **their preferred currency is denied** somewhere else. OpenAI charges USD. Most AI marketplaces lock to one chain. ONE accepts:

```
Currency       Chain       Status        Notes
────────       ─────       ──────        ─────
SUI            Sui         Day 0         Native
USDC           Sui         Day 0         Already bridged onto Sui (pre-settled)
USDT           Sui         Day 0         Already bridged onto Sui (pre-settled)
Any Coin<T>    Sui         Day 30+       Provided Cetus/Turbos has a liquid pool
```

**Cross-chain is NOT our lane.** Per `docs/launch-handoff.md`, Wormhole/ERC-20/BSC/FIAT are routed via `oneie launch` to agent-launch, which owns cross-chain settlement, fiat onramps, and EVM token markets. ONE honors the boundary: Sui-native `Coin<T>` only.

**"You can too"** = any agent this TODO ships to also inherits multi-currency. When a Donal-Claw agent sells SEO services, the buyer picking "USDT on Arbitrum" costs that agent zero integration effort. The capability is a property of the substrate, not the agent.

---

## Testing — The Deterministic Sandwich

```
W0 BASELINE (before every cycle)              W4+ VERIFICATION (after every cycle)
────────────────────────────────              ──────────────────────────────────
bun run verify  → 320/320 tests pass          bun run verify  → no regressions
                                              + new invariant tests green
                                              + all 10 invariants covered by C5 end
```

**Cycle gate:** C_N cannot start until C_{N-1} achieves:
1. rubricAvg ≥ 0.65 for every deliverable
2. All new tests green
3. `bun run verify` clean
4. At least 1 invariant from the catalogue moved from "pending" to "proven"

**End-of-TODO gate:** ship criterion for marking this TODO done:
1. All 10 invariants in catalogue are proven by passing tests
2. `trade-e2e.test.ts` runs all 10 stages in one transaction-like flow, stable 5x in a row
3. A live demo seller lists in markdown, completes a real trade on testnet, withdraws to Arbitrum — recorded end-to-end
4. `seller-first.md` reviewed by an external seller who completes the journey in < 15 minutes

---

## Routing

```
    /do TODO-trade-lifecycle.md
         │
         ▼  (C1) LIST & DISCOVER
    ┌─────────┐ read lifecycle.md, buy-and-sell.md, existing capability schema
    │  W1     │ ──▶ 4 Haiku recon targets (schema, parser, oracle, ranking)
    └────┬────┘
         ▼
    ┌─────────┐ fold findings, shard by concern
    │  W2     │ ──▶ Opus diff specs (schema edit, parser extension, oracle adapter, ranking fn)
    └────┬────┘
         ▼
    ┌─────────┐ one Sonnet per file (never batch)
    │  W3     │ ──▶ Sonnet edits: world.tql, agent-md.ts, oracle.ts, discover fn, API, tests, docs
    └────┬────┘
         ▼
    ┌─────────┐ 3 verifiers: correctness, cross-ref, voice
    │  W4     │ ──▶ rubric + test + feedback signal
    └────┬────┘
         ▼
    mark('trade-lifecycle:c1:path', rubric × 5) → next cycle pre-warmed
```

Every wave parallelizes within its scope. Every cycle ends with a `mark()` or `warn()` that deposits pheromone on the trade-lifecycle path — so subsequent cycles route faster through the same work.

---

## Open Questions (parked, not blocking)

- **Fiat on-ramp.** Stripe + MoonPay route for "I don't own crypto, want to buy an agent's service." Phase 6+.
- **Recurring settlements.** Subscription trades (hot-path payments) need a Sui Clock + scheduled tx. Maps to `buy-and-sell.md` Open Question #2.
- **Cross-world arbitrage.** Agents routing price differentials across federated worlds. Need `federation.ts` enrichment first.
- **On-chain reputation staking.** Seller stakes SUI to vouch for capability; slashed on warn(). Requires persistent `Stake` object extending `Escrow`. Phase 4.
- **Zero-knowledge rubrics.** Seller proves rubric pass without revealing output (for confidential data products). Research-grade.

---

## See Also

- [lifecycle.md § Trade Lifecycle](one/lifecycle.md#trade-lifecycle-zooming-into-signal) — the 10-stage reference model
- [buy-and-sell.md](buy-and-sell.md) — the four-step mechanics view
- [marketplace.md](marketplace.md) — SKUs, pricing, revenue flywheel, phases
- [SUI.md](SUI.md) — Move contract primitives, Bridge, atomic pay
- [TODO-lifecycle.md](TODO-lifecycle.md) — the sister TODO covering agent-career lifecycle (Register → Harden)
- [TODO-marketplace.md](TODO-marketplace.md) — the UI/experience layer on top of this
- [TODO-SUI.md](TODO-SUI.md) — on-chain phases; C2 and C4 here extend it
- [rubrics.md](rubrics.md) — quality scoring canon
- [TODO-template.md](one/TODO-template.md) — template this follows
- [.claude/rules/engine.md](../.claude/rules/engine.md) — Rule 1 closed loop, Rule 3 deterministic results

---

*List in any currency. Buy in any currency. Settle in any currency. The substrate swaps. The seller earns. The market compounds.*
