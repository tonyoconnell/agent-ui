---
title: TODO Security
type: roadmap
version: 2.1.0
priority: Stop-Bleed → Delete → Scope → Engine → Lock → Learn → Shield → Sui
total_tasks: 42
completed: 0
status: READY
audit_source: docs/SYSTEM-HEALTH.md (commit 44b671b, 2026-04-20)
audit_totals: 24 Critical · 52 High · 62 Medium · 34 Low · 25 Praise
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
> **Source of truth:** [security.md](one/security.md) — the plan,
> [auth.md](auth.md) — identity and credentials,
> [groups.md](one/groups.md) — RBAC/ABAC/ReBAC scope,
> [DSL.md](one/DSL.md) — signal grammar,
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

The five security.md choke points are now **eight cycles** after absorbing the
2026-04-20 system audit: Identity → PEP → Handler → Persistence → Revocation,
plus **STOP-BLEED** (cycle 0 — the 8 internet-exposed, zero-auth findings that
cannot wait for in-sequence cycles), **ENGINE-HARDEN** (cycle 2.5 — fixes
module-level state that makes Cycle 3's nonce dedupe unreliable) and
**SUI-LOCK** (cycle 7 — Move contract access control before Phase 3 escrow).
Cycle 0 leads because treasury is drainable and `/typedb/query` is open to
the internet *right now*; Cycle 1 (Delete) follows because negative-LOC is the
highest-ROI patch once the bleeding stops.

---

## Audit Alignment — docs/SYSTEM-HEALTH.md → Cycles

Every Critical and High from the 2026-04-20 audit maps to a cycle below.
This TODO is the execution plan; SYSTEM-HEALTH.md is the evidence.

| Finding | Severity | Cycle | Notes |
|---------|:--------:|:-----:|-------|
| C-1 module tick state bleeds CF isolates | Crit | 2.5 | ENGINE-HARDEN |
| C-2 NONCE_SEEN/LIFECYCLE_CACHE module-level | Crit | 2.5 | Must precede Cycle 3 nonce work |
| C-3 scope-group/scope-skill not in schema | Crit | 2 | Already covered by Cycle 2 E1 |
| C-4 tenant-kek entity not in schema | Crit | 5 | Already covered by Cycle 5 E5 |
| C-5 tick() untested | Crit | 2.5 | |
| C-6 ADL gates untested | Crit | 2.5 | |
| C-7 persist core methods untested | Crit | 2.5 | |
| C-8 /api/query no auth | Crit | 3 | PEP gate rollout |
| C-9 Gateway /typedb/query no auth | Crit | 3 | |
| C-10 SSRF /proxy/sse | Crit | 4 | SecurityEvent + allowlist |
| C-11 seed endpoints no auth | Crit | 3 | |
| C-12 decay/resistance no auth | Crit | 3 | |
| C-13 faucet-internal no auth | Crit | 3 | |
| C-14 /api/keys legacy no auth | Crit | 2 | Delete or gate |
| C-15 /api/auth/agent no rate limit | Crit | 2 | |
| C-16 TQL injection endemic | Crit | 3 | `validateUid` + `escapeTqlString` sweep |
| C-17 commend/flag no auth | Crit | 3 | |
| C-18 group signal caller not checked | Crit | 3 | |
| C-19 Sui treasury drainable | Crit | 7 | AdminCap |
| C-20 Sui mark/warn unrestricted | Crit | 7 | Sender check |
| C-21 Sui arithmetic overflow | Crit | 7 | Reorder + cap |
| C-22 Sui fade(0) wipes learning | Crit | 7 | Assert range |
| H-1..H-11 engine correctness | High | 2.5 | Single-tick, fade drift, process.env, markDims |
| H-12 PBKDF2 O(n) key scan | High | 2 | Fast-lookup token |
| H-16..H-22 API auth missing | High | 3 | Rolled into Cycle 3 sweep |
| H-23..H-26 Sui Move | High | 7 | |
| H-27..H-28 Gateway hardening | High | 4 | Timing-safe + broadcast auth |
| H-29 settleEscrow fire-and-forget | High | 7 | |
| H-30 /api/hypotheses no auth | High | 3 | |
| M-13..M-18 Gateway | Med | 4 | TOCTOU, CORS, headers |
| M-19..M-22 wave/expire/rubric | Med | 3 | |
| M-23 SSRF brand extract | Med | 4 | |
| M-24..M-26 scope leaks | Med | 3 | `tenantScope()` sweep (already Cycle 3 E6) |
| M-27..M-29 revoke/invite/stream | Med | 4 | |
| M-30 HKDF derivation | Med | 5 | Already Cycle 5 E1 |
| L-14..L-20 | Low | per-cycle | Rolled into matching W3 sweeps |

**Orphan summary:** all 24 Criticals and 52 Highs now have a home. Two new
cycles (2.5 ENGINE-HARDEN, 7 SUI-LOCK) carry findings that fall outside
`security.md`'s original five choke points.

---

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

**[security.md](one/security.md)** — five choke points, twelve invariants
**[auth.md](auth.md)** — credential lifecycle
**[groups.md](one/groups.md)** — scope model
**[DSL.md](one/DSL.md)** — signal grammar
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

## Cycle 0 — STOP-BLEED: Close the Internet-Exposed Holes

**Scope:** ship the narrowest possible patches for findings that are
exploitable *right now* from the public internet with zero auth. No
refactors, no scope redesign, no new entities — just close the door.
Everything here is a subset of Cycles 2/3/4/7 that gets pulled forward.

**Why zero:** the in-sequence plan assumes all Criticals have equal blast
radius. These eight do not. Treasury is drainable; Gateway `/typedb/query`
is open; `/api/harden` signs as any agent; SSRF forwards the caller's
Authorization header to attacker URLs. Waiting for Cycle 2's schema work
or Cycle 3's PEP lock leaves the window open for multiple more cycles.

**Stop-everything findings (from docs/SYSTEM-HEALTH.md):**

| # | Finding | File | Severity | Narrow fix | Full fix in |
|---|---------|------|:--------:|------------|:-----------:|
| 1 | Sui treasury drainable — `withdraw_protocol_fees()` + `set_fee_bps()` callable by anyone | `src/move/one/sources/one.move:547,639` | C-19 | Add `AdminCap` check (treasury + fee setter only); defer full capability design | 7 |
| 2 | Sui `mark()` / `warn()` unrestricted — anyone corrupts on-chain routing graph | `src/move/one/sources/one.move` | C-20 | Assert `ctx.sender() == unit.owner` on both fns | 7 |
| 3 | Gateway `/typedb/query` unauthenticated arbitrary TypeQL | `gateway/src/index.ts:444` | C-9 | Require valid API key header; reject otherwise | 3 |
| 4 | `/api/query` unauthenticated arbitrary TypeQL | `src/pages/api/query.ts` | C-8 | Same — API key required | 3 |
| 5 | SSRF in Gateway `/proxy/sse` — forwards Authorization to attacker | `gateway/src/sse-proxy.ts` | C-10 | Host allowlist + strip forwarded Authorization header | 4 |
| 6 | API-key scope non-functional — `scope-group` / `scope-skill` missing from runtime schema | `src/schema/world.tql` + `src/lib/api-auth.ts:107` | C-3 | Add two attributes to `world.tql`; wire the existing check — two-line fix | 2 |
| 7 | `/api/decay` + `/api/resistance` unauthenticated | `src/pages/api/decay.ts` · `resistance.ts` | C-12 | Require authenticated admin API key | 3 |
| 8 | `/api/harden` unauthenticated — signs Sui tx as any agent | `src/pages/api/harden.ts` | H-19 | Verify caller's API key belongs to the unit being hardened | 3 |

**Files:**
- `src/move/one/sources/one.move` (AdminCap + sender checks — minimal subset of Cycle 7)
- `gateway/src/index.ts` + `gateway/src/sse-proxy.ts` (auth gate + SSRF allowlist)
- `src/pages/api/query.ts` · `decay.ts` · `resistance.ts` · `harden.ts` (API-key gate)
- `src/schema/world.tql` (2 attributes: `scope-group`, `scope-skill`)
- `src/lib/api-auth.ts:107` (activate the already-written scope check)

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/move/one/sources/one.move` (lines near 547, 639) | Every `public fun` without sender/capability check; existing `init()` shape for `AdminCap` insertion |
| R2 | `gateway/src/index.ts:444` + `gateway/src/sse-proxy.ts` | Current auth middleware pattern; how API-key header reaches the `/typedb/query` handler; `fetch()` targets in SSE proxy |
| R3 | `src/pages/api/query.ts` · `decay.ts` · `resistance.ts` · `harden.ts` | Existing `verifyApiKey` usage elsewhere to copy; what caller context `harden.ts` needs to match against unit ownership |
| R4 | `src/schema/world.tql` + `src/lib/api-auth.ts` around line 107 | Where `api-key` entity is defined; what the dormant scope check reads; whether test fixtures need regenerating |

### Wave 2 — Decide (Opus × 1)

1. **Sui (narrow):** introduce only `AdminCap` (minted in `init()`, transferred to deployer) gating `withdraw_protocol_fees` + `set_fee_bps`. For `mark`/`warn`, assert `ctx.sender() == unit.owner` using an `owner: address` field on Unit. Defer `ColonyAdminCap`, `RubricVerdict`, harden-guard, arithmetic reorder — all Cycle 7.
2. **Gateway:** add `requireApiKey()` middleware to `/typedb/query` and all mutation routes; 401 on missing, 403 on invalid. Reuse existing verification path; no caching redesign.
3. **SSRF:** env-driven allowlist of upstream hosts for `/proxy/sse`; strip `Authorization` before forwarding; emit `kind: "security"` event on mismatch (helper can be stubbed — real emission lands in Cycle 4).
4. **API-key scope live:** add `scope-group` + `scope-skill` attributes to `world.tql`, then remove the "scope check dormant" branch in `api-auth.ts:107`. Existing keys (no scope) remain valid as "unscoped" in this cycle; Cycle 2 tightens defaults and TTL.
5. **`/api/harden` ownership:** look up `unit.owner` from TypeDB, compare to caller's API-key owner; 403 on mismatch.
6. **Bundle constraint:** Sui changes ship as a single `package upgrade`; batch with any Cycle 7 prep that is already safe, otherwise ship standalone.

### Wave 3 — Edits (Sonnet × 7, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/move/one/sources/one.move` | Add `AdminCap` struct + `init()` mint/transfer; gate `withdraw_protocol_fees` + `set_fee_bps` |
| E2 | `src/move/one/sources/one.move` | Add `owner: address` to Unit struct; assert sender == owner in `mark()` + `warn()` |
| E3 | `gateway/src/index.ts` | Add `requireApiKey()` middleware on `/typedb/query` and every mutation route |
| E4 | `gateway/src/sse-proxy.ts` | Host allowlist (env) + strip `Authorization` before upstream fetch |
| E5 | `src/pages/api/query.ts` · `decay.ts` · `resistance.ts` | Apply `verifyApiKey` gate; admin-only where destructive |
| E6 | `src/pages/api/harden.ts` | Verify caller's key owner matches target unit; 403 mismatch |
| E7 | `src/schema/world.tql` + `src/lib/api-auth.ts:107` | Add `api-key owns scope-group, scope-skill`; remove dormant-check branch |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — `sui move build` + `sui move test` clean; tsc + biome green |
| V2 | Cross-ref — zero unauthenticated handlers remain on the 8 listed routes (grep for route handler without `verifyApiKey` / `requireApiKey`) |
| V3 | Invariants — new negative tests: unauthorized `withdraw_protocol_fees` aborts; `/typedb/query` with no key → 401; `/api/harden` for non-owned unit → 403; SSRF to non-allowlisted host → rejected + no Authorization leak |
| V4 | Rubric — ≥ 0.65 on all dims |

**Exit:**
- All 8 findings above have a failing-before / passing-after test.
- Sui testnet package upgraded; unauthorized `withdraw_protocol_fees` aborts on-chain.
- Gateway `/typedb/query` returns 401 without a key (verified by curl).
- `/api/harden` 403s on ownership mismatch.
- `bun run verify` green; `sui move test` green.
- `docs/SYSTEM-HEALTH.md` findings C-3, C-8, C-9, C-10, C-12, C-19, C-20, H-19 marked as patched in a new footer section.

**What Cycle 0 does NOT do:**
- Full PEP lock (Cycle 3).
- 24h TTL + read-by-default key minting (Cycle 2).
- TQL injection sweep across all routes (Cycle 3 — C-16 stays there; Cycle 0 only gates access to the routes, doesn't sanitize).
- Nonce dedupe (Cycle 3, needs Cycle 2.5 first).
- SecurityEvent emission + WsHub revoke broadcast (Cycle 4 — Cycle 0 uses a stub).
- Full Sui capability design (Cycle 7 — Cycle 0 ships only AdminCap + Unit.owner).

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

**Audit findings covered:** C-3 (scope attrs missing from schema — two TQL lines
in E1 fix it), C-14 (legacy `/api/keys` backdoor — delete or gate in this cycle),
C-15 (`/api/auth/agent` rate limit + UID squatting), H-12 (PBKDF2 O(n) scan →
fast-lookup token), L-16 (`Math.random` keyId → `crypto.randomUUID`), M-27
(revoked-key cache TTL — coordinate with Cycle 4 broadcast).

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

## Cycle 2.5 — ENGINE-HARDEN: Fix the Runtime Before Locking the PEP

**Scope:** move module-level singleton state to per-instance, close the
four parallel tick implementations, fix `process.env` on CF Workers, align
`markDims` thresholds, fill the ADL/persist test black holes.

**Audit findings covered (all of engine-correctness):**
- **Module-level state bleeding across isolates** — C-1 (tick counters +
  `previousTarget` + `chainDepth` in `loop.ts`/`loops.ts`/`tick.ts`/
  `substrate.ts`), C-2 (`NONCE_SEEN` + `LIFECYCLE_CACHE` in `persist.ts` —
  **must land before Cycle 3** or nonce dedupe is unreliable across worlds).
- **Parallel implementations + drift** — H-1 (four tick orchestrators), H-2
  (`isToxic` copy-pasted in `one-complete.ts`, `one-prod.ts`, `chairman.ts`
  — the `chairman.ts` copy returns the wrong dissolved shape), H-3 (in-memory
  seasonal decay vs flat TypeDB decay → revival on hydrate), H-9 (two
  `markDims` with 0.5 vs 0.65 thresholds — `wave-runner.ts` uses the wrong
  one and pheromone learns mediocrity is good).
- **Silent production degradation** — H-7 (WAL `flushToD1(db?)` — D1 handle
  never wired, every pheromone write is a no-op), H-8 (`process.env`
  broken in `ceo-classifier.ts`, `agentverse-connect.ts`, `context.ts`,
  `auth.ts`, `logger.ts` → fall through to `'admin'` creds or `undefined`
  keys), H-10 (stale Gateway fallback URL in `typedb.ts`), H-11 (two
  conflicting schemas — `one.tql` uses `actor/aid`, `world.tql` uses
  `unit/uid`; engine loads `world.tql` but CLAUDE.md says `one.tql` is
  "stable forever").
- **Fail-open bridge on malformed perms** — H-5 (`bridge.ts:99-103`
  `malformed → fail open` contradicts the "fail CLOSED on TypeDB errors"
  header on the same file; real-money path).
- **WAL SQL injection** — H-6 (`wal.ts:84` builds SQL via `${r.edge.replace
  (/'/g, "''")}` — `\` or `;` in a UID drops the whole batch silently).
- **Test black holes** — C-5 (`tick()` never imported in `loop.test.ts` —
  seven-loop orchestration entirely uncovered), C-6 (ADL lifecycle/network/
  sensitivity gates have no tests), C-7 (`know()`, `forget()`,
  `hasPathRelationship()`, `sync()`, `load()` untested).

**Why 2.5 (before Cycle 3):** Cycle 3's nonce dedupe and PEP lock assume the
runtime's state model is per-world. Landing C-2 after Cycle 3 would require
re-verifying every PEP test under the correct state model. Cheaper to fix
first.

### Wave 1 — Recon (Haiku × 5)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/engine/loop.ts` + `loops.ts` + `tick.ts` + `substrate.ts` | Enumerate every module-level `let/const`; map which tick impl is wired from `boot.ts` |
| R2 | `src/engine/persist.ts` | `NONCE_SEEN`, `LIFECYCLE_CACHE`, `isToxic` export surface, PEP-4/5 stubs at lines 674/858 |
| R3 | `src/engine/wal.ts` + `world.ts` | `flushToD1` callsite graph, where D1 handle enters from Astro `locals` |
| R4 | `src/engine/rubric.ts` + `rubric-score.ts` + `wave-runner.ts` | Which `markDims` is imported where; verify threshold mismatch |
| R5 | repo-wide grep | Every `process.env`, `globalThis.process?.env`, `require()` in `src/engine/` + `src/lib/` |

### Wave 2 — Decide (Opus × 1)

1. **State-model decision:** `TickState` struct attached to each
   `PersistentWorld` instance; `NONCE_SEEN`, `LIFECYCLE_CACHE`,
   `previousTarget`, `chainDepth`, `taskFailures`, `tagFailures` all move to
   instance fields. Delete exported `resetTick()`.
2. **One tick winner:** designate `tick.ts` as canonical; migrate
   `loop.ts` features (`computePValueFromD1`, hypothesis reflex) into
   `loops.ts` primitives; delete `substrate.ts` tick and `loop.ts::tick`.
3. **`isToxic` single source:** re-export from `persist.ts`; delete three
   copies; fix `chairman.ts` to return `{ dissolved: true }` not `undefined`.
4. **`markDims` single source:** delete `rubric.ts::markDims` (0.5 threshold);
   `wave-runner.ts` imports from `rubric-score.ts` (0.65, canonical).
5. **Env access policy:** `import.meta.env` for build-time constants;
   `getEnv(locals)` from `cf-env.ts` for runtime secrets. No `process.env`
   in the engine. `specialist-leaf.ts:59` is the reference pattern.
6. **Schema source of truth:** rename `one.tql` → `one-conceptual.tql` with
   a prominent header; runtime is `world.tql`. Update CLAUDE.md.
7. **WAL:** thread `D1Database` handle from Astro `locals` through `boot()`
   into `world.ts`; parameterise `prepare(...).bind(...)` everywhere.
8. **Bridge fail-closed:** replace `/* malformed → fail open */` with
   `allowedHosts: []` + a logged warn.

### Wave 3 — Edits (Sonnet × 10, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/engine/persist.ts` | Move `NONCE_SEEN` + `LIFECYCLE_CACHE` to instance; wrap KEK write in try/catch fallback |
| E2 | `src/engine/tick.ts` + `loops.ts` | Absorb `loop.ts` features; delete `loop.ts::tick` + `substrate.ts` tick duplication |
| E3 | `src/engine/one-complete.ts` + `one-prod.ts` + `chairman.ts` | Remove `isToxic` copies; import from `persist.ts`; fix `chairman.ts` dissolved return |
| E4 | `src/engine/rubric.ts` + `wave-runner.ts` | Delete `rubric.ts::markDims`; switch `wave-runner.ts` to `rubric-score.ts::markDims` + `compositeScore()` for both store + gate |
| E5 | `src/engine/wal.ts` + `world.ts` + `boot.ts` + `substrate.ts` | Parameterised D1 prepare/bind; thread `D1Database` handle end-to-end |
| E6 | `src/engine/bridge.ts` | Replace fail-open catch with `allowedHosts: []` + warn log |
| E7 | `src/engine/ceo-classifier.ts` + `agentverse-connect.ts` + `context.ts` + `src/lib/auth.ts` + `src/lib/logger.ts` | Replace `process.env` with `import.meta.env` or `getEnv(locals)` |
| E8 | `src/lib/typedb.ts` | Fallback URL → `'https://api.one.ie'` |
| E9 | `src/schema/one.tql` | Rename to `one-conceptual.tql` + header banner; update all doc references |
| E10 | `loop.test.ts` + `adl.test.ts` + `persist.test.ts` | Add `tick()` orchestration tests (7 loop counters + timing guards); three ADL gate `describe` blocks; `know()`/`forget()`/`hasPathRelationship()`/`sync()`/`load()`/`checkNonce()` tests |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — zero module-level mutable state in `src/engine/`; single `tick` export; single `isToxic` export; single `markDims` export |
| V2 | Cross-ref — `boot.ts` wires D1 handle; every `process.env` in engine replaced; `one-conceptual.tql` referenced where `one.tql` was |
| V3 | Invariants — two concurrent worlds share no pheromone state; nonce replay rejected per-world only; WAL batch writes land in D1; `loop.test.ts` fails if `TickResult` shape changes |
| V4 | Rubric — ≥ 0.65 on all dims |

**Exit:**
- `grep -r 'let [A-Z_]\+.*=' src/engine/` returns zero module-level mutables.
- `boot.ts` passes `D1Database` into `world()`; WAL writes visible in D1 after a tick.
- `loop.test.ts` covers all seven loops' counters.
- ADL gates: three scenarios green (410 retired, 403 unlisted host, audit on sensitive→public).
- `forget()` cascade test proves private hypotheses deleted.

---

## Cycle 3 — LOCK-PEP: The One Authorization Function

**Scope:** centralize and lock the order of checks in `persist().signal()`.
Add per-signal nonce + 5-min dedupe. Enforce via lint that only `src/engine/`
imports `world`.

**Audit findings covered (the big sweep):**
- **Unauthenticated write endpoints** — C-8 (`/api/query`), C-9 (Gateway
  `/typedb/query`), C-11 (seed endpoints ×3), C-12 (`/api/decay`,
  `/api/resistance` — pheromone poisoning), C-13 (`faucet-internal.ts` —
  wallet drainable), C-17 (`commend`/`flag`), C-18 (group signal caller not
  verified), H-16 (`/api/tick`), H-17 (signal scope bypass by omitting Auth
  header), H-18 (`/api/pay` + caller-controlled `from`), H-19 (`/api/harden` —
  signs Sui tx as any agent), H-20 (`/api/subscribe`), H-21 (GDPR forget reads
  uid from unverified cookie), H-22 (status/sync/adl), H-30 (`/api/hypotheses`),
  M-19–M-22 (wave claim, expire, rubric clamp), M-26 (`/api/mcp/[tool]`).
- **TQL injection** — C-16 (endemic across agents/groups/marketplace) plus
  L-14 (`signals.ts since` param) and L-15 (null-guard on mark/warn). One
  `validateUid + escapeTqlString` pattern from `signal.ts` rolled across all
  routes as a single W3 fan-out.
- **Scope leakage** — M-24 (marketplace surfaces private signals), M-25
  (`/api/discover` joins without scope filter). Already planned as Cycle 3 E6
  (`tenantScope()` sweep).
- **Stubs** — H-4 (PEP-4/5 budget + rate-limit stubs) is the PEP completion
  this cycle exists to ship.

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

**Audit findings covered:**
- **SSRF** — C-10 (`/proxy/sse` fetches arbitrary URLs + forwards
  Authorization header), M-14 (SSE proxy header passthrough), M-23 (brand
  extract — no scheme or RFC-1918 block). Allowlist + header scrub, emit
  `ssrf-probe` event on mismatch.
- **Gateway hardening** — H-27 (`!==` secret compare → `timingSafeEqual`),
  H-28 (task mutation routes unauthenticated — can inject WS events into
  every browser), M-13 (connect-count TOCTOU), M-15 (raw TypeDB error text
  in 500s), M-16 (JWT decode crashes isolate), M-17 (token-cache stampede),
  M-18 (CORS `startsWith` subdomain spoof).
- **Revocation + stale state** — M-27 (revoked keys valid 5 min — directly
  Cycle 4 E5 cache invalidation + broadcast), M-29 (`stream.ts cancel` no-op
  → ghost polling).
- **Config safety** — M-28 (`INVITE_SECRET` falls back to `"dev-secret"`
  → hard-fail 503 if env unset).

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

**Audit findings covered:** C-4 (`tenant-kek` entity not in `world.tql` —
`encryptForGroup` throws on first call; directly Cycle 5 E5 adds the entity +
three attributes), M-30 (raw `seed||uid` SHA-256 → HKDF with `info =
"one-agent:" + uid` — directly Cycle 5 E1).

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

## Cycle 7 — SUI-LOCK: Move Contract Access Control Before Phase 3

**Scope:** add capability-based access control to the Move contract. Treasury,
routing graph mutations, colony membership, dissolution, and `harden` must
require proof of authority. Fix arithmetic overflow. Cap `rate` and `fee_bps`.
Bundle into a single package upgrade alongside Phase 3 escrow changes.

**Why last:** Every other cycle is off-chain (TypeScript + schema). This one
ships a Move `package upgrade` — once-deployed, harder to iterate. All prior
tests must be green; Phase 3 escrow plan must be locked. **Treasury is
drainable on testnet right now** — this cycle exists because of that.

**Audit findings covered (every Move critical + high):**
- **Treasury drainable** — C-19 (`withdraw_protocol_fees()` +
  `set_fee_bps()` on shared `Protocol` with no `AdminCap` — one tx drains
  everything).
- **Routing graph corruption** — C-20 (`mark()` + `warn(u64::MAX)` callable
  by anyone; no sender check against Unit owner).
- **Arithmetic + validation** — C-21 (`amount * fee_bps` overflows u64
  before `/10000`; reorder as `amount / 10000 * fee_bps` and cap `fee_bps ≤
  10000` in `set_fee_bps`), C-22 (`fade(rate=0)` zeros strength +
  resistance; `rate > 100` overflows — `assert!(rate > 0 && rate <= 100)`).
- **Escrow + lifecycle** — H-23 (`release_escrow()` has no rubric gate;
  Phase 3 workers can self-release for bad work before deadline — add
  `RubricVerdict` oracle capability), H-26 (`harden()` takes immutable ref
  and creates a new Highway every call; change to `&mut Path` + `hardened:
  bool` guard).
- **Ownership gaps** — H-24 (`join_colony()` needs `ColonyAdminCap`
  transferred to creator), H-25 (`dissolve()` consumes a Unit with no
  ownership check; marketplace buyer can drain seller's Unit balance — add
  `owner: address` field + assert `ctx.sender() == unit.owner`).
- **Off-chain settlement** — H-29 (`bridge.ts::settleEscrow()` fire-and-
  forget; Sui failure leaves Escrow locked on-chain with no alert — return
  a Promise, write `escrow-status "settlement-failed"` on failure, add a
  reconciliation cron).
- **Lows** — L-18 (1ms deadline boundary gap), L-19 (`harden()` bakes in
  misleading Laplace `+1`), L-20 (`register_task()` aborts on duplicate —
  TypeScript caller lacks guard), M-31 (`create_path()` allows duplicates —
  pheromone splits across paths).

### Wave 1 — Recon (Haiku × 4)

| Agent | File | Look for |
|-------|------|----------|
| R1 | `src/move/one/sources/one.move` | Every `public fun`; sender-check presence; capability objects in `init()` |
| R2 | `src/move/one/sources/one.move` lines 257/353/483 + 574-577 | Multiplication-before-division sites; `fade()` arithmetic; `harden()` mutation pattern |
| R3 | `src/engine/bridge.ts` + `src/lib/sui.ts` | Current escrow flow; `settleEscrow` caller expectations; where Phase 3 needs gating |
| R4 | `src/pages/api/harden.ts` + `src/pages/api/tick.ts` + any caller of `mark`/`warn` on-chain | All off-chain callers of the functions whose signatures change |

### Wave 2 — Decide (Opus × 2 shards)

Shard A — Capability design:
1. **`AdminCap`** minted in `init()`, transferred to deployer. Required
   parameter on `withdraw_protocol_fees()`, `set_fee_bps()`.
2. **`ColonyAdminCap`** minted in `create_colony()`, transferred to creator.
   Required on `join_colony()`. Transferable so ownership can change.
3. **`UnitOwnerCap`** OR `owner: address` field on Unit struct (prefer
   field — Unit has `key, store` for marketplace transfer; capability-only
   model is awkward for resale). `dissolve()` asserts `ctx.sender() ==
   unit.owner`.
4. **Path ownership:** `mark()` / `warn()` require `ctx.sender()` is owner
   of source Unit OR target Unit. Pass the owner cap or look up owner
   field.
5. **`RubricVerdict`** hot potato (unique, must-consume-in-same-tx)
   minted by a trusted oracle address; `release_escrow()` requires it.
   Oracle config is shelved for post-Phase-3; placeholder uses deployer
   address.

Shard B — Arithmetic + settlement:
1. **Overflow:** reorder `amount / 10000 * fee_bps` in all three pay
   sites. Add `assert!(fee_bps <= 10000, EInvalidFee);` in
   `set_fee_bps()`. Add `assert!(rate > 0 && rate <= 100, EInvalidRate);`
   in `fade()`.
2. **Harden guard:** `harden()` takes `path: &mut Path`; add `hardened:
   bool` field; `assert!(!path.hardened, EAlreadyHardened)`; set to true
   before emitting Highway.
3. **Settlement recovery:** `bridge.ts::settleEscrow()` returns
   `Promise<SettlementResult>`; failure writes `escrow-status
   "settlement-failed"` with error string to TypeDB. Reconciliation cron
   (new worker or Sync cron) retries failed escrows every 10 minutes,
   max 3 attempts before surfacing to admin dashboard.
4. **Package upgrade coordination:** bundle with Phase 3 escrow changes
   in a single upgrade — see `docs/TODO-SUI.md` Phase 3 W2 decisions.

### Wave 3 — Edits (Sonnet × 8, parallel)

| Job | File | Edits |
|-----|------|-------|
| E1 | `src/move/one/sources/one.move` (init + Protocol) | Add `AdminCap` struct; mint + transfer in `init()`; gate admin fns |
| E2 | `src/move/one/sources/one.move` (pay + fee) | Reorder arithmetic; add `fee_bps` + `rate` asserts; `EInvalidFee` + `EInvalidRate` error codes |
| E3 | `src/move/one/sources/one.move` (Colony + Unit) | `ColonyAdminCap`; `owner: address` on Unit; `dissolve()` sender check |
| E4 | `src/move/one/sources/one.move` (Path + mark/warn) | Sender-is-owner check; `create_path()` uniqueness guard (M-31) |
| E5 | `src/move/one/sources/one.move` (harden) | `&mut Path` + `hardened: bool` guard |
| E6 | `src/move/one/sources/one.move` (release_escrow) | `RubricVerdict` hot-potato parameter |
| E7 | `src/engine/bridge.ts` + new `workers/escrow-reconcile/` (or Sync cron) | Promise-returning `settleEscrow` + status writes + retry cron |
| E8 | `src/pages/api/harden.ts` + `mark.ts` + `warn.ts` + any on-chain caller | Pass new capability args; update integration tests |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Checks |
|-------|--------|
| V1 | Consistency — `sui move build` clean; `sui move test` green (including new negative tests for unauthorized caller) |
| V2 | Cross-ref — every TypeScript on-chain caller passes the new cap arg; no orphan `public fun` without sender check or cap |
| V3 | Invariants — unauthorized `withdraw_protocol_fees` aborts `ENotAuthorized`; `fee_bps = u64::MAX` attempt aborts `EInvalidFee`; `fade(0)` aborts; `harden` twice aborts; `dissolve` by non-owner aborts; `release_escrow` without verdict aborts |
| V4 | Rubric — ≥ 0.65 |

**Exit:**
- `sui move test` reports ≥ 8 new tests covering every new abort path.
- Testnet upgrade deployed; treasury no longer drainable (verified by
  attempted unauthorized `withdraw_protocol_fees` → abort).
- `bridge.ts` reconciliation cron logs a retry + recovery on a simulated
  failure.
- `docs/TODO-SUI.md` Phase 3 checklist tied into this cycle's exit.

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| 0 STOP-BLEED | Public-internet attack surface closed (8 routes gated, Sui AdminCap + Unit.owner) | L1 baseline only |
| 1 WIRE-DELETE | Surface shrinks, false signals removed | L1 baseline only |
| 2 SCOPE-KEYS | Keys carry scope, blast radius narrows | L1 + L4 (economic boundary at capability) |
| 2.5 ENGINE-HARDEN | Per-instance state, one tick, one markDims; tests fill coverage holes | L1–L7 (runtime now trustworthy for all loops) |
| 3 LOCK-PEP | Authorization becomes one function with replay guard | L1–L3 (pheromone now reliable) |
| 4 LEARN-SIGNALS | Security events feed pheromone, attackers auto-routed-around | L1–L3 + L6 (`know()` on security patterns) |
| 5 SHIELD-DATA | Persistence hardened, audit immutable, crypto-shred live | L1–L7 (L7 spawns frontier hypotheses on anomaly clusters) |
| 7 SUI-LOCK | On-chain access control, arithmetic safe, escrow reconciles | L4 (economic loop closes end-to-end on-chain) |

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
| 0 STOP-BLEED | 4 | 1 | 7 | 4 | Narrow hot-patches across 8 internet-exposed findings; bundles Sui upgrade |
| 1 WIRE-DELETE | 4 | 1 | 4 | 4 | Small surface |
| 2 SCOPE-KEYS | 4 | 1 | 5 | 4 | Schema + auth |
| 2.5 ENGINE-HARDEN | 5 | 1 | 10 | 4 | Runtime correctness, broadest engine touch |
| 3 LOCK-PEP | 4 | 1 | 9 | 4 | PEP + API auth sweep (very broad W3) |
| 4 LEARN-SIGNALS | 4 | 1 | 9 | 4 | Events + Gateway hardening |
| 5 SHIELD-DATA | 4 | 2 shards | 7 | 4 | Crypto + audit, split Opus by domain |
| 7 SUI-LOCK | 4 | 2 shards | 8 | 4 | Move contract — bundle with Phase 3 escrow |

**Hard stop:** any W4 looping > 3× → halt, escalate. Security cycles don't
ship yellow.

---

## Status

- [x] **Cycle 0: STOP-BLEED** — narrow patches for 8 internet-exposed zero-auth findings
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 7, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel)
- [x] **Cycle 1: WIRE-DELETE** — remove XOR helpers, relocate utilities, fix ChatShell
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 4, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel by check type)
- [x] **Cycle 2: SCOPE-KEYS** — scope-group, scope-skill, default read, 24h TTL
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 5, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel)
- [x] **Cycle 2.5: ENGINE-HARDEN** — per-instance state, one tick, fill test holes
  - [x] W1 — Recon (Haiku × 5)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 10, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel)
