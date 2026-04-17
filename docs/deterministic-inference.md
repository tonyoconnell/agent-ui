# Deterministic Inference in ONE

**Audience:** CTO / technical leadership
**Last verified:** 2026-04-17 (all code references checked against live codebase)

---

## Executive Summary

ONE uses TypeDB as a **deterministic inference engine** — not just a database. While every other multi-agent framework treats the LLM as the decision-maker for routing, safety, and capability matching (making the entire system probabilistic), ONE isolates the LLM to a single step: generating natural-language responses. Everything else — routing, classification, safety, evolution triggers, hypothesis promotion, economic settlement — is computed deterministically from accumulated path data.

The result: a system where routing correctness is provable, safety checks are guaranteed, and learning converges mathematically. The LLM bootstraps the group; the group replaces the LLM.

---

## What We Have Now

### The Deterministic Sandwich

Every LLM call is wrapped in deterministic pre/post checks. This is the core architectural pattern, implemented in `src/engine/persist.ts` as the **PEP (Persistent Execution Protocol)**:

```
PRE-1:  isToxic(edge)?           → dissolve, no LLM call     [O(1) in-memory]
PRE-2:  nonce replay?            → dissolve, no LLM call     [O(1) in-memory]
PRE-3:  capability exists?       → TypeDB lookup              [~100ms, cached]
PRE-3.5: ADL lifecycle gate      → retired/deprecated?        [5-min cache]
PRE-4:  schema validation        → input matches JSON Schema  [cached]

        LLM CALL                 → the ONE probabilistic step

POST:   result?    → mark(edge, chainDepth)     strength accumulates
POST:   timeout?   → neutral                    no pheromone change
POST:   dissolved? → warn(edge, 0.5)            mild resistance
POST:   failure?   → warn(edge, 1)              full resistance
```

**What this means in practice:** A toxic path is blocked in <0.001ms with zero LLM cost. A missing capability dissolves in ~100ms. The LLM is only invoked when all deterministic checks pass. After the LLM responds, the outcome is classified into exactly one of four types — there is no ambiguity about what happened.

### TypeDB Classification Functions

`src/schema/world.tql` defines 14 functions that compute derived properties from raw numeric data. These are not stored labels — they are **inferred at query time**, meaning they always reflect current state:

**Path Status** — Every path between two agents is automatically classified:

```tql
fun path_status($e: path) -> string:
    match $e has strength $s, has resistance $a, has traversals $t;
    return first
        if ($a > $s and $a >= 10.0) then "toxic"
        else if ($s >= 50.0) then "highway"
        else if ($s >= 10.0 and $s < 50.0 and $t < 10) then "fresh"
        else if ($s > 0.0 and $s < 5.0) then "fading"
        else "active";
```

A path with `strength=3, resistance=15` is always "toxic". A path with `strength=55` is always "highway". No human labels these. No LLM classifies these. The math does.

**Unit Classification** — Agents are classified by their track record:

```tql
fun unit_classification($u: unit) -> string:
    match $u has success-rate $sr, has activity-score $as, has sample-count $sc;
    return first
        if ($sr >= 0.75 and $as >= 70.0 and $sc >= 50) then "proven"
        else if ($sr < 0.40 and $as >= 25.0 and $sc >= 30) then "at-risk"
        else "active";
```

**Pre-flight Validation** — Combined checks before any signal:

```tql
fun preflight($from: unit, $to: unit, $sk: skill) -> boolean:
    match (provider: $to, offered: $sk) isa capability;
          (source: $from, target: $to) isa path, has strength $s, has resistance $a;
    return first if ($a > $s and $a >= 10.0) then false else true;
```

This joins two relations (capability + path) and derives a boolean. It answers: "Can unit B do this skill, and is the path from A to B safe?" — in one deterministic query.

**Full function inventory** (all in `world.tql`):

| Function | Returns | What it computes |
|----------|---------|-----------------|
| `path_status` | string | Highway / active / fresh / fading / toxic |
| `is_highway` | boolean | Strength >= 50 |
| `can_receive` | boolean | Unit has capability for skill |
| `is_safe` | boolean | Path not toxic |
| `within_budget` | boolean | Payment covers skill price |
| `unit_exists` | boolean | UID exists in TypeDB |
| `is_trustworthy` | boolean | Success rate >= 50% or insufficient samples |
| `preflight` | boolean | Combined capability + safety check |
| `unit_classification` | string | Proven / active / at-risk |
| `needs_evolution` | boolean | Success < 50%, samples >= 20 |
| `is_action_ready` | boolean | Hypothesis confirmed + p-value <= 0.05 + observations >= 50 |
| `optimal_route` | unit | Strongest path with matching capability |
| `cheapest_provider` | unit | Lowest-price provider for a skill |
| `suggest_route` | {uid, strength}[] | Top 5 routes by path strength |

### Routing: Deterministic Selection with Probabilistic Fallback

The growth tick (`src/engine/loop.ts`) uses a two-tier routing strategy:

