# Loop Tutorial

From zero to running in 5 minutes.

---

## The Concept

One loop. Everything else is signals.

```
on()  →  emit()  →  tick()  →  mark/warn
 │         │          │           │
handler   queue     drain       learn
```

That's the entire system. Let's build something.

---

## 1. Hello World

```typescript
import { create } from '@/engine/one-complete'

// Create the substrate
const one = create()

// Register a handler
one.on('hello', (data) => {
  console.log(`Hello, ${data.name}!`)
  return { greeted: data.name }
})

// Emit a signal
one.emit('hello', { name: 'World' })

// Run one tick
await one.tick()
// Output: Hello, World!
```

**What happened:**
1. `on()` registered a handler for the signal `hello`
2. `emit()` added the signal to the queue
3. `tick()` drained the queue, ran the handler, marked the path

---

## 2. Chains

Handlers can emit more signals:

```typescript
one.on('step1', (data, emit) => {
  console.log('Step 1')
  emit('step2', data)  // emit next signal
  return 'done'
})

one.on('step2', (data, emit) => {
  console.log('Step 2')
  emit('step3', data)
  return 'done'
})

one.on('step3', () => {
  console.log('Step 3 - Complete!')
  return 'done'
})

one.emit('step1', { task: 'build' })

// Run until queue empty
while (one.stats().queue > 0) {
  await one.tick()
}
// Output:
// Step 1
// Step 2
// Step 3 - Complete!
```

**What happened:**
- Each handler emitted the next signal
- Weight accumulated on paths: `entry→step1`, `step1→step2`, `step2→step3`
- The chain is now "learned"

---

## 3. Named Chains

Define reusable workflows:

```typescript
// Define the chain
one.chain('deploy', ['build', 'test', 'ship'])

// Register handlers for each step
one.on('build', () => { console.log('Building...'); return true })
one.on('test', () => { console.log('Testing...'); return true })
one.on('ship', () => { console.log('Shipping...'); return true })

// Trigger the chain
one.emit('chain:deploy')

// Run
while (one.stats().queue > 0) {
  await one.tick()
}
// Output:
// Building...
// Testing...
// Shipping...
```

---

## 4. SOPs (Prerequisites)

Enforce that certain signals must succeed before others:

```typescript
// Define SOP: deploy requires test to pass
one.sop('ship', ['test', 'lint'])

one.on('test', () => { console.log('Tests pass'); return true })
one.on('lint', () => { console.log('Lint pass'); return true })
one.on('ship', () => { console.log('Shipped!'); return true })

// This will run test and lint before ship
one.emit('ship')

while (one.stats().queue > 0) {
  await one.tick()
}
// Output:
// Tests pass
// Lint pass
// Shipped!
```

If a prerequisite fails, the target is blocked:

```typescript
one.on('test', () => { throw new Error('Tests failed!') })

one.emit('ship')
const result = await one.tick()
console.log(result.outcome)  // { dissolved: true, error: 'sop_failed' }
```

---

## 5. Timers

Emit signals on a schedule:

```typescript
// Emit 'heartbeat' every 5 seconds
one.timer('heartbeat', 5000)

one.on('heartbeat', () => {
  console.log('Still alive:', new Date().toISOString())
  return true
})

// Run forever
one.run(100)  // tick every 100ms
```

Common timers:
```typescript
one.timer('fade', 300_000)      // decay pheromone every 5 min
one.timer('evolve', 600_000)    // check for evolution every 10 min
one.timer('know', 3_600_000)    // crystallize knowledge every hour
```

---

## 6. Context (For LLM Calls)

Load documents as context for prompts:

```typescript
// Load docs
await one.loadContext('dsl', 'docs/DSL.md')
await one.loadContext('dict', 'docs/dictionary.md')

// Use in handler
one.on('agent:chat', async (data) => {
  const context = one.getContext('dsl', 'dict')
  
  const response = await llm.complete(`
    ${context}
    
    ---
    
    User: ${data.message}
    Assistant:
  `)
  
  return { response }
})
```

---

## 7. Pheromone (Learning)

The system learns from outcomes:

```typescript
// Success → path strengthens
one.on('good', () => 'success')
one.emit('good')
await one.tick()
console.log(one.net('entry→good'))  // 1

// Repeat 10 times
for (let i = 0; i < 10; i++) {
  one.emit('good')
  await one.tick()
}
console.log(one.net('entry→good'))  // 11

// Failure → path weakens
one.on('bad', () => { throw new Error() })
one.emit('bad')
await one.tick()
console.log(one.resistance['entry→bad'])  // 1

// Check if path is toxic
console.log(one.isToxic('entry→bad'))  // false (needs more failures)

// After many failures
for (let i = 0; i < 15; i++) {
  one.emit('bad')
  await one.tick()
}
console.log(one.isToxic('entry→bad'))  // true

// Toxic paths are blocked automatically
one.emit('bad')
const result = await one.tick()
console.log(result.outcome)  // { dissolved: true }
```

---

## 8. Highways (Proven Paths)

Paths with high net strength are "highways":

```typescript
// Build up a highway
for (let i = 0; i < 25; i++) {
  one.mark('user→agent:chat', 1)
}

console.log(one.isHighway('user→agent:chat'))  // true
console.log(one.highways(5))
// [{ path: 'user→agent:chat', strength: 25 }, ...]
```

Highways can skip expensive operations:

```typescript
one.on('agent:chat', async (data) => {
  const path = `${data._from || 'entry'}→agent:chat`
  
  // Skip LLM for proven paths
  if (one.isHighway(path) && cache[data.message]) {
    return cache[data.message]
  }
  
  // Otherwise, call LLM
  const response = await llm.complete(data.message)
  cache[data.message] = response
  return response
})
```

