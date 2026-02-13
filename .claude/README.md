# Claude Code Configuration

Skills for **Bun + Astro 5 + React 19 + shadcn/ui + ReactFlow + TypeQL** development.

## Skills

| Command | Description |
|---------|-------------|
| `/astro` | Astro pages, components, islands |
| `/react19` | Actions, use(), transitions |
| `/shadcn` | shadcn/ui components |
| `/reactflow` | Node-based visualization |
| `/typedb` | TypeQL schema and queries |
| `/build` | Build project |
| `/dev` | Start dev server |

## Project Structure

```
src/
├── schema/agents.tql     # TypeQL schema
├── engine/               # Agent, Envelope, Runtime
├── components/           # AgentWorkspace, EnvelopeFlowCanvas
├── pages/index.astro     # Entry
├── layouts/Layout.astro  # Base layout
└── lib/utils.ts          # cn() helper

public/agents.json        # Data (generated from TypeQL)
```

## Commands

```bash
bun dev       # Development
bun build     # Production build
bun preview   # Preview build
```

## Rules

See `.claude/rules/` for file-specific patterns:
- `astro.md` — Astro component patterns
- `react.md` — React 19 patterns
- `engine.md` — Engine class patterns
