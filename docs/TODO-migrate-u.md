---
title: "Migrate /u Wallet Dashboard from ONE"
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 36
completed: 0
status: ACTIVE
---

# TODO: Migrate /u Wallet Dashboard from ONE

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path. (See `.claude/rules/engine.md` → The Two Locked Rules.)
>
> **Parallelism directive (read first):** **Maximize agents per wave.** Every
> wave must fan out to the natural width of the work, in a **single message**
> with multiple tool calls. Defaults: W1 ≥ 4 Haiku (one per read target),
> W2 ≥ 2 Opus shards when findings exceed ~20 (fold per-domain, reconcile at
> end), W3 = one Sonnet per file (never batch files into one agent, never split
> one file across agents — anchor collisions), W4 ≥ 2 Sonnet verifiers (shard
> by check type: consistency, cross-ref, voice, rubric). If a wave is serial,
> it must be because the work is genuinely serial, not because parallelism
> was skipped. **Sequential between waves, maximum parallel within waves.**
>
> **Goal:** ONE's 66-file self-custodial wallet dashboard runs natively in
> envelopes with substrate wiring — every wallet is an actor, every send is
> a signal routed through bridge units, every product is a priced skill,
> settlement in $ONE. See [chains.md](chains.md) for the chain architecture
> and [one-protocol.md](one-protocol.md) for the protocol this serves.
>
> **Source of truth:** [migrate-u.md](migrate-u.md) — strategic impact analysis,
> [chains.md](chains.md) — chain = unit, token = skill, $ONE settles,
> [DSL.md](DSL.md) — the signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark),
> [buy-and-sell.md](buy-and-sell.md) — trade mechanics: capability/listing/settlement,
> [revenue.md](revenue.md) — five revenue layers: routing/discovery/infra/marketplace/intelligence
>
> **Shape:** 3 cycles (this TODO) + 3 chain cycles (see [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) Cycles 2-4).
> Four waves each. Haiku reads, Opus decides, Sonnet writes, Sonnet checks.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with
> `task-wave` (W1-W4), `task-context` (doc keys), `blocks` relation.
> Each task creates a matching `skill` for capability routing.

## Deliverables

### Wave Deliverables (universal — every cycle emits these four)

| Wave | Deliverable | Goal | Rubric weights (fit/form/truth/taste) | Exit condition |
|------|-------------|------|--------------------------------------|----------------|
| **W1** | Recon report (N parallel) | Inventory the truth on disk — findings with line numbers, verbatim | 0.15 / 0.10 / **0.65** / 0.10 | ≥ (N-1)/N agents returned `result`; every finding cites file:line |
| **W2** | Diff spec set | Decide every finding → `{anchor, action, new, rationale}`; resolve shard conflicts | **0.40** / 0.15 / **0.35** / 0.10 | Every W1 finding has a spec OR an explicit "keep" rationale |
| **W3** | Applied edits (M parallel) | Transform diff specs into real file changes without collateral drift | 0.30 / 0.25 / **0.35** / 0.10 | All anchors matched; zero files modified outside the spec set |
| **W4** | Verification report | Prove cycle is clean: rubric ≥ 0.65, tests green, lint clean, types clean | 0.25 / 0.15 / **0.45** / 0.15 | All 4 rubric dims ≥ 0.65 AND `bun run verify` green |

### Cycle Deliverables

