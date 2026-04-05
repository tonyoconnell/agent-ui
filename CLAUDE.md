# ONE Substrate

Signal-based substrate for AI agents. ~90 lines of core engine. Zero returns.
Built with Astro 5, React 19, TypeDB 3.0, and shadcn/ui.

## Quick Start

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

## Architecture

Two layers. The runtime moves signals. TypeDB remembers.

```
NERVOUS SYSTEM (runtime)              BRAIN (TypeDB)
substrate.ts  ~90 lines               one.tql  ~230 lines

signal → unit → handler               paths persist
→ emit → mark → .then → signal        units persist
→ fade → select → drain               signals logged
                                       classification inferred
loops L1-L3 (ms to minutes)            evolution detected
                                       knowledge emerges (L4-L7)
```

### The Collapse

Tasks are handlers on units (`.on()`). Dependencies are continuations (`.then()`).
Trails are scent map entries. The substrate handles task lifecycle — TypeDB handles
paths, classification, evolution, and knowledge.

### Signal Flow

```
signal → unit → task → emit → mark(path) → signal
                  ↓
              .then() → continuation → next signal
```

### Router Pattern

```
1. Signal arrives → substrate routes by pheromone
2. Unit runs handler → result
3. Continuation fires → next signal
4. mark() on delivery → path strengthens
5. fade() over time → stale paths dissolve
6. Goto 1
```

### Two Layers of Learning

1. **Substrate learning** — pheromone on paths. mark() on success, warn() on failure,
   fade() over time. The colony gets smarter even if every agent stays the same.
2. **Agent self-improvement** — units have `model`, `system-prompt`, `generation`.
   When `needs_evolution()` fires (success-rate < 0.50, samples >= 20),
   the agent rewrites its own prompt. The substrate provides the signal; the agent evolves.

## Core Concepts

### Signal
```typescript
type Signal = { receiver: string; data?: unknown }
```
The universal primitive. Receiver is `"unit"` or `"unit:task"`.

### Unit
```typescript
unit(id, route?)
  .on(name, fn)           // define task (handler)
  .then(name, template)   // define continuation (dependency)
  .role(name, task, ctx)  // context-bound task
```
Task signature: `(data, emit, ctx) => result`

### Colony
```typescript
colony()
  .spawn(id)              // create unit
  .signal(signal, from?)  // route signal
  .enqueue(signal)        // queue for later
  .drain()                // process queued signal
  .mark(edge, strength?)  // strengthen path
  .warn(edge, strength?)  // weaken path
  .select(type?)          // probabilistic routing
  .follow(type)           // find strongest path
  .fade(rate?)            // decay all paths
  .highways(limit?)       // top weighted paths
```

### World
```typescript
world()
  .actor(id, kind?, opts?)  // spawn + persist to TypeDB
  .flow(from, to)           // mark/warn wrapper
  .open(n?)                 // top paths as {from, to, strength}
  .blocked()                // toxic paths
  .crystallize()            // promote highways to knowledge
  .recall(match?)           // query knowledge from TypeDB
```

## Directory Structure

```
src/
  engine/       # Core: substrate.ts, one.ts, loop.ts, boot.ts, asi.ts
  components/   # React 19 + shadcn/ui
  pages/        # Astro routes
  layouts/      # Astro layouts
  schema/       # TypeDB schemas (one.tql)
  types/        # TypeScript types
docs/           # Documentation
```

## Key Patterns

### Zero Returns
Positive flow only. Missing handler? Signal dissolves. Swarm continues.
```typescript
// Good: conditional execution
target && target(sig)

// Bad: error throwing
if (!target) throw new Error(...)
```

### Tasks as Handlers
```typescript
// Tasks are .on() handlers. Dependencies are .then() continuations.
const bob = net.spawn('bob')
  .on('schema', async (data, emit) => buildSchema(data))
  .then('schema', r => ({ receiver: 'bob:api', data: r }))
  .on('api', async (data, emit) => buildAPI(data))
  .then('api', r => ({ receiver: 'bob:test', data: r }))

// Kick it off — pheromone accumulates automatically
net.signal({ receiver: 'bob:schema', data: { spec: '...' } })
```

### The Tick
```typescript
const next = net.select()           // follow pheromone
next && net.signal({ receiver: next }) // execute
net.drain()                          // process queue
net.fade(0.05)                       // decay
```

### Hydration (Astro)
```astro
<Component />                    <!-- Static, no JS -->
<Component client:load />        <!-- Immediate hydration -->
<Component client:visible />     <!-- Lazy hydration -->
<Component client:only="react"/> <!-- Client-only -->
```

## Tech Stack

- **Astro 5**: Islands architecture, SSR
- **React 19**: Actions, use(), transitions
- **TypeDB 3.0**: Brain — paths, classification, evolution, knowledge
- **Tailwind 4**: Styling
- **shadcn/ui**: Component library
- **ReactFlow**: Graph visualization

## Path Aliases

```typescript
import { colony } from "@/engine/substrate"
import { world } from "@/engine/one"
import { Card } from "@/components/ui/card"
```

## Skills (USE THESE)

Always use the relevant skill when working in that domain:

| Skill | Trigger | What it provides |
|-------|---------|-----------------|
| `/typedb` | Any TQL, schema, query, TypeDB work | TypeDB 3.0 syntax, functions (NOT rules), driver patterns |
| `/reactflow` | Graph visualization, nodes, edges | Custom nodes, dark theme, ReactFlow patterns |
| `/react19` | React components, hooks, actions | React 19 patterns, use(), transitions |
| `/astro` | Pages, layouts, islands, SSR | Astro 5 hydration, frontmatter, islands |
| `/shadcn` | UI components, cards, tabs | shadcn/ui dark theme patterns |

**CRITICAL: TypeDB 3.x removed `rule` syntax. Use `fun` (functions) only. The `/typedb` skill has correct patterns.**

## Rules

See `.claude/rules/` for framework-specific patterns:
- `engine.md` - Substrate patterns
- `react.md` - React 19 patterns
- `astro.md` - Astro 5 patterns
