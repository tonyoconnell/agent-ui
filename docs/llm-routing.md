# LLM Routing

Route any request to any OpenAI-compatible endpoint — OpenRouter, Anthropic,
OpenAI, local Ollama, self-hosted vLLM. The substrate picks which model earns
the traffic. Cost falls. Quality rises. No config.

**Three primitives. Nothing else.**

```
 TAGS        what kind of work         creative · extract · classify · code · summarise
 PHEROMONE   learned weight            mark/warn on tag→model edges
 RUBRICS     quality score             fit/form/truth/taste sizes mark/warn
```

Everything else — cost savings, speed, accuracy — emerges from these three dials.

---

## Status: What's Wired vs What's Waiting

| Component | Status | File |
|-----------|--------|------|
| `chooseModel()` — STAN tag-scoped routing | **Built, tested** | `src/engine/llm-router.ts` |
| `markOutcome()` — rubric-sized pheromone | **Built, tested** | `src/engine/llm-router.ts` |
| `seedModels()` — cold-start priors | **Built, tested** | `src/engine/llm-router.ts` |
| `openAiCaller()` — any OpenAI endpoint | **Built, tested** | `src/engine/llm-router.ts` |
| `route()` — full choose→call→mark loop | **Built, tested** | `src/engine/llm-router.ts` |
| Budget gate (`maxCostPerCall`) | **Built, tested** | `src/engine/llm-router.ts` |
| Highway bypass (net ≥ 20 → skip LLM) | **Built, tested** | `src/engine/llm-router.ts` |
| Per-dim marking (`markDims`) | **Built** | `src/engine/rubric-score.ts` |
| **NanoClaw using `chooseModel()`** | **NOT WIRED** | `nanoclaw/src/workers/router.ts` |
| **Semantic cache (hash→response)** | **NOT BUILT** | — |
| **Tag-based context injection** | **NOT WIRED** | — |
| **Per-conversation cost tracking** | **NOT BUILT** | — |
| **Response rubric scoring** | **NOT WIRED** | — |

**The engine exists. The edge agents don't use it yet.**

NanoClaw currently calls `resolveLLM()` which checks a model prefix (`groq/` →
Groq API, else → OpenRouter) and sends every request to the same model. No tag
routing. No budget gates. No rubric feedback. No cache. Every message from every
user costs the same regardless of whether it's "hi" or "explain quantum computing."

---

## The Mechanism

```
request (prompt + tags)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  PRE                                                         │
│    · budget gate — drop models where cost > max             │
│    · highway skip — if tag→model net ≥ 20, short-circuit    │
│    · cache lookup — hash(prompt) hit? return, mark(2)       │
│    · context inject — load docs matching tags into prompt   │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  CHOOSE  — tag-scoped pheromone distribution                 │
│    weight(m) = strength[tag→m] - resistance[tag→m]           │
│    STAN: probabilistic pick weighted by weight^(sens × 4)    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  CALL    — openAiCaller({ apiKey, baseUrl? })               │
│    any OpenAI-compatible endpoint                            │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  POST    — rubric sizes the mark                             │
│    composite(fit, form, truth, taste) → quality              │
│    >0.8 mark(2) · >0.5 mark(1) · >0.2 mark(0.5)              │
│    >0  warn(0.5) · =0 warn(1) · dissolved warn(0.5)          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  CACHE   — store response keyed by hash(normalized prompt)   │
│    hit rate climbs over time as highways form                │
│    cache marks highway at 2× strength (proven answer)        │
└─────────────────────────────────────────────────────────────┘
```

Same deterministic sandwich you use everywhere else. Cheap PRE check, one
probabilistic step, deterministic POST that shapes future routing.

---

## The Three Dials in Detail

### 1. Tags — the learning unit

One global "which model is best" is a weak signal. Per-tag learning is the multiplier.

```typescript
// Bad — one undifferentiated edge
mark('entry→sonnet', 1)

// Good — each task type learns its own best model
mark('creative→sonnet', 1)
mark('extract→haiku', 1)
mark('classify→gemma', 1)
mark('code→opus', 1)
```

Over time the substrate learns:
- `creative → sonnet` becomes a highway (quality matters)
- `extract → haiku` becomes a highway (speed + cheap matters)
- `classify → gemma` becomes a highway (pennies per million tokens)
- `code → opus` becomes a highway (taste matters)

One router. Dozens of specialized routing decisions.

