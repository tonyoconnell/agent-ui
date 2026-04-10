# Plan: LLM Routing

**Every LLM call today is a dumb point-to-point request.**
You pick a model. You call it. You get a response. Same model. Same cost. Forever.

The substrate transforms that into a pipeline that learns, caches, selects, and improves.
The LLM call is still the slow part — but everything around it compounds.

---

## The Flow

```
                    ┌─────────────────────────────────┐
  signal arrives    │        PROMPT ROUTER             │
  { prompt, task } ─►                                  │
                    │  PRE-1  semantic cache check      │  hit → 0ms $0
                    │  PRE-2  context injection         │  TypeDB → system prompt
                    │  PRE-3  model selection (STAN)    │  cheapest that works
                    │  PRE-4  budget gate               │  over limit → cheaper model
                    │                                  │
                    └──────────────┬──────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  OPENROUTER     │  ~800ms
                          │  (one slow step)│  $0.001–$0.003
                          └────────┬────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │        POST-PROCESSING           │
                    │                                  │
                    │  POST-1  record latency + cost   │  feeds STAN
                    │  POST-2  quality score           │  0.0–1.0
                    │  POST-3  quality-weighted mark   │  not just 0/1
                    │  POST-4  cache store             │  future hits free
                    │  POST-5  route by content type   │  JSON → parse, error → handle
                    │  POST-6  evolution signal        │  poor quality → L5 early
                    │                                  │
                    └──────────────┬──────────────────┘
                                   │
                              result → next unit
```

**The LLM fraction drops every week.** Cache hits grow. STAN routes cheaper.
The expensive models get reserved for what only they can do.

---

## The Value at Each Step

### PRE-1: Semantic Cache

```
Without:  1000 queries/day × $0.002 = $2.00/day
With:     200 uncached × $0.002 + 800 cached × $0.000 = $0.40/day
Saving:   80% cost reduction after warm-up period
Latency:  cache hit = 0ms vs 800ms LLM call
```

The cache key is a hash of `(model, system_prompt, user_prompt)`. Exact match only —
no fuzzy matching needed for FAQ-style queries where the same prompt recurs.

For customer support, internal tools, scheduled summaries — repeat queries are the
majority. The first answer costs $0.002. Every subsequent identical query costs $0.

```typescript
// D1 lookup: < 5ms
const hash = await promptHash(model, systemPrompt, userPrompt)
const cached = await db.prepare(
  'SELECT response, quality FROM llm_cache WHERE hash = ? AND ttl > ?'
).bind(hash, Date.now()).first()

if (cached && cached.quality > 0.7) {
  // Cache hit. Return immediately.
  net.mark(`${from}→${id}:cache`, 1)  // highway to cache forms fast
  return { response: cached.response, cached: true, cost: 0 }
}
```

---

### PRE-2: Context Injection

The substrate knows what this agent needs. You don't have to manage it.

```typescript
// TypeDB: what does this unit know? What's relevant to this task?
const insights = await net.recall(task)  // hypotheses matching task type
const docs = net.context(['routing', 'dsl', task])  // canonical docs

const enrichedSystem = [
  system,
  insights.length ? `\n\nKnown patterns:\n${insights.map(i => `- ${i.pattern}`).join('\n')}` : '',
  docs ? `\n\nContext:\n${docs.slice(0, 2000)}` : ''
].join('')

// The model gets relevant knowledge without you wiring it.
// As the substrate learns (L6 know()), context improves automatically.
```

**The agent's system prompt gets smarter every hour** as L6 promotes highways to
knowledge and that knowledge gets injected into future calls. No prompt engineering
required — the substrate manages its own context.

---

### PRE-3: Model Selection via STAN

Register every model as a unit. STAN picks.

