# Engine Rules

Apply to `src/engine/*.ts`

---

## The Substrate

```
70 lines.  Zero returns.  Two fields.

{ receiver, data }

That's all that flows.
TypeDB is the relay. The router follows pheromone. The ant doesn't decide.
```

---

## TypeDB as Signal Relay

```
1. Write signal to TypeDB
2. TypeDB → suggest_route($from, $task) → next destination
3. Execute agent prompt (model + system-prompt from unit)
4. Write result as new signal
5. Repeat
```

The router process is dumb hands. TypeDB is the brain.
Multiple machines, one TypeDB instance = one shared world.

---

## Agent Self-Improvement

Units have `model`, `system-prompt`, `generation`.
The substrate measures performance. When it's bad enough, the agent evolves.

```typescript
// Substrate detects
needs_evolution(unit) → success-rate < 0.50, sample-count >= 20

// Agent responds
unit.system-prompt = rewrite(old-prompt, failures)
unit.generation++
// Optional: unit.model = upgrade("haiku" → "sonnet")
```

Two layers of learning:
- **Substrate** — pheromone on paths/trails. Colony gets smarter.
- **Agent** — prompt/model evolution. Individual ant gets smarter.

---

## Signal

```typescript
type Signal = {
  receiver: string      // "unit" or "unit:task"
  data?: unknown     // anything
}
```

The universal primitive. Ants mark chemical signals. Neurons fire electrical signals. Agents move digital signals.

---

## Unit

```typescript
unit(id, route?)
  .on(name, fn)           // define task
  .then(name, template)   // define continuation
  .role(name, task, ctx)  // context-bound task
  .has(name)              // introspection
  .list()                 // introspection
  .id                     // identity
```

### Task Signature

```typescript
(data, emit, ctx) => result

data   // the data
emit      // (signal) => void — fan out
ctx       // { from: string, self: string }
```

---

## Colony

```typescript
colony()
  .spawn(id)              // create unit
  .signal(signal, from?)  // move signal through world
  .mark(edge, strength?)  // leave weight on path (pheromone)
  .follow(type)           // traverse weighted path to best
  .sense(edge)            // read weight
  .fade(rate?)            // decay all paths
  .highways(limit?)       // top weighted paths
  .has(id)                // introspection
  .list()                 // introspection
  .get(id)                // direct access
```

---

## Zero Returns

Positive flow only. Silence is valid.

```typescript
// GOOD
task?.(data, emit, ctx).then(result =>
  next[name] && route?.(next[name](result), receiver)
)

// GOOD
target && (mark(edge), target(sig))

// BAD
if (!task) return reject(...)
if (!target) throw new Error(...)
```

Missing handler? Signal dissolves. Swarm continues.

---

## Continuations

Defined at setup, not at send:

```typescript
// Setup
.on('observe', ({ tick }) => ({ data: tick }))
.then('observe', r => ({ receiver: 'analyst', data: r }))

// Signal (minimal)
{ receiver: 'scout:observe', data: { tick: 42 } }
```

Templates are functions. Full control.

---

## Signal Flow

```
signal(sig, from='entry')
  → unit(sig, from)
    → task(data, emit, {from, self})
      → emit(sig)  // carries self as new from
        → signal(sig, from=self)
          → mark(edge)  // path remembers
```

Concurrency safe. No global state.

---

## Patterns

### Request / Response

```typescript
.on('ask', ({ q }, emit, { self }) => {
  emit({ receiver: 'oracle', data: { q, replyTo: self } })
})

.on('answer', ({ q, replyTo }, emit) => {
  emit({ receiver: replyTo, data: { a: compute(q) } })
})
```

### Claim

```typescript
.on('claim', ({ id }, emit, { from }) => {
  !claims[id] && (claims[id] = from,
    emit({ receiver: from, data: { claimed: id } }))
})
```

### Payment

```typescript
.on('pay', ({ to, amount }, emit, { from }) => {
  bal[from] >= amount && (
    bal[from] -= amount,
    bal[to] += amount,
    emit({ receiver: to, data: { received: amount } }))
})
```

### Stream

```typescript
.on('ingest', async ({ url }, emit) => {
  const s = await connect(url)
  s.on('data', d => emit({ receiver: 'process', data: d }))
})
```

---

## Types

```typescript
import { colony, unit } from "@/engine/substrate"
import type { Colony, Unit, Signal, Emit } from "@/engine/substrate"

// Aliases
import { world, actor } from "@/engine"
import type { World, Actor } from "@/engine"
```

---

## The Loop

```
MARK                   FADE
  │                     │
  ▼                     ▼
strength++         weight *= 0.95
  │                     │
  ▼                     ▼
more signals       reroute
  │                     │
  ▼                     ▼
HIGHWAY            dissolve
```

---

## Multi-Machine Collaboration

```
Machine A (Tony)                    Machine B (David)
┌──────────┐                        ┌──────────┐
│  Hermes  │──signal──→ TypeDB ←──signal──│ Theodore │
│ (router) │←─route───→   ↕   ←──route──│ (router) │
└──────────┘           paths &       └──────────┘
                       trails
```

Each machine runs one router process. TypeDB is shared.
Hermes writes signals. Theodore reads them. Pheromone builds across machines.
The substrate learns end-to-end paths regardless of which machine runs which agent.

---

*Signal. Mark. Warn. Follow. Fade. Highway. Evolve. 70 lines.*
