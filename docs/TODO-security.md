---
title: TODO Security
type: roadmap
version: 1.0.0
priority: Delete → Scope → Lock → Learn → Shield
total_tasks: 20
completed: 0
status: READY
---

# TODO: Security — Harden the Five Choke Points

> **Time units:** plan in **tasks → waves → cycles**. Never hours or days.
>
> **Parallelism directive:** Every wave fans out in a single message. W1 ≥ 4 Haiku
> (one per target file), W2 1–2 Opus, W3 one Sonnet per file, W4 ≥ 2 Sonnet
> verifiers (consistency, cross-ref, invariants, rubric).
>
> **Goal:** ship the five choke-point changes in `docs/security.md`. Delete the
> theatre, scope the keys, lock the PEP, make security events substrate signals,
> encrypt the payload.
>
> **Source of truth:** [security.md](security.md) — the plan,
> [auth.md](auth.md) — identity and credentials,
> [groups.md](groups.md) — RBAC/ABAC/ReBAC scope,
> [DSL.md](DSL.md) — signal grammar,
> [dictionary.md](dictionary.md) — canonical names,
> [rubrics.md](rubrics.md) — quality scoring.
>
> **Shape:** 5 cycles, four waves each. Haiku reads, Opus decides, Sonnet writes,
> Sonnet verifies.
>
> **Schema:** Each task maps to `world.tql` dimension 3 (`thing` / skill) with
> `task-wave`, `task-context`, and `blocks` relation to its dependent cycle.

## Routing

```
signal DOWN                                    result UP
──────────                                     ─────────
/do TODO-security.md                           4 tagged marks per wave
     │                                               │
     ▼                                               │
   WIRE-DELETE ─► SCOPE-KEYS ─► LOCK-PEP ─► LEARN-SIGNALS ─► SHIELD-DATA
     │              │              │             │                │
     ▼              ▼              ▼             ▼                ▼
  W1 W2 W3 W4   W1 W2 W3 W4   W1 W2 W3 W4   W1 W2 W3 W4   W1 W2 W3 W4

Each W4 emits mark(edge:fit|form|truth|taste). Weak dims fan out to coaches.
Each cycle gate = tests green + rubric >= 0.65.
```

The five cycles map one-to-one to the five choke points in `security.md`:
Identity → PEP → Handler → Persistence → Revocation. Cycle 1 (Delete) precedes
them because negative-LOC is the highest-ROI patch.

## Testing — Sandwich Around Every Cycle

```
PRE (before W1)                  POST (after W4)
───────────────                  ────────────────
bun run verify                   bun run verify
├── biome check .                ├── biome check .       (clean)
├── tsc --noEmit                 ├── tsc --noEmit        (clean)
└── vitest run                   ├── vitest run          (no regressions)
                                 └── new tests pass      (exit condition met)
```

