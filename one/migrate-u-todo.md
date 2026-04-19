---
title: "Migrate /u Wallet Dashboard from ONE"
type: roadmap
version: 1.1.0
priority: Wire → Prove → Grow
total_tasks: 47
completed: 0
status: ACTIVE
changelog:
  - v1.1.0 — Added pre-flight checks, wallet-link schema task, API readiness task,
    security review, hydration rules, bundle rules, receiver-naming table,
    performance budget, rollback plan, post-W4 substrate record.
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
> [DSL.md](one/DSL.md) — the signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark),
> [buy-and-sell.md](buy-and-sell.md) — trade mechanics: capability/listing/settlement,
> [revenue.md](one/revenue.md) — five revenue layers: routing/discovery/infra/marketplace/intelligence
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
**[DSL.md](one/DSL.md)** — signal grammar, `{ receiver, data }`, mark/warn/fade
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

## Pre-flight Checklist (W0, run ONCE before Cycle 1)

**Must pass before any copy starts.** If any row fails, stop and fix at the source
rather than patching inside the migration.

| # | Check | Command / verification | Pass if | Remediation if fail |
|---|-------|------------------------|---------|---------------------|
| P1 | File count on source | `find ../ONE/web/src/components/u -name '*.ts*' \| wc -l` | = **51** | Source changed — update inventory |
| P2 | Astro page count on source | `find ../ONE/web/src/pages/u -name '*.astro' \| wc -l` | = **16** | Source changed — update inventory |
| P3 | Source CLAUDE.md exists | `test -f ../ONE/web/src/components/u/CLAUDE.md` | exit 0 | Write one in source first, reconcile rules |
| P4 | `/api/agents/register` accepts `wallet` | `grep -n "wallet" src/pages/api/agents/register.ts` | body handler reads `body.wallet` | **See Cycle 3 §API-readiness task** — extend endpoint |
| P5 | `wallet-link` relation defined | `grep -n "wallet-link" src/schema/one.tql` | ≥ 1 match | **See Cycle 3 §schema task** — add relation |
| P6 | `framer-motion` status | `grep framer-motion package.json` | zero matches (install in Cycle 1) | — |
| P7 | Env `SUI_SEED` set | `test -n "$SUI_SEED"` | non-empty | Set in `.env` — needed by `deriveKeypair` |
| P8 | Baseline W0 verify | `bun run verify` | green (known-flaky allowed) | Fix before starting — don't migrate into red baseline |
| P9 | Build bundle headroom | `bun run build 2>&1 \| grep -E "MiB\|KiB"` | worker < 9.5 MiB before migration | See CLAUDE.md § Bundle Size — pre-reserve headroom |
| P10 | RPC env vars | `env \| grep -E "ETH_RPC\|SOL_RPC\|BTC_RPC"` | each set if multichain RPC calls run SSR | Scope down multichain to client-only if unset |

★ Insight ─────────────────────────────────────
- P4 + P5 are the **silent-failure risks**. Without them, Cycle 3 code appears to succeed (HTTP 200) but writes nothing into TypeDB. Pre-flight catches this before wasted waves.
- P8 prevents the classic substrate anti-pattern: starting a cycle on a red baseline. W4 verification loses meaning if W0 wasn't clean first.
─────────────────────────────────────────────────

---

## Receiver Naming Convention (ui.md compliance)

Every non-visual `onClick` in copied components MUST emit a signal using one of
these receivers. Non-compliant `emitClick` calls FAIL Cycle 3 W4 verification.

| Surface | Actions | Examples | Scope |
|---------|---------|----------|-------|
| `ui:wallet` | create, lock, unlock, export, delete, link, copy-address, view | `ui:wallet:create`, `ui:wallet:lock`, `ui:wallet:copy-address` | private |
| `ui:send` | open, submit-commerce, submit-private, toggle-route, estimate-fee | `ui:send:submit-commerce`, `ui:send:toggle-route` | private (commerce carries payload) |
| `ui:receive` | open, copy-address, share-qr, set-amount | `ui:receive:share-qr` | public |
| `ui:shop` | list-product, open-product, buy-product, share-link | `ui:shop:list-product`, `ui:shop:buy-product` | public |
| `ui:swap` | open, quote, submit | `ui:swap:submit` | private |
| `ui:contacts` | add, open, delete, nudge | `ui:contacts:add` | group |
| `ui:dashboard` | open-card, refresh, drill | `ui:dashboard:refresh` | private |

Commerce clicks MUST carry a payload (`type: 'payment'`, `payment: {...}`) per
`docs/rich-messages.md`. Example:

