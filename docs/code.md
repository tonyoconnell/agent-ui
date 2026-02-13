# The Substrate

**50 lines. Zero returns. Two fields.**

```
receiver: who
payload: what

That's the envelope.
That's all that flows.
```

---

## The Envelope

```typescript
{ receiver: string, payload?: unknown }
```

No callback field. Continuations live in templates.
The envelope is pure: destination + data.

---

## The Unit

```typescript
const unit = (id: string, route?: Route): Unit => {
  const tasks: Tasks = {}
  const next: Templates = {}

  const receive: Unit = ({ receiver, payload }) => {
    const task = tasks[receiver] || tasks.default
    task?.(payload).then(result =>
      next[receiver] && route?.(next[receiver](result))
    )
  }

  receive.on = (name, fn) => (tasks[name] = p => Promise.resolve(fn(p)), receive)
  receive.then = (name, template) => (next[name] = template, receive)
  receive.id = id
  return receive
}
```

**15 lines.**

- `on(name, fn)` — what to do when receiving
- `then(name, template)` — what happens next (returns envelope from result)

---

## The Colony

```typescript
const colony = (): Colony => {
  const units: Record<string, Unit> = {}
  const scent: Record<string, number> = {}

  const send = ({ receiver, payload }: Envelope, from = 'entry') => {
    const target = units[receiver]
    target && (
      scent[`${from}→${receiver}`] = (scent[`${from}→${receiver}`] || 0) + 1,
      target({ receiver, payload })
    )
  }

  const spawn = (id: string) => {
    const u = unit(id, e => send(e, id))
    units[id] = u
    return u
  }

  const fade = (rate = 0.1) => Object.keys(scent).forEach(e => {
    scent[e] *= (1 - rate)
    scent[e] < 0.01 && delete scent[e]
  })

  return { units, scent, spawn, send, fade }
}
```

**20 lines.**

---

## The Full Implementation

```typescript
// substrate.ts — 50 lines

type Envelope = { receiver: string; payload?: unknown }
type Task = (p: unknown) => Promise<unknown>
type Template = (result: unknown) => Envelope
type Route = (e: Envelope) => void

interface Unit {
  (e: Envelope): void
  on: (name: string, fn: (p: unknown) => unknown) => Unit
  then: (name: string, template: Template) => Unit
  id: string
}

interface Colony {
  units: Record<string, Unit>
  scent: Record<string, number>
  spawn: (id: string) => Unit
  send: (e: Envelope, from?: string) => void
  fade: (rate?: number) => void
}

const unit = (id: string, route?: Route): Unit => {
  const tasks: Record<string, Task> = {}
  const next: Record<string, Template> = {}

  const u: Unit = ({ receiver, payload }) => {
    const task = tasks[receiver] || tasks.default
    task?.(payload).then(result =>
      next[receiver] && route?.(next[receiver](result))
    )
  }

  u.on = (n, f) => (tasks[n] = p => Promise.resolve(f(p)), u)
  u.then = (n, t) => (next[n] = t, u)
  u.id = id
  return u
}

const colony = (): Colony => {
  const units: Record<string, Unit> = {}
  const scent: Record<string, number> = {}

  const send = ({ receiver, payload }: Envelope, from = 'entry') => {
    const target = units[receiver]
    target && (
      scent[`${from}→${receiver}`] = (scent[`${from}→${receiver}`] || 0) + 1,
      target({ receiver, payload })
    )
  }

  const spawn = (id: string) => {
    const u = unit(id, e => send(e, id))
    units[id] = u
    return u
  }

  const fade = (r = 0.1) => Object.keys(scent).forEach(e => {
    scent[e] *= (1 - r)
    scent[e] < 0.01 && delete scent[e]
  })

  return { units, scent, spawn, send, fade }
}

export { unit, colony }
export type { Unit, Colony, Envelope }
```

---

## Usage

```typescript
const net = colony()

net.spawn('scout')
  .on('default', ({ tick }) => ({ observed: tick, ts: Date.now() }))
  .then('default', result => ({ receiver: 'analyst', payload: result }))

net.spawn('analyst')
  .on('default', ({ observed }) => ({ signal: observed > 50 ? 'buy' : 'hold' }))
  .then('default', result => ({ receiver: 'trader', payload: result }))

net.spawn('trader')
  .on('default', ({ signal }) => console.log('Execute:', signal))

// Send
net.send({ receiver: 'scout', payload: { tick: 73 } })

// Flow: scout → analyst → trader
// Each unit knows its continuation via .then()
// Envelope is always just { receiver, payload }
```

---

## The Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ENVELOPE                                                  │
│   ────────                                                  │
│   { receiver: "scout", payload: { tick: 73 } }              │
│                                                             │
│   Two fields. Always.                                       │
│   No callback. No nesting. No metadata.                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   CONTINUATION                                              │
│   ────────────                                              │
│   Defined at setup with .then()                             │
│   Returns next envelope from result                         │
│                                                             │
│   .then('default', result => ({                             │
│     receiver: 'analyst',                                    │
│     payload: result                                         │
│   }))                                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   FLOW                                                      │
│   ────                                                      │
│   task?.(payload).then(result =>                            │
│     next[receiver] && route?.(next[receiver](result))       │
│   )                                                         │
│                                                             │
│   No returns. Positive flow. Silence is valid.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Why

```
The simpler the message, the faster it flows.
The simpler the node, the more can exist.
The simpler the rule, the richer the emergence.

Two fields: receiver, payload.
Two methods: on, then.
One loop: task → result → next.

50 lines.
The substrate.
```
