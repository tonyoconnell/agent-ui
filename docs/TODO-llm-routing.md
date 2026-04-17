---
title: TODO LLM Routing — Wire STAN + Content Matching + Cache into NanoClaw
type: roadmap
version: 3.0.0
priority: Wire → Prove → Grow
total_tasks: 40
completed: 0
status: WIRE
---

# TODO: LLM Routing — Deterministic Inference on Every LLM Call

> **Goal:** Every claw LLM call flows through the deterministic sandwich: pattern
> match → intent cache → toxic check → tag classify → content recall → model
> select → context inject → LLM call → rubric mark → response cache → intent
> learn. Cost falls 60-73%. Quality rises. No config.
>
> **Source of truth:** [deterministic-inference.md](deterministic-inference.md) — CTO-level overview,
> [llm-routing.md](llm-routing.md) — mechanism + wiring plan,
> [routing.md](routing.md) — the deterministic sandwich,
> [DSL.md](DSL.md) — signal language,
> [dictionary.md](dictionary.md) — canonical names,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste)
>
> **Shape:** 4 cycles. Wire the engine that exists. Prove it saves money.
> Grow to content matching. Sustain with self-measuring patterns.
>
> **Schema:** Tasks map to `world.tql` dimension 3b.

## Routing

```
    signal DOWN                           result UP
    ──────────                            ─────────
    message arrives                       mark/warn on tag→model
         │                                     ▲
         ▼                                     │
    ┌──────────┐                               │
    │ PATTERN  │  regex registry ──── reply?    │
    │ INTENT   │  keyword/TypeDB ─── cached?   │
    │ TOXIC    │  isToxic ────────── dissolve?  │
    └────┬─────┘  $0 per call above            │
         │                                     │
         ▼                                     │
    ┌──────────┐                               │
    │ TAG      │  classify() ─────── tags      │
    │ RECALL   │  TypeDB contains ── context   │
    │ MODEL    │  chooseModel() ──── STAN      │
    │ CONTEXT  │  inferDocs() ────── reference  │
    └────┬─────┘                               │
         │                                     │
         ▼                                     │
    ┌──────────┐                               │
    │ LLM CALL │  the ONE probabilistic step   │
    └────┬─────┘                               │
         │                                     │
         ▼                                     │
    ┌──────────┐                               │
    │ RUBRIC   │  quality 0..1 ────── mark amt │
    │ CACHE    │  D1 write ────────── store    │
    │ INTENT   │  seed/expand ─────── learn ───┘
    └──────────┘
```

---

## Cycle 1: WIRE — STAN Model Selection

**Goal:** Replace `resolveLLM()` with `chooseModel()`. Every claw call picks
the cheapest good model per tag. Budget gate filters. Highway bypass skips
STAN when paths are proven.

**Files:**
- `nanoclaw/src/workers/router.ts` — replace resolveLLM with chooseModel
- `nanoclaw/src/lib/substrate.ts` — add pheromone read for tag→model edges
- `src/engine/llm-router.ts` — already built, import into nanoclaw

### W1 — Recon (Haiku x 3)

| id | target | what to find | tags | effort |
|----|--------|-------------|------|--------|
| C1-R1 | `nanoclaw/src/workers/router.ts` lines 530, 653, 815, 1058 | All 4 LLM call sites: /message non-stream, /message stream, /webhook, queue consumer | routing, llm | low |
| C1-R2 | `src/engine/llm-router.ts` exports | What can nanoclaw import? chooseModel, seedModels, markOutcome, openAiCaller, route | routing, llm | low |
| C1-R3 | `nanoclaw/src/lib/substrate.ts` pheromone | Can substrate.ts read tag→model edges from TypeDB/KV? What's the latency? | routing, substrate | low |

### W2 — Decide (Opus)

| id | decision | tags | effort |
|----|----------|------|--------|
| C1-D1 | How to import llm-router into nanoclaw (bundled or shared) | routing, build | medium |
| C1-D2 | Model list per persona vs global. Where does MODELS[] live? | routing, config | medium |
| C1-D3 | Where pheromone state lives (in-memory per isolate, seeded from D1 claw_paths) | routing, state | medium |

