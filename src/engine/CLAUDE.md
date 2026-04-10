# Engine

**Skills: `/react19` for hooks/state, `/typedb` for persist layer queries.**

~90 lines. Two fields. Signal flows. Queue waits. TypeDB remembers.

## Two Layers

```
NERVOUS SYSTEM (runtime)         BRAIN (TypeDB)
─────────────────────            ──────────────
signals move                     paths persist
units receive                    units persist
handlers run                     signals recorded
continuations chain              classification inferred
strength/resistance accumulate   evolution detected
queue holds work                 knowledge crystallizes

loops L1-L3 (ms-min)            loops L4-L7 (hours-weeks)
```

## Core Types

```typescript
Signal = { receiver: string, data?: unknown }  // universal primitive
Unit   = callable + tasks + continuations      // entity with handlers
World  = units + strength + resistance + queue // the substrate
PersistentWorld = world + TypeDB persistence   // the full runtime
```

## Task Signature

```typescript
(data, emit, ctx) => result
// emit: (Signal) => void
// ctx: { from: string, self: string }
```

## Tasks = Handlers, Dependencies = Continuations

```typescript
// OLD: task entity in TypeDB, dependency relation, trail relation
// NEW: handlers and continuations on units
const bob = net.add('bob')
  .on('schema', async (data, emit) => buildSchema(data))
  .then('schema', r => ({ receiver: 'bob:api', data: r }))
  .on('api', async (data, emit) => buildAPI(data))
  .then('api', r => ({ receiver: 'bob:test', data: r }))

// Pheromone accumulates automatically on every signal delivery
net.signal({ receiver: 'bob:schema', data: { spec: '...' } })
```

## Queue

```typescript
// Signals that can't be delivered immediately wait in the queue
net.enqueue({ receiver: 'future-unit:task', data: {} })

// drain() shifts from queue and signals
net.drain()

// When a unit is added, queued signals for it auto-deliver
net.add('future-unit')  // queued signals fire
```

## Zero Returns

Positive flow only. Missing handler? Signal dissolves. Swarm continues.

```typescript
// Good: silence is valid
task?.(data, emit, ctx)

// Bad: no throws, no rejects for missing
if (!task) throw new Error(...)
```

## Files

| File | Lines | Purpose |
|------|------:|---------|
| `world.ts` | ~212 | Foundation: unit + world + pheromone + queue + ask |
| `persist.ts` | ~154 | PersistentWorld: world + TypeDB persistence + knowledge |
| `loop.ts` | ~75 | Tick: select → signal → drain → fade → evolve → know |
| `boot.ts` | ~39 | Hydrate from TypeDB, start tick loop |
| ~~asi.ts~~ | deleted | routing absorbed into loop (select → ask → mark/warn) |
| `llm.ts` | ~50 | LLM as unit: openrouter adapter (+ legacy anthropic/openai) |
| `agentverse.ts` | ~83 | 2M agents: register/discover/call |
| `index.ts` | ~11 | Exports: world, createWorld, unit, llm, asi |

## Usage

```typescript
// Recommended entry point
import { world } from "@/engine"
const w = world()
const scout = w.actor('scout')
  .on('observe', ({ tick }) => ({ data: tick }))
  .then('observe', r => ({ receiver: 'analyst', data: r }))

// Direct substrate access
import { createWorld } from "@/engine"
const net = createWorld()
const u = net.add('agent')
  .on('task', (data, emit) => emit({ receiver: 'next', data }))
net.signal({ receiver: 'agent:task', data: {} })

// Queue
net.enqueue({ receiver: 'agent:task', data: {} })
net.drain()

// Ask (signal + wait for reply)
const result = await net.ask({ receiver: 'agent:task', data: {} })

// Pheromone
net.mark('a→b', 1)        // strengthen
net.fade(0.1)              // decay
net.highways(10)           // top paths
net.follow('task')         // best next
net.select('task')         // probabilistic pick
```

## Signal Flow

```
signal(sig, from)
  → unit(sig, from)
    → task(data, emit, ctx)
      → emit(sig)           // fan out
        → mark(path)        // trail strengthens
          → signal(...)     // recursion
      → .then(task, tmpl)   // continuation fires
        → signal(next)      // chain continues
```