1. **Deterministic first** (`follow`): If proven paths exist from the current position, take the strongest one. No randomness.
2. **Probabilistic fallback** (`select`): If no proven path exists, use weighted random selection across all available paths. The *candidate set* is deterministic (TypeDB computes it); only the final pick is stochastic.
3. **Highway bypass**: When net strength (strength - resistance) exceeds threshold (20), skip the LLM entirely — the path is proven enough to route without inference.

```typescript
// From loop.ts — the tick routing decision
let next = previousTarget ? net.follow() : null  // deterministic
if (!next) next = net.select()                     // probabilistic fallback

if (netStrength >= HIGHWAY_THRESHOLD) {
  // Highway: skip LLM, direct route — path is proven
  net.mark(edge, Math.min(chainDepth, CHAIN_CAP))
}
```

This means the system **gradually becomes more deterministic** as paths accumulate pheromone. Early on, routing is exploratory. Over time, proven highways emerge and the LLM is bypassed entirely for those routes.

### Seven Loops, All Deterministic (Except the LLM Step)

| Loop | Interval | Deterministic Operation | LLM Involved? |
|------|----------|------------------------|----------------|
| L1 Signal | per message | Route signal, classify outcome (4 types) | Yes (content generation) |
| L2 Trail | per outcome | mark/warn — arithmetic on strength/resistance | No |
| L3 Fade | 5 min | Asymmetric decay: strength × 0.95, resistance × 0.90 | No |
| L4 Economic | per payment | Revenue on paths, escrow settlement | No |
| L5 Evolution | 10 min | Query struggling units, rewrite prompts | Yes (prompt rewrite) |
| L6 Knowledge | 1 hour | Promote highways to hypotheses, lifecycle transitions | No |
| L7 Frontier | 1 hour | Set difference: world tags - actor tags | No |

Five of seven loops are fully deterministic. L1 and L5 use the LLM, but even those wrap it in deterministic pre/post checks.

### Hypothesis Lifecycle (Statistical Inference)

Hypotheses move through a lifecycle governed by deterministic thresholds:

```
pending → testing → confirmed (observations >= 50, p-value <= 0.05)
                  → rejected  (observations >= 50, p-value > 0.20)
```

From `loop.ts`:

```typescript
const testingHypos = await readParsed(`
  match $h isa hypothesis, has hid $hid, has hypothesis-status "testing",
        has observations-count $n, has p-value $p;
  select $hid, $n, $p;
`)
// Deterministic promotion: meets statistical threshold
if (row.n >= 50 && row.p <= 0.05) → confirmed
if (row.n >= 50 && row.p > 0.20)  → rejected
```

No LLM decides whether a hypothesis is valid. The system accumulates observations, computes a p-value, and promotes or rejects based on fixed thresholds. This is the scientific method encoded as infrastructure.

### Asymmetric Decay (Deterministic Forgiveness)

```typescript
// persist.ts — fade()
strength  *= 0.95   // 5% decay per cycle
resistance *= 0.90  // 10% decay per cycle (forgives 2x faster)
```

Bad paths are forgiven faster than good paths are forgotten. A 5% ghost floor prevents paths from vanishing entirely, so a once-proven route can be rediscovered. This is pure arithmetic — no judgment calls, no LLM involvement.

### Contradiction Detection

When a previously confirmed path degrades, the system detects the contradiction and acts:

```typescript
// loop.ts — E8: contradiction → warn() cascade
const degradingPaths = net.highways(50)
  .filter(h => h.strength >= 10 && h.strength < 20)
if (degradingPaths.has(pathName)) net.warn(pathName, 0.5)
```

A path that was strong enough to be a highway but has decayed below 20 gets additional resistance applied. The system self-corrects without human intervention.

### Frontier Detection (Set Algebra)

```typescript
// persist.ts — frontier()
worldTags  = { all tags on all skills in TypeDB }
actorTags  = { tags on skills this actor has paths to }
frontier   = worldTags - actorTags
```

Pure set difference. If the world has 30 skill tags and an agent has touched 18, its frontier is the remaining 12. This drives exploration — the system knows what it doesn't know.

### Task-to-Agent Matching (Tag Intersection)

TypeDB functions match tasks to capable agents via tag overlap:

```tql
fun best_unit_for_task($t: task) -> unit:
    match $t has tag $tag;
          $u isa unit, has tag $tag, has status "active";
          (source: $any, target: $u) isa path, has strength $s;
    sort $s desc; limit 1;
    return $u;
```

This is a three-way join: task tags intersected with unit tags, weighted by incoming path strength. The best agent for a task is deterministic given the current graph state.

---

## Benefits

### 1. Cost Control
Toxic paths and missing capabilities are caught before the LLM is invoked. In a system processing thousands of signals, this prevents unbounded LLM spend on doomed requests. The highway bypass goes further — proven routes skip the LLM entirely, reducing per-signal cost to near zero for established workflows.

### 2. Predictability
Given the same graph state and the same signal, the routing decision is always the same (for `follow` mode). This makes the system debuggable. You can replay a signal through the graph and get the same outcome. Try that with an LLM-based router.