### W3 — Edit (Sonnet x 4)

| id | file | what to change | tags | effort |
|----|------|---------------|------|--------|
| C1-E1 | `nanoclaw/src/workers/router.ts` | Import chooseModel, seedModels, markOutcome. Add boot-time seed. | routing, wire | medium |
| C1-E2 | `nanoclaw/src/workers/router.ts` | Replace all 4 resolveLLM() calls with chooseModel() + resolveLLM(choice.model.id) | routing, wire | medium |
| C1-E3 | `nanoclaw/src/workers/router.ts` | Add markOutcome() after each LLM response (4 sites) | routing, mark | medium |
| C1-E4 | `nanoclaw/src/lib/substrate.ts` | Add readTagModelEdges() — read from D1 claw_paths for tag→model pheromone | routing, substrate | low |

### W4 — Verify (Sonnet x 2)

| id | check | exit condition | tags | effort |
|----|-------|---------------|------|--------|
| C1-V1 | Model selection varies by tag | Send greeting (→ cheap model) vs code question (→ better model). choice.reason differs. | routing, test | medium |
| C1-V2 | Budget gate works | Set maxCostPerCall=$0.001, verify expensive models filtered | routing, test | low |

---

## Cycle 2: PROVE — Response Cache + Cost Tracking

**Goal:** Cache high-quality responses in D1. Track cost per conversation.
Prove savings numerically.

**Files:**
- `nanoclaw/src/workers/router.ts` — add cache check pre-LLM, cache store post-LLM
- D1 migrations — `response_cache` and `call_log` tables

### W1 — Recon (Haiku x 2)

| id | target | what to find | tags | effort |
|----|--------|-------------|------|--------|
| C2-R1 | `nanoclaw/` D1 schema | Existing tables. Where to add response_cache, call_log. Migration file pattern. | cache, schema | low |
| C2-R2 | `src/engine/intent.ts` | Full intent cache API. What needs to be available for nanoclaw? D1 tables needed. | cache, intent | low |

### W2 — Decide (Opus)

| id | decision | tags | effort |
|----|----------|------|--------|
| C2-D1 | Cache key: hash(normalized_prompt + tags) vs hash(prompt only). Tag-scoped or global? | cache, design | medium |
| C2-D2 | TTL strategy: quality-gated (>0.8 → 24h, >0.5 → 1h) vs flat TTL. Invalidation by pheromone? | cache, design | medium |

### W3 — Edit (Sonnet x 3)

| id | file | what to change | tags | effort |
|----|------|---------------|------|--------|
| C2-E1 | `migrations/` | CREATE TABLE response_cache (hash, tags, model, response, quality, created_at, expires). CREATE TABLE call_log (id, group_id, model, tags, tokens_est, cost_est, quality, reason, latency_ms, ts). | cache, schema | low |
| C2-E2 | `nanoclaw/src/workers/router.ts` | PRE: check response_cache before LLM call. POST: store response if quality > 0.5. | cache, wire | medium |
| C2-E3 | `nanoclaw/src/workers/router.ts` | Log every LLM call to call_log with model, tags, cost estimate, quality, reason. | cost, wire | low |

### W4 — Verify (Sonnet x 2)

| id | check | exit condition | tags | effort |
|----|-------|---------------|------|--------|
| C2-V1 | Cache hit works | Same question twice → second one returns cached, no LLM call. Mark(2) on cache path. | cache, test | medium |
| C2-V2 | Cost tracking | call_log populated after each call. Can query: avg cost per tag, per group. | cost, test | low |

---

## Cycle 3: GROW — Intent Cache + Content Recall

**Goal:** Wire intent cache into nanoclaw. Add TypeDB content recall
before LLM calls. Inject known facts into prompts.

**Files:**
- `nanoclaw/src/workers/router.ts` — add intent resolution pre-LLM
- `nanoclaw/src/lib/substrate.ts` — add contentRecall()
- `nanoclaw/src/lib/prompt.ts` — extend with content block

