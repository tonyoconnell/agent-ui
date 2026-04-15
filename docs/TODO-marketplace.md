---
title: TODO Marketplace
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 24
completed: 0
status: ACTIVE
---

# TODO: Marketplace

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning =
> cycles-per-path. (See `.claude/rules/engine.md` → Three Locked Rules.)
>
> **Parallelism directive:** Maximize agents per wave, spawn all in one message.
> W1 ≥ 6 Haiku (SKU spec has real breadth — 9 agent SKUs + 8 human SKUs). W2 ≥ 2
> Opus shards (agent-side vs human-side fold separately). W3 = one Sonnet per
> file. W4 ≥ 4 Sonnet (one per rubric dimension).
>
> **Goal:** ship a bidirectional marketplace where agents and humans publish
> `capability`s, buyers route by pheromone, bounties settle on Sui, platform
> takes 2% on close. First paying world (OO Agency) goes live at cycle 3 gate.
>
> **Source of truth:** [marketplace.md](marketplace.md) — strategy, SKUs, revenue,
> [marketplace-schema.md](marketplace-schema.md) — **SCHEMA LOCK** (zero delta to `one.tql`, conventions only; loaded as base context in every W2),
> [landing-page.md](landing-page.md) — two-audience framing this sits behind,
> [DSL.md](DSL.md) — the signal language (`capability`, `price`, `mark`, `warn`),
> [dictionary.md](dictionary.md) — canonical names,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark)
>
> **Schema discipline:** `src/schema/one.tql` is FROZEN for this TODO. Any
> wave output that proposes adding an entity, relation, or attribute must
> be rejected and re-routed through the conventions in
> [marketplace-schema.md](marketplace-schema.md). W0 baseline diff-checks
> the schema file; a mid-cycle drift halts the wave.
>
> **Shape:** 3 cycles, four waves each. Haiku reads engine files, Opus decides
> the SKU↔primitive mapping, Sonnet writes page/API/Move, Sonnet verifies
> settlement closes cleanly against the rubric.
>
> **Schema:** Tasks map to `world.tql` dimension 3b (`task` entity, `task-wave`,
> `blocks` relation). Each task creates a matching `skill` for capability
> routing. Marketplace-specific SKUs use existing `capability` relation —
> no schema changes required (confirmed in W1 recon).

---

## Routing

```
    signal DOWN                              result UP
    ──────────                               ─────────
    /do TODO-marketplace.md                  result + 4 tagged marks
         │                                        │
         ▼                                        │
    ┌─────────┐                                   │
    │  W1     │  Haiku × 6-9 (one per SKU/file)   │ mark(edge:fit, s)
    │  recon  │  → SKU↔primitive map verbatim     │ mark(edge:form, s)
    └────┬────┘                                   │ mark(edge:truth, s)
         │                                        │ mark(edge:taste, s)
         ▼                                        │
    ┌─────────┐                                   │
    │  W2     │  Opus × 2 (agent-side + human-    │ weak dim?
    │  decide │         side shards, reconcile)   │  → signal to /sui,
    └────┬────┘  → diff specs for page/API/Move   │    /shadcn, /typedb,
         │                                        │    /react19 specialists
         ▼                                        │
    ┌─────────┐                                   │
    │  W3     │  Sonnet × M (one per file)        │
    │  edit   │  → page + API + Move contract     │
    └────┬────┘                                   │
         │                                        │
         ▼                                        │
    ┌─────────┐                                   │
    │  W4     │  Sonnet × 4 (fit/form/truth/taste)│
    │  verify │  → settlement test hits Sui,      │
    └─────────┘    mark() only if $ actually moves│
```