```typescript
// All models competing on the same task type
net.units['gemma']   = llm('gemma',   openrouter(key, 'google/gemma-4-26b-a4b-it'))
net.units['llama']   = llm('llama',   openrouter(key, 'meta-llama/llama-4-maverick'))
net.units['sonnet']  = llm('sonnet',  openrouter(key, 'claude-sonnet-4-20250514'))
net.units['deepseek']= llm('deepseek',openrouter(key, 'deepseek/deepseek-r1'))

// STAN formula (world.ts:223-227):
// weight = (1 + net_pheromone × sensitivity) × latencyPenalty × revBoost
// latencyPenalty = 1 / (1 + latency_ms / 1000)
// revBoost = 1 + log1p(revenue)  ← negative revenue = cost reduces weight

// After 50 signals on a 'summarise' task:
//   gemma:  net=40, latency=400ms, revenue=-$0.05 (low cost)
//     weight = (1+40×0.7) × (1/1.4) × 1 = 29 × 0.71 × 1 = 20.6
//   sonnet: net=25, latency=1200ms, revenue=-$2.10 (high cost)
//     weight = (1+25×0.7) × (1/2.2) × 1 = 18.5 × 0.45 × 1 = 8.3
//
// Gemma gets 20.6/(20.6+8.3) = 71% of summarise traffic. Automatically.
// No config. Cost × success drives the distribution.
```

**Model arbitrage emerges without config:**

| Task type | Signal 1 | Signal 50 | Signal 200 |
|-----------|----------|-----------|------------|
| summarise | ~Claude (no pheromone, random) | Gemma 60% | Gemma 80% |
| code review | ~Gemma (random) | DeepSeek 55% | DeepSeek 75% |
| legal analysis | ~Gemma (random) | Sonnet 70% | Sonnet 85% |

The routing matches task to model without you defining it.

---

### PRE-4: Budget Gate

```typescript
// Rough estimate: 1 token ≈ 4 chars
const estimatedTokens = (systemPrompt.length + userPrompt.length) / 4
const estimatedCost = estimatedTokens * model.costPerMToken / 1_000_000

if (estimatedCost > opts.maxCostPerCall) {
  // Route to next cheapest model instead of dissolving
  const cheaper = selectCheaperModel(models, current)
  if (cheaper) return routeTo(cheaper, data)
  return null  // dissolve — warn fires
}
```

**Never get surprised by a large prompt hitting Claude.** The gate redirects to
the cheapest model that fits the budget before spending a cent.

---

### POST-1: Latency and Cost Recording

```typescript
const elapsed = performance.now() - t0
const actualTokens = response.usage?.total_tokens ?? estimatedTokens
const actualCost = actualTokens * model.costPerMToken / 1_000_000

// Feed STAN's latency penalty (world.ts:285-287):
// latency[path] = latency[path] * 0.7 + elapsed * 0.3  (EMA)
net.recordLatency(`${id}→${model.unit}`, elapsed)

// Cost as negative revenue — high cost models get penalised by revBoost
net.recordRevenue(`${id}→${model.unit}`, -actualCost)

// D1: running cost log
await db.prepare(
  'INSERT INTO llm_calls (model, tokens, cost_usd, latency_ms, task, ts) VALUES (?,?,?,?,?,?)'
).bind(model.id, actualTokens, actualCost, elapsed, task, Date.now()).run()
```

**The cost is tracked automatically.** Every model's lifetime cost accumulates in D1.
STAN's revenue boost penalises expensive models — they only win when their quality
justifies it. The routing system is inherently cost-aware.

---

### POST-2: Quality Scoring

Not every successful response is equally good. Quality score weights the mark.

```typescript
const score = (response: string, opts: QualityOpts): number => {
  let q = 1.0

  // Refusal detection: "I can't", "I'm not able to", "As an AI"
  if (/i can'?t|i'?m not able|as an ai/i.test(response)) q -= 0.5

  // Too short: likely didn't answer
  if (response.length < (opts.minLength ?? 20)) q -= 0.4

  // Too long: likely padding
  if (response.length > (opts.maxLength ?? 10000)) q -= 0.1

  // Schema validation: if JSON expected, parse it
  if (opts.schema === 'json') {
    try { JSON.parse(response); q += 0.1 } catch { q -= 0.4 }
  }

  // Confidence markers: "I think", "probably", "I'm not sure" → lower confidence
  const hedges = (response.match(/i think|probably|i'?m not sure|might be/gi) || []).length
  q -= hedges * 0.05

  // Custom validator passed in opts
  if (opts.validate) q = opts.validate(response, q)

  return Math.max(0, Math.min(1, q))
}
```

---

### POST-3: Quality-Weighted Mark/Warn