### W1 — Recon (Haiku x 3)

| id | target | what to find | tags | effort |
|----|--------|-------------|------|--------|
| C3-R1 | `src/engine/intent.ts` | Full API: resolveIntent, seedIntents, loadIntents, unknownQueries. D1 tables: intents, intent_queries. | intent, api | low |
| C3-R2 | `nanoclaw/src/lib/substrate.ts` recallHypotheses | Current recall: searches hypotheses by actor uid. Need: search by topic/content keyword. | recall, substrate | low |
| C3-R3 | `src/engine/context.ts` inferDocsFromTags | How does tag→doc mapping work? Can nanoclaw call it? | context, docs | low |

### W2 — Decide (Opus)

| id | decision | tags | effort |
|----|----------|------|--------|
| C3-D1 | Intent seeding: per-persona intents from persona config vs universal intents from D1. Auto-learn from unknownQueries()? | intent, design | medium |
| C3-D2 | Content recall scope: search hypotheses by topic keyword? Search signal data? Both? Latency budget (~100ms). | recall, design | medium |

### W3 — Edit (Sonnet x 4)

| id | file | what to change | tags | effort |
|----|------|---------------|------|--------|
| C3-E1 | D1 migrations | CREATE TABLE intents, intent_queries, intent_responses (if not exist). Seed from persona config. | intent, schema | low |
| C3-E2 | `nanoclaw/src/workers/router.ts` | Add resolveIntent() before LLM call. If intent + cached response → return, skip LLM. | intent, wire | medium |
| C3-E3 | `nanoclaw/src/lib/substrate.ts` | Add contentRecall(env, text, actorUid) → {hypotheses, priorSuccess}. Query TypeDB by topic keywords. | recall, wire | medium |
| C3-E4 | `nanoclaw/src/lib/prompt.ts` | Extend systemPromptWithPack() to inject content recall results + doc context from inferDocsFromTags(). | context, wire | medium |

### W4 — Verify (Sonnet x 2)

| id | check | exit condition | tags | effort |
|----|-------|---------------|------|--------|
| C3-V1 | Intent resolution works | Known intent ("hello") → cached response, no LLM. Unknown intent → falls through to LLM. | intent, test | medium |
| C3-V2 | Content recall enriches prompt | Topic with known hypothesis → injected in prompt. Response references injected knowledge. | recall, test | medium |

---

## Cycle 4: SUSTAIN — Pattern Registry + Self-Measurement

**Goal:** Per-claw configurable regex patterns in D1. Patterns self-measure
via valence detection. Cost dashboard via call_log aggregates.

**Files:**
- `nanoclaw/src/workers/router.ts` — add pattern matching pre-LLM
- D1 migrations — `claw_patterns` table
- `nanoclaw/src/units/outcome.ts` — extend to score pattern quality

### W1 — Recon (Haiku x 2)

| id | target | what to find | tags | effort |
|----|--------|-------------|------|--------|
| C4-R1 | `nanoclaw/src/lib/classify-fallback.ts` | Current 20 hardcoded patterns. How to migrate to D1 without breaking existing classify(). | pattern, classify | low |
| C4-R2 | `nanoclaw/src/units/outcome.ts` | Current valence detection. How to extend: if last reply was pattern-generated, score the pattern quality. | pattern, valence | low |

### W2 — Decide (Opus)

| id | decision | tags | effort |
|----|----------|------|--------|
| C4-D1 | Pattern registry design: D1 table + API + auto-deactivate. Interaction with classify-fallback (replace or layer on top). | pattern, design | medium |

### W3 — Edit (Sonnet x 3)

| id | file | what to change | tags | effort |
|----|------|---------------|------|--------|
| C4-E1 | D1 migrations | CREATE TABLE claw_patterns (id, pattern, action, value, priority, hit_count, quality, active, created_at). | pattern, schema | low |
| C4-E2 | `nanoclaw/src/workers/router.ts` | Load patterns from D1, match before LLM call. Actions: reply/tag/route/block. Bump hit_count. | pattern, wire | medium |
| C4-E3 | `nanoclaw/src/units/outcome.ts` | If last reply was pattern-generated, compute valence → update pattern quality score. Auto-deactivate quality < 0.3. | pattern, measure | medium |

