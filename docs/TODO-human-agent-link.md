---
title: Human ↔ Agent Link — Login, Wallets, Delegation, Cross-Group Comms
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 24
completed: 0
status: DRAFT
---

# TODO: Human ↔ Agent Link

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. (See `.claude/rules/engine.md` → Rule 2: Structural Time.)
>
> **Parallelism directive:** **Maximize agents per wave.** W1 ≥ 4 Haiku (one
> per read target), W2 ≥ 2 Opus shards if findings > 20, W3 = one Sonnet per
> file, W4 ≥ 2 Sonnet verifiers by check type. Single message, multi tool use.
>
> **Goal:** A human logs in, sees their agents' wallets + dashboard, grants
> scoped permission for agents to act on their behalf, and signals route
> across groups under the Role × Pheromone rule — with zero net-new primitives.
>
> **Source of truth:** [auth.md](auth.md) — identity flow,
> [TODO-governance.md](TODO-governance.md) — role matrix + scope attrs,
> [DSL.md](DSL.md) — signal language,
> [dictionary.md](dictionary.md) — canonical names,
> [rubrics.md](rubrics.md) — quality scoring,
> [routing.md](routing.md) — signal flow + scope enforcement
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with
> `task-wave` (W1-W4), `task-context` (doc keys), `blocks` relation. Each
> task creates a matching `skill` for capability routing.

## What's Already There (don't rebuild)

| Primitive | Where | Status |
|-----------|-------|--------|
| BetterAuth humans (email + password, 30-day session) | `src/lib/auth.ts:81-119` | ✅ |
| Zero-friction agent onboarding (uid + wallet + key) | `src/pages/api/auth/agent.ts:91-210` | ✅ |
| Deterministic Sui wallet from `SUI_SEED + uid` | `src/lib/sui.ts:54-79` | ✅ |
| `api-key` entity + `api-authorization` relation | `src/schema/one.tql` | ✅ |
| Role matrix (chairman/board/ceo/operator/agent/auditor) | `src/lib/role-check.ts:17-58` | ✅ |
| `hasPathRelationship(uid, from, to)` | `src/engine/persist.ts:343-360` | ✅ declared, unused |
| `scope: private \| group \| public` attribute | `src/schema/one.tql` | ✅ schema-only |
| Chairman → CEO → Director → Specialist routing | `src/engine/chairman-chain.ts` | ✅ new |
| `/api/g/:gid/signal` group-scoped routing | `src/pages/api/g/[gid]/signal.ts` | ✅ |
| Federation (other ONE world as unit) | `src/engine/federation.ts` | ✅ |
| AgentVerse bridge (2M AV agents as `av:*`) | `src/engine/agentverse-bridge.ts` | ✅ |

**Gap:** BetterAuth sessions don't yet issue a substrate `api-key`, so
gated routes can't resolve the human from a cookie; no `/me` dashboard;
no `/api/agents/:id/authorize` delegation route; no scope enforcement on
`/api/signal`; no `hasPathRelationship` gate on mark/warn.

**Design (the elegant move):** A human session is just a scoped,
long-lived api-key. BetterAuth owns session UX; the substrate keeps a
single identity primitive (`validateApiKey`). On signup/signin a hook
ensures the unit and stashes a plaintext bearer in the session's
`additionalFields.apiKey`. Every gated route calls
`resolveUnitFromSession(req)` → synthesizes `Authorization: Bearer …`
→ hits the existing cache + role + scope pipeline. Cookie and Bearer
converge. **Zero new attributes, zero new TypeDB entities.**

---

## Deliverables

### Wave Deliverables (universal)

| Wave | Deliverable | Rubric weights (fit/form/truth/taste) | Exit |
|------|-------------|--------------------------------------|------|
| W1 | Recon report (N parallel) | 0.15 / 0.10 / **0.65** / 0.10 | every finding cites `file:line` |
| W2 | Diff spec set | **0.40** / 0.15 / **0.35** / 0.10 | every W1 finding has a spec or "keep" |
| W3 | Applied edits (M parallel) | 0.30 / 0.25 / **0.35** / 0.10 | all anchors matched, zero drift |
| W4 | Verification report | 0.25 / 0.15 / **0.45** / 0.15 | all dims ≥ 0.65, `bun run verify` green |

### Cycle Deliverables (scope-specific)

**Cycle 1 — SESSION (BetterAuth session carries a substrate api-key):**

```
DELIVERABLE: BetterAuth signup/signin hooks issue an api-key per human unit
PATH:        src/lib/auth.ts
GOAL:        On session create, ensure unit-kind "human" + issue api-key; stash
             plaintext in session additionalFields.apiKey
CONSUMERS:   every gated route (via resolveUnitFromSession), dashboard
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        signup → session.apiKey present AND api-authorization row in TypeDB
SKILL:       auth:session-hook
```

