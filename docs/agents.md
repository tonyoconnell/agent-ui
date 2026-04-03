# Agents

An agent is a unit with tasks. That's it.

In ONE Protocol terms: an agent is an **Actor** (dimension 2). Actors are authorization entities that include users, AI agents, and system processes. The substrate treats them identically—all receive envelopes, all emit envelopes.

## Anatomy

```typescript
const agent = unit('translator')
  .on('translate', handler)      // task
  .on('detect', handler)         // task
  .then('translate', template)   // continuation
  .role('quick', 'translate', { fast: true })  // preset
```

```
┌─────────────────────────────────────────────┐
│                   AGENT                      │
│                                              │
│   id: "translator"                           │
│                                              │
│   ┌─────────────────────────────────────┐   │
│   │ TASKS                                │   │
│   │                                      │   │
│   │   translate(payload, emit, ctx)      │   │
│   │   detect(payload, emit, ctx)         │   │
│   │                                      │   │
│   └─────────────────────────────────────┘   │
│                                              │
│   ┌─────────────────────────────────────┐   │
│   │ CONTINUATIONS                        │   │
│   │                                      │   │
│   │   translate → { receiver, payload }  │   │
│   │                                      │   │
│   └─────────────────────────────────────┘   │
│                                              │
│   IN:  Envelope { receiver, payload }        │
│   OUT: Envelope { receiver, payload }        │
│                                              │
└─────────────────────────────────────────────┘
```

## Creating an Agent

```typescript
import { unit } from '@/engine'

const agent = unit('my-agent')
```

## Adding Tasks

```typescript
agent.on('taskName', (payload, emit, ctx) => {
  // payload — the data sent to this task
  // emit    — function to send envelopes
  // ctx     — { from: sender, self: this receiver }
  
  // Do work...
  
  // Respond
  emit({ receiver: ctx.from, payload: { result } })
})
```

### Task Examples

**Simple transform:**
```typescript
agent.on('double', ({ n }, emit, ctx) => {
  emit({ receiver: ctx.from, payload: { result: n * 2 } })
})
```

**Async work:**
```typescript
agent.on('fetch', async ({ url }, emit, ctx) => {
  const data = await fetch(url).then(r => r.json())
  emit({ receiver: ctx.from, payload: { data } })
})
```

**Fan out:**
```typescript
agent.on('broadcast', ({ message, targets }, emit) => {
  targets.forEach(t => emit({ receiver: t, payload: { message } }))
})
```

**Silent (no response):**
```typescript
agent.on('log', ({ message }) => {
  console.log(message)
  // No emit — silence is valid
})
```

## Continuations

Define what happens after a task completes. Each completion is an **Event** (ONE dimension 5)—an immutable record that something happened.

```typescript
agent
  .on('analyze', ({ data }) => ({ insights: extract(data) }))
  .then('analyze', result => ({
    receiver: 'reporter',
    payload: result
  }))
```

The continuation template receives the task's return value and produces the next envelope.

**Chaining:**
```typescript
agent
  .on('step1', () => ({ a: 1 }))
  .then('step1', r => ({ receiver: 'self:step2', payload: r }))
  
  .on('step2', ({ a }) => ({ b: a + 1 }))
  .then('step2', r => ({ receiver: 'self:step3', payload: r }))
  
  .on('step3', ({ b }, emit, ctx) => {
    emit({ receiver: ctx.from, payload: { final: b } })
  })
```

## Roles

Preconfigured task variants:

```typescript
agent
  .on('translate', ({ text, to, fast }, emit, ctx) => {
    const result = fast ? quickTranslate(text, to) : deepTranslate(text, to)
    emit({ receiver: ctx.from, payload: { result } })
  })
  .role('quick', 'translate', { fast: true })
  .role('thorough', 'translate', { fast: false })
```

Now you can call:
```typescript
{ receiver: 'translator:quick', payload: { text, to } }
{ receiver: 'translator:thorough', payload: { text, to } }
```

## Introspection

```typescript
agent.has('translate')  // true
agent.has('unknown')    // false
agent.list()            // ['translate', 'detect', 'quick', 'thorough']
agent.id                // 'translator'
```

## Agent Types

### Worker Agent
Does one thing well:

```typescript
const hasher = unit('hasher')
  .on('hash', ({ data, algo = 'sha256' }, emit, ctx) => {
    const hash = crypto.createHash(algo).update(data).digest('hex')
    emit({ receiver: ctx.from, payload: { hash } })
  })
```

### Router Agent
Directs traffic:

```typescript
const router = unit('router')
  .on('route', ({ task, payload }, emit) => {
    const target = selectBest(task)  // Use trails
    emit({ receiver: `${target}:${task}`, payload })
  })
```

### Aggregator Agent
Collects results:

```typescript
const aggregator = unit('aggregator')
  .on('collect', ({ id, data }) => {
    results[id] = data
  })
  .on('finalize', (_, emit, ctx) => {
    emit({ receiver: ctx.from, payload: { results } })
    results = {}
  })
```

