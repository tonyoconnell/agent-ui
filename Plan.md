# BUILD: Envelope-Based Deterministic Agent System

## SKELETON SETUP — Copy from ONE/web

Run these commands to copy the Astro + React 19 + shadcn/ui skeleton from the ONE project:

```bash
# Create project directory
mkdir -p envelope-system
cd envelope-system

# Copy config files from ONE/web
cp ../ONE/web/astro.config.mjs .
cp ../ONE/web/tsconfig.json .
cp ../ONE/web/.gitignore .
cp ../ONE/web/.npmrc .

# Copy styles
mkdir -p src/styles
cp ../ONE/web/src/styles/global.css src/styles/

# Copy shadcn ui components
mkdir -p src/components/ui
cp ../ONE/web/src/components/ui/*.tsx src/components/ui/

# Copy lib/utils (required by shadcn)
mkdir -p src/lib
cp ../ONE/web/src/lib/utils.ts src/lib/

# Copy base layout
mkdir -p src/layouts
# We'll create a minimal Layout.astro

# Create minimal package.json
cat > package.json << 'EOF'
{
  "name": "envelope-system",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/react": "^4.4.0",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tailwindcss/vite": "^4.1.13",
    "@types/react": "^19.1.16",
    "@types/react-dom": "^19.1.9",
    "astro": "^5.14.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.546.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "^4.1.13",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "typescript": "5.9.2"
  }
}
EOF

# Install dependencies
bun install

# Create minimal astro.config.mjs (simplified from ONE/web)
cat > astro.config.mjs << 'EOF'
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss({
        content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
      }),
    ],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  },
});
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@lib/*": ["src/lib/*"]
    },
    "jsx": "preserve",
    "jsxImportSource": "react"
  }
}
EOF

# Create base Layout.astro
cat > src/layouts/Layout.astro << 'EOF'
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-[#0a0a0f] text-white antialiased">
    <slot />
  </body>
</html>
<style is:global>
  @import "../styles/global.css";
</style>
EOF

# Create pages directory and index.astro
mkdir -p src/pages
cat > src/pages/index.astro << 'EOF'
---
import Layout from "../layouts/Layout.astro";
import AgentWorkspace from "../components/workspace/AgentWorkspace";
---
<Layout title="Envelope System">
  <AgentWorkspace client:load />
</Layout>
EOF

# Create engine directory structure
mkdir -p src/engine
mkdir -p src/components/{agents,envelopes,logic,promises,renderer,workspace}
mkdir -p src/schemas

echo "Skeleton setup complete. Run 'bun dev' to start."
```

---

## OVERVIEW

Build a complete deterministic agent-to-agent communication system using an Envelope pattern. This is a standalone project. Not part of any existing codebase.

There are two parts:
1. **Runtime Engine** — TypeScript classes that execute the envelope chain
2. **Frontend UI** — Astro + React 19 + shadcn/ui pages driven by JSON schema

The core idea: Agents communicate by sending **Envelopes** to each other. An envelope contains an action name, inputs, a payload, and optionally a callback (which is another envelope). When an agent processes an envelope, it looks up the action in its registry, executes it with the inputs, packs the results into the callback envelope, and routes it to the next agent. Promises track async resolution. The UI renders entirely from JSON — the same envelope system describes what the user sees.

---

## TECH STACK

- **Framework**: Astro (latest) with React 19 integration
- **UI**: shadcn/ui + Tailwind CSS 4
- **Language**: TypeScript throughout
- **State**: React useState/useReducer (no external state library)
- **No backend server** — the runtime engine runs client-side in the browser for now. We will add a server later.

---

## PROJECT STRUCTURE