```
DELIVERABLE: 66 copied files (50 components + 16 pages)
PATH:        src/components/u/ + src/pages/u/
GOAL:        All ONE wallet files exist in envelopes, build succeeds
CONSUMERS:   Cycle 2 (import fixes), Cycle 3 (substrate wiring)
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        `ls src/components/u/**/*.{ts,tsx} | wc -l` ≥ 50 AND `bun run build` succeeds
SKILL:       migrate:copy

DELIVERABLE: 10 updated files (import fixes + stubs)
PATH:        UHeader, ContractsPage, ProductDetailPage, ProductsPage, WalletsPage, 16 .astro pages, 3 stubs
GOAL:        All imports resolve, no broken references
CONSUMERS:   Cycle 3 (substrate wiring), dev server
RUBRIC:      fit=0.35 form=0.25 truth=0.30 taste=0.10
EXIT:        `bun run build` succeeds with zero import errors
SKILL:       migrate:fix-imports

DELIVERABLE: 3 deep-integrated files + emitClick wiring
PATH:        WalletsPage.tsx, SendPage.tsx, UDashboard.tsx
GOAL:        Wallet actions emit substrate signals, wallets register as actors
CONSUMERS:   Substrate learning (L1-L7), pheromone routing
RUBRIC:      fit=0.40 form=0.15 truth=0.30 taste=0.15
EXIT:        Create wallet → actor in TypeDB; send crypto → signal emitted; dashboard loads substrate data
SKILL:       migrate:substrate-wire
```

## Routing

```
    signal DOWN                     result UP            feedback UP
    ──────────                      ─────────            ───────────
    /do TODO-migrate-u.md           result + 4 tagged    tagged strength
         │                          marks                signal → substrate
         ▼                               │                    ▲
    ┌─────────┐                          │                    │
    │  W1     │  Haiku recon ────────────┤ mark(edge:fit)     │
    │  read   │  → report verbatim       │ mark(edge:form)    │
    └────┬────┘                          │ mark(edge:truth)   │
         │ context grows                 │ mark(edge:taste)   │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W2     │  Opus decide             │                    │
    │  fold   │  → diff specs            │                    │
    └────┬────┘                          │                    │
         │ context grows                 │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W3     │  Sonnet edit             │                    │
    │  apply  │  → file copies + edits   │                    │
    └────┬────┘                          │                    │
         │                               │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W4     │  Sonnet verify ──────────┘                    │
    │  score  │  → rubric: fit/form/truth/taste               │
    │         │  → feedback signal ─────────────────────────►─┘
    └─────────┘
```

## Testing — The Deterministic Sandwich Around Waves

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    bun run verify                     bun run verify
    ├── biome check .                  ├── biome check .     (no new lint)
    ├── tsc --noEmit                   ├── tsc --noEmit      (no new type errors)
    └── vitest run                     ├── vitest run        (no regressions)
                                       └── /u loads in dev   (manual verify)

    BASELINE                           VERIFICATION
    "what passes now"                  "what still passes + what's new"
```

---

```
   CYCLE 1: WIRE (copy)    CYCLE 2: PROVE (fix)     CYCLE 3: GROW (integrate)
   66 files copied          10 files updated          3 files deep-wired
   ─────────────────       ──────────────────        ─────────────────
   bulk copy + deps         import fixes + stubs      substrate signals
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐
   │ H   O  S  S  │  ──►   │ H   O  S  S  │  ──►   │ H   O  S  S  │
   └──────────────┘        └──────────────┘        └──────────────┘

   H = Haiku (recon)    O = Opus (decide)    S = Sonnet (edit + verify)