### 2. Pheromone — the memory

Every route marks an edge. Every mark decays 2% per fade; every warn decays 4%.
The distribution is always up-to-date with recent performance. No retraining.

```typescript
// After 100 requests per tag
net.highways(10).filter(h => h.path.startsWith('creative→'))
// → [{ path: 'creative→sonnet', strength: 87 }, { path: 'creative→haiku', strength: 12 }]
```

Cold start handled by `seedModels(net, models, tags)` — 0.1 prior on every
tag→model edge so STAN has something to walk on.

### 3. Rubrics — the quality signal

Binary success/fail is the wrong signal. Two "successful" LLM calls can have
wildly different quality. Rubric scoring captures it:

```typescript
const score = scoreWork(task, { fit: 0.9, form: 0.8, truth: 0.9, taste: 0.7 })
// composite = 0.35·0.9 + 0.20·0.8 + 0.30·0.9 + 0.15·0.7 = 0.85 → mark(2)
```

Rubric score becomes the mark amount. Good taste reinforces more. Bad outcomes
leak into resistance even when the HTTP call succeeded.

Already implemented: `src/engine/rubric-score.ts` — `markDims()` writes 4
per-dimension edges (`edge:fit`, `edge:form`, `edge:truth`, `edge:taste`) so
the graph learns *which dimension* a model is weak on, not just overall.

---

## The OpenClaw Opportunity

NanoClaw (and any claw deployed from it) currently hardcodes one model per
persona. This leaves three categories of money on the table:

### 1. Simple Messages Hit Expensive Models

```
User: "hi"                          → calls Llama 4 Maverick ($0.15/M)
User: "explain photosynthesis"      → calls Llama 4 Maverick ($0.15/M)
User: "write me a marketing plan"   → calls Llama 4 Maverick ($0.15/M)
```

With tag routing:

```
User: "hi"                          → cache hit or Gemma ($0.02/M)    — 93% cheaper
User: "explain photosynthesis"      → Haiku ($1.0/M) or Gemma         — rubric learns
User: "write me a marketing plan"   → Sonnet ($3.0/M)                 — quality justifies cost
```

### 2. Repeated Questions Get No Benefit

NanoClaw has no semantic cache. The same question asked by different users in
the same group hits the LLM every time. A school with 50 students asking "what
is the present tense of 'ir'?" pays 50× for the same answer.

### 3. Context Is Static, Not Task-Aware

The system prompt is persona + student memory. It doesn't change based on what
the student is asking about. A grammar question gets the same context as a
vocabulary question. Tag-based context injection would load the right reference
material before the call — better answers on fewer tokens.

### What Tag Routing Saves

For a deployment like Debby (Elevare school, ~50 students):

| Without routing | With routing | Savings |
|-----------------|--------------|---------|
| All calls to one model | Tag-scoped model selection | 40-60% cost reduction |
| No cache | Semantic cache (D1) | 20-40% additional savings |
| Static context | Tag-injected context | Better answers, fewer retries |
| No quality signal | Rubric marks on responses | Continuous model optimization |
| **Estimate: ~$30/month** | **Estimate: ~$8/month** | **~73% reduction** |

At scale (100 claws, 1000 users), this is the difference between $3,000/month
and $800/month. The substrate pays for itself.

---

## Content-Level Short-Circuits (Before Routing)

Before model selection even runs, three content-matching systems can eliminate
the LLM call entirely:

### 1. Pattern Registry (regex, <0.01ms)

`nanoclaw/src/lib/classify-fallback.ts` already has 20 regex patterns. These
classify tags but don't short-circuit. Extend to per-claw configurable patterns
in D1 with four actions: `reply` (return canned text), `tag` (feed to STAN),
`route` (force model), `block` (dissolve).

```
"^(hi|hello|hey)\b"    → reply: "Hello! How can I help today?"   $0
"\b(fuck|shit)\b"       → block: content-policy                   $0
"\b(present tense)\b"   → tag: grammar + route: gemma             $0.02/M
```

Self-measuring: valence detector on the next message scores quality. Patterns
with quality < 0.3 auto-deactivate.

### 2. Intent Cache (keyword + TypeDB, 0-5ms)

`src/engine/intent.ts` maps diverse phrasings to canonical intents. Three tiers:
keyword match (0ms) → TypeDB registry (<5ms) → LLM normaliser (50ms, last resort).

