# ONE

**Signal. Mark. Warn. Follow. Fade. Highway.**

The universal substrate for emergence. Two dictionaries. Arithmetic. One probabilistic step.

---

## The Primitive

```typescript
type Signal = { receiver: string; data?: unknown }
```

Two fields. Everything else emerges.

---

## The Pattern

```
Ants:      chemical signal  →  pheromone trail  →  foraging highway
Neurons:   electrical spike →  synapse weight   →  memory trace
Markets:   price signal     →  volume           →  trend
Agents:    digital signal   →  path strength    →  proven route
```

Same pattern. Same substrate. Same emergence.

---

## The Power

**The LLM is the only probabilistic component. Everything else is math.**

```
Traditional AI:  AI filter → AI router → AI model → AI scorer → AI filter
                 Five probabilistic layers. 99% each = 95% system accuracy.

ONE substrate:   TypeDB check → LLM → outcome measurement
                 One probabilistic step. Everything else is deterministic.
```

Three things no one has combined before:

1. **The system makes itself unnecessary.** Every LLM success creates a deterministic path. Highways don't need the LLM. Cost drops over time. The world replaces the LLM.

2. **Security and learning are the same mechanism.** `warn()` is simultaneously a firewall (resistance → toxic → dissolve) and a lesson (world routes around → finds alternatives). No separate security layer.

3. **The strength IS the model.** `mark()` = weight update. `warn()` = negative reward. `fade()` = regularization. `select()` = inference. No training pipeline. Usage IS training.

---

## The 6 Dimensions

| # | Dimension | What | TypeDB | Runtime |
|---|-----------|------|--------|---------|
| 1 | **Groups** | Scope, hierarchy | group, membership | tag-based |
| 2 | **Actors** | Who acts | unit (model, prompt, generation) | `.add()` |
| 3 | **Things** | What's offered | skill + tags + price | `.on()` handler |
| 4 | **Paths** | Connections | path (strength, resistance, revenue) | strength/resistance maps |
| 5 | **Events** | What happened | signal (data, amount, success) | signal flow |
| 6 | **Knowledge** | What emerged | hypothesis, frontier, objective | know/recall |

---

## The Interface

```typescript
import { world } from '@/engine'

const w = world()

// Actors receive signals
w.actor('translator', 'llm')
  .on('translate', async ({ text, to }) => translate(text, to))
  .then('translate', r => ({ receiver: 'reviewer:check', data: r }))

w.actor('reviewer', 'agent')
  .on('check', async ({ text }) => review(text))

// Signal moves through the world
w.signal({ receiver: 'translator:translate', data: { text: 'hello', to: 'es' } })
// → translator runs → .then fires → reviewer runs
// → mark() on each delivery → paths strengthen
// → fade() over time → unused paths dissolve
// → highways emerge → proven routes

// Ask and get a typed outcome
const { result, timeout, dissolved } = await w.ask(
  { receiver: 'translator:translate', data: { text: 'hello' } }
)

// Query what emerged
w.highways(10)       // proven paths
w.open(10)           // top paths as {from, to, strength}
w.blocked()          // toxic paths (resistance > 2x strength)
w.know()             // promote highways to permanent knowledge
w.recall('translate') // query hypotheses from TypeDB
```

---

## The Engine (670 lines)

```
src/engine/
├── substrate.ts  (226)   Unit + Colony + pheromone + queue + ask
├── one.ts        (187)   World = Colony + TypeDB + deterministic sandwich
├── loop.ts       (164)   Growth tick: 7 loops, chain depth, 4 outcome types
├── boot.ts        (40)   Hydrate + spawn + tick
├── llm.ts         (40)   LLM as unit (anthropic/openai)
└── index.ts       (13)   Exports
```

## The Schema (~300 lines)

```
src/schema/
└── one.tql               6 dimensions + validation functions + classification
    entities:             group, unit, skill, hypothesis, frontier, objective
    relations:            path, capability, membership, signal, hierarchy, adds
    validation:           can_receive, is_safe, preflight, unit_exists, is_trustworthy
    classification:       path_status, unit_classification, needs_evolution
    routing:              suggest_route, optimal_route, cheapest_provider
```

---

## The Tick

Every tick makes the colony smarter:

```
L1  select() → ask() → { result | timeout | dissolved }    per tick
L2  mark(edge, chainDepth) or warn(edge)                   per outcome
L3  fade(0.05) — resistance decays 2x faster                    every 5 min
L4  revenue += price on successful paths                    per payment
L5  evolve: rewrite prompts (24h cooldown, history saved)   every 10 min
L6  know + auto-hypothesize (strong/fading paths)    every hour
L7  frontier detection from unexplored tag clusters         every hour
```

---

## Claude Code Integration

```
/work       Autonomous loop: sense → select → execute → mark → repeat
/next       Pick one task and do it
/tasks      See tasks by category + tags
/add-task   Create tagged skill
/done       Mark outcome, reinforce trail
/grow       Run one growth tick
/highways   Proven paths and frontiers
/know       Crystallize paths to permanent knowledge
```

---

## Documentation

### Core

| Doc | What |
|-----|------|
| [llms.md](llms.md) | The deterministic sandwich. Why the LLM is the only probabilistic component. |
| [llm-training.md](llm-training.md) | Five integration points. Training IS routing. |
| [task-management.md](task-management.md) | Tasks as signals. Tags classify. Pheromone ranks. |
| [loops.md](loops.md) | Seven nested feedback loops. |
| [events.md](events.md) | The universal primitive. |
| [one-ontology.md](one-ontology.md) | The 6 dimensions. |
| [claude-code-integration.md](claude-code-integration.md) | Claude Code as a unit in the colony. |

### Architecture

| Doc | What |
|-----|------|
| [substrate-learning.md](substrate-learning.md) | How pheromone IS the model. |
| [metaphors.md](metaphors.md) | Ant, brain, team, market skins. |
| [patterns.md](patterns.md) | Pheromone, routing, task selection, evolution. |
| [DSL.md](DSL.md) | The ONE language — five verbs. |

### Strategy

| Doc | What |
|-----|------|
| [strategy.md](strategy.md) | The ant play — three fronts. |
| [one-protocol.md](one-protocol.md) | Protocol layer. |
| [revenue.md](revenue.md) | Five revenue layers. |
| [SUI.md](SUI.md) | Move contracts — linearity, enforcement. |

---

## The Truth

```
A signal lands.
The path remembers.
Another signal follows.
The trail deepens.
A highway emerges.

No one decided.
The world learned.

The LLM bootstrapped it.
The colony replaced it.
Intelligence is the elimination of guessing.
```

---

*ONE. Two fields. Two dictionaries. Arithmetic. Emergence.*