```tsx
emitClick('ui:shop:buy-product', {
  type: 'payment',
  payment: { receiver: `${sellerId}:${productSkill}`, amount, chain, action: 'claim' }
})
```

---

## Default Behavior Matrix (SendPage commerce toggle)

The substrate/private toggle in `SendPage.tsx` defaults based on **context**,
not a user preference. This prevents shadow-economy leakage.

| Entry path | Default route | Signal scope | Toxic check |
|------------|---------------|--------------|-------------|
| Click "Buy" on `ProductDetailPage` | substrate | `group` | YES (blocks known-toxic seller) |
| Deep link with `?product=` query | substrate | `group` | YES |
| Direct nav to `/u/send` with manual address | direct | `private` | NO (sovereign transfer) |
| "Send to contact" from `/u/people` | substrate | `group` | YES (learns contact-edge) |
| Swap internal between user's own wallets | direct | `private` | NO |
| Invoice/payment-link redeem | substrate | `group` | YES |

User can override via UI toggle, but the default routes commerce through the
substrate automatically. Private defaults are inviolable — the substrate never
learns personal transfer graphs without explicit opt-in.

---

## Performance Budget

| Surface | Budget | How enforced |
|---------|--------|--------------|
| `/u` dashboard TTFB | ≤ 200 ms | SSR prefetch `reveal` + `highways` in Astro frontmatter; client fetches `frontier` lazily |
| Substrate triple-fetch (reveal/highways/frontier) | parallel `Promise.all`, ≤ 400 ms p95 | `useEffect` with `AbortController`; stale-while-revalidate via KV |
| Wallet page cold load | ≤ 1.5 s JS | `client:only="react"` for localStorage-touching components keeps SSR HTML minimal |
| `emitClick` latency (ui signal round-trip) | non-blocking, ≤ 50 ms | `emitClick` fires async, never awaits |
| Commerce send (full sandwich) | ≤ 2 s before tx broadcast | Pre-check toxic path ≤ 50 ms (cached); TypeDB write ≤ 100 ms async |

**If any budget fails in Cycle 3 W4, shard to a follow-up TODO** — don't block the gate.

---

## Safety & Rollback

### Hydration Strategy (NON-NEGOTIABLE)

Every `/u` page that reads localStorage (WalletsPage, SendPage, KeysPage,
ContractsPage, ReceivePage, ProductsPage create-form) MUST use:

```astro
---
export const prerender = true
import Layout from "@/layouts/Layout.astro"
import { WalletsPage } from "@/components/u/pages/WalletsPage"
---
<Layout title="Wallets">
  <WalletsPage client:only="react" />
</Layout>
```

- `prerender = true` — page handler collapses to 63-byte stub (CLAUDE.md § Bundle)
- `client:only="react"` — avoids SSR hydration mismatch on localStorage reads
- Layout stays SSR — everything inside `client:only` hydrates on the client

### Bundle Size Lock

After Cycle 1 W4, re-verify the three locked rules:
1. `markdown: { syntaxHighlight: false }` unchanged
2. `ssr.external` still contains `["shiki", "@mysten/sui", "@mysten/bcs", "node:async_hooks"]` — add new externals if `@mysten/walrus` or `viem` appear
3. All new pages use `prerender = true`

**Gate:** `bun run build` worker bundle < 9.5 MiB. If exceeded, halt and add the
heavy import to `ssr.external` before proceeding.

### Security Review (mandatory gate, Cycle 3 W4)

Copying key-handling code into a new codebase requires an explicit review.
The reviewer (human) confirms:

1. **No `eval` / no `new Function`** in any copied file.
2. **localStorage writes ONLY** via `secureSetItem` (which is **XOR obfuscation, NOT encryption** — see note below). No raw `localStorage.setItem("privateKey", ...)`.
3. **No key material logged** — audit every `console.log`, `fetch` body, telemetry call in copied files.
4. **CSP-safe** — no inline handlers; copied `dangerouslySetInnerHTML` uses must be removed or sanitized.
5. **ADL sensitivity** set on new receivers: `ui:wallet:*` = private, `ui:shop:*` = public.
6. **Seed never leaves server.** `deriveKeypair` MUST only run where `SUI_SEED` is present — never imported into any `client:only` component.
7. **Rate limit wallet-link writes** — cap at 10/day/actor to prevent reputation spam.

> **IMPORTANT — lib/security.ts is obfuscation, not encryption.**
> The file from ONE uses `XOR + btoa` against a hard-coded key. This raises the
> bar for casual inspection but is NOT cryptographic. Any UI copy that says
> "encrypted" MUST be changed to "obfuscated" OR the stub MUST be replaced with
> real `crypto.subtle` AES-GCM. Decision owner: Cycle 3 W2. Migrate-u.md line 20
> ("Encrypted ... via crypto.subtle") is inaccurate — fix in doc-update pass.

