---
title: TODO Auth — Human-Agent Ownership & Login
type: roadmap
version: 1.0.0
priority: Close-the-loop on agent credentials
total_tasks: 6
completed: 0
status: ACTIVE
---

# TODO: Human-Agent Ownership & Login

> **Time units:** plan in **tasks → waves → cycles** only. No calendar time.
>
> **Parallelism directive:** W1 ≥ 4 Haiku (one per read target: api-auth.ts, agent.ts,
> api-keys.ts, role-check.ts + schema). W2 = 1 Opus (single architectural decision —
> ownership model). W3 = one Sonnet per touched file. W4 ≥ 2 Sonnet verifiers
> (auth invariants + integration test).
>
> **Goal:** A human cookie-session user can claim an agent that was created via
> `POST /api/auth/agent`, become its `chairman` via membership, and route signals
> through it with a full audit chain. Bootstrap keys cycle on claim. Bearer auth
> carries the owner's role via membership lookup.
>
> **Source of truth:**
> [auth.md](auth.md) § Open Gaps — the six gaps enumerated with line refs,
> [auth-integration.md](auth-integration.md) — existing bridge proposal (membership-only),
> [agent-telegram-owner.md](agent-telegram-owner.md) — downstream consumer (AUTO/PAUSED/ASSIST modes assume an owner exists),
> [DSL.md](one/DSL.md) — signal grammar,
> [dictionary.md](dictionary.md) — canonical names (`unit`, `membership`, `role`, `api-authorization`, `actor-link`?),
> [rubrics.md](rubrics.md) — fit/form/truth/taste scoring.
>
> **Shape:** 1 cycle × 4 waves. Haiku reads, Opus decides, Sonnet writes, Sonnet
> checks. Cycle gate = baseline tests pass + new integration tests pass + rubric
> ≥ 0.65 on every dimension.
>
> **Schema decision (W2-locked):** prefer the existing `membership` with a
> one-actor group per agent (zero schema change, reuses `role`) over adding a new
> `actor-link` relation. If W2 finds the group convention leaks scope semantics
> (e.g. group-membership queries surface ownership groups as if they were teams),
> escalate to a dedicated `actor-link` relation in `one.tql`. Default = no schema
> change.
>
> **Guardrail:** No changes to signal flow, pheromone, four-outcome algebra,
> or the `Signal` type. All work lives in `src/lib/api-auth.ts`,
> `src/pages/api/auth/`, and one new claim route. `AuthContext` shape may grow
> (additive `actAs`, `ownerOf`) but never narrow. The `agent-kind` resolver
> path stays backward-compatible: bearer-only callers still work.
>
> **Enforcement mode:** Task #1 (rate-mint gate) ships behind
> `AUTH_AGENT_REMINT_MODE=audit|enforce` (default `audit` for one cycle, then
> `enforce`). In `audit` mode the gate logs the would-be denial as a security
> signal but does not block. This is the kill-switch for the rollout —
> existing agent flows keep working until the gate is proven.

---

## Routing

```
    signal DOWN                     result UP
    ──────────                      ─────────
    /do auth-todo.md                result + 4 tagged marks
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W1     │  Haiku x 5 recon ────────┤ mark(edge:fit, score)
    │  read   │  api-auth.ts             │ mark(edge:form, score)
    │         │  agent.ts                │ mark(edge:truth, score)
    │         │  api-keys.ts             │ mark(edge:taste, score)
    │         │  role-check.ts + schema  │
    │         │  + auth-integration.md   │
    └────┬────┘                          │
         ▼                               │
    ┌─────────┐                          │
    │  W2     │  Opus decide             │ weak dim?
    │  fold   │  → ownership model       │  → fan-out to specialist
    │         │  → 6 diff specs          │
    └────┬────┘                          │
         ▼                               │
    ┌─────────┐                          │
    │  W3     │  Sonnet x 6 edits        │
    │  apply  │  (one per touched file)  │
    └────┬────┘                          │
         ▼                               │
    ┌─────────┐                          │
    │  W4     │  Sonnet x 2 verify ──────┘
    │  score  │  (auth invariants /
    │         │   end-to-end integration)
    └─────────┘
```

---

## Source of Truth

