# Tutorial

Build a world in 5 minutes.

## 1. Create an Agent

```typescript
import { unit } from '@/engine'

const greeter = unit('greeter')
  .on('hello', ({ name }, emit, ctx) => {
    emit({ receiver: ctx.from, data: { message: `Hello, ${name}!` } })
  })
```

An agent is a unit with tasks. It receives signals, does work, emits signals.

## 2. Create a World

```typescript
import { world } from '@/engine'

const one = world()

one.add('greeter')
  .on('hello', ({ name }, emit, ctx) => {
    emit({ receiver: ctx.from, data: { message: `Hello, ${name}!` } })
  })

one.add('counter')
  .on('count', ({ n }, emit, ctx) => {
    emit({ receiver: ctx.from, data: { result: n + 1 } })
  })
```

A world is a space where agents live. They can talk to each other.

## 3. Send a Message

```typescript
one.send({ receiver: 'greeter:hello', data: { name: 'World' } })
```

Format: `receiver:task` or just `receiver` for default task.

## 4. Chain Agents

```typescript
const one = world()

one.add('fetcher')
  .on('fetch', async ({ url }, emit) => {
    const response = await fetch(url).then(r => r.json())
    emit({ receiver: 'parser', data: { response } })
  })

one.add('parser')
  .on('default', ({ response }, emit) => {
    const parsed = transform(response)
    emit({ receiver: 'store', data: { parsed } })
  })

one.add('store')
  .on('default', ({ parsed }, emit, ctx) => {
    save(parsed)
    emit({ receiver: ctx.from, data: { ok: true } })
  })

// Kick off the chain
one.send({ receiver: 'fetcher:fetch', data: { url } }, 'user')
```

Agents emit to other agents. Chains form naturally.

## 5. Learn from Outcomes

```typescript
// After success — mark pheromone on the path
one.mark('fetcher→parser')

// After failure — resist the path
one.mark('fetcher→parser', false)

// Decay old paths (run periodically)
one.fade(0.1)

// See what emerged
one.follow(10)  // Best paths
```

Paths strengthen with use, decay without. Highways emerge.

## 6. Persist

```typescript
import { persisted } from '@/engine'

const one = persisted(typedb.query)

// ... use normally ...

// Save paths
await one.sync()

// Load paths (on restart)
await one.load()
```

TypeDB stores the paths. World remembers across restarts.

## 7. Add an LLM

```typescript
import { llm, anthropic } from '@/engine'

const claude = llm('claude', anthropic(API_KEY))
one.units['claude'] = claude

// Now you can send to it
one.send({ 
  receiver: 'claude:complete', 
  data: { prompt: 'Hello!', system: 'Be brief.' } 
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
// - checks for strong paths (skip LLM if confident)
// - asks LLM if needed
// - drops pheromone on the path
// - learns from outcome
```

ASI routes to the best agent. Gets smarter over time.

## 9. Group Agents

```typescript
const one = world()

// Create a group for language agents
const lang = one.group('lang')

lang.add('translator')
  .on('translate', async ({ text, to }, emit, ctx) => {
    const result = await translateAPI(text, to)
    emit({ receiver: ctx.from, data: { result } })
  })

lang.add('summarizer')
  .on('summarize', async ({ text }, emit, ctx) => {
    const summary = await summarizeAPI(text)
    emit({ receiver: ctx.from, data: { summary } })
  })

// Send to a grouped agent
one.send({ receiver: 'lang/translator:translate', data: { text, to: 'es' } })
```

Groups scope agents. Keeps the world organized.

## Complete Example

```typescript
import { world, llm, asi, persisted, anthropic } from '@/engine'

// 1. Create persistent world
const one = persisted(typedb.query)

// 2. Add agents in groups
const lang = one.group('lang')

lang.add('translator')
  .on('translate', async ({ text, to }, emit, ctx) => {
    const result = await translateAPI(text, to)
    emit({ receiver: ctx.from, data: { result } })
  })

lang.add('summarizer')
  .on('summarize', async ({ text }, emit, ctx) => {
    const summary = await summarizeAPI(text)
    emit({ receiver: ctx.from, data: { summary } })
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

// 7. Decay paths daily
setInterval(() => one.fade(0.05), 24 * 60 * 60 * 1000)
```

## Summary

| Concept | Code | What it does |
|---------|------|--------------|
| Agent | `unit(id).on(task, fn)` | Handles tasks |
| World | `world()` | Routes between agents |
| Group | `world().group(name)` | Scopes agents |
| Signal | `{ receiver, data }` | The only thing that flows |
| Drop | `mark(edge)` | Add weight to path |
| Resist | `mark(edge, false)` | Mark failure |
| Fade | `fade(rate)` | Decay old paths |
| Follow | `follow(n)` | Query best paths |

## The Mental Model

```
You write agents (units).
You put them in a world.
You group them for scope.
You send signals.
You mark and fade paths.
Highways emerge.
The world gets smarter.
```

That's it.

---

*5 minutes. A learning world.*

---

## See Also

- [flows.md](flows.md) — Complete flow visualization for engineers
- [code.md](code.md) — Substrate implementation reference
- [code-tutorial.md](code-tutorial.md) — Deep architectural walkthrough
- [examples.md](examples.md) — Production patterns: trading, coordination, pheromones
- [agents.md](agents.md) — Agent anatomy and task patterns
