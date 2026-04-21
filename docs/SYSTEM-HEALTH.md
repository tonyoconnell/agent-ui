# System Health Report

Generated: 2026-04-20
Codebase: agent-ui (ONE — Signal-based world for AI agents)
Stack: Astro 5 + Cloudflare Workers + TypeDB 3.x + Sui
Scope: Agent loop, engine, TypeDB schema/lib — Astro/UI layers excluded

## Executive Summary

The substrate engine is architecturally sound in concept — the signal/pheromone/closed-loop design is coherent and the core pheromone math is correct. However, **three structural hazards undermine production correctness**: module-level mutable state bleeding across CF Worker isolates; missing TypeDB schema entries for security-critical features (API key scoping, KEK encryption) that make those features silently non-functional; and a test suite that never calls `tick()` or exercises the three ADL security gates, meaning a large class of regression is undetectable. The recommended first action is to fix the two schema gaps (C-3, C-4) since they are security-adjacent, then address the module-level singleton pattern (C-1, C-2) which is a correctness hazard under CF Worker isolate reuse.

---

## Critical

### C-1: Module-level tick state bleeds between CF Worker isolates
**Layer:** Engine Core
**File:** `src/engine/loop.ts:76-84`, `src/engine/loops.ts:57`, `src/engine/tick.ts:73-80`, `src/engine/substrate.ts:284`
**Issue:** `cycle`, `lastDecay`, `lastEvolve`, `lastHarden`, `previousTarget`, `chainDepth`, `taskFailures`, `tagFailures` are module-level singletons. CF Workers reuse isolates across requests, causing state to bleed between ticks. The exported `resetTick()` in `tick.ts` is a red flag — it exists only because state is where it should not be.
**Risk:** Two concurrent worlds share a single `previousTarget`, corrupting pheromone routing. `chainDepth` accumulates across unrelated signal chains, triggering false mark() bonuses.
**Fix:** Move all tick state into a `TickState` struct local to each `PersistentWorld` instance or to the `tick()` closure. Remove `resetTick()`.

---

### C-2: NONCE_SEEN and LIFECYCLE_CACHE are module-level — cross-world security bypass
**Layer:** Engine Core
**File:** `src/engine/persist.ts:41-55`
**Issue:** `NONCE_SEEN` (replay prevention) and `LIFECYCLE_CACHE` (ADL gate) are module-level Maps. In any multi-world or multi-tenant deployment, worlds share one nonce pool — a nonce consumed by world A can be replayed to world B.
**Risk:** In federated/multi-tenant setups replay attacks pass through. In tests, nonces from one test bleed into the next.
**Fix:** Move both Maps to instance state on `PersistentWorld`, matching the `adl-cache.ts` per-world pattern.

---

### C-3: API key scope enforcement silently bypassed — `scope-group`/`scope-skill` not in schema
**Layer:** TypeDB Schema + Lib
**File:** `src/lib/api-auth.ts:107`
**Issue:** `validateApiKey()` queries `optional { $k has scope-group $sg; }` and `optional { $k has scope-skill $ss; }`. Neither attribute exists in `one.tql` or `world.tql`. TypeDB returns null on undefined `has` clauses in optional blocks — `scopeGroups` is always empty, treated as "no restriction," scope enforcement never fires.
**Risk:** Every API key has full unrestricted scope regardless of what was configured. The security feature is completely non-functional in production.
**Fix:** Add `scope-group sub attribute, value-type string;` and `scope-skill sub attribute, value-type string;` to `world.tql`, and `api-key owns scope-group, owns scope-skill;`.

---

### C-4: KEK entity not in schema — private signal encryption throws on first call
**Layer:** TypeDB Schema + Lib
**File:** `src/lib/kek.ts:46-65`
**Issue:** `kek.ts` inserts `isa tenant-kek` with attributes `group-id`, `kek-ciphertext`, `kek-iv`. These are absent from both `world.tql` and `one.tql`. `getTenantKEK()` calls `write()` (not `writeSilent()`) without error wrapping — throws on any group without a pre-existing cached KEK.
**Risk:** `encryptForGroup()` throws for any group that hasn't previously cached its KEK in the current isolate. All private signal data encrypted via this path is at risk of loss or unhandled 500s.
**Fix:** Add `tenant-kek` entity type with the three attributes to `world.tql`. Wrap the `write()` in `getTenantKEK()` with try/catch that falls back to key generation.

---

### C-5: `tick()` never called in loop tests — entire loop orchestration is uncovered
**Layer:** Engine Test Coverage
**File:** `src/engine/loop.test.ts`
**Issue:** `loop.ts` exports `tick(net, complete): Promise<TickResult>` which orchestrates all seven loops, manages timing guards, and produces `TickResult`. The test file never imports `tick` — all tests exercise raw world primitives already covered by `world.test.ts`.
**Risk:** Any regression in loop timing, TickResult shape, write-health computation, or inter-loop sequencing is completely undetectable by the test suite.
**Fix:** Add tests calling `tick()` with a mocked `PersistentWorld`, verify TickResult shape and all seven loop counters, and verify timing guards prevent double-firing.

---

### C-6: ADL security gates untested — lifecycle/network/sensitivity decisions not verified
**Layer:** Engine Test Coverage
**File:** `src/engine/adl.test.ts`
**Issue:** The three ADL gates — (1) Lifecycle: reject signals to `retired`/`deprecated` units, (2) Network: check sender against receiver's `allowedHosts`, (3) Sensitivity: audit restricted→public flows — are entirely absent from `adl.test.ts`. The file only covers `parse()`, `validate()`, `toTypeDB()`, and sensitivity mapping.
**Risk:** A regression in any gate passes the full test suite undetected. ADL gates are the primary signal-interception layer.
**Fix:** Add three describe blocks: lifecycle gate (retired unit → 410), network gate (unlisted host → 403), sensitivity gate (restricted→public → audit, non-blocking).

---

### C-7: `persist` core methods have zero unit tests — GDPR erasure, load, sync, know untested
**Layer:** Engine Test Coverage
**File:** `src/engine/persist.test.ts`
**Issue:** `know()` (L6 loop closer), `forget()` (GDPR erasure), `hasPathRelationship()` (pheromone gate), `sync()` (write all state to TypeDB), and `load()` (cold-start hydration) have no tests.
**Risk:** Untested `forget()` is a compliance risk. Untested `load()` means cold-start regressions are invisible.
**Fix:** Add test blocks for each. `forget()` must verify cascade deletion sequence. `hasPathRelationship()` must verify fail-closed on TypeDB error.

---

## High

### H-1: Four parallel tick implementations — features diverge silently
**Layer:** Engine Core
**File:** `src/engine/loop.ts`, `src/engine/loops.ts`, `src/engine/tick.ts`, `src/engine/substrate.ts`
**Issue:** `loop.ts::tick()` (legacyTick), `loops.ts` composable primitives, `tick.ts::tick()` (new orchestrator), and `substrate.ts` are four separate growth tick implementations with independent FADE_RATE, EVOLUTION_THRESHOLD, and hypothesis machinery. `boot.ts` uses `loop.ts::tick`; `index.ts` exports both.
**Risk:** Features added to `loop.ts` (e.g., computePValueFromD1, hypothesis reflex) are absent from `tick.ts` and `substrate.ts`. Production behaviour depends on which entry point is wired.
**Fix:** Designate `tick.ts` as the single orchestrator. Migrate all features from `loop.ts` into `loops.ts` primitives. Delete `substrate.ts` tick duplication.

---

### H-2: `isToxic` predicate duplicated in 3+ locations — threshold drift + wrong return value
**Layer:** Engine Core + Engine Extended (cross-layer)
**File:** `src/engine/one-complete.ts:68`, `src/engine/one-prod.ts:117`, `src/engine/chairman.ts:37`
**Issue:** The canonical `isToxic` formula is copy-pasted in at least three files alongside the export in `persist.ts`. `chairman.ts:37` additionally returns `undefined` instead of `{ dissolved: true }`, silently applying full `warn(1)` instead of the intended mild `warn(0.5)`.
**Risk:** A threshold change in `persist.ts` is not propagated. The `chairman.ts` copy applies the wrong pheromone penalty on hire-path toxicity.
**Fix:** Remove all copies. Import `isToxic` from `persist.ts`. Fix `chairman.ts` return to `return { dissolved: true }`.

---

### H-3: Runtime/DB fade drift — seasonal decay in memory, flat decay written to TypeDB
**Layer:** Engine Core
**File:** `src/engine/persist.ts:246-253`
**Issue:** `world.ts::fade()` applies a seasonal multiplier (up to 2×) and ghost-trail floor at `peak × 0.05`. `persist.ts::fade()` writes flat `strength * (1 - rate)` to TypeDB — no seasonal adjustment, no floor.
**Risk:** After a long idle period, DB values diverge from in-process values. On re-hydration via `load()`, DB values restore, silently discarding in-memory seasonal decay — paths that should be nearly dead are revived.
**Fix:** Extract seasonal decay into a shared function. Apply consistently in both in-memory and TypeDB write paths.

---

### H-4: PEP-4/5 budget and rate-limit checks permanently stubbed — sandwich is incomplete
**Layer:** Engine Core
**File:** `src/engine/persist.ts:674`, `src/engine/persist.ts:858`
**Issue:** Both `signal()` and `ask()` contain `// PEP-4/5: budget + rate-limit stubs (pass-through)`. The pre-flight budget gate is absent — any unit can fire unlimited LLM calls regardless of balance.
**Risk:** Unconstrained LLM spend in production. The L4 economic loop is incomplete.
**Fix:** Replace the comment with a real gate or a typed `NotImplementedError` so the gap is visible at runtime.

---