| Doc | Why it's loaded |
|-----|-----------------|
| [auth.md](auth.md) | Current flows + the six gaps with line refs |
| [auth-integration.md](auth-integration.md) | Prior thinking on session↔unit bridge — confirms membership-only model |
| [agent-telegram-owner.md](agent-telegram-owner.md) | Downstream: AUTO/PAUSED/ASSIST require a known owner |
| [dictionary.md](dictionary.md) | Names: `unit`, `membership`, `role`, `chairman`, `api-authorization` |
| [rubrics.md](rubrics.md) | W4 scoring (fit/form/truth/taste) |
| `src/schema/one.tql` | Schema constraints — what relations exist |
| `src/lib/api-auth.ts` | The single resolver every gated route calls |
| `src/lib/role-check.ts` | Role × action permission matrix |

| Dead name / drift | Canonical | Note |
|-------------------|-----------|------|
| "owner" (informal) | `chairman` (governance role on membership) | Use `chairman` in code; "owner" is UI copy only |
| "link account" (informal) | "claim" (the verb) | Endpoint is `/claim`; UI may say "Link to your account" |

---

## Task Registry (TypeDB inserts)

Each task is a `task` entity + `skill` with tag `auth`. Run via
`/create task <id> --tags auth,<extra>` or emit the TQL directly:

```typeql
insert $t isa task,
  has task-id "auth-rate-mint", has task-wave "W3", has task-value 1.0,
  has task-effort 0.2, has task-phase "WIRE", has task-persona "sonnet",
  has task-context "auth.md", has task-context "auth-todo.md",
  has tag "auth", has tag "security", has tag "P0";
insert $s isa skill, has skill-id "auth-rate-mint",
  has name "Gate /api/auth/agent re-mint", has price 0.0,
  has tag "auth", has tag "security";
```

---

## Tasks

### 1. `auth-rate-mint` — Gate `POST /api/auth/agent` re-mint  (P0)

**File:** `src/pages/api/auth/agent.ts:91-170`

**Problem:** Every POST mints a new active key for any uid with no auth gate.
`returning: true` branch (line 156+) is identical to first-call. Anyone who
knows a uid can mint a working key for it.

**Fix:** When `returning === true`, require **either**:
  - prior `Authorization: Bearer` that already maps to this uid (proof of
    possession of an existing key), **OR**
  - cookie session whose human uid has a `chairman` membership in the
    agent's ownership group (proof of ownership).

If neither, return `403` with security signal. First-call (`returning: false`)
stays open — that's the zero-friction onboarding contract.

**Behind flag:** `AUTH_AGENT_REMINT_MODE=audit|enforce` (default `audit`,
flip to `enforce` after one cycle of clean audit logs).

**Exit:** vitest `agent.test.ts` covers: (a) first-call open, (b) re-mint
without proof returns 403 in `enforce`, (c) re-mint with valid bearer
succeeds, (d) re-mint with chairman cookie succeeds, (e) `audit` mode logs
but does not block.

**Rubric weight:** truth=critical (security), fit=critical, form=normal,
taste=normal.

---

### 2. `auth-actor-link` — Lock ownership model  (P1, W2 decision)

**Files:** `src/schema/one.tql` (maybe), `one/dictionary.md` (definitely add term)

**Problem:** No actor↔actor link. `membership` (group↔actor) exists; no route uses
it for agent ownership.

**Decision required (W2):**
  - **Option A — group-based (default):** for each owned agent, lazy-create
    a hidden group `g:owns:<agent-uid>` with `group-type: "owns"` (new value,
    not new attribute). Agent is `member` with `role: "agent"`; human is
    `member` with `role: "chairman"`. Zero schema change. Risk: ownership
    groups pollute `/api/team` queries unless filtered by `group-type`.
  - **Option B — new relation:** add `actor-link` to `one.tql` relating
    `controller` (human) and `controlled` (agent), with `link-type` attribute.
    Cleaner semantics, requires schema migration.

**W2 deliverable:** locked decision with rationale in `auth.md`. Default = A.
Escalate to B only if W1 finds a query path that B simplifies but A breaks.

**Exit:** decision documented; if A, dictionary.md gets `group-type: "owns"`
entry; if B, schema migration ticket spawned.

**Rubric weight:** form=critical (this shapes everything downstream), taste=high.

---

### 3. `auth-bearer-role` — Bearer path looks up role  (P1)

**File:** `src/lib/api-auth.ts:64-171` (`validateApiKey`), `src/lib/api-auth.ts:20-28` (`AuthContext`)

**Problem:** `validateApiKey` returns `role: undefined`; only `resolveUnitFromSession`
calls `getRoleForUser` for cookie sessions. So an agent's bearer always carries
the agent's own (`agent`) role, never the owner's.