### W4 — Verify (Sonnet x 2)

| id | check | exit condition | tags | effort |
|----|-------|---------------|------|--------|
| C4-V1 | Pattern match works | "hi" → canned reply, no LLM. Profanity → blocked. Grammar keyword → tag injected. | pattern, test | medium |
| C4-V2 | Self-measurement works | Positive valence after pattern reply → quality goes up. Correction → quality goes down. Low quality → deactivated. | pattern, measure | medium |

---

## Task List (36 tasks)

### CYCLE 1: WIRE — STAN Model Selection

- [ ] **C1-R1** Recon: all 4 LLM call sites in router.ts `routing, llm` [low]
- [ ] **C1-R2** Recon: llm-router.ts exports for nanoclaw `routing, llm` [low]
- [ ] **C1-R3** Recon: substrate.ts pheromone read for tag→model `routing, substrate` [low]
- [ ] **C1-D1** Decide: import strategy (bundle vs shared) `routing, build` [medium]
- [ ] **C1-D2** Decide: model list per persona vs global `routing, config` [medium]
- [ ] **C1-D3** Decide: pheromone state location (in-memory, D1, KV) `routing, state` [medium]
- [ ] **C1-E1** Edit: import + boot-time seed in router.ts `routing, wire` [medium]
- [ ] **C1-E2** Edit: replace 4x resolveLLM with chooseModel `routing, wire` [medium]
- [ ] **C1-E3** Edit: add markOutcome after each LLM response `routing, mark` [medium]
- [ ] **C1-E4** Edit: readTagModelEdges in substrate.ts `routing, substrate` [low]
- [ ] **C1-V1** Verify: model selection varies by tag `routing, test` [medium]
- [ ] **C1-V2** Verify: budget gate filters expensive models `routing, test` [low]

### CYCLE 2: PROVE — Response Cache + Cost Tracking

- [ ] **C2-R1** Recon: D1 schema, migration pattern `cache, schema` [low]
- [ ] **C2-R2** Recon: intent.ts full API surface `cache, intent` [low]
- [ ] **C2-D1** Decide: cache key strategy `cache, design` [medium]
- [ ] **C2-D2** Decide: TTL + invalidation strategy `cache, design` [medium]
- [ ] **C2-E1** Edit: D1 migration — response_cache + call_log `cache, schema` [low]
- [ ] **C2-E2** Edit: cache check pre-LLM, cache store post-LLM `cache, wire` [medium]
- [ ] **C2-E3** Edit: call_log per LLM call `cost, wire` [low]
- [ ] **C2-V1** Verify: cache hit returns stored response `cache, test` [medium]
- [ ] **C2-V2** Verify: call_log aggregates per tag/group `cost, test` [low]

### CYCLE 3: GROW — Intent Cache + Content Recall

- [ ] **C3-R1** Recon: intent.ts API + D1 tables `intent, api` [low]
- [ ] **C3-R2** Recon: recallHypotheses content search `recall, substrate` [low]
- [ ] **C3-R3** Recon: inferDocsFromTags for nanoclaw `context, docs` [low]
- [ ] **C3-D1** Decide: intent seeding strategy `intent, design` [medium]
- [ ] **C3-D2** Decide: content recall scope `recall, design` [medium]
- [ ] **C3-E1** Edit: D1 migration — intents + intent_queries `intent, schema` [low]
- [ ] **C3-E2** Edit: resolveIntent before LLM call `intent, wire` [medium]
- [ ] **C3-E3** Edit: contentRecall in substrate.ts `recall, wire` [medium]
- [ ] **C3-E4** Edit: extend prompt.ts with recall + doc context `context, wire` [medium]
- [ ] **C3-V1** Verify: intent resolution → cached response `intent, test` [medium]
- [ ] **C3-V2** Verify: content recall enriches prompt `recall, test` [medium]

