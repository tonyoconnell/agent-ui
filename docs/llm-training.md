# AI Training & Inference

What if the infrastructure that routes AI is also the infrastructure that improves AI?

Not by replacing training. By making every call count.

---

## The Problem With AI Infrastructure

Today's AI stack is layers of probability managing probability:

```
User input → [AI filter] → [AI router] → [AI model] → [AI scorer] → [AI filter] → output
               prob          prob          prob          prob          prob

Five probabilistic layers. Stack them at 99% each = 95% system accuracy.
At scale, 5% is millions of errors. And each layer costs money.
```

The fix isn't smarter layers. It's fewer layers.

---

## The Substrate Approach

Two dictionaries. Arithmetic. One probabilistic step.

```
Signal → [scent/alarm check] → [LLM] → [outcome measurement] → mark()/warn()
            deterministic       prob       deterministic          deterministic
```

The LLM is the only uncertain thing. Everything else is a dictionary lookup and a comparison. That's the architecture. The rest is consequences.

---

## What Two Dictionaries Replace

The entire substrate rests on two plain objects:

```typescript
const scent: Record<string, number> = {}   // what worked
const alarm: Record<string, number> = {}   // what failed
```

These replace:

| Infrastructure | How | Lines |
|---------------|-----|-------|
| **Circuit breaker** | `alarm[edge] > scent[edge] * 2 && alarm[edge] >= 10` → path blocked | 1 |
| **Load balancer** | `select()` — weighted random from scent, penalized by alarm | 8 |
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
  for (const e in scent) { scent[e] *= (1 - r); scent[e] < 0.01 && delete scent[e] }
  for (const e in alarm) { alarm[e] *= (1 - r * 2); alarm[e] < 0.01 && delete alarm[e] }
}
```

Alarm decays **twice as fast** as scent. One line, three consequences:

1. **Forgiveness.** A failed path reopens. The system doesn't hold grudges.
2. **Second chances.** An agent that was bad last week gets retried this week.
3. **Self-healing.** A temporary outage doesn't permanently scar the routing table.

Systems that never forgive (blacklists) are brittle. Systems that never remember (no state) are stupid. Asymmetric decay is neither. Failures are forgiven faster than successes are forgotten.

---

## Cold-Start Protection: Statistical Rigor in One Conditional

```typescript
const isToxic = (edge: string) => {
  const a = net.alarm[edge] || 0
  const s = net.scent[edge] || 0
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

### 1. Model Selection — The Colony Picks

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
// If an adapter degrades, alarm accumulates, traffic reroutes
```

Static routing keeps sending traffic to a stale adapter. The substrate measures outcomes — if the adapter stops working, alarm accumulates, the path goes toxic, traffic reroutes. No human intervention.

### 3. Continuous Measurement — Usage Informs Routing

```typescript
async function serve(prompt: string) {
  const model = w.select('llm') || 'claude'
  const { result } = await w.ask({ receiver: `${model}:complete`, data: { prompt } })
  // result exists → mark() happened → path strengthened
  // result undefined → warn() happened → path weakened
  return result
}
```

Every call updates the routing table. The gap between "what the system knows" and "what's happening now" is exactly one signal. Traditional systems retrain weekly or monthly. Between retrains, the routing is stale.

### 4. Queue + Spawn — Work Before Workers

```typescript
// Work arrives before the worker exists
net.enqueue({ receiver: 'specialist:analyze', data: report })

// Later, the worker spawns — backlog auto-delivers
net.spawn('specialist')
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

## What Happens Over Time

```
Week 1:   Colony is cold. select() explores broadly.
          Every signal deposits pheromone. Paths form.

Week 4:   Strong paths emerge. Common signals follow highways.
          Exploration continues at the configured rate (default 30%).

Week 12:  Highways crystallize. fade-rate drops to 0.01. Near permanent.
          Struggling agents have been evolved. Prompts are refined.
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

The power is in the combination. LLMs provide intelligence. The substrate provides routing, measurement, memory, and forgiveness. The LLM doesn't need to know which path is best — the scent map does. The scent map doesn't need to generate text — the LLM does.

**The analogy that holds:** This is to AI routing what ant colonies are to pathfinding. No ant knows the shortest path. The pheromone map does. No unit knows which model is best. The scent map does.

**The analogy that breaks:** This is not "training" in the ML sense. `mark()` is not gradient descent. `scent` is not a weight matrix. Calling it training invites a comparison the substrate loses. Calling it what it is — adaptive routing with memory — invites a comparison it wins.

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
- [substrate-learning.md](substrate-learning.md) — How pheromone encodes routing history
- [metaphors.md](metaphors.md) — Six skins, one truth

---

*Two dictionaries. Arithmetic. The colony learns what works.*