### H-5: Sui bridge fails **open** on malformed permission records — real-money path
**Layer:** Engine Extended
**File:** `src/engine/bridge.ts:99-103`
**Issue:** `/* malformed → fail open */` contradicts `bridge.ts:53`: "bridge fails CLOSED on TypeDB errors (real-money asymmetry)." A malformed stored perm-network JSON causes the bridge to treat the path as fully unrestricted.
**Risk:** Malformed permission records on Sui payment paths grant unrestricted bridge access.
**Fix:** Replace fail-open catch with `allowedHosts: []` (deny all) for malformed records. Log a warning.

---

### H-6: WAL SQL built via string interpolation — silent batch drop on special characters
**Layer:** Engine Extended + Engine Core (cross-layer)
**File:** `src/engine/wal.ts:84`
**Issue:** Batch D1 insert uses `` `'${r.edge.replace(/'/g, "''")}' `` — only single-quotes escaped. Backslashes or semicolons in a UID produce a malformed query; the catch block swallows the failure silently. Every other D1 call uses parameterised `db.prepare().bind()`.
**Risk:** A UID containing `\` causes an entire batch of pheromone writes to drop silently.
**Fix:** Rewrite using parameterised `db.prepare('INSERT ... VALUES (?, ?, ?, ?)').bind(...)`.

---

### H-7: WAL `flushToD1` silently drops all D1 writes — pheromone D1 persistence is a no-op
**Layer:** Engine Core
**File:** `src/engine/wal.ts:47`, `src/engine/world.ts`
**Issue:** `world.ts::mark()` calls `bufferMark(path, amount, 0)` with no DB reference. `flushToD1(db?)` receives `undefined`. No entry point in `boot.ts` or `substrate.ts` wires a DB handle. The WAL buffer is populated but every D1 write is a no-op.
**Risk:** Rule 3 violated: substrate reports pheromone accumulating but D1 writes never land.
**Fix:** Thread a `D1Database` handle from Astro `locals` through `boot()` into `world.ts` and pass it to `flushToD1()`.

---

### H-8: CF Workers `process.env` pattern broken across 5+ files — silent production degradation
**Layer:** Engine Extended + TypeDB Lib (cross-layer)
**File:** `src/engine/ceo-classifier.ts:63`, `src/engine/agentverse-connect.ts:45`, `src/engine/context.ts:36-44`, `src/lib/auth.ts:77-79`, `src/lib/logger.ts:11-14`
**Issue:** Multiple files read env vars via `process.env` or `(globalThis as any).process?.env`. CF Workers do not expose `process` on `globalThis`; `import.meta.env` is the correct surface. Effects: CEO LLM fallback never fires; Agentverse key always undefined; TypeDB credentials fall back to hardcoded `'admin'`; runtime secrets not redacted in logs; context.ts `require()` always null → wave agents W1/W2 operate blind.
**Risk:** Multiple subsystems silently degrade in production CF Workers. Invisible without testing on the target runtime.
**Fix:** Audit all `process.env` accesses. Replace with `import.meta.env.VAR_NAME` (build-time) or `getEnv(locals)` from `cf-env.ts` (runtime). Use `specialist-leaf.ts:59` as the reference pattern.

---

### H-9: Two `markDims` functions with different score thresholds — wave-runner uses the wrong one
**Layer:** Engine Extended
**File:** `src/engine/rubric.ts:51`, `src/engine/rubric-score.ts:134`
**Issue:** `rubric.ts::markDims` uses `score >= 0.5` → mark. `rubric-score.ts::markDims` uses `score >= 0.65` (canonical docs threshold). `wave-runner.ts` imports from `rubric.ts` (the 0.5 threshold).
**Risk:** Waves scoring 0.50–0.64 are marked as successes instead of failures. Pheromone learns that underperforming work is good.
**Fix:** Delete `rubric.ts::markDims`. Migrate `wave-runner.ts` to `rubric-score.ts`. Verify all other callers.

---

### H-10: Stale gateway fallback URL breaks TypeDB in dev without `.env`
**Layer:** TypeDB Lib
**File:** `src/lib/typedb.ts:15`
**Issue:** Fallback is `'https://one-gateway.oneie.workers.dev'`; live Gateway is `api.one.ie`. `auth.ts` correctly falls back to `api.one.ie`, creating a split: substrate queries fall to a stale URL, BetterAuth queries fall to the correct one.
**Fix:** Update the fallback to `'https://api.one.ie'`.

---

### H-11: Two conflicting schemas claim to be the authoritative ontology
**Layer:** TypeDB Schema
**File:** `src/schema/one.tql` vs `src/schema/world.tql`
**Issue:** `one.tql` uses `actor`/`aid` and `hypothesis.confidence`. `world.tql` uses `unit`/`uid` and `hypothesis.p-value`. The engine loads `world.tql`. CLAUDE.md header on `one.tql` says "stable forever."
**Risk:** Anyone treating `one.tql` as the runtime schema builds against wrong type names.
**Fix:** Rename `one.tql` to `one-conceptual.tql` or add a prominent header: `// CONCEPTUAL ONTOLOGY ONLY — runtime schema is world.tql`.

---

### H-12: O(n × 100ms) PBKDF2 key scan on every cold-isolate API request
**Layer:** TypeDB Lib
**File:** `src/lib/api-auth.ts:101-170`
**Issue:** Slow-path fetches all active API keys with no `limit`, then PBKDF2-verifies each sequentially. With 100 keys: ~10 seconds to authenticate one cold-isolate request.
**Risk:** Cold-isolate API requests time out before authentication completes. Denial of service via key proliferation.
**Fix:** Store a fast-lookup token (truncated SHA-256 of the bearer) as an indexed attribute on `api-key`. Filter TypeDB query to that token so only one verification is performed.

---

### H-13: Nonce replay deduplication has no tests — security invariant unverifiable
**Layer:** Engine Test Coverage
**File:** `src/engine/persist.test.ts`
**Issue:** `checkNonce(nonce)` with 5-minute TTL prevents replay attacks. No test verifies first call (ok), second call within TTL (replay), or TTL expiry re-acceptance. Removing the check would pass the full test suite undetected.
**Fix:** Add `describe('Act: nonce replay dedup')` with three scenarios.

---

### H-14: `settle()` escrow path and rubric gate boundary (0.65) untested
**Layer:** Engine Test Coverage
**File:** `src/engine/persist.test.ts`, `src/engine/wave-runner.test.ts`
**Issue:** `settle()` (L4 economic loop closer, 50bps fee, rubric gate) has no unit tests. `wave-runner.test.ts` only covers obvious PASS (all dims ≥ 0.8) and FAIL (all 0.3) — composite exactly 0.65 (should PASS) and 0.64 (should FAIL with `warn()`) are both untested.
**Fix:** Add settle() unit tests for four rubric scenarios. Add wave-runner boundary tests at composite 0.65 and 0.64.

---

### H-15: `llm-router` core exports never imported in tests
**Layer:** Engine Test Coverage
**File:** `src/engine/llm-router.test.ts`
**Issue:** `chooseModel()` (four reason types: highway/pheromone/seed/budget-fallback) and `markOutcome()` are never imported. Tests only exercise raw `net.mark/warn/select` calls.
**Risk:** Entire model-routing logic is untested. A regression in `chooseModel` reason selection is invisible.
**Fix:** Import and test `chooseModel` with each of the four routing reasons and `markOutcome` for quality=0 (warn) and quality>0.8 (mark+2).

---

## Medium

### M-1: `ask()` creates permanent orphan pheromone edges
**Layer:** Engine Core — `src/engine/world.ts:260-278`
Every `ask()` call leaves one `ask${...}→receiver` strength entry in the pheromone map that is never cleaned up. Under high-ask load, unbounded orphan entries inflate `highways()` and sorted-cache rebuild time.
**Fix:** On reply-unit deletion, delete the corresponding strength/resistance entries for the transient edge.

---

### M-2: `timeout` outcome increments `taskFailures` — false evolution trigger
**Layer:** Engine Core — `src/engine/loop.ts:447`
`warn(edge, 0)` is correct (no-op). However `result.success = false` is set and `taskFailures` increments, potentially triggering false evolution hypotheses on agents that are merely slow.
**Fix:** Branch explicitly: `if (outcome.timeout) { /* neutral */ }`. Do not increment `taskFailures` on timeout.

---

### M-3: `recall()` and `reveal()` fire 4–7 parallel TypeDB queries with no timeout or budget
**Layer:** Engine Core — `src/engine/persist.ts:563-620`, `:467-513`
All queries use `.catch(() => [])` hiding TypeDB saturation. Under hourly L6/L7 ticks, aggregate fan-out can saturate the TypeDB connection pool.
**Fix:** Add a per-call timeout parameter (e.g., 5s) and a global query budget before the `.catch`.

---

### M-4: `durable-ask` isolate recycle and real timeout produce identical payloads
**Layer:** Engine Extended — `src/engine/durable-ask.ts:55-80`
Both the 25-second isolate deadline and a genuine 24-hour timeout resolve `{ timeout: true }`. The caller applies `warn()` in either case, incorrectly penalising healthy human-in-loop paths spanning an isolate restart.
**Fix:** Return `{ timeout: true, soft: true }` for isolate recycles so callers can treat them as neutral.

---

### M-5: `adlFromUnit` uses TypeDB 2.x query syntax — all optional ADL fields always undefined
**Layer:** Engine Extended — `src/engine/adl.ts:319-328`
`select $u has X $var` syntax is not valid in TypeDB 3.x. All optional ADL attributes (perm-network, sunset-at, data-categories) are silently absent from reconstructed AdlDocs.
**Fix:** Replace with TypeDB 3.x-compatible separate queries or a valid projection syntax.

---

