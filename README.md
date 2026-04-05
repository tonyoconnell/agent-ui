# The Substrate

**~90 lines. Two fields. Queue. Zero returns. AI agents.**

```
receiver: who
data: what

That's all that flows.
```

---

## The Pattern

100 million years ago, ants discovered it.
500 million years ago, brains discovered it.
In 2017, transformers rediscovered it.

```
Nodes that compute.
Edges that connect.
Weights that learn.
Signals that flow.
No controller.
```

---

## Two Layers

```
NERVOUS SYSTEM (runtime)         BRAIN (TypeDB)
─────────────────────            ──────────────
signals move                     paths persist
units receive                    units persist
handlers run                     signals recorded
continuations chain              classification inferred
strength/resistance accumulate   evolution detected
queue holds work                 knowledge crystallizes

loops L1-L3 (ms-min)            loops L4-L7 (hours-weeks)
```

The runtime handles what moves. TypeDB handles what remains.

---

## The Signal

```typescript
{ receiver: string, data?: unknown }
```

Two fields. That's it.

- `receiver: "scout"` — send to scout's default handler
- `receiver: "scout:observe"` — send to scout's observe handler
- `data` — anything

---

## The Unit

```typescript
net.add('scout')
  .on('observe', (data, emit, ctx) => {
    // data: the data
    // emit: send more signals
    // ctx: { from, self }
    return { observed: data.tick }
  })
  .then('observe', result => ({
    receiver: 'analyst:evaluate',
    data: result
  }))
```

Tasks are `.on()` handlers. Dependencies are `.then()` continuations.
No task entities. No dependency relations. Pheromone accumulates automatically.

| Method | Purpose |
|--------|---------|
| `.on(name, fn)` | Define a handler (task) |
| `.then(name, tmpl)` | Define continuation (dependency) |
| `.role(name, task, ctx)` | Context-bound handler |

---

## The World

```typescript
const net = world()

net.add('scout')      // create unit
net.signal(sig)       // send signal (marks pheromone)
net.enqueue(sig)      // queue for later
net.drain()           // process queued signal
net.mark(edge)        // strengthen path
net.warn(edge)        // weaken path
net.select()          // probabilistic pick (ant-like)
net.fade(0.1)         // decay (resistance 2x faster)
net.highways(10)      // see what emerged
```

---

## The Persist

```typescript
const p = persist()

p.actor('scout', 'agent')  // add + persist to TypeDB
p.flow('scout', 'analyst') // mark/warn wrapper
  .strengthen(5)

p.open(10)                 // top paths
p.blocked()                // toxic paths
p.know()                   // promote highways to knowledge
p.recall('scout')          // query knowledge from TypeDB
```

---

## The Tick

```typescript
const next = net.select()           // follow pheromone
next && net.signal({ receiver: next }) // execute
net.drain()                          // process queue
net.fade(0.05)                       // decay
// evolve every 10min, crystallize every hour
```

---

## The Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  REINFORCEMENT                    DECAY                         │
│  (learning)                       (forgetting)                  │
│                                                                 │
│  signal succeeds                  time passes                   │
│       │                                │                        │
│       ▼                                ▼                        │
│  path strengthens                 path weakens                  │
│       │                                │                        │
│       ▼                                ▼                        │
│  more signals follow              signals find other paths      │
│       │                                │                        │
│       ▼                                ▼                        │
│  HIGHWAY                          path dissolves                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Emerges

| Behavior | How |
|----------|-----|
| **Learning** | Paths strengthen with use |
| **Forgetting** | Unused paths fade |
| **Highways** | High-traffic paths emerge |
| **Load balancing** | Probabilistic routing by scent |
| **Fault tolerance** | Failed paths weaken (alarm) |
| **Self-organization** | No controller |
| **Evolution** | Agents rewrite their own prompts |
| **Knowledge** | Highways crystallize into hypotheses |

---

## Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Astro 5](https://astro.build) |
| UI | [React 19](https://react.dev) |
| Visualization | [ReactFlow](https://reactflow.dev) |
| Brain | [TypeDB 3.0](https://typedb.com) |

## Files

```
src/engine/
├── world.ts       # ~90 lines — unit, world, pheromone, queue
├── persist.ts     # ~40 lines — persist (TypeDB bridge)
├── loop.ts        # ~76 lines — tick (select, signal, fade, evolve)
├── async.ts       # ~90 lines — TypeDB sync
├── boot.ts        # ~37 lines — hydrate + start
├── asi.ts         # orchestrator
├── llm.ts         # LLM as unit
├── agentverse.ts  # 2M agents
└── index.ts       # exports

src/schema/
└── world.tql      # ~230 lines — the brain
```

---

## Run

```bash
npm install
npm run dev        # → localhost:4321
```

---

## The Insight

```
Ants don't talk to each other.
Neurons don't talk to each other.
They modify the connections between them.
Other signals read those modifications.

That's intelligence.
That's what this is.

~90 lines.
Two fields.
Build everything.
```

---

## Docs

- [Dictionary](docs/dictionary.md) — Every name, how they connect, the full journey
- [DSL](docs/DSL.md) — The programming model
- [Architecture](docs/architecture.md) — TypeDB as substrate
- [Metaphors](docs/metaphors.md) — Same system, different words
- [Ontology](docs/one-ontology.md) — The 6 dimensions