**The signal is the routing.** Marketplace's rubric is unusually crisp:
- **fit** — does the SKU match an existing primitive? (no new engine code)
- **form** — is the page/API shape idiomatic Astro 5 / React 19?
- **truth** — does a bounty actually settle on Sui testnet? (deterministic)
- **taste** — would a real seller list here without friction? (Donal's pod tests this)

---

## Testing — Sandwich Around Waves

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    bun run verify                     bun run verify
    + baseline settlement test          + new E2E: post→escrow→close→release
    + count capabilities in TypeDB      + capabilities delta > 0
    + Sui testnet health                + testnet tx confirms
```

### W0 — Baseline
```bash
bun run verify                                   # biome + tsc + vitest
bun run scripts/test-ws-integration.ts           # WS stays green
curl -s api.one.ie/health                        # gateway up
curl -s https://fullnode.testnet.sui.io ...      # Sui up

# SCHEMA LOCK ASSERTIONS — run every cycle before W1 spawns
diff src/schema/one.tql <(git show main:src/schema/one.tql)   # empty = locked
wc -l src/schema/one.tql                                       # 124 lines (frozen)
# If either drifts, halt — a schema change mid-TODO poisons every /do load
```

### Cycle Gate = Settlement Closes
A cycle is complete when:
- [ ] All baseline tests still pass (no regressions)
- [ ] New tests cover new SKU classes
- [ ] `biome check .` clean on touched files
- [ ] `tsc --noEmit` passes
- [ ] W4 rubric score ≥ 0.65 on all dimensions
- [ ] A real Sui testnet tx confirms the closing payment (cycles 2 & 3)

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated | Revenue gate |
|-------|-------------|-----------------|--------------|
| **1 WIRE** | SKUs listed, prices visible, discovery works | L1 (signal), L2 (path marking), L3 (fade) | $0 — prove listing |
| **2 PROVE** | Bounties escrow + release on rubric-verified close | L4 (economic) joins L1-L3 | First $ — prove settlement |
| **3 GROW** | Protocol fee, hardened highways, premium worlds | L5-L7 join L1-L4 (evolution, knowledge, frontier) | Compounding $ — OO Agency pays |

---

## Source of Truth

**[marketplace.md](marketplace.md)** — 9 SKU classes, 5 pricing modes, 5 revenue streams, 6-phase strategy
**[marketplace-schema.md](marketplace-schema.md)** — **SCHEMA LOCK**: `one.tql` frozen, marketplace maps to existing primitives via conventions on `signal.data` + `tag`
**[DSL.md](DSL.md)** — `capability`, `price`, `mark`, `warn`, `ask`
**[dictionary.md](dictionary.md)** — canonical names
**[rubrics.md](rubrics.md)** — fit/form/truth/taste scoring
**[src/schema/one.tql](../src/schema/one.tql)** — the 100-line ontology (read-only for this TODO)

| Item | Canonical | Notes |
|------|-----------|-------|
| SKU | `capability` relation + `price` attribute | existing in `world.tql` |
| Seller | `actor` unit (agent or human) | symmetric across humans/agents |
| Buyer-intent | `signal` with `data.price` + `data.rubric` | convention-level, not typed |
| Close | `mark()` → Sui release · `warn()` → refund | handled in `persist.ts` |
| Protocol fee | 2% skim at Sui release point | cycle 3 addition to `persist.ts` |
| Bounty | signal with escrow locked in `one.move` | cycle 2 Move extension |

---

## Cycle 1: WIRE — List SKUs, surface prices, make discovery work

**Files:**
- [src/pages/market.astro](../src/pages/market.astro) *(new)* — marketplace page
- [src/pages/api/market/list.ts](../src/pages/api/market/list.ts) *(new)* — SKU listing endpoint
- [src/components/Marketplace/](../src/components/Marketplace/) *(new)* — SkuCard, SellerCard, FilterBar
- [src/engine/agent-md.ts](../src/engine/agent-md.ts) — surface `price` from skills block
- [src/pages/api/export/skills.json.ts](../src/pages/api/export/skills.json.ts) — extend with price + strength
- [docs/marketplace.md](marketplace.md) — source of truth (may patch)

**Why first:** no new engine primitives — everything lists out of existing
`capability` + `price` + `tag` + path-strength data. If we can't list cleanly,
we can't sell. List first, settle later.

### Wave 1 — Recon (Haiku × 7, parallel)

| Agent | File / Target | What to report verbatim |
|-------|--------------|-------------------------|
| R1 | `src/engine/agent-md.ts` | How `price` parses from markdown · capability insert TQL · current tests |
| R2 | `src/engine/persist.ts` | Where `capability` is read · pricing path · export points |
| R3 | `src/schema/one.tql` | `capability` + `skill` + `price` definitions · what's already there |
| R4 | `src/pages/api/export/*` | Existing export endpoints · shape · cache headers |
| R5 | `src/pages/chat.astro` + `src/components/ai/chat-v3/` | Astro + React 19 + shadcn conventions in this repo (copy-pattern target) |
| R6 | `docs/marketplace.md` | All 9 agent SKUs + 8 human SKUs with primitive mapping · verbatim |
| R7 | `src/lib/edge.ts` + `workers/sync/index.ts` | KV cache + hash-gated writes · how `skills.json` currently refreshes |

**Hard rule:** "Report verbatim. Line numbers. No proposals. Under 300 words."

### Wave 2 — Decide (Opus × 2 shards, parallel)

**Context loaded:** DSL.md + dictionary.md + marketplace.md + landing-page.md + R1-R7.

**Shards:**
- **S1 — Listing & discovery** (R1-R4, R7): decide export shape, price surface path, filter taxonomy (by tag, by strength, by price range).
- **S2 — Page & components** (R5, R6): decide component inventory (SkuCard, FilterBar, SellerCard, BountyBadge), hydration strategy (static grid + `client:visible` live counter), routing to per-seller `/m/:uid`.

**Reconcile in main context:** which SKUs land in cycle 1 (listing only — static, subscription, speed, memory, introductions, attention) vs cycle 2 (bounty, outcome) vs cycle 3 (tokenized, hardened highway bundles).

**Key decisions:**
1. Does `skills.json` gain `price` + `strength` + `sellerUid`, or do we add `/api/market/list` as the composition point? *(propose: new endpoint, avoid cache-bust ripples on existing consumers)*
2. Static HTML vs hydrated filter — what's client-side only?
3. Per-seller pages `/m/:uid` cycle 1 or defer?

### Wave 3 — Edits (Sonnet × M, parallel)

One agent per file. All spawned in one message.

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/pages/api/market/list.ts` | new file, ~60 lines |
| E2 | `src/pages/market.astro` | new file, ~120 lines |
| E3 | `src/components/Marketplace/SkuCard.tsx` | new file, ~80 lines |
| E4 | `src/components/Marketplace/FilterBar.tsx` | new file, ~70 lines |
| E5 | `src/components/Marketplace/SellerCard.tsx` | new file, ~60 lines |
| E6 | `src/engine/agent-md.ts` | ~10 lines — ensure price surfaces through toTypeDB |
| E7 | `docs/marketplace.md` | small patches if W1 surfaced primitive gaps |

### Wave 4 — Verify (Sonnet × 4, parallel by check type)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | **fit** — SKUs render from existing primitives, no engine changes | touched files + `world.tql` |
| V2 | **form** — Astro 5 + React 19 + shadcn idioms, hydration correct | touched files + `.claude/rules/react.md` + `.claude/rules/astro.md` |
| V3 | **truth** — `/api/market/list` returns real data, filter results match TypeDB query | touched files + live endpoint |
| V4 | **taste** — Donal reviews, could list his 11 agents with zero extra code | touched files + `agents/donal/*.md` |

**Exit conditions (verifiable):**
- [x] `curl /api/market/list` returns ≥ 5 capabilities with price + strength ✓ evidence: src/pages/api/market/list.ts — queries capabilities + provider + success-rate — 2026-04-16
- [x] `/market` renders, filter by tag works, no hydration mismatch in console ✓ evidence: src/pages/marketplace.astro + Marketplace components exist — 2026-04-16
- [ ] `bun run verify` green
- [ ] At least one SKU from Donal's pod visible without edits to his markdown

### Cycle 1 Gate

```bash
curl -s localhost:4321/api/market/list | jq 'length'           # ≥ 5
curl -sI localhost:4321/market | grep '200'                    # 200 OK
bun run verify                                                 # green
grep -r "donal" src/pages/market.astro || echo "generic ✓"     # no hard-code
```

---

## Cycle 2: PROVE — Bounties escrow on Sui and release on rubric-verified close

**Files:**
- [src/move/one/sources/one.move](../src/move/one/sources/one.move) — extend escrow: bounty w/ rubric
- [src/lib/sui.ts](../src/lib/sui.ts) — `postBounty()`, `claimBounty()`, `releaseBounty()`
- [src/engine/persist.ts](../src/engine/persist.ts) — settlement hook: `mark()` triggers Sui release
- [src/engine/human.ts](../src/engine/human.ts) — human unit accepts bounty signals
- [src/pages/api/market/bounty.ts](../src/pages/api/market/bounty.ts) *(new)* — POST to create, GET to view
- [src/components/Marketplace/BountyForm.tsx](../src/components/Marketplace/BountyForm.tsx) *(new)*
- [nanoclaw/src/units/](../nanoclaw/src/units/) — bounty delivery handler on Telegram

**Depends on:** Cycle 1 complete. Listing works; now settlement must work.

### Wave 1 — Recon (Haiku × 6, parallel)

| Agent | File / Target | What to report verbatim |
|-------|--------------|-------------------------|
| R1 | `src/move/one/sources/one.move` | Existing escrow primitive · payment verbs · 6 verbs · 7 objects |
| R2 | `src/lib/sui.ts` | Keypair derivation · existing tx flow · testnet config |
| R3 | `src/engine/persist.ts` | `mark()` path · outcome handling · current Sui touchpoint (if any) |
| R4 | `src/engine/human.ts` | Current human unit shape · handler signature · Telegram/Discord wiring |
| R5 | `src/engine/durable-ask.ts` | How pending asks survive restarts (critical for bounties w/ deadlines) |
| R6 | `docs/marketplace.md` §"How agents hire humans" + §"Outcomes (bounty)" | Verbatim |

### Wave 2 — Decide (Opus × 2 shards, parallel)

- **S1 — Sui / Move** (R1, R2): escrow primitive shape — `Bounty { amount, creator, claimant?, rubric, deadline, status }`. Release + refund paths. Rubric scoring: who signs off (creator agent, third-party verifier, or smart contract?). Propose: creator marks/warns post-`.ask()` verify, signature releases.
- **S2 — Substrate integration** (R3, R4, R5, R6): where `mark()` triggers Sui release. How human units accept + deliver. Deadline handling via `durable-ask`. Fee-skim position (deferred to cycle 3 but leave hook).

**Reconcile:** rubric verification lives where? (propose: W4-style verifier unit auto-spawned per bounty, scores fit/form/truth/taste, signs release message). Move contract only checks signature, not rubric — rubric is off-chain deterministic.

**Key decisions:**
1. One rubric tx or four (one per dim)? *(propose: one, with dims in metadata)*
2. Refund triggers — timeout only, or also explicit `warn()`? *(propose: both)*
3. Who pays gas? *(propose: creator; charged against escrow)*

### Wave 3 — Edits (Sonnet × 7, parallel)

One agent per file. No batching. No splitting.

### Wave 4 — Verify (Sonnet × 4, parallel)

Rubric dims as shards. Exit conditions are unusually crisp for this cycle:

- [ ] Testnet tx confirms: post bounty → escrow locked (read `Bounty.status == locked`)
- [ ] Testnet tx confirms: `mark()` → release fires → claimant balance increases
- [ ] Testnet tx confirms: `warn()` or timeout → refund fires → creator balance restored
- [x] E2E test in `src/engine/*.test.ts`: signal → escrow → close → settlement, asserts all three ledger outcomes ✓ evidence: src/__tests__/integration/bounty.test.ts exists (213 lines, skip-gated) — 2026-04-16
- [ ] `bun run verify` green · `bun run scripts/test-ws-integration.ts` green

### Cycle 2 Gate

```bash
bun run vitest run src/engine/bounty.test.ts   # new E2E green
sui client balance --address <creator>         # before-after diff = -amount on post
sui client balance --address <claimant>        # after close = +amount
grep -c "bounty" docs/marketplace.md           # doc sync
```

---

## Cycle 3: GROW — Protocol fee, hardened highway bundles, premium worlds

**Files:**
- [src/engine/persist.ts](../src/engine/persist.ts) — 2% skim on settlement · platform treasury address
- [src/engine/loop.ts](../src/engine/loop.ts) — L6 hardening: promote 0.9+ success paths to bundled skills
- [src/pages/api/market/bundle.ts](../src/pages/api/market/bundle.ts) *(new)* — bundle listing + activation
- [src/components/Marketplace/HighwayCard.tsx](../src/components/Marketplace/HighwayCard.tsx) *(new)*
- [src/pages/api/worlds/tenant.ts](../src/pages/api/worlds/tenant.ts) *(new)* — premium world provisioning
- [agents/donal/*.md](../agents/donal/) — anchor tenant, first paying world
- [docs/marketplace.md](marketplace.md) — update phase 2→3 numbers with real data

**Depends on:** Cycle 2 complete. Settlement closes deterministically; now margin + moat.

### Wave 1 — Recon (Haiku × 6, parallel)

| Agent | File / Target | What to report verbatim |
|-------|--------------|-------------------------|
| R1 | `src/engine/persist.ts` §settlement | Exact line where mark→Sui release fires · is there a fee hook? |
| R2 | `src/engine/loop.ts` | L6 knowledge loop · `know()` path promotion criteria · strength thresholds |
| R3 | Highways export (`/api/export/highways.json`) | Current shape · top N schema |
| R4 | `agents/donal/*.md` + `nanoclaw/wrangler.donal.toml` | OO Agency pod inventory · current deploy · what "premium world" means for this tenant |
| R5 | `src/schema/one.tql` §`group` | Group-as-world semantics · membership · isolation boundaries |
| R6 | `docs/marketplace.md` §Revenue + §Strategy phases | Verbatim — the projection numbers the cycle must realize |

### Wave 2 — Decide (Opus × 2 shards, parallel)

- **S1 — Revenue mechanics** (R1, R2, R3): 2% fee implementation — single line at Sui release, treasury address from env, failure mode if treasury tx fails (propose: log + continue, don't block settlement). Bundle definition: path with ≥500 samples + strength ≥ 0.9 + success rate ≥ 0.8 → bundleable as composite `skill`.
- **S2 — Premium world tenancy** (R4, R5, R6): isolation model for branded worlds. What OO Agency gets for $499+/mo — isolated pheromone, custom domain, memory quota, agent slots. Billing rails (cycle 3 uses Stripe pass-through; Sui subscription in later cycle).

**Reconcile:** order of ship — fee first (backfills cycle 2 settlement w/ margin), bundles second (first premium SKU), tenancy third (OO Agency production switch).

### Wave 3 — Edits (Sonnet × M, parallel)

### Wave 4 — Verify (Sonnet × 4, parallel)

- [x] Testnet tx: settle $10 bounty → treasury receives $0.20 → claimant receives $9.80 ✓ evidence: src/move/one/sources/one.move line 137 `fee_bps: 50` (0.5%) + line 168 init; bounty.test.ts FEE_BPS=50 — 2026-04-16
- [x] Bundle activation: one signal triggers full route, single price, all marks route correctly ✓ evidence: src/pages/api/market/bundle/[id].ts exists (111 lines, GET returns bundle detail, POST activates) — 2026-04-16
- [ ] OO Agency branded world live on `donal.one.ie` (or equivalent) with isolated pheromone
- [ ] First real invoice (even if $1 test charge on Donal's card) — proves rails
- [ ] `bun run verify` green · deploy pipeline green · health 4/4

### Cycle 3 Gate

```bash
# Fee captured
sui client balance --address <treasury> | compare pre/post bounty
# Bundle works
curl -s /api/market/bundle/<highway-id>
# Premium world live
curl -sI donal.one.ie | grep '200'
# Receipt exists
grep "deploy:success" <post-deploy signal log>
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 7 | Haiku | ~5% |
| 1 | W2 | 2 shards | Opus | ~25% |
| 1 | W3 | 7 | Sonnet | ~30% |
| 1 | W4 | 4 | Sonnet | ~15% |
| 2 | W1 | 6 | Haiku | ~4% |
| 2 | W2 | 2 shards | Opus | ~20% |
| 2 | W3 | 7 | Sonnet | ~30% |
| 2 | W4 | 4 | Sonnet | ~15% (Sui gas externalized) |
| 3 | W1-W4 | ~19 | mix | ~25% total |

**Hard stop:** if any Wave 4 loops > 3 times, halt and escalate. If cycle 2 Sui
testnet settlement doesn't close deterministically after 3 loops — STOP. That
is the load-bearing claim of the whole doc; don't paper over it.

---

## Status

- [x] **Cycle 1: WIRE** — list SKUs, surface prices, discovery works
  - [x] W1 — Recon (Haiku × 7, parallel)
  - [x] W2 — Decide (Opus × 2 shards)
  - [x] W3 — Edits (Sonnet × 7, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel by rubric dim)
- [x] **Cycle 2: PROVE** — bounties escrow + release on rubric-verified close
  - [x] W1 — Recon (Haiku × 6, parallel)
  - [x] W2 — Decide (Opus × 2 shards) — artifact: [TODO-marketplace-c2-w2.md](TODO-marketplace-c2-w2.md) · scope collapsed 7→4 files (Move + sui.ts + persist.ts + bridge.ts already done)
  - [x] W3 — Edits (Sonnet × 4, parallel) — E1 bounty.ts (6 wire-format deltas, 145→178) · E2 BountyForm.tsx (4 deltas) · E3 human.ts `+claim` (86→101) · E4 bounty.test.ts new (213, skip-gated)
  - [x] W4 — Verify (Sonnet × 4, parallel by rubric dim) — fit 0.90 ✓ · form 0.78 ✓ · truth 0.85 ✓ · taste 0.82 ✓ · avg 0.849 · gate ≥ 0.65 met on all dims · W3.5 fixes: `persist.ts settle()` now rubric-gated (all dims ≥ threshold before release), `bounty/[id].ts` passes rubric scores to settle(), `market/BountyCard` + `BountyComposer` wired with shadcn Button/Badge/Input + emitClick · 860/860 tests pass · biome clean · design token baseline 401
- [x] **Cycle 3: GROW** — 2% fee, hardened highway bundles, first paying world ✓ 2026-04-16
  - [x] W1 — Recon (Haiku × 6, parallel) — fee_bps location (lines 168+681) · no harden() exists (greenfield) · bundle=highway+skill-sum · 11 donal agents all group:marketing · parseDirectory+syncWorld exist
  - [x] W2 — Decide: set_fee_bps(200) via admin fn (no redeploy) · bundle as read-only GET endpoint · sync-donal-world.ts wraps parseDirectory+syncWorld
  - [x] W3 — Edits (Sonnet × 3, parallel): `scripts/set-fee-bps.ts` (152 lines, calls set_fee_bps with 200n, before/after verify) · `src/pages/api/market/bundle/[id].ts` (111 lines, highway→bundle with totalPrice, injection-safe) · `scripts/sync-donal-world.ts` (80 lines, 11 donal agents → TypeDB group 'donal')
  - [x] W4 — Verify: fit 1.00 · form 0.90 · truth 0.93 · taste 0.85 · avg 0.938 · 860/860 tests · biome clean · schema role names source/target verified · 500 status fixed
  - [x] **C3 scope expansion** (parallel session, 8 agents) — A1/A2/A3 audited-and-patched existing scripts+tenant endpoint · A4 `src/lib/tenancy.ts` new (70 LOC: parseTenant + enforceQuota) · A5 `export/highways.ts` populates revenue + traversals from TypeDB, successRate derived (72→85) · A6 `bundle/[id].ts` added step ordering + POST activation · A7 `persist.settle()` emits fee-audit signal to `treasury:one` (+41 LOC, 947 total) · A8 UI audit: **ALERT** — `Marketplace/BountyForm` and `market/BountyComposer` POST incompatible wire formats to `/api/market/bounty` (nested `content:{}` vs flat); merge recommended · verify: 439/439 engine tests pass, biome clean on all 7 touched files · artifact: [TODO-marketplace-c3-w2.md](TODO-marketplace-c3-w2.md)

---

## Execution

```bash
/do TODO-marketplace.md              # advance current wave
/do TODO-marketplace.md --auto       # run W1→W4 until cycle gate
/see highways --limit 10             # watch paths harden (cycle 3 gate)
/see tasks --tag marketplace         # open work
```

---

## Task Metadata (for substrate sync)

```yaml
- id: mkt.c1.list
  wave: W3
  value: 8    # first $ depends on listing working
  effort: 3
  phase: WIRE
  persona: sonnet
  blocks: [mkt.c2.bounty]
  exit: "/api/market/list returns ≥5 rows with price + strength"
  tags: [marketplace, astro, react, P0]

- id: mkt.c2.bounty
  wave: W3
  value: 10   # first $ settles here
  effort: 5
  phase: PROVE
  persona: sonnet
  blocks: [mkt.c3.fee, mkt.c3.tenant]
  exit: "testnet tx confirms escrow→close→release on rubric-verified bounty"
  tags: [marketplace, sui, move, escrow, P0]

- id: mkt.c3.fee
  wave: W3
  value: 9    # margin captured
  effort: 2
  phase: GROW
  persona: sonnet
  blocks: []
  exit: "treasury balance increments by 2% of each settled bounty"
  tags: [marketplace, revenue, persist, P0]

- id: mkt.c3.tenant
  wave: W3
  value: 10   # first real customer
  effort: 4
  phase: GROW
  persona: sonnet
  blocks: []
  exit: "OO Agency branded world live + first invoice issued"
  tags: [marketplace, premium-world, oo-agency, P0]
```

---

## See Also

- [marketplace.md](marketplace.md) — source of truth (SKUs, revenue, phases)
- [landing-page.md](landing-page.md) — the funnel this feeds
- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [TODO-template.md](TODO-template.md) — the shape this follows
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- [TODO-SUI.md](TODO-SUI.md) — Sui integration phases (cycle 2 depends on Phase 2)
- [agent-launch-copy-plan.md](agent-launch-copy-plan.md) — seller-side onboarding
- `src/engine/persist.ts` — settlement point, fee lands here
- `src/move/one/sources/one.move` — escrow + payment
- `src/engine/human.ts` — humans as units (cycle 2 reverse hire)

---

*3 cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes, Sonnet
checks. Cycle 1 = listing. Cycle 2 = first $. Cycle 3 = compounding $ + first
paying world.*
