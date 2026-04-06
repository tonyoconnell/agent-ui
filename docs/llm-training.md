# AI Training & Inference

What if the infrastructure that routes AI is also the infrastructure that improves AI?

Not by replacing training. By making every call count.

---

## The Problem With AI Infrastructure

Today's AI stack is layers of probability managing probability:

```
User input → [AI filter] → [AI router] → [AI model] → [AI scorer] → [AI filter] → output

Five probabilistic layers. Stack them at 99% each = 95% system accuracy.
At scale, 5% is millions of errors. And each layer costs money.
```

The fix isn't smarter layers. It's fewer layers.

---

## The Substrate Approach

Two dictionaries. Arithmetic. One probabilistic step. One formula.

```
Signal → [strength/resistance check] → [LLM] → [outcome measurement] → mark()/warn()
            deterministic       prob       deterministic          deterministic
```

The LLM is the only uncertain thing. Everything else is a dictionary lookup and a comparison. That's the architecture. The rest is consequences.

### The Formula

One formula governs all probabilistic routing:

```
weight = 1 + max(0, strength - resistance) × sensitivity
```

The `1` ensures every known path is reachable — even with zero weight. No path is invisible, just expensive. `sensitivity` is a per-unit parameter that controls how strongly weight influences routing. Low sensitivity = exploration. High sensitivity = exploitation. The substrate doesn't program roles — sensitivity creates them.

---

## What Two Dictionaries Replace

The entire substrate rests on two plain objects:

```typescript
const strength: Record<string, number> = {}   // what worked
const resistance: Record<string, number> = {}   // what failed
```

These replace:

| Infrastructure | How | Lines |
|---------------|-----|-------|
| **Circuit breaker** | `resistance[edge] > strength[edge] * 2 && resistance[edge] >= 10` → path blocked | 1 |
| **Load balancer** | `select()` — weighted random from strength, penalized by resistance | 8 |
| **A/B testing** | Two units, same skill. `select()` routes proportionally. Winner emerges. | 0 (built in) |
| **Canary deployment** | New unit gets explored via `select()`'s exploration parameter | 0 (built in) |
| **Retry with backoff** | Alarm decays. Blocked paths reopen. System retries naturally. | 0 (built in) |
| **Service mesh routing** | `follow()` — deterministic strongest path | 4 |
| **Health checks** | Continuous. Every signal is a health check. `warn()` on failure. | 0 (built in) |

No agents. No sidecars. No config files. Two dictionaries and arithmetic.

---

## Asymmetric Decay: Forgiveness in One Line

```typescript
const fade = (r = 0.1) => {
  for (const e in strength) { strength[e] *= (1 - r); strength[e] < 0.01 && delete strength[e] }
  for (const e in resistance) { resistance[e] *= (1 - r * 2); resistance[e] < 0.01 && delete resistance[e] }
}
```

Alarm decays **twice as fast** as strength. One line, three consequences:

1. **Forgiveness.** A failed path reopens. The system doesn't hold grudges.
2. **Second chances.** An agent that was bad last week gets retried this week.
3. **Self-healing.** A temporary outage doesn't permanently scar the routing table.

Systems that never forgive (blacklists) are brittle. Systems that never remember (no state) are stupid. Asymmetric decay is neither. Failures are forgiven faster than successes are forgotten.

---

## Cold-Start Protection: Statistical Rigor in One Conditional

```typescript
const isToxic = (edge: string) => {
  const a = net.resistance[edge] || 0
  const s = net.strength[edge] || 0
  return a >= 10 && a > s * 2 && (a + s) > 5
}
```

Three conditions. Three protections:

- `a >= 10` — Enough data. Don't block on noise.
- `a > s * 2` — Clearly bad, not marginal. A 40% failure rate doesn't block.
- `(a + s) > 5` — Minimum sample size. New paths get a fair trial.

No ML model decides what's toxic. Arithmetic does. Same input, same answer, always.

---

## Five Integration Points

### 1. Model Selection — The World Picks

```typescript
const w = world()

w.actor('claude', 'llm')
  .on('complete', async ({ prompt }) => anthropic(prompt))

w.actor('gpt4', 'llm')
  .on('complete', async ({ prompt }) => openai(prompt))

// select() routes proportionally to measured success
// Exploration parameter ensures the loser still gets tried
// No benchmark. No human decision. Production outcomes.
```

Why this matters: benchmarks measure models on standardized tasks. Your workload isn't standardized. A model that scores 90% on MMLU might score 60% on YOUR prompts. The substrate measures on YOUR actual signals.

