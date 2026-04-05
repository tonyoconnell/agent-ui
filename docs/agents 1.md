# Agents

An agent is a unit with tasks. That's it.

An agent is an **Actor** (dimension 2). The substrate treats users, AI agents, and system processes identically — all sense signals, all emit signals.

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
│   TASKS                                      │
│     translate(data, emit, ctx)               │
│     detect(data, emit, ctx)                  │
│                                              │
│   CONTINUATIONS                              │
│     translate → { receiver, data }           │
│                                              │
│   IN:  Signal { receiver, data }             │
│   OUT: Signal { receiver, data }             │
│                                              │
└─────────────────────────────────────────────┘
```

## Tasks

```typescript
agent.on('taskName', (data, emit, ctx) => {
  // data — the data signaled to this task
  // emit — function to emit signals
  // ctx  — { from: sender, self: this receiver }
  
  emit({ receiver: ctx.from, data: { result } })
})
```

**Simple transform:**
```typescript
agent.on('double', ({ n }, emit, ctx) => {
  emit({ receiver: ctx.from, data: { result: n * 2 } })
})
```

**Async:**
```typescript
agent.on('fetch', async ({ url }, emit, ctx) => {
  const data = await fetch(url).then(r => r.json())
  emit({ receiver: ctx.from, data: { data } })
})
```

**Fan out:**
```typescript
agent.on('broadcast', ({ message, targets }, emit) => {
  targets.forEach(t => emit({ receiver: t, data: { message } }))
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

```typescript
agent
  .on('analyze', ({ data }) => ({ insights: extract(data) }))
  .then('analyze', result => ({ receiver: 'reporter', data: result }))
```

**Chaining:**
```typescript
agent
  .on('step1', () => ({ a: 1 }))
  .then('step1', r => ({ receiver: 'self:step2', data: r }))
  .on('step2', ({ a }) => ({ b: a + 1 }))
  .then('step2', r => ({ receiver: 'self:step3', data: r }))
  .on('step3', ({ b }, emit, ctx) => {
    emit({ receiver: ctx.from, data: { final: b } })
  })
```

## Roles

Preconfigured task variants:

```typescript
agent
  .on('translate', ({ text, to, fast }, emit, ctx) => {
    const result = fast ? quickTranslate(text, to) : deepTranslate(text, to)
    emit({ receiver: ctx.from, data: { result } })
  })
  .role('quick', 'translate', { fast: true })
  .role('thorough', 'translate', { fast: false })

// Signal via:
{ receiver: 'translator:quick', data: { text, to } }
{ receiver: 'translator:thorough', data: { text, to } }
```

## Introspection

```typescript
agent.has('translate')  // true
agent.list()            // ['translate', 'detect', 'quick', 'thorough']
agent.id                // 'translator'
```

## Agent Types

**Worker** — does one thing well:
```typescript
const hasher = unit('hasher')
  .on('hash', ({ data, algo = 'sha256' }, emit, ctx) => {
    const hash = crypto.createHash(algo).update(data).digest('hex')
    emit({ receiver: ctx.from, data: { hash } })
  })
```

**Router** — directs traffic:
```typescript
const router = unit('router')
  .on('route', ({ task, data }, emit) => {
    const target = selectBest(task)  // Use paths
    emit({ receiver: `${target}:${task}`, data })
  })
```

**Aggregator** — collects results:
```typescript
const aggregator = unit('aggregator')
  .on('collect', ({ id, data }) => { results[id] = data })
  .on('finalize', (_, emit, ctx) => {
    emit({ receiver: ctx.from, data: { results } })
    results = {}
  })
```

**Supervisor** — manages others:
```typescript
const supervisor = unit('supervisor')
  .on('assign', ({ task, workers }, emit) => {
    workers.forEach((w, i) => emit({ receiver: w, data: { task, chunk: i } }))
  })
```

**LLM** — wraps a model:
```typescript
const llmAgent = unit('claude')
  .on('complete', async ({ prompt, system }, emit, ctx) => {
    const response = await anthropic.complete(prompt, { system })
    emit({ receiver: ctx.from, data: { response } })
  })
```

## Context

```typescript
agent.on('task', (data, emit, ctx) => {
  ctx.from   // Who signaled this
  ctx.self   // This receiver (agent:task)
})
```

## Patterns

**Request-Response:** `emit({ receiver: ctx.from, data: { answer } })`
**Fire-and-Forget:** No emit. Silence is valid.
**Forward:** `emit({ receiver: 'next-agent', data })`
**Enrich:** `emit({ receiver: 'next-agent', data: { ...data, extra: compute(data) } })`
**Split:** `items.forEach(item => emit({ receiver: 'worker', data: { item } }))`

## In a Colony

```typescript
const c = colony()
const agent = c.spawn('translator').on('translate', handler)

c.signal({ receiver: 'translator:translate', data: { text, to } })
c.has('translator')   // true
c.list()              // ['translator', ...]
c.get('translator')   // the unit
```

## The Truth

```
Agent = Unit + Tasks
Task = (data, emit, ctx) => void
Signal = { receiver, data }
```

No base classes. No decorators. No configuration. Just functions that sense signals and emit signals.

---

## Biological Grounding

From Deborah Gordon's research on ant colonies:

- **No ant sends messages** — they DROP signals (pheromones)
- **Others FOLLOW the weighted paths** — sensing, not receiving
- **Return rate activates** — more foraging (positive feedback)
- **Absence of signal IS a signal** — paths fade without reinforcement
- **Intelligence lives in paths, not nodes** — the network learns

THE VERBS:
- `signal` — move through the colony
- `mark` — add weight to a path (leave pheromone)
- `follow` — traverse weighted path
- `sense` — perceive environment
- `fade` — decay over time

---

*An agent is an Actor with tasks.*

---

## See Also

- [flows.md](flows.md) — Actor lifecycle: spawn, sense, act, learn, specialize, crystallize
- [signal.md](signal.md) — What agents receive and emit
- [code.md](code.md) — TypeScript implementation of unit/colony
- [swarm.md](swarm.md) — Many agents coordinating
- [ants.md](ants.md) — Biological grounding: nine castes, five chains
- [agent-launch.md](agent-launch.md) — Bridge to AgentLaunch SDK
- [emergence.md](emergence.md) — How agent intelligence emerges
