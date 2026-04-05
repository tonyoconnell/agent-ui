# ONE UI Integration TODO

> **Synced with [TODO.md](TODO.md) Phase 2b (U-1 through U-8)**
> This file contains detailed specs. Main tracking in TODO.md.

Full integration of `one.tql` schema into the visual interface.

## The Vision

```
┌─────────────────────────────────────────────────────────────────────┐
│  Stats Bar: units:12 proven:8 tasks:45 ready:12 highways:5 $1.2k  │
├──────────────────────────────────────────────┬──────────────────────┤
│                                              │                      │
│                                              │   Flow Panel         │
│          GRAPH CANVAS                        │   ├─ Highways        │
│                                              │   ├─ Fading          │
│    [Unit] ══════════> [Unit]                 │   └─ Recent          │
│      │                  │                    │                      │
│      │    ╭─ particle   │                    │   Knowledge Panel    │
│      │    │  travels    │                    │   ├─ Hypotheses      │
│      │    ╰─────────────╯                    │   ├─ Frontiers       │
│      v                                       │   └─ Objectives      │
│    [Task] ─ ─ ─ ─ ─ ─> [Task]               │                      │
│                                              │   Inspector          │
│                                              │   └─ Selected item   │
│                                              │                      │
├──────────────────────────────────────────────┴──────────────────────┤
│  💬 Chat: "create scout" "connect scout to analyst" "show highways" │
│  🎤 Voice                                              [Send →]     │
└─────────────────────────────────────────────────────────────────────┘
```

## Related Docs

- **[one.tql](../src/schema/one.tql)** — Full TypeDB schema
- **[flow.md](flow.md)** — Animation & sequence design
- **[framework.md](framework.md)** — Architecture overview

## Current State

- [x] Basic graph visualization (React Flow)
- [x] Metaphor skin system (6 skins)
- [x] Chat with voice input
- [x] Simple command parser
- [x] TypeScript types (`src/types/one.ts`)
- [x] Animation design (`docs/flow.md`)
- [x] TypeDB HTTP client (`src/lib/typedb.ts`)
- [x] World patterns (`src/engine/colony-patterns.ts`)
- [x] AI components (43 files from ONE)
- [x] UI components (15 shadcn components)
- [x] Chat API routes (chat.ts, chat-claude-code.ts)
- [x] Tools registry (`src/lib/tools/`)
- [x] Hooks (useVoiceInput, useAIChat, useMobile, useToast)
- [x] Lib/AI (chat-engine, stream-parser, model-config)

## Phase 1: TypeDB Connection

- [ ] **TypeDB HTTP Client** (`src/lib/typedb.ts`)
  - Token caching with refresh
  - Query helper with error handling
  - Parse TypeDB JSON responses
  
- [ ] **Environment Config**
  ```
  TYPEDB_URL=https://your-cluster.typedb.com
  TYPEDB_DATABASE=one
  TYPEDB_USERNAME=admin
  TYPEDB_PASSWORD=secret
  ```

- [ ] **API Routes** (Astro)
  - `POST /api/query` - Run TypeQL queries
  - `POST /api/signal` - Send signal (creates event)
  - `POST /api/drop` - Add weight to edge
  - `POST /api/resistance` - Add resistance to edge
  - `GET /api/state` - Full world state

## Phase 2: Graph Updates

### Node Types (React Flow)

- [ ] **UnitNode** — Actors
  - Show uid, name, unitKind icon
  - Color by status: proven (green), active (blue), at-risk (red)
  - Badge: successRate, balance
  - Handles: in (signals), out (signals)

- [ ] **TaskNode** — Things
  - Show tid, name, taskType icon
  - Border by status: todo, in_progress, complete, blocked
  - Badge: price (if >0), priority
  - Glow if attractive, dim if repelled

- [ ] **SwarmNode** — Groups
  - Container for units
  - Show member count
  - Collapsible

- [ ] **KnowledgeNode** — Hypotheses, Frontiers, Objectives
  - Different shape (hexagon?)
  - Status indicators

### Edge Types

- [ ] **UnitEdge** — unit↔unit
  - Width by strength
  - Color by status: highway (bright), fresh (normal), fading (dim), toxic (red)
  - Label: revenue if >0
  - Animated particles when signal flows

- [ ] **TrailEdge** — task→task
  - Dashed line
  - Width by trailPheromone
  - Color by trailStatus

- [ ] **CapabilityEdge** — unit→task
  - Dotted line
  - Label: price

## Phase 3: Chat Commands

Expand command parser to match TypeQL functions:

```
// Queries
"show highways"        → highways()
"show proven units"    → proven_units()
"show at-risk"         → at_risk_units()
"show ready tasks"     → ready_tasks()
"show attractive"      → attractive_tasks()
"show frontiers"       → promising_frontiers()

// Routes
"route from X to Y"    → suggest_route($from, $task)
"cheapest for X"       → cheapest_provider($task)
"optimal from X to Y"  → optimal_route($from, $task)

// Actions
"drop X to Y +10"      → UPDATE edge strength
"resistance X to Y"         → UPDATE edge resistance
"signal X to Y"        → INSERT signal
"decay 10%"            → fade(0.1)
"spawn unit X"         → INSERT unit
"create task X"        → INSERT task
```

