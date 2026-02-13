# Envelope System

Agents communicate via envelopes. TypeQL defines the schema. React renders the flow.

```
Envelope → Agent → Execute → Callback → Next Agent
```

## Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Astro 5](https://astro.build) |
| UI | [React 19](https://react.dev) + [shadcn/ui](https://ui.shadcn.com) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Visualization | [ReactFlow](https://reactflow.dev) |
| Schema | [TypeDB 3.0](https://typedb.com) / TypeQL |

## Run

```bash
bun install
bun dev        # → localhost:4321
```

---

## Development Process

This project is built with **Claude agents and skills**.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. PLAN    →    2. TODO    →    3. BUILD             │
│                                                         │
│   docs/Plan.md    docs/TODO.md    parallel agents      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Make the PLAN

Write `docs/Plan.md` — the architecture and approach.

```markdown
# Plan: Feature Name

## Goal
What we're building and why.

## Architecture
How it fits together.

## Approach
Key decisions and patterns.
```

### Step 2: Make the TODO

Write `docs/TODO.md` — break the plan into tasks.

```markdown
## P0: SETUP
| Status | ID | Task | Depends | Parallel |
|:------:|:---|:-----|:--------|:--------:|
| `[ ]` | SET-001 | Create project structure | — | ✓ |
| `[ ]` | SET-002 | Install dependencies | SET-001 | ✓ |

## P1: ENGINE
| Status | ID | Task | Depends | Parallel |
|:------:|:---|:-----|:--------|:--------:|
| `[ ]` | ENG-001 | Create types.ts | SET-002 | ✓ |
| `[ ]` | ENG-002 | Create Agent.ts | ENG-001 | ✓ |
```

**Phases**: P0 Setup → P1 Engine → P2 Components → P3 Integration

**Columns**:
- `Status` — `[x]` done, `[ ]` pending
- `ID` — `{PHASE}-{NUMBER}`
- `Depends` — must complete first
- `Parallel` — `✓` can run with others

### Step 3: BUILD with Agents

Claude agents execute tasks in parallel waves:

```
WAVE 1                    WAVE 2                    WAVE 3
├── Agent A: ENG-001      ├── Agent A: ENG-003      ├── Sequential
├── Agent B: ENG-002      ├── Agent B: CMP-001      │   tasks that
├── Agent C: CMP-001      ├── Agent C: CMP-002      │   depend on
└── Agent D: CMP-002      └── Agent D: CMP-003      │   everything
```

Up to 4 agents run simultaneously. Dependencies determine waves.

---

## Skills

Claude Code skills in `.claude/skills/`:

| Command | Description |
|---------|-------------|
| `/astro` | Astro pages, components, islands |
| `/react19` | Actions, use(), transitions |
| `/shadcn` | shadcn/ui components |
| `/reactflow` | Node-based visualization |
| `/typedb` | TypeQL schema and queries |
| `/dev` | Start dev server |
| `/build` | Build project |

---

## Architecture

```
src/
├── schema/agents.tql     # TypeQL schema (source of truth)
├── engine/               # Agent, Envelope, Runtime
├── components/           # AgentWorkspace, EnvelopeFlowCanvas
└── pages/index.astro     # Entry

public/agents.json        # Generated from TypeQL
```

## The Flow

```typescript
const { action, inputs } = envelope.env
const result = await agent.actions[action](inputs)
envelope.payload = { status: "resolved", results: result }

if (envelope.callback) {
  substitute(callback, result)  // {{ results }} → actual data
  route(callback)               // → next agent
}
```

## Schema (TypeQL 3.0)

```tql
entity agent,
    owns id @key,
    owns name,
    plays routing:receiver;

entity envelope,
    owns action-name,
    owns inputs,
    plays chain:parent,
    plays chain:child;

relation chain,
    relates parent,
    relates child;
```

## Data

`public/agents.json`:

```json
{
  "agents": [
    { "id": "agent-a", "name": "Processor", "actions": { "process": { "done": true } } }
  ],
  "envelopes": [
    { "action": "process", "inputs": {}, "sender": "system", "receiver": "agent-a" }
  ]
}
```

---

*PLAN → TODO → BUILD. TypeQL writes JSON. React renders it.*
