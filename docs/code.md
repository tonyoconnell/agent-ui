# The Substrate

**70 lines. Zero returns. Concurrency safe. Context aware.**

```
receiver: who (unit:task)
data: what (anything)

That's the signal.
That's all that flows.
```

---

## The Signal

```typescript
{ receiver: string, data?: unknown }
```

- `receiver: "scout"` — send to scout's default task
- `receiver: "scout:observe"` — send to scout's observe task

---

## The Unit

```typescript
interface Unit {
  (e: Signal, from?: string): void
  on: (name: string, fn: (p, emit, ctx) => unknown) => Unit
  then: (name: string, template: (result) => Signal) => Unit
  role: (name: string, task: string, ctx: Record<string, unknown>) => Unit
  has: (name: string) => boolean
  list: () => string[]
  id: string
}
```

### Task Function Signature

```typescript
(data, emit, ctx) => result

// data: the data
// emit: (signal) => void — send more signals
// ctx: { from: string, self: string } — who sent this, who am I
```

---

## The Colony

```typescript
interface Colony {
  units: Record<string, Unit>
  scent: Record<string, number>
  spawn: (id: string) => Unit
  signal: (e: Signal, from?: string) => void
  drop: (edge: string, strength?: number) => void
  trace: (edge: string) => number
  fade: (rate?: number) => void
  highways: (limit?: number) => { edge: string; strength: number }[]
  has: (id: string) => boolean
  list: () => string[]
  get: (id: string) => Unit | undefined
}
```

---

## The Implementation

```typescript
export const unit = (id: string, route?: Route): Unit => {
  const tasks: Record<string, Task> = {}
  const next: Record<string, Template> = {}

  const u: Unit = ({ receiver, data }, from = 'entry') => {
    const taskName = receiver.includes(':') ? receiver.split(':')[1] : 'default'
    const task = tasks[taskName] || tasks.default

    const emit: Emit = e => route?.(e, receiver)  // carries origin
    const ctx = { from, self: receiver }

    task?.(data, emit, ctx).then(result =>
      next[taskName] && route?.(next[taskName](result), receiver)
    )
  }

  u.on = (n, f) => (tasks[n] = (p, e, c) => Promise.resolve(f(p, e, c)), u)
  u.then = (n, t) => (next[n] = t, u)
  u.role = (n, t, ctx) => (tasks[n] = (p, e, c) => tasks[t]?.({ ...ctx, ...p }, e, c) ?? Promise.resolve(null), u)
  u.has = n => n in tasks
  u.list = () => Object.keys(tasks)
  u.id = id
  return u
}

export const colony = (): Colony => {
  const units: Record<string, Unit> = {}
  const scent: Record<string, number> = {}

  const drop = (edge: string, strength = 1) => { scent[edge] = (scent[edge] || 0) + strength }
  const trace = (edge: string) => scent[edge] || 0

  const signal = ({ receiver, data }: Signal, from = 'entry') => {
    const unitId = receiver.includes(':') ? receiver.split(':')[0] : receiver
    const target = units[unitId]
    target && (drop(`${from}→${receiver}`), target({ receiver, data }, from))
  }

  const spawn = (id: string) => {
    const u = unit(id, (e, from) => signal(e, from))
    units[id] = u
    return u
  }

  const fade = (r = 0.1) => Object.keys(scent).forEach(e => {
    scent[e] *= (1 - r)
    scent[e] < 0.01 && delete scent[e]
  })

  const highways = (limit = 10) => Object.entries(scent)
    .sort(([, a], [, b]) => b - a).slice(0, limit)
    .map(([edge, strength]) => ({ edge, strength }))

  return { units, scent, spawn, signal, drop, trace, fade, highways,
           has: id => id in units, list: () => Object.keys(units), get: id => units[id] }
}
```

---

## AI Agent Patterns

### Request / Response (Negotiation)