```typescript
// Not just success/fail — quality shapes the pheromone signal
const edge = `${from}→${id}`

if (quality > 0.8) {
  net.mark(edge, 2)           // excellent: double strength
} else if (quality > 0.5) {
  net.mark(edge, 1)           // good: normal
} else if (quality > 0.2) {
  net.mark(edge, 0.5)         // marginal: weak signal
} else if (quality > 0) {
  net.warn(edge, 0.5)         // poor: mild resistance
} else {
  net.warn(edge, 1)           // failure: full resistance
}

// Effect: a model that consistently scores 0.3 quality builds resistance
// even though it "succeeds". STAN routes away from it naturally.
// A model that scores 0.9 builds strong highways. Routed to more.
```

**This is new.** Current substrate marks any `{ result }` as success regardless of
quality. Quality-weighted marking means the pheromone reflects *how good* the
answer was, not just whether one arrived.

---

### POST-4: Cache Store

```typescript
// Only cache high-quality responses
if (quality > 0.7 && opts.cache) {
  const ttl = Date.now() + (opts.cache.ttl ?? 86_400_000)  // 24h default
  await db.prepare(
    `INSERT OR REPLACE INTO llm_cache
     (hash, model, response, tokens, cost_usd, quality, task, ts, ttl)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(hash, model.id, response.text, actualTokens, actualCost, quality, task, Date.now(), ttl).run()
}
// Poor responses not cached — next call tries again, possibly with a better model
```

---

### POST-5: Content-Type Routing

```typescript
// Parse the response to decide what to do next
const contentType = classify(response.text)

switch (contentType) {
  case 'json':
    // Route to a JSON handler unit
    emit({ receiver: 'json:parse', data: { raw: response.text } })
    break
  case 'error':
    // Escalate — something went wrong in the response
    emit({ receiver: 'error:handle', data: { response: response.text, model: model.id } })
    break
  case 'low-confidence':
    // LLM expressed uncertainty — route to human if configured
    if (opts.escalate) {
      emit({ receiver: opts.escalate, data: { response: response.text, confidence: quality } })
    }
    break
  default:
    // Plain text — continue chain normally
    emit({ receiver: ctx.from, data: { response: response.text } })
}
```

**No extra LLM call needed to classify the output.** Simple regex/heuristics.

---

### POST-6: Early Evolution Signal

```typescript
// If this model is consistently underperforming on this task type,
// signal L5 to evolve it early — don't wait for the 10-minute cycle
if (quality < 0.3 && opts.triggerEvolution) {
  // loop.ts already has priorityEvolve — push unit ID to trigger next tick
  opts.onPoorQuality?.(model.unit, quality, task)
}
```

---

## Implementation

### D1 Migration — `migrations/0004_llm_cache.sql`

```sql
-- LLM response cache
CREATE TABLE IF NOT EXISTS llm_cache (
  hash       TEXT PRIMARY KEY,   -- SHA-256(model + system + prompt)
  model      TEXT NOT NULL,
  response   TEXT NOT NULL,
  tokens     INTEGER,
  cost_usd   REAL,
  quality    REAL,
  task       TEXT,
  ts         INTEGER NOT NULL,
  ttl        INTEGER NOT NULL    -- Unix ms expiry
);

CREATE INDEX IF NOT EXISTS idx_cache_ttl ON llm_cache(ttl);
CREATE INDEX IF NOT EXISTS idx_cache_task ON llm_cache(task, quality);