### M-6: Auth adapter has 15+ `any` usages — no type safety at the auth persistence boundary
**Layer:** TypeDB Lib — `src/lib/typedb-auth-adapter.ts`
`query()` returns `Promise<any[]>`, all CRUD methods return `any`. The auth layer handling passwords, session tokens, and API keys should have the strongest types in the codebase.
**Fix:** Define `TypeDBAnswer` type and replace all `any` with typed interfaces.

---

### M-7: Auth adapter `findMany` issues N+1 TypeDB queries
**Layer:** TypeDB Lib — `src/lib/typedb-auth-adapter.ts:243-270`
One query for IDs, then one per entity to hydrate attributes. With 50 sessions: 51 round-trips (~5 seconds).
**Fix:** Fetch all attributes in a single query and group by entity ID in application code.

---

### M-8: `escapeTQL`/`esc` implemented independently in 4+ locations
**Layer:** TypeDB Lib (cross-layer) — `src/lib/typedb-auth-adapter.ts:162`, `src/lib/api-auth.ts:219`, `src/lib/kek.ts:43`
Identical TQL-escaping function copy-pasted. A bug fix in one does not propagate.
**Fix:** Export a single `escapeTQL(s: string): string` from `src/lib/typedb.ts` and import everywhere.

---

### M-9: `security.ts` names suggest real crypto but delivers XOR obfuscation
**Layer:** TypeDB Lib — `src/lib/security.ts:1-55`
`secureSetItem`/`secureGetItem` with a hardcoded key. File correctly notes "OBFUSCATION ONLY" but the exported names and filename contradict this.
**Fix:** Rename file to `obfuscation.ts`, rename exports to `obfuscateSetItem`/`obfuscateGetItem`.

---

### M-10: Wave-runner W4 score field and pheromone deposit computed by different formulas
**Layer:** Engine Extended — `src/engine/wave-runner.ts:361`
`verify.score = (fit + form + truth + taste) / 4` (arithmetic average). Pheromone via `markDims` uses weighted formula (fit×0.35, truth×0.30, form×0.20, taste×0.15). Can disagree on pass/fail.
**Fix:** Use `compositeScore()` from `rubric-score.ts` for both the stored score field and the gate comparison.

---

### M-11: `persist.ts` `actor()` swallows TypeDB write failure silently
**Layer:** Engine Core — `src/engine/persist.ts:327`
`.catch(() => {})` discards rejections. If TypeDB is down, `actor()` returns a runtime unit that is not persisted — in-memory world silently diverges from DB.
**Fix:** `.catch((e) => console.warn('[persist] actor insert failed:', e.message))` at minimum.

---

### M-12: Tag fan-out pheromone deposit not tested; revenue skip threshold for evolution untested
**Layer:** Engine Test Coverage
**File:** `src/engine/world.test.ts`, `src/engine/loop.test.ts`
Tag-subscribed fan-out deposits `mark(from→unit)` but no test verifies `net.sense()` after a tagged signal. `REVENUE_SKIP_THRESHOLD=1.0` protecting profitable agents from L5 rewrite has no test.
**Fix:** Add `net.sense()` assertion after tag fan-out. Add evolution guard test with a profitable agent above threshold.

---

## Low / Observations

- **L-1** `src/engine/loop.ts:85-86` — `taskFailures`/`tagFailures` maps never evicted. Add size cap (~500) or reset on hourly harden.
- **L-2** `src/engine/selectors.ts:52,70` — `byPheromone`/`weighted` mutate caller's array via in-place `sort()`. Use `[...items].sort(...)`.
- **L-3** `src/engine/persist.ts:305-316` — `sync()` only inserts new paths. Rename to `ensurePathsExist()` or document.
- **L-4** `src/lib/chains.ts:132` — `interface Transaction` shadows Sui SDK's `Transaction`. Rename to `ChainTransaction`.
- **L-5** `src/lib/security-signals.ts:33` — Security event `hid` uses `Math.random()`. Replace with `crypto.randomUUID()`.
- **L-6** `src/lib/auth.ts:115` — `trustedOrigins` hardcodes only localhost. Add `import.meta.env.PUBLIC_SITE_URL`.
- **L-7** `src/engine/bridges.ts` — Name implies relationship with `bridge.ts` that doesn't exist. Rename to `rpc-units.ts`.
- **L-8** `src/engine/memory-api.test.ts` — `forget()` GDPR erasure listed in comment but has no describe block.
- **L-9** `src/engine/world.test.ts` — Seasonal decay factor (`1 + min(age_hours, 24) / 24`) not tested.

---

## Praise

- **P-1** `src/engine/persist.ts:27-35` — `isToxic` exported as pure standalone with correct cold-start protection. Closure-free, matches CLAUDE.md spec.
- **P-2** `src/engine/world.ts:165-190` — `typeIndex` + `sortedCache` optimisations are closure-local, correctly invalidated, clearly commented.
- **P-3** `src/engine/llm.ts:100-162` — Effect-based LLM call stack: typed errors, exponential backoff only on transient errors, 30s timeout, no `as any` at API boundary.
- **P-4** `src/lib/typedb.ts:109-166` — `decay()` precisely mirrors `world.ts` fade algorithm including ghost-floor, asymmetric resistance, per-path override, and cleanup threshold. Inline comments map each query to its `world.ts` counterpart.
- **P-5** `src/lib/role-check.ts` — Permission matrix: static typed record, matches governance spec, single O(1) lookup, no network calls, no mutation. Model implementation.
- **P-6** `src/lib/tag-classifier.ts` — Pure, <1ms, never throws, guaranteed non-empty fallback, confidence score for LLM escalation. Textbook deterministic sandwich pre-check.
- **P-7** `src/engine/adl-cache.ts` — Audit ring buffer with backpressure detection. Security denials become routing resistance via `setAuditPheromone` without coupling ADL to the pheromone layer.
- **P-8** `src/engine/chairman-chain.ts` — Three-tier CEO routing (pheromone hot path → LLM warm bootstrap → self-leaf cold path). Clean closed-loop implementation.
- **P-9** `src/engine/world.test.ts` — All four `ask()` outcomes tested independently with correct fake-timer usage. Distinguishes all three dissolution causes.
- **P-10** `src/engine/chairman-chain.test.ts` — Eight CEO LLM fallback scenarios including self-loop rejection, null return → dissolve, `llmFallback=false`. Classifier injection avoids fetch mocks.

---

## Clean — No Issues

- `src/engine/rubric-score.ts` — composite score formula, threshold constants, weight documentation correct
- `src/engine/selectors.ts` — weighting logic correct (aside from L-2)
- `src/lib/role-check.ts` — permission matrix complete and structurally correct (P-5)
- `src/engine/adl-cache.ts` — audit buffer implementation (P-7)

---

## Review Coverage

| Layer | Files reviewed | Dimensions | Critical | High | Medium | Low | Praise |
|-------|---------------|-----------|---------|------|--------|-----|--------|
| Engine Core | world.ts, persist.ts, loop.ts, boot.ts, llm.ts, agent-md.ts, tick.ts, substrate.ts, one.ts, core.ts, selectors.ts, index.ts, loops.ts, one-complete.ts, one-prod.ts, work-loop.ts, wal.ts | AR + CQ | 2 | 5 | 5 | 3 | 4 |
| Engine Extended | bridge.ts, bridges.ts, adl.ts, adl-cache.ts, federation.ts, intent.ts, human.ts, chairman.ts, chairman-chain.ts, ceo-classifier.ts, pay.ts, rubric.ts, rubric-score.ts, skill-audit.ts, wave-runner.ts, task-sync.ts, task-parse.ts, task-checkoff.ts, task-extract.ts, brand.ts, brand-signals.ts, chat.ts, chat-helpers.ts, context.ts, agentverse.ts, agentverse-bridge.ts, agentverse-connect.ts, stats.ts, sources.ts, md.ts, durable-ask.ts, specialist-leaf.ts, reusable-tasks.ts, builder.ts, agent.ts, api.ts, bootstrap.ts | BH + AR | 0 | 5 | 9 | 5 | 3 |
| TypeDB Schema + Lib | src/schema/one.tql, world.tql, src/lib/typedb.ts, typedb-auth-adapter.ts, role-check.ts, api-auth.ts, security.ts, security-signals.ts, edge.ts, cf-env.ts, auth.ts, tenancy.ts, chains.ts, logger.ts, kek.ts, sui.ts, sui-verify.ts, durable-settlement.ts, tag-classifier.ts | AR + CQ | 2 | 4 | 6 | 4 | 3 |
| Engine Tests | world.test.ts, persist.test.ts, loop.test.ts, adl.test.ts, wave-runner.test.ts, chairman-chain.test.ts, llm-router.test.ts, intent.test.ts, routing.test.ts, rubric.test.ts, federation.test.ts, human.test.ts, memory-api.test.ts + source files | UT | 3 | 6 | 6 | 3 | 2 |
| **Totals** | **~75 files** | | **7** | **20** | **26** | **15** | **12** |

---

*Generated by system-audit skill — parallel specialist agents (AR, BH, CQ, UT) across 4 layers.*

---

# Round 2 — API Routes, Gateway, Sui Move Contract

Generated: 2026-04-20 (same session, subsequent audit)
Layers: API Routes (3 sub-layers) · Gateway Worker · Sui Move contract + bridge

## Round 2 Executive Summary

The API surface and Move contract contain severe, exploitable vulnerabilities that are independent of the engine-layer findings and require immediate remediation before any production use or Phase 3 escrow activation. **Two dominant systemic issues:** (1) the majority of write API endpoints have zero authentication, and (2) the Sui Move contract has no access control on admin and routing functions — the treasury is drainable by anyone right now. The pattern for correct input handling exists in `signal.ts` (`validateUid` + `escapeTqlString`) but is applied in fewer than 10% of routes. A single remediation pass that applies this pattern consistently and adds `validateApiKey` + role check at the top of every write handler would close the majority of findings below.