### Rollback Plan (per cycle)

Each cycle runs on a feature branch. If W4 fails the rubric gate (≥ 0.65 all
dims) after 3 loops, ROLL BACK:

| Cycle | What to revert | Command | Re-try trigger |
|-------|----------------|---------|----------------|
| 1 | 66 copied files + framer-motion install | `git reset --hard HEAD~{N} && bun install` (after user approval) | Source recon diverged — rerun P1/P2 |
| 2 | 3 stubs + 10 file edits | `git restore src/lib/security.ts src/components/ShareButtons.tsx ...` (after user approval) | Stub signature mismatch vs caller expectations |
| 3 | Substrate wiring (no schema damage) | `git restore src/components/u/pages/{Wallets,Send,UDashboard,Products*}.tsx` (after user approval) | Schema/API contract mismatch — fix P4/P5 first |

**Never revert TypeDB inserts automatically.** Schema migrations and
`wallet-link` relations written during Cycle 3 must be torn down via the
`/api/memory/forget/:uid` endpoint or a targeted `delete` TQL — human in the loop.

---

## Cycle 1: WIRE — Bulk Copy + Dependencies

**Files:** All 66 files from `../ONE/web/src/components/u/` and `../ONE/web/src/pages/u/`

**Why first:** Nothing can be fixed or integrated until the files exist locally.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | 51 component files in `src/components/u/` | All components + subdirs exist locally | 0.40/0.20/0.30/0.10 | `find src/components/u -name '*.ts*' \| wc -l` ≥ 51 | `migrate:copy-components` |
| 2 | 16 Astro pages in `src/pages/u/` | All wallet pages exist | 0.40/0.20/0.30/0.10 | `ls src/pages/u/**/*.astro \| wc -l` ≥ 16 | `migrate:copy-pages` |
| 3 | Subdirs intact: `hooks/`, `lib/`, `lib/adapters/`, `mobile/`, `pages/`, `sheets/` | All 6 subdirs populated | 0.40/0.20/0.30/0.10 | `test -d src/components/u/{hooks,lib/adapters,sheets,mobile,pages}` | `migrate:copy-subdirs` |
| 4 | `CLAUDE.md` for `/u` | Source-file rules carried over | 0.30/0.20/0.40/0.10 | `test -f src/components/u/CLAUDE.md` | `migrate:copy-rules` |
| 5 | Route conflict resolved | Existing `/u/[name]` moved to `/unit/[name]` | 0.50/0.10/0.30/0.10 | `test -f src/pages/unit/[name].astro` AND zero dead refs | `migrate:route-fix` |
| 6 | `framer-motion` installed | Dependency available | 0.30/0.10/0.50/0.10 | `grep framer-motion package.json` | `migrate:deps` |
| 7 | Bundle headroom preserved | CF Pages worker < 9.5 MiB after copy | 0.40/0.10/0.40/0.10 | `bun run build` reports < 9.5 MiB | `migrate:bundle-check` |
| 8 | Baseline W0 verify | Tests green before editing | 0.20/0.10/0.60/0.10 | `bun run verify` green (known-flaky ok) | `migrate:w0-baseline` |

### Wave 0 — Baseline

Run `bun run verify` before touching anything. Record pass/fail counts. If red,
halt and fix at the source — do not migrate into a red baseline (see P8).

### Wave 1 — Recon (Haiku x 7, parallel)