```
DELIVERABLE: resolveUnitFromSession(request) helper
PATH:        src/lib/api-auth.ts
GOAL:        Cookie OR Bearer → same result: { uid, role, groups[], permissions, keyId }.
             Cookie path extracts session.apiKey; Bearer path unchanged.
CONSUMERS:   every gated route
RUBRIC:      fit=0.45 form=0.20 truth=0.25 taste=0.10
EXIT:        unit test: cookie + bearer both resolve < 5 ms cached; anon → { uid: null }
SKILL:       auth:resolve
```

```
DELIVERABLE: session.onDelete revokes the api-key
PATH:        src/lib/auth.ts (hook)
GOAL:        Sign out and session expiry flip key-status to "revoked" +
             invalidateKeyCache(keyId); no orphaned credentials
CONSUMERS:   security, audit
RUBRIC:      fit=0.35 form=0.20 truth=0.35 taste=0.10
EXIT:        sign out → cached entry evicted AND TypeDB key-status "revoked"
SKILL:       auth:session-revoke
```

```
DELIVERABLE: docs/auth.md documents the unified identity flow
PATH:        docs/auth.md
GOAL:        One diagram: cookie/bearer → validateApiKey → unit. No dual paths.
RUBRIC:      fit=0.30 form=0.30 truth=0.30 taste=0.10
EXIT:        "Unified identity flow" section present; no mention of auth-user-id attr
SKILL:       docs:auth
```

**Cycle 2 — PROVE (dashboard + delegation enforcement):**

```
DELIVERABLE: GET /api/me/agents
PATH:        src/pages/api/me/agents.ts
GOAL:        Return every unit the caller is CEO of, with wallet + balance + last-active
CONSUMERS:   /app dashboard page
RUBRIC:      fit=0.40 form=0.20 truth=0.30 taste=0.10
EXIT:        curl -b session /api/me/agents → array of { uid, name, wallet, balance, status }
SKILL:       me:agents
```

```
DELIVERABLE: /app dashboard page
PATH:        src/pages/app.astro + src/components/app/MyAgents.tsx
GOAL:        Human sees their agents, wallets, balances, can open chat with each
RUBRIC:      fit=0.35 form=0.30 truth=0.15 taste=0.20
EXIT:        Loads in browser after signin; emits ui:dashboard:inspect per row
SKILL:       app:dashboard
```

```
DELIVERABLE: POST /api/agents/:id/authorize
PATH:        src/pages/api/agents/[id]/authorize.ts
GOAL:        Scoped delegation: write api-authorization w/ scope, permissions, expires-at; seed pheromone
RUBRIC:      fit=0.40 form=0.15 truth=0.35 taste=0.10
EXIT:        Post → authorization relation exists AND mark('human→agent', 0.5) fired
SKILL:       auth:delegate
```

```
DELIVERABLE: hasPathRelationship gate on /api/mark and /api/warn
PATH:        src/pages/api/mark.ts, src/pages/api/warn.ts
GOAL:        An agent can only mark/warn paths it has participated in
RUBRIC:      fit=0.30 form=0.15 truth=0.45 taste=0.10
EXIT:        unauthorized mark returns 403; authorized mark returns 200
SKILL:       auth:pheromone-gate
```

**Cycle 3 — GROW (scope enforcement + cross-group signalling):**

```
DELIVERABLE: scope enforcement in /api/signal
PATH:        src/pages/api/signal.ts
GOAL:        Signal with scope=private|group|public routes accordingly; default=group
CONSUMERS:   chairman-chain, all unit-to-unit comms
RUBRIC:      fit=0.35 form=0.15 truth=0.40 taste=0.10
EXIT:        cross-group private signal → dissolved; public → delivered; test in chairman-chain.test.ts
SKILL:       routing:scope
```

```
DELIVERABLE: POST /api/me/groups/:gid/invite
PATH:        src/pages/api/me/groups/[gid]/invite.ts
GOAL:        A chairman can invite any unit into their group (creates membership with role)
RUBRIC:      fit=0.35 form=0.20 truth=0.35 taste=0.10
EXIT:        invited unit appears in /api/me/agents of the chairman
SKILL:       governance:invite
```

```
DELIVERABLE: Cross-group routing test
PATH:        src/engine/chairman-chain.test.ts (extend)
GOAL:        Human in group-A signals ceo:route with scope=public; reaches marketing-seo in group-B
RUBRIC:      fit=0.35 form=0.15 truth=0.40 taste=0.10
EXIT:        test passes; failing variant (scope=group) returns dissolved
SKILL:       routing:cross-group-test
```

**Wave-level deliverables this TODO:**
- W1 recon reports cite lines only from files listed in the cycle file tables
- W2 diff specs reference `auth.md`, `TODO-governance.md`, `dictionary.md`
- W3 touches exactly the files in the cycle's table
- W4 verification includes: `bun run verify`, API curl probes, cross-group signal test