## Phase 4: Panels

### Stats Panel (top bar)
- [ ] Total units / proven / at-risk
- [ ] Total tasks / ready / attractive
- [ ] Highway count
- [ ] Total revenue
- [ ] GDP (total contribution)

### Flow Panel (right sidebar)
- [ ] Top 10 highways with strength bars
- [ ] Fading edges (about to die)
- [ ] Recent signals (last 10)

### Knowledge Panel
- [ ] Active hypotheses being tested
- [ ] Promising frontiers (EV > 0.5)
- [ ] Active objectives with progress bars

### Unit Inspector (on click)
- [ ] Full unit details
- [ ] L1 metrics: successRate, activityScore, sampleCount
- [ ] Capabilities (tasks this unit can do)
- [ ] Recent signals sent/received
- [ ] Connected units (edges)
- [ ] Contribution history

### Task Inspector (on click)
- [ ] Full task details
- [ ] Dependencies (blockers)
- [ ] Trails leading here
- [ ] Capable providers with prices
- [ ] x402 payment button if price > 0

## Phase 5: Real-time Updates

- [ ] **WebSocket** or polling for state changes
- [ ] Animate new signals flowing through graph
- [ ] Pulse nodes when they receive signals
- [ ] Fade edges over time (visual decay)
- [ ] Auto-refresh every 5s

## Phase 6: x402 Integration

- [ ] Connect wallet (Sui)
- [ ] Show balances on units
- [ ] Pay for task execution
- [ ] Revenue flows update edges
- [ ] GDP tracking

## Schema Integration

### Three TypeQL Schemas

| Schema | Purpose | UI Mapping |
|--------|---------|------------|
| `one.tql` | 6 dimensions | Main data model |
| `skins.tql` | Metaphor aliases | Query wrappers |
| `agents.tql` | Agent/action/routing | agents.json shape |

### Metaphor → TypeQL Function Mapping

```typescript
// Skin-aware queries use aliases from skins.tql
const queries = {
  ant: { actors: 'ants()', highways: 'trails($n)' },
  brain: { actors: 'neurons()', highways: 'pathways($n)' },
  team: { actors: 'agents()', highways: 'workflows($n)' },
  // ... etc - all call same underlying data
}
```

### agents.json Structure

```json
{
  "agents": [
    {
      "id": "scout",
      "name": "Scout",
      "caste": "scout",
      "status": "ready",
      "actions": { "observe": {}, "scan": {} }
    }
  ],
  "envelopes": [
    {
      "receiver": "scout",
      "receive": "observe",
      "payload": { "chain": "market" },
      "callback": { "receiver": "analyst", "receive": "evaluate", ... }
    }
  ]
}
```

## File Structure

```
src/
├── types/
│   └── one.ts              ✓ Complete (6 dimensions)
├── skins/
│   └── index.ts            ✓ Complete (6 skins)
├── lib/
│   ├── typedb.ts           ✓ Complete (HTTP client + token cache)
│   ├── ai/                 ✓ Complete (chat-engine, stream-parser, model-config)
│   ├── tools/              ✓ Complete (registry, executor, crypto, data, utilities)
│   └── animation.ts        □ TODO (timing constants)
├── components/
│   ├── graph/
│   │   ├── WorldGraph.tsx  ✓ Basic
│   │   ├── ActorNode.tsx   ✓ Exists (rename to UnitNode?)
│   │   ├── UnitNode.tsx    □ TODO (full one.tql fields)
│   │   ├── TaskNode.tsx    □ TODO
│   │   ├── SwarmNode.tsx   □ TODO (collapsible container)
│   │   ├── KnowledgeNode.tsx □ TODO (hypothesis/frontier)
│   │   ├── UnitEdge.tsx    □ TODO (strength/resistance/revenue)
│   │   ├── TrailEdge.tsx   □ TODO (task→task)
│   │   ├── Particles.tsx   □ TODO (signal flow animation)
│   │   └── GraphEffects.tsx □ TODO (inject/decay waves)
│   ├── panels/
│   │   ├── StatsPanel.tsx  □ TODO
│   │   ├── FlowPanel.tsx   ✓ Partial (in WorldWorkspace)
│   │   ├── KnowledgePanel.tsx  □ TODO
│   │   ├── UnitInspector.tsx   □ TODO
│   │   └── TaskInspector.tsx   □ TODO
│   └── world/
│       ├── WorldView.tsx   ✓ Chat + Graph
│       └── SandboxDrawer.tsx □ TODO (agent preview)
├── hooks/
│   ├── ai/                 ✓ Complete (useAIChat, basic, premium)
│   ├── use-voice-input.ts  ✓ Complete
│   ├── use-mobile.tsx      ✓ Complete
│   └── use-toast.ts        ✓ Complete
├── pages/
│   ├── api/
│   │   ├── chat.ts         ✓ Complete (OpenRouter multi-model)
│   │   ├── chat-claude-code.ts ✓ Complete (Claude Code with tools)
│   │   ├── query.ts        ✓ Exists (TypeDB)
│   │   ├── signal.ts       ✓ Exists
│   │   ├── drop.ts         ✓ Exists
│   │   ├── resistance.ts        ✓ Exists
│   │   ├── decay.ts        ✓ Exists
│   │   └── state.ts        ✓ Exists
│   ├── world.astro         ✓ Complete
│   ├── chat.astro          ✓ Complete
│   ├── tasks.astro         □ TODO (task board)
│   └── discover.astro      □ TODO (agent discovery)
├── schema/
│   ├── one.tql             ✓ Complete (6 dimensions)
│   ├── skins.tql           ✓ Complete (metaphors)
│   └── agents.tql          ✓ Complete (routing)
└── public/
    └── agents.json         ✓ Complete (9 agents)
```

