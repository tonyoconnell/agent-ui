# ONE Substrate

Signal-based substrate for AI agents. 670 lines of engine. Zero returns.
The LLM is the only probabilistic component. Everything else is math.

## Quick Start

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

## Architecture

Two dictionaries. Arithmetic. One probabilistic step.

```
NERVOUS SYSTEM (runtime 670 lines)     BRAIN (TypeDB ~300 lines)

signal → unit → handler → result       paths persist (strength, resistance)
  → auto-reply → mark/warn             units persist (model, prompt, gen)
  → .then() → continuation             signals logged (event history)
  → fade → select → drain              skills + tags (classification)
  → ask → { result | timeout | dissolved }  knowledge (hypotheses, frontiers)

loops L1-L3 (ms to min)               loops L4-L7 (hours to weeks)
```

### The Deterministic Sandwich

Every LLM call is wrapped in deterministic checks:

```
PRE:   isToxic(edge)? → dissolve (no LLM call, no cost)
PRE:   capability exists? → TypeDB lookup → dissolve
LLM:   generates response (the one probabilistic step)
POST:  result? → mark(). timeout? → neutral. dissolved? → mild warn.
```

The LLM bootstraps the group. The group replaces the LLM. Security and
learning are the same mechanism: warn() is simultaneously a firewall and a lesson.

### Seven Loops

```
L1 SIGNAL     per message     signal → ask → outcome
L2 TRAIL      per outcome     mark/warn → strength/resistance accumulates
L3 FADE       every 5 min     asymmetric decay (resistance forgives 2x faster)
L4 ECONOMIC   per payment     revenue on paths (capability price)
L5 EVOLUTION  every 10 min    rewrite struggling agent prompts (24h cooldown)
L6 KNOWLEDGE  every hour      know highways + auto-hypothesize
L7 FRONTIER   every hour      detect unexplored tag clusters
```

### Four Outcome Types

```
{ result: X }        Success. mark(). Chain strengthens with depth.
{ timeout: true }    Slow, not bad. Neutral. Chain continues.
{ dissolved: true }  Missing unit/capability. Mild warn(0.5). Chain breaks.
(no result)          Failure. Full warn(1). Chain breaks.
```

## Core Concepts

### Signal
```typescript
type Signal = { receiver: string; data?: unknown }
```
The universal primitive. Receiver is `"unit"` or `"unit:skill"`.

### Unit
```typescript
unit(id, route?)
  .on(name, fn)           // define handler (task)
  .then(name, template)   // define continuation (dependency)
  .role(name, task, ctx)  // context-bound handler
```
Task signature: `(data, emit, ctx) => result`
Auto-reply: if signal has `replyTo`, result goes back automatically.

### World
```typescript
world()
  .add(id)                // create unit (drains queued signals)
  .remove(id)             // remove unit (trails remain, fade naturally)
  .signal(signal, from?)  // route signal, auto-mark pheromone
  .ask(signal, from?)     // signal + wait → { result | timeout | dissolved }
  .enqueue(signal)        // queue for later (priority-ordered drain)
  .drain()                // process highest-priority queued signal
  .mark(edge, strength?)  // strengthen path
  .warn(edge, strength?)  // weaken path
  .select(type?, explore?) // probabilistic routing (weighted by strength - resistance)
  .follow(type)           // deterministic routing (strongest path)
  .fade(rate?)            // asymmetric decay
  .highways(limit?)       // top weighted paths
```

### Persist
```typescript
persist()
  .actor(id, kind?, opts?)  // add + persist to TypeDB
  .flow(from, to)           // mark/warn wrapper
  .signal(s, from?)         // pre-checked: toxic → dissolve
  .ask(s, from?)            // pre-checked: toxic + capability → dissolve
  .open(n?)                 // top paths as {from, to, strength}
  .blocked()                // toxic paths
  .know()                   // promote highways to permanent knowledge
  .recall(match?)           // query hypotheses from TypeDB
  .load()                   // hydrate pheromone + queue from TypeDB
  .sync()                   // write all state to TypeDB
```