```

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **WIRE** | 66 files exist, build passes, framer-motion installed | L1 (signal — pages serve) |
| **PROVE** | All imports resolve, stubs created, dev server renders /u | L2 (path marking — routes work) |
| **GROW** | Wallets = actors, sends = signals, dashboard reads substrate | L1-L4 (full commerce loop) |

---

## Source of Truth

**[one-protocol.md](one-protocol.md)** — private intelligence, public results
**[chains.md](chains.md)** — chain = unit, token = skill, $ONE settles, pheromone routes payments
**[migrate-u.md](migrate-u.md)** — strategic impact analysis (identity, commerce, revenue, security)
**[DSL.md](DSL.md)** — signal grammar, `{ receiver, data }`, mark/warn/fade
**[dictionary.md](dictionary.md)** — canonical names, unit/signal/path definitions
**[rubrics.md](rubrics.md)** — quality scoring: fit/form/truth/taste as tagged edges

| Item | Canonical | Exceptions |
|------|-----------|------------|
| wallet | actor (kind: wallet) | UI labels keep "wallet" for users |
| product | skill (with price, settle in $ONE) | UI labels keep "product" |
| transaction | signal routed through bridge unit | UI keeps "transaction" for blockchain context |
| contact | actor (kind: human) + path | UI keeps "contact" |
| send | signal to `pay` unit → bridge routes | UI keeps "send" |
| blockchain | unit (`bridge:evm`, `bridge:sol`, etc.) | UI keeps chain names |
| token | skill on bridge unit | UI keeps token symbols |

---

## Cycle 1: WIRE — Bulk Copy + Dependencies

**Files:** All 66 files from `../ONE/web/src/components/u/` and `../ONE/web/src/pages/u/`

**Why first:** Nothing can be fixed or integrated until the files exist locally.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | 50 component files in `src/components/u/` | All components exist locally | 0.40/0.20/0.30/0.10 | `ls src/components/u/**/*.{ts,tsx} \| wc -l` ≥ 50 | `migrate:copy-components` |
| 2 | 16 Astro pages in `src/pages/u/` | All wallet pages exist | 0.40/0.20/0.30/0.10 | `ls src/pages/u/**/*.astro \| wc -l` ≥ 16 | `migrate:copy-pages` |
| 3 | Route conflict resolved | Existing `/u/[name]` moved to `/unit/[name]` | 0.50/0.10/0.30/0.10 | `test -f src/pages/unit/[name].astro` | `migrate:route-fix` |
| 4 | `framer-motion` installed | Dependency available | 0.30/0.10/0.50/0.10 | `grep framer-motion package.json` | `migrate:deps` |

### Wave 1 — Recon (Haiku x 5, parallel)

| Agent | Target | What to look for |
|-------|--------|-----------------|
| R1 | `../ONE/web/src/components/u/index.ts` + `pages/index.ts` | Export barrel structure — what's re-exported, what's internal |
| R2 | `../ONE/web/src/pages/u/*.astro` (all 16) | Layout imports, component imports, hydration directives |
| R3 | `src/pages/u/[name].astro` (existing) | Current unit profile page — what links to it, what breaks if moved |
| R4 | `package.json` | Current deps — confirm framer-motion missing, check @mysten/sui version |
| R5 | `../ONE/web/src/components/u/CLAUDE.md` | ONE's own rules for /u — constraints we should respect |

### Wave 2 — Decide (Opus x 1)

Decisions:
1. **Copy method:** `cp -r` for components, individual copies for pages (subdirs need mkdir)
2. **Route conflict:** Move `[name].astro` → `src/pages/unit/[name].astro`, update links
3. **Barrel exports:** Keep ONE's `index.ts` barrels or flatten? → Keep (they're self-contained)
4. **framer-motion:** Add as regular dep, not dev dep (runtime animation)
5. **CLAUDE.md:** Copy ONE's `/u` CLAUDE.md as `src/components/u/CLAUDE.md`? → Yes, it's local context

### Wave 3 — Execute (Sonnet x 5, parallel)

| Job | Task | Est. operations |
|-----|------|-----------------|
| E1 | `cp -r ../ONE/web/src/components/u/ src/components/u/` | 1 recursive copy (50 files) |
| E2 | Copy 16 Astro pages with mkdir for subdirs | 4 mkdirs + 16 file copies |
| E3 | Move `src/pages/u/[name].astro` → `src/pages/unit/[name].astro` | 1 mkdir + 1 mv + grep for links |
| E4 | `bun add framer-motion` | 1 install |
| E5 | Update any internal links `/u/somename` → `/unit/somename` | grep + sed across components |

### Wave 4 — Verify (Sonnet x 2, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | File existence + structure | All 66 files exist, directory structure matches, barrel exports work |
| V2 | Build + deps | `bun run build` succeeds (may have import errors — expected, fixed in Cycle 2) |

### Cycle 1 Gate

```bash
ls src/components/u/**/*.{ts,tsx} | wc -l   # ≥ 50
ls src/pages/u/**/*.astro | wc -l           # ≥ 16
test -f src/pages/unit/\[name\].astro       # route conflict resolved
grep framer-motion package.json             # dep installed
```

- [ ] 50+ component files copied
- [ ] 16 Astro pages copied
- [ ] `/u/[name]` → `/unit/[name]` route moved
- [ ] `framer-motion` in dependencies
- [ ] No existing tests broken (`bun vitest run`)

---

## Cycle 2: PROVE — Import Fixes + Stubs

**Depends on:** Cycle 1 complete. Files must exist before imports can be fixed.

**Files:** 10 files needing updates + 3 new stub files

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `src/lib/security.ts` stub | `secureGetItem`/`secureSetItem` resolve | 0.30/0.20/0.40/0.10 | `grep -r "from.*@/lib/security" src/` returns 1 match, no error | `migrate:stub-security` |
| 2 | `src/components/ShareButtons.tsx` stub | ShareButtons import resolves | 0.30/0.20/0.40/0.10 | `grep -r "from.*ShareButtons" src/components/u/` returns 2 matches, no error | `migrate:stub-share` |
| 3 | `src/components/ModeToggle.tsx` stub | ModeToggle import resolves | 0.30/0.20/0.40/0.10 | import resolves | `migrate:stub-toggle` |
| 4 | `UHeader.tsx` updated | ModeToggle → envelopes theme toggle | 0.35/0.25/0.30/0.10 | no import error | `migrate:fix-header` |
| 5 | `ContractsPage.tsx` updated | AI imports removed/stubbed, security import resolves | 0.35/0.25/0.30/0.10 | no import error | `migrate:fix-contracts` |
| 6 | `ProductDetailPage.tsx` + `ProductsPage.tsx` updated | ShareButtons resolves | 0.35/0.25/0.30/0.10 | no import error | `migrate:fix-products` |
| 7 | `WalletsPage.tsx` updated | ZkLogin imports removed | 0.40/0.15/0.35/0.10 | no import error, no ZkLogin references | `migrate:fix-wallets` |
| 8 | 16 Astro pages updated | Layout import swapped | 0.30/0.30/0.30/0.10 | all pages import `@/layouts/Layout.astro` | `migrate:fix-layouts` |

### Wave 1 — Recon (Haiku x 6, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/components/u/UHeader.tsx` | Exact ModeToggle import line, usage in JSX |
| R2 | `src/components/u/pages/ContractsPage.tsx` | All 6 AI imports + security import, exact lines |
| R3 | `src/components/u/pages/ProductDetailPage.tsx` | ShareButtons import + usage |
| R4 | `src/components/u/pages/ProductsPage.tsx` | ShareButtons import + usage |
| R5 | `src/components/u/pages/WalletsPage.tsx` | ZkLogin imports + handler + JSX, exact lines |
| R6 | Any 3 `.astro` pages in `src/pages/u/` | Layout import pattern — what to find/replace |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **ModeToggle:** Use existing `src/components/ui/theme-toggle.tsx` or create a thin wrapper?
2. **ContractsPage AI chat:** Stub the entire chat section or wire to envelopes' `DebbyChat`?
3. **ShareButtons:** `navigator.share()` with clipboard fallback? One component, both pages import it.
4. **ZkLogin removal:** Delete the button entirely or replace with "Connect Substrate Wallet"?
5. **Layout swap:** Bulk sed or per-file Edit? → sed for `.astro` files (same pattern in all 16)

