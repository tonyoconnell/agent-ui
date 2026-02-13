# Envelope System

A swarm intelligence framework. Units communicate via envelopes. Colonies emerge from simple rules.

```
Unit + Colony = Swarm Intelligence
70 lines → emergent behavior
```

## The Insight

```
Envelope = Ant (carries payload, knows its journey)
Unit     = Chamber (processes, transforms, passes on)
Colony   = Space (where units exist, not a controller)
```

## Core

```javascript
// Create a colony (the space)
const c = colony();

// Spawn units (the ants' chambers)
c.spawn({ receiver: "processor" })
  .assign("double", ({ n }) => n * 2);

c.spawn({ receiver: "validator" })
  .assign("check", ({ n }) => n > 0);

// Send an envelope (the ant knows its journey)
c.send({
  receiver: "processor",
  receive: "double",
  payload: { n: 5 },
  callback: {
    receiver: "validator",
    receive: "check",
    payload: { n: "{{result}}" }
  }
});
// processor.double(5) → 10 → validator.check(10) → true
```

## Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Astro 5](https://astro.build) |
| UI | [React 19](https://react.dev) + [shadcn/ui](https://ui.shadcn.com) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Visualization | [ReactFlow](https://reactflow.dev) |
| Schema | [TypeDB 3.0](https://typedb.com) / TypeQL |

## Run

```bash
bun install
bun dev        # → localhost:4321
```

---

## Architecture

```
src/engine/
├── unit.js      # The atom (30 lines)
├── colony.js    # The space (40 lines)
├── unit.ts      # TypeScript version
├── colony.ts    # TypeScript version
└── index.ts     # Exports

src/schema/
└── agents.tql   # TypeDB schema

public/
└── agents.json  # Data (generated from schema)

src/pages/
└── index.astro  # UI entry
```

## The Flow

```
agents.tql (schema)
     │
     ▼
agents.json (data)
     │
     ▼
colony + units (engine)
     │
     ▼
index.astro (UI)
```

---

## Unit

A Unit is the smallest indivisible piece of computation.

A thing IS its interface. The Unit IS the receive function.

```javascript
const unit = (envelope, route) => {
  const { receiver: id } = envelope;
  const s = {};

  const receive = ({ receive: t, payload, callback }) => {
    if (!s[t]) return Promise.reject({ id, target: t, error: `Unknown: ${t}` });

    return s[t](payload).then((result) => {
      if (callback) {
        const next = substitute(callback, result);
        if (next.receiver !== id && route) return route(next);
        return receive(next);
      }
      return result;
    });
  };

  receive.assign = (n, f) => (s[n] = (p) => Promise.resolve(f(p)), receive);
  receive.role = (n, svc, ctx) => (s[n] = (p) => s[svc]({ ...ctx, ...p }), receive);
  receive.has = (n) => n in s;
  receive.list = () => Object.keys(s);
  receive.id = id;

  return receive;
};
```

**Everything flows through one pattern:** envelope in → promise out

## Colony

A Colony is not a controller. It is a space.

```javascript
const colony = () => {
  const units = {};

  const send = ({ receiver, receive, payload, callback }) => {
    const target = units[receiver];
    if (!target) return Promise.reject({ receiver, error: `Unknown: ${receiver}` });
    return target({ receive, payload, callback });
  };

  const spawn = (envelope) => {
    const u = unit(envelope, send);
    units[u.id] = u;
    return u;
  };

  return { spawn, send, units };
};
```

**The ant colony principle:**
- No central dispatcher
- Units are autonomous
- Envelopes carry their journey (callbacks)
- Complex behavior emerges from simple rules

---

## Why This is Swarm Intelligence

**Swarm intelligence requires:**

| Principle | Our Implementation |
|-----------|-------------------|
| **Decentralization** | No central controller. Colony is space, not dispatcher. |
| **Simple agents** | Units have simple rules: receive → process → forward |
| **Local information** | Units only know their services. No global state. |
| **Indirect communication** | Envelopes carry data between units (like pheromones) |
| **Emergence** | Complex pipelines from simple unit + callback rules |
| **Self-organization** | Units spawn dynamically. No predefined structure. |

**The key insight:**

```
Ants don't have a CEO.
They have simple rules:
  - Pick up food
  - Follow pheromone
  - Drop at nest

We have:
  - Receive envelope
  - Execute service
  - Forward callback

Same pattern. 70 lines.
```

## What Emerges

```
Simple agents    +    Simple routing    =    Emergence
(units)               (colony.send)

• Pipelines        (envelope callbacks)
• Parallel work    (multiple envelopes)
• Specialization   (units with different services)
• Delegation       (units calling units)
• Error recovery   (errors carry full context)
• Dynamic growth   (spawn new units anytime)
• Self-organization (no central controller)
```

## What's NOT in the 70 Lines (But Could Emerge)

| Capability | How It Emerges |
|------------|----------------|
| Load balancing | Spawn multiple units with same services |
| Fault tolerance | Retry on error, spawn replacement |
| Pheromone trails | Add priority/weight to envelopes |
| Learning | Units modify their services over time |

The 70 lines are the *foundation*. Everything else is built on top, not added to the core.

---

## Schema (TypeQL 3.0)

```tql
entity agent,
    owns id @key,
    owns name,
    plays routing:receiver;

entity envelope,
    owns action-name,
    owns inputs,
    plays chain:parent,
    plays chain:child;

relation chain,
    relates parent,
    relates child;
```

## Data

`public/agents.json`:

```json
{
  "agents": [
    { "id": "agent-a", "name": "Processor", "actions": { "process": { "done": true } } }
  ],
  "envelopes": [
    { "action": "process", "receiver": "agent-a", "callback": { ... } }
  ]
}
```

---

## Skills

Claude Code skills in `.claude/skills/`:

| Command | Description |
|---------|-------------|
| `/astro` | Astro pages, components, islands |
| `/react19` | Actions, use(), transitions |
| `/shadcn` | shadcn/ui components |
| `/reactflow` | Node-based visualization |
| `/typedb` | TypeQL schema and queries |

---

*Unit + Colony. 70 lines. Swarm intelligence.*
