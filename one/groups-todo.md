---
title: Groups — Multi-tenancy, Hierarchy, Mixed Human/Agent Membership
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 32
completed: 0
status: PROPOSED
---

# TODO: Groups

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path. (See `.claude/rules/engine.md` → The Three Locked Rules.)
>
> **Parallelism directive (read first):** **Maximize agents per wave.** W1 ≥ 4
> Haiku (one per read target), W2 ≥ 2 Opus shards when findings exceed ~20,
> W3 = one Sonnet per file (never batch, never split), W4 ≥ 2 Sonnet verifiers
> sharded by check type. Sequential between waves, maximum parallel within.
>
> **Goal:** Land the group primitive as the substrate's tenancy + security
> layer — one entity, one rule (membership gates routing), mixed human/agent
> composition at every node (chairman/CEO/director/specialist), and zero
> separate ACL tables.
>
> **Source of truth:** [groups.md](groups.md) — what the system must do,
> [dsl.md](dsl.md) — the signal grammar,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark),
> [auth.md](auth.md) — identity, API keys, wallet derivation,
> [one-ontology.md](one-ontology.md) — the 6 dimensions,
> [routing.md](routing.md) — deterministic sandwich + bridge behavior,
> [loop-close.md](loop-close.md) — verify → signal → propagate protocol.
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks.
>
> **Schema:** Tasks map to `src/schema/one.tql` dimension 3b — `task` entity
> with `task-wave` (W1–W4), `task-context` (doc keys), `blocks` relation.
> Each deliverable creates a matching `skill` for capability routing.

---

## The Core Insight

**The 6-dimension ontology already encodes multi-tenancy + mixed
human/agent membership.** What's missing is attribute polish and API
surface. Specifically:

| Dimension | What groups.md asks for | What exists | Gap |
|-----------|------------------------|-------------|-----|
| 1 Groups | `group` + `hierarchy` + `membership(role)` | ✓ `src/schema/one.tql:14–96` | `visibility`, `signal.scope` |
| 2 Actors | Humans + agents symmetric | ✓ `actor-type: human\|agent\|animal\|world` | — |
| 4 Paths | `bridge-kind` on cross-root edges | ✗ not in schema | add attribute |
| 5 Events | Signal scope enforced | Gate works (`signal.ts:260–306`); `signal` entity doesn't own `scope` | persist on write |
| — | Group-aware role lookup | `getRoleForUser(uid)` returns first role | needs `(uid, gid)` variant |
| — | `gid` vs `group-id` naming | Schema uses `gid`; 5+ queries use `group-id` (never match) | rename sweep |
| — | Per-group pheromone | Pheromone global | partition on `path.scope = gid` |
| — | Hierarchy closure | Not implemented | TQL `fun` for descent |

**Humans and agents compose at three positions:**

```
Origin     Chairman (human) signals into the group
             │
             ▼
Router     CEO / Director units — deterministic pheromone follow, NO LLM
           (can be human-approved or bot-routed; interface identical)
             │
             ▼
Leaf       Specialist (LLM) OR human expert
             │
             ▼
Close      { result } → mark()   { dissolved } → warn(0.5)   (none) → warn(1)
```

The `chairman-chain.ts` already does this at runtime. What this TODO adds
is the group-level machinery around it so a tenant can safely mix humans
and agents in nested sub-groups.

---

## Deliverables

**Wave Deliverables (universal — every cycle emits these four)**

| Wave | Deliverable | Goal | Rubric weights (fit/form/truth/taste) | Exit condition |
|------|-------------|------|--------------------------------------|----------------|
| **W1** | Recon report (N parallel) | Inventory the truth on disk — findings with line numbers, verbatim | 0.15 / 0.10 / **0.65** / 0.10 | ≥ (N-1)/N agents returned `result`; every finding cites file:line |
| **W2** | Diff spec set | Decide every finding → `{anchor, action, new, rationale}`; resolve shard conflicts | **0.40** / 0.15 / **0.35** / 0.10 | Every W1 finding has a spec OR an explicit "keep" rationale |
| **W3** | Applied edits (M parallel) | Transform diff specs into real file changes without collateral drift | 0.30 / 0.25 / **0.35** / 0.10 | All anchors matched; zero files modified outside the spec set |
| **W4** | Verification report | Prove cycle is clean: rubric ≥ 0.65, tests green, lint clean, types clean | 0.25 / 0.15 / **0.45** / 0.15 | All 4 rubric dims ≥ 0.65 AND `bun run verify` green |

### Cycle Deliverables (scope-specific — listed per cycle below)

Each cycle ships:
- Schema diffs to `src/schema/one.tql` (Cycle 1 only)
- API endpoints under `/api/groups/*` (Cycles 2–3)
- Engine changes to `src/engine/persist.ts` + `src/lib/api-auth.ts`
- Test coverage for the deterministic-sandwich path
- Doc updates to `groups.md` marking each invariant as ✓ implemented

---

## Routing

```
    signal DOWN                     result UP            feedback UP
    ──────────                      ─────────            ───────────
    /do groups-todo.md              result + 4 tagged    tagged strength
         │                          marks                signal → substrate
         ▼                               │                    ▲
    ┌─────────┐                          │                    │
    │  W1     │  Haiku recon ────────────┤ mark(edge:fit)     │
    │  read   │                          │ mark(edge:truth)   │
    └────┬────┘                          │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W2     │  Opus decide             │                    │
    └────┬────┘                          │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W3     │  Sonnet edit             │                    │
    └────┬────┘                          │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W4     │  Sonnet verify ──────────┘                    │
    │  score  │  → feedback ──────────────────────────────────┘
    └─────────┘    tags: [groups, schema|api|runtime, cycle:N]
```

---

## Testing — The Deterministic Sandwich

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    bun run verify                     bun run verify
    ├── biome check .                  ├── biome check .     (no new lint)
    ├── tsc --noEmit                   ├── tsc --noEmit      (no new type errors)
    └── vitest run                     ├── vitest run        (no regressions)
                                       ├── new tests pass    (group invariants)
                                       └── group-scope test  (shared group = ✓ signal; no group = dissolved)
