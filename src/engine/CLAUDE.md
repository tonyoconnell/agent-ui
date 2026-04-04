# Engine

**Skills: `/react19` for hooks/state, `/typedb` for persist layer queries.**

70 lines. Two fields. Signal flows. TypeDB is the relay.

## Core Types

```typescript
Signal = { receiver: string, data?: unknown }  // universal primitive
Unit   = callable + tasks + continuations      // entity with model + system-prompt + generation
Colony = units + scent + stigmergy             // swarm
```

## TypeDB as Substrate

The router process is dumb hands. TypeDB decides routing via pheromone.
```
1. Write signal to TypeDB
2. TypeDB → suggest_route() → next destination
3. Execute agent prompt (model + system-prompt from unit entity)
4. Write result as new signal
5. Repeat
```

## Two Layers of Learning

- **Substrate** — drop()/alarm()/fade() on paths and trails. Colony intelligence.
- **Agent** — needs_evolution() triggers prompt rewrite. generation++. Individual intelligence.

## Task Signature

```typescript
(data, emit, ctx) => result
// emit: (Signal) => void
// ctx: { from: string, self: string }
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

| File | Purpose |
|------|---------|
| `substrate.ts` | 70-line foundation: unit + colony + pheromone |
| `unit.ts` | Unit with assign/role/has/list |
| `colony.ts` | Colony with spawn/signal/mark/sense/follow/fade/highways |
| `one.ts` | World: 6-dimension runtime (groups, actors, things, flows, events, knowledge) |
| `asi.ts` | ASI: orchestrator that routes tasks, learns from outcomes |
| `llm.ts` | LLM as unit: anthropic/openai adapters |
| `agentverse.ts` | 2M agents as colony: register/discover/call |
| `persist.ts` | TypeDB persistence layer |
| `index.ts` | Exports: `world` (recommended), substrate, extensions |

## Usage

```typescript
// Recommended entry point
import { world } from "@/engine"
const w = world()
const scout = w.actor('scout')
  .on('observe', ({ tick }) => ({ data: tick }))
  .then('observe', r => ({ receiver: 'analyst', data: r }))

// Direct substrate access
import { colony, unit } from "@/engine"
const net = colony()
const u = net.spawn('agent')
  .on('task', (data, emit) => emit({ receiver: 'next', data }))
net.signal({ receiver: 'agent:task', data: {} })

// Pheromone trails
net.mark('a->b', 1)        // strengthen
net.fade(0.1)              // decay
net.highways(10)           // top paths
net.follow('task')         // best next
```

## Signal Flow

```
signal(sig, from)
  -> unit(sig, from)
    -> task(data, emit, ctx)
      -> emit(sig)           // fan out
        -> mark(path)        // trail strengthens
          -> signal(...)     // recursion
```