```
envelope-system/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── tailwind.config.mjs
├── src/
│   ├── components/
│   │   ├── ui/                      ← shadcn components
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx         ← single agent card
│   │   │   └── AgentGrid.tsx         ← grid of agent cards
│   │   ├── envelopes/
│   │   │   ├── EnvelopeCard.tsx      ← single envelope display
│   │   │   └── EnvelopeList.tsx      ← list of envelopes
│   │   ├── logic/
│   │   │   └── LogicViewer.tsx       ← code block showing agent logic
│   │   ├── promises/
│   │   │   ├── PromiseRow.tsx        ← single promise with status
│   │   │   └── PromiseTracker.tsx    ← list of promises
│   │   ├── renderer/
│   │   │   └── JsonRenderer.tsx      ← takes JSON schema, renders correct component
│   │   └── workspace/
│   │       └── AgentWorkspace.tsx    ← the main page component
│   ├── engine/
│   │   ├── types.ts                  ← all TypeScript interfaces
│   │   ├── Agent.ts                  ← Agent class with action registry
│   │   ├── Envelope.ts              ← Envelope creation and validation
│   │   ├── Router.ts                ← routes envelopes between agents
│   │   ├── PromiseTracker.ts        ← tracks promise state
│   │   └── Runtime.ts               ← orchestrates everything
│   ├── schemas/
│   │   ├── workspace.json            ← the UI JSON schema for the workspace page
│   │   └── sample-agents.json        ← sample agent definitions for demo
│   ├── layouts/
│   │   └── Layout.astro              ← base layout
│   └── pages/
│       └── index.astro               ← main page
```

---

## PART 1: RUNTIME ENGINE (`src/engine/`)

### `types.ts` — Core Interfaces

```typescript
// The Envelope — fundamental unit of agent communication
interface Envelope {
  id: string;                       // unique ID e.g. "env-0x3fa"
  env: {
    envelope: string;               // self-reference ID
    action: string;                 // action name to execute
    inputs: Record<string, any>;    // parameters for the action
  };
  payload: {
    status: "pending" | "resolved" | "rejected";
    results: any | null;
  };
  callback: Envelope | null;        // next envelope in the chain
  metadata?: {
    sender: string;                 // agent ID that sent this
    receiver: string;               // agent ID that receives this
    timestamp: number;
    parentEnvelope?: string;        // parent envelope ID if nested
  };
}

// An Agent — has a name, status, action registry, and processes envelopes
interface Agent {
  id: string;
  name: string;
  status: "ready" | "waiting" | "idle" | "error";
  actions: Record<string, ActionHandler>;
  envelopes: Envelope[];            // queue of envelopes this agent has
  promises: AgentPromise[];
}

// Action handler — a function an agent can execute
type ActionHandler = (inputs: Record<string, any>) => any | Promise<any>;

// Promise — tracks async envelope resolution
interface AgentPromise {
  id: string;
  label: string;
  status: "pending" | "resolved" | "rejected" | "idle";
  envelope: string;                 // envelope ID this promise tracks
  result?: any;
}

// The UI JSON schema types
interface UISchema {
  id: string;
  type: string;
  [key: string]: any;
  children?: UISchema[];
}
```

### `Agent.ts` — Agent Class

This is the core execution logic from the whiteboard:

```typescript
class DeterministicAgent implements Agent {
  id: string;
  name: string;
  status: "ready" | "waiting" | "idle" | "error";
  actions: Record<string, ActionHandler>;
  envelopes: Envelope[];
  promises: AgentPromise[];

  constructor(id: string, name: string, actions: Record<string, ActionHandler>) {
    this.id = id;
    this.name = name;
    this.status = "idle";
    this.actions = actions;
    this.envelopes = [];
    this.promises = [];
  }

  // THE LOGIC — this is exactly what was on the whiteboard
  async execute(envelope: Envelope): Promise<void> {
    // 1. Destructure from envelope payload
    const { action, inputs } = envelope.env;
    const { callback } = envelope;

    // 2. Look up action by name, call it with inputs
    let result = await this.actions[action](inputs);

    // 3. Update envelope payload with results
    envelope.payload.status = "resolved";
    envelope.payload.results = result;

    // 4. If callback exists, pack results and route
    if (callback) {
      callback.payload.results = { ...result };
      this.substitute(callback, result);
      await this.route(callback);
    }
  }

  // Template interpolation — replace {{ references }} in callback with actual values
  substitute(envelope: Envelope, previousResults: any): void {
    // Walk the envelope inputs and replace any {{ env-xxx.results }} patterns
    // with actual values from previousResults
    const inputs = envelope.env.inputs;
    for (const key in inputs) {
      if (typeof inputs[key] === "string" && inputs[key].startsWith("{{") && inputs[key].endsWith("}}")) {
        inputs[key] = previousResults;
      }
    }
  }

  // Send envelope to the next agent via the Router
  async route(envelope: Envelope): Promise<void> {
    // This calls into Router.ts which resolves the receiver agent and calls agent.execute()
    // For now emit an event or call a callback that the Runtime picks up
  }
}
```