### 3. Compounding Learning
Every signal deposits pheromone. Every pheromone deposit changes future routing. This is a positive feedback loop: good paths get stronger, bad paths accumulate resistance, and the system converges on optimal routing without any explicit training step. The learning is a side effect of operation.

### 4. Security as a Side Effect
Toxicity detection, nonce dedup, capability checks, lifecycle gates, and schema validation are all deterministic gates. Security isn't a separate concern — it's the same graph algebra that handles routing. A path that keeps tripping security gates accumulates resistance and is eventually blocked by the same mechanism that handles poor performance.

### 5. Auditability
Every routing decision can be traced to numeric thresholds. "Why was this signal blocked?" → "Because resistance (15) > strength (3) × 2 and resistance >= 10." "Why did this agent evolve?" → "Because success-rate (0.38) < 0.50 and sample-count (25) >= 20." No black-box explanations.

### 6. Graceful Degradation
When TypeDB is down, the in-memory strength/resistance maps continue routing. The `writeHealth` metric tracks how many TypeDB writes succeed per tick. Below 0.5, the tick warns its own edge (`tick→typedb`); above 0.9, it marks it. The system monitors its own infrastructure health using the same pheromone mechanism.

---

## Gaps

### 1. In-Memory / TypeDB Divergence
The runtime keeps strength and resistance in-memory (`globalThis`) and writes to TypeDB asynchronously (`writeSilent`). If TypeDB writes fail silently (and they do — the `writeHealth` metric exists for this reason), the in-memory state drifts from the persisted state. After a process restart, `load()` hydrates from TypeDB, which may be stale.

**Risk:** A path classified as "highway" in-memory might not be a highway in TypeDB. After restart, the path reverts to its TypeDB state, potentially routing differently.

### 2. TypeDB Functions Are Defined but Not All Called from Runtime
The schema defines 14 classification functions, but the runtime only uses a subset directly. Functions like `preflight()`, `within_budget()`, `is_trustworthy()`, and `unit_classification()` are defined in `world.tql` but the runtime reimplements their logic in TypeScript (e.g., `isToxic()` in persist.ts). The TypeDB functions exist as the source of truth but aren't the code path that runs.

**Risk:** Logic drift between the TypeQL function definitions and their TypeScript reimplementations.

### 3. Budget and Rate-Limit Gates Are Stubs
PEP-4 (budget check) and PEP-5 (rate limit) are declared in persist.ts but commented as "pass-through, enforced in future cycle." The `within_budget()` TypeDB function exists but isn't wired. Every signal currently passes these gates regardless of cost.

**Risk:** No economic protection against a single agent consuming disproportionate LLM resources.

### 4. Hypothesis p-value Is Not Statistically Rigorous
The p-value field on hypotheses is set manually at insertion time (e.g., `0.5` for a new hypothesis, `0.01` for a confirmed path). It's a heuristic confidence score, not a computed statistical significance. The lifecycle transitions check `p-value <= 0.05` as if it were a real statistical test, but the value was assigned, not calculated.

**Risk:** The "statistical" promotion thresholds create a false sense of rigour. A hypothesis with `observations-count=50` and `p-value=0.5` will be rejected, but the p-value was never actually computed from the observations.

### 5. No Aggregate Path Queries at Scale
Individual path lookups are fast, but the system doesn't yet do graph-wide aggregate inference. Questions like "what's the average success rate across all paths in group X?" or "which subgraph has the highest concentration of toxic paths?" require full scans that aren't currently optimized.

### 6. Evolution Feedback Loop Is Open
When L5 rewrites an agent's prompt, the old prompt is saved as a hypothesis for rollback. But the rollback itself (EV-1) only triggers when `observations-count >= 20` on the evolution hypothesis — and the observation count isn't automatically incremented by the agent's subsequent performance. The evolution loop generates new prompts but doesn't rigorously A/B test them against the old ones.

### 7. Temporal Queries Are Under-Utilized
Hypotheses support bi-temporal fields (`valid-from`, `valid-until`, `observed-at`), and `recall()` supports temporal filtering. But most hypothesis insertions omit the temporal fields, and no loop currently queries "what did we know at time T?" The temporal machinery exists in schema but isn't exercised by the runtime.

---

## Content-Level Inference (The Missing Layer)

### The Problem

The deterministic sandwich checks paths, capabilities, and lifecycle — but it doesn't look at **what the user actually said**. A greeting, a repeated FAQ, and a novel creative request all take the same path: straight to the LLM. The content of the signal is invisible to routing.

### What Already Exists (Disconnected)

We have four content-matching systems. None of them feed into routing or model selection:

**1. Regex Classifier** — `nanoclaw/src/lib/classify-fallback.ts`

20 regex patterns, zero LLM calls, <0.01ms:

```typescript
const TOPIC_PATTERNS: [RegExp, string][] = [
  [/\b(code|function|class|import|export|error|bug|fix|debug)\b/i, 'code'],
  [/\b(learn|teach|lesson|curriculum|student|tutor)\b/i, 'education'],
  [/^(hi|hello|hey|good morning)\b/i, 'greeting'],
  [/\?/, 'question'],
  // ... 20 patterns total
]
```

Currently: classifies incoming text → tags for memory/pheromone.
Not used for: model selection, cache lookup, context injection, or short-circuiting the LLM.

**2. Intent Cache** — `src/engine/intent.ts`

Three-tier resolver that maps typed text to canonical intents:

```
Tier 1: Keyword match    0ms    $0.000   ~80% of typed queries
Tier 2: TypeDB registry  <5ms   $0.000   known patterns
Tier 3: LLM normaliser   50ms   $0.0001  everything else
```

Maps "how do I return this?" and "return policy" and "refund" to the same canonical intent `refund-policy`. One LLM call generates the answer; every subsequent variant hits the cache.

**Currently: not wired into NanoClaw at all.** The entire intent system sits unused by the edge agents.

**3. Valence Detector** — `nanoclaw/src/units/outcome.ts`

Regex-based correction/positive pattern matching on the user's NEXT message to score the bot's PREVIOUS reply:

```typescript
const CORRECTION_PATTERNS = [
  /\b(no|not|wrong|incorrect|actually|that's not)\b/i,
]
const POSITIVE_PATTERNS = [
  /\b(thanks|perfect|exactly|great|yes)\b/i,
]
```

Currently: deposits mark/warn on actor→tag paths (pheromone feedback).
Not used for: adjusting the current response, selecting a different model for retry, or injecting "the user corrected us last time" context.

**4. TypeDB Content Queries** — `$s contains` / `$d contains`

TypeDB supports string containment matching on stored attributes:

```tql
-- Find hypotheses mentioning a topic
match $h isa hypothesis, has statement $s; $s contains "grammar";

-- Find signals with specific content patterns
match $sig isa signal, has data $d; $d contains "block";

-- Engineering skin: cycle time from signal content
match $sig isa signal, has data $d; $d contains $task_id; $d contains "complete";
```

Currently: used in `recall()`, `reveal()`, and `recallHypotheses()` for memory retrieval.
Not used for: pre-LLM content analysis, pattern-based routing, or deterministic answers.

### What Content Matching Should Do

Add a **content analysis layer** to the sandwich, between path checks and the LLM call:

```
PRE-1:  isToxic?              → dissolve                    [O(1)]
PRE-2:  nonce replay?         → dissolve                    [O(1)]
PRE-3:  capability?           → dissolve                    [~100ms]
PRE-3.5: ADL lifecycle?       → dissolve                    [cached]

NEW ──► CONTENT MATCH                                        [<5ms]
        ├─ regex classify     → tags for routing             [0ms]
        ├─ intent resolve     → canonical intent?            [0-5ms]
        │   └─ cache hit?     → return cached response       [$0]
        ├─ TypeDB recall      → prior signals match?         [~100ms]
        │   └─ hypothesis?    → inject as context            [free]
        ├─ valence check      → "user corrected last turn"   [0ms]
        │   └─ correction?    → inject correction context    [free]
        └─ pattern triggers   → regex → deterministic reply  [0ms]
            └─ "hi"           → canned greeting, no LLM      [$0]

        LLM CALL              → enriched with content analysis
POST:   mark/warn             → pheromone on tag→model edge
```

The content layer serves three purposes:

1. **Short-circuit**: Greetings, FAQs, and repeated questions get deterministic answers. No LLM call. $0 cost.
2. **Enrich**: TypeDB hypotheses, correction context, and matching docs are injected into the prompt. The LLM gets better input, produces better output, fewer retries.
3. **Route**: Tags from regex + intent from resolver → model selection via STAN. "Grammar question" routes to cheap model. "Creative writing" routes to expensive model.

### TypeDB Signal Queries for Content Matching

TypeDB's `contains` operator enables content-level queries that no graph database can do:

```tql
-- "Has anyone asked about this topic before? What happened?"
fun prior_signals($topic: string) -> { signal, success }:
    match $sig isa signal, has data $d, has success $ok;
          $d contains $topic;
    sort $ok desc; limit 10;
    return { $sig, $ok };

-- "What do we know about this subject?"
fun knowledge_about($topic: string) -> { hypothesis }:
    match $h isa hypothesis, has statement $s, has hypothesis-status $st;
          $s contains $topic;
          { $st = "confirmed"; } or { $st = "testing"; };
    return { $h };

-- "Which agents have successfully handled this kind of question?"
fun proven_for_content($topic: string) -> { unit, strength }:
    match $sig isa signal, has data $d, has success true;
          $d contains $topic;
          (receiver: $u) isa $sig;
          $u has uid $uid;
          (source: $any, target: $u) isa path, has strength $s;
    sort $s desc; limit 5;
    return { $u, $s };
```

These compose with the existing routing functions. `optimal_route()` finds the best unit by path strength; `proven_for_content()` finds the best unit by past success with similar content. Both are deterministic given the same data.

