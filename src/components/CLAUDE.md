# Components

**Skills: `/react19` for React patterns, `/reactflow` for graphs, `/shadcn` for UI components.**

## Organization

```
components/
  AgentWorkspace.tsx    # Main agent view with colony integration
  WorldWorkspace.tsx    # ONE ontology view with metaphor skins
  EnvelopeFlowCanvas.tsx
  EdgeInfo.tsx
  controls/             # UI controls (SkinSwitcher)
  graph/                # ReactFlow visualizations (ColonyGraph, ColonyEditor, WorldGraph)
  panels/               # Side panels (HighwayPanel)
  world/                # World view components
```

## Patterns

### Props & Types
```tsx
interface Props {
  agents: AgentData[]
  highways: Edge[]
  onSelect?: (id: string) => void
}
export function Component({ agents, highways, onSelect }: Props) { ... }
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
net.spawnFromJSON(agent)
await net.send(envelope)
const highways = net.highways(30)
```

### ReactFlow Graphs
- Import from `@xyflow/react`
- Custom nodes with `Handle` components
- Custom edges with `getBezierPath`, `BaseEdge`
- Dark background: `<Background color="#333" gap={20} />`

## Key Components

| Component | Purpose |
|-----------|---------|
| `AgentWorkspace` | Agent management, envelope chains, colony state |
| `WorldWorkspace` | ONE ontology with switchable metaphor skins |
| `ColonyGraph` | Read-only ReactFlow visualization of highways |
| `ColonyEditor` | Interactive graph editing, signal injection |
| `SkinSwitcher` | Toggle metaphor skins (ant/neuron/agent) |
| `HighwayPanel` | Display weighted paths with strength bars |