**Fix:** After successful PBKDF2 verify and cache write, call
`getRoleForUser(user)` and include `role` in the cached entry + returned
`AuthContext`. This is one extra TypeDB query per cache miss (every 5 min
per key). Acceptable cost — same path the cookie flow already pays.

**Subtlety:** the role to return is **the role of the unit the key acts as**, not
the human owner's role. The next task (`auth-act-as`) handles the dual case.

**Exit:** vitest covers: bearer with no membership → `role: "agent"` (or
undefined if not in any group); bearer for agent in owned-group →
`role: "agent"` (the agent's membership role inside its own group, which is
`agent`).

**Rubric weight:** fit=critical, truth=critical (governance hinges on this).

---

### 4. `auth-claim` — Claim handshake endpoint  (P1)

**File:** `src/pages/api/auth/agent/[uid]/claim.ts` (new)

**Problem:** No on-ramp from "agent has a bootstrap key" to "human owns the
agent."

**Spec:**

```
POST /api/auth/agent/:uid/claim
  headers:
    Cookie:        better-auth.session_data=...   (human session)
    Authorization: Bearer api_xxx_yyy             (agent's bootstrap key)
  body: {}

  → resolveUnitFromSession(cookie)  → human:tony
  → validateApiKey(bearer)          → MUST return user === :uid (proof of possession)
  → upsert group g:owns:<uid> (group-type: "owns", scope: "private")
  → insert membership(g, :uid,         role: "agent")
  → insert membership(g, human:tony,   role: "chairman")
  → revoke bootstrap key  (key-status → "revoked", invalidateKeyCache + WsHub broadcast)
  → mint new scoped key for human:tony (scopeGroups: [g], permissions: "read,write")
  → return { owned: true, ownerUid, agentUid, group, newKey }   // newKey shown ONCE
```

**Idempotency:** if membership already exists with this human as chairman,
return 200 + `{ owned: true, alreadyClaimed: true }` — no double-revoke,
no new key.

**Exit:** vitest covers: (a) happy path, (b) bearer mismatch → 403, (c) no
cookie → 401, (d) idempotent re-claim, (e) old key returns 401 after claim,
(f) new scoped key returns 200 on `/api/state`.

**Rubric weight:** fit=critical, truth=critical, form=high.

---

### 5. `auth-act-as` — Dual-identity context  (P2)

**File:** `src/lib/api-auth.ts:20-28` (`AuthContext`), `src/lib/api-auth.ts:282`
(`resolveUnitFromSession`)

**Problem:** `AuthContext` is single-valued. A logged-in human routing through
their owned agent has no way to express it; signals attribute to either Tony
or swift-scout, never "Tony via swift-scout." Audit trail breaks.

**Fix:** Extend `AuthContext` (additively):

```typescript
export interface AuthContext {
  user: string                  // existing — the EFFECTIVE actor for routing
  realUser?: string             // NEW — the originating identity (human)
  actAs?: string                // NEW — explicit act-as request
  ownerOf?: string[]            // NEW — agents this user can act as
  // ... existing fields
}
```

Resolver behavior:
  - `?actAs=<agent-uid>` query param OR `X-Act-As: <agent-uid>` header on a
    cookie session → check membership: human must be `chairman` in
    `g:owns:<agent-uid>` → swap `user` to `<agent-uid>`, set `realUser` to
    the human uid, set `actAs` to the explicit value.
  - Bearer-only path stays as-is: `user = realUser = key's authorized-unit`.
  - Audit signals (security-signals.ts) include both `realUser` and `user`
    when they differ.

**Exit:** vitest covers: cookie + actAs (owned) → user swapped, realUser preserved;
cookie + actAs (not owned) → 403; bearer + actAs → ignored (bearer is already
explicit identity); audit signal carries both fields.

**Rubric weight:** taste=critical (this is the user-visible "act as" UX),
truth=high (audit chain).

---

### 6. `auth-tests` — End-to-end integration  (P1)

**File:** `src/lib/auth.integration.test.ts` (new) or extend `src/lib/api-auth.test.ts`

**Goal:** Prove the full agent-credential-to-human-ownership loop works.

