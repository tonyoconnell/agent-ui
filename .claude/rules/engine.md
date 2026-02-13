# Engine Development Rules

Apply when working with `src/engine/*.ts` or `src/engine/*.js` files.

## Core Concepts

The Envelope System is a swarm intelligence framework:

- **Unit**: The atom — a named receive function (30 lines)
- **Colony**: The space — where units exist and communicate (40 lines)
- **Envelope**: The ant — carries payload, knows its journey
- **Emergence**: Complex behavior from simple rules

```
Unit + Colony = Swarm Intelligence
70 lines → emergent behavior
```

## The Profound Insight

A thing IS its interface. The Unit IS the receive function.

```javascript
// The unit IS callable
unit({ receive: "process", payload: { n: 5 } });

// Not this
unit.receive({ ... }); // ❌
```

## Unit Structure

```javascript
const unit = (envelope, route) => {
  const { receiver: id } = envelope;
  const s = {};  // services

  const receive = ({ receive: t, payload, callback }) => {
    if (!s[t]) return Promise.reject({ id, target: t, error: `Unknown: ${t}` });

    return s[t](payload).then((result) => {
      if (callback) {
        const next = substitute(callback, result);
        // Cross-unit routing
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

## Colony Structure

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

## Envelope Structure

```typescript
interface Envelope {
  receive?: string;      // Target service name
  receiver?: string;     // Unit identity
  payload?: unknown;     // Data being transmitted
  callback?: Envelope;   // Next envelope in chain
}
```

## Pattern: Everything is receive → promise

```
envelope in → promise out
```

- All interactions are envelopes
- All responses are promises
- Errors carry full context

## Services

Services are the "verbs" — what a unit can do:

```javascript
// Assign a service
unit.assign("double", ({ n }) => n * 2);

// Services always return promises (wrapped automatically)
unit({ receive: "double", payload: { n: 5 } }); // → Promise<10>
```

## Roles

Roles are context-bound services — same logic, different perspective:

```javascript
unit.assign("fetch", ({ url, token }) => fetch(url, { headers: { auth: token } }));
unit.role("fetchAdmin", "fetch", { token: "admin-key" });
unit.role("fetchUser", "fetch", { token: "user-key" });
```

## Callbacks (Chaining)

Envelopes carry their journey via callbacks:

```javascript
{
  receive: "step1",
  payload: { n: 1 },
  callback: {
    receive: "step2",
    payload: { n: "{{result}}" }  // Substituted with step1's result
  }
}
```

## Cross-Unit Communication

Units in a colony can route to each other:

```javascript
const c = colony();

c.spawn({ receiver: "a" }).assign("process", fn1);
c.spawn({ receiver: "b" }).assign("validate", fn2);

// Envelope travels: a → b
c.send({
  receiver: "a",
  receive: "process",
  payload: { data: 1 },
  callback: {
    receiver: "b",
    receive: "validate",
    payload: { result: "{{result}}" }
  }
});
```

## Error Handling

Errors carry full context:

```javascript
{
  id: "worker",        // which unit
  target: "process",   // which service
  payload: { x: 1 },   // what was sent
  error: "..."         // what went wrong
}
```

## The Ant Colony Principle

- **No central controller** — colony is space, not dispatcher
- **Units are autonomous** — make their own decisions
- **Envelopes know their journey** — callbacks define the path
- **Emergence** — complex behavior from simple rules

## Why This is Swarm Intelligence

| Principle | Our Implementation |
|-----------|-------------------|
| **Decentralization** | No central controller. Colony is space, not dispatcher. |
| **Simple agents** | Units have simple rules: receive → process → forward |
| **Local information** | Units only know their services. No global state. |
| **Indirect communication** | Envelopes carry data between units (like pheromones) |
| **Emergence** | Complex pipelines from simple unit + callback rules |
| **Self-organization** | Units spawn dynamically. No predefined structure. |

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

## What Emerges (Not in the 70 Lines)

| Capability | How It Emerges |
|------------|----------------|
| Load balancing | Spawn multiple units with same services |
| Fault tolerance | Retry on error, spawn replacement |
| Pheromone trails | Add priority/weight to envelopes |
| Learning | Units modify their services over time |

The 70 lines are the *foundation*. Everything else is built on top.

## Type Safety

Use strict types:

```typescript
import { unit, colony } from "@/engine";
import type { Unit, Colony, Envelope } from "@/engine";
```

## Chainable API

Unit methods return the unit for chaining:

```javascript
const u = unit({ receiver: "worker" })
  .assign("add", ({ a, b }) => a + b)
  .assign("mul", ({ a, b }) => a * b)
  .role("double", "mul", { b: 2 });
```

## Template Substitution

Replace `{{result}}` patterns in callbacks:

```javascript
const substitute = (envelope, result) => {
  const payload = {};
  for (const [k, v] of Object.entries(envelope.payload || {})) {
    payload[k] = v === "{{result}}" ? result : v;
  }
  return { ...envelope, payload };
};
```

## Legacy Support

The old Agent/Runtime classes are still exported for backwards compatibility:

```typescript
// New architecture (preferred)
export { unit, colony } from "@/engine";

// Legacy (for existing code)
export { Agent, Runtime } from "@/engine";
```