---

## Critical — Round 2

### C-8: `/api/query` executes arbitrary TypeQL with no auth
**Layer:** API Routes C
**File:** `src/pages/api/query.ts:1-33`
**Issue:** `POST /api/query` proxies any TypeQL read or write to TypeDB with zero authentication. An anonymous caller can dump all API key hashes, read all hypotheses, or issue destructive deletes and schema changes.
**Risk:** Full data exfiltration and destruction from anywhere on the internet.
**Fix:** Require `validateApiKey` + `admin` permission, or gate behind `import.meta.env.DEV` for dev-only use.

---

### C-9: `/typedb/query` in Gateway proxies arbitrary TypeQL with no auth
**Layer:** Gateway Worker
**File:** `gateway/src/index.ts:444-473`
**Issue:** The Gateway's TypeDB proxy endpoint has no caller authentication — any HTTP client reaching `api.one.ie/typedb/query` can execute arbitrary write transactions. CORS is browser-only and irrelevant to non-browser callers.
**Risk:** Full TypeDB read/write access from the internet. Duplicates API-level risk with a different surface.
**Fix:** Require `X-Broadcast-Secret` or a separate internal key on this route.

---

### C-10: SSRF via `/proxy/sse` — fetches any URL, forwards caller's Authorization header
**Layer:** Gateway Worker
**File:** `gateway/src/sse-proxy.ts:10`, `gateway/src/index.ts:506-519`
**Issue:** `upstream` URL is taken from the query string and fetched without any allowlist or scheme validation. The caller's full `Authorization` header and cookies are forwarded verbatim to the upstream, including to attacker-controlled targets.
**Risk:** Internal metadata endpoint access (`169.254.169.254`), credential exfiltration to attacker-controlled servers.
**Fix:** Validate `upstream` against an approved URL prefix allowlist. Strip sensitive headers before forwarding.

---

### C-11: All three seed endpoints unauthenticated — arbitrary agent injection
**Layer:** API Routes C
**File:** `src/pages/api/seed.ts:11`, `src/pages/api/seed/marketing.ts:46`, `src/pages/api/seed/all-agents.ts:212`
**Issue:** `POST /api/seed`, `/seed/marketing`, `/seed/all-agents` write large batches of units, groups, skills, and paths with no auth. An attacker can seed agents with crafted system-prompts or names.
**Fix:** Require operator+ role on all three.

---

### C-12: Decay and resistance endpoints unauthenticated — pheromone poisoning
**Layer:** API Routes C
**File:** `src/pages/api/decay.ts`, `src/pages/api/decay-cycle.ts`, `src/pages/api/resistance.ts`
**Issue:** `POST /api/decay` accepts arbitrary decay rates with no auth. `POST /api/resistance` increments resistance on any named path with no auth or rate limit. Setting `trailRate: 1.0` zeros all strength. Pushing `resistance > 2 × strength` permanently blocks any path via the toxicity gate.
**Risk:** Complete pheromone graph poisoning from the internet.
**Fix:** Require operator+ auth; clamp rates to `[0, 1]`; rate-limit by caller.

---

### C-13: `faucet-internal.ts` has no auth — testnet-buyer wallet drainable
**Layer:** API Routes A
**File:** `src/pages/api/faucet-internal.ts:18`
**Issue:** `POST /api/faucet-internal` derives the `market:testnet-buyer` keypair and signs a real Sui coin transfer. Zero auth, zero rate limiting. `amount` is caller-controlled with no upper cap other than the balance check.
**Fix:** Require operator+ Bearer token. Cap `amount` to `DEFAULT_AMOUNT`. Add per-IP rate limit.

---

### C-14: `/api/keys` legacy route has no auth — backdoor for API key generation
**Layer:** API Routes A
**File:** `src/pages/api/keys.ts:20-55, 94-134`
**Issue:** `POST /api/keys { action: "generate", user: "anyone" }` creates a live API key with arbitrary permissions. `GET /api/keys?action=list&user=anyone` returns all key IDs for any user. No auth of any kind. This route is separate from the properly-gated `/api/auth/api-keys`.
**Fix:** Add `validateApiKey` + `hasPermission(auth, 'write')` or delete the route if superseded.

---

### C-15: `auth/agent.ts` has no rate limiting — UID squatting at 86,400 UIDs/day
**Layer:** API Routes A
**File:** `src/pages/api/auth/agent.ts:91-235`
**Issue:** `POST /api/auth/agent {}` creates a TypeDB unit + API key for any caller. No rate limit, no proof-of-work. Attackers can pre-register UIDs before legitimate users. Every call issues a fresh API key — returning users accumulate unlimited active keys.
**Fix:** Add IP-based rate limiting. Add UID ownership check before creation. Cap or revoke prior keys on re-auth.

---

### C-16: TQL injection endemic across agent/group/marketplace routes
**Layer:** API Routes B
**File:** `src/pages/api/agents/[id]/status.ts:18`, `agents/[id]/commend.ts:16`, `agents/[id]/flag.ts:16`, `g/[gid]/signal.ts`, `g/[gid]/units.ts`, `g/[gid]/highways.ts`, `g/[gid]/mcp.ts`, `agents.ts:44`, `discover.ts:21-23`, `market/bundle.ts:65`
**Issue:** Dynamic route params (`[id]`, `[gid]`), body fields (`wallet`, `currency`, `name`, `taskFilter`, `fromUnit`, `typeFilter`), and path params (`docname`) are interpolated directly into TypeQL strings without sanitisation. The correct pattern (`str.replace(/[^a-zA-Z0-9_:.-]/g, '')`) exists in `api-auth.ts::getRoleForUser` but is applied in <10% of routes.
**Risk:** TypeQL injection enabling data exfiltration, schema modification, or query corruption across the entire agent management surface.
**Fix:** Apply `const safe = raw.replace(/[^a-zA-Z0-9_:.-]/g, ''); if (safe !== raw) return 400;` to every route param and user-supplied string before TypeDB interpolation. Use `signal.ts::validateUid + escapeTqlString` as the reference.

---

### C-17: `commend`/`flag` open to anonymous callers — pheromone poisoning via UI
**Layer:** API Routes B
**File:** `src/pages/api/agents/[id]/commend.ts:1`, `agents/[id]/flag.ts:1`
**Issue:** Both handlers write directly to TypeDB (modify success-rate, bulk-strengthen or increase resistance on all outgoing paths) with no session check, no API-key check, no role check. The governance spec maps commend/flag to CEO-level actions.
**Fix:** Add `resolveUnitFromSession(request)` at entry; verify `role === 'ceo'` or `operator+`.

---

### C-18: Group signal route verifies receiver membership but not caller membership
**Layer:** API Routes B
**File:** `src/pages/api/g/[gid]/signal.ts:34-51`
**Issue:** The membership check confirms the *receiver* is in `gid`. The *sender* (authenticated caller) is never checked. Any caller knowing a group ID and a valid receiver UID can route signals into that group.
**Fix:** Resolve the caller's identity; verify `(member: $caller, group: $g) isa membership` before forwarding.

---

### C-19: Sui Move — `withdraw_protocol_fees()` and `set_fee_bps()` have no authorization
**Layer:** Sui Move Contract
**File:** `src/move/one/sources/one.move:639-647`
**Issue:** Both are `public fun` on a shared `Protocol` object with no `AdminCap` or sender check. Any on-chain participant can drain the treasury or set `fee_bps = 10000` to route all payments to the protocol then drain it.
**Risk:** One-transaction rug on mainnet. Treasury is drainable right now on testnet.
**Fix:** Add an `AdminCap` transferred to the deployer in `init()` and require it as a parameter on both functions.

---

### C-20: Sui Move — `mark()` and `warn()` are unrestricted public functions
**Layer:** Sui Move Contract
**File:** `src/move/one/sources/one.move:547-568`
**Issue:** Any transaction from any account can call `mark()` to inflate any path's routing weight, or `warn(amount = u64::MAX)` to immediately make any path toxic. No capability required.
**Risk:** Anyone can permanently corrupt the on-chain routing graph.
**Fix:** Require caller-specific capability or check `ctx.sender()` is the owner of source/target Unit.

---

### C-21: Sui Move — `pay()` arithmetic overflows u64 before divide
**Layer:** Sui Move Contract
**File:** `src/move/one/sources/one.move:257`, `:353`, `:483`
**Issue:** `amount * protocol.fee_bps` overflows u64 before `/ 10000`. With `fee_bps` uncapped (C-19), a malicious actor sets `fee_bps = u64::MAX` making any non-zero payment overflow and abort.
**Fix:** Reorder: `amount / 10000 * fee_bps`. Cap `fee_bps <= 10000` in `set_fee_bps`.

---

### C-22: Sui Move — `fade(rate=0)` silently wipes all accumulated path learning
**Layer:** Sui Move Contract
**File:** `src/move/one/sources/one.move:574-577`
**Issue:** `path.strength = path.strength * rate / 100` with `rate=0` zeroes both strength and resistance. `rate > 100` overflows u64. No validation.
**Risk:** Anyone can permanently destroy all pheromone learning on any path with a single transaction.
**Fix:** `assert!(rate > 0 && rate <= 100, EInvalidRate);`

---

## High — Round 2

### H-16: `/api/tick` unauthenticated — anyone triggers all 7 growth loops
**Layer:** API Routes A — `src/pages/api/tick.ts:33-177`
Any unauthenticated caller can run the full L1–L7 tick, including evolution rewrites, hypothesis hardening, and task orchestration. Also bypasses the in-process interval gate (not shared across CF isolates).
**Fix:** Require Bearer token with operator+ role or an `X-Tick-Secret` for cron callers.