### Supervisor Agent
Manages others:

```typescript
const supervisor = unit('supervisor')
  .on('assign', ({ task, workers }, emit) => {
    workers.forEach((w, i) => 
      emit({ receiver: w, payload: { task, chunk: i } })
    )
  })
  .on('report', ({ worker, status }) => {
    workerStatus[worker] = status
  })
```

### LLM Agent
Wraps a model:

```typescript
const llmAgent = unit('claude')
  .on('complete', async ({ prompt, system }, emit, ctx) => {
    const response = await anthropic.complete(prompt, { system })
    emit({ receiver: ctx.from, payload: { response } })
  })
  .on('stream', async ({ prompt, onChunk }, emit, ctx) => {
    let full = ''
    await anthropic.stream(prompt, chunk => {
      full += chunk
      onChunk?.(chunk)
    })
    emit({ receiver: ctx.from, payload: { response: full } })
  })
```

## Context

Every task receives context:

```typescript
agent.on('task', (payload, emit, ctx) => {
  ctx.from   // Who sent this envelope
  ctx.self   // This receiver (agent:task)
})
```

Use `ctx.from` for replies:
```typescript
emit({ receiver: ctx.from, payload: { result } })
```

Use `ctx.self` for self-reference:
```typescript
emit({ receiver: 'logger', payload: { source: ctx.self, event: 'started' } })
```

## Patterns

### Request-Response
```typescript
agent.on('ask', ({ question }, emit, ctx) => {
  const answer = compute(question)
  emit({ receiver: ctx.from, payload: { answer } })
})
```

### Fire-and-Forget
```typescript
agent.on('notify', ({ event }) => {
  log(event)
  // No emit
})
```

### Forward
```typescript
agent.on('forward', (payload, emit) => {
  emit({ receiver: 'next-agent', payload })
})
```

### Enrich
```typescript
agent.on('enrich', (payload, emit) => {
  emit({ 
    receiver: 'next-agent', 
    payload: { ...payload, enriched: compute(payload) } 
  })
})
```

### Split
```typescript
agent.on('split', ({ items }, emit) => {
  items.forEach((item, i) => 
    emit({ receiver: `worker-${i % 3}`, payload: { item } })
  )
})
```

### Timeout
```typescript
agent.on('withTimeout', async (payload, emit, ctx) => {
  const result = await Promise.race([
    doWork(payload),
    new Promise((_, reject) => 
      setTimeout(() => reject('timeout'), 5000)
    )
  ]).catch(() => null)
  
  emit({ receiver: ctx.from, payload: { result } })
})
```

## Lifecycle

```
              unit(id)
                 │
                 ▼
            ┌─────────┐
            │ CREATED │
            └────┬────┘
                 │ .on() / .then() / .role()
                 ▼
            ┌─────────┐
            │CONFIGURED│
            └────┬────┘
                 │ added to colony
                 ▼
            ┌─────────┐
            │  ACTIVE │ ←── receives envelopes
            └─────────┘
```

## In a Swarm (Group)

A swarm is a **Group** (ONE dimension 1)—multi-tenant isolation for agents. Each group contains its own actors, connections, and events.

```typescript
const swarm = colony()

// Create and configure
const agent = swarm.spawn('translator')
  .on('translate', handler)
  .on('detect', handler)

// Send to it
swarm.send({ receiver: 'translator:translate', payload: { text, to } })

// Check it exists
swarm.has('translator')  // true

// List all agents
swarm.list()  // ['translator', ...]

// Direct access
swarm.get('translator')  // the unit
```

Agent interactions within the swarm create **Flows** (Connections)—the edges that strengthen with use. These flows are ONE dimension 4: relationships between actors.

## The Truth

```
Agent = Unit + Tasks
Task = (payload, emit, ctx) => void
Envelope = { receiver, payload }

That's all.
```

No base classes. No decorators. No configuration files. No lifecycle hooks.

Just functions that receive data and emit data.

## ONE Protocol Mapping

Agents map cleanly to the ONE ontology:

```
┌────────────────────────────────────────────────────────────┐
│                    ONE DIMENSIONS                           │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   1. GROUPS        Colony / Swarm                           │
│                    Multi-tenant isolation                   │
│                                                             │
│   2. ACTORS        Agent / Unit                             │
│                    The foundation—receives & emits          │
│                                                             │
│   4. CONNECTIONS   Flows / Edges                            │
│                    Agent interactions, strengthened by use  │
│                                                             │
│   5. EVENTS        Task completions                         │
│                    Immutable audit of what happened         │
│                                                             │
│   6. KNOWLEDGE     Proven patterns                          │
│                    Highways that emerge from success        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

When agents consistently succeed, their patterns become **Knowledge** (ONE dimension 6)—proven paths that the system remembers. Highways are knowledge made visible.

---

*An agent is an Actor with tasks.*