### Tags
Flat labels on skills and units. No hierarchy. Filter with `?tag=build&tag=P0`.
```typeql
insert $s isa skill, has skill-id "api", has name "Build API",
  has tag "build", has tag "wire", has tag "P0";
```

## Directory Structure

```
src/
  engine/       # Core: world.ts, persist.ts, loop.ts, boot.ts, llm.ts
  components/   # React 19 + shadcn/ui
  pages/        # Astro routes + API
  layouts/      # Astro layouts
  schema/       # TypeDB schema (world.tql)
  lib/          # TypeDB client, auth, utils
docs/           # Architecture + strategy docs
.claude/
  commands/     # Slash commands: /work, /tasks, /done, /grow, /highways
  rules/        # Auto-loaded rules for engine, react, astro
```

## Engine Files

| File | Lines | Purpose |
|------|------:|---------|
| `world.ts` | 226 | Unit + World + pheromone + queue + ask (4 outcomes) |
| `persist.ts` | 187 | Persist = World + TypeDB persistence + sandwich |
| `loop.ts` | 164 | Growth tick: all 7 loops, chain depth, outcome handling |
| `boot.ts` | 40 | Hydrate from TypeDB, add units, start tick |
| `llm.ts` | 40 | LLM as unit: anthropic/openai adapters |
| `index.ts` | 13 | Exports |

## Key Patterns

### Zero Returns
Missing handler? Signal dissolves. Swarm continues.
```typescript
target && target(sig)    // Good: silence is valid
if (!target) throw ...   // Bad: never throw for missing
```

### Tasks as Handlers
```typescript
const bob = net.add('bob')
  .on('schema', async (data, emit) => buildSchema(data))
  .then('schema', r => ({ receiver: 'bob:api', data: r }))
  .on('api', async (data, emit) => buildAPI(data))

net.signal({ receiver: 'bob:schema', data: { spec: '...' } })
// Pheromone accumulates automatically on delivery
```

### The Closed Loop
```typescript
const { result, timeout, dissolved } = await net.ask({ receiver: next })
if (result)        net.mark(edge, chainDepth)   // success scales with chain
else if (timeout)  /* neutral — not the agent's fault */
else if (dissolved) net.warn(edge, 0.5)          // mild — path doesn't exist
else               net.warn(edge, 1)             // failure — agent produced nothing
```

### Toxicity (with cold-start protection)
```typescript
// Requires: resistance >= 10 (enough data), resistance > 2x strength (clearly bad),
// total samples > 5 (don't block new paths)
const isToxic = (edge) => r >= 10 && r > s * 2 && (r + s) > 5
```

## Slash Commands

```
/work       Autonomous loop: sense → select → execute → mark → repeat
/next       Pick one task and do it
/tasks      See tasks by category + tags (/tasks P0 build)
/add-task   Create tagged skill
/done       Mark outcome, reinforce trail
/grow       Run one growth tick
/highways   Proven paths, toxic paths, frontiers
/report     Record session outcomes to substrate
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
import { world } from "@/engine"
import { group, unit } from "@/engine/world"
import { Card } from "@/components/ui/card"
```

## Skills (USE THESE)

| Skill | Trigger | What it provides |
|-------|---------|-----------------|
| `/typedb` | Any TQL, schema, query work | TypeDB 3.0 syntax, functions (NOT rules) |
| `/reactflow` | Graph visualization | Custom nodes, dark theme |
| `/react19` | React components, hooks | React 19 patterns, use(), transitions |
| `/astro` | Pages, layouts, islands | Astro 5 hydration, SSR |
| `/shadcn` | UI components | shadcn/ui dark theme |

**CRITICAL: TypeDB 3.x removed `rule` syntax. Use `fun` (functions) only.**

## Rules

See `.claude/rules/` for framework-specific patterns:
- `engine.md` — Substrate patterns, zero returns, signal flow
- `react.md` — React 19 patterns, typed props, hooks
- `astro.md` — Astro 5 islands, hydration, SSR