---

### H-17: Signal scope enforcement bypassed by omitting Authorization header
**Layer:** API Routes A — `src/pages/api/signal.ts:259-306`
The scope block only fires when `Authorization || Cookie` is present. Omitting both headers bypasses all private/group scope checks entirely.
**Fix:** Make scope enforcement unconditional or document explicitly that `/api/signal` is public-write by design.

---

### H-18: `/api/pay` no auth + caller-controlled `from` field
**Layer:** API Routes A — `src/pages/api/pay.ts:11-78`
No auth. Any caller can impersonate any unit as sender. No upper bound on `amount`. `from`, `to`, `task` interpolated without `validateUid()`.
**Fix:** Require Bearer auth where `auth.user === from`. Add `amount` upper bound. Apply `validateUid()`.

---

### H-19: `/api/harden` no auth — can sign Sui transactions as any agent
**Layer:** API Routes A — `src/pages/api/harden.ts:22-92`
Derives the keypair for any `uid` and broadcasts a Sui transaction to freeze a highway. No auth check.
**Fix:** Require Bearer auth where `auth.user === uid`. Apply `validateUid()` to all three fields.

---

### H-20: `/api/subscribe` no auth — anyone can add routing tags to any unit
**Layer:** API Routes A — `src/pages/api/subscribe.ts:13-32`
`POST /api/subscribe` adds tags that influence routing and capability matching. No auth. `receiver` interpolated without sanitisation.
**Fix:** Require Bearer auth where `auth.user === receiver`. Apply `validateUid()`.

---

### H-21: GDPR forget reads uid from unverified cookie — anyone can delete anyone
**Layer:** API Routes A — `src/pages/api/identity/forget.ts:6-42`
Reads uid from a manually parsed `one-uid` cookie with no session verification. Any caller who sets `Cookie: one-uid=david` can delete David's entire TypeDB record. No audit log written (governance spec requires it).
**Fix:** Verify uid against `resolveUnitFromSession`. Write audit signal before deletion. Require signed confirmation token.

---

### H-22: `auth/agent.ts` status (hire/fire) and agent sync endpoints effectively open
**Layer:** API Routes B — `src/pages/api/agents/[id]/status.ts`, `agents/sync.ts`, `agents/adl.ts`
Status endpoint: any anonymous caller can deactivate any agent by knowing its UID. Sync/ADL: auth check captured in `_auth` but comment says "optional for now" — effectively unauthenticated write to TypeDB.
**Fix:** Add `resolveUnitFromSession`; require operator/ceo role for status. Enforce `validateApiKey` for sync write paths.

---

### H-23: Sui Move — `release_escrow()` has no rubric gate
**Layer:** Sui Move Contract — `src/move/one/sources/one.move:331-379`
The on-chain function only checks worker identity and deadline. The rubric gate promised in the design is absent. In Phase 3, any worker can self-release payment for arbitrarily poor work before the deadline.
**Fix:** Add a `RubricVerdict` capability from an oracle, or enforce off-chain and require proof at release.

---

### H-24: Sui Move — `join_colony()` requires no approval — anyone can join any colony
**Layer:** Sui Move Contract — `src/move/one/sources/one.move:219-221`
Any unit can add itself to any colony with no approval from the colony owner.
**Fix:** Add `ColonyAdminCap` transferred to creator; require it for `join_colony`.

---

### H-25: Sui Move — `dissolve()` has no ownership check — any possessor can destroy a unit
**Layer:** Sui Move Contract — `src/move/one/sources/one.move:613-633`
`dissolve()` consumes a Unit by value with no ownership check. Since Unit has `key, store` it can be transferred; a marketplace sale gives the buyer the power to dissolve the unit and drain its balance.
**Fix:** Store owner address in Unit struct; assert `ctx.sender() == unit.owner`.

---

### H-26: Sui Move — `harden()` can be called unlimited times, creating duplicate Highways
**Layer:** Sui Move Contract — `src/move/one/sources/one.move:583-607`
`harden` takes `path: &Path` (immutable ref) and creates a new frozen Highway on every call without modifying the path.
**Fix:** Change to `path: &mut Path`, add `hardened: bool` field, assert `!path.hardened`.

---

### H-27: Gateway broadcast secret compared with `!==` — timing-attack vulnerable
**Layer:** Gateway Worker — `gateway/src/index.ts:239`
Non-constant-time comparison allows recovering the secret byte-by-byte via response latency.
**Fix:** Replace with `timingSafeEqual` from `node:crypto` (already available via `nodejs_compat`).

---

### H-28: Gateway task mutation routes unauthenticated — anyone can inject WS events to all browsers
**Layer:** Gateway Worker — `gateway/src/index.ts:312, 392`
`PATCH /tasks/:tid` and `POST /tasks/:tid/complete` have no auth. An unauthenticated caller can set any task to any status and inject `task-update`, `mark`, `warn`, `complete`, `unblock` events into every connected browser session.
**Fix:** Require `X-Broadcast-Secret` or an internal header on all mutation routes.

---

### H-29: `bridge.ts::settleEscrow()` fire-and-forget with no retry or status update on failure
**Layer:** Sui Bridge — `src/engine/bridge.ts:452-479`
Failed Sui settlement (network error, deadline race, insufficient gas) leaves Escrow object locked on-chain with no recovery path and no operator alert.
**Fix:** Return a Promise so callers handle failure. Write `escrow-status "settlement-failed"` to TypeDB on failure. Add a reconciliation cron.

---

### H-30: `/api/hypotheses` POST unauthenticated — learning layer poisoning
**Layer:** API Routes C — `src/pages/api/hypotheses.ts:43-64`
Creates hypotheses with any statement and no auth. Hypotheses influence L6 `know()` and L7 frontier detection. No length or content validation.
**Fix:** Require operator+ auth. Cap statement length (e.g. 500 chars).

---

### H-31: Public units export leaks all units including internal system agents
**Layer:** API Routes C — `src/pages/api/export/public/units.ts:27-45`
Despite "public/curated" intent, no scope or tag filter. Returns all units including `entry`, `builder`, `echo` with `balance`, `last-used`, `model` fields.
**Fix:** Add `has tag "public"` constraint or strip sensitive fields.

---

### H-32: Public paths export always returns empty — wrong relation roles
**Layer:** API Routes C — `src/pages/api/export/public/paths.ts:27-28`
Uses `(provider: $from, receiver: $to) isa path` but schema defines `source`/`target` roles. TypeDB returns zero rows silently. Public paths visualisation always renders empty.
**Fix:** Change to `(source: $from, target: $to) isa path`.

---

## Medium — Round 2

### M-13: Gateway connection cap has TOCTOU race
`gateway/src/index.ts:223-232` — Count check and connect are separate DO fetch calls. Two concurrent requests can both read 99 and both connect. Fix: move cap check inside DO's `/connect` handler.

### M-14: Gateway SSE proxy forwards caller's Authorization header to upstream
`gateway/src/sse-proxy.ts:10-14` — Build a clean header set with only safe headers before forwarding.

### M-15: Gateway TypeDB raw error text in 500 responses
`gateway/src/index.ts:297-298` — TypeDB errors can contain schema names and partial data. Return only `{ error: 'Internal error' }`.

### M-16: Gateway JWT decode crashes isolate on malformed token
`gateway/src/index.ts:154` — `JSON.parse(atob(...))` unprotected. Wrap in try/catch; fall back to `Date.now() + 55_000` on malformed token.

### M-17: Gateway token cache stampede on JWT expiry
`gateway/src/index.ts:30-31` — N concurrent requests all call `/v1/signin` simultaneously. Use a promise-based lock.

### M-18: CORS check uses `startsWith` — `one.ie.evil.com` passes
`gateway/src/index.ts:126` — Use `CORS_ORIGINS.includes(origin)` for exact match.

### M-19: Wave claim accepts arbitrary sessionId — impersonation possible
`src/pages/api/waves/[docname]/claim.ts:9` — sessionId taken from request body, stored as TypeDB `owner`. Fix: derive from authenticated source.

### M-20: Wave double-claim protection relies on TypeDB error message text
`src/pages/api/waves/[docname]/claim.ts:14-18` — `error.includes('unique')` is brittle. Fix: add explicit SELECT pre-check.

### M-21: Expire endpoints unauthenticated — force-release any active claim
`src/pages/api/tasks/expire.ts:6`, `waves/expire.ts:13` — Both stale-claim cleanup endpoints require no auth. Additionally `tasks/expire.ts` uses `read()` to execute a delete+insert mutation.

### M-22: Rubric scores not validated in [0, 1] — pheromone inflation via API
`src/pages/api/loop/mark-dims.ts:30-37` — Score of 5.0 deposits 5× pheromone; negative values always trigger warn. Fix: clamp to `[0, 1]`, return 400 on out-of-range.

### M-23: SSRF in brand extract — no scheme or private IP restriction
`src/pages/api/brand/extract.ts:161-172` — Fetches any URL server-side, follows CSS hrefs, no `file://`/`data:` block, no RFC-1918 blocklist.

### M-24: Private signals surface in marketplace listing
`src/pages/api/marketplace.ts:23` — No scope filter. Signals marked `scope: private` appear if `amount > 0`.

### M-25: Private capabilities discoverable in `/api/discover`
`src/pages/api/discover.ts:19-126` — All three query paths join `isa capability` with no scope filter.

### M-26: MCP POST `/api/mcp/[tool]` has no auth gate
`src/pages/api/mcp/[tool].ts:57-60` — Any caller knowing a tool name gets full substrate write access.

### M-27: Revoked API keys remain valid for up to 5 minutes
`src/pages/api/auth/api-keys.ts:111-118` — `invalidateKeyCache(keyId)` never called on revoke. No cross-isolate broadcast.