```typescript
// Agent A asks Agent B a question
net.spawn('agentA')
  .on('ask', ({ question }, emit, { self }) => {
    emit({
      receiver: 'agentB:answer',
      data: { question, replyTo: self }  // include return address
    })
  })
  .on('response', ({ answer }) => {
    console.log('Got answer:', answer)
  })

// Agent B answers
net.spawn('agentB')
  .on('answer', ({ question, replyTo }, emit) => {
    const answer = think(question)
    emit({ receiver: replyTo, data: { answer } })  // reply
  })
```

### Claim Task (Exclusive)

```typescript
const claims: Record<string, string> = {}  // taskId → claimerId

net.spawn('worker')
  .on('claim', ({ taskId }, emit, { from }) => {
    // First to claim wins
    if (!claims[taskId]) {
      claims[taskId] = from
      emit({ receiver: from, data: { taskId, status: 'claimed' } })
    } else {
      emit({ receiver: from, data: { taskId, status: 'taken', by: claims[taskId] } })
    }
  })
```

### Payment

```typescript
const balances: Record<string, number> = {}

net.spawn('ledger')
  .on('pay', ({ from, to, amount, memo }, emit) => {
    if (balances[from] >= amount) {
      balances[from] -= amount
      balances[to] = (balances[to] || 0) + amount
      emit({ receiver: from, data: { status: 'sent', memo } })
      emit({ receiver: to, data: { status: 'received', amount, from, memo } })
    } else {
      emit({ receiver: from, data: { status: 'failed', reason: 'insufficient' } })
    }
  })
  .on('balance', ({ account }, emit, { from }) => {
    emit({ receiver: from, data: { balance: balances[account] || 0 } })
  })
```

### Auction / Negotiation

```typescript
net.spawn('auction')
  .on('bid', ({ itemId, amount }, emit, { from }) => {
    if (amount > highestBid[itemId]) {
      const previous = highestBidder[itemId]
      highestBid[itemId] = amount
      highestBidder[itemId] = from

      // Notify outbid party
      previous && emit({ receiver: previous, data: { status: 'outbid', itemId, newBid: amount } })

      // Confirm to bidder
      emit({ receiver: from, data: { status: 'leading', itemId } })
    }
  })
```

### Swarm Formation

```typescript
// Agents discover each other through scent
net.spawn('coordinator')
  .on('join', ({ capabilities }, emit, { from }) => {
    // Register agent
    registry[from] = capabilities

    // Notify all agents of new member
    Object.keys(registry).forEach(agent => {
      emit({ receiver: agent, data: { event: 'member_joined', id: from, capabilities } })
    })
  })
  .on('find', ({ capability }, emit, { from }) => {
    // Find agents with capability, ranked by scent (reliability)
    const matches = Object.entries(registry)
      .filter(([_, caps]) => caps.includes(capability))
      .map(([id]) => ({ id, strength: net.trace(`${id}→*`) }))
      .sort((a, b) => b.strength - a.strength)

    emit({ receiver: from, data: { matches } })
  })
```

---

## Context Awareness

Every task knows:

```typescript
.on('task', (data, emit, ctx) => {
  ctx.from  // who sent this signal
  ctx.self  // my full address (unit:task)
  emit      // send signals (origin = ctx.self)
})
```

This enables:
- **Reply**: `emit({ receiver: ctx.from, data: response })`
- **Identity**: Know who you are and who's asking
- **Routing**: Emit carries your identity as origin

---

## Concurrency Safe

No global state. Origin flows through the call chain:

```
signal(env, from='entry')
  → unit(env, from)
    → task(data, emit, {from, self})
      → emit(env) // carries self as new from
        → signal(env, from=self)
```

Multiple signals can flow simultaneously without interference.

---

## 70 Lines

```
Two fields flow.
Context travels.
Origin chains.
Weights learn.
Swarms emerge.

The substrate for AI agents.
```

---

## See Also

- [flows.md](flows.md) — Visual guide to signal flow, path formation, actor lifecycle
- [signal.md](signal.md) — The two-field primitive this code implements
- [tutorial.md](tutorial.md) — Quick-start guide building on these primitives
- [code-tutorial.md](code-tutorial.md) — Deep architectural walkthrough
- [examples.md](examples.md) — Production patterns: trading, coordination, pheromones
- [agents.md](agents.md) — Agent anatomy: tasks, continuations, roles