```

### W0 — Baseline (before every cycle)

```bash
bun run verify
```

Record per-file failures. Do NOT start the cycle on broken baseline.

### Cycle Gate — Tests Green

Every cycle closes when:
- [ ] All baseline tests still pass (no regressions)
- [ ] New tests cover new group invariants (listed per cycle)
- [ ] `biome check .` clean on touched files
- [ ] `tsc --noEmit` passes
- [ ] W4 rubric score ≥ 0.65 on all dimensions
- [ ] `/close --todo groups --cycle N` emitted (see [loop-close.md](loop-close.md))
- [ ] `groups.md` updated: invariants for this cycle marked ✓

---

```
   CYCLE 1: WIRE              CYCLE 2: PROVE              CYCLE 3: GROW
   Schema + rename sweep      Runtime + CRUD API          Hierarchy + federation
   ─────────────────          ──────────────────          ─────────────────────
   3 files, ~15 edits         8 files, ~30 edits          6 files, ~20 edits
        │                           │                            │
        ▼                           ▼                            ▼
   ┌─W1─W2─W3─W4─┐            ┌─W1─W2─W3─W4─┐             ┌─W1─W2─W3─W4─┐
   │ H   O  S  S  │  ──►       │ H   O  S  S  │  ──►        │ H   O  S  S  │
   └──────────────┘            └──────────────┘             └──────────────┘