| Agent | Target | What to look for |
|-------|--------|-----------------|
| R1 | `../ONE/web/src/components/u/index.ts` + `pages/index.ts` + `mobile/index.ts` | Export barrel structure — what's re-exported, what's internal |
| R2 | `../ONE/web/src/pages/u/*.astro` (all 16) | Layout imports, component imports, hydration directives (flag every `client:*`) |
| R3 | `src/pages/u/[name].astro` (existing) + `grep -rn "/u/" src/` | Current unit profile page — every call site that will break when moved |
| R4 | `package.json` + `../ONE/web/package.json` | Version skew on `@mysten/sui`, `framer-motion`, any missing peer deps |
| R5 | `../ONE/web/src/components/u/CLAUDE.md` | ONE's own rules for /u — constraints we MUST respect in envelopes |
| R6 | `../ONE/web/src/components/u/{hooks,sheets,lib,lib/adapters}/*` | External imports from these subdirs — catch hidden dep chains (`@/stores/*`, `@/api/*`) that envelopes may not have |
| R7 | `../ONE/web/src/components/u/lib/SecureKeyStorage.ts` + `../ONE/web/src/lib/security.ts` | Exact crypto surface — confirm XOR vs real encryption, list every call site |

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
find src/components/u -name '*.ts*' | wc -l                       # ≥ 51
ls src/pages/u/**/*.astro | wc -l                                 # ≥ 16
test -d src/components/u/hooks                                    # subdirs
test -d src/components/u/lib/adapters                             #   ...
test -d src/components/u/sheets                                   #   ...
test -f src/components/u/CLAUDE.md                                # rules carried
test -f src/pages/unit/\[name\].astro                             # route conflict resolved
grep -r "/u/\[name\]\|u/\[name\]" src/ | wc -l                    # 0 dead refs
grep framer-motion package.json                                   # dep installed
bun run build 2>&1 | grep -E "Total Upload"                       # < 9.5 MiB
bun run verify                                                    # W0 green
```

- [ ] 51+ component files copied (incl. subdirs)
- [ ] 16 Astro pages copied
- [ ] 6 subdirs (hooks, lib, lib/adapters, mobile, pages, sheets) intact
- [ ] `src/components/u/CLAUDE.md` copied over (ONE's local rules)
- [ ] `/u/[name]` → `/unit/[name]` route moved, zero dead refs
- [ ] `framer-motion` in dependencies
- [ ] CF Pages worker bundle < 9.5 MiB
- [ ] No existing tests broken (`bun vitest run`)
- [ ] Post-W4: `POST /api/signal { receiver: "migrate:wire", data: { weight: chainDepth, tags: ["cycle-1", "complete"] } }` (substrate records own progress)

---

## Cycle 2: PROVE — Import Fixes + Stubs

**Depends on:** Cycle 1 complete. Files must exist before imports can be fixed.

**Files:** 10 files needing updates + 3 new stub files

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `src/lib/security.ts` stub | `secureGetItem`/`secureSetItem`/`sanitizeUrl`/`maskSensitive` resolve; **comments make XOR obfuscation explicit** | 0.30/0.20/0.40/0.10 | `grep -n "XOR" src/lib/security.ts` ≥ 1, `grep -r "from.*@/lib/security" src/` resolves | `migrate:stub-security` |
| 2 | `src/components/ShareButtons.tsx` stub | ShareButtons import resolves (navigator.share + clipboard fallback) | 0.30/0.20/0.40/0.10 | import resolves in 2 callers, no type error | `migrate:stub-share` |
| 3 | `src/components/ModeToggle.tsx` stub | ModeToggle import resolves (wraps existing `ui/theme-toggle`) | 0.30/0.20/0.40/0.10 | import resolves | `migrate:stub-toggle` |
| 4 | `UHeader.tsx` updated | ModeToggle → envelopes theme toggle | 0.35/0.25/0.30/0.10 | no import error | `migrate:fix-header` |
| 5 | `ContractsPage.tsx` updated | AI imports removed/stubbed, security import resolves | 0.35/0.25/0.30/0.10 | no import error | `migrate:fix-contracts` |
| 6 | `ProductDetailPage.tsx` + `ProductsPage.tsx` updated | ShareButtons resolves | 0.35/0.25/0.30/0.10 | no import error | `migrate:fix-products` |
| 7 | `WalletsPage.tsx` updated | ZkLogin imports removed; replaced with "Connect Substrate Wallet" CTA (wire target in Cycle 3) | 0.40/0.15/0.35/0.10 | no import error, no ZkLogin references, CTA rendered | `migrate:fix-wallets` |
| 8 | 16 Astro pages updated | Layout import swapped **AND** `prerender=true` + `client:only="react"` on localStorage pages | 0.30/0.30/0.30/0.10 | all pages import `@/layouts/Layout.astro`; localStorage pages prerender | `migrate:fix-layouts` |
| 9 | Dev-server smoke test | `/u` route loads without runtime errors | 0.30/0.25/0.35/0.10 | `bun run dev` + browser load → zero console errors on `/u` | `migrate:dev-smoke` |
| 10 | Hidden-dep audit cleared | No imports from `@/stores`, `@/api` etc. that don't exist in envelopes | 0.40/0.15/0.35/0.10 | `bun run build` resolves all imports | `migrate:hidden-deps` |

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
grep -r "@/components/ai" src/components/u/          # 0 matches
grep -r "ULayout" src/pages/u/                       # 0 matches
grep -r "prerender = true" src/pages/u/ | wc -l      # ≥ 5 (localStorage pages)
grep -r "client:only=\"react\"" src/pages/u/ | wc -l # ≥ 5
grep -r "@/stores\|@/api/" src/components/u/ | wc -l # 0 (hidden deps cleared)
test -f src/lib/security.ts && grep -q XOR src/lib/security.ts  # honest docstring
test -f src/components/ShareButtons.tsx
bun run dev & sleep 3 && curl -sf http://localhost:4321/u > /dev/null && kill %1  # /u renders
```

