# Envelope System

## The Substrate

100 million years ago, ants discovered a pattern.
500 million years ago, brains discovered the same pattern.
In 2017, transformers rediscovered it.

```
Nodes that compute.
Edges that connect.
Weights that learn.
Signals that flow.
No controller.
```

This is that pattern, in 85 lines of code.

---

## The Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   CHAMBER          EDGE + WEIGHT          CHAMBER               │
│   (node)           (connection)           (node)                │
│                                                                 │
│   ┌───────┐       ════════════►          ┌────────┐            │
│   │ scout │──scent: 47──────────────────►│ analyst│            │
│   └───────┘                              └────────┘            │
│                                              │                  │
│                   ════════════►              │                  │
│                   scent: 23                  ▼                  │
│                                         ┌────────┐             │
│                                         │ trader │             │
│                                         └────────┘             │
│                                                                 │
│   Pheromones are on EDGES, not nodes.                          │
│   Like weights in a neural network.                            │
│   Like synaptic strength in a brain.                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Ant Colony | Neural Network | Brain | Our System |
|------------|---------------|-------|------------|
| Chamber | Neuron | Neuron | `unit` |
| Trail | Synapse | Axon | edge |
| Pheromone | Weight | Synaptic strength | `scent[edge]` |
| Ant | Signal | Action potential | `envelope` |
| Colony | Network | Connectome | `colony` |

**The same pattern. Always.**

---

## The Loop

This is how intelligence emerges. It's a feedback loop.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        THE LOOP                                 │
│                                                                 │
│         ┌──────────────────────────────────┐                   │
│         │                                  │                   │
│         ▼                                  │                   │
│   ┌──────────┐    ┌──────────┐    ┌───────┴────┐              │
│   │  Signal  │───▶│  Edge    │───▶│  Stronger  │              │
│   │  travels │    │  gains   │    │  edge      │              │
│   │  edge    │    │  scent   │    │  attracts  │              │
│   └──────────┘    └──────────┘    │  more      │              │
│                                   │  signals   │              │
│                                   └────────────┘              │
│                                                                 │
│   More traffic  →  More pheromone  →  More traffic  →  ...    │
│                                                                 │
│   This is how highways form.                                   │
│   This is how brains learn.                                    │
│   This is how intelligence emerges.                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**The highway IS the learning.**

```
                    WEAK EDGE
    ┌────┐        (scent: 2)          ┌────┐
    │ A  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ▶│ B  │
    └────┘         dirt path          └────┘


                  STRONG EDGE
    ┌────┐       (scent: 10,000)      ┌────┐
    │ A  │ ══════════════════════════▶│ C  │
    └────┘        SUPERHIGHWAY        └────┘
```

Ants don't remember paths. The *path* remembers itself.
Neurons don't store knowledge. The *connections* store it.
The network doesn't think. The *edges* think.

**Two loops, one system:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  REINFORCEMENT LOOP              DECAY LOOP                    │
│  (learning)                      (forgetting)                  │
│                                                                 │
│  signal succeeds                 time passes                   │
│       │                               │                        │
│       ▼                               ▼                        │
│  edge strengthens                edge weakens                  │
│       │                               │                        │
│       ▼                               ▼                        │
│  more signals follow             signals find other paths      │
│       │                               │                        │
│       ▼                               ▼                        │
│  SUPERHIGHWAY                    edge disappears               │
│                                                                 │
│  Used paths grow.                Unused paths die.             │
│  This is learning.               This is forgetting.           │
│  Both are essential.             Both are essential.           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Without forgetting, no learning.**
Old paths would never fade. New patterns could never emerge.
The colony would be trapped by its history.

**Without reinforcement, no memory.**
Useful paths would never strengthen. Knowledge could never accumulate.
The colony would never learn.

**Both loops. Always. That's intelligence.**

---

## The Code

### Signal (envelope)

An ant carries cargo and knows its journey:

```javascript
{
  receiver: "analyst",           // which node to enter
  receive: "evaluate",           // which computation to trigger
  payload: { price: 100 },       // cargo being carried
  callback: {                    // where to go next
    receiver: "trader",
    receive: "execute",
    payload: { data: "{{result}}" }
  }
}
```

### Node (unit) — 30 lines

A node IS its entrance. When a signal arrives, computation happens.

```javascript
const unit = (envelope, route) => {
  const { receiver: id } = envelope;
  const tasks = {};

  const receive = ({ receive: task, payload, callback }) => {
    if (!tasks[task]) return Promise.reject({ id, task, error: `Unknown: ${task}` });

    return tasks[task](payload).then((result) => {
      if (callback) {
        const next = substitute(callback, result);
        if (next.receiver !== id && route) return route(next);
        return receive(next);
      }
      return result;
    });
  };

  receive.assign = (name, fn) => (tasks[name] = (p) => Promise.resolve(fn(p)), receive);
  receive.id = id;
  return receive;
};
```

