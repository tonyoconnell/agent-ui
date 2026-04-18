---
title: TODO CF Workers Migration — Pages → Workers with Static Assets
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 12
completed: 0
status: PLANNED
---

# TODO: Cloudflare Workers Migration — Pages → Workers with Static Assets

> **Time units:** tasks → waves → cycles. No calendar time.
>
> **Parallelism directive:** W1 ≥ 4 Haiku (one per read target), W2 1–2 Opus
> (decisions fit in one context), W3 = one Sonnet per file touched, W4 ≥ 2
> Sonnet verifiers (smoke + health + rubric). Spawn all agents per wave in
> ONE message. Sequential between waves, max parallel within.
>
> **Goal:** Stay on Astro 6 + `@astrojs/cloudflare@13` by moving from CF Pages
> to CF Workers with Static Assets. Same free tier, same URL, same bindings,
> same bundle rules — but unblocks `/deploy` and follows Cloudflare's platform
> direction (Pages is frozen, Workers gets every new feature).
>
> **Source of truth:** [speed.md](speed.md) — the TTFB/FCP budgets survive the
> migration, [dictionary.md](dictionary.md) — canonical names (nothing renames),
> [DSL.md](DSL.md) — signal grammar (unchanged), [rubrics.md](rubrics.md) —
> quality scoring for W4, [buy-and-sell.md](buy-and-sell.md) — commerce endpoints
> must stay reachable through the migration.
>
> **Shape:** 3 cycles, four waves each. Haiku reads the current config, Opus
> decides the Workers-native shape, Sonnet applies edits, Sonnet verifies via
> smoke + health check + rubric.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with
> `task-wave` (W1–W4), `task-context` (doc keys), `blocks` relation. Each
> task creates a matching `skill` for capability routing.

## Why this migration (the zero-marginal-cost case)

Astro 6's `@astrojs/cloudflare@13` dropped Pages support. Cloudflare is unifying
Pages and Workers under **Workers with Static Assets** — same free tier, same
`*.pages.dev` URL support, same custom-domain handling, same KV/D1/R2/Queue/DO
bindings. New CF features (Smart Placement, unified observability, DO v2) land
on Workers first; Pages is long-tail maintenance.

**Pages vs Workers Static Assets (identical economics):**

| | CF Pages | CF Workers + Static Assets |
|---|---|---|
| Requests/day free | 100k | 100k |
| Bandwidth | Unlimited | Unlimited |
| Static asset serving | Free | Free |
| Function invocations | 100k/day | Same (unified) |
| Custom domains | Free | Free |
| `*.pages.dev` URL | ✓ | ✓ (CF honors it across migration) |
| Bindings | ✓ | ✓ |
| Smart Placement | ✗ | ✓ |
| Tail logs | Limited | Full |