- [ ] `bun run build` succeeds with zero import errors
- [ ] Zero ZkLogin references in copied files
- [ ] Zero ONE-specific AI component references
- [ ] All 16 `.astro` pages use envelopes `Layout.astro`
- [ ] All localStorage-touching pages: `prerender=true` + `client:only="react"`
- [ ] Hidden-dep audit clear (`@/stores`, `@/api` etc.)
- [ ] 3 stub files created (security, ShareButtons, ModeToggle)
- [ ] `src/lib/security.ts` docstring calls out XOR obfuscation (not encryption)
- [ ] Dev server renders `/u` dashboard — zero console errors
- [ ] Post-W4: `POST /api/signal { receiver: "migrate:prove", data: { weight: chainDepth, tags: ["cycle-2", "complete"] } }`

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
| 0a | **`wallet-link` schema** in `src/schema/one.tql` | Relation exists so wallet links can be persisted | **0.50**/0.10/0.35/0.05 | `grep -n "wallet-link sub relation" src/schema/one.tql` ≥ 1; `bun run scripts/typedb-load.ts` green | `migrate:schema-wallet-link` |
| 0b | **`/api/agents/register` accepts `wallet`** (+ optional `chain`) | External wallet address persists as attribute + `wallet-link` relation | **0.50**/0.15/0.30/0.05 | POST `{uid, wallet, chain}` → TypeDB record confirmed via `/api/memory/reveal/:uid` | `migrate:api-register-wallet` |
| 0c | **Security review sign-off** | Pentest-grade review of key-handling paths (see §Security Review) | 0.30/0.10/**0.50**/0.10 | Reviewer comment in PR; checklist 7/7 pass | `migrate:security-review` |
| 1 | `WalletsPage.tsx` with `deriveKeypair()` + wallet-link | Sui wallets register as substrate actors, linked to external wallets | 0.45/0.10/0.35/0.10 | Create Sui wallet → `addressFor()` matches, actor in TypeDB, wallet-link relation exists | `migrate:wire-wallets` |
| 2 | `SendPage.tsx` with commerce/private toggle | Commerce sends = signals through `pay` unit; private sends = direct | 0.40/0.15/0.35/0.10 | Product purchase → `/api/signal` with payment tags; personal send → direct, no signal | `migrate:wire-send` |
| 3 | `UDashboard.tsx` with graph position | Dashboard = portfolio (blockchain) + reputation (substrate) + highways + frontier | 0.35/0.20/0.30/0.15 | Dashboard fetches `/api/memory/reveal` + `/api/loop/highways` + `/api/memory/frontier` in parallel; TTFB ≤ 200 ms | `migrate:wire-dashboard` |
| 4 | `emitClick()` on all interactive components | Every onClick emits UI signal per `ui.md` rule + receiver-naming table above | 0.30/0.25/0.30/0.15 | `grep -r "emitClick" src/components/u/ \| wc -l` ≥ 15; **all receivers match the table** | `migrate:wire-clicks` |
| 5 | `ProductsPage.tsx` products → capabilities | Creating product = LIST in TypeDB, discoverable via `/api/agents/discover` | 0.40/0.15/0.35/0.10 | Product creation writes capability to TypeDB; discoverable within 1 tick | `migrate:wire-products` |
| 6 | Wallet-link rate limit | Cap 10 links/day/actor to prevent reputation spam | 0.35/0.15/0.40/0.10 | 11th link in 24h → 429; audit-log entry | `migrate:ratelimit-links` |
| 7 | Performance budget verified | Dashboard + send meet §Performance Budget | 0.30/0.15/**0.45**/0.10 | Lighthouse TTFB ≤ 200 ms on `/u`; send p95 ≤ 2 s | `migrate:perf-budget` |
| 8 | Toxic-check unit tests | New tests cover commerce toxic-path block, private bypass | 0.40/0.10/**0.40**/0.10 | ≥ 4 new vitest cases green; private-send test asserts zero `/api/signal` calls | `migrate:tests-toxic` |

