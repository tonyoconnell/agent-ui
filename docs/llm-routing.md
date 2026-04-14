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

## Files

| File | Purpose |
|------|---------|
| `src/engine/llm-router.ts`      | `route`, `chooseModel`, `markOutcome`, `seedModels`, `openAiCaller` |
| `src/engine/llm-router.test.ts` | 6 acts of numerical proof (STAN, quality, cache, budget, compound, highway) |
| `src/engine/rubric-score.ts`    | `scoreWork`, `compositeScore`, `markDims` — rubric → tagged edges |
| `src/engine/llm.ts`             | Legacy single-model adapters (kept for compatibility) |
| `docs/plan-llm-routing.md`      | Original plan doc (this doc supersedes it) |

---

## See Also

- [dictionary.md](dictionary.md) — the names (tag, pheromone, mark, warn)
- [DSL.md](DSL.md) — the substrate primitives the router composes
- [rubrics.md](rubrics.md) — quality scoring mechanism used as mark weight
- [routing.md](routing.md) — the deterministic sandwich this implements
- [work-loop.md](work-loop.md) — how routing stages compose into developer loops

---

*Tags. Weights. Rubrics. The substrate learns which model earns the traffic.*
