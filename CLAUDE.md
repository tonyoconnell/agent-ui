# Envelope System

Signal-based substrate for AI agents. 70 lines of core engine. Zero returns.
Built with Astro 5, React 19, TypeDB 3.0, and shadcn/ui.

## Quick Start

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

## Core Concepts

### Signal
```typescript
type Signal = { receiver: string; data?: unknown }
```
The universal primitive. Receiver is `"unit"` or `"unit:task"`.

### Unit
```typescript
unit(id, route?)
  .on(name, fn)           // define task
  .then(name, template)   // define continuation
  .role(name, task, ctx)  // context-bound task
```
Task signature: `(data, emit, ctx) => result`

### Colony
```typescript
colony()
  .spawn(id)              // create unit
  .signal(signal, from?)  // route signal
  .mark(edge, strength?)  // drop pheromone
  .follow(type)           // find strongest trail
  .fade(rate?)            // decay all trails
  .highways(limit?)       // top weighted paths
```

## Directory Structure

```
src/
  engine/       # Core substrate (substrate.ts)
  components/   # React 19 + shadcn/ui
  pages/        # Astro routes
  layouts/      # Astro layouts
  schema/       # TypeDB schemas
  types/        # TypeScript types
docs/           # Documentation
packages/       # TypeDB patterns
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

### Continuations
Defined at setup, executed after task:
```typescript
.on('observe', ({ tick }) => ({ data: tick }))
.then('observe', r => ({ receiver: 'analyst', data: r }))
```

### Signal Flow
```
signal → unit → task → emit → mark trail → signal
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
- **TypeDB 3.0**: Schema and inference
- **Tailwind 4**: Styling
- **shadcn/ui**: Component library
- **ReactFlow**: Graph visualization

## Path Aliases

```typescript
import { colony } from "@/engine/substrate"
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