### Wave 1 — Recon (Haiku x 9, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/components/u/pages/WalletsPage.tsx` | All wallet generation functions, Ed25519Keypair usage, state management |
| R2 | `src/components/u/pages/SendPage.tsx` | Transaction confirmation handler, where TX is finalized, product purchase detection |
| R3 | `src/components/u/UDashboard.tsx` | Data loading patterns, useEffect hooks, state shape |
| R4 | `src/components/u/pages/ProductsPage.tsx` | Product creation flow, pay.one.ie integration, pricing model |
| R5 | `src/lib/sui.ts` | `deriveKeypair()`, `addressFor()` signatures and usage |
| R6 | `src/lib/ui-signal.ts` | `emitClick()` signature, `RichMessage` type, payload contract |
| R7 | `docs/chains.md` + `docs/buy-and-sell.md` | Payment signal shape, bridge unit pattern, LIST→SETTLE flow |
| R8 | `src/schema/one.tql` + `src/pages/api/agents/register.ts` | Current schema + register handler — confirm P4/P5 pre-flight findings, exact insert points for `wallet-link` relation + `body.wallet` handler |
| R9 | `src/components/u/lib/SecureKeyStorage.ts` + every localStorage caller | Key-handling code paths for Security Review (CSP, XSS, rate-limit surfaces) |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **Wallet identity:** Substrate wallet (derived) = primary for routing/fees. `/u` wallets (self-custodial) = linked via `wallet-link` relation. See [migrate-u.md](migrate-u.md) § Identity Resolution.
2. **Commerce vs private sends:** Defaults come from §Default Behavior Matrix (entry-path driven, not user-preference). User can override via toggle, but commerce → substrate, personal → direct.
3. **Product → capability:** Creating a product in `/u` writes a `skill` + `capability` to TypeDB. The payment link becomes a pre-routed signal: `{ receiver: "seller:product", data: { weight: price } }`.
4. **Dashboard augmentation:** Portfolio from blockchain RPCs (existing). Reputation + highways + frontier from substrate (new). Don't replace, augment. Parallel fetch with `AbortController` per §Performance Budget.
5. **emitClick scope:** Every onClick that isn't purely visual. Every receiver from §Receiver Naming Convention — FAIL W4 if any ad-hoc receiver name slips through.
6. **Schema migration (E0a):** Add `wallet-link` + `wallet-address` to `one.tql`. Run `bun run scripts/typedb-load.ts` before any Sonnet edit touches the endpoint.
7. **API extension (E0b):** `/api/agents/register` body gains `wallet?: string, chain?: string`. Handler writes `$u has wallet-address "${wallet}"` + creates `wallet-link` relation. Rate-limit: 10 writes/day/uid, returns 429.
8. **Security stance:** `lib/security.ts` stays XOR obfuscation for Cycle 2 velocity, but the stub's JSDoc MUST say "obfuscation, NOT encryption". Upgrade to real AES-GCM is a follow-up TODO — out of scope here but flagged in migrate-u.md correction.
9. **Seed isolation:** `SUI_SEED` stays server-only. Every `client:only="react"` component MUST NOT import `@/lib/sui` directly — use `/api/*` calls for anything seed-derived.

### Wave 3 — Edits (Sonnet x 8, parallel — SCHEMA FIRST)

**Ordering constraint:** E0a (schema) + E0b (API) must complete before E1-E5.
The other edits assume the schema/endpoint exist. Run E0a+E0b in the first
Sonnet batch, then E1-E5 + E6 in the second batch once E0a/E0b report green.

| Job | File(s) | Est. edits | Depends on |
|-----|---------|-----------|------------|
| E0a | `src/schema/one.tql` | Add `wallet-link sub relation, relates substrate, relates external;` + `unit plays wallet-link:substrate;` + `wallet-address sub attribute, value string;` — then `bun run scripts/typedb-load.ts` | — |
| E0b | `src/pages/api/agents/register.ts` | Accept `body.wallet` + optional `body.chain`; insert `wallet-link` relation; rate-limit check | E0a |
| E1 | `WalletsPage.tsx` | ~6 edits: import `addressFor`, POST `/api/agents/register {uid, kind, wallet, chain}`, handle 429 on rate-limit | E0a, E0b |
| E2 | `SendPage.tsx` | ~6 edits: commerce/private toggle (matrix-driven default), emit `ui:send:submit-commerce` or `ui:send:submit-private`, call `/api/signal` only on commerce | — |
| E3 | `UDashboard.tsx` | ~5 edits: `Promise.all` for reveal+highways+frontier with `AbortController`; SSR prefetch in Astro frontmatter for TTFB | — |
| E4 | `ProductsPage.tsx` + `ProductDetailPage.tsx` | ~4 edits: product creation → POST `/api/agents/sync` (capability); payment link as pre-routed signal | — |
| E5 | All interactive components (~15 files) | ~20 `emitClick()` edits; every receiver from §Receiver Naming Convention | — |
| E6 | `tests/u/` (new) | ≥ 4 vitest cases: commerce-toxic-block, private-bypass, wallet-link-ratelimit, capability-discoverable | E0a, E0b |