### M-28: Invite secret falls back to `"dev-secret"` if env unset
`src/pages/api/invites/create.ts:32` — A production deploy missing `INVITE_SECRET` uses a well-known value. Fix: hard-fail `if (!secret) return 503`.

### M-29: `stream.ts` cancel callback is a no-op — ghost polling on disconnect
`src/pages/api/stream.ts:109-112` — Interval and timeout remain active until 5-minute cutoff. Fix: call `cleanup()` inside `cancel()`.

### M-30: Sui Move — `mark()`/`warn()` non-standard key derivation lacks domain separation
`src/lib/sui.ts:65-82` — Raw `seed || uid` concatenation to SHA-256 instead of HKDF. Fix: use Web Crypto HKDF with `info = "one-agent:" + uid`.

### M-31: Sui Move — `create_path()` allows duplicate Path objects
`src/move/one/sources/one.move:527-544` — No uniqueness check. Duplicate paths split pheromone, making routing thresholds harder to reach.

### M-32: Hard-coded developer machine path in production seed endpoint
`src/pages/api/seed/all-agents.ts:216` — `'/Users/toc/Server/envelopes/agents'` — fails silently on every non-dev machine, returning `{ success: true, created: {all zeros} }`. Fix: `path.resolve(process.cwd(), 'agents')`.

### M-33: Absorption cursor not persisted — re-processes all Sui events on Worker restart
`src/engine/bridge.ts:285-330` — Escrow absorb events replayed from beginning on restart. Fix: persist cursor to KV or D1 after each successful call.

---

## Low — Round 2

- **L-11** `gateway/src/index.ts:126` — CORS `startsWith` allows subdomain spoofing (see M-18)
- **L-12** `gateway/src/index.ts:201` — Health endpoint exposes TypeDB database name
- **L-13** `gateway/src/index.ts:283-299` — `/tasks` KV miss returns skills data, not tasks data
- **L-14** `src/pages/api/signals.ts:44-45` — `since` param injected via `JSON.stringify` (not a safe TQL escaper)
- **L-15** `src/pages/api/mark.ts`, `warn.ts` — No null-guard before `.replace()` → TypeError → 500
- **L-16** `src/pages/api/auth/agent.ts:159` — `Math.random().toString(36)` used as keyId (~31 bits entropy)
- **L-17** `src/pages/api/faucet.ts` — Sui address validation accepts any `0x` + ≥38 chars (should be exactly 64 hex)
- **L-18** `one.move:338-340` — 1ms deadline boundary gap; workers submitting just before deadline may lose payment
- **L-19** `one.move:587-597` — `harden()` bakes in misleading confidence value (Laplace `+1` applied post-decision to frozen data)
- **L-20** `one.move:200-202` — `register_task()` aborts on duplicate key; TypeScript caller doesn't guard against re-registration

---

## Praise — Round 2

- **P-11** `src/pages/api/signal.ts:21-34` — `validateUid` + `escapeTqlString` is the correct defence-in-depth pattern. Should be replicated across all routes.
- **P-12** `src/pages/api/invites/accept.ts:22-29` — Timing-safe HMAC comparison correctly implemented.
- **P-13** `src/pages/api/brand/save.ts` — Correct two-tier auth (cookie for user-scope, BetterAuth session + TypeDB membership for group/thing-scope) with consistent `escapeStr`. Model for other write endpoints.
- **P-14** `src/pages/api/skills/[sid]/price.ts:22-23` — Only route in the entire API review that validates a path parameter with an explicit regex before TypeDB interpolation.
- **P-15** `gateway/src/index.ts:46-115` — WsHub hibernation implementation correct and complete (hibernation API, lifecycle callbacks, `try/catch` on all `ws.close()`, single named `"global"` instance).
- **P-16** `gateway/src/index.ts:162-186` — TypeDB JWT 401-retry with cache invalidation is well-designed (bounded at 2 attempts, `cachedToken = null` before retry).
- **P-17** `one.move:295-379` — Escrow linear types correct. Both `release_escrow` and `cancel_escrow` consume Escrow by value and call `object::delete(id)` — double-spend is impossible at the type level.
- **P-18** `src/engine/bridge.ts:56-93` — Bridge fail-closed on TypeDB errors (correct asymmetric security default for real-money path).

---

## Round 2 Review Coverage

| Layer | Files reviewed | Dimensions | Critical | High | Medium | Low | Praise |
|-------|---------------|-----------|---------|------|--------|-----|--------|
| API Routes A (auth/signal/economic) | 23 files | BH + EC | 3 | 7 | 9 | 4 | 3 |
| API Routes B (agents/capabilities/marketplace) | 21 files | EC + AR | 4 | 9 | 7 | 3 | 3 |
| API Routes C (tasks/waves/export/admin) | 41 files | BH + EC | 4 | 8 | 9 | 5 | 3 |
| Gateway Worker | 3 files | AR + BH | 2 | 2 | 6 | 3 | 2 |
| Sui Move Contract + Bridge | 5 files | BH + EC | 4 | 6 | 5 | 4 | 2 |
| **Round 2 totals** | **~93 files** | | **17** | **32** | **36** | **19** | **13** |

---

## Cumulative Coverage (Both Rounds)

| Round | Files | Critical | High | Medium | Low | Praise |
|-------|-------|---------|------|--------|-----|--------|
| Round 1 — Engine + TypeDB | ~75 | 7 | 20 | 26 | 15 | 12 |
| Round 2 — API + Gateway + Sui | ~93 | 17 | 32 | 36 | 19 | 13 |
| **Grand total** | **~168** | **24** | **52** | **62** | **34** | **25** |

---

## Top 10 Fix-Immediately List (both rounds combined)

| # | Finding | File | Why now |
|---|---------|------|---------|
| 1 | C-19: Sui treasury drainable by anyone | `one.move:639` | Real money, one tx on testnet |
| 2 | C-20: Anyone can manipulate any on-chain path | `one.move:547` | Destroys routing integrity |
| 3 | C-9: Gateway TypeDB proxy unauthenticated | `gateway/src/index.ts:444` | Full DB read/write from internet |
| 4 | C-8: `/api/query` unauthenticated arbitrary TypeQL | `query.ts` | Full DB read/write from internet |
| 5 | C-10: SSRF in gateway SSE proxy | `gateway/src/sse-proxy.ts` | Credential exfiltration |
| 6 | C-3: API key scope enforcement non-functional | `world.tql` + `api-auth.ts` | Two schema lines fix it |
| 7 | C-12: Decay/resistance endpoints unauthenticated | `decay.ts`, `resistance.ts` | Pheromone graph poisoning |
| 8 | C-13: `faucet-internal.ts` no auth | `faucet-internal.ts` | Wallet drainable right now |
| 9 | C-16: TQL injection endemic across API routes | multiple | Data exfil + query corruption |
| 10 | C-21/C-22: Sui arithmetic overflow + fade(0) | `one.move:257`, `:574` | Must fix before Phase 3 escrow |

*Generated by system-audit skill — 9 parallel specialist agents across 8 layers, ~168 files.*

---

# Round 3 — Universal Wallet, ZKLogin, Auth Claim

Generated: 2026-04-21
Layers: Universal Wallet vault + signer · Auth plugins (Sui wallet, zkLogin) · Auth claim flow · Human unit · API key lib · New auth API routes · Chairman routes · Integration tests

## Round 3 Executive Summary

The Universal Wallet vault is the strongest new surface in the codebase: AES-256-GCM with per-record HKDF subkeys, PBKDF2 at 600k iterations, constant-time comparison, non-extractable CryptoKey sessions, and a complete IndexedDB-backed audit log. The cryptographic design is sound and the vault test suite is the most thorough in the project, exercising real Web Crypto primitives rather than mocks. The two auth plugins (Sui wallet SIWE, zkLogin) are also well-designed — HMAC-signed nonces with expiry, proper JWKS verification via `jose`, and clean Better Auth integration. The claim flow handshake is correctly gated on dual proof (session cookie + agent bearer). **However, four issues require attention:** the vault session and rate-limit state are module-level singletons (the same C-1 pattern from Round 1, now in browser context); the zkLogin plugin stores the ephemeral secret key in a signed cookie that survives across redirects; the `/api/chairman/roles` and `/api/auth/agent` endpoints remain unauthenticated write surfaces; and the test suite's "vault sentinel" test exercises `VaultError` class construction only — not actual encrypt-then-decrypt sentinel verification. No Critical-severity findings — the worst issues are High.

---

## High — Round 3

### H-33: Vault session and rate-limit state are module-level singletons in vault.ts
**Layer:** Universal Wallet Vault
**File:** `src/components/u/lib/vault/vault.ts:62-65`
**Issue:** `session`, `autoLockTimer`, `failedAttempts`, and `lockoutUntil` are module-level variables. In Next.js or any SSR/edge context where this module is ever imported server-side, these become process-wide singletons — one user's failed attempt increments `failedAttempts` for every other user in the same isolate. In the browser, the same pattern means a React hot-reload or module reload in tests silently resets rate-limit state.
**Risk:** In any server-side import path, brute-force rate limiting is shared across all users. A single failed attempt for User A contributes to User B's lockout. The vault is primarily client-side today, but the risk escalates the moment any SSR route imports vault.ts.
**Fix:** Export a `createVaultStore()` factory returning a closure with instance-local state. Import the singleton from the factory in client code. This mirrors the fix recommended for C-1/C-2.

---

