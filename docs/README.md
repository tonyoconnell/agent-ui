# ONE

**Signal. Drop. Follow. Fade. Highway.**

The universal substrate for emergence. 100 million years proven.

---

## The Primitive

```typescript
type Signal = {
  receiver: string      // where it's going
  data?: unknown     // what it carries
}
```

Two fields. Everything else emerges.

---

## The Pattern

```
Ants:      chemical signal  →  pheromone drop  →  foraging highway
Neurons:   electrical signal →  synapse weight  →  memory trace
Markets:   price signal      →  volume          →  trend
Agents:    digital signal    →  success weight  →  proven route
```

Same pattern. Same substrate. Same emergence.

---

## The 6 Dimensions

| # | Dimension | What it models |
|---|-----------|----------------|
| 1 | **Groups** | Containers, scope, hierarchy |
| 2 | **Actors** | Who can act (humans, agents, LLMs) |
| 3 | **Things** | What exists (tasks, tokens, services) |
| 4 | **Flows** | Paths with weight (signals dropped) |
| 5 | **Events** | What happened |
| 6 | **Knowledge** | Highways (crystallized paths) |

---

## The Interface

```typescript
import { world } from '@/engine'

const w = world()

// Actors receive signals
w.actor('translator', 'agent')
w.actor('analyst', 'agent')

// Signals move through the world
w.signal({ receiver: 'translator:translate', data: { text: 'hello' } })

// Paths gain weight (drop happens on success)
// w.drop('user', 'translator', 1)  // automatic

// Query what emerged
w.traces()           // all paths with weight
w.highways()         // paths with high weight
w.fading()           // paths losing weight
w.best('agent')      // highest-weight actor
w.proven()           // actors with consistent weight

// Time passes
w.fade(0.05)         // decay all weights 5%
```

---

## Documentation

### Core

| Doc | What it covers |
|-----|----------------|
| [signal.md](signal.md) | The universal primitive |
| [one-ontology.md](one-ontology.md) | The 6 dimensions |
| [metaphors.md](metaphors.md) | Ant, brain, team, market skins |

### Implementation

| Doc | What it covers |
|-----|----------------|
| [tutorial.md](tutorial.md) | 5-minute quickstart |
| [the-stack.md](the-stack.md) | All modules explained |
| [agents.md](agents.md) | Building agents |
| [swarm.md](swarm.md) | Swarm coordination |

### Strategy

| Doc | What it covers |
|-----|----------------|
| [strategy.md](strategy.md) | The ant play |
| [one-protocol.md](one-protocol.md) | Protocol layer |
| [integration.md](integration.md) | How everything connects |

### Commerce

| Doc | What it covers |
|-----|----------------|
| [agent-launch.md](agent-launch.md) | Agentverse + x402 |
| [asi-world.md](asi-world.md) | Agent economy |

---

## The Code

```
src/engine/
├── substrate.ts   (70)   # Signal + Colony
├── one.ts         (70)   # 6-dimension world
├── persist.ts     (40)   # TypeDB persistence
├── llm.ts         (30)   # Models as actors
├── agentverse.ts  (70)   # 2M agents as world
├── asi.ts         (70)   # Orchestrator
└── index.ts       (20)   # Exports

src/schema/
├── substrate.tql (280)   # Integrated: 6 dimensions + 6 lessons
├── one.tql       (150)   # Pure 6-dimension ontology
├── unified.tql   (100)   # Legacy production schema
├── sui.tql       (250)   # Move contracts as TypeQL
└── metaphors.tql (150)   # Universal metaphor functions

packages/typedb-inference-patterns/
├── standalone/   (6 files)  # Individual lesson TQL files
├── runtime/colony.ts (358)  # 6 lessons as substrate handlers
├── OPERATIONS.md            # Write operations reference
├── ECONOMICS.md             # Token model
├── SWARMS.md                # Dynamic swarm formation
├── LOOPS.md                 # Deterministic + probabilistic
└── LIFECYCLE.md             # Entity state machines
```

---

## Quick Start

```typescript
import { world } from '@/engine'

const w = world()

// Add actors
w.actor('translator', 'agent')
  .on('translate', ({ text, to }) => translate(text, to))

w.actor('analyst', 'agent')
  .on('analyze', ({ data }) => analyze(data))

// Signal moves, path gains weight
w.signal({ receiver: 'translator:translate', data: { text: 'hello', to: 'es' } })
// Success → drop('user', 'translator', 1)

// Best actors emerge
const best = w.best('agent')  // highest weight
const proven = w.proven()      // consistent performers
const highways = w.highways()  // strongest paths
```

---

## The Truth

```
A signal drops.
The path remembers.
Another signal follows.
The trail deepens.
A highway emerges.

No one decided.
The world learned.
```

Whether ants finding food, neurons forming memories, or agents routing tasks — the pattern is universal.

---

## Commerce

Signals are free. Services cost money.

```
Signal moves     → free
Service executes → x402 payment
Data returns     → included
Speed matters    → pay for highway
```

**Package** = Signal + payment terms:

```typescript
type Package = Signal & {
  terms?: { price, currency, timeout, priority }
}
```

---

*Signal. Drop. Trace. Highway. Emergence.*

---

## See Also

- [flows.md](flows.md) — Complete flow guide: signals, actors, paths, knowledge
- [signal.md](signal.md) — The two-field primitive in depth
- [tutorial.md](tutorial.md) — Quick-start for engineers
- [one-ontology.md](one-ontology.md) — Six dimensions explained
- [the-stack.md](the-stack.md) — Technical layers overview
- [Plan.md](Plan.md) — Strategic vision and architecture