```

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **WIRE** | Schema gains `visibility`, `signal owns scope`, `bridge-kind`; queries stop using dead `group-id` name | L1 (signals route), L2 (group-scope marks begin compounding) |
| **PROVE** | `/api/groups` CRUD live, group-aware roles, per-group pheromone partitioning | L4 (economic — per-tenant revenue becomes measurable) joins L1–L3 |
| **GROW** | Hierarchy-closure queries, federation handshake API, unified human inbox, per-tenant plan/quota | L5–L7 (evolution, learning, frontier) join — tenants now learn their own highways |

---

## Source of Truth

**[groups.md](groups.md)** — The One Rule: "an actor can only act where it is a member", the 4 group shapes, RBAC/ABAC/ReBAC composition, proposed attributes, full API surface table, 9 security invariants.
**[dsl.md](dsl.md)** — `{ receiver, data }`, mark/warn/fade, scope on signals.
**[dictionary.md](dictionary.md)** — canonical names: `group`, `membership`, `hierarchy`, `role`, `scope`.
**[one-ontology.md](one-ontology.md)** — group is dimension 1; actors are dimension 2; membership joins them.
**[rubrics.md](rubrics.md)** — quality scoring: fit/form/truth/taste as tagged edges.
**[auth.md](auth.md)** — `deriveHumanUid`, `ensureHumanUnit`, `getRoleForUser`, API key flow.
**[routing.md](routing.md)** — deterministic sandwich (toxic → capable → execute), bridge paths.
**[loop-close.md](loop-close.md)** — `/close` emits `do:close`, appends `one/learnings.md`.

| Item | Canonical | Dead name | When to keep old |
|------|-----------|-----------|------------------|
| Group key attribute | `gid` | `group-id` | never — rename everywhere |
| Group container | `group` | `colony` (in Move only) | Move contract only, pending rename |
| Role attribute | `role` on `membership` | permissions table | never |
| Scope attribute | `scope` on `signal` / `path` / `hypothesis` | ACL bits | never |
| Bridge attribute | `bridge-kind` on `path` | `federation-edge` (never shipped) | n/a |

---

## Cycle 1: WIRE — Schema foundation + naming rename

**Files:**
- [`src/schema/one.tql`](../src/schema/one.tql) — add `visibility`, `bridge-kind`, extend `signal` with `scope`
- [`src/pages/api/g/[gid]/signal.ts`](../src/pages/api/g/%5Bgid%5D/signal.ts), [`highways.ts`](../src/pages/api/g/%5Bgid%5D/highways.ts), [`units.ts`](../src/pages/api/g/%5Bgid%5D/units.ts), [`mcp.ts`](../src/pages/api/g/%5Bgid%5D/mcp.ts) — rename `group-id` → `gid`
- [`src/pages/[groupId]/index.astro`](../src/pages/%5BgroupId%5D/index.astro), [`src/pages/api/team.ts`](../src/pages/api/team.ts), [`src/pages/api/buy/hire.ts`](../src/pages/api/buy/hire.ts), [`src/pages/api/entity/[id].ts`](../src/pages/api/entity/%5Bid%5D.ts) — same rename

**Why first:** The `gid` ↔ `group-id` drift means `/api/g/[gid]/*` and the
public `/[groupId]` page return empty rows silently today. No downstream
work matters until the primary key resolves.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `visibility` attribute + enum | Private groups filterable at resolvers | 0.35 / 0.20 / 0.35 / 0.10 | `grep "has visibility" src/schema/one.tql \| wc -l` = 1; TQL query `match $g has visibility "private"` parses | `groups:visibility` |
| 2 | `signal owns scope` | Persist scope on every signal for post-hoc audit | 0.40 / 0.15 / 0.35 / 0.10 | `grep "owns scope" src/schema/one.tql \| grep signal` = 1; test signal insert with scope="private" readable by sender only | `groups:signal-scope` |
| 3 | `bridge-kind` on path | Federation edges become first-class | 0.30 / 0.20 / 0.40 / 0.10 | Schema parses; `path.bridge-kind` queryable | `groups:bridge-kind` |
| 4 | `gid` rename across all queries | Group-scoped routes return non-empty rows | 0.40 / 0.15 / 0.35 / 0.10 | `grep -r "group-id" src/pages src/engine` = 0 (except Move/Sui mirrors); `curl /api/g/debby/units` returns members | `groups:gid-rename` |
| 5 | `groups.md` Schema section updated | Proposed attributes marked ✓, gaps crossed off | 0.35 / 0.25 / 0.30 / 0.10 | `groups.md` section "Proposed additions" → "Implemented attributes" | `groups:doc-wire` |

**Wave-level deliverables this cycle:**
- W1 recon covers `one.tql` + 8 query sites using `group-id`
- W2 diff specs list every rename location with exact anchor
- W3 touches exactly `src/schema/one.tql` + 8 route/page files
- W4 verification: new integration test `group-scope.test.ts` proves scope gate still works post-rename

---

### Wave 1 — Recon (parallel Haiku × 5)

**Hard rule:** report verbatim, under 300 words, cite `file:line`.

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/schema/one.tql` | Every attribute declaration, confirm `gid`/`signal`/`path` blocks; locate insertion points for `visibility`, `bridge-kind`, `signal.scope` |
| R2 | `src/pages/api/g/[gid]/*.ts` | Every occurrence of `group-id` vs `gid`; full TQL query block context |
| R3 | `src/pages/[groupId]/index.astro` + `src/pages/api/team.ts` | Same rename targets; SSR vs API differences |
| R4 | `src/pages/api/buy/hire.ts` + `src/pages/api/entity/[id].ts` + `src/pages/api/seed/*.ts` | Seed scripts that insert memberships with `group-id` attribute writes |
| R5 | `src/engine/persist.ts` + `src/engine/agent-md.ts` + `src/lib/api-auth.ts` | Engine writes using `group-id`; confirm schema-to-engine attribute drift |

### Wave 2 — Decide (Opus × 1, small work)

**Context loaded:** `dsl.md` + `dictionary.md` (always) + `groups.md` + `one-ontology.md`.

Key decisions:
1. **Backward-compat rename or hard cutover?** Recommend hard cutover — TypeDB stores string attributes, so `group-id` rows simply stop being matched. Reseed via `/api/seed/*` re-insert after rename.
2. **`visibility` default:** `"public"` for existing rows (can't guess intent); new groups default `"private"` when created via `/api/groups` (cycle 2).
3. **`signal.scope` default:** `"group"` — matches current `/api/signal` gate default.
4. **`bridge-kind` enum:** `"federation" | "export" | "escrow"` per groups.md; no other values accepted.
5. **Move contract:** leave `Colony` as-is (Move package upgrade required). Bridge layer (`src/engine/bridge.ts`) reads Move `Colony` as TQL `group` — already handled.

### Wave 3 — Edits (parallel Sonnet × 3)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/schema/one.tql` | 4 (add 3 attrs, amend `signal` entity) |
| E2 | 4 `src/pages/api/g/[gid]/*.ts` files | 8 (rename in queries) |
| E3 | `src/pages/[groupId]/index.astro` + `team.ts` + `hire.ts` + `entity/[id].ts` + seed scripts | 10 (rename + fix seed writes) |

### Wave 4 — Verify (parallel Sonnet × 4)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Schema consistency — TQL parses, no orphan attributes | `one.tql`, `sui.tql`, `world.tql` |
| V2 | Cross-reference — every `group-id` gone; every new attribute used somewhere | all touched files + grep across `src/` |
| V3 | Runtime behavior — `/api/g/:gid/signal` returns members; `scope: "private"` signals gated | integration test run |
| V4 | Rubric scoring (fit/form/truth/taste) + `groups.md` doc sync | all touched files + `groups.md` + `rubrics.md` |

**Checks:**
1. `bun run verify` green
2. New integration test: `src/__tests__/integration/group-scope.test.ts` — (a) two actors in same group, `scope: "group"` signal delivers; (b) two actors in different groups, `scope: "group"` dissolves; (c) `scope: "private"` only sender/receiver match delivers
3. Seed scripts (`/api/seed/marketing`, `/api/seed/all-agents`) still create working groups
4. Doc `groups.md` updated — "Proposed additions" heading replaced with "Implemented attributes"

### Loop Close

Run before the Cycle Gate. See [loop-close.md](loop-close.md).

1. Verify each deliverable against its exit condition — mark `[x]` on passing rows
2. Emit `/close --todo groups --cycle 1` → deposits `do:close` signal
3. Propagate: update `groups.md` (core doc) + `one/CLAUDE.md` if naming lock changed + append to `one/learnings.md`

### Cycle 1 Gate

```bash
# Schema
grep "owns visibility" src/schema/one.tql
grep "owns scope" src/schema/one.tql | grep signal
grep "bridge-kind" src/schema/one.tql

# Rename complete
! grep -rn "group-id" src/pages src/engine src/lib

# Behavior
bun run verify
bun vitest run src/__tests__/integration/group-scope.test.ts
curl -s http://localhost:4321/api/g/debby/units | jq '.units | length' # > 0
```

```
  [ ] visibility, signal.scope, bridge-kind all in schema
  [ ] Zero `group-id` references outside Move/Sui mirrors
  [ ] group-scope.test.ts: 3/3 pass
  [ ] `/api/g/:gid/units` returns non-empty for known group
  [ ] groups.md updated (proposed → implemented)
```

---

## Cycle 2: PROVE — Runtime behavior + `/api/groups` CRUD surface

**Depends on:** Cycle 1 complete. `gid` primary key works; `scope` persists; `visibility` + `bridge-kind` attributes queryable.

**Files:**
- [`src/engine/persist.ts`](../src/engine/persist.ts) — `group()` helper accepts `visibility`; `mark()`/`warn()` accept optional `scope: gid` parameter for per-group pheromone
- [`src/lib/api-auth.ts`](../src/lib/api-auth.ts) — add `getRoleForUser(uid, gid?)` overload; session cache keyed on `(uid, gid)`
- [`src/lib/role-check.ts`](../src/lib/role-check.ts) — already pure lookup; confirm no changes
- NEW: `src/pages/api/groups/index.ts` — POST create, GET list (visibility-filtered)
- NEW: `src/pages/api/groups/[gid]/index.ts` — GET details (403 private + non-member), PATCH owner/admin, DELETE owner cascade
- NEW: `src/pages/api/groups/join.ts` — POST join public (auto-role `member`)
- NEW: `src/pages/api/groups/leave.ts` — POST leave (owner must transfer first)
- NEW: `src/pages/api/groups/[gid]/members.ts` — GET list members + roles (member-only)
- NEW: `src/pages/api/groups/[gid]/role.ts` — PATCH change member role (owner/admin only)
- [`src/pages/api/invites/accept.ts`](../src/pages/api/invites/accept.ts) — wire through new create path

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `POST /api/groups` create | Visibility default `private`, creator = owner, parent optional | 0.40 / 0.20 / 0.30 / 0.10 | `curl POST` returns 201 + `{gid}`; membership row with `role: "owner"` written | `groups:create` |
| 2 | `GET /api/groups` list | Returns public + authenticated user's private groups | 0.40 / 0.20 / 0.30 / 0.10 | Unauthenticated: only `visibility: "public"`; authenticated: union | `groups:list` |
| 3 | `GET /api/groups/:gid` details | 403 when private + non-member | 0.45 / 0.15 / 0.30 / 0.10 | Integration test: private group, non-member → 403; member → 200 | `groups:details` |
| 4 | `PATCH /api/groups/:gid` update | Owner/admin only; allowed fields: `name`, `visibility`, `brand` | 0.40 / 0.20 / 0.30 / 0.10 | Role check via `roleCheck(role, "update-group")`; fails if member-only | `groups:update` |
| 5 | `DELETE /api/groups/:gid` cascade | Owner only; deletes memberships, private signals, paths | 0.35 / 0.15 / 0.40 / 0.10 | Post-delete: `/api/memory/reveal/:uid` no longer lists this group | `groups:delete` |
| 6 | `POST /api/groups/join` + `/leave` | Public join without invite; leave with owner-transfer guard | 0.40 / 0.15 / 0.35 / 0.10 | Owner leaving private group → 409 "transfer ownership first" | `groups:join-leave` |
| 7 | `GET /api/groups/:gid/members` + `PATCH /role` | Member roster; role mutation audit-logged | 0.35 / 0.20 / 0.35 / 0.10 | Non-member → 403; member GET → 200 list; PATCH by non-admin → 403 | `groups:members-role` |
| 8 | `getRoleForUser(uid, gid)` | Role is per-group, not first-found | 0.45 / 0.15 / 0.35 / 0.05 | Tony as chairman in `acme` + operator in `acme-content` resolves correctly | `groups:role-per-group` |
| 9 | Per-group pheromone — `mark(edge, n, {scope: gid})` | Reputation partitioned by tenant | 0.40 / 0.15 / 0.40 / 0.05 | Path `tony→acme-ceo` has strength in `acme` only; `debby` world has independent strength | `groups:scope-pheromone` |
| 10 | Auto-create personal group on sign-up | Every new actor gets `group:{uid}` (visibility:private, role:chairman) atomically with `ensureHumanUnit` / `syncAgent` | 0.45 / 0.15 / 0.35 / 0.05 | `POST /api/auth/agent` response includes `{personalGid, role:"chairman"}`; TypeDB has membership row; leaving an org does not affect it | `groups:auto-personal` |
| 11 | Add `group-type: "personal"` to enum | Schema + docs list `personal` alongside `world|org|team|community|dao|friends`; default `group-type` for auto-created signup groups | 0.35 / 0.20 / 0.35 / 0.10 | `grep '"personal"' src/schema/one.tql` = 1; seed + agent-md paths unchanged; UI can filter `group-type = "personal"` | `groups:group-type-personal` |
| 12 | `/api/groups/join` default role on public worlds | Joining any group with `visibility: "public"` writes `role: "member"`; private groups require invite (falls through to existing `/api/invites/accept`) | 0.40 / 0.20 / 0.30 / 0.10 | `POST /api/groups/join -d '{"gid":"one"}'` → 200 + membership(role:member); `POST /api/groups/join -d '{"gid":"acme"}'` → 403 "private; invite required" | `groups:public-join` |
| 13 | `owner` attribute on actor | Every non-human actor carries `owner` = creator uid; enforced at sync time | 0.45 / 0.15 / 0.35 / 0.05 | `grep "owns owner" src/schema/one.tql \| grep actor` = 1; `writer-bot.owner = "alice"` after `POST /api/agents/register` by alice; loan/copy/service routes read this field | `groups:actor-owner` |
| 14 | `forget(uid)` cascades personal group | Deleting an actor drops `group:{uid}` + all memberships that reference it | 0.40 / 0.15 / 0.40 / 0.05 | Integration test: `/api/memory/forget/alice` → `group:alice` row gone from TypeDB; agents owned by alice have `owner` cleared or are also forgotten per chairman rule | `groups:forget-personal` |
| 15 | Personal sub-groups supported + tested | `POST /api/groups` with `parent: "group:alice"` + `group-type: "team"` creates nested personal sub-group; only alice can create children of her personal group | 0.35 / 0.20 / 0.35 / 0.10 | Integration test: alice creates `group:alice/writing`; bob cannot; `/api/g/group:alice:writing/units` returns alice's writing-tagged agents | `groups:personal-subgroups` |
| 16 | `GET /api/groups` returns `role` + `group-type` per row | UI can distinguish "your personal world" vs "orgs you belong to" vs "public worlds" without extra queries | 0.40 / 0.20 / 0.30 / 0.10 | Response shape: `[{gid, name, group-type, visibility, role, isPersonal}, ...]`; filter on `group-type === "personal" && role === "chairman"` yields exactly one row per user | `groups:list-shape` |
| 17 | Multi-session personal group access | Session cache keyed correctly; same personal group visible from phone + laptop simultaneously | 0.35 / 0.15 / 0.45 / 0.05 | Integration test: two sessions for same uid → both `GET /api/groups/:personalGid` return 200 with identical membership rows | `groups:multi-session` |

**Wave-level deliverables this cycle:**
- W1 recon covers 7 new API route specs + 2 engine modification points + `ensureHumanUnit` + `syncAgent` sign-up paths + `/api/memory/forget/:uid` cascade path + `/api/agents/register` owner-writing path
- W2 diff specs enumerate every new handler with status codes + error messages + the sign-up transaction spec + the forget-cascade spec + the parent-of-personal permission spec
- W3 = 1 Sonnet per new file (7 new) + 2 mutations (`persist.ts`, `api-auth.ts`) + 1 agent-md mutation + 1 schema enum + 1 schema attribute (actor.owner) + 1 forget-cascade edit = 13 parallel
- W4 verification: per-endpoint integration tests + role-per-group + scope-pheromone + personal-group-on-signup + public-join-without-invite + owner-attribute-enforcement + forget-cascades-personal + multi-session-access

---

### Wave 1 — Recon (parallel Haiku × 5)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/pages/api/invites/accept.ts` + `src/pages/api/worlds/tenant.ts` | Existing group-insert patterns; where role is written; session-resolution flow |
| R2 | `src/lib/api-auth.ts` (full file, esp. `ensureHumanUnit` + `deriveHumanUid`) | `getRoleForUser` current signature; session cache shape; BetterAuth integration surface; the exact write that creates a human actor — personal-group write must join this transaction |
| R3 | `src/engine/persist.ts` + `src/engine/agent-md.ts` (`syncAgent`) | `group()` helper signature; `mark()`/`warn()` signatures; how scope would thread through; where agent sync writes membership (the hook point for personal-group creation on agent actors) |
| R4 | `src/lib/role-check.ts` | ROLE_PERMISSIONS matrix; action names; whether `create-group` / `update-group` / `delete-group` / `invite-member` / `change-role` need adding |
| R5 | `src/pages/api/g/[gid]/*.ts` + existing `/api/groups/join` if any | Error response shape + status codes — match style for new `/api/groups/*` routes; existing `join` behavior vs proposed public-only default |

### Wave 2 — Decide (Opus, sharded: API-surface shard + engine shard)

**Context loaded:** always-on (`dsl.md`, `dictionary.md`) + `groups.md`, `auth.md`, `routing.md`, `rubrics.md`.

**Shard A — API surface (6 new routes):** decide status codes, request/response
shape, error messages, role-check insertion points. Match existing
`src/pages/api/g/[gid]/signal.ts` style (TypeScript `APIRoute`, explicit
`Response.json`, fail-open on TypeDB errors where non-critical).

**Shard B — Engine + auth:** decide the `getRoleForUser(uid, gid?)` overload
signature, cache key shape, the `mark(edge, n, {scope})` parameter addition,
and whether `scope` becomes an in-memory partition key or a TypeDB write-only
attribute. Recommendation: in-memory keyed by `${scope}:${edge}` with fallback
to global for backward compat; persist via `path.scope` on the TypeDB write.

**Key decisions:**
1. **Ownership transfer:** required before owner can leave — implement as `PATCH /role` with `{uid, role: "owner"}` (old owner auto-demoted to `admin`). Personal groups are non-transferable (only owner = chairman; `DELETE` is the only exit and cascades `forget(uid)`).
2. **Private group deletion cascade:** in-transaction: memberships → private signals → paths with matching scope → the group entity itself. Use `Promise.allSettled` for partial-failure tolerance; audit-signal emitted either way.
3. **Role action names for `role-check.ts`:** add `create-group`, `update-group`, `delete-group`, `invite-member`, `change-role` to the matrix. Keep existing `read_memory` / `delete_memory` / `discover` unchanged.
4. **Default role when `/join` a public group:** `member`. Guest-only read is a separate endpoint (not in this cycle). Joining a `visibility: "private"` group via `/join` returns 403 "invite required" — invite-only flow lives at `/api/invites/accept`.
5. **Pheromone scope key:** when not specified, default to `global` (pre-existing behavior). Only callers who opt in get per-group partitioning; no breaking change.
6. **Personal group on sign-up:** auto-write happens inside the same TypeDB transaction as `ensureHumanUnit` / `syncAgent`. Response shape adds `personalGid: "group:{uid}"` and `role: "chairman"`. `group-type: "personal"`, `visibility: "private"`. Idempotent: if row exists, no-op. Personal group uid pattern: `group:{uid}` (stable, predictable, matches the `hierarchy` query shape).
7. **`group-type: "personal"` enum value:** add to the doc enum + any runtime enum validation. UI filters `/api/groups` response by this field to show "Your personal world" separately from "Orgs you belong to" and "Public worlds".
8. **World join never auto-runs.** The sign-up response surfaces the option (`suggestedJoins: ["one"]`) but does not write membership. UI prompts the user; explicit `POST /api/groups/join` required.

### Wave 3 — Edits (parallel Sonnet × 13)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/pages/api/groups/index.ts` (NEW) | ~100 lines (POST + GET with role + group-type in response rows) |
| E2 | `src/pages/api/groups/[gid]/index.ts` (NEW) | ~110 lines (GET/PATCH/DELETE; personal group frozen-gid + forget-cascade branch) |
| E3 | `src/pages/api/groups/join.ts` (NEW) | ~55 lines (public-only; 403 on private with "invite required") |
| E4 | `src/pages/api/groups/leave.ts` (NEW) | ~70 lines (owner guard + personal-chairman-cannot-leave guard) |
| E5 | `src/pages/api/groups/[gid]/members.ts` (NEW) | ~40 lines |
| E6 | `src/pages/api/groups/[gid]/role.ts` (NEW) | ~50 lines (auto-demote on ownership transfer) |
| E7 | `src/lib/api-auth.ts` | ~45 lines (overload + cache key + personal-group create inside `ensureHumanUnit`; response shape with `personalGid`, `role: "chairman"`, `suggestedJoins: ["one"]`) |
| E8 | `src/engine/persist.ts` | ~30 lines (`scope` parameter on mark/warn; in-memory partition; `forget(uid)` cascades personal group) |
| E9 | `src/lib/role-check.ts` | ~10 lines (5 new actions in matrix) |
| E10 | `src/engine/agent-md.ts` (`syncAgent`) | ~25 lines (auto-create `group:{uid}` personal group when an agent actor is first synced; write `owner` attribute; idempotent) |
| E11 | `src/schema/one.tql` | ~5 lines (document `personal` as valid `group-type`; add `owner` attribute on `actor`) |
| E12 | `src/pages/api/memory/forget/[uid].ts` | ~10 lines (add personal-group cascade to existing forget flow) |
| E13 | `src/pages/api/agents/register.ts` | ~10 lines (write `owner` attribute on creation) |

### Wave 4 — Verify (parallel Sonnet × 4)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | API surface — each route returns correct shape + status per spec | all 6 new route files + `groups.md` § API Surface |
| V2 | RBAC correctness — role matrix enforces; non-member gets 403; public-only join rejects private | `role-check.ts` + integration tests |
| V3 | Pheromone partitioning — `mark(edge, n, {scope: "acme"})` doesn't leak into `debby` | `persist.ts` + new unit test |
| V4 | Sign-up flow + rubric + docs — personal group auto-created, world join opt-in, docs ✓ | `api-auth.ts`, `agent-md.ts`, `groups.md`, `auth.md`, `rubrics.md` |

**Checks:**
1. `bun run verify` green
2. New integration tests in `src/__tests__/integration/groups-api.test.ts` — one describe block per route, 3+ cases each
3. New unit test `src/engine/persist.test.ts` case: `mark('a→b', 1, {scope: 'acme'})` + `mark('a→b', 1, {scope: 'debby'})` yields separate accumulators
4. New integration test `src/__tests__/integration/signup-personal-group.test.ts`:
   - (a) `POST /api/auth/agent` response includes `personalGid`, `role: "chairman"`, and `suggestedJoins: ["one"]`
   - (b) `group:{uid}` membership row exists in TypeDB with `visibility: "private"` + `group-type: "personal"`
   - (c) calling `/api/auth/agent` twice with the same uid is idempotent (no duplicate membership)
   - (d) agent synced via `syncAgent` also gets a personal group + `owner` attribute set to creator uid
   - (e) `POST /api/groups/join {gid:"one"}` by a newly-signed-up user succeeds
   - (f) `POST /api/groups/join {gid:"acme"}` (private) returns 403 "invite required"
   - (g) deleting the personal group cascades `forget(uid)` + actor removal
   - (h) sign-up does NOT auto-join `group:one` (suggestedJoins surfaced only; no write happens without explicit `/join`)
5. New integration test `src/__tests__/integration/personal-subgroups.test.ts`:
   - (a) alice creates `group:alice/writing` with `parent: "group:alice"` → 201
   - (b) bob tries same → 403 (only chairman of personal group can nest under it)
   - (c) `/api/g/group:alice:writing/units` returns non-empty when alice adds writing-tagged agent
6. New integration test `src/__tests__/integration/actor-owner.test.ts`:
   - (a) alice's `POST /api/agents/register {name:"writer-bot"}` writes `writer-bot.owner = "alice"` in TypeDB
   - (b) bob cannot "copy" or "loan" `writer-bot` — only alice (owner) can
7. New integration test `src/__tests__/integration/forget-personal-cascade.test.ts`:
   - (a) `/api/memory/forget/alice` removes `actor:alice` AND `group:alice` AND all memberships
   - (b) agents owned by alice have `owner` cleared (they become ownerless floaters) unless also forgotten
8. New integration test `src/__tests__/integration/multi-session.test.ts`:
   - (a) two sessions for same uid both see the personal group with identical rows
   - (b) a role change in session A invalidates session B's cache within one TTL
9. Doc `groups.md` API Surface table — every endpoint marked ✓ with implementation file path

### Loop Close

1. Verify each deliverable against its exit condition
2. Emit `/close --todo groups --cycle 2`
3. Propagate: update `groups.md` API table + `auth.md` role matrix + **`lifecycle-one.md` Stage 3 (Personal group) + Stage 11 (Subscribe private/public split)** + `one/CLAUDE.md` if public surface changed + append to `one/learnings.md`
   - `lifecycle-one.md` is the user-facing funnel view of this cycle's substrate work — every time the auto-personal-group flow or subscribe scope changes, the lifecycle doc's Stage 3 / Stage 11 / Speed table / Substrate hooks table must re-sync.

### Cycle 2 Gate

```bash
# API smoke
curl -X POST http://localhost:4321/api/groups -H "Authorization: Bearer ..." \
  -d '{"gid":"test-cycle2","name":"Test","visibility":"private","group-type":"team"}'
curl -s http://localhost:4321/api/groups | jq 'length'  # > 0
curl -X POST http://localhost:4321/api/groups/join -d '{"gid":"one"}'       # 200 (public world)
curl -X POST http://localhost:4321/api/groups/join -d '{"gid":"acme"}'      # 403 (private; invite required)

# Sign-up creates personal group
curl -X POST http://localhost:4321/api/auth/agent \
  -d '{"name":"test-alice","kind":"human"}' | jq '.personalGid'             # "group:test-alice"

# Behavior
bun run verify
bun vitest run src/__tests__/integration/groups-api.test.ts
bun vitest run src/__tests__/integration/signup-personal-group.test.ts
bun vitest run src/engine/persist.test.ts -t "scope"
```

```
  [ ] All 6 new routes respond with correct shape
  [ ] getRoleForUser(uid, gid) returns gid-specific role
  [ ] Pheromone partitioned by scope (unit test)
  [ ] Private group non-member 403 enforced
  [ ] Sign-up auto-creates personal group (group:{uid}, role:chairman) idempotently
  [ ] `group-type: "personal"` documented + filterable
  [ ] Public world join works without invite; private group join returns 403
  [ ] World join NEVER auto-runs on sign-up (only surfaced as `suggestedJoins`)
  [ ] `actor.owner` attribute written at sync/register; copy/loan/service enforce it
  [ ] `forget(uid)` cascades the personal group in one transaction
  [ ] Personal sub-groups nest under chairman-only authority
  [ ] `GET /api/groups` response includes `role` + `group-type` per row
  [ ] Multi-session access works (same uid, two sessions, identical rows)
  [ ] groups.md API table + Sign-Up section + Security Invariants all ✓
```

---

## Cycle 3: GROW — Hierarchy closure, federation, human inbox, tenant plans

**Depends on:** Cycle 2 complete. CRUD surface live; roles per-group; pheromone scoped.

**Files:**
- [`src/schema/world.tql`](../src/schema/world.tql) — add TQL `fun` for hierarchy-closure (`descendants_of(root)`)
- [`src/schema/one.tql`](../src/schema/one.tql) — add optional `plan` attribute on group (`starter|growth|enterprise`)
- NEW: `src/pages/api/paths/bridge.ts` — POST create federation edge (two-side handshake), DELETE dissolve
- [`src/engine/federation.ts`](../src/engine/federation.ts) — extend to use `bridge-kind` paths
- NEW: `src/pages/api/inbox/[uid].ts` — GET unified signal view across all memberships (paginated)
- [`src/pages/api/signal.ts`](../src/pages/api/signal.ts) — hierarchy-aware scope check (parent-descendant intersection counts as shared group)
- [`src/engine/persist.ts`](../src/engine/persist.ts) — `isDescendantOf(gid, rootGid)` helper + rate-limit middleware hook on bridge-kind paths

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `descendants_of(root)` TQL function | Tenant isolation queryable in one hop | 0.40 / 0.15 / 0.40 / 0.05 | `match let $gs = descendants_of("acme"); select $gs;` returns all acme children recursively | `groups:hierarchy-closure` |
| 2 | Hierarchy-aware scope check in `/api/signal` | Sibling sub-groups under same world share scope | 0.40 / 0.15 / 0.40 / 0.05 | Integration test: `acme-eng → acme-marketing` (both under `acme`) delivers with `scope: "group"` | `groups:hierarchy-scope` |
| 3 | `POST /api/paths/bridge` handshake | Cross-root cooperation opt-in from BOTH sides | 0.45 / 0.15 / 0.35 / 0.05 | Single-sided request: 202 "awaiting counterparty"; both sides: 201 + path with `bridge-kind: "federation"` | `groups:bridge-handshake` |
| 4 | `GET /api/inbox/:uid` | Unified signal view across all memberships | 0.40 / 0.20 / 0.35 / 0.05 | Tony in `acme` + `one` gets signals from both in one paginated response, newest first | `groups:unified-inbox` |
| 5 | Per-tenant rate limit on bridge paths | Bridge traffic cap (100 msg/min default) | 0.35 / 0.20 / 0.40 / 0.05 | Integration test: 101 signals in 60s through bridge → 429 on 101st | `groups:bridge-rate-limit` |
| 6 | `plan` attribute + tier-aware limits | Tenant quotas enforceable | 0.35 / 0.20 / 0.35 / 0.10 | `starter` plan: 100 agents max; `enterprise`: unlimited. Create 101st agent on starter → 402. Personal groups exempt. | `groups:tenant-plan` |
| 7 | Personal↔personal bridge handshake | Two users connect directly without joining the world | 0.40 / 0.15 / 0.35 / 0.10 | alice + bob both `POST /api/paths/bridge {from:"group:alice", to:"group:bob"}` → path created with `bridge-kind: "federation"`; signals flow without shared `group:one` membership | `groups:personal-bridge` |
| 8 | TQL-driven `suggestedJoins` | Sign-up surface adapts to the world's actual state | 0.35 / 0.20 / 0.35 / 0.10 | `POST /api/auth/agent` → `suggestedJoins` is a ranked list (not hard-coded `["one"]`); fallback to `["one"]` on TypeDB outage | `groups:suggested-joins` |

---

### Wave 1 — Recon (parallel Haiku × 5)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/schema/world.tql` + existing `fun` definitions | TQL 3.x function syntax; how `path_status`, `unit_classification` are defined; where `descendants_of` should live |
| R2 | `src/pages/api/signal.ts` § scope enforcement | Current SCOPE_CACHE shape; where hierarchy check inserts; cost of added TypeDB hop |
| R3 | `src/engine/federation.ts` + existing bridge references in `groups.md` | Current federation proxy approach; what changes when `bridge-kind` becomes first-class |
| R4 | `src/pages/api/g/[gid]/signal.ts` + `/api/signals.ts` | Inbox query pattern; how to union across groups |
| R5 | `src/pages/api/worlds/tenant.ts` + D1 tenants table schema | Plan/tier where persisted today; how to propagate to TypeDB group entity |

### Wave 2 — Decide (Opus, single pass, small work)

**Context loaded:** always-on + `groups.md`, `routing.md`, `patterns.md`.

Key decisions:
1. **Hierarchy-closure implementation:** TQL recursive `fun` vs in-application recursion. Recommend TQL `fun descendants_of(root) -> { group }: in pattern` — fires in single query, avoids N hops. Test-driven: write the function body, load schema, query.
2. **Bridge handshake state machine:** pending | accepted | dissolved. Store pending state in D1 (TypeDB writes are eventually consistent, handshake needs immediate ACID). Accepted writes the TQL path; DELETE removes both D1 row and TQL path.
3. **Bridge covers all group pairings:** personal↔personal, personal↔org, org↔org. The handshake endpoint is shape-agnostic — any two gids where both chairmen/owners accept. This is how users form direct peer-to-peer links without either joining `group:one`, and how cross-org cooperation starts.
4. **Inbox pagination:** cursor-based on `signal.ts` timestamp descending. Cap 100/page; filter by membership join.
5. **Rate limit scope:** per bridge path, not per tenant. One path = one counter. Redis-less: use in-memory + Gateway middleware. OK to lose counter on worker restart for v1.
6. **`plan` attribute default:** existing groups without plan → `starter`. Enforcement at creation-time only for v1 (don't retro-cap); future cycle can add decay/scale-down. Personal groups get an implicit `starter` tier (not explicitly stored) — not subject to org quotas.
7. **`suggestedJoins` source:** v1 hard-codes `["one"]`. This cycle replaces it with a TQL query — "public worlds with ≥ N members, sorted by path strength to the new user's tags". Fallback to `["one"]` if the query returns empty or TypeDB is unreachable.
8. **Move contract `Colony` rename:** still deferred. Documented in `groups.md` as "Move lags — package upgrade required". Not blocking this cycle.

### Wave 3 — Edits (parallel Sonnet × 7)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/schema/world.tql` | ~10 lines (add `descendants_of` fun) |
| E2 | `src/schema/one.tql` | ~3 lines (add `plan` attribute) |
| E3 | `src/pages/api/paths/bridge.ts` (NEW) | ~120 lines (POST handshake + DELETE) |
| E4 | `src/pages/api/inbox/[uid].ts` (NEW) | ~70 lines |
| E5 | `src/pages/api/signal.ts` | ~15 lines (hierarchy-aware scope check) |
| E6 | `src/engine/federation.ts` + `src/engine/persist.ts` | ~40 lines (`isDescendantOf` helper + bridge rate middleware hook) |
| E7 | `src/lib/api-auth.ts` (sign-up response) | ~20 lines (replace hard-coded `suggestedJoins` with TQL query + fallback) |

### Wave 4 — Verify (parallel Sonnet × 4)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Hierarchy correctness — `descendants_of` returns all levels, no cycles | `world.tql` + new integration test |
| V2 | Federation correctness — two-sided handshake, no single-sided path writes | `api/paths/bridge.ts` + D1 pending table |
| V3 | Inbox + rate limit — pagination stable, 429 fires at boundary | `api/inbox/[uid].ts` + middleware |
| V4 | Rubric scoring + `groups.md` + `routing.md` doc sync | all touched files + 2 docs |

**Checks:**
1. `bun run verify` green
2. New integration tests:
   - `src/__tests__/integration/hierarchy-scope.test.ts` — parent-scope intersection case
   - `src/__tests__/integration/bridge-handshake.test.ts` — pending/accepted/rejected
   - `src/__tests__/integration/inbox.test.ts` — union across memberships
3. New unit test: `src/engine/persist.test.ts` case for `isDescendantOf`
4. Manual smoke: create `acme` → `acme-marketing` child → add agent → signal from sibling `acme-eng` arrives

### Loop Close

1. Verify each deliverable against its exit condition
2. Emit `/close --todo groups --cycle 3`
3. Propagate: update `groups.md` (Multi-Tenancy Checklist ✓) + `routing.md` § bridge behavior + **`lifecycle-one.md` § Collaboration shapes (add "Bridge" lane with personal↔personal handshake once shipped)** + `one/CLAUDE.md` if new public surface + append to `one/learnings.md`
   - The "Bridge" collaboration lane in `lifecycle-one.md` Stage 3 references this cycle's `POST /api/paths/bridge` endpoint — keep the lane's example commands in sync with the handshake shape when landed.

### Cycle 3 Gate

```bash
# Hierarchy
curl -s 'http://localhost:4321/api/query' -d '{"query":"match let $gs = descendants_of(\"acme\"); select $gs;"}' | jq '.rows | length'

# Federation
curl -X POST http://localhost:4321/api/paths/bridge -d '{"from":"acme/alice","to":"one/concierge","kind":"federation"}'  # 202 or 201

# Inbox
curl -s http://localhost:4321/api/inbox/tony | jq '.signals | length'

# Verify
bun run verify
bun vitest run src/__tests__/integration/hierarchy-scope.test.ts
bun vitest run src/__tests__/integration/bridge-handshake.test.ts
bun vitest run src/__tests__/integration/inbox.test.ts
```

```
  [ ] descendants_of(root) callable as TQL function
  [ ] Hierarchy-aware scope check in /api/signal
  [ ] Two-sided bridge handshake enforced
  [ ] Personal↔personal bridge supported (alice + bob without group:one)
  [ ] /api/inbox/:uid unifies all memberships
  [ ] Rate limit fires at boundary on bridge-kind paths
  [ ] plan attribute default starter; tier cap enforced; personal groups exempt
  [ ] suggestedJoins TQL-driven with fallback
  [ ] groups.md Multi-Tenancy Checklist all ✓
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 5 | Haiku  | ~5% |
| 1 | W2 | 1 | Opus   | ~15% |
| 1 | W3 | 3 | Sonnet | ~10% |
| 1 | W4 | 4 | Sonnet | ~10% |
| 2 | W1 | 5 | Haiku  | ~5% |
| 2 | W2 | 2 | Opus   | ~20% |
| 2 | W3 | 13 | Sonnet | ~26% |
| 2 | W4 | 4 | Sonnet | ~10% |
| 3 | W1 | 5 | Haiku  | ~5% |
| 3 | W2 | 1 | Opus   | ~15% |
| 3 | W3 | 7 | Sonnet | ~17% |
| 3 | W4 | 4 | Sonnet | ~10% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

---

## Status

- [ ] **Cycle 1: WIRE** — Schema + `gid` rename
  - [ ] W1 — Recon (Haiku × 5, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 3, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel by check type)
- [ ] **Cycle 2: PROVE** — `/api/groups` CRUD + roles per group + scoped pheromone + personal-group on signup + owner attribute + forget cascade + sub-groups + list shape + multi-session
  - [ ] W1 — Recon (Haiku × 5, parallel)
  - [ ] W2 — Decide (Opus × 2 shards)
  - [ ] W3 — Edits (Sonnet × 13, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel by check type)
- [ ] **Cycle 3: GROW** — Hierarchy closure + federation handshake (incl. personal↔personal) + inbox + plans + TQL-driven suggestedJoins
  - [ ] W1 — Recon (Haiku × 5, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 7, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel by check type)

---

## Execution

```bash
# Run the next wave of the current cycle
/do groups-todo.md

# Or manually — autonomous sequential loop
/do

# Check state
/see highways               # proven paths
/see tasks                  # open tasks by priority
```

### How `/do` Orchestrates

```
/do groups-todo.md
  │
  ├── reads TODO, finds current cycle + wave
  │
  ├── Wave 1? → spawn 5 Haiku in ONE message (one per target)
  │              collect reports, mark wave complete
  │
  ├── Wave 2? → if findings > ~20: spawn 2 Opus shards in parallel
  │              else: synthesize in main context
  │              reconcile shards, produce diff specs
  │
  ├── Wave 3? → spawn M Sonnet (M = files touched) in ONE message
  │              one agent per file — never batch, never split
  │
  └── Wave 4? → spawn 4 Sonnet verifiers in ONE message
                 (sharded: consistency / cross-ref / runtime / rubric)
                 if clean → mark cycle complete, advance
                 if dirty → parallel micro-edits → re-verify (max 3)
```

---

## Reuse

This TODO follows [template-todo.md](template-todo.md). The wave pattern is
identical to every other sweep; only the source-of-truth doc ([groups.md](groups.md))
and the file set change.

To convert cycle deliverables to substrate tasks: each Wave 3 job becomes a
`skill` with the edit prompt as body. `/do` picks highest-pheromone skill.

---

## See Also

- [groups.md](groups.md) — source of truth
- [template-todo.md](template-todo.md) — wave structure this TODO follows
- [dsl.md](dsl.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring: fit/form/truth/taste as tagged edges
- [auth.md](auth.md) — identity, API keys, `getRoleForUser`, session cache
- [one-ontology.md](one-ontology.md) — the 6 dimensions
- [routing.md](routing.md) — deterministic sandwich + bridge behavior
- [loop-close.md](loop-close.md) — close protocol
- [governance-todo.md](governance-todo.md) — role matrix this builds on
- [security-todo.md](security-todo.md) — security invariants
- [typedb-todo.md](typedb-todo.md) — schema migration discipline
- [signal-todo.md](signal-todo.md) — first wave-pattern TODO (reference)
- [task-management-todo.md](task-management-todo.md) — self-learning task system

### Feedback Signal Reference

The `loop:feedback` unit (registered in `boot.ts`) is the return-path
primitive. Every `/close <id>` and every W4 self-checkoff MUST emit one.

| Outcome | Signal strength | Effect on tag paths |
|---------|----------------|---------------------|
| `result` (rubric ≥ 0.65) | rubricAvg | `mark(tag_path, rubricAvg × 5)` |
| `result` (rubric < 0.65) | rubricAvg | `warn(tag_path, 0.5)` — specialist needed |
| `timeout` | 0 | neutral — no mark, no warn |
| `dissolved` | 0 | `warn(tag_path, 0.5)` — path missing |
| `failure` | 0 | `warn(tag_path, 1)` — L5 evolution triggered |

Signals are `scope: private`. They accumulate in the substrate's pheromone
map, not in TypeDB's group queries. Only L6 `know()` promotes them to
permanent hypotheses.

---

*3 cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Same loop as the substrate, different receivers.*
*Groups are dimension 1. The ontology IS the security model.*
