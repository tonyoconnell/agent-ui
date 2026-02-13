# Engine Rules

Apply to `src/engine/*.ts`

---

## The Substrate

```
70 lines.  Zero returns.  Two fields.

{ receiver, payload }

That's all that flows.
```

---

## Envelope

```typescript
type Envelope = {
  receiver: string      // "unit" or "unit:task"
  payload?: unknown     // anything
}
```

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
(payload, emit, ctx) => result

payload   // the data
emit      // (envelope) => void — fan out
ctx       // { from: string, self: string }
```

---

## Colony

```typescript
colony()
  .spawn(id)              // create unit
  .send(envelope, from?)  // flow signal
  .mark(edge, strength?)  // strengthen edge
  .smell(edge)            // read weight
  .fade(rate?)            // decay all edges
  .highways(limit?)       // top edges
  .has(id)                // introspection
  .list()                 // introspection
  .get(id)                // direct access
```

---

## Zero Returns

Positive flow only. Silence is valid.

```typescript
// GOOD
task?.(payload, emit, ctx).then(result =>
  next[name] && route?.(next[name](result), receiver)
)

// GOOD
target && (mark(edge), target(env))

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
.then('observe', r => ({ receiver: 'analyst', payload: r }))

// Send (minimal)
{ receiver: 'scout:observe', payload: { tick: 42 } }
```

Templates are functions. Full control.

---

## Context Flow

```
send(env, from='entry')
  → unit(env, from)
    → task(payload, emit, {from, self})
      → emit(env)  // carries self as new from
        → send(env, from=self)
```

Concurrency safe. No global state.

---

## Patterns

### Request / Response

```typescript
.on('ask', ({ q }, emit, { self }) => {
  emit({ receiver: 'oracle', payload: { q, replyTo: self } })
})

.on('answer', ({ q, replyTo }, emit) => {
  emit({ receiver: replyTo, payload: { a: compute(q) } })
})
```

### Claim

```typescript
.on('claim', ({ id }, emit, { from }) => {
  !claims[id] && (claims[id] = from,
    emit({ receiver: from, payload: { claimed: id } }))
})
```

### Payment

```typescript
.on('pay', ({ to, amount }, emit, { from }) => {
  bal[from] >= amount && (
    bal[from] -= amount,
    bal[to] += amount,
    emit({ receiver: to, payload: { received: amount } }))
})
```

### Stream

```typescript
.on('ingest', async ({ url }, emit) => {
  const s = await connect(url)
  s.on('data', d => emit({ receiver: 'process', payload: d }))
})
```

---

## Types

```typescript
import { colony, unit } from "@/engine/substrate"
import type { Colony, Unit, Envelope, Emit } from "@/engine/substrate"

// Aliases
import { swarm, atom } from "@/engine"
import type { Swarm, Atom, Signal } from "@/engine"
```

---

## The Loop

```
REINFORCE              DECAY
    │                     │
    ▼                     ▼
edge++               edge *= 0.9
    │                     │
    ▼                     ▼
more traffic         reroute
    │                     │
    ▼                     ▼
HIGHWAY              delete
```

---

*70 lines. The substrate.*