### Regex Pattern Registry (Deterministic Responses)

For patterns that should NEVER hit the LLM:

```typescript
// D1 table: claw_patterns
// Extends the existing classify-fallback.ts from hardcoded → per-claw configurable

interface Pattern {
  id: string
  pattern: string          // regex string
  action: 'reply' | 'tag' | 'route' | 'block'
  value: string            // reply text, tag name, route target, or block reason
  priority: number         // higher = matched first
  hit_count: number        // auto-incremented on match
  quality: number          // rubric score from manual review
}

// "hi" → canned greeting
{ pattern: '^(hi|hello|hey)\\b', action: 'reply', value: 'Hello! How can I help today?' }

// profanity → block
{ pattern: '\\b(fuck|shit)\\b', action: 'block', value: 'content-policy' }

// grammar intent → tag + cheap model
{ pattern: '\\b(present tense|past tense|conjugat)', action: 'tag', value: 'grammar' }
```

The pattern registry is queryable, editable, and measurable. Each pattern tracks hit count and quality score. Over time you see which patterns fire most and whether their responses satisfy users (via valence detection on the next message).

---

## The Biggest Gap: LLM Model Routing

### What Exists

`src/engine/llm-router.ts` implements a full **STAN (Stochastic Tag-Aware Navigation)** algorithm:

- **Tag-scoped pheromone**: Each `tag→model` edge accumulates strength/resistance independently. "creative→sonnet" can be a highway while "extract→sonnet" is not.
- **Budget gate**: Filter out models where `estimatedTokens × costPerMToken > maxCostPerCall` before routing.
- **Highway bypass**: When `tag→model` net strength ≥ 20, return that model immediately — no probabilistic selection needed.
- **Rubric-sized marking**: Quality >0.8 marks 2× (highway reinforcement), >0.5 marks 1×, >0.2 marks 0.5×, low quality warns. Per-dimension edges (`edge:fit`, `edge:truth`) track *why* a model is good or bad.
- **Cold start**: `seedModels()` plants 0.1 prior on every tag→model edge so STAN has something to walk on.

All of this is tested (6 acts in `llm-router.test.ts`), including numerical proof of 60-90% cost savings over 200 signals.

### What Doesn't Use It

**NanoClaw** — the edge worker that actually makes LLM calls for every deployed claw — doesn't call any of this. Its `resolveLLM()` function is a 20-line prefix check:

```typescript
// nanoclaw/src/workers/router.ts line 39
function resolveLLM(model: string, env: Env) {
  if (model.startsWith('groq/') && env.GROQ_API_KEY) {
    return { url: 'https://api.groq.com/...', modelId: model.slice(5) }
  }
  return { url: 'https://openrouter.ai/...', modelId: model }
}
```

Every message — "hi", "explain quantum entanglement", "write a business plan" — hits the same model at the same price. The tags are already classified by `ingest()`. The pheromone infrastructure exists in `nanoclaw/src/lib/substrate.ts` (mark, warn, isToxic). The wiring is missing.

### What This Costs

For a deployment like Debby (Elevare school, ~50 students):

| Pattern | Without STAN | With STAN | Saving |
|---------|-------------|-----------|--------|
| "hi" / greetings | Llama 4 ($0.15/M) | Cache hit or Gemma ($0.02/M) | 87-100% |
| Grammar questions | Llama 4 ($0.15/M) | Haiku ($1.0/M) or Gemma, rubric picks | Quality UP |
| Creative writing | Llama 4 ($0.15/M) | Sonnet ($3.0/M), justified by rubric | Quality UP |
| Repeated questions | Full LLM call each | D1 cache hit | 100% |
| **Monthly estimate** | **~$30** | **~$8** | **~73%** |

At 100 claws / 1000 users: $3,000/month → $800/month. The router is a profit centre.

See [llm-routing.md](llm-routing.md) for the full wiring plan (5 steps) and cache architecture.

---

## Cache Architecture (Not Yet Built)

Three layers, each saves at a different point:

```
Layer 1: RESPONSE CACHE (D1)                        saves: 100% LLM cost on hit
  key:   hash(normalized_prompt + tags)
  value: full LLM response + quality score
  TTL:   quality > 0.8 → 24h, quality > 0.5 → 1h
  scope: per-claw D1
  invalidation: time-based + pheromone-based (resistance > strength → purge)

Layer 2: CONTEXT CACHE (KV)                          saves: TypeDB + D1 reads
  key:   context:${groupId}, tags:${groupId}
  value: GroupContext (model, prompt, sensitivity), last-known tags
  TTL:   5 minutes
  status: context cache EXISTS, tag cache NOT BUILT

Layer 3: ROUTING CACHE (in-memory)                   saves: TypeDB read per route
  key:   net.strength[tag→model], net.resistance[tag→model]
  value: pheromone weights
  TTL:   per-isolate (~30s on CF Workers)
  sync:  write-through to D1 claw_paths (EXISTS)
  bootstrap: seedModels() at boot
```