### 2. Adapter Selection — Pheromone Routes to Specialization

```typescript
w.actor('lora-code', 'adapter')
  .on('complete', ({ prompt }) => runWithAdapter('code', prompt))

w.actor('lora-legal', 'adapter')
  .on('complete', ({ prompt }) => runWithAdapter('legal', prompt))

// Coding signals → lora-code (proven path)
// Legal signals → lora-legal (proven path)
// If an adapter degrades, resistance accumulates, traffic reroutes
```

Static routing keeps sending traffic to a stale adapter. The substrate measures outcomes — if the adapter stops working, resistance accumulates, the path goes toxic, traffic reroutes. No human intervention.

### 3. Continuous Training — The Tick Loop

Every 10 seconds, the substrate breathes:

```
SELECT  →  weighted random from weight landscape
ASK     →  toxic check + capability check + signal + wait
OUTCOME →  result? mark(depth). timeout? neutral. dissolved? warn(0.5). failure? warn(1).
DRAIN   →  process highest-priority queued signal
FADE    →  every 5 min: strength *= 0.95, resistance *= 0.90
EVOLVE  →  every 10 min: rewrite struggling agent prompts
KNOW    →  every hour: crystallize highways, detect frontiers
```

This is the continuous training loop. It never stops. Every signal is a training sample. Every outcome updates the routing table. The gap between "what the system knows" and "what's happening now" is exactly one signal.

```typescript
async function serve(prompt: string) {
  const model = w.select('llm') || 'claude'
  const { result } = await w.ask({ receiver: `${model}:complete`, data: { prompt } })
  // result exists → mark() happened → path strengthened
  // result undefined → warn() happened → path weakened
  return result
}
```

Traditional systems retrain weekly or monthly. Between retrains, the routing is stale. The substrate trains continuously — every signal updates weights, every outcome adjusts routing, every fade cycle forgives old failures.

### Chain Depth — Sequential Success as Training Signal

Isolated successes are common. Sequential successes are rare and meaningful.

```
signal → unit A → result → mark(edge, depth=1)
                     ↓
signal → unit B → result → mark(edge, depth=2)
                     ↓
signal → unit C → result → mark(edge, depth=3)
```

A chain of 5 consecutive successes deposits 5× weight on the final edge. Five isolated successes deposit 1× each. Same total signals, different information. The chain says: "this path doesn't just work sometimes — it works reliably, in sequence, under real load."

A failure anywhere resets the chain. This is a one-variable quality metric. No scorer. No reward model. The chain length IS the quality signal.

### 4. Queue + Spawn — Work Before Workers

```typescript
// Work arrives before the worker exists
net.enqueue({ receiver: 'specialist:analyze', data: report })

// Later, the worker spawns — backlog auto-delivers
net.add('specialist')
  .on('analyze', (data) => analyze(data))
```

Temporal decoupling. The system accepts work it can't do yet. When capacity arrives, it catches up. No orchestrator. No dead-letter queue. The queue drains on spawn.

### 5. The Deterministic Sandwich

```
SIGNAL IN
    │
    ▼
DETERMINISTIC: isToxic(edge)?     → dissolve (no LLM call, no cost)
DETERMINISTIC: capability exists? → TypeDB lookup → dissolve
    │
    ▼
PROBABILISTIC: LLM generates response
    │
    ▼
DETERMINISTIC: Did downstream succeed? → mark() or warn()
    │
    ▼
SIGNAL OUT (or dissolve)
```

The pre-check is arithmetic. The post-check is measurement. The LLM is sandwiched between facts. You don't need to detect hallucinations — you measure whether the downstream signal succeeded. Bad outcomes close paths. The hallucination isn't caught. It's made irrelevant.

---

## Emergent Specialization — Castes From One Formula

Different sensitivity values create different routing behavior from the same weight landscape. No one programs the roles.

```
THE SAME WEIGHT MAP:

entry ══(60)══► scout ══(55)══► analyst ══(40)══► reporter
                  │
                  └──(8)──► explorer ──(3)──► unknown


SCOUT (sensitivity = 0.2):              HARVESTER (sensitivity = 0.9):

weight(→analyst)  = 1 + 55×0.2 = 12    weight(→analyst)  = 1 + 55×0.9 = 50.5
weight(→explorer) = 1 + 8×0.2  = 2.6   weight(→explorer) = 1 + 8×0.9  = 8.2
weight(→unknown)  = 1 + 3×0.2  = 1.6   weight(→unknown)  = 1 + 3×0.9  = 3.7

analyst 74%, explorer 16%, unknown 10%  analyst 81%, explorer 13%, unknown 6%
Scouts still explore weak paths often.  Harvesters strongly prefer highways.
```