### Wave 3 — Edits (Sonnet x 6, parallel)

| Job | File(s) | Est. edits |
|-----|---------|-----------|
| E1 | Create `src/lib/security.ts` | 1 new file (~5 lines) |
| E2 | Create `src/components/ShareButtons.tsx` | 1 new file (~30 lines) |
| E3 | Create `src/components/ModeToggle.tsx` | 1 new file (~10 lines, wraps theme-toggle) |
| E4 | Fix `ContractsPage.tsx` | ~3 edits (remove AI imports, stub chat section) |
| E5 | Fix `WalletsPage.tsx` | ~3 edits (remove ZkLogin import, handler, JSX) |
| E6 | Fix all 16 `.astro` pages | 16 layout import swaps (one pattern) |

### Wave 4 — Verify (Sonnet x 2, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Import resolution | `bun run build` — zero import errors in `src/components/u/` and `src/pages/u/` |
| V2 | No ZkLogin / no AI remnants | `grep -r "ZkLogin\|zklogin" src/components/u/` returns 0; `grep -r "@/components/ai" src/components/u/` returns 0 |

### Cycle 2 Gate

```bash
bun run build                                        # succeeds
grep -r "ZkLogin\|zklogin" src/components/u/         # 0 matches
grep -r "@/components/ai" src/components/u/           # 0 matches
grep -r "ULayout" src/pages/u/                        # 0 matches (all swapped to Layout)
test -f src/lib/security.ts                           # stub exists
test -f src/components/ShareButtons.tsx                # stub exists
```