---

## 9. Fade (Forgetting)

Paths decay over time:

```typescript
one.mark('a→b', 100)
console.log(one.strength['a→b'])  // 100

one.fade(0.1)  // 10% decay
console.log(one.strength['a→b'])  // 90

one.fade(0.1)
console.log(one.strength['a→b'])  // 81
```

Resistance decays 2x faster (forgiveness):

```typescript
one.warn('a→b', 100)
one.fade(0.1)  // 10% for strength, 20% for resistance
console.log(one.resistance['a→b'])  // 80
```

---

## 10. Complete Example

A self-improving task processor:

```typescript
import { create } from '@/engine/one-complete'

const one = create()

// Load context
await one.loadContext('dsl', 'docs/DSL.md')

// Core handlers
one.on('scan', async (_, emit) => {
  const todos = await scanTodoFile('TODO.md')
  for (const todo of todos) {
    emit('process', { todo })
  }
  return { found: todos.length }
})

one.on('process', async (data, emit) => {
  const { todo } = data
  
  // Route by type
  if (todo.includes('test')) emit('test', data)
  else if (todo.includes('deploy')) emit('deploy', data)
  else emit('implement', data)
  
  return { routed: true }
})

one.on('implement', async (data) => {
  const context = one.getContext('dsl')
  const result = await llm.complete(`${context}\n\nTask: ${data.todo}`)
  return { implemented: true, result }
})

one.on('test', async (data) => {
  await runTests()
  return { tested: true }
})

one.on('deploy', async (data) => {
  await deploy()
  return { deployed: true }
})

one.on('fade', () => {
  one.fade(0.02)
  return { faded: true }
})

// Timers
one.timer('scan', 60_000)    // scan every minute
one.timer('fade', 300_000)   // fade every 5 min

// SOPs
one.sop('deploy', ['test'])  // must pass tests before deploy

// Initial scan
one.emit('scan')

// Run forever
one.run(100)
```

---

## 11. Production Setup

```typescript
import { createProd, withRollback, withAuth, registerShutdown } from '@/engine'

let one = createProd({
  maxQueue: 1000,
  maxRetries: 3,
  timeout: 30000,
  log: (level, msg, meta) => console.log(JSON.stringify({ level, msg, ...meta })),
})

// Add rollback capability
one = withRollback(one, 100)

// Add auth
one = withAuth(one, {
  validate: async (token) => token === process.env.API_KEY,
  extractToken: (data) => data.token,
})

// Register shutdown handlers
registerShutdown(one)

// Load context
await one.loadContext('dsl', 'docs/DSL.md')

// Register handlers
one.on('api:request', async (data) => {
  // Your handler
})

// Run
one.run(100)
```

---

## 12. Bootstrap from Folder

Drop a folder, run the loop:

```typescript
import { bootstrap } from '@/engine'

const system = await bootstrap({
  folder: './docs',
  complete: async (prompt) => llm.complete(prompt),
  interval: 100,
  watch: true,  // auto-reload on file changes
})

// That's it. The system:
// - Scans docs every minute
// - Extracts TODOs as signals
// - Routes to handlers
// - Updates docs when done
// - Learns patterns
// - Runs forever
```

---

## Quick Reference

### Core API

```typescript
one.on(id, handler)           // register handler
one.emit(to, data?)           // send signal
one.tick()                    // process one signal
one.run(interval)             // run forever
```

### Chains

```typescript
one.chain(name, steps)        // define workflow
one.timer(signal, ms)         // emit on schedule
one.sop(target, prereqs)      // require prereqs
```

### Weight

```typescript
one.mark(path, amount?)       // strengthen
one.warn(path, amount?)       // weaken
one.fade(rate?)               // decay all
one.net(path)                 // strength - resistance
one.isHighway(path)           // net >= 20
one.isToxic(path)             // blocked
one.highways(n?)              // top paths
```

### Context

```typescript
one.loadContext(key, path)    // load doc
one.getContext(...keys)       // get merged
```

### Stats

```typescript
one.stats()
// { cycle, queue, handlers, paths, highways }
```

---

## Patterns

### Fan Out

```typescript
one.on('broadcast', (data, emit) => {
  for (const target of data.targets) {
    emit(target, data.payload)
  }
  return { sent: data.targets.length }
})
```

### Fan In

```typescript
const results = []
one.on('collect', (data) => {
  results.push(data.result)
  if (results.length === data.expected) {
    one.emit('complete', { results })
  }
  return { collected: results.length }
})
```

### Retry with Backoff

```typescript
one.on('flaky', async (data, emit) => {
  const attempt = data._attempt || 1
  try {
    return await riskyOperation()
  } catch {
    if (attempt < 3) {
      setTimeout(() => emit('flaky', { ...data, _attempt: attempt + 1 }), attempt * 1000)
    }
    throw new Error('Failed after retries')
  }
})
```

### Circuit Breaker

```typescript
one.on('external', async (data) => {
  const path = `entry→external`
  
  // Check if circuit is open (too many failures)
  if (one.isToxic(path)) {
    return { error: 'circuit_open' }
  }
  
  try {
    return await callExternalService(data)
  } catch {
    // Will auto-open circuit after enough failures
    throw new Error('External service failed')
  }
})
```

---

## Next Steps

1. **Read**: [loop.md](loop.md) — The architecture
2. **Read**: [DSL.md](DSL.md) — The programming model
3. **Run**: `bun test src/engine/one.test.ts` — See it work
4. **Build**: Create your own handlers and chains

---

*One loop. Everything emerges.*