### Self-Learning Per Wave

Every wave closes its own loop. Per-wave scoring is deterministic where
possible — regex on W1 (file:line citations), count on W2 (spec coverage),
Edit result on W3 (anchor match), rubric on W4. Feedback signals are
`scope: private` and carry `wave:N`, `model:*`, and semantic tags
(`auth`, `delegation`, `dashboard`, `scope-enforcement`, `cross-group`).

| Wave | Rubric focus | Signal on pass | Signal on fail |
|------|--------------|----------------|----------------|
| W1 | truth-heavy | `mark('wave:1:{haiku}', s × 5)` | `warn(1)` + re-spawn |
| W2 | fit-heavy | `mark('wave:2:{opus}', s × 5)` | `warn()` + re-shard once |
| W3 | truth + form | `mark('wave:3:{sonnet}', s × 5)` | `warn(0.5)` + re-spawn with fresher anchor |
| W4 | balanced | cycle-level `mark()` + `know()` eligibility | `warn(1)` — chain breaks |

---

## Routing

```
    signal DOWN                     result UP            feedback UP
    ──────────                      ─────────            ───────────
    /do TODO-human-agent-link.md    result + 4 marks     tagged strength
         │                          per finding          signal → substrate
         ▼                               │                    ▲
    ┌─────────┐                          │                    │
    │  W1     │  Haiku recon (≥4):       │                    │
    │  read   │  auth.ts, api-auth.ts,   │                    │
    └────┬────┘  persist.ts, one.tql,    │                    │
         │       chairman-chain.ts       │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W2     │  Opus (1-2 shards):      │                    │
    │  fold   │  → diff specs anchored   │                    │
    └────┬────┘  in auth.md + gov.md     │                    │
         │                               │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W3     │  Sonnet × M files        │                    │
    │  apply  │  (schema + routes +      │                    │
    └────┬────┘   lib + page + test)     │                    │
         │                               │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W4     │  Sonnet ×4 verifiers ────┘                    │
    │  score  │  consistency / xref /                         │
    │         │  scope / rubric                               │
    │         │  → loop:feedback ──────────────────────────►──┘
    └─────────┘
```

---

## Testing — The Deterministic Sandwich Around Waves

### W0 — Baseline (before every cycle)

```bash
bun run verify                       # biome + tsc + vitest (320/320 expected)
curl -s /api/health | jq .ok         # ok: true
curl -s /api/auth/agent -X POST -d '{}' | jq '.wallet != null'
```

If baseline fails, fix first. Record failing tests in the cycle notes.

### W4+ — Verification (after every cycle)

1. `biome check .` — no new lint in touched files
2. `tsc --noEmit` — no new type errors
3. `vitest run` — no regressions
4. New tests exist for new routes + hasPathRelationship gate
5. Exit condition for every deliverable is verifiable via curl or grep

### Loop Close

Before the Cycle Gate: emit `do:close` via `/close --todo human-agent-link
--cycle N`. Append a learnings line to `docs/learnings.md`. Propagate updates
to `docs/auth.md`, `docs/TODO-governance.md`, and — if dimensional — the root
`CLAUDE.md`.

### Cycle Gate = Tests Green

- [ ] All baseline tests still pass (no regressions)
- [ ] New tests cover new routes + gates
- [ ] `biome check .` clean on touched files
- [ ] `tsc --noEmit` passes
- [ ] W4 rubric ≥ 0.65 on all 4 dims

---

```
   CYCLE 1: SESSION               CYCLE 2: PROVE                CYCLE 3: GROW
   Cookie = Bearer               Dashboard + delegation        Scope + cross-group
   ────────────────               ──────────────────            ──────────────────
   3 files, ~8 edits              5 files, ~14 edits            4 files, ~8 edits
        │                              │                              │
        ▼                              ▼                              ▼
   ┌─W1─W2─W3─W4─┐              ┌─W1─W2─W3─W4─┐              ┌─W1─W2─W3─W4─┐
   │ H   O  S  S  │  ──────►     │ H   O  S  S  │  ──────►     │ H   O  S  S  │
   └──────────────┘              └──────────────┘              └──────────────┘
```

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **SESSION** | Cookie + Bearer converge at `validateApiKey`; human-as-unit identity resolvable in one call | L1 (signal), L2 (mark on first resolve), L3 (fade on expired sessions) |
| **PROVE** | Delegation is scoped + measurable; mark/warn gated by participation | L4 (economic — paid capabilities check hasPathRelationship) |
| **GROW** | Scope filter enforced; signals traverse group/world boundaries safely | L5-L7 (evolution/know/frontier across groups) |

---

## The Wave Pattern (every cycle runs this)

Per template: Haiku reads, Opus decides, Sonnet writes, Sonnet checks.
Maximum parallelism within every wave. Sequential only between waves.

