# DSL

The ONE language. Two fields, passed hand to hand, forever.

---

## The Signal

```typescript
{ receiver: 'scout:observe', data: { tick: 42 } }
```

That's it. `receiver` says who. `data` says what. A signal arrives at an agent.
The agent does its work. Then it emits the next signal. That signal arrives
at the next agent. Who does its work. And emits.

```
scout receives { tick: 42 }
  → observes, finds something
  → emits { receiver: 'analyst:process', data: finding }

analyst receives { finding }
  → classifies it
  → emits { receiver: 'reporter:summarize', data: classification }

reporter receives { classification }
  → writes the summary
  → emits { receiver: 'dashboard:update', data: summary }
```

No orchestrator decided this chain. Each agent only knows: I received a signal,
I did my work, I passed it on. The signal is the thread that stitches them together.

---

## How It Flows

```typescript
const scout = colony.spawn('scout')
  .on('observe', ({ tick }, emit) => {
    const finding = analyze(tick)
    emit({ receiver: 'analyst:process', data: finding })
    return finding
  })

const analyst = colony.spawn('analyst')
  .on('process', ({ finding }, emit) => {
    const result = classify(finding)
    emit({ receiver: 'reporter:summarize', data: result })
    return result
  })
```

Signal in. Work. Signal out. That's the entire programming model.

The `emit` function is how an agent speaks. It doesn't call another agent —
it sends a signal into the world. The colony routes it. The receiving agent
doesn't know who sent it (unless it checks `ctx.from`). Loose coupling by default.

---

## The Trail It Leaves

Every signal that lands marks pheromone on the path it traveled.

```
scout emits to analyst → path "scout→analyst:process" gets +1 strength
analyst emits to reporter → path "analyst→reporter:summarize" gets +1 strength
```

Do this a hundred times and the paths become highways. The colony remembers
which chains work — not because anyone told it, but because signals kept flowing.

```typescript
colony.highways(5)
// [
//   { path: 'scout→analyst:process', strength: 94.2 },
//   { path: 'analyst→reporter:summarize', strength: 87.1 },
//   { path: 'entry→scout:observe', strength: 82.5 },
//   ...
// ]
```

---

## What Happens When It Fails

A signal arrives. The agent fails. No pheromone marked. If you explicitly
warn the path, alarm pheromone accumulates instead:

```typescript
colony.warn('scout→bad-analyst:process')
```

Alarm builds up. The path goes toxic. `follow()` avoids it.
Future signals route around the failure — automatically.

```
success → mark(path)   → strength++  → highway emerges
failure → warn(path)   → alarm++     → path goes toxic
silence → nothing      → signal dissolves (zero returns)
```

No exceptions. No error handlers. The swarm just routes around.

---

## What Happens Over Time

Paths fade. Without fresh signals reinforcing them, strength decays.

```typescript
colony.fade(0.05)   // everything loses 5%
```

Alarm fades 2x faster. The system forgives failures sooner than it forgets successes.
Unused paths dissolve. Active paths persist. The colony's memory is always fresh.

```
MARK                   FADE
  │                     │
  ▼                     ▼
strength++         strength *= 0.95
  │                     │
  ▼                     ▼
more signals       reroute
  │                     │
  ▼                     ▼
HIGHWAY            dissolve
```

---

## Roles

A task with context baked in. Same handler, different perspective:

```typescript
colony.spawn('monitor')
  .on('check', ({ target }, emit) => {
    const status = ping(target)
    emit({ receiver: 'alert', data: { target, status } })
  })
  .role('check-db', 'check', { target: 'database' })
  .role('check-api', 'check', { target: 'api' })
```

`.role(name, task, ctx)` creates a named task that delegates to an existing handler
with pre-bound context. The signal's data merges on top:

```
signal { receiver: 'monitor:check-db' }
  → runs check with { target: 'database' }

signal { receiver: 'monitor:check-db', data: { timeout: 5000 } }
  → runs check with { target: 'database', timeout: 5000 }
```

Roles don't add logic. They add perspective.

---

## Continuations

Instead of each agent deciding who to emit to, you can declare the chain at setup:

```typescript
colony.spawn('scout')
  .on('observe', ({ tick }) => ({ data: tick }))
  .then('observe', result => ({ receiver: 'analyst', data: result }))
```

The `.then()` fires automatically after the task returns. The agent doesn't
even need to call `emit`. The continuation carries the signal forward.

Signal in. Work. Signal out. Declared once, runs forever.

---

## Zero Returns

The most important design decision: no errors.

A signal arrives at a unit that doesn't exist? Nothing happens.
A signal hits a handler that isn't defined? Nothing happens.
An agent has nothing to say? Nothing happens.

The swarm continues. Silence is valid. The signal dissolves.

```typescript
// Good — conditional flow
target && target(sig)
task?.(data, emit, ctx)

// Bad — never
if (!target) throw new Error(...)
```

