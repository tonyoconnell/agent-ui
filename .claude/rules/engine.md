# Engine Development Rules

Apply when working with `src/engine/*.ts` or `src/engine/*.js` files.

## The Substrate

This is the pattern that ants discovered 100 million years ago.
The same pattern brains use. The same pattern neural networks use.

```
Nodes that compute.
Edges that connect.
Weights that learn.
Signals that flow.
No controller.
```

**85 lines. The foundation of emergent AI.**

## The Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   NODE             EDGE + WEIGHT           NODE                 │
│   (chamber)        (trail + scent)         (chamber)            │
│                                                                 │
│   ┌───────┐       ════════════►           ┌────────┐           │
│   │ scout │──strength: 47────────────────►│ analyst│           │
│   └───────┘                               └────────┘           │
│                                                                 │
│   Weights are on EDGES, not nodes.                             │
│   Like synapses in a brain.                                    │
│   Like attention in transformers.                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Ant Colony | Neural Network | Our System |
|------------|---------------|------------|
| Chamber | Neuron | `unit` |
| Trail | Synapse | edge |
| Pheromone | Weight | `scent[edge]` |
| Ant | Signal | `envelope` |
| Colony | Network | `colony` |

## The Loop

Intelligence emerges from two feedback loops:

```
REINFORCEMENT LOOP              DECAY LOOP
(learning)                      (forgetting)

signal succeeds                 time passes
     │                               │
     ▼                               ▼
edge strengthens                edge weakens
     │                               │
     ▼                               ▼
more signals follow             signals find other paths
     │                               │
     ▼                               ▼
SUPERHIGHWAY                    edge disappears
```

**More traffic → More pheromone → More traffic → HIGHWAY**

```
WEAK EDGE (scent: 2)
┌────┐ ─ ─ ─ ─ ─ ─ ─ ─ ▶ ┌────┐
│ A  │    dirt path      │ B  │
└────┘                   └────┘

STRONG EDGE (scent: 10,000)
┌────┐ ══════════════════ ┌────┐
│ A  │   SUPERHIGHWAY     │ C  │
└────┘                    └────┘
```

The path remembers itself. The edges think.

## Node (unit.js) — 30 lines

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
  receive.role = (name, task, ctx) => (tasks[name] = (p) => tasks[task]({ ...ctx, ...p }), receive);
  receive.has = (name) => name in tasks;
  receive.list = () => Object.keys(tasks);
  receive.id = id;
  return receive;
};
```

**A node IS its entrance.** The unit IS the receive function.

## Network (colony.js) — 55 lines

The network connects nodes and learns which edges matter.

```javascript
const colony = () => {
  const chambers = {};   // Nodes
  const scent = {};      // Edge weights

  const send = ({ receiver, receive, payload, callback }, from = "entry") => {
    const target = chambers[receiver];
    if (!target) return Promise.reject({ error: `No node: ${receiver}` });

    const currentNode = `${receiver}:${receive}`;

    return target({ receive, payload, callback }).then((result) => {
      // LEARNING: Strengthen the edge just traversed
      const edge = `${from} → ${currentNode}`;
      scent[edge] = (scent[edge] || 0) + 1;
      return result;
    });
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

  return { spawn, send, fade, highways, chambers, scent, mark, smell };
};
```

## Signal (envelope)

A signal carries data and knows its journey:

```typescript
interface Envelope {
  receiver?: string;     // Which node to enter
  receive?: string;      // Which computation to trigger
  payload?: unknown;     // Data being carried
  callback?: Envelope;   // Where to go next (the path)
}
```

## Edge Learning

Edges strengthen when signals traverse them. This is learning.

```javascript
// Before: no edges
net.highways();
// → []

// Send a signal through scout → analyst → trader
await net.send({
  receiver: "scout",
  receive: "observe",
  callback: {
    receiver: "analyst",
    receive: "evaluate",
    callback: {
      receiver: "trader",
      receive: "execute"
    }
  }
});

// After: edges have weight
net.highways();
// → [
//   { edge: "entry → scout:observe", strength: 1 },
//   { edge: "scout:observe → analyst:evaluate", strength: 1 },
//   { edge: "analyst:evaluate → trader:execute", strength: 1 }
// ]

// Send 100 more signals through same path
// ...

net.highways();
// → [
//   { edge: "scout:observe → analyst:evaluate", strength: 100 },
//   ...
// ]

// Superhighways emerge. The network learned.
```

## Edge Fading

Unused edges weaken over time. This is forgetting.

```javascript
// Edges fade
net.fade(0.1);  // 10% decay

// Eventually, unused edges disappear
net.fade(0.5);  // 50% decay
net.highways();
// → only frequently-used edges remain
```

## Tasks (Computations)

Tasks are what a node computes:

```javascript
node.assign("double", ({ n }) => n * 2);
node.assign("validate", ({ n }) => n > 0);
```

## Roles (Context-Bound Tasks)

Same computation, different context:

```javascript
node.assign("fetch", ({ url, token }) => fetch(url, { headers: { auth: token } }));
node.role("fetchAsAdmin", "fetch", { token: "admin-key" });
node.role("fetchAsUser", "fetch", { token: "user-key" });
```

## Cargo Transfer

When a signal moves between nodes, its cargo transforms:

```javascript
const substitute = (envelope, result) => {
  const payload = {};
  for (const [k, v] of Object.entries(envelope.payload || {})) {
    payload[k] = v === "{{result}}" ? result : v;
  }
  return { ...envelope, payload };
};
```

## What Emerges

From 85 lines:

| Behavior | How |
|----------|-----|
| Learning | Edges strengthen with use |
| Forgetting | Unused edges fade |
| Highways | High-traffic paths emerge |
| Load balancing | Route to weak-scent nodes |
| Fault tolerance | Failed paths weaken |
| Self-organization | No central controller |

## The Insight

```
Ants don't talk to each other.
Neurons don't talk to each other.
They modify the connections between them.
Other signals read those modifications.

That's intelligence.
That's what this is.
That's 85 lines.
```

## Type Safety

```typescript
import { unit, colony } from "@/engine";
import type { Unit, Colony, Envelope, Edge } from "@/engine";
```

## Chainable API

```javascript
const node = unit({ receiver: "worker" })
  .assign("add", ({ a, b }) => a + b)
  .assign("mul", ({ a, b }) => a * b)
  .role("double", "mul", { b: 2 });
```

---

*The substrate for emergent intelligence.*