- [ ] `bun run build` succeeds with zero import errors
- [ ] Zero ZkLogin references in copied files
- [ ] Zero ONE-specific AI component references
- [ ] All 16 `.astro` pages use envelopes `Layout.astro`
- [ ] 3 stub files created (security, ShareButtons, ModeToggle)
- [ ] Dev server renders `/u` dashboard

---

## Cycle 3: GROW — Substrate + Chain Integration

**Depends on:** Cycle 2 complete. All imports must resolve before wiring substrate.

**Files:** 3 deep-integration files + emitClick wiring + chain bridge foundation

**Protocol context:** This cycle connects `/u` to the ONE Protocol ([one-protocol.md](one-protocol.md)).
Commerce sends route through bridge units ([chains.md](chains.md)). Products become capabilities.
Settlement in $ONE. The substrate learns payment paths.

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `WalletsPage.tsx` with `deriveKeypair()` + wallet-link | Sui wallets register as substrate actors, linked to external wallets | 0.45/0.10/0.35/0.10 | Create Sui wallet → `addressFor()` matches, actor in TypeDB | `migrate:wire-wallets` |
| 2 | `SendPage.tsx` with commerce/private toggle | Commerce sends = signals through `pay` unit; private sends = direct | 0.40/0.15/0.35/0.10 | Product purchase → `/api/signal` with payment tags; personal send → direct, no signal | `migrate:wire-send` |
| 3 | `UDashboard.tsx` with graph position | Dashboard = portfolio (blockchain) + reputation (substrate) + highways + frontier | 0.35/0.20/0.30/0.15 | Dashboard fetches `/api/memory/reveal` + `/api/loop/highways` | `migrate:wire-dashboard` |
| 4 | `emitClick()` on all interactive components | Every onClick emits UI signal per `ui.md` rule | 0.30/0.25/0.30/0.15 | `grep -r "emitClick" src/components/u/ \| wc -l` ≥ 15 | `migrate:wire-clicks` |
| 5 | `ProductsPage.tsx` products → capabilities | Creating product = LIST in TypeDB, discoverable via `/api/agents/discover` | 0.40/0.15/0.35/0.10 | Product creation writes capability to TypeDB | `migrate:wire-products` |