Cache hit rate projection for a school deployment (50 students, bounded question space):

| Week | Hit Rate | Why |
|------|----------|-----|
| 1 | ~10% | Cold start, diverse first questions |
| 2 | ~30% | Common greetings/FAQs cached, early highways |
| 4 | ~50% | Grammar rule highways dominant |
| 8 | ~65% | Long-tail covered, only novel questions miss |

---

## What We Should Build Next

### Improvement 1: Wire Intent Cache into NanoClaw

**What:** Connect `src/engine/intent.ts` to `nanoclaw/src/workers/router.ts`. Before calling the LLM, resolve the user's message to a canonical intent. If found, return the cached response.

**Where:** Before the LLM call in both `/message` (line 530) and `/webhook` (line 815) paths.

**Wire:**
```typescript
import { resolveIntent, bumpHitCount } from '@/engine/intent'

// Before LLM call — intent resolution is deterministic tier 1+2, $0
const intent = await resolveIntent(text, {
  db: env.DB,
  intents: persona.intents,  // seed from persona config
})

if (intent && intent.confidence >= 0.85) {
  // Cache hit: return stored response, mark highway, skip LLM
  const cached = await env.DB.prepare(
    'SELECT response FROM intent_responses WHERE intent = ?'
  ).bind(intent.intent).first()

  if (cached) {
    bumpHitCount(env.DB, intent.intent)
    mark(env, `intent:${intent.intent}`, groupUid, 2)
    return c.json({ ok: true, response: cached.response, resolver: intent.resolver })
  }
}

// No intent match → fall through to LLM (but pass intent.tags to chooseModel)
```

**What it does:** "What is the present tense of ir?" → keyword match → `grammar-conjugation` intent → cached response. 50 students asking the same grammar question → 1 LLM call, 49 cache hits. The `unknownQueries()` function already exists to surface unrecognised queries for manual intent creation.

**Measurable result:** Track `resolver` distribution: `keyword` / `typedb` / `llm` / `unknown`. Target: 60%+ of queries resolved without LLM by week 4 for bounded-domain deployments.

### Improvement 2: Wire STAN Model Routing into NanoClaw

**What:** Replace `resolveLLM()` with `chooseModel()` in `nanoclaw/src/workers/router.ts`.

**Where:** Lines 530-531 (web path) and 815-816 (webhook path).

**Before:**
```typescript
const llm = resolveLLM(context.model, c.env)
```

**After:**
```typescript
const choice = chooseModel(net, MODELS, {
  prompt: text,
  tags: ingestResult.tags,
  estimatedTokens: 300,
  maxCostPerCall: 0.003,
  sensitivity: context.sensitivity,
})
const llm = resolveLLM(choice.model.id, c.env)
```

**Closes the loop:** After response, feed quality back:
```typescript
markOutcome(net, choice, { response: reply, quality: confidence, latencyMs })
```

**Measurable result:** Cost per message drops as highways form. Track `choice.reason` distribution — when "highway" dominates, the system is optimized.

### Improvement 3: Response Cache in D1

**What:** Hash-keyed response cache that eliminates LLM calls for repeated questions.

**Schema:**
```sql
CREATE TABLE response_cache (
  hash TEXT PRIMARY KEY,
  tags TEXT,
  model TEXT,
  response TEXT,
  quality REAL,
  created_at INTEGER,
  expires INTEGER
);
```

**PRE check (before LLM call):**
```typescript
const hash = fnv1a(text.toLowerCase().trim() + tags.sort().join(','))
const cached = await env.DB.prepare(
  'SELECT response, quality FROM response_cache WHERE hash = ? AND expires > ?'
).bind(hash, Date.now()).first()
if (cached) {
  mark(env, `cache→${groupUid}`, 2)  // cache hit = strong mark
  return cached.response
}
```

**POST store (after LLM call):**
```typescript
const ttl = quality > 0.8 ? 86_400_000 : quality > 0.5 ? 3_600_000 : 0
if (ttl > 0) {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO response_cache (hash, tags, model, response, quality, created_at, expires) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(hash, tags.join(','), model, reply, quality, Date.now(), Date.now() + ttl).run()
}
```

**Measurable result:** Cache hit rate per claw. Target: 50%+ by week 4 for bounded-domain deployments.

### Improvement 4: Tag-Based Context Injection

**What:** Load reference docs matching the conversation's tags into the system prompt.

**Where:** `nanoclaw/src/lib/prompt.ts` — extend `systemPromptWithPack()`.

NanoClaw already classifies tags via `ingest()`. The engine already has `inferDocsFromTags()` in `src/engine/context.ts`. The connection is missing.

```typescript
// After recall() returns the pack
const contextDocs = inferDocsFromTags(tags)  // ['grammar-rules', 'vocab-a2']
if (contextDocs.length > 0) {
  const docBlock = `\n--- Reference ---\n${loadContext(contextDocs).slice(0, 2000)}`
  enhancedSystemPrompt += docBlock
}
```

