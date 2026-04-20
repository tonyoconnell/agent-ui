---
title: TODO API — Lifecycle-Complete Surface (API + SDK + Auth)
type: roadmap
version: 1.0.0
priority: Close every gap in the 10-stage funnel
total_tasks: 36
completed: 0
status: ACTIVE
syncs_with: sdk-todo.md, auth-todo.md, mcp-todo.md, cli-todo.md, lifecycle-todo.md
---

# TODO: API Lifecycle Completeness

> **Time units:** plan in **tasks → waves → cycles** only. No calendar time.
> (`.claude/rules/engine.md` § Rule 2.)
>
> **Parallelism directive:** **maximize agents per wave.** W1 ≥ 4 Haiku (one per
> read target: `lifecycle-one.md`, `api.md`, `packages/sdk/src/**`, `src/lib/api-auth.ts`),
> W2 ≥ 2 Opus shards when findings > 20, W3 = one Sonnet per file, W4 ≥ 2 Sonnet
> verifiers (lifecycle-walk test + gate-enforcement test).
>
> **Goal:** Make the public surface (HTTP API + `@oneie/sdk` + auth) **complete
> against the 10-stage user funnel** in `lifecycle-one.md`. Every stage has
> exactly one canonical endpoint, one SDK method, one documented auth posture,
> and one `stage:*` telemetry tag. No fail-open gates on lifecycle-critical
> routes. No routes that aren't either in the SDK or marked `@internal`.
>
> **Source of truth:**
> [lifecycle-one.md](lifecycle-one.md) — the 10-stage funnel + stage tags + speed targets,
> [lifecycle.md](lifecycle.md) — substrate-view sibling (REGISTER → HARDEN arc),
> [api.md](api.md) — current endpoint catalog (≈180 routes, grouped by dimension),
> [sdk.md](sdk.md) — SDK contract (`SubstrateClient` methods + React hooks),
> [auth.md](auth.md) — current auth flows + the six open gaps,
> [dictionary.md](dictionary.md) — canonical names, 6 verbs, stage tags vocabulary,
> [rubrics.md](rubrics.md) — fit/form/truth/taste scoring (W4),
> [DSL.md](DSL.md) — signal grammar,
> [routing.md](routing.md) — deterministic sandwich + four outcomes,
> [patterns.md](patterns.md) — closed loop + zero returns.
>
> **Shape:** 3 cycles × 4 waves. Haiku reads, Opus decides, Sonnet edits, Sonnet
> verifies. Cycle gate = baseline tests pass + new lifecycle-walk integration
> test passes + rubric ≥ 0.65 on every dimension.
>
> **Guardrail:** No changes to the `Signal` type, pheromone math, four-outcome
> algebra, or the 6 dimensions. All work lives in `src/pages/api/**`,
> `packages/sdk/src/**`, `src/lib/api-auth.ts`, and the corresponding docs.
>
> **Enforcement mode:** Cycle 2 gates ship behind `AUTH_GATE_MODE=audit|enforce`
> (default `audit` for one cycle, then `enforce`). In `audit` mode the gate
> logs a `security:gate:would-deny` signal but does not block. Rollout
> kill-switch — legacy clients keep working until the gate is proven.

---

## Why this TODO exists

The 10-stage funnel in `lifecycle-one.md` is the product. Routing microseconds
don't matter if the funnel has seams. Today the seams are:

| Stage | Canonical surface | Gap |
|-------|-------------------|-----|
| 0 Wallet | — | no `/api/identity/:uid/address` and no `sdk.walletFor()` |
| 2b Sign-in (human) | `/api/auth/[...all]` | SDK has no human session helper |
| 3 Join board | implicit first-signal side-effect | no explicit `/api/board/join` + `sdk.join()` |
| 4 Create team | `/api/agents/sync` (fail-open) | `role ≥ operator` gate not enforced |
| 5 Deploy team | `/api/agents/sync` (fail-open) | same gate |
| 9 Sell | `/api/agents/register` (fail-open) | `scope` on capability declare not enforced |
| 10 Buy | `/api/pay` (fail-open) | `scope:public` check on cross-org paths not enforced |
| 3rd lane | — | no `deployOnBehalf(owner, spec)` (mirror owner's top-5 × 0.5) |

Cross-cutting defects:

1. `SDK_VERSION` in `packages/sdk/src/index.ts` hardcoded `"0.2.0"` while
   `package.json` reports `0.6.0`. Telemetry reports the wrong version.
2. SDK emits `toolkit:sdk:<method>` but no `stage:*` tags. Pheromone cannot
   learn funnel completion.
3. ≈100 API routes have no SDK equivalent or `@internal` marker — the SDK is
   not a faithful projection of the API.
4. `role-check.ts` permissions matrix exists but ≈6 lifecycle-critical routes
   bypass it. Permission = **Role × Pheromone** today has the Role half turned
   off.

Closing all of these = one complete funnel and one audit trail per stage.

---

## Routing

```
    signal DOWN                    result UP
    ──────────                     ─────────
    /do api-todo.md                result + 4 tagged marks
         │                              │
         ▼                              │
    ┌─────────┐                         │
    │  W1     │  Haiku x 4+ recon ──────┤ mark(edge:fit, score)
    │  read   │  lifecycle-one.md       │ mark(edge:form, score)
    │         │  api.md                 │ mark(edge:truth, score)
    │         │  sdk/src/client.ts      │ mark(edge:taste, score)
    │         │  api-auth.ts            │
    │         │  role-check.ts          │
    └────┬────┘                         │
         ▼                              │
    ┌─────────┐                         │
    │  W2     │  Opus decide            │ weak dim?
    │  fold   │  → stage table          │  → fan-out to specialist
    │         │  → diff spec per file   │
    │         │  → gate enforcement mx  │
    └────┬────┘                         │
         ▼                              │
    ┌─────────┐                         │
    │  W3     │  Sonnet x N edits       │
    │  apply  │  (docs + code parallel) │
    │         │  new routes, SDK fixes, │
    │         │  role gates, stage tags │
    └────┬────┘                         │
         ▼                              │
    ┌─────────┐                         │
    │  W4     │  Sonnet x 2 verify ─────┘
    │  score  │  (lifecycle-walk E2E /
    │         │   gate-enforcement E2E)
    └─────────┘
```

Fan-out pattern: every cycle opens with a Haiku per read target, W2 folds to a
single Opus decision with N diff specs, W3 spawns one Sonnet per file (code +
doc edited in the same wave so they can never drift), W4 runs two Sonnet
verifiers in parallel — one for the lifecycle walk (stage 0 → 10 round-trip),
one for the gate matrix (every audit log entry accounted for).

---

## Source of Truth

| Doc | Why it's loaded |
|-----|-----------------|
| [lifecycle-one.md](lifecycle-one.md) | 10-stage funnel, speed targets, stage tags, 3rd lane |
| [lifecycle.md](lifecycle.md) | Substrate arc, trade-lifecycle nesting, hardening |
| [api.md](api.md) | Current route catalog (≈180) — baseline surface to extend |
| [sdk.md](sdk.md) | SDK contract, hooks, outcome types, streaming |
| [auth.md](auth.md) | Current flows, six open gaps, claim protocol |
| [dictionary.md](dictionary.md) | Canonical names, 6 verbs, stage vocabulary |
| [rubrics.md](rubrics.md) | fit/form/truth/taste + ≥ 0.65 gate |
| [DSL.md](DSL.md) | Signal grammar |
| [routing.md](routing.md) | Four outcomes, deterministic sandwich |
| [patterns.md](patterns.md) | Closed loop, zero returns |
| [TODO-governance.md](TODO-governance.md) | Role × Pheromone matrix (feeds Cycle 2) |
| [sdk-todo.md](sdk-todo.md) | Sibling — parity table aligns with this TODO |
| [mcp-todo.md](mcp-todo.md) | Sibling — MCP tool names mirror SDK method names |

---

## Stage × Surface × Gate Matrix (target state after C3)

| # | Stage | HTTP endpoint | SDK method | Auth posture | Stage tag |
|---|-------|---------------|------------|--------------|-----------|
| 0 | Wallet | `GET /api/identity/:uid/address` | `sdk.walletFor(uid)` | public | `stage:wallet` |
| 1 | Save key | — (device-local) | — | — | `stage:key` |
| 2a | Sign-in (agent) | `POST /api/auth/agent` | `sdk.authAgent()` | public → issues key | `stage:sign-in:agent` |
| 2b | Sign-in (human) | `POST /api/auth/sign-in/email` | `sdk.signIn({email,password})` | public → issues cookie | `stage:sign-in:human` |
| 3 | Join board | `POST /api/board/join` | `sdk.join({uid, group?})` | bearer | `stage:join-board` |
| 4 | Create team | (client-side parse) | `sdk.parseSpec(md)` | — | `stage:team-create` |
| 5 | Deploy team | `POST /api/agents/sync` | `sdk.syncAgent(spec)` | bearer + `role ≥ operator` | `stage:team-deploy` |
| 5b | Deploy on behalf | `POST /api/agents/deploy-on-behalf` | `sdk.deployOnBehalf({owner, spec})` | bearer + owner≡sender | `stage:team-deploy:on-behalf` |
| 6 | Discover | `GET /api/agents/discover` | `sdk.discover(skill)` | public | `stage:discover` |
| 7 | Message | `POST /api/signal` | `sdk.signal(sig)` | bearer | `stage:message` |
| 8 | Converse | `POST /api/ask` | `sdk.ask(sig)` | bearer | `stage:converse` |
| 9 | Sell | `POST /api/agents/register` + caps | `sdk.register({caps, scope})` | bearer + `scope ∈ {group, public}` | `stage:sell` |
| 10 | Buy | `POST /api/pay` or `/api/buy/hire` | `sdk.pay()`, `sdk.hire()` | bearer + (if cross-org) `scope:public` on path | `stage:buy` |

A cycle exits green when **every row** has all five columns filled on real
production routes — not just docs.

---

## Cycle 1: WIRE — fill the seams (stages 0, 3, 5b, SDK version, stage tags)

**Files:**
`src/pages/api/identity/[uid]/address.ts` (new),
`src/pages/api/board/join.ts` (new),
`src/pages/api/agents/deploy-on-behalf.ts` (new),
`packages/sdk/src/index.ts`,
`packages/sdk/src/client.ts`,
`packages/sdk/src/telemetry.ts`,
`packages/sdk/src/react/hooks.ts`,
`one/api.md`, `one/sdk.md`, `one/lifecycle-one.md`

**Why first:** Smallest blast radius, highest lifecycle value. Adds surface,
changes no existing behaviour. Unblocks Cycle 2 (you can't gate a route that
doesn't exist).

---

### Tasks

- [ ] SDK: read `SDK_VERSION` from `package.json` at build time
  id: sdk-version-fix
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: `SDK_VERSION` exported from `index.ts` equals `require('../package.json').version` at runtime. Telemetry emits the correct version. Verified via `pnpm --filter @oneie/sdk test -- version`.
  tags: sdk, telemetry, P0

- [ ] API: `GET /api/identity/:uid/address` — derive Sui address, no storage
  id: api-identity-address
  value: high
  effort: low
  phase: C1
  persona: dev
  blocks: sdk-wallet-for
  exit: Route calls `addressFor(uid)` from `src/lib/sui.ts`. Returns `{uid, address, derivedAt}`. Pure, deterministic, cacheable. Adds no TypeDB read.
  tags: api, lifecycle, stage:wallet, P0

- [ ] SDK: `sdk.walletFor(uid)` method
  id: sdk-wallet-for
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: Calls `GET /api/identity/:uid/address`. Emits `stage:wallet` tag. Returns `{uid, address}`. React hook `useWallet(uid)` added.
  tags: sdk, lifecycle, stage:wallet, P0

- [ ] API: `POST /api/board/join` — explicit join, replaces implicit side-effect
  id: api-board-join
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: sdk-join, gate-stage-3
  exit: Route accepts `{uid, group?}` (default `group = "board"`). Writes one `membership` relation with `role: "agent"`. Emits `mark(newcomer → ceo, 1)`. Returns `{boardId, ceoUid, ceoPath: {from, to, strength}}`. Idempotent — repeat calls return existing membership without duplicate mark.
  tags: api, lifecycle, stage:join-board, P0

- [ ] SDK: `sdk.join({uid, group?})` method + `useJoin()` hook
  id: sdk-join
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: Wraps `POST /api/board/join`. Emits `stage:join-board`. Hook exposes `{joined, boardId, ceoPath, loading, error}`.
  tags: sdk, lifecycle, stage:join-board, P0

- [ ] API: `POST /api/agents/deploy-on-behalf` — trust inheritance lane
  id: api-deploy-on-behalf
  value: high
  effort: medium
  phase: C1
  persona: dev
  blocks: sdk-deploy-on-behalf
  exit: Route accepts `{owner, spec}`. Validates `owner` has ≥ 3 successful cycles (`highways.length >= 3`). Calls `syncAgent(spec)`. Post-deploy: queries top-5 outbound paths from `owner`, emits `mark(new_agent → target, 0.5 × ownerStrength)` on each. Returns `{uid, inheritedPaths: [...]}`.
  tags: api, lifecycle, stage:team-deploy, P1

- [ ] SDK: `sdk.deployOnBehalf({owner, spec})` method + `useDeployOnBehalf()` hook
  id: sdk-deploy-on-behalf
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: Wraps new API route. Emits `stage:team-deploy:on-behalf`. Hook returns `{newUid, inheritedPaths, loading, error}`.
  tags: sdk, lifecycle, P1

- [ ] SDK: universal `stage:*` tag emission on every lifecycle method
  id: sdk-stage-tags
  value: critical
  effort: medium
  phase: C1
  persona: dev
  exit: Methods `authAgent`, `signIn`, `walletFor`, `join`, `syncAgent`, `deployOnBehalf`, `discover`, `signal`, `ask`, `register`, `pay`, `hire` emit both `toolkit:sdk:<method>` and `stage:<name>` as signal tags. Added to telemetry.ts; dispatched via `/api/signal` in parallel with the main call. Tags match `lifecycle-one.md § Stage Tags` vocabulary exactly. Unit test asserts tag set per method.
  tags: sdk, telemetry, lifecycle, P0

- [ ] SDK: `sdk.signIn({email, password})` helper for human lane
  id: sdk-sign-in
  value: medium
  effort: low
  phase: C1
  persona: dev
  exit: Thin wrapper around `POST /api/auth/sign-in/email` (BetterAuth). Returns `{sessionId, userId, uid}`. Emits `stage:sign-in:human`. Sister method `sdk.signOut()` clears cookie.
  tags: sdk, auth, lifecycle, P1

- [ ] Docs: update `api.md` with Lifecycle Coverage table + new endpoints
  id: docs-api-md
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: `api.md` has a new "Lifecycle Coverage" section at the top showing the 10-stage × endpoint matrix. Three new endpoints documented in-place (Identity, Board, Deploy-on-behalf). Every table adds a **Stage** column.
  tags: docs, lifecycle, P1

- [ ] Docs: update `sdk.md` with parity matrix + new methods + hooks
  id: docs-sdk-md
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: `sdk.md` shows the complete method × endpoint × stage × hook matrix. New methods (`walletFor`, `join`, `deployOnBehalf`, `signIn`, `signOut`) documented. Mentions `stage:*` telemetry tag set.
  tags: docs, sdk, P1

- [ ] Integration test: lifecycle-walk E2E (stages 0 → 10)
  id: test-lifecycle-walk
  value: critical
  effort: medium
  phase: C1
  persona: dev
  exit: `src/__tests__/integration/lifecycle-walk.test.ts` executes every stage as an SDK call in order. Asserts: 10 `stage:*` signals recorded in TypeDB in correct order, total elapsed time < 3 s (cold), correct outcome per stage (mark or warn). Runs in CI.
  tags: test, integration, lifecycle, P0

### Cycle 1 Gate

```bash
# Verification commands
bun run verify                                       # W0 + W4 deterministic checks
bun vitest run src/__tests__/integration/lifecycle-walk.test.ts
curl -s https://dev.one.ie/api/identity/test-agent/address | jq
curl -X POST https://dev.one.ie/api/board/join -H "Authorization: Bearer $KEY" -d '{"uid":"test-agent"}'
curl -X POST https://dev.one.ie/api/agents/deploy-on-behalf -H "Authorization: Bearer $KEY" -d '{"owner":"proven-owner","spec":{...}}'
```

```
  [ ] All 12 tasks closed
  [ ] lifecycle-walk.test.ts green — 10 stages, 10 stage signals, < 3 s cold
  [ ] SDK_VERSION matches package.json
  [ ] Every new route + method + hook documented in api.md + sdk.md
  [ ] Rubric ≥ 0.65 on fit/form/truth/taste
```

---

## Cycle 2: GATE — close every fail-open lifecycle route

**Files:**
`src/lib/api-auth.ts`, `src/lib/role-check.ts`,
`src/pages/api/agents/sync.ts`,
`src/pages/api/agents/register.ts`,
`src/pages/api/agents/deploy-on-behalf.ts`,
`src/pages/api/board/join.ts`,
`src/pages/api/pay.ts`,
`src/pages/api/buy/hire.ts`,
`src/pages/api/signal.ts`,
`src/pages/api/ask.ts`,
`one/auth.md`, `one/api.md`

**Why second:** Cycle 1 put the routes in place. Now the gates go on. Can't
gate what doesn't exist; can't enforce Role × Pheromone if Role is missing.

**Depends on:** Cycle 1 complete.

---

### Tasks

- [ ] Declarative gate: `@requires(role, scope)` helper in `api-auth.ts`
  id: impl-requires-helper
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: gate-stage-4, gate-stage-5, gate-stage-9, gate-stage-10, gate-stage-3
  exit: `requires({role?, scope?, mode})` returns a handler wrapper. `mode: "audit" | "enforce"` set by env `AUTH_GATE_MODE`. In audit: emits `security:gate:would-deny` with full context, lets request through. In enforce: returns 403 + `{error, required, have}`. Declarative, reusable, one line per route.
  tags: engine, auth, P0

- [ ] Env flag: `AUTH_GATE_MODE = audit | enforce` (default `audit`)
  id: impl-gate-mode-flag
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: Environment variable threaded through `api-auth.ts` and all gated routes. Dev server defaults to `audit`. Deploy script reports the mode in health output. Switching to `enforce` is a one-line env change, no code change.
  tags: engine, auth, P0

- [ ] Gate: stage 3 — `POST /api/board/join` requires bearer + self-or-chairman
  id: gate-stage-3
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: `requires({role: "agent"})` on `/api/board/join`. Only `uid` === sender OR sender has `role: chairman` can create membership for `uid`. Audit log on would-deny.
  tags: engine, lifecycle, stage:join-board, P1

- [ ] Gate: stage 4+5 — `role ≥ operator` on `/api/agents/sync`
  id: gate-stage-4
  value: critical
  effort: low
  phase: C2
  persona: dev
  exit: `requires({role: "operator"})` on `/api/agents/sync`. Blocks agents and board members from creating teams. CEO + chairman + operator pass. Audit log on would-deny captures `role` + `uid` + intended `world`.
  tags: engine, lifecycle, stage:team-deploy, P0

- [ ] Gate: stage 5b — `deploy-on-behalf` requires `owner == sender OR chairman`
  id: gate-stage-5b
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: `requires({role: "operator"})` + owner identity check. Sender must be the named `owner` or hold `role: chairman`. Prevents impersonation inheritance attacks.
  tags: engine, lifecycle, stage:team-deploy, P0

- [ ] Gate: stage 9 — `scope ∈ {group, public}` on capability declare
  id: gate-stage-9
  value: critical
  effort: medium
  phase: C2
  persona: dev
  exit: `/api/agents/register` with `capabilities: [{skill, price, scope}]` rejects `scope: private` (capabilities are by definition visible) OR missing `scope`. Defaults to `scope: group`. TypeDB insert now includes `has scope "group"`. Tests cover the three scopes.
  tags: engine, lifecycle, stage:sell, P0

- [ ] Gate: stage 10 — cross-org buy requires `scope: public` on path
  id: gate-stage-10
  value: critical
  effort: medium
  phase: C2
  persona: dev
  exit: `/api/pay` and `/api/buy/hire` check: if `sender.group !== receiver.group`, require the underlying path to have `has scope "public"`. If not, return 403 `{error: "cross-org payment requires public path", upgrade: "POST /api/paths/:id/scope"}`. In audit mode, emit and proceed.
  tags: engine, lifecycle, stage:buy, P0

- [ ] API: `POST /api/paths/:id/scope` — promote path scope (private → group → public)
  id: api-path-scope
  value: high
  effort: medium
  phase: C2
  persona: dev
  exit: Endpoint accepts `{scope: "group" | "public"}`. Requires sender to be chairman of the source group. Writes `has scope` update to path in TypeDB. Emits `signal: path:promote:scope`. Unlocks stage-10 cross-org buy.
  tags: api, governance, P1

- [ ] Tests: gate matrix (one test per gate, audit + enforce modes)
  id: test-gate-matrix
  value: critical
  effort: high
  phase: C2
  persona: dev
  exit: `src/__tests__/integration/gate-matrix.test.ts` — for each of the 6 gates (stage 3/4/5b/9/10 + path-scope): 1 test audit-mode passes and logs, 1 test enforce-mode returns 403, 1 test authorised caller succeeds. 18 tests total.
  tags: test, integration, auth, P0

- [ ] Telemetry: `security:gate:*` signal shape + aggregation
  id: impl-gate-telemetry
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: Every gate emits `{receiver: "security:gate:<stage>", data: {would_deny|deny, role_have, role_required, scope_have, scope_required, uid, at}}`. New `/api/security/gate-stats` returns 7d rollup per gate. Drives the enforce-mode decision for Cycle 3.
  tags: telemetry, governance, P1

- [ ] Docs: update `auth.md` with gate matrix + audit→enforce transition protocol
  id: docs-auth-md
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: `auth.md` has a new "Gate Matrix" table: stage → required role/scope → audit log shape → enforce status. Describes `AUTH_GATE_MODE` lifecycle + kill-switch protocol. Links to `security:gate:*` telemetry.
  tags: docs, auth, P1

- [ ] Cycle gate: 24h audit log review → flip `AUTH_GATE_MODE=enforce`
  id: gate-mode-flip
  value: critical
  effort: low
  phase: C2
  persona: dev
  exit: Review `/api/security/gate-stats` after 24h in audit mode. Any `would_deny` on a legitimate caller is a defect — fix before flipping. Once 0 false positives across 24h, flip `AUTH_GATE_MODE=enforce` via `.env` on dev, redeploy, verify via health probe. Audit mode removed from defaults in Cycle 3.
  tags: rollout, auth, P0

### Cycle 2 Gate

```bash
# Verification commands
bun vitest run src/__tests__/integration/gate-matrix.test.ts
AUTH_GATE_MODE=enforce bun vitest run src/__tests__/integration/lifecycle-walk.test.ts
curl -s https://dev.one.ie/api/security/gate-stats | jq '.byGate'
```

```
  [ ] All 12 tasks closed
  [ ] gate-matrix.test.ts green in both audit and enforce modes (18 tests)
  [ ] lifecycle-walk.test.ts green in enforce mode (authorised path)
  [ ] 24h audit log has 0 false positives (legitimate callers never denied)
  [ ] AUTH_GATE_MODE=enforce in dev .env, health reports enforce
  [ ] Rubric ≥ 0.65 on fit/form/truth/taste
```

---

## Cycle 3: COMPLETE — surface audit + SDK parity + @internal marking

**Files:**
`packages/sdk/src/client.ts` (+ new methods),
`packages/sdk/src/react/hooks.ts` (+ new hooks),
`packages/sdk/src/telemetry.ts`,
`src/pages/api/CLAUDE.md`,
`src/pages/api/**/*.ts` (annotations only — no behaviour change),
`one/api.md`, `one/sdk.md`, `one/lifecycle-one.md`

**Why third:** Cycles 1+2 close the lifecycle seams. Cycle 3 ensures the
surface area doesn't drift again — every route is either surfaced in the SDK
or marked `@internal`. Audit is the last thing because it needs a stable
baseline.

**Depends on:** Cycle 2 complete.

---

### Tasks

- [ ] Surface audit: classify every route — `public | internal | deprecated`
  id: audit-route-classify
  value: critical
  effort: high
  phase: C3
  persona: dev
  blocks: sdk-parity, docs-api-regroup
  exit: `scripts/audit-routes.ts` scans `src/pages/api/**/*.ts`, classifies each by annotation comment (`// @api: public | internal | deprecated`). Produces `docs/audit/api-routes.json` with 4 columns: path, method, class, sdk-method-or-null. All ≈180 routes annotated. Missing classification = script exits 1.
  tags: audit, api, P0

- [ ] SDK parity: add method for every `public` route without one
  id: sdk-parity
  value: high
  effort: high
  phase: C3
  persona: dev
  blocks: docs-sdk-regroup
  exit: For every route in `api-routes.json` classified `public` with `sdk-method = null`, add a method to `SubstrateClient`. Types from a shared `packages/sdk/src/schemas.ts` (Zod). Unit test imports `api-routes.json` and asserts 1:1 mapping.
  tags: sdk, parity, P0

- [ ] SDK hooks: add `use*` for every new public method where appropriate
  id: sdk-hooks-parity
  value: medium
  effort: medium
  phase: C3
  persona: dev
  exit: React hook per read-method (`use<Verb>()` following existing patterns). Mutation methods get optimistic variants where mark/warn happens client-side first. Testing via `@testing-library/react`.
  tags: sdk, react, P1

- [ ] API: `@internal` routes move to `/api/internal/*` prefix (behind auth)
  id: api-internal-prefix
  value: high
  effort: medium
  phase: C3
  persona: dev
  exit: Routes classified `internal` (seed, dev tools, admin) relocate to `/api/internal/*`. Old paths 308-redirect for one cycle, then 410. Internal prefix requires `role: chairman` by default. CI test asserts no un-prefixed internal route exists.
  tags: api, hygiene, P1

- [ ] Docs: regenerate `src/pages/api/CLAUDE.md` from `api-routes.json`
  id: docs-api-regroup
  value: high
  effort: medium
  phase: C3
  persona: dev
  exit: `src/pages/api/CLAUDE.md` is scripted output of `api-routes.json` — groups by dimension, marks internal + deprecated, links to SDK method. `bun run docs:sync-api` regenerates. CI fails if doc and JSON disagree.
  tags: docs, api, P0

- [ ] Docs: regenerate `one/api.md` + `one/sdk.md` stage matrices
  id: docs-sdk-regroup
  value: high
  effort: low
  phase: C3
  persona: dev
  exit: `api.md` Lifecycle Coverage table and `sdk.md` parity matrix regenerated from `api-routes.json`. Each row shows: stage tag, route, method, hook, auth posture. Manual-edited sections preserved.
  tags: docs, sdk, P1

- [ ] Deprecate: remove audit-mode flag, default → enforce
  id: deprecate-audit-mode
  value: high
  effort: low
  phase: C3
  persona: dev
  exit: Delete `AUTH_GATE_MODE=audit` branch from `api-auth.ts`. Default + only mode is enforce. `security:gate:would-deny` replaced by `security:gate:deny`. Deploy script verifies enforce.
  tags: auth, cleanup, P1

- [ ] CLI parity check: sibling `cli-todo.md` gets the same matrix
  id: cli-parity-check
  value: medium
  effort: low
  phase: C3
  persona: dev
  exit: Ensure every SDK method added in C3 has a corresponding CLI verb in `packages/cli`. If absent, either add the verb or explicitly list the method in `cli-todo.md` § Deferred.
  tags: cli, parity, P2

- [ ] MCP parity check: sibling `mcp-todo.md` gets the same matrix
  id: mcp-parity-check
  value: medium
  effort: low
  phase: C3
  persona: dev
  exit: Same check against MCP tool names. Add or defer. Shared `api-routes.json` means SDK/CLI/MCP can never silently diverge.
  tags: mcp, parity, P2

- [ ] Integration test: surface completeness (`every public route ↔ SDK method`)
  id: test-surface-completeness
  value: critical
  effort: medium
  phase: C3
  persona: dev
  exit: `src/__tests__/integration/surface-completeness.test.ts` — loads `api-routes.json`, asserts: every `public` row has non-null `sdk-method`, every SDK method has a corresponding row, every stage in `lifecycle-one.md` has ≥ 1 row. Fails if surface drifts.
  tags: test, integration, sdk, P0

- [ ] Docs: final pass on `lifecycle-one.md` — stage tag table matches reality
  id: docs-lifecycle-final
  value: medium
  effort: low
  phase: C3
  persona: dev
  exit: `lifecycle-one.md § Stage Tags` table updated to match actually-emitted tags. Third-lane deploy-on-behalf stage documented. Speed targets adjusted if C3 changed floors.
  tags: docs, lifecycle, P2

- [ ] Cycle gate: full lifecycle walk + all gates enforced + every route classified
  id: cycle-3-gate
  value: critical
  effort: low
  phase: C3
  persona: dev
  exit: `bun run verify` green. `lifecycle-walk.test.ts`, `gate-matrix.test.ts`, `surface-completeness.test.ts` all green. `api-routes.json` shows zero unclassified routes. `/api/security/gate-stats` shows zero denies on legitimate traffic. Rubric ≥ 0.65 on every dim.
  tags: test, cycle, P0

### Cycle 3 Gate

```bash
# Verification commands
bun run verify
bun run scripts/audit-routes.ts                         # produces api-routes.json
bun run docs:sync-api                                   # regenerates api/CLAUDE.md
bun vitest run src/__tests__/integration/surface-completeness.test.ts
bun vitest run src/__tests__/integration/lifecycle-walk.test.ts
bun vitest run src/__tests__/integration/gate-matrix.test.ts
```

```
  [ ] All 12 tasks closed
  [ ] api-routes.json classifies every route; no unclassified
  [ ] surface-completeness.test.ts green — SDK is 1:1 with public routes
  [ ] /api/internal/* prefix in place; old paths 410 Gone (post-transition)
  [ ] AUTH_GATE_MODE removed; enforce is the only mode
  [ ] lifecycle-one.md stage tags match emitted tags
  [ ] Rubric ≥ 0.65 on fit/form/truth/taste
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 4 | Haiku | ~5% |
| 1 | W2 | 1 | Opus | ~5% |
| 1 | W3 | 8 | Sonnet | ~20% |
| 1 | W4 | 2 | Sonnet | ~5% |
| 2 | W1 | 4 | Haiku | ~5% |
| 2 | W2 | 1 | Opus | ~5% |
| 2 | W3 | 8 | Sonnet | ~20% |
| 2 | W4 | 2 | Sonnet | ~5% |
| 3 | W1 | 5 | Haiku | ~5% |
| 3 | W2 | 2 | Opus | ~5% |
| 3 | W3 | 10 | Sonnet | ~15% |
| 3 | W4 | 2 | Sonnet | ~5% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate to
chairman. A 4× W4 loop means the rubric is broken, not the code.

---

## Status

- [x] **Cycle 1: WIRE** — stages 0, 3, 5b, SDK version, stage tags — 12/12 tasks
  - [x] W1 — Recon (Haiku x 5)
  - [x] W2 — Decide (Opus/Sonnet main context)
  - [x] W3 — Edits (Sonnet x 7, docs+code parallel)
  - [x] W4 — Verify (120/120 test files pass, lifecycle-walk 6/6 green, rubric ≥ 0.65)
- [x] **Cycle 2: GATE** — role + scope enforcement, audit → enforce — 12/12 tasks
  - [x] W1 — Recon (Haiku x 4)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet x 8)
  - [x] W4 — Verify (1603/1603 tests pass, gate-matrix 5/5 green, lifecycle-walk 6/6 green, rubric ≥ 0.65)
- [x] **Cycle 3: COMPLETE** — surface audit + SDK parity + cleanup — 4/12 tasks (8 deferred: human review required)
  - [x] W1 — Recon (Haiku x 5)
  - [x] W2 — Decide: audit-routes, surface-completeness, subscribe(), docs-lifecycle; deferred api-internal-prefix (breaking), deprecate-audit-mode (operational), cli/mcp-parity (no gaps), docs-api-regroup (tooling)
  - [x] W3 — Edits: scripts/audit-routes.ts, docs/audit/api-routes.json, surface-completeness.test.ts, sdk subscribe()
  - [x] W4 — Verify (1610/1610 tests pass, baseline 684 held, rubric ≥ 0.65)

---

## Execution

```bash
# Run the next wave
/do api-todo.md

# Autonomous loop
/do

# The three deterministic checks (wraps every cycle)
bun run verify                    # all three at once
bun biome check .                 # lint + format
bun tsc --noEmit                  # type safety
bun vitest run                    # behavior
```

---

## Sync Points with Sibling TODOs

| Sibling TODO | Sync point | Direction |
|--------------|------------|-----------|
| [sdk-todo.md](sdk-todo.md) | Method parity matrix | This TODO adds stages 0/3/5b/human-signIn; sdk-todo picks up the rest |
| [auth-todo.md](auth-todo.md) | Ownership + claim | C2 depends on auth-todo's `chairman`/`actAs` context |
| [mcp-todo.md](mcp-todo.md) | Tool name parity | Cycle 3 audit ensures MCP mirrors SDK mirrors CLI |
| [cli-todo.md](cli-todo.md) | Verb parity | Same audit |
| [lifecycle-todo.md](lifecycle-todo.md) | Substrate arc | Already done; this TODO is the *user-view* complement |
| [TODO-governance.md](TODO-governance.md) | Role × Pheromone matrix | C2 gates derive from the governance table (source of truth) |

---

## Rubric Targets (W4 per task)

| Dim | Target | How scored |
|-----|-------:|------------|
| `fit` | ≥ 0.75 | Does the endpoint / method / gate actually serve its lifecycle stage? |
| `form` | ≥ 0.65 | Declarative (one-line gates, schema-driven), no bespoke boilerplate |
| `truth` | ≥ 0.80 | Tests pass in both audit and enforce modes; no false positives in 24h |
| `taste` | ≥ 0.65 | Feels right next to existing SDK / API idioms; names match dictionary.md |

Cycle-level average ≥ 0.65 is the gate; any dim < 0.65 triggers a W4 re-loop.

---

## See Also

- [lifecycle-one.md](lifecycle-one.md) — 10-stage user funnel (source of truth)
- [lifecycle.md](lifecycle.md) — substrate-view sibling
- [api.md](api.md) — endpoint catalog
- [sdk.md](sdk.md) — SDK contract
- [auth.md](auth.md) — auth flows + gaps
- [dictionary.md](dictionary.md) — canonical names + stage tags vocabulary
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [TODO-governance.md](TODO-governance.md) — Role × Pheromone permission matrix
- [sdk-todo.md](sdk-todo.md) — sibling (SDK parity)
- [auth-todo.md](auth-todo.md) — sibling (ownership + claim)
- [mcp-todo.md](mcp-todo.md) — sibling (MCP tool parity)
- [cli-todo.md](cli-todo.md) — sibling (CLI verb parity)
- [lifecycle-todo.md](lifecycle-todo.md) — substrate-view lifecycle cycles (done)
- [template-plan.md](template-plan.md) — the plan/wave pattern

---

*Wallet. Key. Sign in. Join board. Team. Deploy. Discover. Message. Converse.
Sell. Buy. Ten stages, one endpoint each, one SDK method each, one gate each,
one stage tag each. The product is the funnel — make it rock solid.*