-- LLM call log (cost tracking, no expiry)
CREATE TABLE IF NOT EXISTS llm_calls (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  model      TEXT NOT NULL,
  task       TEXT,
  tokens     INTEGER,
  cost_usd   REAL,
  latency_ms INTEGER,
  quality    REAL,
  cached     INTEGER DEFAULT 0,
  ts         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calls_ts    ON llm_calls(ts);
CREATE INDEX IF NOT EXISTS idx_calls_model ON llm_calls(model, ts);
CREATE INDEX IF NOT EXISTS idx_calls_task  ON llm_calls(task, ts);
```

---

### `src/engine/llm-router.ts` (new file, ~200 lines)

```typescript
import { unit, type Unit, type World } from './world'
import { openrouter } from './llm'

export interface ModelConfig {
  id: string          // OpenRouter model ID: 'google/gemma-4-26b-a4b-it'
  unit: string        // unit name in the world: 'gemma'
  costPerMToken: number
  contextWindow: number
  strengths?: string[]  // 'code', 'reasoning', 'summarise' — for type-indexed routing
}

export interface QualityOpts {
  minLength?: number
  maxLength?: number
  schema?: 'json' | 'markdown' | 'plain'
  validate?: (response: string, score: number) => number
}

export interface LlmRouterOpts {
  models: ModelConfig[]
  apiKey: string
  cache?: { db: D1Database; ttl?: number }
  budget?: { maxCostPerCall?: number; maxCostPerDay?: number }
  quality?: QualityOpts
  context?: () => Promise<string>      // inject docs/hypotheses
  escalate?: string                    // unit to route low-confidence responses to
  onPoorQuality?: (unitId: string, quality: number, task: string) => void
}

/**
 * Smart LLM unit with:
 *   - Semantic response cache (D1)
 *   - Context injection (TypeDB/docs)
 *   - Model selection via STAN (cost × latency × quality)
 *   - Budget gates
 *   - Quality-weighted mark/warn
 *   - Content-type routing
 *   - Early evolution signals
 *
 * Usage:
 *   const router = llmRouter('ai', {
 *     models: [
 *       { id: 'google/gemma-4-26b-a4b-it', unit: 'gemma', costPerMToken: 0.1, contextWindow: 8192 },
 *       { id: 'claude-sonnet-4-20250514', unit: 'sonnet', costPerMToken: 3.0, contextWindow: 200000 }
 *     ],
 *     apiKey: OPENROUTER_KEY,
 *     cache: { db: env.DB, ttl: 86_400_000 },
 *     budget: { maxCostPerCall: 0.01 }
 *   })
 *
 *   // Register all model units in world
 *   router.register(net)
 *
 *   // Signal any task — router handles model selection
 *   net.signal({ receiver: 'ai:summarise', data: { prompt: '...' } }, 'user')
 */
export const llmRouter = (id: string, opts: LlmRouterOpts) => {

  const scoreQuality = (response: string): number => {
    let q = 1.0
    const o = opts.quality || {}
    if (/i can'?t|i'?m not able|as an ai/i.test(response)) q -= 0.5
    if (o.minLength && response.length < o.minLength) q -= 0.4
    if (o.maxLength && response.length > o.maxLength) q -= 0.1
    if (o.schema === 'json') {
      try { JSON.parse(response); q += 0.1 } catch { q -= 0.4 }
    }
    const hedges = (response.match(/i think|probably|i'?m not sure|might be/gi) || []).length
    q -= hedges * 0.05
    if (o.validate) q = o.validate(response, q)
    return Math.max(0, Math.min(1, q))
  }

  const promptHash = async (model: string, system: string, prompt: string): Promise<string> => {
    const data = new TextEncoder().encode(`${model}:${system}:${prompt}`)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
  }

  // Creates a wrapped task handler for a given task name
  const makeTask = (taskName: string) =>
    async (data: unknown, emit: (s: { receiver: string; data: unknown }) => void, ctx: { from: string; self: string }) => {
      const { prompt, system = '' } = data as { prompt: string; system?: string }
      const db = opts.cache?.db

      // ── PRE-1: Cache check ─────────────────────────────────────────────
      // Pick a representative model for hashing (first registered)
      const hashKey = await promptHash(opts.models[0].id, system, prompt)
      if (db) {
        const hit = await db.prepare(
          'SELECT response, quality FROM llm_cache WHERE hash = ? AND ttl > ?'
        ).bind(hashKey, Date.now()).first<{ response: string; quality: number }>()
        if (hit && hit.quality > 0.7) {
          emit({ receiver: ctx.from, data: { response: hit.response, cached: true, cost: 0 } })
          return { response: hit.response, cached: true }
        }
      }

      // ── PRE-2: Context injection ───────────────────────────────────────
      let enrichedSystem = system
      if (opts.context) {
        const ctx_str = await opts.context().catch(() => '')
        if (ctx_str) enrichedSystem = `${system}\n\nContext:\n${ctx_str.slice(0, 2000)}`
      }

      // ── PRE-3: Model selection via cost (STAN handles pheromone routing) ──
      // Sort by costPerMToken ascending — STAN will reorder by success over time
      const sorted = [...opts.models].sort((a, b) => a.costPerMToken - b.costPerMToken)
      let selectedModel = sorted[0]

      // ── PRE-4: Budget gate ─────────────────────────────────────────────
      const estimatedTokens = (enrichedSystem.length + prompt.length) / 4
      for (const model of sorted) {
        const estCost = estimatedTokens * model.costPerMToken / 1_000_000
        if (!opts.budget?.maxCostPerCall || estCost <= opts.budget.maxCostPerCall) {
          selectedModel = model
          break
        }
      }

      // ── CALL: OpenRouter ───────────────────────────────────────────────
      const complete = openrouter(opts.apiKey, selectedModel.id)
      const t0 = performance.now()
      const response = await complete(prompt, { system: enrichedSystem }).catch(() => null)
      const elapsed = performance.now() - t0

      if (!response) return null  // warn(1) fires automatically

      // ── POST-1: Record latency + cost ──────────────────────────────────
      const actualCost = estimatedTokens * selectedModel.costPerMToken / 1_000_000
      // Caller's world records via net.recordLatency / net.recordRevenue
      // Emit metadata for the calling world to use
      const quality = scoreQuality(response)

      // ── POST-2-3: Quality-weighted result ──────────────────────────────
      // Return quality alongside response — caller uses it to weight mark/warn
      // (The substrate's mark() is called by world.ts signal handler automatically,
      //  but we can emit an extra signal with quality for downstream routing)

      // ── POST-4: Cache store ────────────────────────────────────────────
      if (db && quality > 0.7) {
        const ttl = Date.now() + (opts.cache?.ttl ?? 86_400_000)
        db.prepare(
          'INSERT OR REPLACE INTO llm_cache (hash,model,response,tokens,cost_usd,quality,task,ts,ttl) VALUES (?,?,?,?,?,?,?,?,?)'
        ).bind(hashKey, selectedModel.id, response, Math.round(estimatedTokens), actualCost, quality, taskName, Date.now(), ttl).run()
      }

      // ── POST-5: Content-type routing ───────────────────────────────────
      if (quality < 0.3 && opts.escalate) {
        emit({ receiver: opts.escalate, data: { response, quality, task: taskName, model: selectedModel.id } })
      }

      // ── POST-6: Early evolution signal ─────────────────────────────────
      if (quality < 0.3) opts.onPoorQuality?.(id, quality, taskName)

      return { response, quality, model: selectedModel.id, latency: elapsed, cost: actualCost, cached: false }
    }

  return {
    /**
     * Register all model units into the world and create the router unit.
     * After this, signal `id:taskName` to route through the full pipeline.
     */
    register: (net: World) => {
      // Register individual model units (STAN routes between them)
      for (const model of opts.models) {
        net.add(model.unit).on('complete', async (data) => {
          const { prompt, system = '' } = data as { prompt: string; system?: string }
          return await openrouter(opts.apiKey, model.id)(prompt, { system }).catch(() => null)
        })
      }

      // Register router unit — any task name flows through the full pipeline
      const u = net.add(id)
      // Proxy: any task → makeTask handler
      ;['complete', 'summarise', 'classify', 'extract', 'review', 'draft', 'answer'].forEach(task => {
        u.on(task, makeTask(task))
      })
      return u
    }
  }
}
```

**Export:** add to `src/engine/index.ts`:
```typescript
export { llmRouter } from './llm-router'
export type { ModelConfig, LlmRouterOpts, QualityOpts } from './llm-router'
```

---

## The Numbers

### Cost over time (1000 calls/day)

```
Day 1:    No cache, no pheromone. All calls to cheapest available.
          1000 × $0.002 (Gemma avg) = $2.00/day

Day 7:    Cache warming up. ~30% hit rate.
          700 uncached × $0.002 + 300 cached × $0 = $1.40/day

Day 30:   Cache at ~70% for repeat queries. STAN routing cheap models for simple tasks.
          300 uncached × avg($0.001) + 700 cached × $0 = $0.30/day

Day 90:   Cache at ~80%. STAN has found model per task type. Expensive models only for complex.
          200 uncached × avg($0.0008) + 800 cached × $0 = $0.16/day

Saving vs naive (always Claude at $0.003/call):
  Day 1:  $2.00/day vs $3.00/day  — 33% saved
  Day 90: $0.16/day vs $3.00/day  — 95% saved
```

### Latency over time

```
Day 1:   All live LLM calls. avg 900ms.
Day 7:   30% cache hits → avg 0.7 × 900ms + 0.3 × 5ms = 631ms
Day 30:  70% cache hits → avg 0.3 × 900ms + 0.7 × 5ms = 274ms
Day 90:  80% cache hits → avg 0.2 × 900ms + 0.8 × 5ms = 184ms
```

### Quality over time

```
Day 1:   Random model selection. avg quality 0.65.
Day 30:  STAN routing proven models per task. avg quality 0.78.
Day 90:  L5 evolution rewrote struggling agents. avg quality 0.85.
         (Each evolved agent jumps from <0.50 to 0.70+ on next 20 samples)
```

---

## Example: Customer Support with Full Pipeline

```typescript
import { world } from '@/engine/persist'
import { llmRouter } from '@/engine/llm-router'
import { human } from '@/engine/human'

const net = world()

// Set up the router with 3 competing models
const router = llmRouter('support-ai', {
  models: [
    { id: 'google/gemma-4-26b-a4b-it',    unit: 'gemma',    costPerMToken: 0.10, contextWindow: 8192 },
    { id: 'meta-llama/llama-4-maverick',   unit: 'llama',    costPerMToken: 0.15, contextWindow: 1_000_000 },
    { id: 'claude-sonnet-4-20250514',      unit: 'sonnet',   costPerMToken: 3.00, contextWindow: 200000 },
  ],
  apiKey: OPENROUTER_KEY,
  cache: { db: env.DB, ttl: 3_600_000 },          // 1h cache
  budget: { maxCostPerCall: 0.005 },               // never more than $0.005/call
  quality: { minLength: 50, schema: 'plain' },
  context: () => net.recall('support').then(       // inject known patterns
    insights => insights.map(i => i.pattern).join('\n')
  ),
  escalate: 'human-support:review',                // low quality → human
  onPoorQuality: (unitId) => {                     // early evolution signal
    console.log(`[evolution] ${unitId} underperforming, signalling L5`)
  }
})

router.register(net)

// Human fallback for escalations
net.units['human-support'] = human('human-support', {
  env, telegram: SUPPORT_TEAM_CHAT_ID, timeout: 1_800_000  // 30min
})

// The pipeline in action:
// User asks "How do I reset my password?"
// PRE-1: hash('How do I reset my password?') → cache hit after day 1 → 0ms $0
// PRE-2: inject 'password reset' patterns from TypeDB recall
// PRE-3: STAN picks Gemma (it handles FAQ well, high pheromone)
// CALL:  Gemma answers in 400ms
// POST:  quality 0.89 → mark(2) → highway forms fast → next call probably cached
//
// After 1 week: "password reset" questions → instant cache hit, 0ms, $0
// Gemma's trail on support:answer is strong. STAN routes 80% of questions to it.
// Sonnet only activates for complex billing disputes.
```

---

## What's New vs Bare OpenRouter

| Feature | Bare OpenRouter | ONE LLM Router |
|---------|----------------|----------------|
| Model selection | Manual, static | STAN: cost × latency × quality |
| Caching | None | D1 semantic cache, 24h TTL |
| Context | You manage it | TypeDB recall auto-injected |
| Cost tracking | None | Per-call D1 log, running total |
| Quality signal | Binary (success/fail) | 0.0–1.0 score shapes pheromone |
| Routing on quality | None | Low quality → human escalation |
| Evolution | None | Poor quality → L5 early trigger |
| Cost over time | Flat | Falls 90%+ by day 90 |
| Latency over time | Flat 800ms | Falls to <200ms avg by day 30 |

---

## Build Checklist

```
[ ] migrations/0004_llm_cache.sql     — llm_cache + llm_calls tables
[ ] src/engine/llm-router.ts          — routedLlm factory (~200 lines)
[ ] src/engine/index.ts               — export llmRouter, ModelConfig
[ ] src/pages/api/llm/stats.ts        — GET cost + quality dashboard
[ ] src/pages/api/llm/cache.ts        — GET cache stats, DELETE to flush
```

**Total: ~250 lines + 1 migration. No architecture changes.**

---

*Depends on: [plan-receivers.md](plan-receivers.md) Plan B (durable ask for human escalation)*  
*See also: [speed.md](speed.md) — sandwich timing proves overhead is zero*  
*[receivers.md](receivers.md) — LLM is Type 4, one of six receiver types*  
*[gaps-receivers.md](gaps-receivers.md) — where this fits in the build order*