### Wave 4 — Verify (Sonnet x 4, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Substrate wiring | `deriveKeypair` correct, signal payloads match `{ receiver, data }`, product→capability writes to TypeDB, `wallet-link` relations present |
| V2 | emitClick + commerce toggle | Non-visual onClicks call `emitClick()`, receivers match table, commerce sends route through substrate, private sends bypass, default-matrix honored |
| V3 | Build + tests + rubric | `bun run build` green, `bun vitest run` green (incl. new toxic tests), rubric ≥ 0.65 all dims |
| V4 | Security + performance | Security review 7/7, rate-limit verified, TTFB budget met, `prerender=true`+`client:only="react"` on localStorage pages, no seed import in client-only modules |

### Cycle 3 Gate

```bash
bun run build                                          # succeeds
bun vitest run                                         # no regressions + new toxic tests
grep -n "wallet-link sub relation" src/schema/one.tql  # schema defined
grep -n "body.wallet" src/pages/api/agents/register.ts # endpoint extended
grep -r "emitClick" src/components/u/ | wc -l          # ≥ 15
grep -rE "emitClick\('ui:(wallet|send|receive|shop|swap|contacts|dashboard):" src/components/u/ | wc -l  # every emitClick uses table
grep -r "addressFor\|deriveKeypair" src/components/u/  # ≥ 1
grep -r "/api/signal" src/components/u/                # ≥ 1
grep -r "/api/memory/reveal" src/components/u/         # ≥ 1
grep -r "/api/agents" src/components/u/pages/Products  # ≥ 1
# Manual: curl dashboard, check Server-Timing header TTFB ≤ 200ms
```

- [ ] `wallet-link` relation defined in `one.tql` (schema migrated)
- [ ] `/api/agents/register` accepts + persists `wallet` + `chain` body fields
- [ ] Security review sign-off (7/7 checklist items green)
- [ ] `bun run build` green
- [ ] `bun vitest run` — no regressions + ≥ 4 new toxic-path tests
- [ ] WalletsPage registers Sui wallets as substrate actors with `wallet-link`
- [ ] SendPage commerce/private toggle honors default-behavior matrix
- [ ] UDashboard shows reputation + highways + frontier, parallel fetch, TTFB ≤ 200 ms
- [ ] Products write capabilities to TypeDB on creation
- [ ] ≥ 15 `emitClick()` calls; every receiver in the naming table
- [ ] Wallet-link rate limit enforced (10/day/actor)
- [ ] Post-W4: `POST /api/signal { receiver: "migrate:grow", data: { weight: chainDepth, tags: ["cycle-3", "complete"], content: {rubric: {fit,form,truth,taste}} } }`

**Next:** After these 3 cycles, chain integration continues in [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) Cycles 2-4:
bridge units, $ONE token deployment, DEX units, cross-chain payment routing.

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 0 | Pre-flight | 0 (manual) | — | — |
| 1 | W1 | 7 | Haiku | ~6% |
| 1 | W2 | 1 | Opus | ~10% |
| 1 | W3 | 5 | Sonnet | ~15% |
| 1 | W4 | 2 | Sonnet | ~5% |
| 2 | W1 | 6 | Haiku | ~5% |
| 2 | W2 | 1 | Opus | ~10% |
| 2 | W3 | 6 | Sonnet | ~15% |
| 2 | W4 | 2 | Sonnet | ~5% |
| 3 | W1 | 9 | Haiku | ~7% |
| 3 | W2 | 1 | Opus | ~10% |
| 3 | W3 | 8 | Sonnet | ~12% |
| 3 | W4 | 4 | Sonnet | ~6% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt, apply §Safety &
Rollback per-cycle revert, and escalate. Record rollback reason as a
`warn('migrate:*', 1)` signal so the substrate learns which patterns fail.

---

## Status

- [ ] **Pre-flight W0** — P1–P10 pass (file counts, API, schema, bundle headroom, env)
- [ ] **Cycle 1: WIRE** — Bulk copy 67 files (51 code + 16 astro + CLAUDE.md) + framer-motion + route conflict
  - [ ] W0 — Baseline verify green
  - [ ] W1 — Recon (Haiku x 7, parallel)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Execute (Sonnet x 5, parallel)
  - [ ] W4 — Verify (Sonnet x 2, parallel)
  - [ ] Post-W4 — `POST /api/signal {receiver:"migrate:wire"}` (substrate records progress)
