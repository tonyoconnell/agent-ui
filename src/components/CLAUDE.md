# Components

**Skills: `/react19` for React patterns, `/reactflow` for graphs, `/shadcn` for UI components.**

## Organization

```
components/
  AgentWorkspace.tsx    # Main agent view with colony integration
  WorldWorkspace.tsx    # ONE world view with metaphor skins
  Dashboard.tsx         # Overview dashboard
  TaskBoard.tsx         # Task/highway visualization
  EdgeInfo.tsx          # Path detail view
  EnvelopeFlowCanvas.tsx
  controls/             # UI controls (SkinSwitcher)
  graph/                # ReactFlow visualizations (ColonyGraph, ColonyEditor, WorldGraph)
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
import { colony } from "@/engine"
import type { Colony, Edge } from "@/engine"

const net = colony()
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

// Blocked = alarm dominates
const blocked = Object.entries(net.alarm)
  .filter(([e, a]) => a > (net.scent[e] || 0))

// Unexplored = handlers with no scent history
const explored = new Set(Object.keys(net.scent).flatMap(e => e.split('→')))
```

### ReactFlow Graphs
- Import from `@xyflow/react`
- Custom nodes with `Handle` components
- Custom edges with `getBezierPath`, `BaseEdge`
- Dark background: `<Background color="#333" gap={20} />`

## Key Components

| Component | Purpose |
|-----------|---------|
| `AgentWorkspace` | Agent management, colony state |
| `WorldWorkspace` | ONE world with switchable metaphor skins |
| `Dashboard` | Overview with highways, stats |
| `TaskBoard` | Pheromone visualization (reads from substrate) |
| `ColonyGraph` | Read-only ReactFlow visualization of highways |
| `ColonyEditor` | Interactive graph editing, signal injection |
| `HighwayPanel` | Weighted paths with strength bars |