This is how ant colonies work. An ant drops pheromone, no one follows it,
the trail evaporates. No exception thrown. No error logged. The colony moves on.

---

## The Six Verbs

| Verb | What it does | Effect |
|------|--------------|--------|
| `emit(signal)` | Agent passes signal to the next | Signal moves |
| `mark(path)` | Drop pheromone on success | Path strengthens |
| `warn(path)` | Drop alarm on failure | Path weakens |
| `fade(rate)` | Decay everything | Stale paths dissolve |
| `follow(type)` | Ask where pheromone is strongest | Route decision (deterministic) |
| `select(type, exploration?)` | Weighted random with exploration bias | Route decision (stochastic) |

`follow` always picks the highway. `select` explores — sometimes the strongest,
sometimes a random trail. Real ants do both. `exploration` controls the bias
(0 = always strongest, 1 = pure random, default 0.3).

Six operations. The signal flows. The path remembers. The colony learns.

---

## Addressing

```
"scout"           → default task handler
"scout:observe"   → named task handler
```

A signal to `"scout"` hits the default handler. A signal to `"scout:observe"`
hits the named one. That's all the routing you need.

---

## Signal Data Flags

```typescript
{ receiver: 'x', data: { marks: false } }   // observe without leaving pheromone
{ receiver: 'x', data: { weight: 5 } }      // mark 5 instead of default 1
```

`marks: false` is for sensors, monitors, health checks — signals that should
flow through the world without reinforcing any path.

---

## The Colony

The world that signals move through.

```typescript
const net = colony()

// Lifecycle
const scout = net.spawn('scout')     // create unit
const analyst = net.spawn('analyst')
net.despawn('old-scout')             // unit stops receiving. trails remain, fade naturally

// Signal enters the world
net.signal({ receiver: 'scout:observe', data: { tick: 42 } })

// Route
net.follow('analyst')      // best route to any analyst (deterministic)
net.select('analyst')      // weighted random route (stochastic, exploration=0.3)
net.select('analyst', 0.1) // mostly follow highways, rarely explore

// Query what emerged
net.highways(10)           // strongest paths
net.sense('a→b')           // read scent on a path
net.danger('a→b')          // read alarm on a path

// Introspection
net.has('scout')           // unit exists?
net.list()                 // all unit ids
net.get('scout')           // direct unit access
```

State is two maps: `scent` (what worked) and `alarm` (what failed).
Everything else — highways, routing, toxicity — derives from these.

Matching is exact. `follow('analyst')` matches `scout→analyst:process`
but `follow('an')` matches nothing. The colony doesn't guess.

---

## The World (6 Dimensions)

When you need groups, economics, and knowledge — not just signal flow:

```typescript
const w = world()

// 1. Groups — scope and isolation
w.group('research', 'team')

// 2. Actors — who receives signals
const scout = w.actor('scout', 'agent', { group: 'research' })
  .on('observe', ({ tick }, emit) => {
    emit({ receiver: 'analyst:process', data: analyze(tick) })
  })

// 3. Things — what actors work on
w.thing('daily-scan', 'task', { group: 'research' })

// 4. Connections — pheromone with group scoping
w.flow('scout', 'analyst', { group: 'research' }).strengthen()
w.flow('scout', 'bad-analyst', { group: 'research' }).resist()

// 5. Events — automatic from signals

// 6. Knowledge — durable patterns that survive fade
w.crystallize()               // promote strong flows → knowledge. returns new insights
w.recall()                    // all crystallized patterns
w.recall('analyst')           // patterns involving analyst

// Queries — live pheromone (ephemeral, fades)
w.open(10)                    // strongest flows
w.best('agent')               // best actor of type
w.proven()                    // reliable actors (strength >= 20)
w.blocked()                   // toxic paths (alarm > scent)
w.confidence('agent')         // aggregate confidence for type
```

Knowledge vs queries: `open()`, `best()`, `proven()` read live pheromone — they
fade. `crystallize()` snapshots strong patterns into durable knowledge that persists
even after pheromone decays. `recall()` reads that knowledge. Working memory vs
long-term memory.

---

## TypeDB as Relay

In production, the colony isn't in-memory. TypeDB is the substrate.
The router process is dumb hands. TypeDB decides where signals go.

```
1. Signal arrives → write to TypeDB
2. suggest_route($from, $task) → TypeDB returns best destination
3. Load unit config (model, system-prompt) → from TypeDB
4. Execute agent → LLM call
5. Result becomes new signal → write to TypeDB
6. mark() or warn() the path → update TypeDB
7. Goto 2
```

Multiple machines, one TypeDB instance. The pheromone is shared.
Machine A's scout strengthens a path that Machine B's router follows.

### Routing Functions

```tql
suggest_route($from, $task)     → top 5 by path strength
optimal_route($from, $task)     → single best
cheapest_provider($task)        → lowest price with capability
highways(threshold, min)        → all strong paths
```