### `Envelope.ts` — Envelope Factory

```typescript
// Helper to create envelopes with unique IDs
function createEnvelope(params: {
  action: string;
  inputs: Record<string, any>;
  sender: string;
  receiver: string;
  callback?: Envelope | null;
}): Envelope {
  const id = `env-${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    env: {
      envelope: id,
      action: params.action,
      inputs: params.inputs,
    },
    payload: {
      status: "pending",
      results: null,
    },
    callback: params.callback || null,
    metadata: {
      sender: params.sender,
      receiver: params.receiver,
      timestamp: Date.now(),
    },
  };
}
```

### `Router.ts` — Routes Envelopes Between Agents

```typescript
class Router {
  agents: Map<string, DeterministicAgent>;

  constructor() {
    this.agents = new Map();
  }

  register(agent: DeterministicAgent): void {
    this.agents.set(agent.id, agent);
  }

  async route(envelope: Envelope): Promise<void> {
    const receiverId = envelope.metadata?.receiver;
    if (!receiverId) throw new Error("No receiver on envelope");

    const agent = this.agents.get(receiverId);
    if (!agent) throw new Error(`Agent ${receiverId} not found`);

    agent.envelopes.push(envelope);
    agent.status = "ready";
    await agent.execute(envelope);
  }
}
```

### `PromiseTracker.ts` — Tracks Promise State

```typescript
class PromiseTracker {
  promises: Map<string, AgentPromise>;

  constructor() {
    this.promises = new Map();
  }

  create(envelopeId: string, label: string): AgentPromise {
    const promise: AgentPromise = {
      id: `p-${crypto.randomUUID().slice(0, 6)}`,
      label,
      status: "pending",
      envelope: envelopeId,
    };
    this.promises.set(promise.id, promise);
    return promise;
  }

  resolve(promiseId: string, result: any): void {
    const p = this.promises.get(promiseId);
    if (p) {
      p.status = "resolved";
      p.result = result;
    }
  }

  reject(promiseId: string): void {
    const p = this.promises.get(promiseId);
    if (p) p.status = "rejected";
  }

  getAll(): AgentPromise[] {
    return Array.from(this.promises.values());
  }
}
```

### `Runtime.ts` — Orchestrator

```typescript
class Runtime {
  router: Router;
  promiseTracker: PromiseTracker;
  eventLog: Array<{ ts: number; level: string; msg: string }>;

  constructor() {
    this.router = new Router();
    this.promiseTracker = new PromiseTracker();
    this.eventLog = [];
  }

  registerAgent(agent: DeterministicAgent): void {
    // Wire up the agent's route method to use our router
    agent.route = async (envelope: Envelope) => {
      this.log("info", `Routing ${envelope.id} → ${envelope.metadata?.receiver}`);
      await this.router.route(envelope);
    };
    this.router.register(agent);
    this.log("info", `Agent registered: ${agent.name}`);
  }

  async send(envelope: Envelope): Promise<AgentPromise> {
    const promise = this.promiseTracker.create(
      envelope.id,
      `${envelope.env.action} → ${envelope.metadata?.receiver}`
    );
    this.log("info", `Envelope created: ${envelope.id}`);

    try {
      await this.router.route(envelope);
      this.promiseTracker.resolve(promise.id, envelope.payload.results);
      this.log("ok", `Promise ${promise.id} resolved`);
    } catch (e: any) {
      this.promiseTracker.reject(promise.id);
      this.log("error", `Promise ${promise.id} rejected: ${e.message}`);
    }

    return promise;
  }

  log(level: string, msg: string): void {
    this.eventLog.push({ ts: Date.now(), level, msg });
  }