### H-34: zkLogin plugin stores ephemeral private key in signed cookie — key exposed in browser history and server logs
**Layer:** Auth Plugin
**File:** `src/lib/auth-plugins/zklogin.ts:130-131, 148`
**Issue:** The ephemeral Ed25519 secret key (`ephSecretKey = ephKeypair.getSecretKey()`) is included verbatim in the `statePayload` JSON, which is base64-encoded and set as the `one.zk.state` cookie. The cookie is `HttpOnly; Secure; SameSite=Lax` which prevents JavaScript access, but: (1) the secret key value appears in server access logs if request headers are logged; (2) Cloudflare Workers logs the cookie header by default; (3) any server-side middleware or logger that prints request headers exposes the ephemeral private key. If the `nonceSecret` HMAC key leaks, the entire cookie including the private key can be read.
**Risk:** Ephemeral key exposure. An attacker with log access can derive the zkLogin proof for sessions created within the 10-minute ephemeral window. This does not break existing sessions but enables new session creation as the victim.
**Fix:** Store the ephemeral keypair server-side in a KV store keyed by the HMAC-signed nonce (TTL 10 min). Set only the nonce in the cookie, not the secret key. On verify, look up the keypair from KV.

---

### H-35: `api-key.ts::generateApiKey` has modulo bias — character distribution non-uniform
**Layer:** API Key Lib
**File:** `src/lib/api-key.ts:16`
**Issue:** `ALPHABET` has 62 characters. `byte % 62` maps 256 possible byte values to 62 characters non-uniformly: values 0–3 map to characters selected by bytes 0–3, 62–65, 124–127, 192–193 (4 bytes each), while values 4–61 map to characters selected by only 3 bytes, giving a 33% relative bias toward the first 4 characters. With 32 random bytes, the effective entropy is approximately 31.7 bytes rather than 32 — a small but provably non-uniform reduction.
**Risk:** The key is used as a bearer token. Modulo bias slightly reduces the keyspace. For a 32-byte key this is a minor theoretical issue, not exploitable in practice, but the function is named "cryptographically secure" in the docstring.
**Fix:** Use rejection sampling: `if (byte >= 62 * Math.floor(256 / 62)) continue;` Or use `byte % 62` only when `byte < 62 * Math.floor(256/62)` (i.e., byte < 248).

---

### H-36: `claim.ts` new key ID uses `Math.random()` — low entropy keyId
**Layer:** Auth Claim Flow
**File:** `src/pages/api/auth/agent/[uid]/claim.ts:137`
**Issue:** `const newKeyId = \`key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}\`` — the random segment is only 6 base-36 characters from `Math.random()`, giving approximately 31 bits of entropy. A keyId collision is possible at ~50,000 keys (birthday bound at sqrt(2^31)). The keyId is used to look up and revoke keys in TypeDB.
**Risk:** KeyId collision causes one key revocation to silently revoke a different human's key, or fails to revoke the intended key. This is the same pattern previously flagged as L-16 in Round 2 for `auth/agent.ts`.
**Fix:** `const newKeyId = \`key-${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}\`` — matching the pattern already used in `auth/agent.ts:183`.

---

### H-37: `/api/chairman/hire` accepts `customMarkdown` from request body — arbitrary agent injection by any authenticated user
**Layer:** Chairman Routes
**File:** `src/pages/api/chairman/hire.ts:47-55`
**Issue:** Any authenticated user (any valid session, regardless of role) can POST `{ "role": "any", "markdown": "<arbitrary agent markdown>" }` to inject a custom agent with any system prompt, skills, and pricing directly into TypeDB. The `owner` is correctly taken from the session (not the body), but the markdown content is fully caller-controlled. The governance spec requires CEO-level access for hire operations.
**Risk:** Authenticated users can inject agents with malicious system prompts, arbitrary capabilities, or price points into the substrate. An operator-level user can inject a fake "ceo" agent to manipulate routing.
**Fix:** Add a role check: `if (!['chairman', 'ceo', 'operator'].includes(ctx.role ?? '')) return 403`. Additionally, cap system prompt length and sanitize the markdown via the existing `parse()` validator before passing to `syncAgentWithIdentity`.

---

### H-38: `/api/chairman/roles` exposes full system prompts of all role templates with no auth
**Layer:** Chairman Routes
**File:** `src/pages/api/chairman/roles.ts:40-43`
**Issue:** The endpoint returns the full `prompt` field (the complete system prompt) for every role template, to anyone on the internet with zero authentication. For proprietary role templates this leaks the entire prompt engineering investment.
**Risk:** Competitive exposure of proprietary system prompts. This is a business risk rather than a security vulnerability, but the API CLAUDE.md documents it as "No auth — this is a directory listing of public templates" — that decision may need revisiting when commercial roles are added.
**Fix:** Either gate behind authentication, or return only `name`, `group`, `skills`, and `tags` (omitting `prompt`) for unauthenticated callers. Expose `prompt` only to chairman/ceo roles.

---

## Medium — Round 3

### M-34: Vault `unlockWithRecovery` has no rate limiting — brute-force recovery phrases possible
**Layer:** Universal Wallet Vault
**File:** `src/components/u/lib/vault/vault.ts:401-418`
**Issue:** `unlockWithPassword()` calls `checkRateLimit()` and `backoffSleep()` at the top. `unlockWithRecovery()` does not — it calls `assertValidRecoveryPhrase` (validates BIP-39 word format only) then immediately attempts key derivation and sentinel decryption. An attacker with access to the IndexedDB vault file (e.g., via a compromised extension or physical device access) can attempt recovery phrases at the rate of `recoveryToVaultSecret()` calls — PBKDF2 at 600k iterations provides ~0.6s per attempt per core, but the omission of the rate-limit layer means the application adds no additional throttle beyond the PBKDF2 work.
**Fix:** Add `checkRateLimit(); await backoffSleep()` at the top of `unlockWithRecovery`, and `recordFailure()` / `recordSuccess()` around the sentinel check.

---

### M-35: zkLogin HMAC comparison uses `!==` (non-constant-time) — timing oracle on state cookie
**Layer:** Auth Plugin
**File:** `src/lib/auth-plugins/zklogin.ts:182`
**Issue:** `if (expectedStateSig !== stateSig)` — string inequality is not constant-time. An attacker who can make many rapid requests to `/api/auth/zklogin/verify` can measure response latency to recover bytes of the HMAC signature, progressively reconstructing the `nonceSecret` HMAC key. The same pattern exists in the Sui wallet plugin at line 129.
**Risk:** Timing attack on the HMAC key used to sign all nonces and state cookies. Key recovery would allow replay attacks and session forgery.
**Fix:** Use constant-time comparison: `import { timingSafeEqual } from 'node:crypto'` (server-side) or a Web Crypto HMAC `verify` operation, matching the correct pattern already used in `invites/accept.ts` (P-12 from Round 2). This is the same issue class as H-27.

---

### M-36: zkLogin `deriveSalt` produces a BigInt from 16 bytes — salt space truncated to ~2^127
**Layer:** Auth Plugin
**File:** `src/lib/auth-plugins/zklogin.ts:64-73`
**Issue:** `deriveSalt` takes 16 bytes from the HMAC output, interprets them as a big-endian integer, and converts to a decimal string. The leading byte can be 0 (12.5% probability on a fresh user), reducing the salt space from 128 bits to 120 or fewer bits. More importantly, the `jwtToAddress` function from `@mysten/sui/zklogin` uses this salt directly; if Mysten's implementation has a salt size constraint the truncation to 16 bytes and the BigInt conversion may produce a salt shorter than expected.
**Risk:** Minor: salt collision probability increases slightly. The function is deterministic per `sub`, so it is not a per-session randomness issue.
**Fix:** Return the full 32-byte HMAC output as a hex string (`Buffer.from(hmacBytes).toString('hex')`) and let `jwtToAddress` handle it — or verify the exact format Mysten expects.

---

### M-37: `useVault.ts` migration leaves plaintext wallet backup in localStorage
**Layer:** Universal Wallet Hook
**File:** `src/components/u/lib/vault/useVault.ts:445`
**Issue:** After migrating plaintext wallets from `u_wallets`, the hook stores the raw plaintext JSON (including any unencrypted mnemonic) at `localStorage.setItem('u_wallets_backup_unencrypted', raw)`. This backup is never cleared by any subsequent code path, leaving plaintext mnemonics in localStorage indefinitely as a "backup."
**Risk:** Any XSS vulnerability or compromised browser extension can exfiltrate raw mnemonics from localStorage long after migration. The vault's encryption guarantees are bypassed by this backup.
**Fix:** Remove the localStorage backup write at line 445. If a backup is needed, inform the user to use `exportBackup()` with a password, which produces an AES-GCM encrypted blob.

---

### M-38: `auth/agent.ts` re-mint gate defaults to `audit` mode — enforcement is opt-in
**Layer:** Auth Claim Flow
**File:** `src/pages/api/auth/agent.ts:123`
**Issue:** `const remintMode = (import.meta.env.AUTH_AGENT_REMINT_MODE as string | undefined) ?? 'audit'` — the default is `'audit'`, which logs the unauthorized re-mint attempt but does not block it. A returning caller without proof of possession is allowed to re-mint a new API key for any existing UID unless the operator explicitly sets `AUTH_AGENT_REMINT_MODE=enforce` in the environment.
**Risk:** In the default configuration, any caller can generate a new API key for any existing agent UID, bypassing the ownership handshake. This contradicts the stated security model ("returning agents require proof of possession or ownership").
**Fix:** Change the default to `'enforce'`. Provide a migration guide for operators who relied on the open re-mint behavior.

---