### CYCLE 4: SUSTAIN — Pattern Registry + Self-Measurement

- [ ] **C4-R1** Recon: classify-fallback.ts migration path `pattern, classify` [low]
- [ ] **C4-R2** Recon: outcome.ts pattern quality scoring `pattern, valence` [low]
- [ ] **C4-D1** Decide: pattern registry design `pattern, design` [medium]
- [ ] **C4-E1** Edit: D1 migration — claw_patterns `pattern, schema` [low]
- [ ] **C4-E2** Edit: pattern match in router.ts `pattern, wire` [medium]
- [ ] **C4-E3** Edit: pattern quality scoring in outcome.ts `pattern, measure` [medium]
- [ ] **C4-V1** Verify: pattern match → reply/block/tag/route `pattern, test` [medium]
- [ ] **C4-V2** Verify: self-measurement via valence `pattern, measure` [medium]

---

## Measurable Outcomes (per cycle)

| Cycle | Metric | Target | How to measure |
|-------|--------|--------|---------------|
| C1 | choice.reason distribution | Highway > 40% by week 2 | `SELECT reason, COUNT(*) FROM call_log GROUP BY reason` |
| C1 | Cost per message | 40-60% reduction vs baseline | `SELECT AVG(cost_est) FROM call_log WHERE ts > week_ago` |
| C2 | Cache hit rate | 30% by week 2, 50% by week 4 | `SELECT COUNT(reason='cache') / COUNT(*) FROM call_log` |
| C2 | Total LLM spend | Track week-over-week decline | `SELECT SUM(cost_est) FROM call_log GROUP BY week` |
| C3 | Intent resolution rate | 60%+ without LLM for bounded domains | `SELECT resolver, COUNT(*) FROM intent_queries GROUP BY resolver` |
| C3 | Truth rubric improvement | Higher truth scores with content recall | Compare quality scores with/without recall |
| C4 | Pattern hit rate | 15-25% of messages for school deployments | `SELECT COUNT(*) FROM call_log WHERE reason='pattern'` |
| C4 | Pattern quality scores | Mean > 0.6, auto-deactivate < 0.3 | `SELECT AVG(quality) FROM claw_patterns WHERE active=1` |

---

## Shared Work (Don't Duplicate)

| Work item | This TODO | Also in | Rule |
|-----------|-----------|---------|------|
| STAN model selection | C1 (chooseModel) | knowledge-growth T3.4 (gradient) | C1 wires tag→model routing. T3.4 adds confidence→model taper inside it. Wire C1 first. |
| Response cache | C2 (D1 cache) | emergence-tasks T3.6 (batch writes) | C2 caches responses. emergence batches TypeDB writes. Both use D1. Independent — can run in parallel. |
| Intent cache | C3 (resolveIntent) | — | Unique to this TODO. intent.ts already exists, just needs wiring. |
| Pattern registry | C4 (claw_patterns) | knowledge-growth T2.1 (hypothesis reflexes) | C4 is content patterns. T2.1 is hypothesis→routing reflexes. Different layers. C4 catches content, T2.1 catches learned patterns. Both deposit pheromone. |

## See Also

- [deterministic-inference.md](deterministic-inference.md) — CTO-level: what we have, gaps, roadmap
- [llm-routing.md](llm-routing.md) — mechanism: STAN, tags, pheromone, rubrics, wiring plan
- [routing.md](routing.md) — the deterministic sandwich formula
- [TODO-claw.md](TODO-claw.md) — Cycles 1-3 (routing, dual-path, browsing) — this TODO is Cycle 4+
- [TODO-knowledge-growth.md](TODO-knowledge-growth.md) — vertical: stats, reflexes, adaptive sensitivity, gradient highways
- [TODO-emergence-tasks.md](TODO-emergence-tasks.md) — horizontal: signal volume, federation, deeper chains
- [rubrics.md](rubrics.md) — quality scoring: fit/form/truth/taste
- [DSL.md](DSL.md) — signal language
- [dictionary.md](dictionary.md) — canonical names