  // Returns the full state as a JSON UI schema (this drives the frontend)
  toUISchema(): object {
    const agents = Array.from(this.router.agents.values());
    return {
      id: "agent-workspace",
      type: "page",
      layout: "vertical-stack",
      children: [
        {
          id: "panel-top",
          type: "tabbed-panel",
          activeTab: agents[0]?.id || "",
          tabs: agents.map(agent => ({
            id: agent.id,
            label: agent.name,
            content: {
              type: "section",
              children: [
                {
                  type: "agent-info",
                  agent: {
                    id: agent.id,
                    name: agent.name,
                    status: agent.status,
                    actionCount: Object.keys(agent.actions).length,
                  },
                },
                {
                  type: "promise-tracker",
                  label: "Promises",
                  items: agent.promises,
                },
              ],
            },
          })),
        },
        {
          id: "panel-bottom",
          type: "panel",
          // Shows the SELECTED agent's envelopes and logic
          children: [
            {
              type: "envelope-list",
              label: "Envelopes",
              items: [], // populated when agent is selected
            },
            {
              type: "logic-viewer",
              label: "Logic",
              code: "const { action, inputs, callback } = envelope.payload;\nlet result = this.actions[action](inputs);\nif (callback) {\n  callback.payload.results = { ...result };\n  this.substitute(callback);\n  route(callback);\n}",
            },
            {
              type: "envelope-list",
              label: "Envelopes (nested)",
              items: [], // populated with callback envelopes
            },
          ],
        },
      ],
    };
  }
}
```

---

## PART 2: FRONTEND UI

### Page Layout — What The User Sees

This is ONE page. Two panels stacked vertically.

```
┌──────────────────────────────────────────────┐
│ [agent-a] [agent-b] [agent-c]          TABS  │
├──────────────────────────────────────────────┤
│                                              │
│  A: agent-a                  ← selected tab  │
│  status: ready                               │
│  actions: 2                                  │
│                                              │
│  Promises                                    │
│    ◉ p-001  processData → agent-a  pending   │
│    ◉ p-002  route → agent-b       resolved   │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  Envelopes                                   │
│  ┌────────────────────────────────────────┐  │
│  │ ✉ env-0x3fa                            │  │
│  │   action:   processData                │  │
│  │   inputs:   { source: "feed" }         │  │
│  │   payload:  { status: "pending" }      │  │
│  │   callback → env-0x3fb                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Logic                                       │
│  ┌────────────────────────────────────────┐  │
│  │ const { action, inputs, callback }     │  │
│  │       = envelope.payload               │  │
│  │ result = this.actions[action](inputs)  │  │
│  │ if (callback) {                        │  │
│  │   callback.payload.results = {}        │  │
│  │   this.substitute(callback)            │  │
│  │   route(callback)                      │  │
│  │ }                                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Envelopes (nested)                          │
│  ┌────────────────────────────────────────┐  │
│  │ ✉ env-0x3fb  ← callback from 0x3fa    │  │
│  │   action:   routeEnvelope              │  │
│  │   inputs:   { target: "agent-b" }      │  │
│  │   payload:  {{ env-0x3fa.results }}    │  │
│  │   callback → env-0x3fc                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### JSON Renderer — The Key Component

Build `src/components/renderer/JsonRenderer.tsx`. This is a recursive component that takes a JSON schema node and renders the correct component based on `type`:

```
type → component mapping:

page            → div with vertical flex layout
tabbed-panel    → shadcn Tabs component
panel           → shadcn Card
section         → div with vertical flex, renders children recursively
agent-info      → AgentCard component
agent-grid      → grid of AgentCard components
promise-tracker → list of PromiseRow components
envelope-list   → list of EnvelopeCard components
logic-viewer    → shadcn Card with code block (monospace, syntax highlighted)
```

The JsonRenderer does ONE thing: `switch (node.type)` and renders the right component, passing the node's data as props. If a node has `children`, it recurses.

### Component Details

**AgentCard** (`src/components/agents/AgentCard.tsx`)
- Shows: agent name, status dot (green=ready, yellow=waiting, gray=idle, red=error), action count
- Uses shadcn Card + Badge

**EnvelopeCard** (`src/components/envelopes/EnvelopeCard.tsx`)
- Shows: envelope ID with ✉ icon, action name, inputs as formatted JSON, payload status, callback pointer (arrow to next envelope ID)
- Uses shadcn Card with monospace font for data fields
- Callback pointer should be a clickable link that highlights the target envelope

**LogicViewer** (`src/components/logic/LogicViewer.tsx`)
- Shows: the agent's execution code in a read-only code block
- Monospace font, subtle syntax highlighting (strings in one color, keywords in another)
- Uses shadcn Card as wrapper

**PromiseRow** (`src/components/promises/PromiseRow.tsx`)
- Shows: status dot, promise ID, label, status text
- Dot colors: green=resolved, yellow=pending, gray=idle, red=rejected

**PromiseTracker** (`src/components/promises/PromiseTracker.tsx`)
- Vertical list of PromiseRow components
- Section header "Promises"