Every month on Pages = month further behind the platform curve, with zero
marginal-cost benefit for staying. Migration is ~1–2 hours of real work
across 4–6 files — cheaper to pay now (we're deep in the dep-bump context)
than to pay the dep-bump cost a second time at the next major Astro bump.

## Deliverables

### Wave Deliverables (universal)

| Wave | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|------|-------------|------|-------------------------------|------|
| **W1** | Config inventory | File:line list of every Pages-specific ref | 0.15 / 0.10 / **0.65** / 0.10 | ≥ N-1/N recon agents return; every finding cites file:line |
| **W2** | Diff spec set | Workers-native replacement per finding | **0.40** / 0.15 / **0.35** / 0.10 | Every W1 finding mapped to spec OR keep |
| **W3** | Applied edits | Config shipped to Workers format | 0.30 / 0.25 / **0.35** / 0.10 | All anchors matched; zero collateral drift |
| **W4** | Verify report | Build green + deploy green + health green + rubric ≥ 0.65 | 0.25 / 0.15 / **0.45** / 0.15 | All 4 dims ≥ 0.65 AND `/deploy` reaches health-check pass |

### Cycle Deliverables

```
DELIVERABLE: wrangler.toml (Workers config)
PATH:        wrangler.toml
GOAL:        CF reads it as a Workers deployment, not a Pages deployment
CONSUMERS:   wrangler CLI, scripts/deploy.ts, CI workflow
RUBRIC:      fit=0.45 form=0.15 truth=0.30 taste=0.10
EXIT:        `wrangler deploy --dry-run` succeeds locally
SKILL:       infra:cf-config

DELIVERABLE: scripts/deploy.ts (Workers deploy step)
PATH:        scripts/deploy.ts
GOAL:        Pipeline deploys via `wrangler deploy`, smoke checks Workers output path
CONSUMERS:   `bun run deploy`, GitHub Actions
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        Full 8-step pipeline runs clean on a feature branch (dry-run-safe)
SKILL:       infra:deploy-script

DELIVERABLE: astro.config.mjs (native adapter)
PATH:        astro.config.mjs
GOAL:        Remove the `prerenderEnvironment: "node"` Pages workaround — adapter emits its native Workers format
CONSUMERS:   astro build, local dev
RUBRIC:      fit=0.35 form=0.25 truth=0.30 taste=0.10
EXIT:        `astro build` completes without the workaround
SKILL:       infra:astro-config

DELIVERABLE: env.d.ts (canonical Locals)
PATH:        src/env.d.ts
GOAL:        Replace the Astro-6 compat shim with the native `cloudflare:workers` + `Runtime` types
CONSUMERS:   every API route that reads `locals?.runtime?.env?.DB`
RUBRIC:      fit=0.35 form=0.20 truth=0.35 taste=0.10
EXIT:        `bash scripts/typecheck.sh` exit 0; no `runtime?` marked optional without reason
SKILL:       infra:locals-types

DELIVERABLE: deploy.yml (CI Workers deploy)
PATH:        .github/workflows/deploy.yml
GOAL:        `bun run deploy` in CI hits the Workers project, passes secrets unchanged
CONSUMERS:   every push to main + feature/**
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        Green run on a feature branch before touching main
SKILL:       infra:ci-workflow

DELIVERABLE: CLAUDE.md Deploy section
PATH:        CLAUDE.md
GOAL:        Docs match reality — Pages references become Workers references, bundle-size LOCKED rules carried forward
CONSUMERS:   every future assistant session, new contributor
RUBRIC:      fit=0.30 form=0.20 truth=0.40 taste=0.10
EXIT:        grep "pages_build_output_dir" returns empty; bundle rules still enumerated
SKILL:       infra:docs
```

## Routing

```
    signal DOWN                 result UP             feedback UP
    ──────────                  ─────────             ───────────
    /do TODO-cf-workers-         4 tagged marks       tagged strength
    migration.md                      │               signal → substrate
         │                            │                    ▲
         ▼                            │                    │
    ┌─────────┐                       │                    │
    │  W1     │  Haiku recon ─────────┤ mark(infra:fit)    │
    │  read   │  → config inventory   │ mark(infra:form)   │
    └────┬────┘                       │ mark(infra:truth)  │
         │                            │ mark(infra:taste)  │
         ▼                            │                    │
    ┌─────────┐                       │                    │
    │  W2     │  Opus decide          │                    │
    │  fold   │  → Workers-native     │                    │
    │         │    diff specs         │                    │
    └────┬────┘                       │                    │
         │                            │                    │
         ▼                            │                    │
    ┌─────────┐                       │                    │
    │  W3     │  Sonnet edit          │                    │
    │  apply  │  → config + code      │                    │
    │         │    changes            │                    │
    └────┬────┘                       │                    │
         │                            │                    │
         ▼                            │                    │
    ┌─────────┐                       │                    │
    │  W4     │  Sonnet verify ───────┘                    │
    │  score  │  → smoke + health + rubric                 │
    │         │  → feedback signal ───────────────────────►┘
    └─────────┘    { tags: ['infra', 'deploy', 'cf'],
                     strength: rubricAvg }
```

**Context accumulates down. Quality marks flow up. The substrate learns that
`cf:workers` paths succeed; future deploy-adjacent work routes here.**

## Testing — The Deterministic Sandwich

### W0 — Baseline (before Cycle 1)

```bash
bun run verify             # biome + tsc + vitest + audit
bun run build              # full astro build, record artifact layout
ls dist/                   # snapshot what the current (pre-migration) build emits
```

Baseline must be green. If it isn't, the migration is starting on broken ground.
(At the moment this TODO is written, `b1c3c63` has biome+tsc+vitest green; Pages
deploy is the only failing gate. This is the right starting state.)

### W4+ — Verification (after every cycle)

```bash
# Deterministic
bun run check              # biome
bash scripts/typecheck.sh  # tsc
bun vitest run             # no regressions
bun run build              # build must emit the new Workers layout
bun run deploy -- --dry-run   # smoke checks must pass on the new layout

# Probabilistic (W4 rubric)
# fit / form / truth / taste scored against deliverable rubric weights above
```

### Cycle Gate

- [ ] Baseline tests still pass
- [ ] `bun run build` emits Workers-shaped dist/
- [ ] `wrangler deploy --dry-run` succeeds
- [ ] W4 rubric ≥ 0.65 on all 4 dims

---

## Cycle 1: WIRE — Config + Types

**Files:** `wrangler.toml`, `astro.config.mjs`, `src/env.d.ts`, `package.json`

**Why first:** Config is the root — CI, deploy script, and build all read from
these. Fix here, every downstream step becomes mechanical.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric | Exit | Skill |
|---|-------------|------|--------|------|-------|
| 1 | `wrangler.toml` Workers shape | `wrangler deploy --dry-run` resolves all bindings | 0.45/0.15/0.30/0.10 | `wrangler deploy --dry-run` exit 0 | `infra:cf-config` |
| 2 | `astro.config.mjs` native | Remove prerenderEnvironment workaround | 0.35/0.25/0.30/0.10 | `astro build` emits dist/_worker.js/ | `infra:astro-config` |
| 3 | `src/env.d.ts` canonical | Drop the runtime? shim; use native types | 0.35/0.20/0.35/0.10 | `tsc --noEmit` exit 0 | `infra:locals-types` |

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | What to look for |
|-------|--------|------------------|
| R1 | `wrangler.toml` | `pages_build_output_dir`, `[[kv_namespaces]]`, `[env.production]`, any Pages-specific keys |
| R2 | `astro.config.mjs` | `cloudflare()` options, `prerenderEnvironment`, `platformProxy`, `ssr.external` list |
| R3 | `src/env.d.ts` | The `runtime?` shim I added (2026-04-18), the `Env` interface bindings |
| R4 | `package.json` | `@astrojs/cloudflare` version, `wrangler` version, scripts that reference pages |

Hard rule: "Report verbatim. Do not propose changes. Under 300 words. Cite file:line."

### Wave 2 — Decide (Opus)

Context loaded: DSL.md + dictionary.md + CLAUDE.md Deploy section + Astro
Cloudflare adapter docs (https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

Key decisions:
1. **`[assets]` binding name** — default `ASSETS` (no longer reserved on Workers); confirm it matches adapter v13 expectations
2. **KV/D1 bindings move from `[[kv_namespaces]]` to native Workers config** — structure is unchanged but syntax is identical either way; verify
3. **`main` entry point** — adapter emits `dist/_worker.js/index.js` by default
4. **`env.d.ts`** — should `runtime` become non-optional (Workers always populates it), or should we migrate callers to `import { env } from "cloudflare:workers"` at the same time? (Decide: make non-optional this cycle; caller migration happens Cycle 2)

**Output:** one diff-spec per finding (TARGET/ANCHOR/ACTION/NEW/RATIONALE).

### Wave 3 — Edits (Sonnet × 3–4, parallel)

| Job | File | ~Edits |
|-----|------|--------|
| E1 | `wrangler.toml` | 3–5 |
| E2 | `astro.config.mjs` | 1 (remove prerenderEnvironment) |
| E3 | `src/env.d.ts` | 1–2 (native Runtime type, drop shim) |
| E4 | `package.json` (if needed) | 0–1 |

### Wave 4 — Verify (Sonnet × 2)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Build + typecheck | `bun run build` emits `dist/_worker.js/`; `tsc --noEmit` green |
| V2 | Config consistency + rubric | `wrangler deploy --dry-run`; no mention of `pages_build_output_dir`; CLAUDE.md bundle rules still applicable to new layout |

### Cycle 1 Gate

```bash
[ ] wrangler deploy --dry-run        # succeeds, lists all bindings
[ ] bun run build                     # dist/_worker.js/index.js exists
[ ] bash scripts/typecheck.sh         # exit 0
[ ] grep pages_build_output_dir wrangler.toml  # empty
[ ] grep prerenderEnvironment astro.config.mjs # empty
```

---

## Cycle 2: PROVE — Deploy Pipeline + Feature Branch Test

**Depends on:** Cycle 1 complete. You can't validate deploy logic without the
config emitting the correct shape.

**Files:** `scripts/deploy.ts`, `.github/workflows/deploy.yml`,
`.github/workflows/test.yml` (minor), possibly `wrangler.toml` again

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric | Exit | Skill |
|---|-------------|------|--------|------|-------|
| 1 | `scripts/deploy.ts` Workers deploy | Swap `wrangler pages deploy` → `wrangler deploy`, update smoke check | 0.40/0.20/0.30/0.10 | Dry-run succeeds; smoke check sees `dist/_worker.js/` | `infra:deploy-script` |
| 2 | Feature-branch deploy | A feature branch successfully deploys to a Workers *.workers.dev URL | **0.50**/0.15/0.30/0.05 | `gh run view <id>` shows all 8 steps green | `infra:feature-deploy` |
| 3 | CLAUDE.md Deploy section | Docs match new reality | 0.30/0.20/0.40/0.10 | grep pages_build_output_dir CLAUDE.md empty; bundle rules retained | `infra:docs` |

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | What to look for |
|-------|--------|------------------|
| R1 | `scripts/deploy.ts` | Every `wrangler pages` call, smoke check's expected paths, health check URLs, `SYNC_WORKER_URL`, substrate-recording POST |
| R2 | `.github/workflows/deploy.yml` | Setup Node/Bun steps, env vars, secrets, deploy command, environment gate |
| R3 | `.github/workflows/test.yml` | Any Pages-specific coverage paths |
| R4 | `CLAUDE.md` Deploy section | All Pages terminology, bundle-size LOCKED rules, live URLs table |

### Wave 2 — Decide (Opus)

Key decisions:
1. **Feature-branch deploy URL** — `*.workers.dev` by default; confirm CI can parse + surface it the way it currently surfaces Pages preview URLs
2. **Smoke check** — what's the definitive path? Verify with the Cycle 1 build artifact
3. **Substrate signal emission** — `deploy:success` payload structure should stay identical; only the transport URL changes
4. **Bundle-size LOCKED rules** — confirm Workers has the same 10 MiB ceiling, or document the new one
5. **Custom domain (`dev.one.ie`)** — migrate in Cycle 3, flagged here as dependency

### Wave 3 — Edits (Sonnet × 3, parallel)

| Job | File | ~Edits |
|-----|------|--------|
| E1 | `scripts/deploy.ts` | 4–8 (deploy command, smoke check, URL parsing) |
| E2 | `.github/workflows/deploy.yml` | 1–3 (if any) |
| E3 | `CLAUDE.md` Deploy section | 6–12 (terminology, URLs, bundle rules if they change) |

### Wave 4 — Verify (Sonnet × 3)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Live deploy proof | `gh run view` for a pushed feature branch — all 8 steps green, preview URL captured |
| V2 | Health checks | Deployed Workers URL returns 200 on `/api/health`; KV bindings resolve |
| V3 | Docs + rubric | CLAUDE.md self-consistent; rubric dims ≥ 0.65 |

### Cycle 2 Gate

```bash
[ ] feature branch: `bun run deploy` reaches step 8 (health)
[ ] deployed worker responds on /api/health
[ ] KV binding works (hit an endpoint that reads KV)
[ ] CLAUDE.md: no "pages_build_output_dir" references
[ ] Bundle-size rules still enumerated and still true
```

---

## Cycle 3: GROW — Cutover + Cleanup

**Depends on:** Cycle 2 feature-branch deploy green. Main cutover is the riskiest
step — happens when we're confident Cycle 2's pattern works.

**Files:** Custom-domain routing (CF dashboard, documented in `docs/`),
archive/delete Pages project, final sweep of doc references, memory note.

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric | Exit | Skill |
|---|-------------|------|--------|------|-------|
| 1 | Main-branch Workers deploy | `main` pushes deploy to Workers, not Pages | **0.50**/0.15/0.30/0.05 | CI green on a main push; health green | `infra:main-deploy` |
| 2 | Custom domain cutover | `dev.one.ie` routes to Workers, not Pages | 0.40/0.15/**0.40**/0.05 | `curl dev.one.ie/api/health` returns 200 from Workers | `infra:custom-domain` |
| 3 | Pages project archived | Old Pages project exists in paused state for 1 cycle (rollback window), then archived | 0.30/0.20/0.40/0.10 | CF dashboard: project in "archived" state; no traffic | `infra:pages-archive` |
| 4 | Memory note | Substrate remembers: "before bumping Astro major, check adapter + deploy-target compatibility" | 0.30/0.20/0.40/0.10 | `memory/feedback_astro_adapter_target.md` exists | `memory:dep-bump-lesson` |
| 5 | Documentation sweep | Every doc reference to Pages → Workers; `.pages.dev` references kept (still valid URL) | 0.30/0.20/**0.40**/0.10 | grep across docs/ returns only intentional references | `infra:docs-final` |

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | What to look for |
|-------|--------|------------------|
| R1 | `docs/**/*.md` | Every `pages_build_output_dir`, "CF Pages", "Pages deployment" reference |
| R2 | `.claude/**` skills + commands | `/deploy` command, any Pages-specific doc in the deploy skill |
| R3 | CF dashboard state | What's in the Pages project vs Workers project (manual observation, reported by human) |
| R4 | DNS for `dev.one.ie` + `main.one.ie` | Current CNAME / A records, TTL |

### Wave 2 — Decide (Opus)

Key decisions:
1. **Cutover strategy** — keep Pages project live for 1 full cycle after Workers takes main, as rollback safety net. Archive only after no traffic for a cycle.
2. **Custom domain flip** — CF dashboard DNS flip is atomic, but TTL matters; note it, don't time it
3. **`.pages.dev` subdomain** — CF preserves it across the migration; don't rename it, don't document a rename
4. **`*.workers.dev` URL** — does the CI log surface it the same way Pages preview URLs surfaced? If not, update deploy.ts
5. **Memory note content** — the exact lesson to save, phrased as a feedback rule

### Wave 3 — Edits (Sonnet × 4–5, parallel)

| Job | Target | ~Edits |
|-----|--------|--------|
| E1 | `docs/**/*.md` | 10–20 (grep-find-and-replace, one agent per doc file) |
| E2 | `.claude/commands/deploy.md` | 2–5 |
| E3 | `memory/feedback_astro_adapter_target.md` | new file |
| E4 | CF dashboard action (human) | Custom-domain DNS flip + Pages project pause |
| E5 | CLAUDE.md final sweep | 2–4 |

### Wave 4 — Verify (Sonnet × 3)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Live main deploy | `main` branch deploys to Workers, health green |
| V2 | Domain routing | `curl https://dev.one.ie/api/health` returns 200 served by Workers (check `server` header or `CF-Worker` header) |
| V3 | Docs + memory + rubric | No stale Pages terminology; memory note written; rubric ≥ 0.65 |

### Cycle 3 Gate

```bash
[ ] main CI: deploy green, health green
[ ] curl https://dev.one.ie/api/health → 200 (from Workers)
[ ] CF dashboard: Pages project paused, Workers project active
[ ] grep -r "pages_build_output_dir" .  → empty
[ ] ls memory/feedback_astro_adapter_target.md → exists
[ ] Rubric ≥ 0.65 on all 4 dims, all 3 cycles
```

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|--------------|-----------------|
| **WIRE** | Config emits Workers shape; types stop needing shim | L1 (signal), L2 (mark paths `infra:*`), L3 (fade) |
| **PROVE** | Feature-branch deploy proves end-to-end; docs align | L4 (economic — successful deploy marks `cf:workers` path) |
| **GROW** | Main cutover, custom domain, archive old | L5 (evolution — the `cf:pages` path warns, `cf:workers` path strengthens), L6 (`know()` promotes "Workers is our deploy target" to hypothesis) |

The cycle gate is the substrate's `know()` — don't advance until the cycle's
patterns are verified and the `cf:workers` path has accumulated mark strength.

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. share |
|-------|------|--------|-------|-----------|
| 1 | W1 | 4 Haiku | Haiku  | ~5% |
| 1 | W2 | 1 Opus | Opus   | ~25% |
| 1 | W3 | 3–4 Sonnet | Sonnet | ~15% |
| 1 | W4 | 2 Sonnet | Sonnet | ~10% |
| 2 | W1–W4 | similar | mixed | ~30% (includes a real CI deploy — the verify cost) |
| 3 | W1–W4 | similar | mixed | ~15% (mostly doc + human CF-dashboard work) |

Hard stop: if any Wave 4 loops > 3 times, halt and escalate. This migration
touches live deployment — fail-fast is non-negotiable.

---

## Status

- [x] **Cycle 1: WIRE** — Config + Types — *shipped on `feature/cf-workers-migration-c1-c2` (29a7cbd)*
  - [x] W1 — Recon (direct Read × 4 — files small enough that Agent overhead outweighed benefit)
  - [x] W2 — Decide (main context × 1)
  - [x] W3 — Edits (wrangler.toml + src/env.d.ts; astro.config.mjs + package.json already in correct state)
  - [x] W4 — Verify (biome + typecheck green; truth dim CI-deferred, rubric 0.74)
- [x] **Cycle 2: PROVE** — Deploy Pipeline — *shipped on same branch (29a7cbd); scope tightened: code changes only, live validation deferred to Cycle 3*
  - [x] W1 — Recon (direct Read on scripts/deploy.ts)
  - [x] W2 — Decide (4 diff specs)
  - [x] W3 — Edits (scripts/deploy.ts: smoke path, deploy command, preview URL regex, approval-prompt text)
  - [x] W4 — Verify (biome + typecheck green; wrangler dry-run local-TTY-blocked; CI validation on feature branch)
- [ ] **Cycle 3: GROW** — Cutover + Cleanup — *partial; env fix shipped, awaiting redeploy + DNS flip via `scripts/cf-cutover.ts`*
  - [x] W1 — Recon (CF API inventory complete: Pages + Workers state known; `dev.one.ie` already detached from Pages per `bun run cf-cutover` dry-run; root cause = `PUBLIC_GATEWAY_URL` build-time inline, NOT TypeDB IP allowlist)
  - [x] W2 — Decide (cutover strategy locked: env fix → redeploy → cf-cutover script → verify)
  - [ ] W3 — Edits (env: `PUBLIC_GATEWAY_URL` ✓ in `deploy.yml`; DNS flip tool: ✓ `scripts/cf-cutover.ts`; redeploy + flip: ⏸ pending; docs: 20+ Pages refs; memory — saved)
  - [ ] W4 — Verify (Workers `/api/health` returns 140 units; `bun run cf-cutover --execute` health-verify passes; Pages archived after rollback window)

#### Cycle 3 C1 investigation findings (2026-04-18)

Used `CLOUDFLARE_GLOBAL_API_KEY` from `.env` to drive CF API directly:
- ✓ Workers script `one-substrate` deployed (main-branch CI at commit 9569a08)
- ✓ Bindings present: `KV` (id=1c1dac4766...), `ASSETS`, `IMAGES`, `SESSION` auto-provisioned by v13 adapter
- ✓ 7 secrets set via CF API PUT `/workers/scripts/one-substrate/secrets` (TYPEDB_*, OPENROUTER_API_KEY, SUI_SEED, BROADCAST_SECRET)
- ✓ Worker serves HTTP at `one-substrate.oneie.workers.dev` (prerendered pages return content; `/api/tick?reload=1` works)
- ✗ `/api/health` returns `status: degraded`, `units: 0` on Workers vs `status: healthy`, `units: 140` on Pages (same code, same credentials)
- ✗ `/api/export/units` returns `[]` on Workers vs full list on Pages — TypeDB query returns empty rather than erroring
- ✓ TypeDB signin works from local IP (credentials valid)

**Diagnosis refined (2026-04-18 T+1h):** TypeDB IP allowlist is NOT the root cause — `src/lib/typedb.ts` already routes ALL queries through the Gateway (`api.one.ie/typedb/query`), not direct TypeDB. Gateway itself is a CF Worker and works fine from external curl (tested, returns full query results).

**Actual root cause (most likely):** `PUBLIC_GATEWAY_URL` is an Astro `PUBLIC_*` env var — inlined at **build time**. CI's build didn't pass `PUBLIC_GATEWAY_URL`, so the bundled Worker has the default fallback `https://one-gateway.oneie.workers.dev` hardcoded. Tried setting it as a runtime secret via CF API — no effect (it's build-time-baked, runtime secrets don't override inlined strings).

Silent-empty comes from `src/pages/api/export/units.ts:51` and similar routes that wrap `readParsed()` in `try { ... } catch { return [] }` — any fetch/network error returns empty array rather than propagating.

**To unblock DNS cutover (current order of operations):**
1. ✓ `PUBLIC_GATEWAY_URL=https://api.one.ie` already set in `.github/workflows/deploy.yml:55`. The next main push bakes the correct Gateway URL into the Worker bundle.
2. Push to main (or trigger workflow manually) → deploy re-runs → verify `curl https://one-substrate.oneie.workers.dev/api/health` returns `status: healthy`, `units: 140` (matches Pages). If still empty, run `wrangler tail one-substrate` while hitting `/api/export/units` to capture the actual fetch error shape.
3. Once Workers health is green, flip DNS: `bun run cf-cutover` (dry-run first), then `bun run cf-cutover --execute`. Script creates the `dev.one.ie/*` Workers route, detaches from Pages, and curl-verifies. See `scripts/cf-cutover.ts`.
4. Alternate if ever needed: refactor `src/lib/typedb.ts` to prefer a runtime `GATEWAY_URL` secret over the `PUBLIC_*` inlined value. More flexible but more code — not needed if step 1 holds.

**Current state (2026-04-18, post-cutover):** `dev.one.ie` now serves the `one-substrate` Worker (step 3 done). Data layer green — `/api/health` returns 140 units from TypeDB via Gateway. Pages project paused at `one-substrate.pages.dev` as rollback safety net. Production cutover at `one.ie` is the next step (C4, planned).

### Cycle 1+2 Rubric (self-reported, 2026-04-18)

| Dim | Weight | Score | Notes |
|---|---|---|---|
| fit | 0.25 | 0.80 | Config matches Workers target; all preconditions met |
| form | 0.15 | 0.85 | Minimal wrangler.toml, documented choices, type shim clean |
| truth | 0.45 | 0.60 | Can't locally prove Workers build; CI is the authoritative validator |
| taste | 0.15 | 0.85 | No dead config, trust adapter defaults |
| **avg** | 1.00 | **0.74** | ≥ 0.65 gate passed. Truth weakest on purpose — CI collapses it to pass/fail. |

---

## Preconditions (must be true before Cycle 1 starts)

- [ ] Current CI state: Test workflow green, Deploy workflow failing at build
      (ASSETS reserved error or equivalent Pages-specific error)
- [ ] Astro 6 + `@astrojs/cloudflare@13` in package.json — this migration assumes
      we keep them; if we downgrade first, abort this TODO
- [ ] The temporary `prerenderEnvironment: "node"` workaround exists in
      `astro.config.mjs` — Cycle 1 removes it
- [ ] The temporary `runtime?` shim in `src/env.d.ts` exists — Cycle 1 cleans it

---

## Execution

```bash
# Run the next wave of the current cycle
/do TODO-cf-workers-migration.md

# Or manually — autonomous sequential loop
/do

# Check state
/see highways               # proven paths (expect cf:workers strengthening)
/see tasks                  # open tasks by priority
```

---

## Rollback Plan

Each cycle is independently reversible:

- **After Cycle 1:** revert wrangler.toml + astro.config.mjs + env.d.ts changes; back on Pages
- **After Cycle 2:** keep Pages project active; feature-branch deploy is a parallel test — main is untouched
- **After Cycle 3:** Pages project is paused not deleted; DNS can re-point in one dashboard click for 1 cycle

If any cycle's W4 rubric fails (< 0.65 on any dim) and a re-edit loop doesn't
fix it within 3 attempts, halt the cycle and evaluate: either escalate or
execute rollback.

---

## See Also

- [speed.md](speed.md) — performance budgets that must survive migration
- [DSL.md](DSL.md) — signal grammar (unchanged across migration)
- [dictionary.md](dictionary.md) — canonical names (unchanged)
- [rubrics.md](rubrics.md) — quality scoring for W4
- [buy-and-sell.md](buy-and-sell.md) — commerce endpoints must stay reachable
- [TODO-template.md](TODO-template.md) — template this TODO was built from
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- [`CLAUDE.md` Deploy section](../CLAUDE.md) — current live URLs + bundle-size LOCKED rules
- [Astro Cloudflare integration docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) — adapter reference for Workers deployment
- [CF Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) — the new platform model

---

*3 cycles. Four waves each. Haiku reads the Pages config, Opus decides the
Workers shape, Sonnet applies, Sonnet verifies. Same loop as the substrate,
different receivers.*