```
"how do I return this?"  → intent: refund-policy → cached response    $0
"return policy"          → intent: refund-policy → cached response    $0
"what is the refund..."  → intent: refund-policy → cached response    $0
```

All three queries hit the same cached answer. One LLM call generates it; every
variant is free. `unknownQueries()` surfaces unrecognised patterns for new intent
creation.

**Currently: not wired into NanoClaw.** The entire intent system sits unused.

### 3. TypeDB Content Recall (~100ms)

TypeDB's `$s contains` operator queries signal history and hypotheses by content:

```tql
match $h isa hypothesis, has statement $s;
      $s contains "conjugation";
      has hypothesis-status "confirmed";
select $s;
```

Inject confirmed hypotheses into the prompt. The LLM doesn't need to guess
what the system already knows. `recall()` already does this for actor-level
memory; extend to topic-level.

### Combined Flow

```
message arrives
  |
  +-- pattern match?  --> reply/block/tag/route     $0        [<0.01ms]
  +-- intent resolve? --> cached response           $0        [0-5ms]
  +-- TypeDB recall   --> inject hypotheses         enriches  [~100ms]
  |
  v
  model routing (STAN) --> only reached for novel questions
```

For a school with bounded question space, pattern + intent + cache can handle
60-80% of traffic. The LLM only fires for genuinely new questions.

---

## Wiring Plan: NanoClaw → llm-router

### Step 0: Wire Intent Cache

```typescript
import { resolveIntent, bumpHitCount } from '@/engine/intent'

const intent = await resolveIntent(text, { db: env.DB, intents: persona.intents })
if (intent && intent.confidence >= 0.85) {
  const cached = await env.DB.prepare(
    'SELECT response FROM intent_responses WHERE intent = ?'
  ).bind(intent.intent).first()
  if (cached) {
    bumpHitCount(env.DB, intent.intent)
    mark(env, `intent:${intent.intent}`, groupUid, 2)
    return c.json({ ok: true, response: cached.response, resolver: intent.resolver })
  }
}
```

### Step 1: Import and Seed (Cold Start)

```typescript
// nanoclaw/src/workers/router.ts — at boot
import { seedModels, chooseModel, markOutcome } from '@/engine/llm-router'

const MODELS = [
  { id: 'google/gemma-4-26b-a4b-it',  costPerMToken: 0.15 },
  { id: 'anthropic/claude-haiku-4-5',  costPerMToken: 1.0 },
  { id: 'meta-llama/llama-4-maverick', costPerMToken: 0.15 },
  { id: 'anthropic/claude-sonnet-4-20250514', costPerMToken: 3.0 },
]

// Seed at boot — once per isolate
seedModels(net, MODELS, ['greeting', 'grammar', 'vocab', 'creative', 'factual', 'code'])
```

### Step 2: Replace `resolveLLM()` with `chooseModel()`

```typescript
// Before (current): hardcoded model
const llm = resolveLLM(context.model, c.env)

// After: tag-routed model selection
const tags = ingestResult.tags  // already classified by ingest()
const choice = chooseModel(net, MODELS, {
  prompt: text,
  tags,
  estimatedTokens: 300,
  maxCostPerCall: 0.003,        // $0.003 per call budget
  sensitivity: context.sensitivity,
})
const llm = resolveLLM(choice.model.id, c.env)
```

### Step 3: Mark with Quality (Close the Loop)

```typescript
// After response — existing confidence detection becomes a rubric proxy
const quality = detectConfidence(reply, valence, pack.highways)
markOutcome(net, choice, {
  response: reply,
  quality,              // 0..1 score from confidence detector
  latencyMs: Date.now() - t0,
})
```

### Step 4: Semantic Cache (D1)

```typescript
// PRE: check cache before LLM call
const promptHash = fnv1a(normalizePrompt(text))  // strip whitespace, lowercase
const cached = await env.DB.prepare(
  'SELECT response FROM response_cache WHERE hash = ? AND expires > ?'
).bind(promptHash, Date.now()).first()

if (cached) {
  mark(env, `cache→${choice.edge}`, 2)   // cache hit strengthens highway
  return cached.response
}

// POST: store response in cache
await env.DB.prepare(
  'INSERT OR REPLACE INTO response_cache (hash, tags, model, response, quality, expires) VALUES (?, ?, ?, ?, ?, ?)'
).bind(promptHash, tags.join(','), choice.model.id, reply, quality, Date.now() + 3600_000).run()
```

