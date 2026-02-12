# Claude Code Configuration for Envelope System

This directory contains Claude Code skills for **Astro 5 + React 19 + shadcn/ui + ReactFlow** development.

## Tech Stack

- **Framework**: Astro 5 with React 19 integration
- **UI**: shadcn/ui + Tailwind CSS 4
- **Visualization**: ReactFlow for envelope chain graphs
- **Language**: TypeScript (strict mode)
- **State**: React useState/useReducer

## Skills

| Command | Description |
|---------|-------------|
| `/astro` | Create Astro pages, components, and islands |
| `/react19` | React 19 patterns (Actions, use(), transitions) |
| `/shadcn` | shadcn/ui component usage and customization |
| `/reactflow` | ReactFlow node-based visualization |
| `/build` | Build the project |
| `/dev` | Start development server |
| `/lint` | Run linting |

## Project Structure

```
envelope-system/
├── src/
│   ├── components/
│   │   ├── ui/                 ← shadcn components
│   │   ├── agents/             ← agent UI components
│   │   ├── envelopes/          ← envelope display
│   │   ├── logic/              ← code viewers
│   │   ├── promises/           ← promise tracking
│   │   ├── renderer/           ← JSON → component renderer
│   │   └── workspace/          ← main workspace
│   ├── engine/                 ← runtime engine (Agent, Envelope, Router)
│   ├── layouts/                ← Astro layouts
│   ├── pages/                  ← Astro pages
│   └── styles/                 ← global CSS
└── .claude/
    └── skills/                 ← development skills
```

## Quick Start

```bash
# Development
bun dev

# Build
bun run build

# Preview production build
bun preview
```

## Architecture

The Envelope System is a deterministic agent-to-agent communication system:

```
Agent A → Envelope → Router → Agent B → Callback Envelope → Agent C
```

The UI is entirely JSON-driven via `runtime.toUISchema()` → `JsonRenderer`.