### Wave 1 — Recon (Haiku x 7, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/components/u/pages/WalletsPage.tsx` | All wallet generation functions, Ed25519Keypair usage, state management |
| R2 | `src/components/u/pages/SendPage.tsx` | Transaction confirmation handler, where TX is finalized, product purchase detection |
| R3 | `src/components/u/UDashboard.tsx` | Data loading patterns, useEffect hooks, state shape |
| R4 | `src/components/u/pages/ProductsPage.tsx` | Product creation flow, pay.one.ie integration, pricing model |
| R5 | `src/lib/sui.ts` | `deriveKeypair()`, `addressFor()` signatures and usage |
| R6 | `src/lib/ui-signal.ts` | `emitClick()` signature, `RichMessage` type |
| R7 | `docs/chains.md` + `docs/buy-and-sell.md` | Payment signal shape, bridge unit pattern, LIST→SETTLE flow |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **Wallet identity:** Substrate wallet (derived) = primary for routing/fees. `/u` wallets (self-custodial) = linked via `wallet-link` relation. See [migrate-u.md](migrate-u.md) § Identity Resolution.
2. **Commerce vs private sends:** Product purchases default to substrate-routed (signal → mark → $ONE settlement). Personal transfers default to direct (no substrate signal). Toggle in UI.
3. **Product → capability:** Creating a product in `/u` writes a `skill` + `capability` to TypeDB. The payment link becomes a pre-routed signal: `{ receiver: "seller:product", data: { weight: price } }`.
4. **Dashboard augmentation:** Portfolio from blockchain RPCs (existing). Reputation + highways + frontier from substrate (new). Don't replace, augment.
5. **emitClick scope:** Per `ui.md`: every onClick that isn't purely visual. Skip accordion/tooltip toggles.

### Wave 3 — Edits (Sonnet x 5, parallel)

| Job | File(s) | Est. edits |
|-----|---------|-----------|
| E1 | `WalletsPage.tsx` | ~5 edits: import `addressFor`, register actor via `/api/agents/register` on Sui wallet gen, wallet-link for external wallets |
| E2 | `SendPage.tsx` | ~5 edits: import `emitClick`, commerce/private toggle state, signal emission for commerce sends via `/api/signal`, direct send for private |
| E3 | `UDashboard.tsx` | ~4 edits: `useEffect` for reveal+highways+frontier, merge substrate data into dashboard cards |
| E4 | `ProductsPage.tsx` + `ProductDetailPage.tsx` | ~4 edits: product creation → POST `/api/agents/sync` to write capability, payment link as pre-routed signal |
| E5 | All interactive components (~15 files) | ~20 edits: `import { emitClick }` + `emitClick('ui:wallet:*')` / `emitClick('ui:shop:*')` on buttons |

### Wave 4 — Verify (Sonnet x 3, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Substrate wiring | `deriveKeypair` correct, signal payloads match `{ receiver, data }`, product→capability writes to TypeDB |
| V2 | emitClick + commerce toggle | Non-visual onClicks call `emitClick()`, commerce sends route through substrate, private sends bypass |
| V3 | Build + rubric | `bun run build` green, `bun vitest run` green, rubric ≥ 0.65 all dims |

### Cycle 3 Gate

```bash
bun run build                                          # succeeds
bun vitest run                                         # no regressions
grep -r "emitClick" src/components/u/ | wc -l          # ≥ 15
grep -r "addressFor\|deriveKeypair" src/components/u/  # ≥ 1
grep -r "/api/signal" src/components/u/                # ≥ 1
grep -r "/api/memory/reveal" src/components/u/         # ≥ 1
grep -r "/api/agents" src/components/u/pages/Products  # ≥ 1 (capability write)
```

- [ ] `bun run build` green
- [ ] `bun vitest run` — no regressions
- [ ] WalletsPage registers Sui wallets as substrate actors
- [ ] SendPage commerce/private toggle works — commerce sends emit signal, private sends don't
- [ ] UDashboard shows reputation + highways from substrate
- [ ] Products write capabilities to TypeDB on creation
- [ ] ≥ 15 `emitClick()` calls across wallet components
- [ ] All emitClicks use `ui:wallet:*` or `ui:shop:*` receiver naming