- [x] **Cycle 3: LOCK-PEP** — canonical PEP order + nonce + lint rule
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 5, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel)
- [x] **Cycle 4: LEARN-SIGNALS** — security events → substrate signals + warn(0.3)
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 5, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel)
- [x] **Cycle 5: SHIELD-DATA** — HKDF wallet, tenant KEK, audit Merkle, worker JWT
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 2 shards)
  - [x] W3 — Edits (Sonnet × 7, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel)
- [x] **Cycle 7: SUI-LOCK** — Move contract access control + arithmetic + escrow reconcile
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 2 shards)
  - [x] W3 — Edits (Sonnet × 8, parallel)
  - [x] W4 — Verify (Sonnet × 4, parallel)

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

- [security.md](one/security.md) — source of truth for the five choke points
- [SYSTEM-HEALTH.md](../docs/SYSTEM-HEALTH.md) — 2026-04-20 audit (24 Crit · 52 High) that expanded this TODO from 5 cycles to 7
- [auth.md](auth.md) — identity + credential model
- [groups.md](one/groups.md) — RBAC/ABAC/ReBAC scope
- [DSL.md](one/DSL.md) — signal grammar (loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring
- [TODO-template.md](one/TODO-template.md) — this template
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- [TODO-SUI.md](../docs/TODO-SUI.md) — Sui phase roadmap; Cycle 7 bundles with Phase 3 escrow
- `src/engine/persist.ts` — the PEP
- `src/engine/tick.ts` · `loops.ts` — canonical tick (post Cycle 2.5)
- `src/lib/api-auth.ts` · `src/lib/api-key.ts` — credential verification
- `src/schema/one.tql` — conceptual ontology (runtime is `world.tql`)
- `src/move/one/sources/one.move` — Sui contract (Cycle 7)

---

*Eight cycles. Stop-Bleed → Delete → Scope → Engine → Lock → Learn → Shield
→ Sui. Cycle 0 closes the doors the internet is already walking through;
the remaining seven rebuild the walls properly. Each cycle activates one
deeper loop. The firewall writes itself from data — and the audit writes
itself into the firewall.*