W0 baseline is captured before every cycle. Cycle gate is all-green plus
new invariant tests (see each cycle's exit condition).

---

## Source of Truth

**[security.md](security.md)** — five choke points, twelve invariants
**[auth.md](auth.md)** — credential lifecycle
**[groups.md](groups.md)** — scope model
**[DSL.md](DSL.md)** — signal grammar
**[dictionary.md](dictionary.md)** — canonical names
**[rubrics.md](rubrics.md)** — fit/form/truth/taste scoring

| Item | Canonical | Notes |
|------|-----------|-------|
| API key | `api-key` entity with `scope-group`, `scope-skill`, `expires-at` | TTL-enforced |
| Authorization | `persist().signal()` PEP | Single function, locked order |
| Security event | `signal` with `kind: "security"` | Immutable audit row + `warn(0.3)` |
| Replay guard | `signal.nonce` + 5-min dedupe window | UUIDv7 from client |
| Tenant KEK | `HKDF(MASTER_KEK, gid)` | `forget()` = crypto-shred |

---

## Cycle 1 — WIRE-DELETE: Remove Theatre

**Scope:** delete the XOR helpers, relocate real utilities, stop
localStorage-storing API keys in the browser.

**Files:**
- `src/lib/security.ts` (delete after extraction)
- `src/lib/utils.ts` (host `sanitizeUrl` + `maskSensitive`)
- `src/components/ai/chat-v3/ChatShell.tsx:11,66,93,100` (auth redesign)
- `src/components/ai/elements/web-preview.tsx:10,144` (import path update)

**Why first:** negative LOC. Removes false-safety signal from the bundle.
No new infra, no schema change.

### Wave 1 — Recon (Haiku × 4)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/lib/security.ts` | Report every export + caller count |
| R2 | `src/components/ai/chat-v3/ChatShell.tsx` | Full API-key storage/retrieval flow, user-facing UX |
| R3 | `src/components/ai/elements/web-preview.tsx` | `sanitizeUrl` usage + iframe pattern |
| R4 | `src/lib/utils.ts` + `src/lib/auth-client.ts` | Where to host the kept utilities; session cookie availability |

### Wave 2 — Decide (Opus × 1)

Decisions:
1. Replacement strategy for client-side API-key: either (a) server-mints scoped key and returns session cookie, or (b) remove the paste-your-key UI entirely. Pick one, write diff spec.
2. Final location for `sanitizeUrl` and `maskSensitive` (recommend `src/lib/utils.ts`).
3. Delete order: new location → update callers → delete old file.

### Wave 3 — Edits (Sonnet × 5, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/lib/utils.ts` | Add `sanitizeUrl`, `maskSensitive` |
| E2 | `src/components/ai/elements/web-preview.tsx` | Update import to `@/lib/utils` |
| E3 | `src/components/ai/chat-v3/ChatShell.tsx` | Replace XOR storage with chosen strategy from W2 |
| E4 | `src/lib/security.ts` | Delete file |
| E5 | `src/lib/logger.ts` (new or existing) | **Secret redactor wrapper.** Pattern-match env-var values matching `SUI_*`, `*KEK*`, `*SECRET*`, `*TOKEN*`, `*API_KEY*` and replace with `***`. Covers invariant #10 (secrets never logged). ~30 lines. |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — no remaining imports from `@/lib/security`; tsc clean |
| V2 | Cross-ref — new imports resolve; web-preview still blocks `javascript:`/`data:` URLs |
| V3 | Behavior — ChatShell no longer writes API keys to localStorage (new test) |
| V4 | Rubric — fit/form/truth/taste ≥ 0.65 |

**Exit:**
- `grep -r "from '@/lib/security'"` returns zero.
- `grep -r "localStorage.setItem.*api" src/components` returns zero.
- New test in `src/lib/utils.test.ts` verifies `sanitizeUrl` rejects `javascript:`.
- `bun run verify` green.

---

## Cycle 2 — SCOPE-KEYS: Narrow the Blast Radius

**Scope:** add `scope-group` and `scope-skill` to `api-key`, default
`read`-only, enforce `expires-at`, default 24h TTL for new keys.

**Files:**
- `src/schema/one.tql` (extend `api-key`)
- `src/lib/api-key.ts` (generation includes scope)
- `src/lib/api-auth.ts` (verify scope + TTL)
- `src/pages/api/auth/agent.ts` (default `read`, 24h TTL)
- `src/pages/api/auth/api-keys.ts` (accept scope params on POST)

**Why second:** a leaked key without scope walks everywhere. Scoping
before the PEP lock means the PEP only needs to check, not to compensate.

### Wave 1 — Recon (Haiku × 4)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/schema/one.tql` | Current `api-key` attributes, relation shape |
| R2 | `src/lib/api-key.ts` + `src/lib/api-key.test.ts` | Generation, hash, test coverage |
| R3 | `src/lib/api-auth.ts` + `src/lib/api-auth.test.ts` | Verify flow, cache behavior |
| R4 | `src/pages/api/auth/*.ts` | Endpoints that mint/verify keys, current defaults |

### Wave 2 — Decide (Opus × 1)

Decisions:
1. Schema additions: `scope-group` (string, optional), `scope-skill` (string @card(0..)), confirm `expires-at` present.
2. Verification order in `verifyApiKey`: hash match → status active → not expired → scope-group matches caller context → scope-skill matches requested skill. All must pass.
3. Backward compat: existing keys without scope behave as "any group, any skill" — fine for v1 but flagged in `key-status`.

### Wave 3 — Edits (Sonnet × 6, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/schema/one.tql` | Add attributes to `api-key` |
| E2 | `src/lib/api-key.ts` | Generation accepts scope params |
| E3 | `src/lib/api-auth.ts` | Verify scope + TTL; return `403` on scope mismatch |
| E4 | `src/pages/api/auth/agent.ts` | Default `read`, 24h TTL; **session-to-agent fallback: valid BetterAuth session + self-unit mutation → mint scoped write key** (closes humans-reaching-CAPABLE gap) |
| E5 | `src/pages/api/auth/api-keys.ts` | Accept `scopeGroup`, `scopeSkill` in body |
| E6 | `src/lib/api-auth.test.ts` | Test: human with session gets write key without pasting raw key |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — schema migration applied; existing tests still pass |
| V2 | Cross-ref — all `verifyApiKey` callers handle new error mode |
| V3 | Invariants — new tests: scope mismatch → 403, expired key → 403, wrong-skill key → 403, default is `read` only |
| V4 | Rubric — ≥ 0.65 on all dims |

**Exit:**
- `api-key.test.ts` has three new scope tests, all pass.
- `api-auth.test.ts` has TTL expiry test.
- Default response body from `/api/auth/agent` shows `permissions: "read"` and `expires-at` within 24h.

---

## Cycle 3 — LOCK-PEP: The One Authorization Function

**Scope:** centralize and lock the order of checks in `persist().signal()`.
Add per-signal nonce + 5-min dedupe. Enforce via lint that only `src/engine/`
imports `world`.

**Files:**
- `src/engine/persist.ts` (PEP order, nonce dedupe)
- `src/engine/world.ts` (ensure `signal()` is internal-only export)
- `src/schema/one.tql` (add `nonce` on `signal`)
- `biome.json` (or custom lint rule) — forbid `from '@/engine/world'` outside engine
- `src/engine/persist.test.ts` (PEP order + replay tests)

**Why third:** scoped keys reach the PEP; the PEP must apply the checks
in the same order every time. Without this, scope is advisory.

### Wave 1 — Recon (Haiku × 4)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/engine/persist.ts` | Current `signal()` + `ask()` flow, existing pre-checks |
| R2 | `src/engine/world.ts` | What `signal()` does, who imports it |
| R3 | Repo-wide grep | All callers of `world.signal()` outside `src/engine/` |
| R4 | `src/schema/one.tql` | Current `signal` attributes, how to add `nonce` + dedupe index |

### Wave 2 — Decide (Opus × 1)

Decisions:
1. Locked check order (in `persist().signal()`):
   ```
   ABAC attributes → RBAC role → ReBAC pheromone
     → capability → budget-escrow → rate-limit → nonce-dedupe → deliver
   ```
2. Nonce format: UUIDv7 (timestamped, sortable). Client-supplied. PEP rejects if nonce seen in last 5 min.
3. Lint enforcement: custom biome rule or ESLint boundary plugin forbidding `@/engine/world` imports outside `src/engine/**`.
4. Budget-escrow is a skeleton in this cycle (interface + no-op wallet) — real implementation comes with x402. Placeholder must not block.

### Wave 3 — Edits (Sonnet × 9, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/engine/persist.ts` | Lock PEP order, add nonce dedupe Map with 5-min TTL |
| E2 | `src/engine/world.ts` | Mark `signal()` as engine-internal (JSDoc + re-export gate) |
| E3 | `src/schema/one.tql` | `signal owns nonce` attribute; `thing` gains `allowed-tool` (@card(0..)) — tool allowlist per skill |
| E4 | `biome.json` or `src/lib/lint-rules/engine-boundary.ts` | Lint rule: no `@/engine/world` imports outside `src/engine/**` |
| E5 | `src/engine/persist.test.ts` | New tests: PEP order, replay rejection, scope rejection, rate-limit, tool allowlist, Zod validation |
| E6 | `src/lib/typedb.ts` + `src/pages/api/discover.ts` + discovery callers | **`tenantScope()` on `suggest_route`, `cheapest_provider`, `optimal_route`, `/api/highways`, `/api/state`** — closes cross-tenant discovery leak (DISCOVER stage) |
| E7 | `src/engine/persist.ts` (rate-limit) + `wrangler.toml` | **Rate-limit binding** via Cloudflare Rate Limiting API, keyed by `apiKey.keyId`. Defaults: 100/min per key, configurable per-plan. On limit: emit `kind: "security"` event + dissolve. (Gap 1) |
| E8 | `src/engine/llm.ts` + tool dispatcher | **Tool allowlist enforcement.** Before tool invocation, check that tool name ∈ `capability.offered.allowed-tool`. Reject with dissolve if not. (Gap 2) |
| E9 | `src/engine/llm.ts` (output pass) | **Zod validate LLM structured output** at the boundary. Parse failures → warn(1) and dissolve. Never trust raw model output for mark/warn. (Gap 3) |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — every `persist.signal()` path runs all 8 checks |
| V2 | Cross-ref — all API handlers use `persist()` not `world` |
| V3 | Invariants — replay (same nonce twice in 5 min) rejected; toxic path → dissolve; missing capability → dissolve |
| V4 | Rubric — ≥ 0.65 |

**Exit:**
- `grep -r "from '@/engine/world'" src/pages src/hooks src/components` returns zero.
- Lint rule fails a synthetic file that imports `@/engine/world` outside engine.
- Three new tests in `persist.test.ts` green.
- Nonce dedupe test: second signal with same nonce → dissolved, first succeeded.

---

## Cycle 4 — LEARN-SIGNALS: Security Events Are Substrate Signals

**Scope:** emit `kind: "security"` signals for auth-fail, probe,
rate-limit, injection, role-change, revoke, forget, bridge-create/dissolve.
Each also emits `warn(0.3)` on `caller → auth-boundary`. Push-invalidation
on revoke via existing WsHub.

**Files:**
- `src/lib/api-auth.ts` (emit on failure)
- `src/engine/persist.ts` (emit on dissolve/policy fail)
- `src/pages/api/auth/api-keys.ts` (emit on revoke + broadcast)
- `gateway/src/sse-proxy.ts` or WsHub DO (broadcast revoke event)
- `src/lib/ws-cache.ts` (subscribe + clear on revoke event)
- `src/engine/persist.test.ts` + new `src/lib/security-signals.test.ts`

**Why fourth:** now that keys are scoped and the PEP is locked, every
rejection is a high-signal event. Feeding them back as pheromone makes
the substrate adaptively de-route attackers.

### Wave 1 — Recon (Haiku × 4)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/lib/api-auth.ts` | Every failure path, what's currently logged |
| R2 | `src/engine/persist.ts` | Dissolve points, where warn() is called |
| R3 | `gateway/src/sse-proxy.ts` + WsHub DO | How broadcast works today, `BROADCAST_SECRET` usage |
| R4 | `src/lib/ws-cache.ts` + auth cache | Cache structure, invalidation hooks |

### Wave 2 — Decide (Opus × 1)

Decisions:
1. Canonical `SecurityEvent` union type (from `security.md`).
2. Emission helper `emitSecurityEvent(event)` in `src/lib/security-signals.ts`:
   - writes `signal` with `kind: "security"`
   - calls `warn(caller → auth-boundary, 0.3)` for adversarial events
   - broadcasts to WsHub for revoke/forget
3. Broadcast auth: keep existing `BROADCAST_SECRET` for this cycle; JWT swap is a later shield cycle.
4. Test plan: integration test sends 10 auth-fail events → asserts resistance >= toxic threshold on that caller's edge.

### Wave 3 — Edits (Sonnet × 9, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/lib/security-signals.ts` (new) | `emitSecurityEvent` helper + `SecurityEvent` union type |
| E2 | `src/lib/api-auth.ts` | Emit on every failure branch; emit `warn(0.3)` on caller→auth-boundary |
| E3 | `src/engine/persist.ts` | Emit on dissolve, policy fail, nonce replay, rate-limit hit |
| E4 | `src/pages/api/auth/api-keys.ts` | Emit on revoke; broadcast revoke event via WsHub |
| E5 | `src/lib/ws-cache.ts` | Subscribe to revoke broadcasts; clear key entry <1s |
| E6 | `gateway/src/origin-allow.ts` + `/ws` handler | **Enforce origin pin** — move from warn to reject. Emit `cross-tenant-probe` event on mismatch. (Gap 4) |
| E7 | Cookie-authed mutating routes (`/api/groups/*`, `/api/paths/bridge`, etc.) | **Double-submit CSRF token** — require `X-CSRF-Token` header matching cookie value. BetterAuth already sets `SameSite=strict`; this is belt-and-braces. (Gap 4) |
| E8 | `/api/groups/:gid` DELETE + `/api/groups/:gid/role` PATCH (owner transfer) + `/api/paths/bridge` POST | **Dual-admin enforcement.** Destructive ops require two admin-signed signals within 15 min; second signal references first by nonce. Emit `role-change` / `bridge-create` security events. (Gap 8) |
| E9 | `src/pages/admin/security.astro` (new) | **Read-only admin view:** recent security events (last 1h), active keys per tenant, bridge audit, rate-limit hits. Pure query over `signal` + `api-key` entities; no new storage. (Gap 6) |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — every failure path calls `emitSecurityEvent` |
| V2 | Cross-ref — `SecurityEvent` union exhaustive in callers |
| V3 | Invariants — 10 auth-fails on one caller → toxic path; revoke → cache cleared within 1s across workers |
| V4 | Rubric — ≥ 0.65 |

**Exit:**
- `security-signals.test.ts` asserts toxic threshold reached.
- Revoke integration test: second call with revoked key → 401 in < 1s with warm cache.
- `/see events --since -1h --kind security` returns structured rows.

---

## Cycle 5 — SHIELD-DATA: HKDF, KEK, Audit Anchor

**Scope:** HKDF wallet derivation with tenant salt, tenant KEK for
private-scope signal encryption, append-only audit row enforcement, daily
Merkle root anchored on Sui. Worker-scoped JWT replaces `BROADCAST_SECRET`.

**Files:**
- `src/lib/sui.ts` (HKDF derivation, versioned)
- `src/lib/kek.ts` (new — tenant KEK derivation + envelope encrypt)
- `src/engine/persist.ts` (encrypt `signal.data` when `scope: "private"`)
- `src/pages/api/memory/forget.ts` (crypto-shred: delete tenant KEK)
- `src/schema/one.tql` (`audit-anchor` entity or reuse `hypothesis`)
- `workers/sync/index.ts` + new `workers/audit-anchor/` or embedded cron
- `gateway/src/*` (worker JWT signing key)

**Why last:** highest complexity, broadest surface. All prior cycles must
be green before touching crypto. Worker JWT replaces the shared broadcast
secret — safe only after the signals cycle has validated the broadcast
path.

### Wave 1 — Recon (Haiku × 4)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/lib/sui.ts` | Current wallet derivation, test coverage, callers |
| R2 | `src/engine/persist.ts` | Private-scope signal flow, where `data` is written |
| R3 | `src/pages/api/memory/forget.ts` + `workers/sync/index.ts` | Current forget cascade; sync cron schedule; where to add anchor |
| R4 | `gateway/src/*` | `BROADCAST_SECRET` usage; feasibility of per-worker JWT |

### Wave 2 — Decide (Opus × 2 shards)

Shard A — Crypto (wallet + KEK + encryption):
1. HKDF implementation: Web Crypto `deriveBits` with `SHA-256`, `salt = utf8(gid)`, `info = utf8(uid)`.
2. Versioning: `key-version` attribute on unit; derivation accepts version; rotation path documented.
3. **HARDEN preservation:** units with an existing `sui-unit-id` (already frozen on-chain) stay pinned to `key-version=0` with the legacy `SHA-256(SEED||uid)` derivation. Only units without on-chain objects move to `key-version=1` with HKDF. This keeps lifecycle HARDEN unbroken and avoids stranded on-chain proofs.
4. Tenant KEK: `HKDF(MASTER_KEK, salt=gid, info="signal-data-kek")`; envelope-encrypt `signal.data` (AES-256-GCM) when scope is `private`.
5. `forget(uid)` cascade: delete tenant KEK if last member leaves; existing ciphertext remains but unreadable.

Shard B — Audit + worker JWT:
1. Audit immutability: TypeDB-side — no UPDATE statements for `signal` entity type; enforce at the typedb proxy (gateway).
2. Daily Merkle: cron at 00:05 UTC computes Merkle root of all signals with `ts` in previous day; posts to Sui as a single transaction.
3. Worker JWT: each worker gets a per-deployment signing keypair; gateway verifies `aud` claim. Replaces `BROADCAST_SECRET`.

### Wave 3 — Edits (Sonnet × 7, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/lib/sui.ts` | HKDF derivation + versioning |
| E2 | `src/lib/kek.ts` (new) | Tenant KEK + envelope encrypt/decrypt |
| E3 | `src/engine/persist.ts` | Encrypt private data on write, decrypt on authorized read |
| E4 | `src/pages/api/memory/forget.ts` | Delete tenant KEK cascade |
| E5 | `src/schema/one.tql` | `audit-anchor` entity with `merkle-root`, `sui-tx-id`, `window-start/end` |
| E6 | `workers/sync/index.ts` (or new `workers/audit-anchor/`) | Daily Merkle + Sui anchor |
| E7 | `gateway/src/*` + `src/engine/ws-server.ts` | Per-worker JWT signing/verification |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — existing wallet addresses unchanged for unversioned units; versioned derivation differs |
| V2 | Cross-ref — all callers of `/broadcast` carry JWT; gateway rejects bare `BROADCAST_SECRET` after cutover |
| V3 | Invariants — private signal unreadable after `forget()`; audit anchor posted to Sui; `update signal` at TypeDB rejected |
| V4 | Rubric — ≥ 0.65 |

**Exit:**
- `sui.test.ts` proves HKDF stability + version transition.
- New `kek.test.ts`: encrypt → forget → decrypt fails.
- `audit-anchor.test.ts`: Merkle root matches independent reconstruction.
- Gateway rejects `BROADCAST_SECRET`-only requests.

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| 1 WIRE-DELETE | Surface shrinks, false signals removed | L1 baseline only |
| 2 SCOPE-KEYS | Keys carry scope, blast radius narrows | L1 + L4 (economic boundary at capability) |
| 3 LOCK-PEP | Authorization becomes one function with replay guard | L1–L3 (pheromone now reliable) |
| 4 LEARN-SIGNALS | Security events feed pheromone, attackers auto-routed-around | L1–L3 + L6 (`know()` on security patterns) |
| 5 SHIELD-DATA | Persistence hardened, audit immutable, crypto-shred live | L1–L7 (L7 spawns frontier hypotheses on anomaly clusters) |

Each cycle gate runs `know()` — the substrate's "promote highways to durable
learning" step. Cycle 4's `know()` is especially important: it turns repeated
attacker paths into permanent toxicity records.

---

## Invariants Landed by Cycle

Mapping the twelve invariants from `security.md` to cycles that establish them:

| Invariant | Lands in |
|-----------|----------|
| No signal without shared group OR bridge | Cycle 3 |
| Private signals excluded from `know()` | already; tightened Cycle 5 |
| Uniform 403 for private groups | Cycle 2 |
| `tenantScope()` filter everywhere | Cycle 3 |
| Bridge opt-in both sides | Cycle 3 (PEP lock) |
| Revocation < 1s | Cycle 4 |
| `forget()` renders private signals unreadable | Cycle 5 |
| Audit rows immutable | Cycle 5 |
| Wallet private keys never stored | already; versioned Cycle 5 |
| Secrets never logged | Cycle 1 (part of delete pass) |
| LLM output Zod-validated | Cycle 3 |
| Auth fail emits `warn(0.3)` | Cycle 4 |

---

## Cost Discipline

| Cycle | W1 Haiku | W2 Opus | W3 Sonnet | W4 Sonnet | Notes |
|-------|:--------:|:-------:|:---------:|:---------:|-------|
| 1 WIRE-DELETE | 4 | 1 | 4 | 4 | Small surface |
| 2 SCOPE-KEYS | 4 | 1 | 5 | 4 | Schema + auth |
| 3 LOCK-PEP | 4 | 1 | 5 | 4 | Engine critical path |
| 4 LEARN-SIGNALS | 4 | 1 | 5 | 4 | Instrumentation |
| 5 SHIELD-DATA | 4 | 2 shards | 7 | 4 | Widest, split Opus by domain |

**Hard stop:** any W4 looping > 3× → halt, escalate. Security cycles don't
ship yellow.

---

## Status

- [ ] **Cycle 1: WIRE-DELETE** — remove XOR helpers, relocate utilities, fix ChatShell
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 4, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel by check type)
- [ ] **Cycle 2: SCOPE-KEYS** — scope-group, scope-skill, default read, 24h TTL
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 5, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)
- [ ] **Cycle 3: LOCK-PEP** — canonical PEP order + nonce + lint rule
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 5, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)
- [ ] **Cycle 4: LEARN-SIGNALS** — security events → substrate signals + warn(0.3)
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 5, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)
- [ ] **Cycle 5: SHIELD-DATA** — HKDF wallet, tenant KEK, audit Merkle, worker JWT
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 2 shards)
  - [ ] W3 — Edits (Sonnet × 7, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)

---

## Execution

```bash
# Run the next wave of the current cycle
/do TODO-security.md

# Autonomous — run W1→W4 until cycle complete, then stop
/do TODO-security.md --auto

# Check state
/see tasks --tag security
/see highways --tag security
/see events --kind security --since -1h
```

`/do` orchestrates Haiku recon → Opus decide → Sonnet edits → Sonnet verify,
spawning all agents within a wave in a single message. Sequential between
waves, maximum parallel within.

---

## See Also

- [security.md](security.md) — source of truth for the five choke points
- [auth.md](auth.md) — identity + credential model
- [groups.md](groups.md) — RBAC/ABAC/ReBAC scope
- [DSL.md](DSL.md) — signal grammar (loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring
- [TODO-template.md](TODO-template.md) — this template
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- `src/engine/persist.ts` — the PEP
- `src/lib/api-auth.ts` · `src/lib/api-key.ts` — credential verification
- `src/schema/one.tql` — ontology

---

*Five cycles. Delete → Scope → Lock → Learn → Shield. Each cycle activates
one deeper loop. The firewall writes itself from data.*