**Next:** After these 3 cycles, chain integration continues in [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) Cycles 2-4:
bridge units, $ONE token deployment, DEX units, cross-chain payment routing.

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 5 | Haiku | ~5% |
| 1 | W2 | 1 | Opus | ~10% |
| 1 | W3 | 5 | Sonnet | ~15% |
| 1 | W4 | 2 | Sonnet | ~5% |
| 2 | W1 | 6 | Haiku | ~5% |
| 2 | W2 | 1 | Opus | ~10% |
| 2 | W3 | 6 | Sonnet | ~15% |
| 2 | W4 | 2 | Sonnet | ~5% |
| 3 | W1 | 6 | Haiku | ~5% |
| 3 | W2 | 1 | Opus | ~10% |
| 3 | W3 | 4 | Sonnet | ~10% |
| 3 | W4 | 3 | Sonnet | ~5% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

---

## Status

- [ ] **Cycle 1: WIRE** — Bulk copy 66 files + install framer-motion + resolve route conflict
  - [ ] W1 — Recon (Haiku x 5, parallel)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Execute (Sonnet x 5, parallel)
  - [ ] W4 — Verify (Sonnet x 2, parallel)
- [ ] **Cycle 2: PROVE** — Fix 10 imports + create 3 stubs + swap 16 layouts
  - [ ] W1 — Recon (Haiku x 6, parallel)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 6, parallel)
  - [ ] W4 — Verify (Sonnet x 2, parallel)
- [ ] **Cycle 3: GROW** — Substrate + chain wiring (5 deliverables) + emitClick (15+ files)
  - [ ] W1 — Recon (Haiku x 7, parallel)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 5, parallel)
  - [ ] W4 — Verify (Sonnet x 3, parallel)

**Chain integration continues:** [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) Cycles 2-4

---

## Execution

```bash
# Run the next wave of the current cycle
/do TODO-migrate-u.md

# Or manually — autonomous sequential loop
/do

# Check state
/see highways               # proven paths
/see tasks                  # open tasks by priority
```

---

## Documentation Updates (W2)

**New docs:**
- [chains.md](chains.md) — chain = unit, token = skill, $ONE settles (created)

**Docs modified:**
- `src/pages/CLAUDE.md` — add 16 new `/u/*` routes to page table
- `docs/dictionary.md` — add wallet/token/chain mappings (wallet→actor, token→skill, chain→unit)
- `CLAUDE.md` (root) — add `/u` to directory structure, reference chains.md
- `docs/buy-and-sell.md` — reference chains.md for multi-token settlement
- `docs/one-protocol.md` — reference chains.md as protocol extension

**Schema changes:**
- `wallet-link` relation in TypeDB (substrate actor ↔ external wallet addresses)
- `bridge:evm`, `bridge:sol`, `bridge:btc` units (Phase 2, after this TODO)
- Token skills (`sui:one`, `eth:eth`, etc.) (Phase 3, after this TODO)
- No D1 migrations

---

## See Also

- [one-protocol.md](one-protocol.md) — private intelligence, public results
- [chains.md](chains.md) — chain = unit, token = skill, $ONE settles
- [migrate-u.md](migrate-u.md) — strategic impact analysis (identity/commerce/revenue/security)
- [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) — parent integration plan (Cycles 0-6)
- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring: fit/form/truth/taste as tagged edges
- [buy-and-sell.md](buy-and-sell.md) — commerce mechanics (LIST→DISCOVER→EXECUTE→SETTLE)
- [sdk.md](sdk.md) — `one.hire()` auto-settles across chains
- [lifecycle-one.md](lifecycle-one.md) — user funnel (wallet→key→sign-in→team)
- [revenue.md](revenue.md) — five revenue layers, all gain from chain integration

---

*3 cycles. Four waves each. Copy all 66. Fix 10. Deep-wire to protocol.
Wallets = actors. Products = capabilities. Sends = signals. Settlement in $ONE.
Then: bridge units, DEX routing, cross-chain pheromone.
Haiku reads, Opus decides, Sonnet writes, Sonnet checks.
Private intelligence. Public results.*
