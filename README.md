# The Substrate

**70 lines. Two fields. Concurrency safe. AI agents.**

```
receiver: who
payload: what

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

## The Envelope

```typescript
{ receiver: string, payload?: unknown }
```

Two fields. That's it.

- `receiver: "scout"` — send to scout's default task
- `receiver: "scout:observe"` — send to scout's observe task
- `payload` — anything: objects, streams, buffers, functions, promises

---

## The Unit

```typescript
net.spawn('scout')
  .on('observe', (payload, emit, ctx) => {
    // payload: the data
    // emit: send more envelopes
    // ctx: { from, self }
    return { observed: payload.tick }
  })
  .then('observe', result => ({
    receiver: 'analyst:evaluate',
    payload: result
  }))
```

| Method | Purpose |
|--------|---------|
| `.on(name, fn)` | Define a task |
| `.then(name, tmpl)` | Define continuation |
| `.role(name, task, ctx)` | Context-bound task |

---

## The Colony

```typescript
const net = colony()

net.spawn('scout')    // create unit
net.send(envelope)    // flow signal
net.mark(edge)        // strengthen
net.fade(0.1)         // decay
net.highways(10)      // see learning
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
│  edge strengthens                 edge weakens                  │
│       │                                │                        │
│       ▼                                ▼                        │
│  more signals follow              signals find other paths      │
│       │                                │                        │
│       ▼                                ▼                        │
│  SUPERHIGHWAY                     edge disappears               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Agent Patterns

### Request / Response

```typescript
.on('ask', ({ question }, emit, { self }) => {
  emit({ receiver: 'oracle:answer', payload: { question, replyTo: self } })
})

.on('answer', ({ question, replyTo }, emit) => {
  emit({ receiver: replyTo, payload: { answer: think(question) } })
})
```

### Claim Task

```typescript
.on('claim', ({ taskId }, emit, { from }) => {
  if (!claims[taskId]) {
    claims[taskId] = from
    emit({ receiver: from, payload: { status: 'claimed' } })
  }
})
```

### Payment

```typescript
.on('pay', ({ from, to, amount }, emit) => {
  if (balances[from] >= amount) {
    balances[from] -= amount
    balances[to] += amount
    emit({ receiver: to, payload: { received: amount, from } })
  }
})
```

### Swarm Formation

```typescript
.on('join', ({ capabilities }, emit, { from }) => {
  registry[from] = capabilities
  // Notify all members
  Object.keys(registry).forEach(id =>
    emit({ receiver: id, payload: { joined: from, capabilities } })
  )
})
```

---

## Streaming

```typescript
.on('stream', async ({ url }, emit) => {
  const stream = await connect(url)

  stream.on('frame', frame =>
    emit({ receiver: 'process:frame', payload: frame })
  )

  stream.on('audio', chunk =>
    emit({ receiver: 'transcribe:chunk', payload: chunk })
  )
})
```

---

## Context

Every task knows who it is and who's asking:

```typescript
.on('task', (payload, emit, ctx) => {
  ctx.from   // who sent this
  ctx.self   // my address (unit:task)
  emit(env)  // sends with my identity as origin
})
```

---

## What Emerges

| Behavior | How |
|----------|-----|
| **Learning** | Edges strengthen with use |
| **Forgetting** | Unused edges fade |
| **Highways** | High-traffic paths emerge |
| **Load balancing** | Route by scent |
| **Fault tolerance** | Failed paths weaken |
| **Self-organization** | No controller |

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

## Files

```
src/engine/
├── substrate.ts   # 70 lines — the foundation
├── unit.ts        # Legacy (backwards compatible)
├── colony.ts      # Legacy (backwards compatible)
└── index.ts       # Exports

docs/
├── code.md        # The substrate specification
└── examples.md    # Patterns and usage
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

70 lines.
Two fields.
Build everything.
```
