# Components

**Skills: `/react19` for React patterns, `/reactflow` for graphs, `/shadcn` for UI components.**

## Substrate Learning

Components visualize the learning. The graph that routes signals is the same graph the UI renders:

```
net.highways(30)    → HighwayPanel bars        (proven paths)
net.strength        → ReactFlow edge thickness  (learning state)
net.resistance      → ReactFlow edge color      (failure state)
rubric dims         → per-skill radar chart      (fit/form/truth/taste)
```

**Speed contract:** Components read from in-memory state via API (`/api/state`, `/api/export/highways`). KV cache delivers `<10ms`. The UI shows the learning AS IT HAPPENS — highways forming, paths fading, toxic edges blocking.

**Context:** [DSL.md](../../docs/DSL.md) — signal grammar the UI represents. [dictionary.md](../../docs/dictionary.md) — canonical names for display. [routing.md](../../docs/routing.md) — what highways/toxic/fading mean. [rubrics.md](../../docs/rubrics.md) — quality dims to visualize. [speed.md](../../docs/speed.md) — why real-time visualization is possible. [buy-and-sell.md](../../docs/buy-and-sell.md) — `/marketplace` and `/discover` components expose the LIST/DISCOVER steps; capability cards show price from `capability.price`. [revenue.md](../../docs/revenue.md) — Layer 2 discovery and Layer 4 marketplace are the commerce-facing pages. [lifecycle.md](../../docs/lifecycle.md) — agent journey visible in components: `AgentBuilder` = register stage, `DiscoverGrid` = discover stage, `HighwayPanel` = highway stage. [patterns.md](../../docs/patterns.md) — closed loop and zero-returns patterns apply to every component that emits signals.

## Organization

```
components/
  AgentWorkspace.tsx    # Main agent view with world integration
  WorldWorkspace.tsx    # ONE world view with metaphor skins
  Dashboard.tsx         # Overview dashboard
  TaskBoard.tsx         # Task/highway visualization
  EdgeInfo.tsx          # Path detail view
  EnvelopeFlowCanvas.tsx
  controls/             # UI controls (SkinSwitcher)
  graph/                # ReactFlow visualizations (ColonyGraph, WorldEditor, WorldGraph)
  panels/               # Side panels (HighwayPanel)
  world/                # World view components (WorldView, WorldChat)
  onboard/              # Onboarding (AgentBuilder, DiscoverGrid, SignupForm)
  ai/                   # Chat, elements, tool calls
  ui/                   # shadcn primitives
```

## Patterns

### Props & Types
```tsx
interface Props {
  highways: Edge[]
  onSelect?: (id: string) => void
}
export function Component({ highways, onSelect }: Props) { ... }
```

### Styling
```tsx
import { cn } from "@/lib/utils"
<div className={cn("base-classes", isActive && "active-class", className)} />
```

Dark theme: `bg-[#0a0a0f]`, `bg-[#161622]`, `border-[#252538]`, `text-slate-400`

### Substrate Integration
```tsx
import { world } from "@/engine"
import type { World, Edge } from "@/engine"

const net = world()
const scout = net.spawn('scout')
  .on('observe', (data, emit) => { ... })
  .then('observe', r => ({ receiver: 'analyst', data: r }))
net.signal({ receiver: 'scout:observe', data: {} })
const highways = net.highways(30)
```

### TaskBoard Data (from substrate, not TypeDB)
```tsx
// Highways = proven paths
const proven = net.highways(20)

// Blocked = resistance dominates strength (toxicity threshold)
const blocked = Object.entries(net).filter(([e]) => {
  const s = net.strength?.[e] ?? 0
  const r = net.resistance?.[e] ?? 0
  return r >= 10 && r > s * 2
})

// Unexplored = handlers with no strength history
const explored = new Set(
  Object.keys(net.strength ?? {}).flatMap(e => e.split('→'))
)
```

### ReactFlow Graphs
- Import from `@xyflow/react`
- Custom nodes with `Handle` components
- Custom edges with `getBezierPath`, `BaseEdge`
- Dark background: `<Background color="#333" gap={20} />`

## Key Components

| Component | Purpose |
|-----------|---------|
| `AgentWorkspace` | Agent management, world state |
| `WorldWorkspace` | ONE world with switchable metaphor skins |
| `WorldPageWrapper` | Wrapper for world page with auth/state |
| `Dashboard` | Overview with highways, stats |
| `TaskBoard` | Pheromone visualization (reads from substrate) |
| `ColonyGraph` | Read-only ReactFlow visualization of highways |
| `PheromoneGraph` | Pheromone-aware ReactFlow visualization |
| `WorldEditor` | Interactive graph editing, signal injection |
| `HighwayPanel` | Weighted paths with strength bars |
| `KnowledgePanel` | Hypothesis and frontier display |
| `CEOPanel` | Governance view — toxic paths, proven paths |
| `SpeedtestDashboard` | Live performance benchmark display |
| `TeamBuilder` | Onboarding — build agent team from markdown |
| `UnitProfile` | Public unit profile card |
