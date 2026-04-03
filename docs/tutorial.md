# Tutorial

Build a world in 5 minutes.

## 1. Create an Agent

```typescript
import { unit } from '@/engine'

const greeter = unit('greeter')
  .on('hello', ({ name }, emit, ctx) => {
    emit({ receiver: ctx.from, payload: { message: `Hello, ${name}!` } })
  })
```

An agent is a unit with tasks. It receives envelopes, does work, emits envelopes.

## 2. Create a World

```typescript
import { world } from '@/engine'

const one = world()

one.spawn('greeter')
  .on('hello', ({ name }, emit, ctx) => {
    emit({ receiver: ctx.from, payload: { message: `Hello, ${name}!` } })
  })

one.spawn('counter')
  .on('count', ({ n }, emit, ctx) => {
    emit({ receiver: ctx.from, payload: { result: n + 1 } })
  })
```

A world is a space where agents live. They can talk to each other.

## 3. Send a Message

```typescript
one.send({ receiver: 'greeter:hello', payload: { name: 'World' } })
```

Format: `receiver:task` or just `receiver` for default task.

## 4. Chain Agents

```typescript
const one = world()

one.spawn('fetcher')
  .on('fetch', async ({ url }, emit) => {
    const data = await fetch(url).then(r => r.json())
    emit({ receiver: 'parser', payload: { data } })
  })

one.spawn('parser')
  .on('default', ({ data }, emit) => {
    const parsed = transform(data)
    emit({ receiver: 'store', payload: { parsed } })
  })

one.spawn('store')
  .on('default', ({ parsed }, emit, ctx) => {
    save(parsed)
    emit({ receiver: ctx.from, payload: { ok: true } })
  })

// Kick off the chain
one.send({ receiver: 'fetcher:fetch', payload: { url } }, 'user')
```

Agents emit to other agents. Chains form naturally.

## 5. Learn from Outcomes

```typescript
// After success — strengthen the path
one.flow('fetcher→parser').strengthen()

// After failure — resist the path
one.flow('fetcher→parser').resist()

// Decay old trails (run periodically)
one.fade(0.1)

// See what emerged
one.open(10)  // Best paths
```

Trails strengthen with use, decay without. Open paths emerge.

## 6. Persist

```typescript
import { persisted } from '@/engine'

const one = persisted(typedb.query)

// ... use normally ...

// Save trails
await one.sync()

// Load trails (on restart)
await one.load()
```

TypeDB stores the trails. World remembers across restarts.

## 7. Add an LLM

```typescript
import { llm, anthropic } from '@/engine'

const claude = llm('claude', anthropic(API_KEY))
one.units['claude'] = claude

// Now you can send to it
one.send({ 
  receiver: 'claude:complete', 
  payload: { prompt: 'Hello!', system: 'Be brief.' } 
})
```

LLMs are just units. Same interface.

## 8. Smart Routing

```typescript
import { asi } from '@/engine'

const brain = asi(prompt => claude.complete(prompt))

// Orchestrate a task
const { agent, result } = await brain.orchestrate(
  'translate hello to Spanish',
  { text: 'hello' }
)

// brain automatically:
// - checks for open paths (skip LLM if confident)
// - asks LLM if needed
// - records the decision
// - learns from outcome
```

ASI routes to the best agent. Gets smarter over time.

## 9. Group Agents

```typescript
const one = world()

// Create a group for language agents
const lang = one.group('lang')

lang.spawn('translator')
  .on('translate', async ({ text, to }, emit, ctx) => {
    const result = await translateAPI(text, to)
    emit({ receiver: ctx.from, payload: { result } })
  })

lang.spawn('summarizer')
  .on('summarize', async ({ text }, emit, ctx) => {
    const summary = await summarizeAPI(text)
    emit({ receiver: ctx.from, payload: { summary } })
  })

// Send to a grouped agent
one.send({ receiver: 'lang/translator:translate', payload: { text, to: 'es' } })
```

Groups scope agents. Keeps the world organized.

## Complete Example

```typescript
import { world, llm, asi, persisted, anthropic } from '@/engine'

// 1. Create persistent world
const one = persisted(typedb.query)

// 2. Add agents in groups
const lang = one.group('lang')

lang.spawn('translator')
  .on('translate', async ({ text, to }, emit, ctx) => {
    const result = await translateAPI(text, to)
    emit({ receiver: ctx.from, payload: { result } })
  })

lang.spawn('summarizer')
  .on('summarize', async ({ text }, emit, ctx) => {
    const summary = await summarizeAPI(text)
    emit({ receiver: ctx.from, payload: { summary } })
  })

// 3. Add LLM
const claude = llm('claude', anthropic(API_KEY))
one.units['claude'] = claude

// 4. Add orchestrator
const brain = asi(p => claude.complete(p))

// 5. Load previous trails
await one.load()

// 6. Handle requests
async function handle(task: string, payload: unknown) {
  const { agent, result } = await brain.orchestrate(task, payload)
  await one.sync()  // Save what we learned
  return result
}

// 7. Decay trails daily
setInterval(() => one.fade(0.05), 24 * 60 * 60 * 1000)
```

## Summary

| Concept | Code | What it does |
|---------|------|--------------|
| Agent | `unit(id).on(task, fn)` | Handles tasks |
| World | `world()` | Routes between agents |
| Group | `world().group(name)` | Scopes agents |
| Message | `{ receiver, payload }` | The only thing that flows |
| Learn | `flow(edge).strengthen()` | Strengthen path |
| Warn | `flow(edge).resist()` | Mark failure |
| Forget | `fade(rate)` | Decay old trails |
| Discover | `open(n)` | Best paths emerge |

## The Mental Model

```
You write agents (units).
You put them in a world.
You group them for scope.
You send envelopes.
You strengthen and resist paths.
Open paths emerge.
The world gets smarter.
```

That's it.

---

*5 minutes. A learning world.*
