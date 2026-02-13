# Envelope System

Agents communicate via envelopes. TypeQL defines the schema. React renders the flow.

```
Envelope → Agent → Execute → Callback → Next Agent
```

## Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Astro 5](https://astro.build) + SSR |
| UI | [React 19](https://react.dev) + [shadcn/ui](https://ui.shadcn.com) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Visualization | [ReactFlow](https://reactflow.dev) |
| Schema | [TypeDB 3.0](https://typedb.com) / TypeQL |

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

## Run

```bash
bun install
bun dev        # → localhost:4321
bun build      # production
```

---

## Agent Teams

Tasks execute in parallel waves. Each wave runs up to 4 agents simultaneously.

```
WAVE 1: Foundation
├── Agent A: types.ts
├── Agent B: AgentCard
├── Agent C: EnvelopeCard
└── Agent D: LogicViewer

WAVE 2: Core
├── Agent A: Envelope.ts
├── Agent B: Agent.ts
├── Agent C: PromiseTracker.ts
└── Agent D: PromiseRow

WAVE 3: Integration
└── Sequential: Runtime → JsonRenderer → AgentWorkspace
```

## Skills

Claude Code skills for this project:

| Command | Description |
|---------|-------------|
| `/astro` | Astro pages, components, islands |
| `/react19` | Actions, use(), transitions, ref-as-prop |
| `/shadcn` | shadcn/ui components, dark theme |
| `/reactflow` | Node-based visualization |
| `/typedb` | TypeQL schema, queries, inference |
| `/build` | Build project |
| `/dev` | Start dev server |

Skills live in `.claude/skills/`. Each has a `SKILL.md` with patterns and examples.

## Planning System

```
docs/
├── Plan.md    # Architecture, skeleton setup
└── TODO.md    # Task tracking with waves
```

### TODO Format

```markdown
| Status | ID | Task | Depends | Parallel |
|:------:|:---|:-----|:--------|:--------:|
| `[x]` | ENG-001 | Create types.ts | SET-008 | ✓ |
| `[ ]` | ENG-002 | Create Envelope.ts | ENG-001 | ✓ |
```

- **Status**: `[x]` done, `[ ]` pending
- **ID**: `{PHASE}-{NUMBER}` (SET, ENG, CMP, INT)
- **Depends**: Must complete before this task
- **Parallel**: `✓` can run with other tasks, `✗` sequential

### Waves

```
P0: SETUP       → Foundation (configs, deps)
P1: ENGINE      → Runtime core (types, classes)
P2: COMPONENTS  → UI layer (React components)
P3: INTEGRATION → Wire everything together
```

---

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

UI loads JSON. Agents appear. Click to see flow.

---

*TypeQL writes JSON. React renders it. Agents execute envelopes.*