**Measurable result:** Response quality (rubric truth dimension) improves when relevant docs are injected. Track `truth` scores with/without context injection.

### Improvement 5: Per-Conversation Cost Tracking

**What:** Record model, tokens, cost on every LLM call. Surface in `/highways` and admin dashboard.

**Schema:**
```sql
CREATE TABLE call_log (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  model TEXT,
  tags TEXT,
  tokens_est INTEGER,
  cost_est REAL,
  quality REAL,
  reason TEXT,      -- 'highway' | 'pheromone' | 'seed' | 'cache'
  latency_ms INTEGER,
  ts INTEGER
);
```

**Measurable result:** Cost per conversation, cost per tag, cost trend over time. Show that highways reduce cost week-over-week.

### Improvement 6: Push Classifications to KV

**What:** The sync worker already writes `paths.json`, `units.json` to KV every minute. Add `classifications.json` — pre-computed `path_status()` and `unit_classification()` for every entity.

**Where:** `workers/sync/index.ts` — add one more key.

```typescript
const classRows = await readParsed(`
  match $e isa path, has strength $s, has resistance $r, has traversals $t;
  $e (source: $from, target: $to); $from has uid $fid; $to has uid $tid;
  select $fid, $tid, $s, $r, $t;
`)
const classifications = classRows.map(r => ({
  from: r.fid, to: r.tid,
  status: classifyPath(r.s, r.r, r.t),  // reuse path_status logic
  strength: r.s, resistance: r.r,
}))
```

NanoClaw reads from KV for toxicity checks (`isToxic()`). This extends the same pattern to full classification — edge workers know which paths are highways, which are fading, which are fresh, without querying TypeDB.

**Measurable result:** Eliminate TypeDB reads from nanoclaw hot path. Routing decisions from KV: <10ms vs TypeDB: ~100-300ms.

### Improvement 7: Content-Aware TypeDB Pre-Query

**What:** Before the LLM call, query TypeDB for prior signals and hypotheses matching the current message content. Inject matches into the prompt.

**Where:** New function in `nanoclaw/src/lib/substrate.ts`, called from the router before the LLM call.

```typescript
export async function contentRecall(
  env: Env,
  text: string,
  actorUid: string,
): Promise<{ hypotheses: string[]; priorSuccess: boolean | null }> {
  // Extract key terms (reuse classify keywords as search terms)
  const terms = text.toLowerCase().split(/\W+/).filter(w => w.length > 3).slice(0, 3)
  if (terms.length === 0) return { hypotheses: [], priorSuccess: null }

  const searchTerm = terms[0]
  const [hypos, priors] = await Promise.all([
    // What do we know about this topic?
    query(env, `
      match $h isa hypothesis, has statement $s, has hypothesis-status $st, has p-value $p;
      $s contains "${searchTerm}"; { $st = "confirmed"; } or { $st = "testing"; };
      sort $p asc; limit 5; select $s, $p;
    `),
    // Has anyone asked about this before? What happened?
    query(env, `
      match $sig isa signal, has data $d, has success $ok;
      $d contains "${searchTerm}";
      sort $ok desc; limit 3; select $d, $ok;
    `),
  ])

  return {
    hypotheses: hypos.map((r: any) => r.s as string),
    priorSuccess: priors.length > 0 ? (priors[0] as any).ok as boolean : null,
  }
}
```

**Use in prompt:**
```typescript
const contentMemory = await contentRecall(env, text, uid)
if (contentMemory.hypotheses.length > 0) {
  enhancedSystemPrompt += `\n--- Known facts about this topic ---\n`
  for (const h of contentMemory.hypotheses) {
    enhancedSystemPrompt += `- ${h}\n`
  }
}
if (contentMemory.priorSuccess === false) {
  enhancedSystemPrompt += `\nNote: previous attempts at this topic had issues. Be extra careful.\n`
}
```

**Measurable result:** Track rubric `truth` scores with/without content recall. Hypothesis injection should reduce hallucination on topics the substrate has seen before.

### Improvement 8: Configurable Pattern Registry (D1)

**What:** Move the hardcoded regex patterns from `classify-fallback.ts` into a D1 table. Make patterns per-claw, editable via API, and self-measuring.

**Schema:**
```sql
CREATE TABLE claw_patterns (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,         -- regex string
  action TEXT NOT NULL,          -- 'reply' | 'tag' | 'route' | 'block'
  value TEXT NOT NULL,           -- reply text, tag name, model id, or block reason
  priority INTEGER DEFAULT 0,   -- higher = matched first
  hit_count INTEGER DEFAULT 0,  -- auto-incremented
  quality REAL DEFAULT 0.5,     -- rubric score (updated by valence detection)
  active INTEGER DEFAULT 1,
  created_at INTEGER
);
```