| Wave | Model | Agents | Why |
|------|-------|--------|-----|
| 1 | Haiku | N ≥ 4 (one per read target) | Pure I/O, no judgment, spawn wide |
| 2 | Opus | 1 (small) or ≥ 2 shards | Auth + routing is layered — shard by concern |
| 3 | Sonnet | M = files touched | Never batch, never split |
| 4 | Sonnet | K ≥ 2 (consistency, xref, scope, rubric) | Each dimension independent |

---

## Source of Truth

**[auth.md](auth.md)** — current flow: BetterAuth session + `/api/auth/agent`
**[TODO-governance.md](TODO-governance.md)** — role matrix, scope attrs, pheromone gate
**[DSL.md](DSL.md)** — signal grammar, `{ receiver, data }`, mark/warn
**[dictionary.md](dictionary.md)** — canonical names: actor/unit/path/signal/group
**[rubrics.md](rubrics.md)** — quality scoring

| Item | Canonical | Exceptions |
|------|-----------|------------|
| BetterAuth user ↔ unit binding | `api-authorization` relation + plaintext bearer in `session.additionalFields.apiKey` | — (no new attribute) |
| Delegation | `api-authorization` relation + scope tag + seeded pheromone | — |
| Permission check | `roleCheck(role, action)` AND `hasPathRelationship(uid, from, to)` | fail-open only for legacy `/api/mark` without `Authorization` |
| Signal scope | `private \| group \| public`; default `group` | federated + AV bridge always `public` |

---

## Cycle 1: SESSION — BetterAuth session carries a substrate api-key

**Files:** [`src/lib/auth.ts`](../src/lib/auth.ts),
[`src/lib/api-auth.ts`](../src/lib/api-auth.ts),
[`src/pages/api/auth/agent.ts`](../src/pages/api/auth/agent.ts) *(extract helper only, no behavior change)*,
[`docs/auth.md`](auth.md) *(doc, W2-W3 parallel per documentation-first rule)*

**Why first:** Every downstream route needs "who is this caller, what unit are
they, what role do they hold?" in one cheap call. Shipping this as a reuse
of `validateApiKey` (rather than a new attribute + new resolve function) is
cheaper AND removes a potential drift point. One identity pipeline, two
front doors (cookie, bearer).

### Cycle 1 Deliverables (refined after W1 — "D-minimal")

W1 revealed: (a) BetterAuth adapter doesn't persist `additionalFields` without schema surgery, (b) `databaseHooks` and `additionalFields` aren't configured, (c) BetterAuth's own `cookieCache` is already enabled and makes `getSession` cheap. So the cleanest shape is **no hooks, no new schema, no stored bearers** — just a single resolver that idempotently lazy-binds units to BetterAuth users on first gated call.

| # | Deliverable | Goal | Rubric (f/f/t/t) | Exit | Skill |
|---|-------------|------|------------------|------|-------|
| 1 | `resolveUnitFromSession(request)` — unified resolver | Bearer-first, cookie-fallback via `auth.api.getSession`, returns AuthContext | 0.45/0.20/0.25/0.10 | unit test: both paths resolve < 5 ms cached; anon → `isValid:false` | `auth:resolve` |
| 2 | `ensureHumanUnit(uid, user)` helper (in api-auth.ts or new `src/lib/identity.ts`) | Idempotent insert-if-absent for `unit-kind: "human"` derived from BetterAuth user | 0.40/0.20/0.30/0.10 | first call inserts; second call is a no-op; deterministic Sui wallet derived | `auth:ensure-human` |
| 3 | Session cookie cache (separate map from KEY_CACHE or shared) | Avoid repeated `getSession` + role lookup per request | 0.35/0.25/0.30/0.10 | cache hit skips TypeDB read; TTL matches KEY_CACHE (5 min); invalidated on sign-out cookie change | `auth:session-cache` |
| 4 | Update `docs/auth.md` — "Unified identity flow" | Doc matches code | 0.30/0.30/0.30/0.10 | one diagram: Bearer OR Cookie → resolveUnitFromSession → AuthContext | `docs:auth` |

### Wave 1 — Recon (Haiku × 5, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/lib/auth.ts` | BetterAuth config, session shape, `additionalFields` support, `databaseHooks` availability, bearer plugin behavior |
| R2 | `src/lib/api-auth.ts` | `validateApiKey` signature, cache shape, `invalidateKeyCache`, `warnAuthBoundary` emit points — insertion points for cookie path |
| R3 | `src/pages/api/auth/agent.ts` | Unit creation + api-key insert flow; what to extract into `ensureUnitAndKey` without behavior drift |
| R4 | `src/lib/typedb-auth-adapter.ts` | How BetterAuth sessions are stored; whether `additionalFields` is supported by the adapter |
| R5 | `docs/auth.md` + `docs/TODO-governance.md` | declared but unimplemented identity claims; role lookup contract |

