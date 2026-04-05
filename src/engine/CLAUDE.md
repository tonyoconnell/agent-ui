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
scent/alarm accumulate           evolution detected
queue holds work                 knowledge crystallizes

loops L1-L3 (ms-min)            loops L4-L7 (hours-weeks)
```

## Core Types

```typescript
Signal = { receiver: string, data?: unknown }  // universal primitive
Unit   = callable + tasks + continuations      // entity with handlers
Colony = units + scent + alarm + queue         // the substrate
World  = colony + TypeDB persistence           // the full runtime
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
const bob = net.spawn('bob')
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

// When a unit spawns, queued signals for it auto-deliver
net.spawn('future-unit')  // queued signals fire
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
| `substrate.ts` | ~212 | Foundation: unit + colony + pheromone + queue + ask |
| `one.ts` | ~154 | World: colony + TypeDB persistence + knowledge |
| `loop.ts` | ~75 | Tick: select → signal → drain → fade → evolve → crystallize |
| `boot.ts` | ~39 | Hydrate from TypeDB, start tick loop |
| `asi.ts` | ~54 | Three-tier routing: substrate → TypeDB → LLM (uses ask) |
| `llm.ts` | ~40 | LLM as unit: anthropic/openai adapters |
| `agentverse.ts` | ~83 | 2M agents: register/discover/call |
| `index.ts` | ~11 | Exports: world, colony, unit, llm, asi |

## Usage

```typescript
// Recommended entry point
import { world } from "@/engine"
const w = world()
const scout = w.actor('scout')
  .on('observe', ({ tick }) => ({ data: tick }))
  .then('observe', r => ({ receiver: 'analyst', data: r }))

// Direct substrate access
import { colony } from "@/engine"
const net = colony()
const u = net.spawn('agent')
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