**Runtime:**
```typescript
// Load patterns from D1 (cached per-isolate, refreshed on KV invalidate)
const patterns = await loadPatterns(env)

for (const p of patterns.sort((a, b) => b.priority - a.priority)) {
  if (new RegExp(p.pattern, 'i').test(text)) {
    bumpHitCount(env.DB, p.id)

    if (p.action === 'reply') {
      mark(env, `pattern:${p.id}`, groupUid, 1)
      return c.json({ ok: true, response: p.value, matched: p.id })
    }
    if (p.action === 'block') {
      warn(env, 'entry', groupUid, 1)
      return c.json({ ok: false, dissolved: true, reason: p.value })
    }
    if (p.action === 'tag') {
      tags.push(p.value)  // feed into chooseModel()
    }
    if (p.action === 'route') {
      // Force a specific model for this pattern
      overrideModel = p.value
    }
  }
}
```

**Self-measuring:** After the user responds to a pattern-generated reply, `outcome.ts` detects valence. Positive → `quality` goes up. Correction → `quality` goes down. Patterns with quality < 0.3 get auto-deactivated. The pattern registry learns from usage.

**API:**
```bash
# Add a pattern
POST /patterns { "pattern": "^(hi|hello)\\b", "action": "reply", "value": "Hello!" }

# List patterns with stats
GET /patterns → [{ id, pattern, action, hit_count, quality }]

# Deactivate underperforming patterns
POST /patterns/:id/deactivate
```

**Measurable result:** Track pattern hit rate (% of messages matched before LLM). Target: 15-25% of messages handled by patterns alone for school deployments. Track quality scores — patterns that consistently get positive valence are proven; patterns that get corrections need revision.

### Improvement 9: Close the Write Gap

**What:** Replace `writeSilent` with `writeTracked` for mark/warn in persist.ts.

**Why:** `writeSilent` is fire-and-forget — if TypeDB rejects the write, pheromone exists in-memory but not in the brain. After restart, the system forgets what it learned. The `writeHealth` metric already detects this, but doesn't prevent it.

**Where:** `src/engine/persist.ts` lines 150-155 (mark) and 176-180 (warn).

```typescript
// Before
writeSilent(`match ... insert $e has strength ($s + ${strength}) ...`)

// After
const ok = await writeTracked(`match ... insert $e has strength ($s + ${strength}) ...`)
if (!ok) result.writes!.markFailed++
```

**Measurable result:** `writeHealth` ratio approaches 1.0. After restart, `load()` hydrates a graph that matches what the runtime learned.

---

## Summary: The Compounding Machine

```
Signal arrives ("What is the present tense of ir?")
  |
  +-- PATTERN MATCH -- regex registry ---- "reply" action? return, $0         [<0.01ms]
  |
  +-- INTENT RESOLVE -- keyword/TypeDB --- canonical intent? cached response  [0-5ms]
  |
  +-- TOXIC? -- isToxic(edge) ----------- dissolve, $0                        [<0.001ms]
  |
  +-- TAG CLASSIFY -- ingest() + regex --- 'grammar', 'conjugation'           [<0.01ms]
  |
  +-- CONTENT RECALL -- TypeDB contains -- prior hypotheses about topic?      [~100ms]
  |     inject: "Known: ir -> voy/vas/va/vamos/vais/van"
  |
  +-- MODEL SELECT -- chooseModel(tags) -- grammar->gemma (highway, $0.02/M)  [<0.01ms]
  |
  +-- CONTEXT INJECT -- inferDocs(tags) -- load grammar-rules.md reference    [<5ms]
  |
  +-- LLM CALL -------------------------- the ONE probabilistic step          [200-2000ms]
  |
  +-- RUBRIC SCORE -- quality 0..1 ------- sizes the mark/warn deposit        [<0.01ms]
  |
  +-- MARK/WARN -- markOutcome() --------- tag->model + actor->tag pheromone  [<0.01ms]
  |
  +-- RESPONSE CACHE -- D1 write --------- hash(prompt+tags) -> response      [<5ms]
  |
  +-- INTENT LEARN -- seedIntent() ------- next "conjugate ir" hits cache     [<5ms]
```

**Five deterministic layers before the LLM. Three deterministic layers after.**

Each layer either eliminates the LLM call entirely (pattern, intent, cache) or
makes it cheaper (model selection) or better (content recall, context injection).
Each layer learns from usage (pheromone, hit counts, quality scores, intent
expansion). The system gets cheaper and better with every signal — not because
anyone tuned it, but because every signal deposits information that the next
signal uses.

### What Compounds

| Layer | Learns from | Gets better at |
|-------|-------------|----------------|
| Pattern registry | Valence on next message | Canned replies that satisfy users |
| Intent cache | Hit count + unknown queries | Mapping diverse phrasings to answers |
| Toxic detection | warn() accumulation | Blocking bad actors faster |
| Tag classifier | (Static today, extend with auto-learned patterns) | Classifying novel topics |
| Content recall | Hypothesis lifecycle (testing -> confirmed) | Injecting proven facts |
| Model selection | Rubric scores per tag->model | Picking cheapest good model |
| Context injection | (Static today, extend with tag->doc pheromone) | Loading relevant material |
| Response cache | Quality-gated TTL | Caching only good answers |

The LLM is the spark; the graph is the fire.