## Phase 7: Visual Effects

> **See [flow.md](flow.md) for full animation design**

### Signal Flow Sequence (5 stages)

| Stage | Time | Animation | Implementation |
|-------|------|-----------|----------------|
| 1. Departure | 0ms | Node breathes out | `signal-send` keyframes |
| 2. Travel | 50-150ms | Particle along edge | `offset-path` + RAF |
| 3. Receive | 150ms | Node pulses | `signal-receive` keyframes |
| 4. Trail Update | 200ms | Edge thickens | `stroke-width` transition |
| 5. Highway Form | 500ms+ | Celebration burst | `highway-form` keyframes |

### Implementation Tasks

**Particle System** (`src/components/graph/Particles.tsx`)
- [ ] Create `<Particle>` component with skin-aware styling
- [ ] Path following using `offset-path` CSS or manual interpolation
- [ ] Trail effect: spawn fading copies behind main particle
- [ ] Pool particles for performance (recycle DOM nodes)

**Node Animations** (`src/components/graph/AnimatedNode.tsx`)
- [ ] Wrap React Flow nodes with animation container
- [ ] `signal-send`: contract → release (100ms)
- [ ] `signal-receive`: expand + ring pulse (150ms)
- [ ] `status-change`: color morph + icon swap
- [ ] `shake`: horizontal wiggle on resistance

**Edge Animations** (`src/components/graph/AnimatedEdge.tsx`)
- [ ] Thickness transitions on strength change
- [ ] Glow intensity tied to strength (CSS variable)
- [ ] Dissolve animation on death
- [ ] Alarm flash (red pulse)

**Global Effects** (`src/components/graph/GraphEffects.tsx`)
- [ ] Inject ripple: SVG circle expanding from entry
- [ ] Decay wave: opacity sweep left→right
- [ ] Highway celebration: burst particles at both endpoints

**Timing Manager** (`src/lib/animation.ts`)
```typescript
const TIMING = {
  SIGNAL_SEND: 100,
  PARTICLE_TRAVEL: 200,
  SIGNAL_RECEIVE: 150,
  TRAIL_STRENGTHEN: 300,
  HIGHWAY_FORM: 500,
  DECAY_WAVE: 1000,
  EDGE_DISSOLVE: 400,
}
```

### Skin-Specific Particles

| Skin | Shape | Color | Trail Style |
|------|-------|-------|-------------|
| ant | dot | amber | gradient fade |
| brain | spark | cyan | electric arc |
| team | arrow | blue | motion blur |
| mail | envelope | yellow | stamp marks |
| water | droplet | teal | ripple rings |
| signal | wave | green | frequency line |

### Performance Budget
- [ ] Max 20 simultaneous particles
- [ ] Throttle to 30fps during burst
- [ ] Skip particles if >10 signals/sec
- [ ] Use `will-change` sparingly
- [ ] Prefer `transform` and `opacity` only

### Sound (Phase 8, optional)
- [ ] Web Audio API context
- [ ] Preload sound sprites
- [ ] Volume tied to activity level
- [ ] Mute preference in settings

## Priority Order

1. **TypeDB Client** — needed for real data
2. **UnitNode + UnitEdge** — core visualization
3. **Stats Panel** — show the numbers
4. **Visual Effects** — make it beautiful
5. **Chat Commands** — control the world
6. **Real-time** — make it live
7. **x402** — make it pay

## Quick Wins (No TypeDB)

These can work with the in-memory colony:

- [ ] Show inferred edge status (highway/fresh/fading) based on strength
- [ ] Color units by success rate
- [ ] Add price badges to nodes
- [ ] Better command help in chat
- [ ] Keyboard shortcuts (space = inject, d = decay)

---

*One schema. One world. Infinite clarity.*
