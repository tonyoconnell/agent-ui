# ONE

6 dimensions. 220 lines. The substrate for intelligence.

## The Vision

```
Reality doesn't change. Technology does.
Model reality once. Map everything to it.
```

## The 6 Dimensions

| # | Dimension | What it models |
|---|-----------|----------------|
| 1 | **Groups** | Containers, scope, hierarchy |
| 2 | **Actors** | Who can act (humans, agents, LLMs) |
| 3 | **Things** | What exists (tasks, tokens, services) |
| 4 | **Flows** | Relationships with strength/resistance |
| 5 | **Events** | What happened |
| 6 | **Knowledge** | Crystallized patterns |

## The Interface

```typescript
import { world } from '@fetchai/world'

const w = world()

w.group('acme', 'org')                    // 1. Groups
w.actor('agent-1', 'agent')               // 2. Actors
w.thing('task-1', 'task')                 // 3. Things
w.flow('user', 'agent-1').strengthen(1)   // 4. Flows
// Events automatic                        // 5. Events
w.crystallize()                           // 6. Knowledge

w.open(10)           // Strongest flows
w.blocked()          // Flows to avoid
w.best('agent')      // Best actor for type
w.proven()           // Proven actors
w.confidence('task') // How well we know
```

## Documentation

### Core Concepts

| Doc | What it covers |
|-----|----------------|
| [one-ontology.md](one-ontology.md) | The 6 dimensions, schema, why it works |
| [metaphors.md](metaphors.md) | ONE as meta-metaphor (ant, brain, team, etc.) |
| [world.md](world.md) | World metaphor — ants, humans, agents |

### Implementation

| Doc | What it covers |
|-----|----------------|
| [tutorial.md](tutorial.md) | 5-minute quickstart |
| [agents.md](agents.md) | Building agents (Actors) |
| [swarm.md](swarm.md) | Swarms and coordination patterns |
| [the-stack.md](the-stack.md) | All modules explained |
| [framework.md](framework.md) | TypeQL to JSON to UI with metaphor skins |

### Integration

| Doc | What it covers |
|-----|----------------|
| [integration.md](integration.md) | How everything connects |
| [agent-launch.md](agent-launch.md) | Agentverse + ONE |
| [asi-world.md](asi-world.md) | Agent economy as ONE world |

### AI/ML

| Doc | What it covers |
|-----|----------------|
| [substrate-learning.md](substrate-learning.md) | How trails train models |
| [ai-training.md](ai-training.md) | Training and inference with ONE |

### Reference

| Doc | What it covers |
|-----|----------------|
| [ontology.md](ontology.md) | TypeDB schema details |

## The Code

```
src/engine/
├── substrate.ts   (70)   # Unit + Colony + Envelope
├── one.ts         (70)   # 6-dimension world interface
├── persist.ts     (40)   # TypeDB persistence
├── llm.ts         (30)   # Models as actors
├── agentverse.ts  (70)   # 2M agents as world
├── asi.ts         (70)   # Orchestrator
└── index.ts       (20)   # Exports

src/schema/
├── one.tql       (150)   # 6-dimension schema
└── unified.tql   (100)   # Production schema

~400 lines total
```

## The Projects

| Project | Role |
|---------|------|
| `envelopes` | Runtime (this repo) |
| `ants-at-work` | ONE ontology source |
| `agent-launch-toolkit` | Agent economy application |

## Quick Start

```typescript
import { world } from '@fetchai/world'

// Create a world
const w = world()

// Add actors
w.actor('translator', 'agent')
w.actor('coder', 'agent')

// Interactions create flows
async function handle(user: string, task: string, agent: string) {
  try {
    const result = await execute(agent, task)
    w.flow(user, agent).strengthen(1)  // Success
    return result
  } catch (e) {
    w.flow(user, agent).resist(1)      // Failure
    throw e
  }
}

// Discovery uses flows
function discover(task: string) {
  return w.best(classify(task))
}

// Best agents emerge automatically
```

## The Truth

```
ONE models reality:
  Groups contain.
  Actors act.
  Things exist.
  Flows connect.
  Events happen.
  Knowledge crystallizes.

Whether ants finding food,
humans building companies,
or agents completing tasks.

The pattern is universal.
The ontology is ONE.
```

---

*6 dimensions. 220 lines. ONE.*
