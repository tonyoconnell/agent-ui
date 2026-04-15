---
title: TODO ADL Runtime Enforcement
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 10
completed: 3
status: ACTIVE
---

# TODO: ADL Runtime Enforcement

> **Time units:** plan in **tasks → waves → cycles** only. No calendar time.
>
> **Parallelism directive:** Maximize agents per wave. W1 ≥ 4 Haiku (one per
> read target). W2 ≥ 2 Opus shards if findings > ~20. W3 = one Sonnet per
> file. W4 ≥ 2 Sonnet verifiers by check type.
>
> **Goal:** Close the ADL loop — every gate described in `ADL-integration.md`
> and `ADL-integration-map.md` is enforced at the runtime boundary (signals,
> bridge, LLM, API, evolution, federation) with tests that prove it.
>
> **Source of truth:**
> [ADL-integration-map.md](ADL-integration-map.md) — the 8 open integration points,
> [ADL-integration.md](ADL-integration.md) — what's already shipped (parser, persistence, discovery, signal gates),
> [DSL.md](DSL.md) — signal grammar,
> [dictionary.md](dictionary.md) — canonical names (`adl-status`, `perm-network`, `data-sensitivity`),
> [rubrics.md](rubrics.md) — fit/form/truth/taste scoring.
>
> **Shape:** 3 cycles × 4 waves. Haiku reads, Opus decides, Sonnet writes,
> Sonnet checks. Cycle gate = all baseline tests pass + new integration
> tests pass + rubric ≥ 0.65 on every dimension.
>
> **Schema:** Each task maps to `world.tql` dimension 3b — `task` entity with
> `task-wave` (W1–W4), `task-context` (doc keys), `blocks` relation, and
> `skill` with tag `adl`.
>
> **Guardrail:** No changes to signal flow, pheromone, closed loops, or
> Unit/Signal/World core types. ADL wraps the security layer only. Schema
> validation (task #5) lives in a NEW file `src/engine/validate.ts` called
> from `persist.ts` at the task-execution seam — it does NOT mutate
> `world.ts`.
>
> **Enforcement mode:** All eight gates read one env flag
> `ADL_ENFORCEMENT_MODE=audit|enforce` (default `enforce` in prod, `audit`
> in dev). In `audit` mode every gate logs the denial to the audit sink
> but *does not block*. This is the kill-switch for the whole rollout.
>
> **Cache invalidation contract:** Every write path that mutates an ADL
> attribute (`POST /api/agents/adl`, `syncAdl`, markdown re-parse,
> evolution rewrite) MUST call a single exported helper
> `invalidateAdlCache(uid)` that flushes every cache map (lifecycle,
> network, llm-env, api-network). Without this, a retired agent keeps
> executing for up to 5 min after sunset.

---

## Routing

```
    signal DOWN                     result UP
    ──────────                      ─────────
    /do TODO-adl.md                 result + 4 tagged marks
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W1     │  Haiku x N recon ────────┤ mark(edge:fit, score)
    │  read   │  (one per integration    │ mark(edge:form, score)
    └────┬────┘   target + map + spec)   │ mark(edge:truth, score)
         │                               │ mark(edge:taste, score)
         ▼                               │
    ┌─────────┐                          │
    │  W2     │  Opus decide             │ weak dim?
    │  fold   │  → diff specs per file   │  → fan-out to specialist
    └────┬────┘                          │
         ▼                               │
    ┌─────────┐                          │
    │  W3     │  Sonnet x M edits        │
    │  apply  │  (one per touched file)  │
    └────┬────┘                          │
         ▼                               │
    ┌─────────┐                          │
    │  W4     │  Sonnet x K verify ──────┘
    │  score  │  (consistency / cross-ref / voice / rubric)
    └─────────┘
```

---

## Source of Truth

**[ADL-integration-map.md](ADL-integration-map.md)** — the 8 open tasks, with
line refs, sample code, priority, and test requirements. **This is the spec.**
**[ADL-integration.md](ADL-integration.md)** — what shipped (parser, schema
attributes, discovery endpoint, signal gates + 5-min cache).
**[DSL.md](DSL.md)** + **[dictionary.md](dictionary.md)** — loaded in every W2.
**[rubrics.md](rubrics.md)** — fit/form/truth/taste scoring.

| Dead name / drift | Canonical | Note |
|-------------------|-----------|------|
| `src/engine/agentverse.ts` (map ref) | Verify against `agentverse.ts` AND `agentverse-bridge.ts` | Both files exist in repo; W1 must identify correct target for task #8 |
| Map line-refs (e.g. `loop.ts:86`) | W1 re-anchors | Map is ~days old; line-refs must be rediscovered before W3 edits |

---

## Task Registry (TypeDB inserts)

Each task in this TODO is a `task` entity + `skill` with tag `adl`. Run via
`/create task <id> --tags adl,<extra>` or emit the TQL directly:

```typeql
insert $t isa task,
  has task-id "adl-lifecycle", has task-wave "W3", has task-value 0.9,
  has task-effort 0.3, has task-phase "WIRE", has task-persona "sonnet",
  has task-context "ADL-integration-map.md",
  has tag "adl", has tag "security", has tag "P0";
insert $s isa skill, has skill-id "adl-lifecycle",
  has name "ADL lifecycle gate", has price 0.0, has tag "adl", has tag "security";
```

**Blocks relations (compile these after inserting tasks):**

```typeql
# Cycle-2 tasks block on both Cycle-1 tasks
match $a isa task, has task-id $aid; $b isa task, has task-id $bid;
  { $aid == "adl-llm-perms"; } or { $aid == "adl-api-perms"; } or
  { $aid == "adl-schema-validation"; };
  { $bid == "adl-lifecycle"; } or { $bid == "adl-bridge-perms"; } or
  { $bid == "adl-cache-invalidate"; };
insert (blocker: $b, blocked: $a) isa blocks;

# Cycle-3 tasks block on Cycle-2 completion
match $a isa task, has task-id $aid; $b isa task, has task-id $bid;
  { $aid == "adl-nanoclaw-inject"; } or { $aid == "adl-evolution"; } or
  { $aid == "adl-federation"; };
  { $bid == "adl-llm-perms"; } or { $bid == "adl-api-perms"; } or
  { $bid == "adl-schema-validation"; };
insert (blocker: $b, blocked: $a) isa blocks;

# MCP audit depends on Cycle-2 API gate (shares the decision pattern)
match $a isa task, has task-id "adl-mcp-audit";
      $b isa task, has task-id "adl-api-perms";
insert (blocker: $b, blocked: $a) isa blocks;
```

Within each cycle, tasks are independent (no intra-cycle blocks).

---

## Decisions Deferred to Cycle 1 W2

These cross-cutting questions must be resolved by Opus in Cycle 1 W2 and
published as `hypothesis` entities so subsequent cycles consume the
same decisions:

1. **Audit sink location.** `signal.ts` Stage 3 tags signals for audit — but
   stored *where*? Options: new `audit-event` attribute on signal entity;
   new D1 table `adl_audit`; reuse existing signal history with a scope
   tag. Pick one, used by all gates across all cycles.
2. **Sui bridge fail-open vs fail-closed.** Map default is fail-open on
   error. Bridge controls real money. Recommendation: fail-**closed** for
   the bridge specifically; fail-open everywhere else. Confirm in W2.
3. **Signal `scope` × ADL `sensitivity` interaction.** Does a `private`-
   scope signal bypass network-gate (because routing is already local)?
   Does `public` scope require `public` sensitivity on both ends? Lock
   the matrix.
4. **`ADL_ENFORCEMENT_MODE` per-gate override.** Single flag vs per-gate
   (`ADL_GATE_LIFECYCLE_MODE`, …)? Recommend single flag in Cycle 1,
   per-gate flags added in Cycle 3 if denial metrics demand it.
5. **Cache-invalidation granularity.** `invalidateAdlCache(uid)` drops all
   four maps for the uid. Sufficient, or do we also need to invalidate
   paths mentioning uid? Pick one.

---

## Cycle 1: WIRE — Block unauthorized execution + cache hygiene (HIGH)

**Files:** `src/engine/loop.ts`, `src/engine/persist.ts`, `src/engine/bridge.ts`,
`src/engine/adl.ts` (export `invalidateAdlCache`), `src/pages/api/agents/adl.ts`
(call invalidator on write).

**Why first:** Until lifecycle + bridge gates are live (and invalidation is
wired), deprecated agents still execute for up to 5 min, and unauthorized
callers still mark on Sui. Everything downstream is cosmetic until this lands.

### W0 — Baseline

```bash
bun run verify                               # biome + tsc + vitest
```

Record: baseline test count, known-flaky allowlist, build ms. If anything
red → fix first. Don't start a cycle on broken ground.

**Tasks in this cycle (independent, parallel-safe within-cycle):**

| # | ID | Target | Lines | Rubric weight | Exit |
|---|----|--------|-------|---------------|------|
| 1 | `adl-lifecycle` | `loop.ts` + `persist.ts` signal handler | ~25 | truth 0.40, fit 0.30, form 0.20, taste 0.10 | Retired/deprecated/past-sunset unit → `warn(edge,0.5)` + skip. Test `adl-lifecycle.test.ts` passes. |
| 2 | `adl-bridge-perms` | `bridge.ts` `mirrorMark`/`mirrorWarn` | ~20 | truth 0.45, fit 0.30, form 0.15, taste 0.10 | Disallowed sender → no Sui call. **Bridge fails closed on error** (decision locked W2). Test `adl-bridge.test.ts` passes. |
| 9 | `adl-cache-invalidate` | `adl.ts` (export helper) + `api/agents/adl.ts` + `agent-md.ts` re-parse path | ~30 | truth 0.35, fit 0.35, form 0.20, taste 0.10 | `invalidateAdlCache(uid)` exists, called on every ADL write; 5-min staleness window closed. Test `adl-cache.test.ts` passes (set-invalidate-read cycle). |

### Wave 1 — Recon (Haiku × 5, parallel)

| Agent | Target | What to extract |
|-------|--------|-----------------|
| R1 | `src/engine/loop.ts` (all) | Line-accurate tick loop, every `net.ask()` / `net.signal()` call, where `warn(edge, 0.5)` is already used |
| R2 | `src/engine/persist.ts` lines ~300–380 | Current signal handler, existing permission checks on `signal()`/`ask()`, toxicity gate |
| R3 | `src/engine/bridge.ts` (all) | `mirrorMark`, `mirrorWarn`, `suiMark`, `suiWarn`, and existing error paths |
| R4 | `src/pages/api/signal.ts` | Already-shipped gate pattern + cache (`PERM_CACHE`, TTL, keys) — the template for new gates |
| R5 | `docs/ADL-integration-map.md` sections 1–2 | Exact sample code, priority notes, fail-open conventions |

Hard rule: "Report verbatim. Do not propose changes. Under 300 words."

### Wave 2 — Decide (Opus, single context — <20 findings expected)

Context loaded: **DSL.md + dictionary.md** (always) + `ADL-integration-map.md`
sections 1–2 + W1 reports. Produce one diff spec per edit with TARGET, ANCHOR,
ACTION, NEW, RATIONALE.

**Key decisions:**
1. **Cache keys for lifecycle:** reuse `PERM_CACHE` or add a separate map?
   (Decision: reuse — already a single `CACHE_TTL`.)
2. **Where to inject lifecycle check in `loop.ts`:** before `net.ask()` or
   inside an `canExecute()` helper? (Follow map: helper, called before ask.)
3. **`persist.ts` side effect:** auto-warn on signal to dead unit — does this
   conflict with the existing toxicity gate ordering?
4. **Bridge fail-open behaviour:** Sui calls are expensive; confirm
   fail-open (default allow) does not expose an attack vector.

### Wave 3 — Edits (Sonnet × 3, parallel — one per file)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/engine/loop.ts` | ~1 helper + 1 insertion point |
| E2 | `src/engine/persist.ts` | ~1 hook in signal handler |
| E3 | `src/engine/bridge.ts` | ~2 insertions (mirrorMark + mirrorWarn) |

Plus in parallel: `src/__tests__/integration/adl-lifecycle.test.ts` (new),
`src/__tests__/integration/adl-bridge.test.ts` (new).

### Wave 4 — Verify (Sonnet × 4, parallel)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency (naming, uses `PERM_CACHE` pattern, fail-open, `warn(edge, 0.5)`) | all touched files |
| V2 | Cross-references (schema attributes exist, anchors match, tests import correctly) | touched + `world.tql` + `signal.ts` |
| V3 | Voice + form (mirrors map's pseudocode style, no throws in positive flow) | all touched files |
| V4 | Rubric (fit 0.35, form 0.20, truth 0.30, taste 0.15) | touched + `rubrics.md` |

### Cycle 1 Gate

```bash
bun run verify                                # biome + tsc + vitest, no regressions
bun vitest run src/__tests__/integration/adl-lifecycle.test.ts
bun vitest run src/__tests__/integration/adl-bridge.test.ts
bun vitest run src/__tests__/integration/adl-cache.test.ts
```

- [ ] Retired unit receives signal → `warn(edge, 0.5)`, no execution
- [ ] Past-sunset unit → same
- [ ] Active unit → normal ask/outcome
- [ ] Bridge: allowed sender → `suiMark` fires; blocked sender → returns, no Sui call
- [ ] Bridge error path → **fails closed** (no Sui call)
- [ ] `invalidateAdlCache(uid)` flushes all four maps; post-sunset update visible in <100ms
- [ ] `ADL_ENFORCEMENT_MODE=audit` → denials logged but NOT blocked (regression guard)
- [ ] W4 rubric ≥ 0.65 all dimensions

### Cycle 1 Metrics (deterministic, reported by `/sync tick` after gate)

| Metric | Target | Why |
|--------|--------|-----|
| Lifecycle gate p50 / p95 latency | <1ms / <5ms (cache hit), <50ms / <150ms (miss) | Must not slow hot path |
| Cache hit rate (warm) | ≥ 85% | Below this, TypeDB reads dominate |
| Bridge denials / accepts | counted separately | Feeds denial dashboard |
| Sui gas saved (denied mirrorMark × avg gas) | reported as $ | Concrete dollar value of gate |
| `invalidateAdlCache` call count per 1k writes | ≥ 1:1 | Proves write path is covered |

---

## Cycle 2: PROVE — Permission enforcement on LLM/API + schema validation (MEDIUM)

**Files:** `src/engine/llm.ts`, `src/engine/api.ts`, `src/engine/world.ts`

**Depends on:** Cycle 1 complete. The `canCallX(id)` helper pattern and the
`invalidateAdlCache` helper landed in Cycle 1 are reused. Schema validation
uses `ajv` (confirm it's in deps during W1 — if missing, add in W3).

### W0 — Baseline

```bash
bun run verify
```

Plus re-confirm Cycle-1 gates still pass (integration tests for lifecycle,
bridge, cache). If any regressed, Cycle 2 halts.

**Tasks in this cycle (independent, parallel-safe within-cycle):**

| # | ID | Target | Lines | Rubric weight | Exit |
|---|----|--------|-------|---------------|------|
| 3 | `adl-llm-perms` | `src/engine/llm.ts` (in `llm()` factory) | ~25 | truth 0.35, fit 0.35, form 0.20, taste 0.10 | LLM `complete` refuses if caller lacks `perm-env.access`. Typed error `{ error, code: 'PERM_DENIED' }`. Test `adl-llm.test.ts` passes. |
| 4 | `adl-api-perms` | `src/engine/api.ts` (all 4 verb handlers) | ~30 | truth 0.35, fit 0.35, form 0.20, taste 0.10 | Every `apiUnit` verb checks `perm-network.allowedHosts` against `opts.base` hostname. Test `adl-api.test.ts` passes. |
| 5 | `adl-schema-validation` | **NEW file** `src/engine/validate.ts` called from `persist.ts` task-execution seam (NOT `world.ts`) | ~30 | truth 0.45, fit 0.25, form 0.20, taste 0.10 | Skill `input-schema` validates data before task execution; invalid → typed error `{ code: 'SCHEMA_INVALID' }`. Missing/malformed schema → fail-open. Test `adl-schema.test.ts` passes. |

### Wave 1 — Recon (Haiku × 5)

| Agent | Target | What to extract |
|-------|--------|-----------------|
| R1 | `src/engine/llm.ts` | Factory shape, all handlers, where env keys are read |
| R2 | `src/engine/api.ts` | `buildHeaders`, all four verb handlers, timeout pattern |
| R3 | `src/engine/persist.ts` task-execution seam | Where exactly to call `validate()` — the hook the new `validate.ts` plugs into (NOT `world.ts`) |
| R4 | `package.json` + `bun.lock` | Confirm `ajv` presence; note version if absent |
| R5 | `docs/ADL-integration-map.md` sections 3–5 | Sample code and fail-open rules for each |

### Wave 2 — Decide (Opus)

Focus: (a) unify the three helpers on Cycle 1's pattern; (b) decide whether
schema validation is sync or async; (c) pick typed-error shape (`{ error,
code }`) vs. thrown error, preserving "zero returns" (map recommends typed).

### Wave 3 — Edits (Sonnet × 3)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/engine/llm.ts` | +1 helper, +1 gate per handler |
| E2 | `src/engine/api.ts` | +1 helper, +1 gate per verb (×4) |
| E3 | `src/engine/validate.ts` (new) + `src/engine/persist.ts` (1 call site) | new file ~40 lines, 1-line insertion |

Plus three integration tests in parallel. `world.ts` is NOT touched.

### Wave 4 — Verify (Sonnet × 4)

Same shards as Cycle 1: consistency / cross-ref / voice / rubric.

### Cycle 2 Gate

```bash
bun run verify
bun vitest run src/__tests__/integration/adl-llm.test.ts
bun vitest run src/__tests__/integration/adl-api.test.ts
bun vitest run src/__tests__/integration/adl-schema.test.ts
```

- [ ] LLM call without `perm-env` → typed error, no OpenRouter hit
- [ ] LLM call with wildcard or correct key → succeeds
- [ ] API call to disallowed host → typed error
- [ ] API call to wildcard / allowed host → succeeds
- [ ] Valid skill input → passes; invalid → typed error
- [ ] Missing / malformed input-schema → fail-open (allows)
- [ ] `world.ts` diff is empty (guardrail held)
- [ ] `ADL_ENFORCEMENT_MODE=audit` → denials logged, all three gates pass-through
- [ ] W4 rubric ≥ 0.65 all dimensions

### Cycle 2 Metrics

| Metric | Target |
|--------|--------|
| LLM gate p50 / p95 latency | <1ms / <5ms (cache hit) |
| API gate p50 / p95 latency | <1ms / <5ms (cache hit) |
| Schema validation p50 / p95 | <2ms / <10ms (compiled ajv validators) |
| LLM denials / accepts | counted per provider |
| Schema invalid count | per skill (feeds skill-quality scoring) |

---

## Cycle 3: GROW — Propagate ADL into edge, evolution, federation (MEDIUM/LOW)

**Files:** `scripts/setup-nanoclaw.ts`, `src/engine/loop.ts` (evolution
section, lines 407–422), `src/engine/agentverse.ts` **AND/OR**
`src/engine/agentverse-bridge.ts` (W1 confirms which holds `register()`)

**Depends on:** Cycle 2 complete. ADL constraints are now enforced everywhere
they matter at runtime; this cycle makes them *visible* to the LLMs, to
peer ONE worlds, and audits the MCP surface.

### W0 — Baseline

```bash
bun run verify
```

Plus re-run Cycle-1 + Cycle-2 integration tests. All green = proceed.

**Tasks in this cycle (independent, parallel-safe within-cycle):**

| # | ID | Target | Lines | Rubric weight | Exit |
|---|----|--------|-------|---------------|------|
| 6 | `adl-nanoclaw-inject` | `scripts/setup-nanoclaw.ts` | ~35 | taste 0.40, fit 0.30, form 0.20, truth 0.10 | `[ADL Constraints]` block appended to system prompt; wrangler env has `ADL_ALLOWED_HOSTS`, `ADL_DATA_SENSITIVITY`. Test `adl-nanoclaw.test.ts` passes. |
| 7 | `adl-evolution` | `src/engine/loop.ts` evolution path | ~40 | truth 0.35, fit 0.30, form 0.20, taste 0.15 | Evolved prompt appended with `[OPERATIONAL CONSTRAINTS]` via shared helper from `adl.ts`. Test `adl-evolution.test.ts` passes. |
| 8 | `adl-federation` | **W1 confirms** `agentverse.ts` or `agentverse-bridge.ts` | ~30 | truth 0.40, fit 0.30, form 0.20, taste 0.10 | `register()` fetches peer `/.well-known/agents.json`, validates ADL version, `syncAdl()`s the doc. Fail-open on fetch error. Test `adl-federation.test.ts` passes. |
| 10 | `adl-mcp-audit` | `packages/mcp/` (untracked — W1 maps surface) + decision doc | ~20 (docs only) or ~40 (inherit gate) | truth 0.50, fit 0.30, form 0.10, taste 0.10 | Either: MCP tool calls flow through existing signal gates (documented path) **OR** a short addendum explaining why MCP surface sits outside ADL with a follow-up TODO filed. Test `adl-mcp.test.ts` at minimum asserts the decision. |

### Wave 1 — Recon (Haiku × 7)

| Agent | Target | What to extract |
|-------|--------|-----------------|
| R1 | `scripts/setup-nanoclaw.ts` | Deploy logic, where system prompt and env are composed |
| R2 | `src/engine/loop.ts` lines 380–450 | Exact evolution code path |
| R3 | `src/engine/agentverse.ts` | Entire file — confirm if `register()` lives here |
| R4 | `src/engine/agentverse-bridge.ts` | Entire file — same question |
| R5 | `src/engine/adl.ts` | `adlFromUnit`, `syncAdl`, `adlFromAgentSpec` signatures |
| R6 | `docs/ADL-integration-map.md` sections 6–8 | Sample code, fail-open conventions, test outlines |
| R7 | `packages/mcp/` (untracked) | MCP server entry, tool surface, whether calls hit `persist.signal()` or bypass it |

### Wave 2 — Decide (Opus)

Decisions:
1. Where `register()` lives (authoritative file).
2. Whether `augmentPromptWithADL` is a shared helper (extract to `adl.ts`) or
   inlined into loop. (Recommend extract — reused by nanoclaw injection too.)
3. Prompt delimiter style: `[ADL Constraints]` vs `[OPERATIONAL CONSTRAINTS]`
   — pick one, used across both tasks for consistency.

### Wave 3 — Edits (Sonnet × 5)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `scripts/setup-nanoclaw.ts` | +1 adl fetch + prompt enhancement + env injection |
| E2 | `src/engine/loop.ts` | +1 helper call in evolution path |
| E3 | `src/engine/adl.ts` | +1 exported helper `augmentPromptWithADL` |
| E4 | `src/engine/agentverse.ts` OR `agentverse-bridge.ts` | +1 fetch + `syncAdl` call |
| E5 | `packages/mcp/README.md` (or new `docs/adl-mcp.md`) | MCP×ADL decision + follow-up TODO if needed |

Plus four integration tests in parallel.

### Wave 4 — Verify (Sonnet × 5, parallel)

Adds one shard beyond the standard four — legacy-agent end-to-end regression.

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency | all touched files |
| V2 | Cross-refs (shared `augmentPromptWithADL` used by evolution + nanoclaw) | touched + `adl.ts` |
| V3 | Voice + form | all touched files |
| V4 | Rubric (per-task weights above) | touched + `rubrics.md` |
| V5 | **Legacy-agent regression** — spin up a unit with zero ADL attrs, fire every gate from cycles 1–3, assert all pass | all gate files + fixture legacy agent |

V5 is the end-to-end guarantee that fail-open works. If this shard fails,
cycles 1–3 broke backward compatibility somewhere.

### Cycle 3 Gate

```bash
bun run verify
bun vitest run src/__tests__/integration/adl-nanoclaw.test.ts
bun vitest run src/__tests__/integration/adl-evolution.test.ts
bun vitest run src/__tests__/integration/adl-federation.test.ts
bun vitest run src/__tests__/integration/adl-mcp.test.ts
bun vitest run src/__tests__/integration/adl-legacy.test.ts
bun test                # full suite, zero regressions
```

- [ ] NanoClaw deploy produces prompt with constraint block
- [ ] Worker env exposes `ADL_ALLOWED_HOSTS` / `ADL_DATA_SENSITIVITY`
- [ ] Evolved prompt appends `[OPERATIONAL CONSTRAINTS]` when ADL present
- [ ] Federated register → ADL fetched + synced; missing ADL → warning, not failure
- [ ] `/.well-known/agents.json` now lists all units from all three cycles
- [ ] MCP surface either inherits gates OR has a documented decision + follow-up TODO
- [ ] **Legacy agent (no ADL attrs) passes every gate in cycles 1–3**
- [ ] W4 rubric ≥ 0.65 all dimensions

### Cycle 3 Metrics

| Metric | Target |
|--------|--------|
| Injected-prompt diff size (nanoclaw) | < 500 chars appended |
| Evolution prompts augmented | 100% of rewrites when ADL present |
| Federated agents fetched p50 / p95 | <200ms / <1000ms |
| Legacy regression (V5) | 100% pass |
| `/see denials` surface (if built) | returns N per cycle, grouped by gate |

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 5      | Haiku  | ~3% |
| 1 | W2 | 1      | Opus   | ~15% |
| 1 | W3 | 3+tests | Sonnet | ~12% |
| 1 | W4 | 4      | Sonnet | ~5% |
| 1.5 | retrofit | 1 edit + 5 hypotheses | Sonnet+Opus | ~3% |
| 2 | W1 | 5      | Haiku  | ~3% |
| 2 | W2 | 1      | Opus   | ~15% |
| 2 | W3 | 3+tests | Sonnet | ~12% |
| 2 | W4 | 4      | Sonnet | ~5% |
| 3 | W1 | 6      | Haiku  | ~3% |
| 3 | W2 | 1      | Opus   | ~15% |
| 3 | W3 | 5+tests | Sonnet | ~10% |
| 3 | W4 | 5      | Sonnet | ~5% |

**Hard stop:** if any W4 loops > 3 times, halt and escalate.

**Map guarantee:** integration map estimates 2–3 day sprint. With wave
parallelism, wall-time collapses to ~3 cycles of ~15–20 min each.

---

## Status

- [x] **Cycle 1: WIRE** — Lifecycle + bridge gates (HIGH) ✓ 2026-04-15
  - [x] W1 — Recon (Haiku × 5, parallel)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 3 + tests, parallel)
  - [x] W4 — Verify rubric={fit:0.85, form:0.90, truth:0.95, taste:0.80} avg=0.875
  - [x] Cycle gate: 737/737 tests · biome clean · rubric ≥ 0.65 ✓
  - [ ] ⚠️ **RETROFIT (Cycle 1.5):** task #9 `adl-cache-invalidate` + the 5
    deferred decisions were not in scope when Cycle 1 closed. Land before
    Cycle 2 W1 or include as Cycle 2 W0 prerequisite. Otherwise the
    5-min staleness window described in `ADL-integration.md` is still open.
- [ ] **Cycle 1.5: RETROFIT** — cache invalidation + deferred decisions
  - [ ] Task #9 `adl-cache-invalidate` shipped
  - [ ] 5 deferred decisions (audit sink, Sui fail-closed, scope×sensitivity
    matrix, enforcement-mode flag shape, invalidation granularity) resolved
    and stored as hypotheses
  - [ ] `ADL_ENFORCEMENT_MODE` threaded through Cycle 1 gates
- [x] **Cycle 2: PROVE** — LLM / API / schema enforcement (MEDIUM) ✓ 2026-04-15
  - [x] W0 — Baseline: 739/739 tests · biome clean · design tokens held
  - [x] W1 — Recon (Haiku × 5, parallel)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 3 + tests, parallel — `world.ts` untouched; PEP-4 in persist.ts)
  - [x] W4 — Verify rubric={fit:0.95, form:0.95, truth:1.00, taste:0.90} avg=0.95
  - [x] Cycle gate: 739/739 tests · biome clean · rubric ≥ 0.65 ✓
- [x] **Cycle 3: GROW** — NanoClaw inject + evolution + federation + MCP audit (MEDIUM/LOW) ✓ 2026-04-15
  - [x] W0 — Baseline: 739/739 tests · biome clean (formatter fix in brand-cascade.test.ts)
  - [x] W1 — Recon (Haiku × 6, parallel — agentverse.ts confirmed, MCP untracked)
  - [x] W2 — Decide: augmentPromptWithADL shared helper · [OPERATIONAL CONSTRAINTS] delimiter · fire-and-forget federation
  - [x] W3 — Edits (Sonnet × 5 + 4 tests — adl.ts, loop.ts, agentverse.ts, setup-nanoclaw.ts, adl-mcp.md)
  - [x] W4 — Verify rubric={fit:0.95, form:0.92, truth:1.00, taste:0.90} avg=0.94 · V5 legacy pass · 18/18 consistency
  - [x] Cycle gate: 758/758 tests · biome clean · V5 all 5 gates PASS · rubric ≥ 0.65 ✓

---

## Execution

```bash
/do TODO-adl.md          # advance next wave
/do TODO-adl.md --auto   # run W1→W4 continuously until done
/see highways            # observe which paths strengthen during rollout
/see tasks --tag adl     # just ADL tasks
```

---

## See Also

- [ADL-integration-map.md](ADL-integration-map.md) — **THE SPEC** — 8 tasks with line refs + sample code
- [ADL-integration.md](ADL-integration.md) — what shipped (parser, gates, discovery)
- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [TODO-template.md](TODO-template.md) — template used here
- [TODO-security.md](TODO-security.md) — sibling security workstream (⚠️ add back-link to this TODO when updating)

---

*3 cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Close the ADL loop.*