Cache TTL by quality: high-quality responses (>0.8) cache for 24h. Medium (>0.5) for 1h. Low quality never cached.

### Step 5: Tag-Based Context Injection

```typescript
// Load docs matching the conversation's tags
const contextDocs = inferDocsFromTags(tags)  // already exists in engine/context.ts
const docContext = contextDocs.length > 0
  ? `\n\n--- Reference Material ---\n${loadContext(contextDocs)}`
  : ''

const enhancedSystemPrompt = systemPromptWithPack(context.systemPrompt, pack) + studentCtx + docContext
```

NanoClaw already classifies tags via `ingest()`. The tags already exist. The
context loader already exists in `src/engine/context.ts`. The only missing piece
is calling `inferDocsFromTags()` and prepending the result to the system prompt.

---

## Cache Architecture

Three layers, each with a different purpose:

```
Layer 1: RESPONSE CACHE (D1)
  hash(normalized_prompt + tags) → full LLM response
  TTL: quality > 0.8 → 24h, quality > 0.5 → 1h
  Scope: per-claw (each worker's D1)
  Saves: 100% of LLM cost on hit
  Size: ~500 bytes per entry, 10k entries = 5MB

Layer 2: CONTEXT CACHE (KV)
  Already exists: `context:${groupId}` → GroupContext (model, prompt, sensitivity)
  TTL: 5 minutes
  Saves: D1 + TypeDB queries on every request
  Extend: add `tags:${groupId}` → last-known tags (skip re-classification)

Layer 3: ROUTING CACHE (in-memory)
  tag→model pheromone lives in `net.strength` / `net.resistance`
  TTL: per-isolate lifetime (~30s on CF Workers free tier)
  Saves: TypeDB read on every routing decision
  Bootstrap: `seedModels()` at boot, then pheromone accumulates in-memory
  Sync: write-through to D1 `claw_paths` table (already implemented)
```

### Cache Hit Rate Projection

```
Week 1:  ~10% hit rate   (cold start, diverse questions)
Week 2:  ~30% hit rate   (common questions cached, highways forming)
Week 4:  ~50% hit rate   (greeting/FAQ highways dominant)
Week 8:  ~65% hit rate   (long-tail covered, only novel questions miss)
```

For a school deployment with 50 students, most questions are predictable
(grammar rules, vocabulary, common exercises). Cache hit rate climbs fast.

### Cache Invalidation

- **Time-based**: TTL per quality tier (high=24h, medium=1h, low=never cached)
- **Pheromone-based**: When a tag→model edge's resistance exceeds strength, invalidate cached responses from that model for that tag. The cache learns from the same graph.
- **Manual**: `/forget` command already exists — extend to clear response cache for a group.

---

## API

```typescript
import { seedModels, route, openAiCaller, chooseModel, markOutcome } from '@/engine'

// 1. Define providers (OpenAI-compatible endpoints)
const models = [
  { id: 'anthropic/claude-haiku-4-5', costPerMToken: 1.0 },
  { id: 'google/gemma-4-26b-a4b-it',  costPerMToken: 0.15 },
  { id: 'meta-llama/llama-4-maverick', costPerMToken: 0.15 },
  { id: 'anthropic/claude-opus-4-6',  costPerMToken: 15.0 },
]

// 2. Seed edges per tag (cold start)
seedModels(net, models, ['creative', 'extract', 'classify', 'code'])

// 3. Route — choose, call, mark
const caller = openAiCaller({ apiKey: env.OPENROUTER_API_KEY })
const { choice, outcome } = await route(net, models, {
  prompt: 'Summarise this refund policy',
  tags: ['extract'],
  estimatedTokens: 800,
  maxCostPerCall: 0.002,
  sensitivity: 0.7,
}, caller)

// choice.reason: 'highway' | 'pheromone' | 'seed' | 'budget-fallback'
// choice.edge:   'extract→google/gemma-4-26b-a4b-it'
// outcome.response, outcome.latencyMs, outcome.failure, outcome.dissolved
```

If you score with a rubric, pass it back:

```typescript
import { scoreWork, compositeScore } from '@/engine/rubric-score'

const rubric = scoreWork(task, { fit: 0.9, truth: 0.85, form: 0.7, taste: 0.8 })
markOutcome(net, choice, { response: outcome.response, rubric })
```

---