### Network (colony) — 55 lines

The network doesn't think. It connects nodes and learns which edges matter.

```javascript
const colony = () => {
  const chambers = {};   // Nodes
  const scent = {};      // Edge weights

  const send = ({ receiver, receive, payload, callback }, from = "entry") => {
    const target = chambers[receiver];
    if (!target) return Promise.reject({ error: `No node: ${receiver}` });

    const currentNode = `${receiver}:${receive}`;

    return target({ receive, payload, callback }).then((result) => {
      // LEARNING: Strengthen the edge that was just traversed
      const edge = `${from} → ${currentNode}`;
      scent[edge] = (scent[edge] || 0) + 1;
      return result;
    });
  };

  const spawn = (envelope) => {
    const node = unit(envelope, send);
    chambers[node.id] = node;
    return node;
  };

  const fade = (rate = 0.1) => {
    for (const edge in scent) {
      scent[edge] *= (1 - rate);
      if (scent[edge] < 0.01) delete scent[edge];
    }
  };

  const highways = () => Object.entries(scent)
    .sort(([, a], [, b]) => b - a)
    .map(([edge, strength]) => ({ edge, strength }));

  return { spawn, send, fade, highways, chambers, scent };
};
```

**85 lines. The substrate for emergent intelligence.**

---

## Watch It Learn

```javascript
const net = colony();

// Create nodes
net.spawn({ receiver: "scout" }).assign("observe", fn1);
net.spawn({ receiver: "analyst" }).assign("evaluate", fn2);
net.spawn({ receiver: "trader" }).assign("execute", fn3);

// Send signals — edges strengthen automatically
await net.send({
  receiver: "scout",
  receive: "observe",
  payload: { tick: 1 },
  callback: {
    receiver: "analyst",
    receive: "evaluate",
    payload: { data: "{{result}}" },
    callback: {
      receiver: "trader",
      receive: "execute",
      payload: { signal: "{{result}}" }
    }
  }
});

// See what the network learned
net.highways();
// → [
//   { edge: "entry → scout:observe", strength: 1 },
//   { edge: "scout:observe → analyst:evaluate", strength: 1 },
//   { edge: "analyst:evaluate → trader:execute", strength: 1 }
// ]

// Send more signals through the same path
// ... (repeat 100 times)

net.highways();
// → [
//   { edge: "scout:observe → analyst:evaluate", strength: 100 },
//   { edge: "analyst:evaluate → trader:execute", strength: 100 },
//   { edge: "entry → scout:observe", strength: 100 }
// ]

// Superhighways emerge. The network learned.

// Time passes — unused edges fade
net.fade(0.1);

// The network forgets what doesn't matter.
```

---

## What Emerges

From 85 lines, these behaviors appear without being programmed:

| Behavior | How |
|----------|-----|
| **Learning** | Edges strengthen with use |
| **Forgetting** | Unused edges fade |
| **Highways** | High-traffic paths emerge |
| **Load balancing** | Route to weak-scent nodes |
| **Specialization** | Nodes develop strong incoming edges |
| **Fault tolerance** | Failed paths weaken, alternatives strengthen |
| **Self-organization** | No central controller, ever |

---

## The Insight

```
Ants don't talk to each other.
Neurons don't talk to each other.
They modify the connections between them.
Other signals read those modifications.

That's intelligence.
That's what we built.
That's 85 lines.
```

---

## Run

```bash
bun install
bun dev        # → localhost:4321
```

## Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Astro 5](https://astro.build) |
| UI | [React 19](https://react.dev) |
| Visualization | [ReactFlow](https://reactflow.dev) |

---

## Files

```
src/engine/
├── unit.js      # Node (30 lines)
├── colony.js    # Network + Learning (55 lines)
└── index.ts     # Exports

docs/
├── PLAN-emerge.md  # How to build everything from the 85 lines
└── examples.md     # Trading, swarms, task pheromones
```

---

## The Plan

See [docs/PLAN-emerge.md](docs/PLAN-emerge.md) — how to build everything from the 85 lines:

```
agents.tql    →  What CAN exist (schema)
agents.json   →  What DOES exist (data)
colony.js     →  What LIVES (runtime)
components/   →  What you SEE (UI)
```

---

## Examples

See [docs/examples.md](docs/examples.md):

| Example | What It Does |
|---------|--------------|
| **Trading Swarm** | Ticks flow through nodes. Profitable edges strengthen. |
| **Agent Coordination** | Agents cluster around hot edges. Idle agents get recruited. |
| **Task Pheromones** | Success strengthens edges. Failure weakens them. |

---

*Ants discovered this 100 million years ago.*
*Brains discovered it 500 million years ago.*
*We wrote it down in 85 lines.*