**EnvelopeList** (`src/components/envelopes/EnvelopeList.tsx`)
- Vertical list of EnvelopeCard components
- Section header (either "Envelopes" or "Envelopes (nested)")

**AgentWorkspace** (`src/components/workspace/AgentWorkspace.tsx`)
- The main page component
- Initializes the Runtime, creates sample agents, sends sample envelopes
- Calls `runtime.toUISchema()` to get JSON
- Passes JSON to JsonRenderer
- Manages tab state (which agent is selected)
- When tab changes, updates the bottom panel to show that agent's envelopes

### The Astro Page

`src/pages/index.astro`:
- Uses Layout.astro
- Renders `<AgentWorkspace client:load />` as a React island

### Sample Data For Demo

Create 3 sample agents on initialization:

**agent-a** "Data Processor"
- Actions: `processData` (returns `{ processed: true, count: 42 }`), `validate` (returns `{ valid: true }`)

**agent-b** "Router"
- Actions: `routeEnvelope` (returns `{ routed: true, target: inputs.target }`)

**agent-c** "Validator"
- Actions: `signPayload` (returns `{ signed: true, hash: "0xabc..." }`)

Create a sample envelope chain on startup:
1. Envelope to agent-a: action=processData, inputs={ source: "api/feed", limit: 100 }
2. Callback envelope to agent-b: action=routeEnvelope, inputs={ target: "agent-c", data: "{{ env-1.results }}" }
3. Callback envelope to agent-c: action=signPayload, inputs={ payload: "{{ env-2.results }}" }

Execute the chain so the UI shows envelopes in various states (some resolved, some pending).

---

## DESIGN DIRECTION

- Dark theme. Near-black backgrounds (#0a0a0f), subtle borders (#1e293b), monospace for data
- Status colors: green (#22c55e) for ready/resolved, amber (#eab308) for pending/waiting, slate (#64748b) for idle, red (#ef4444) for error
- Envelope cards should feel like actual envelopes — subtle paper-like quality, slightly elevated
- The Logic viewer should feel like a terminal/code editor
- Tab bar should be clean and minimal, active tab clearly highlighted
- Use shadcn Tabs, Card, Badge, Separator components
- Keep it functional and clear — this is a developer tool, not a consumer app

---

## BUILD ORDER

1. Initialize Astro project with React 19 + Tailwind 4 + shadcn/ui
2. Create `src/engine/types.ts` with all interfaces
3. Create `src/engine/Envelope.ts` — factory function
4. Create `src/engine/Agent.ts` — DeterministicAgent class
5. Create `src/engine/PromiseTracker.ts`
6. Create `src/engine/Router.ts`
7. Create `src/engine/Runtime.ts` with `toUISchema()`
8. Create all UI components (AgentCard, EnvelopeCard, LogicViewer, PromiseRow, PromiseTracker, EnvelopeList)
9. Create `src/components/renderer/JsonRenderer.tsx`
10. Create `src/components/workspace/AgentWorkspace.tsx` — wires runtime to UI
11. Create `src/pages/index.astro`
12. Wire up sample agents and envelope chain
13. Verify the full flow: runtime executes → generates JSON schema → JsonRenderer renders UI → tabs switch between agents → bottom panel updates

---

## CRITICAL REQUIREMENTS

1. **The UI is JSON-driven.** Components never hardcode data. Everything flows through the JSON schema from `runtime.toUISchema()`. The JsonRenderer is the only bridge between data and display.

2. **The envelope chain actually executes.** This is not mock data. The Runtime creates real agents, sends real envelopes, callbacks actually fire, promises actually track state. The UI reflects the real runtime state.

3. **Tabs are agents.** Each tab in the top panel is one agent. Clicking a tab selects that agent. The bottom panel shows THAT agent's envelopes, logic, and nested callback envelopes.

4. **The two panels are the two boxes from the whiteboard:**
   - Top box = tabbed panel, tabs are agents, content shows agent info + promises
   - Bottom box = that agent's envelopes → logic → nested envelopes (callbacks)

5. **Everything is TypeScript.** No `any` types except where explicitly shown in the interfaces above. Strict mode.

6. **The system is extensible.** Adding a new agent = creating a new DeterministicAgent with actions and registering it. Adding a new UI component type = adding a case to JsonRenderer. Adding a new action = adding a function to an agent's action registry.