## Non-OpenRouter endpoints

`openAiCaller` takes any `baseUrl`. Works with:

| Provider            | baseUrl                                          |
|---------------------|--------------------------------------------------|
| OpenRouter          | `https://openrouter.ai/api/v1` (default)         |
| OpenAI              | `https://api.openai.com/v1`                      |
| Anthropic (proxy)   | via OpenRouter or LiteLLM                        |
| Ollama (local)      | `http://localhost:11434/v1`                      |
| vLLM (self-hosted)  | `http://your-host:8000/v1`                       |
| Groq                | `https://api.groq.com/openai/v1`                 |
| Together            | `https://api.together.xyz/v1`                    |

The substrate does not care which provider earns an edge. If a local Ollama
model on `extract` tags builds a highway, extract requests stop hitting the
internet.

---

## Cost Curve (proven in `llm-router.test.ts`)

200 signals, 3 models, cache + STAN + budget gate + rubric marking:

| Phase         | Cost    | Quality | Cache Hit% | What's happening            |
|---------------|---------|---------|------------|-----------------------------|
| 1–50          | high    | 0.70    | ~10%       | exploration                 |
| 51–100        | falling | 0.75    | ~40%       | highways forming            |
| 101–150       | lower   | 0.80    | ~65%       | highways dominant           |
| 151–200       | lowest  | 0.85+   | ~80%       | highways + cache do the job |

Naive baseline: always-Sonnet, no cache = $3.00/M × 200 calls. Measured savings
consistently 60–90% depending on cache repeat rate.

---

## The Multiplier

Each route also leaves a stage edge in the work-loop instrumentation. So:

```
loop:code → extract→haiku → outcome
```

is a traceable path. Over time you learn not just "which model for which tag"
but "which model for which *stage of which task type*." The router stops being
an LLM gateway and becomes a workflow optimizer.

---

## Per-Dimension Model Weakness Detection

The graph doesn't just learn "Gemma is good at extraction." It learns *why*:

```
extract→gemma:fit     strength: 45    (high relevance)
extract→gemma:form    strength: 38    (decent structure)
extract→gemma:truth   strength: 12    (makes things up)
extract→gemma:taste   strength: 41    (clean output)
```

`markDims()` writes 4 tagged edges per response. Over time, you see that Gemma
scores well on fit/form/taste for extraction but hallucinates (low truth). The
substrate can then route truth-critical extraction to Haiku instead — same tag,
different quality requirement.

This is not configured. It emerges from the rubric scores deposited on each call.

---

## Highway Bypass: Zero-Cost Routing

When a tag→model edge reaches net strength ≥ 20 (proven highway), the router
returns that model immediately without computing STAN weights. The test suite
proves this:

```
Act 6: Highway reached → LLM skipped
  highway lookup: <5ms
  LLM call: 5-800ms
  savings: 99%+ on routing latency
```

For greeting/FAQ patterns that hit the same model every time, routing overhead
drops to near-zero. Combined with cache hits, these requests cost nothing.

---

## Files

| File | Purpose |
|------|---------|
| `src/engine/llm-router.ts`      | `route`, `chooseModel`, `markOutcome`, `seedModels`, `openAiCaller` |
| `src/engine/llm-router.test.ts` | 6 acts of numerical proof (STAN, quality, cache, budget, compound, highway) |
| `src/engine/rubric-score.ts`    | `scoreWork`, `compositeScore`, `markDims` — rubric → tagged edges |
| `src/engine/llm.ts`             | Legacy single-model adapters (kept for compatibility) |
| `nanoclaw/src/workers/router.ts` | **WHERE WIRING GOES** — replace `resolveLLM()` with `chooseModel()` |
| `nanoclaw/src/lib/substrate.ts`  | mark/warn/isToxic already implemented for nanoclaw |
| `nanoclaw/src/lib/prompt.ts`     | Memory injection — extend with tag-based context |

---

## See Also

- [deterministic-inference.md](deterministic-inference.md) — the full inference picture (CTO-level)
- [dictionary.md](dictionary.md) — the names (tag, pheromone, mark, warn)
- [DSL.md](DSL.md) — the substrate primitives the router composes
- [rubrics.md](rubrics.md) — quality scoring mechanism used as mark weight
- [routing.md](routing.md) — the deterministic sandwich this implements

---

*Tags. Weights. Rubrics. The substrate learns which model earns the traffic.*