### M-39: `human-unit.ts::ensureHumanUnit` swallows unit write failure silently
**Layer:** Human Unit
**File:** `src/lib/human-unit.ts:56`
**Issue:** `.catch(() => { /* best-effort; next request retries */ })` on the `write()` call that creates the unit entity. If TypeDB is unavailable or the schema is wrong (as with C-3/C-4 patterns from Round 1), the unit silently doesn't get created. The function returns void, so callers in `sui-wallet.ts:167` and `zklogin.ts:232` have no way to detect the failure.
**Risk:** A user signs in via Sui wallet or zkLogin, gets a session, but has no TypeDB unit record. Subsequent governance role checks (`getRoleForUser`) return null. The user cannot access group-restricted features. They appear authenticated but are invisible to the substrate.
**Fix:** `.catch((e) => console.warn('[ensureHumanUnit] unit create failed:', e.message))` at minimum. Consider returning `{ created: boolean }` so callers can warn or retry.

---

### M-40: `u-vault-sentinel.test.ts` does not test actual sentinel round-trip — crypto path uncovered
**Layer:** Integration Tests
**File:** `src/__tests__/integration/u-vault-sentinel.test.ts`
**Issue:** The test named "u-vault: sentinel detects wrong password" exclusively tests `VaultError` class construction — `new VaultError('wrong password', 'wrong-password')` and code field assertions. It never imports `vault.ts`, never calls `setup()`, `unlockWithPassword()`, or `verifySentinel()`. The actual sentinel encrypt-then-verify path is untested. A regression in `verifySentinel` (e.g., removing the constant-time compare, returning `true` unconditionally) would pass all "sentinel" tests.
**Risk:** The sentinel is the vault's tamper-detection mechanism — a regression that always returns `true` would mean wrong passwords successfully unlock the vault. This path has zero test coverage despite the test file's name implying it is covered.
**Fix:** Add tests that use `fake-indexeddb` (already imported in the file), call `setup({ password: 'correct' })`, then `unlockWithPassword('wrong')` and assert `VaultError('wrong-password')`, and `unlockWithPassword('correct')` and assert success.

---

### M-41: `auth-claim.test.ts` uses source-file string matching for 40% of its coverage
**Layer:** Integration Tests
**File:** `src/__tests__/integration/auth-claim.test.ts:241-313`
**Issue:** Tests `(f)` through `(i)` and the entire "remint gate source structure" describe block read `agent.ts` as a raw string with `readFileSync` and use `expect(source).toMatch(/pattern/)` to verify behavior. These tests pass regardless of whether the code is correct — they only verify that certain string patterns appear somewhere in the file. For example, test `(g)` passes if the string `AUTH_AGENT_REMINT_MODE` appears anywhere, even in a comment. The `agent.ts` file has CF D1 and Sui imports that cannot be mocked in the vitest Node environment, which is the stated reason for using source scanning. However, source-scan tests provide false confidence.
**Risk:** The gate logic could be subtly wrong (e.g., wrong condition order, missing `&&`) and all source-scan tests would still pass. Rule 3 violation: source-scan "tests" cannot `mark()` — they are noise.
**Fix:** Extract the gate logic into a pure `shouldAllowRemint(returning: boolean, mode: string, authCtx: AuthContext, uid: string): boolean` function in a separate module. This function can be unit-tested independently without CF D1/Sui dependencies.

---

## Low — Round 3

- **L-21** `src/components/u/lib/signer/resolve.ts:23` — `window.__session` is accessed without type-safety guard. If `window.__session` is set by a third-party script with wrong shape, `resolveSigner` returns a zklogin signer for a `wallet` session or vice versa. Add a runtime shape check.
- **L-22** `src/components/u/lib/vault/vault.ts:149-150` — `audit()` fire-and-forget swallows IndexedDB errors silently. Audit failures are non-fatal by design but should at minimum be surfaced as a console.warn so operators can detect IndexedDB quota exhaustion.
- **L-23** `src/components/u/lib/signer/vault-signer.ts:22-24` and `zklogin-signer.ts:23-26` — both `signMessage` and `signTransaction` throw `Error` rather than `VaultError` with a typed code. Callers cannot distinguish "chain not supported" from "vault locked" from "key missing."
- **L-24** `src/pages/api/auth/zklogin/callback.ts:25` — the bounce page calls `/api/auth/zklogin/verify` but the API CLAUDE.md documents the Better Auth plugin endpoint as `/api/auth/zklogin/verify` — verify these resolve to the same handler in the Astro route tree, or the bounce silently 404s.
- **L-25** `src/lib/auth-plugins/zklogin.ts:108-113` — `fetch(SUI_FULLNODE)` during `zkLoginStart` is blocking with no timeout. A Sui fullnode outage will cause `/api/auth/zklogin/start` to hang for the default fetch timeout (~30s). Add `AbortSignal.timeout(3000)`.
- **L-26** `src/lib/api-key.ts:100_000` — PBKDF2 iterations in `api-key.ts` are 100,000, while `vault/crypto.ts` uses 600,000 (OWASP 2024 recommendation). The API key hash is used for the same bearer token authentication as the vault. Align to 600,000.

---

## Praise — Round 3

- **P-19** `src/components/u/lib/vault/crypto.ts` — Cryptographic primitives are textbook correct: AES-256-GCM with 12-byte random IV, HKDF for per-record domain separation, PBKDF2 at 600k iterations (OWASP 2024), all CryptoKeys non-extractable, constant-time comparison implemented correctly using XOR accumulation. The HKDF empty-salt choice is documented inline with RFC 5869 reference.
- **P-20** `src/components/u/lib/vault/vault.ts:97-125` — Rate-limit implementation correctly separates check-from-enforcement (`checkRateLimit` + `backoffSleep` distinct calls) and implements exponential backoff with a hard lockout after 7 failed attempts. Counters reset on success. Better than most production password-auth libraries.
- **P-21** `src/components/u/lib/vault/vault.ts:131-142` — Sentinel verification uses `constantTimeEqual` (from `crypto.ts`) rather than `===`. This prevents timing attacks on the master-key verification step.
- **P-22** `src/lib/auth-plugins/sui-wallet.ts:150-160` — Sui wallet signature verification uses `verifyPersonalMessageSignature` from `@mysten/sui/verify` with an explicit address comparison on the recovered key (`verified.toSuiAddress().toLowerCase() !== address`). This prevents key-substitution attacks where a valid signature from a different key is submitted.
- **P-23** `src/lib/auth-plugins/zklogin.ts:200-213` — JWT verification uses `jose`'s `jwtVerify` with explicit `issuer` and `audience` checks, and distinguishes `JWTExpired` from `JWTClaimValidationFailed` for user-facing error messages. Correct JWKS fetch from Google's canonical endpoint.
- **P-24** `src/pages/api/auth/agent/[uid]/claim.ts:63` — Dual-proof claim gate correctly requires both (1) a BetterAuth session cookie for human identity, and (2) a bearer token that resolves to `user === uid` (agent identity). Neither alone is sufficient. Idempotency is correctly checked before destructive operations.
- **P-25** `src/__tests__/integration/u-vault-non-extractable.test.ts`, `u-vault-recovery-roundtrip.test.ts`, `u-vault-hkdf-unique.test.ts` — These three tests exercise real Web Crypto APIs with `fake-indexeddb`. `u-vault-non-extractable` verifies `extractable: false` at the API level. `u-vault-recovery-roundtrip` calls actual PBKDF2 and checks 32-byte output and determinism. `u-vault-hkdf-unique` verifies HKDF domain strings contain wallet ID and version. This is real cryptographic coverage, not mocked stubs.

---

## Round 3 Review Coverage

| Layer | Files reviewed | Dimensions | Critical | High | Medium | Low | Praise |
|-------|---------------|-----------|---------|------|--------|-----|--------|
| Universal Wallet Vault | vault.ts, crypto.ts, storage.ts, types.ts, useVault.ts, passkey.ts, recovery.ts, migration.ts, index.ts | AR + CQ | 0 | 1 | 3 | 2 | 4 |
| Signer Abstraction | resolve.ts, vault-signer.ts, dapp-kit-signer.ts, snap-signer.ts, zklogin-signer.ts, types.ts, index.ts | AR + CQ | 0 | 0 | 0 | 2 | 0 |
| Auth Plugins | sui-wallet.ts, zklogin.ts | AR + BH | 0 | 1 | 2 | 1 | 3 |
| Auth Claim Flow | auth/agent.ts, auth/agent/[uid]/claim.ts | AR + BH | 0 | 2 | 2 | 0 | 1 |
| Human Unit + API Key | human-unit.ts, api-key.ts | AR + CQ | 0 | 1 | 1 | 1 | 0 |
| New Auth API Routes | auth/me.ts, auth/wallet/nonce.ts, auth/wallet/verify.ts, auth/zklogin/callback.ts | AR | 0 | 0 | 0 | 1 | 0 |
| Chairman Routes | chairman/roles.ts, chairman/hire.ts, chairman/build-team.ts, components/chairman/RoleCatalog.tsx | AR + BH | 0 | 2 | 0 | 0 | 0 |
| Integration Tests | auth-claim.test.ts, u-vault-sentinel.test.ts, u-vault-no-plaintext.test.ts, u-vault-hkdf-unique.test.ts, u-vault-non-extractable.test.ts, u-vault-recovery-roundtrip.test.ts | UT | 0 | 0 | 2 | 0 | 1 |
| **Round 3 totals** | **~30 files** | | **0** | **6** | **10** | **7** | **9** |

---

## Cumulative Coverage (All Rounds)

| Round | Files | Critical | High | Medium | Low | Praise |
|-------|-------|---------|------|--------|-----|--------|
| Round 1 — Engine + TypeDB | ~75 | 7 | 20 | 26 | 15 | 12 |
| Round 2 — API + Gateway + Sui | ~93 | 17 | 32 | 36 | 19 | 13 |
| Round 3 — Wallet, ZKLogin, Auth Claim | ~30 | 0 | 6 | 10 | 7 | 9 |
| **Grand total** | **~198** | **24** | **58** | **72** | **41** | **34** |

---

*Generated by system-audit skill — single agent pass across 9 new surfaces, ~30 files.*