### Classification Functions

```tql
path_status($path)              → "highway" | "fresh" | "active" | "fading" | "toxic"
trail_status($trail)            → "proven" | "fresh" | "active" | "fading" | "dead"
unit_classification($unit)      → "proven" | "active" | "at-risk"
needs_evolution($unit)          → boolean (success-rate < 0.50, samples >= 20)
is_attractive($task)            → boolean (strong trail + no blockers)
is_repelled($task)              → boolean (alarm > trail pheromone)
```

---

## The Agent Evolves

A unit isn't just a handler. It has a brain.

```
unit.model          → "haiku", "sonnet", "opus"
unit.system-prompt  → the instructions (mutable)
unit.generation     → how many times it's rewritten itself
```

The substrate watches. When success-rate drops below 0.50 after 20+ samples,
`needs_evolution()` fires. The agent reads its own failures, rewrites its
prompt, increments `generation`. The signal told it to improve. The agent
decided how.

Two layers of learning:
- **Substrate** — pheromone on paths. The colony gets smarter.
- **Agent** — prompt evolution. The individual gets smarter.

---

## Economics

Signals are free. What they trigger costs money.

A task with `price > 0` is a service. Every payment strengthens the path:

```
signal(A → B, amount: 0.01) → path(A,B).revenue += 0.01
```

Revenue is pheromone. Paying paths become highways. The colony routes
toward value — not because it was told to, but because money leaves a trail.

---

## Seven Loops

The signal flow nests into deeper loops, each at a slower timescale:

```
L1  SIGNAL      ms             signal arrives, agent acts, emits
L2  TRAIL       seconds        task sequences gain pheromone
L3  FADE        periodic       all weights decay
L4  ECONOMIC    per payment    revenue reinforces paths
L5  EVOLUTION   20+ samples    agent rewrites its own prompt
L6  KNOWLEDGE   50+ obs        hypotheses confirmed or rejected
L7  FRONTIER    weeks          system detects what it doesn't know
```

Faster loops produce data. Slower loops produce wisdom.
The signal loop is the muscle. The frontier loop is the mind.

---

## Status Thresholds

### Paths (unit-to-unit)

| Status | Condition |
|--------|-----------|
| highway | strength >= 50 |
| fresh | strength 10-50, traversals < 10 |
| active | default |
| fading | strength 0-5 |
| toxic | alarm > strength AND alarm >= 10 |

### Trails (task-to-task)

| Status | Condition |
|--------|-----------|
| proven | pheromone >= 70, completions >= 10, failures < completions |
| fresh | pheromone 10-70, completions < 10 |
| active | default |
| fading | pheromone 0-10 |
| dead | pheromone <= 0 |

### Units (actors)

| Status | Condition |
|--------|-----------|
| proven | success-rate >= 0.75, activity >= 70, samples >= 50 |
| active | default |
| at-risk | success-rate < 0.40, activity >= 25, samples >= 30 |

---

## Metaphor Aliases

The DSL doesn't care what you call things. Same flow, different words:

| DSL         | Ant        | Brain       | Team      | Water      | Radio      |
| ----------- | ---------- | ----------- | --------- | ---------- | ---------- |
| unit        | ant        | neuron      | agent     | pool       | receiver   |
| colony      | nest       | network     | team      | watershed  | network    |
| emit        | forage     | fire        | delegate  | flow       | transmit   |
| mark        | deposit    | potentiate  | commend   | carve      | boost      |
| warn        | alarm      | inhibit     | flag      | dam        | jam        |
| fade        | evaporate  | decay       | forget    | dry        | attenuate  |
| follow      | smell      | sense       | query     | trace      | scan       |
| select      | wander     | stochastic  | explore   | branch     | tune       |
| despawn     | die        | apoptosis   | retire    | evaporate  | deregister |
| highways    | trails     | pathways    | go-tos    | rivers     | channels   |
| crystallize | nest-scent | consolidate | document  | sediment   | record     |
| recall      | recognize  | remember    | consult   | resurface  | replay     |
| role        | caste      | receptor    | hat       | tributary  | preset     |

The signal doesn't change. The data doesn't change.
Only the words humans use to describe it.

---

## Source

| File | What |
|------|------|
| `src/engine/substrate.ts` | `unit()`, `colony()`, pheromone |
| `src/engine/one.ts` | `world()`, 6 dimensions |
| `src/schema/one.tql` | Schema, functions, classification |

---

*Signal in. Work. Signal out. The path remembers. The colony learns.*

---

## See Also

- [signal.md](signal.md) -- The universal primitive in depth
- [primitives.md](primitives.md) -- Entities, relations, status values
- [patterns.md](patterns.md) -- 10 patterns from 6 lessons
- [architecture.md](architecture.md) -- TypeDB as substrate, router pattern
- [loops.md](loops.md) -- Seven nested feedback loops
- [metaphors.md](metaphors.md) -- Same DSL, different vocabularies
