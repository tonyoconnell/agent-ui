# Claude Code Configuration

Skills for building **swarm intelligence in 85 lines**.

## The Pattern

```
Nodes that compute.     →  unit.js (30 lines)
Edges that learn.       →  colony.js (55 lines)
Signals that flow.      →  envelopes
No controller.          →  emergence
```

## Skills

| Command | Description |
|---------|-------------|
| `/astro` | Astro pages, islands, SSR |
| `/react19` | Actions, use(), transitions |
| `/reactflow` | Node-based graph visualization |
| `/typedb` | TypeQL schema and queries |

## Architecture

```
src/engine/
├── unit.js       # The atom: receive function + services
├── colony.js     # The substrate: nodes + edges + learning
└── index.ts      # Exports

src/components/
├── ColonyGraph.tsx       # Visualize chambers + edges
├── HighwayPanel.tsx      # Show strongest paths
└── EnvelopeFlowCanvas.tsx

public/agents.json        # Data (units to spawn)
src/schema/agents.tql     # TypeQL schema
```

## Core Concepts

| Concept | Implementation |
|---------|----------------|
| **Unit** | A receive function with services attached |
| **Colony** | Space where units exist and edges learn |
| **Envelope** | Signal: receiver + receive + payload + callback |
| **Scent** | Edge weights that strengthen with use |
| **Highway** | Emergent strong paths from repeated signals |

## Commands

```bash
bun dev       # Development → localhost:4321
bun build     # Production build
bun preview   # Preview build
```

## Rules

See `.claude/rules/` for patterns:

| File | Applies To |
|------|------------|
| `engine.md` | `src/engine/*.js` — The 85 lines |
| `react.md` | `*.tsx` — React 19 patterns |
| `astro.md` | `*.astro` — Astro islands |

## The Insight

```
Ants don't talk to each other.
They modify the paths between them.
Other ants read those modifications.

That's intelligence.
That's what we built.
85 lines.
```