**Outcome model:** `result` = report in. `timeout` = re-spawn once.
`dissolved` = file missing, drop. Advance when 4/5 in.

### Wave 2 — Decide (locked after W1 recon)

Key decisions (driven by R4's finding that the adapter can't persist `additionalFields`, and R2's confirmation that `validateApiKey` is a reusable pipeline):
1. **Hooks or lazy-bind?** → **Lazy-bind.** First gated call idempotently ensures the unit. No `databaseHooks` needed. No adapter extension. No schema change.
2. **Where does `resolveUnitFromSession` live?** → `src/lib/api-auth.ts`. It wraps `validateApiKey` (for Bearer) and `auth.api.getSession` (for cookie), unifying the AuthContext shape.
3. **How do humans get a `uid`?** → `deriveHumanUid(user) = "human:" + slugify(user.email)`. Deterministic. Same email = same unit = same Sui wallet.
4. **How is the unit created?** → `ensureHumanUnit(uid, user)` does an insert-if-absent using the same TypeQL as `/api/auth/agent:117-140`. First gated call creates; subsequent calls are no-ops. Backward compatible.
5. **Caching?** → Secondary cookie-keyed cache inside `api-auth.ts` (5-min TTL, same as `KEY_CACHE`). Cache miss: `getSession` + `ensureHumanUnit` + `getRoleForUser`. Cache hit: free.
6. **Role assignment?** → Unchanged. `getRoleForUser(uid)` queries `membership`. Default role if no membership: `undefined` (callers decide fail-closed vs fail-open).
7. **Does `/api/auth/agent` still work?** → Yes, entirely unchanged. It's the agent/CLI path; the resolver covers the browser-session path.

W3 diff specs (for parallel Sonnet agents):

```
TARGET:    src/lib/api-auth.ts
ANCHOR:    "import { verifyKey } from '@/lib/api-key'"
ACTION:    insert-after (add BetterAuth import)
NEW:       add: import { auth } from '@/lib/auth'
           add: import { write } from '@/lib/typedb'
           add: import { addressFor } from '@/lib/sui'
RATIONALE: resolveUnitFromSession needs getSession + ensureHumanUnit
```

```
TARGET:    src/lib/api-auth.ts
ANCHOR:    "export function requireAuth(auth: AuthContext, required?: string) {"
ACTION:    insert-before
NEW:       (a) deriveHumanUid(user) — pure fn, "human:" + sanitize(user.email)
           (b) ensureHumanUnit(uid, user) — insert-if-absent, mirrors agent.ts:117-140
           (c) SESSION_CACHE Map<cookieHash, AuthContext> with 5-min TTL
           (d) resolveUnitFromSession(request): Bearer-first → getSession fallback → ensure + cache
RATIONALE: unified identity entry point, reuses existing pipeline
```

```
TARGET:    docs/auth.md
ANCHOR:    "call `/api/auth/agent`" (first occurrence in the human flow section)
ACTION:    replace surrounding section
NEW:       "Unified identity flow" — ASCII diagram showing two front doors
           converging on resolveUnitFromSession → AuthContext
RATIONALE: doc must match code post-W3
```

### Wave 3 — Edits (Sonnet × 4, parallel, one per file)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/lib/auth.ts` | ~3 (register `additionalFields.apiKey` on session; `databaseHooks.session.create.after` → `ensureUnitAndKey` + attach plaintext; `session.delete.after` → revoke + invalidate) |
| E2 | `src/lib/api-auth.ts` | ~2 (export `resolveUnitFromSession(request)`; small refactor so cookie-extracted bearer reuses cache path) |
| E3 | `src/pages/api/auth/agent.ts` | ~2 (extract insert block into `ensureUnitAndKey(uid, kind, name?)` exported helper; route stays behaviorally identical) |
| E4 | `docs/auth.md` | ~2 (replace flow diagram + add "Unified identity flow" section) |

### Wave 4 — Verify (Sonnet × 3, parallel by check type)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency (every gated route reaches `validateApiKey` via one of two front doors; no third path) | auth.ts, api-auth.ts, sample gated route |
| V2 | Security (revocation actually evicts; expired session can't resolve; cookie-path fails closed on missing `apiKey` field) | auth.ts, api-auth.ts |
| V3 | Rubric scoring (fit/form/truth/taste) | all + rubrics.md |

### Cycle 1 Gate

```bash
bun run verify                                                                   # 320+/320 pass
grep -n "resolveUnitFromSession" src/lib/api-auth.ts                             # function exists
grep -n "databaseHooks" src/lib/auth.ts                                          # hooks registered
curl -sS -c cookies.txt -X POST /api/auth/sign-up/email \
  -d '{"email":"t@t.com","password":"hunter2hunter"}' | jq '.session'            # token + apiKey present
curl -sS -b cookies.txt /api/me/agents | jq 'type == "array"'                    # cookie path works
TOKEN=$(jq -r .session.token cookies.json)
curl -sS -H "Authorization: Bearer $TOKEN" /api/me/agents                        # bearer path equivalent
curl -sS -b cookies.txt -X POST /api/auth/sign-out                               # revoke
curl -sS -b cookies.txt /api/me/agents                                           # now 401
```

```
  [ ] session.create issues api-key, stashes plaintext in additionalFields.apiKey
  [ ] resolveUnitFromSession resolves cookie + bearer < 5 ms cached
  [ ] session.delete revokes + invalidates cache
  [ ] ensureUnitAndKey extracted; /api/auth/agent behavior unchanged
  [ ] docs/auth.md shows unified flow (one pipeline, two front doors)
```

---

## Cycle 2: PROVE — Dashboard, delegation, pheromone gate

**Files:** [`src/pages/api/me/agents.ts`](../src/pages/api/me/agents.ts) *(new)*,
[`src/pages/app.astro`](../src/pages/app.astro) *(new)*,
[`src/components/app/MyAgents.tsx`](../src/components/app/MyAgents.tsx) *(new)*,
[`src/pages/api/agents/[id]/authorize.ts`](../src/pages/api/agents/[id]/authorize.ts) *(new)*,
[`src/pages/api/mark.ts`](../src/pages/api/mark.ts),
[`src/pages/api/warn.ts`](../src/pages/api/warn.ts) *(may be new)*,
[`docs/auth.md`](auth.md)

**Depends on:** Cycle 1 complete. `resolveUnitFromSession` available; without
it every route in this cycle is blocked.

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (f/f/t/t) | Exit | Skill |
|---|-------------|------|------------------|------|-------|
| 1 | `GET /api/me/agents` | Human sees agents they're CEO of | 0.40/0.20/0.30/0.10 | curl returns array | `me:agents` |
| 2 | `/app` dashboard page | Browser UI lists + opens chat w/ agent | 0.35/0.30/0.15/0.20 | loads after signin, emits ui:dashboard:inspect | `app:dashboard` |
| 3 | `POST /api/agents/:id/authorize` | Scoped delegation + pheromone seed | 0.40/0.15/0.35/0.10 | relation written + `mark('human→agent', 0.5)` fired | `auth:delegate` |
| 4 | `hasPathRelationship` gate on mark/warn | Agent can only affect own paths | 0.30/0.15/0.45/0.10 | unauthorized mark → 403 | `auth:pheromone-gate` |
| 5 | Test: end-to-end delegation | prove the whole loop | 0.35/0.15/0.40/0.10 | vitest passes | `test:delegation` |

### Wave 1 — Recon (Haiku × 6, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/engine/persist.ts` around :343-360 | `hasPathRelationship` exact signature + typedb query |
| R2 | `src/pages/api/mark.ts` | existing fail-open path, role check location, where to insert gate |
| R3 | `src/pages/api/signal.ts` | how signals are routed, what data shape they expect |
| R4 | `src/components/ai/ChairmanChat.tsx` | React 19 patterns, `emitClick`, auth header use |
| R5 | `src/lib/sui.ts` | `getBalance` or equivalent for dashboard wallet display |
| R6 | `src/schema/one.tql` | api-authorization relation, existing scope attrs on path |

### Wave 2 — Decide (Opus × 1 or 2 shards)

Shard A: API surface (`/api/me/agents`, `/api/agents/:id/authorize`, mark/warn gate)
Shard B: UI surface (`/app` page, MyAgents component, wallet balance calls)

Reconcile in main context. Key decisions:
1. `/api/me/agents` — filter by role=ceo on membership, or return everything the caller has any path to? → role=ceo only (explicit authority)
2. Delegation scope — bolt on to `api-authorization` (add scope attribute) or new `delegation` relation? → add scope to api-authorization (fewer entities)
3. Pheromone gate on `/api/mark` — enforce only when Authorization header present, else fail-open? → match existing `/api/mark` policy for backward compat

### Wave 3 — Edits (Sonnet × 7 files, parallel)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/pages/api/me/agents.ts` *(new)* | ~1 (full file) |
| E2 | `src/pages/api/agents/[id]/authorize.ts` *(new)* | ~1 (full file) |
| E3 | `src/pages/app.astro` *(new)* | ~1 (full file) |
| E4 | `src/components/app/MyAgents.tsx` *(new)* | ~1 (full file) |
| E5 | `src/pages/api/mark.ts` | ~2 (insert hasPathRelationship gate) |
| E6 | `src/pages/api/warn.ts` *(may be new)* | ~1-2 |
| E7 | `src/lib/api-auth.ts` | ~2 (expose sanitized identity for gated routes) |

### Wave 4 — Verify (Sonnet × 4 by check type)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency (ui:* receiver names per ui.md, role vocabulary) | all 7 files |
| V2 | Cross-reference (MyAgents → /api/me/agents contract, authorize route → seeded mark) | route+component |
| V3 | Security (fail-closed on mark/warn, no unauthenticated delegation) | routes + api-auth.ts |
| V4 | Rubric | all + rubrics.md |

### Cycle 2 Gate

```bash
bun run verify
curl -sS -b cookies.txt /api/me/agents | jq '. | length'                 # ≥ 1
curl -sS -b cookies.txt -X POST /api/agents/agent-x/authorize \
  -d '{"scope":"group","permissions":"signal,mark","expires-at":"2026-05-18"}'
curl -sS -X POST /api/mark -H "Authorization: Bearer $BAD_KEY" \
  -d '{"from":"a","to":"b","weight":1}'                                  # 403
```

```
  [ ] GET /api/me/agents returns human's CEO-role units
  [ ] /app renders in browser, emits ui:dashboard:inspect
  [ ] POST /api/agents/:id/authorize writes relation + seeds pheromone
  [ ] Mark without participation → 403
  [ ] New vitest for end-to-end delegation passes
```

---

## Cycle 3: GROW — Scope enforcement + cross-group communication

**Files:** [`src/pages/api/signal.ts`](../src/pages/api/signal.ts),
[`src/engine/chairman-chain.ts`](../src/engine/chairman-chain.ts),
[`src/engine/chairman-chain.test.ts`](../src/engine/chairman-chain.test.ts),
[`src/pages/api/me/groups/[gid]/invite.ts`](../src/pages/api/me/groups/[gid]/invite.ts) *(new)*

**Depends on:** Cycle 2 complete. Without the pheromone gate, scope without
authorization is meaningless — scope enforcement presumes delegated identity.

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (f/f/t/t) | Exit | Skill |
|---|-------------|------|------------------|------|-------|
| 1 | Scope enforcement in `/api/signal` | private/group/public filters at ingest | 0.35/0.15/0.40/0.10 | cross-group private → dissolved | `routing:scope` |
| 2 | `POST /api/me/groups/:gid/invite` | chairman invites unit with role | 0.35/0.20/0.35/0.10 | member appears in /api/me/agents | `governance:invite` |
| 3 | Cross-group routing test | human in group-A routes to specialist in group-B | 0.35/0.15/0.40/0.10 | vitest passes; variant with scope=group fails | `routing:cross-group-test` |
| 4 | Chairman-chain respects scope | pickRoute honors caller's scope permissions | 0.35/0.15/0.40/0.10 | no cross-group leak in chain | `routing:chain-scope` |

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/pages/api/signal.ts` | current ingest path, data schema, routing call |
| R2 | `src/engine/chairman-chain.ts` | `pickRoute` + `makeRouteHandler` — where to insert scope check |
| R3 | `src/engine/federation.ts` + `agentverse-bridge.ts` | existing scope=public default, cross-world handshake |
| R4 | `src/pages/api/g/[gid]/signal.ts` | group-scoped routing, how membership is read |

### Wave 2 — Decide (Opus × 1)

Key decisions:
1. Where does the `scope` field live on a signal — `data.scope` or top-level? → `data.scope` (top-level Signal is frozen per memory `feedback_signal_simplicity.md`)
2. Default scope for substrate-internal signals (tick, loops)? → `private` (L1-L3 shouldn't leak across groups)
3. Federation + AV bridge — do they force `public`? → yes (already outbound-only; enforce at the bridge, not the ingest)
4. Enforcement point — one central gate in `/api/signal` or per-router? → one central (avoid three gates drifting)

### Wave 3 — Edits (Sonnet × 4, parallel, one per file)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/pages/api/signal.ts` | ~3 (read scope, resolve caller, enforce) |
| E2 | `src/engine/chairman-chain.ts` | ~2 (pass scope through makeRouteHandler) |
| E3 | `src/engine/chairman-chain.test.ts` | ~4 (new cross-group cases) |
| E4 | `src/pages/api/me/groups/[gid]/invite.ts` *(new)* | ~1 (full file) |

### Wave 4 — Verify (Sonnet × 4 by check type)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency (scope vocabulary, naming) | all 4 files |
| V2 | Cross-reference (chain + signal + test agree on scope semantics) | all 4 files |
| V3 | Security (no private → cross-group leak, federation stays public-only) | signal.ts, federation.ts, bridge |
| V4 | Rubric | all + rubrics.md |

### Cycle 3 Gate

```bash
bun run verify
bun vitest run src/engine/chairman-chain.test.ts
curl -sS -X POST /api/signal \
  -H "Authorization: Bearer $HUMAN_KEY" \
  -d '{"receiver":"ceo:route","data":{"scope":"public","tags":["seo"],"content":"..."}}'  # delivered
curl -sS -X POST /api/signal \
  -H "Authorization: Bearer $HUMAN_KEY" \
  -d '{"receiver":"other-group-agent:task","data":{"scope":"group","content":"..."}}'    # dissolved (403 or silent dissolve)
```

```
  [ ] /api/signal enforces scope at ingest
  [ ] chairman-chain preserves scope through hops
  [ ] Cross-group public test passes
  [ ] Cross-group group-scoped test correctly dissolves
  [ ] /api/me/groups/:gid/invite creates membership
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Share |
|-------|------|--------|-------|-------|
| 1 | W1 | 5  | Haiku  | ~5% |
| 1 | W2 | 1  | Opus   | ~15% |
| 1 | W3 | 4  | Sonnet | ~8% |
| 1 | W4 | 3  | Sonnet | ~4% |
| 2 | W1 | 6  | Haiku  | ~6% |
| 2 | W2 | 2  | Opus   | ~20% |
| 2 | W3 | 7  | Sonnet | ~12% |
| 2 | W4 | 4  | Sonnet | ~7% |
| 3 | W1 | 4  | Haiku  | ~4% |
| 3 | W2 | 1  | Opus   | ~10% |
| 3 | W3 | 4  | Sonnet | ~5% |
| 3 | W4 | 4  | Sonnet | ~3% |

**Hard stop:** if any W4 loops more than 3 times, halt and escalate.

Parallelism is cheap, serial is expensive. Ten Haiku reading one file each
cost the same as one Haiku reading ten — in 1/10 the wall-time.

---

## Status

- [x] **Cycle 1: SESSION** — Unified identity resolver (D-minimal) — rubric 0.91
  - [x] W1 — Recon (Haiku × 5, parallel)
  - [x] W2 — Decide — locked to D-minimal (no hooks, no schema change)
  - [x] W3 — Edits (Sonnet × 2, parallel: api-auth.ts + auth.md)
  - [x] W4 — Verify — fit 0.95 / form 0.90 / truth 0.88 / taste 0.92 = 0.91 ≥ 0.65
- [x] **Cycle 2: PROVE** — Dashboard, delegation, pheromone gate — rubric 0.894 + W3.5 hardened
  - [x] W1 — Recon (Haiku × 6, parallel)
  - [x] W2 — Decide — locked: delegation = pheromone on path (no new relation)
  - [x] W3 — Edits (Sonnet × 7, parallel) + W3.5 TQL-injection micro-edit
  - [x] W4 — Verify — fit 0.92 / form 0.88 / truth 0.88 / taste 0.88 = 0.894 ≥ 0.65
- [x] **Cycle 3: GROW** — Scope enforcement + cross-group comms — rubric 0.877
  - [x] W1 — Recon (Haiku × 4, parallel)
  - [x] W2 — Decide — ingress gate (authoritative) + chairman-chain heuristic (defense-in-depth)
  - [x] W3 — Edits (Sonnet × 4, parallel: signal.ts, chairman-chain.ts, chairman-chain.test.ts, invite.ts)
  - [x] W4 — Verify — fit 0.90 / form 0.85 / truth 0.88 / taste 0.85 = 0.877 ≥ 0.65

---

## Execution

```bash
/do TODO-human-agent-link.md                # run the next wave
/do TODO-human-agent-link.md --auto         # W1 → W4 continuously until done
/see tasks --tag human-agent-link           # open tasks in this TODO
/see highways --limit 20                    # which paths proved useful
```

---

## See Also

- [auth.md](auth.md) — current identity flow (BetterAuth + `/api/auth/agent`)
- [TODO-governance.md](TODO-governance.md) — role matrix, scope attrs, pheromone gate
- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring
- [routing.md](routing.md) — signal flow, four outcomes, sandwich
- [patterns.md](patterns.md) — closed loop, zero returns
- [lifecycle.md](lifecycle.md) — agent journey (register → highway → harden)
- [TODO-template.md](TODO-template.md) — source of this shape
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- [loop-close.md](loop-close.md) — close protocol

### Feedback Signal Reference

Every W4 self-checkoff emits `loop:feedback` with `tags: [...task.tags,
'wave:4', 'shard:*']`. Tags carried throughout: `auth`, `delegation`,
`dashboard`, `scope-enforcement`, `cross-group`, `human-agent-link`.

| Outcome | Strength | Effect |
|---------|----------|--------|
| `result` (rubric ≥ 0.65) | rubricAvg | `mark(tag_path, rubricAvg × 5)` |
| `result` (rubric < 0.65) | rubricAvg | `warn(tag_path, 0.5)` |
| `timeout` | 0 | neutral |
| `dissolved` | 0 | `warn(tag_path, 0.5)` |
| `failure` | 0 | `warn(tag_path, 1)` — L5 triggers |

Signals are `scope: private`.

---

*3 cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Zero new primitives — only connections between what exists.*