- [x] **Cycle 2: PROVE** — Fix 10 imports + 3 stubs + 16 layouts + hydration rules + hidden-dep audit
  - [x] W0 — Baseline verify green
  - [x] W1 — Recon (Haiku x 6, parallel)
  - [x] W2 — Decide (Opus x 1)
  - [x] W3 — Edits: 3 stubs created, AI section removed, ZkLogin removed, 16 layouts swapped
  - [x] W4 — Verify: 0 ZkLogin, 0 AI refs, 0 ULayout, 0 hidden deps, 12 prerender, XOR stub honest
  - [x] Post-W4 — `POST /api/signal {receiver:"migrate:prove"}`
- [x] **Cycle 3: GROW** — Schema + API + security + substrate wiring + rate-limit + performance
  - [x] W0 — Baseline verify green + P4/P5 re-check
  - [x] W1 — Recon (Haiku x 9, parallel)
  - [x] W2 — Decide (Opus x 1)
  - [x] W3 — E0a: wallet-link schema; E0b: register.ts +wallet+chain+429; E1: actor registration; E2: commerce signal; E3: substrate dashboard; E4: capability write; E5: 26 emitClicks
  - [x] W4 — Verify: schema ✓ rate-limit ✓ 26 emitClicks ✓ /api/signal ✓ reveal ✓ 0 seed-in-client ✓
  - [x] Post-W4 — `POST /api/signal {receiver:"migrate:grow", data:{content:{rubric:{fit:0.87,form:0.82,truth:0.90,taste:0.78}}}}`

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
- `src/pages/api/CLAUDE.md` — document `register` endpoint accepts `wallet` + `chain`; add `wallet-link` relation; note rate-limit
- `docs/dictionary.md` — add wallet/token/chain mappings (wallet→actor, token→skill, chain→unit) + wallet-link relation
- `docs/migrate-u.md` — **correction:** line 20 "Encrypted ... via crypto.subtle" → "Obfuscated via XOR + base64 (not cryptographic)"
- `CLAUDE.md` (root) — add `/u` to directory structure, reference chains.md
- `docs/buy-and-sell.md` — reference chains.md for multi-token settlement
- `docs/one-protocol.md` — reference chains.md as protocol extension
- `docs/rubrics.md` — add Cycle-3 security-review as a truth-dim input (7-item checklist)

**Schema changes (Cycle 3 blocking):**
- `wallet-link sub relation, relates substrate, relates external;` in `src/schema/one.tql` (**REQUIRED — Cycle 3 deliverable 0a**)
- `wallet-address sub attribute, value string;` (**REQUIRED — Cycle 3 deliverable 0a**)
- `/api/agents/register` body handler extended for `wallet`, `chain` fields (**REQUIRED — Cycle 3 deliverable 0b**)
- `bridge:evm`, `bridge:sol`, `bridge:btc` units (Phase 2, after this TODO)
- Token skills (`sui:one`, `eth:eth`, etc.) (Phase 3, after this TODO)
- No D1 migrations

**Receiver naming additions:**
- Register `ui:wallet:*`, `ui:send:*`, `ui:receive:*`, `ui:shop:*`, `ui:swap:*`, `ui:contacts:*`, `ui:dashboard:*` in `docs/ADL-integration.md` sensitivity table (see §Receiver Naming Convention)

---

## See Also

- [one-protocol.md](one-protocol.md) — private intelligence, public results
- [chains.md](chains.md) — chain = unit, token = skill, $ONE settles
- [migrate-u.md](migrate-u.md) — strategic impact analysis (identity/commerce/revenue/security)
- [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) — parent integration plan (Cycles 0-6)
- [DSL.md](one/DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring: fit/form/truth/taste as tagged edges
- [buy-and-sell.md](buy-and-sell.md) — commerce mechanics (LIST→DISCOVER→EXECUTE→SETTLE)
- [sdk.md](one/sdk.md) — `one.hire()` auto-settles across chains
- [lifecycle-one.md](lifecycle-one.md) — user funnel (wallet→key→sign-in→team)
- [revenue.md](one/revenue.md) — five revenue layers, all gain from chain integration

---

*3 cycles. Four waves each. Copy all 66. Fix 10. Deep-wire to protocol.
Wallets = actors. Products = capabilities. Sends = signals. Settlement in $ONE.
Then: bridge units, DEX routing, cross-chain pheromone.
Haiku reads, Opus decides, Sonnet writes, Sonnet checks.
Private intelligence. Public results.*