**Scenario:**
```
1. POST /api/auth/agent {} → { uid: "swift-scout", apiKey: K1, wallet: W }
2. Human Tony signs up via BetterAuth → cookie session
3. POST /api/auth/agent/swift-scout/claim
     Cookie: <tony-session>
     Authorization: Bearer K1
   → { owned: true, group: "g:owns:swift-scout", newKey: K2 }
4. K1 → 401 on /api/state                         (revoked)
5. K2 → 200 on /api/state                          (new scoped key works)
6. Cookie + ?actAs=swift-scout → /api/state with user="swift-scout", realUser="human:tony"
7. POST /api/signal {receiver: "swift-scout:foo"} via cookie+actAs
     → signal recorded with sender="swift-scout", originator="human:tony"
8. POST /api/auth/agent {uid: "swift-scout"}     (re-mint attempt)
     no auth → 403 (under enforce mode) or audit-logged (under audit mode)
     with K2 as bearer → 200 (proof of possession via current valid key)
9. getRoleForUser("human:tony") in scope g:owns:swift-scout → "chairman"
```

**Exit:** all 9 steps green in vitest. New test count adds to baseline gate
(443 → 452+). Total runtime budget: < 2s for the integration suite.

**Rubric weight:** truth=critical (this IS the proof), fit=critical.

---

## Wave Structure

### W0 — Baseline

`bun run verify` must be green before W1 starts. Record:
- baseline test count (currently 443)
- baseline gate runtime (currently 4.15s)
- baseline auth-suite runtime (currently 400ms for 30 tests)

### W1 — Recon (Haiku × 5, parallel)

| Agent | Reads | Reports |
|-------|-------|---------|
| H1 | `src/lib/api-auth.ts` | every cache map, every TypeDB call, every fail-closed branch |
| H2 | `src/pages/api/auth/agent.ts` + `api-keys.ts` | mint paths, link relations, return shapes |
| H3 | `src/lib/role-check.ts` + `one.tql` membership/role | permission matrix vs. real grants |
| H4 | `auth-integration.md` + `agent-telegram-owner.md` | prior decisions, downstream owner assumptions |
| H5 | `src/lib/api-key.ts` + `auth.ts` | crypto contract, BetterAuth wiring |

W1 deliverable: 5 recon files, no decisions.

### W2 — Decide (Opus × 1)

Single architectural decision: **lock the ownership model (Task #2)**.
Output: `auth-todo.md` Task #2 section updated with locked option +
6 diff-specs (one per task, line-anchored).

### W3 — Apply (Sonnet × 6, parallel)

One Sonnet per task. Edits land per spec. Docs (`auth.md`, `dictionary.md`)
edit alongside code per `documentation_first_workflow` rule.

### W4 — Verify (Sonnet × 2, parallel)

| Agent | Checks |
|-------|--------|
| V1 | auth invariants — fail-closed paths, cache invalidation, security signals on every denial |
| V2 | end-to-end integration — Task #6 scenario runs green |

W4 marks each dimension `mark-dims` for fit/form/truth/taste. Cycle exits
when all four ≥ 0.65 AND `bun run verify` green AND new integration suite
green.

---

## Exit Criteria (Cycle Gate)

| Check | Target | Tool |
|-------|-------:|------|
| All baseline tests pass | 443/443 | `bun run verify` |
| New auth tests pass | +9 (one per claim scenario step) | vitest |
| Total auth suite runtime | < 1s | vitest |
| Rubric: fit | ≥ 0.65 | `mark-dims` |
| Rubric: form | ≥ 0.65 | `mark-dims` |
| Rubric: truth | ≥ 0.85 (security) | `mark-dims` |
| Rubric: taste | ≥ 0.65 | `mark-dims` |
| `auth.md` Open Gaps section | empty (or moved to "Closed gaps") | doc review |
| `dictionary.md` | `chairman` ownership pattern documented | doc review |

---

## Loop Close

Per `documentation.md` rule, on cycle close:
- Update `auth.md` — move "Open Gaps" → "Closed gaps", add "Claim Flow" section
- Append to `learnings.md`: `- 2026-MM-DD · cycle 1 · gate · agent-credential ownership claim flow shipped · rubric=0.NN · source=cycle`
- If schema changed (Option B in Task #2), update `one-ontology.md` + `dictionary.md`
- Touch-verify: `auth-integration.md` (this TODO supersedes its proposal — note that)

---

## See Also

- [auth.md](auth.md) — current flows + the six gaps this TODO closes
- [auth-integration.md](auth-integration.md) — prior thinking; this TODO supersedes the "TODO" portions
- [agent-telegram-owner.md](agent-telegram-owner.md) — downstream consumer of ownership
- [DSL.md](one/DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [rubrics.md](rubrics.md) — quality scoring
- [TODO-governance.md](TODO-governance.md) — parent governance model (role × pheromone)