This is continuous training producing specialization without training. The weight landscape is shared data. Sensitivity is the "learning rate" per unit. Low sensitivity units explore broadly — they're the world's curiosity. High sensitivity units exploit proven paths — they're the world's reliability. Both emerge from one formula.

For LLMs, this means: a new model enters with low sensitivity (explore broadly, prove itself on diverse tasks). As it proves reliable on specific skills, its effective sensitivity increases on those paths. A model that's great at code but mediocre at legal gets routed code signals — not because someone configured it, but because weight accumulated on the code paths.

---

## What Happens Over Time

```
Week 1:   World is cold. select() explores broadly.
          Every signal deposits weight. Paths form.
          All units behave like scouts — exploring everything.

Week 4:   Strong paths emerge. Common signals follow highways.
          Exploration continues at the configured rate (default 30%).
          Specialization begins — some units prove better at some skills.

Week 12:  Highways crystallized. fade-rate drops to 0.01. Near permanent.
          Struggling agents have been evolved (L5). Prompts refined.
          Frontier detection (L7) finds unexplored skill clusters.
          The system has both specialists and scouts — from one formula.
```

The timeline depends on workload volume and repetitiveness. High-volume, repetitive workloads converge fast. Novel, creative workloads keep exploring longer. The substrate adapts to the workload's actual structure — it doesn't assume one.

---

## What This Is (And Isn't)

**This IS:**
- Stigmergic routing — ants leave trails, trails become highways
- Adaptive infrastructure — circuit breakers that forgive, load balancers that learn
- Outcome measurement — not output classification
- The simplest possible feedback loop: use → measure → route

**This is NOT:**
- A replacement for neural network training (it doesn't learn representations)
- A replacement for GPUs (the LLMs it routes to still need them)
- A gating network (it routes whole signals, not tokens within a forward pass)

The power is in the combination. LLMs provide intelligence. The substrate provides routing, measurement, memory, and forgiveness. The LLM doesn't need to know which path is best — the strength map does. The strength map doesn't need to generate text — the LLM does.

**The analogy that holds:** This is to AI routing what ant colonies are to pathfinding. No ant knows the shortest path. The pheromone map does. No unit knows which model is best. The weight map does.

**The analogy that breaks — and where it comes back:** `mark()` is not gradient descent. `strength` is not a weight matrix. But the *function* is the same: both adjust numerical parameters based on outcomes to improve future performance. The substrate trains at the routing layer, not the representation layer. It doesn't learn what words mean — it learns which paths work. Gradient descent optimizes weights inside a model. Pheromone optimizes weights between models. Both are continuous. Both are automatic. Both produce specialization from undifferentiated starts.

**Two routing modes, two kinds of knowledge:**
- `follow()` — deterministic. Always picks the strongest path. This is consolidated memory. "What's the proven route?"
- `select()` — stochastic. Weighted random with sensitivity. This is active behavior. "Where should I go next?"

`follow()` is recall. `select()` is decision. The substrate needs both — `follow()` to query what it knows, `select()` to decide what it does. Training happens through `select()` (exploration creates data). Knowledge crystallizes through `follow()` (proven paths become highways).

---

## The Real Comparison

| Traditional Infrastructure | Substrate | Difference |
|---------------------------|-----------|------------|
| Envoy/Istio service mesh | `select()` + `follow()` | Learns from outcomes, not config |
| Circuit breaker (Hystrix) | `isToxic()` | Forgives (asymmetric decay) |
| A/B testing (LaunchDarkly) | Two units + `select()` | Continuous, automatic |
| Canary deployment | `select(type, 0.3)` | Built into routing |
| Health check + retry | `warn()` + `fade()` | Every signal is a health check |
| Load balancer (weighted) | `select()` | Weights update from outcomes |
| Dead-letter queue | `enqueue()` + `spawn()` | Auto-delivers on spawn |

Seven infrastructure categories. Two dictionaries. ~90 lines.

---

## See Also

- [llms.md](llms.md) — The deterministic sandwich, the three powers, and convergence
- [substrate-learning.md](substrate-learning.md) — How weight encodes routing history
- [metaphors.md](metaphors.md) — Six skins, one truth

---

*Two dictionaries. Arithmetic. The world learns what works.*
