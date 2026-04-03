# React Flow Development

Build interactive node-based UIs with React Flow. Create visual editors, flowcharts, and graph visualizations.

## When to Use This Skill

- Create visual flow editors and graph UIs
- Build custom node and edge components
- Implement drag-and-drop flow builders
- Add animations and interactions to graphs
- Layout nodes automatically with Dagre/ELK

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│  ReactFlow                                                       │
│  ├── nodes: Node[]           # Visual elements                  │
│  ├── edges: Edge[]           # Connections between nodes        │
│  ├── nodeTypes: {}           # Custom node components           │
│  ├── edgeTypes: {}           # Custom edge components           │
│  ├── onNodesChange           # Node state updates               │
│  ├── onEdgesChange           # Edge state updates               │
│  └── onConnect               # New connection handler           │
│                                                                  │
│  Children:                                                       │
│  ├── <Background />          # Grid or dots background          │
│  ├── <Controls />            # Zoom/fit controls                │
│  ├── <MiniMap />             # Overview minimap                 │
│  └── <Panel />               # Positioned overlays              │
└─────────────────────────────────────────────────────────────────┘
```

## Basic Setup

```tsx
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type OnConnect,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

const initialNodes: Node[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Start" } },
  { id: "2", position: { x: 200, y: 100 }, data: { label: "End" } },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
]

export function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
```

## Custom Nodes

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react"

interface CustomNodeData {
  label: string
  status: "active" | "idle" | "error"
  [key: string]: unknown  // Required for ReactFlow
}

function CustomNode({ data, selected }: NodeProps<Node<CustomNodeData>>) {
  return (
    <div className={cn(
      "px-4 py-2 rounded-lg border",
      selected && "ring-2 ring-blue-500"
    )}>
      {/* Input handle (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500"
      />

      {/* Node content */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "w-2 h-2 rounded-full",
          data.status === "active" && "bg-green-500",
          data.status === "idle" && "bg-gray-500",
          data.status === "error" && "bg-red-500"
        )} />
        <span>{data.label}</span>
      </div>

      {/* Output handle (right side) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500"
      />
    </div>
  )
}

// Register custom node types
const nodeTypes = { custom: CustomNode }

// Use in ReactFlow
<ReactFlow nodeTypes={nodeTypes} ... />

// Create nodes with custom type
const nodes: Node[] = [
  { id: "1", type: "custom", position: { x: 0, y: 0 }, data: { label: "Node", status: "active" } }
]
```

## Custom Edges

```tsx
import {
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react"

interface CustomEdgeData {
  strength: number
  [key: string]: unknown
}

function CustomEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const strength = (data as CustomEdgeData)?.strength || 0

  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        path={path}
        style={{
          stroke: strength > 50 ? "#22c55e" : "#64748b",
          strokeWidth: Math.max(1, strength / 10),
        }}
      />

      {/* Animated particles */}
      {strength > 50 && (
        <circle r={3} fill="#22c55e">
          <animateMotion dur="2s" repeatCount="indefinite" path={path} />
        </circle>
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className="absolute px-2 py-1 bg-black/80 rounded text-xs"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {strength}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = { custom: CustomEdge }
```

## Key Hooks

```tsx
// State management
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

// Flow instance (for programmatic control)
const { fitView, zoomIn, zoomOut, getNodes, getEdges, setViewport } = useReactFlow()

// Get current node ID (inside custom node)
const nodeId = useNodeId()

// Access nodes/edges reactively
const nodes = useNodes()
const edges = useEdges()
```

## Important Event Handlers

```tsx
<ReactFlow
  // Node events
  onNodeClick={(event, node) => console.log("Clicked:", node.id)}
  onNodeDragStart={(event, node) => console.log("Drag start:", node.id)}
  onNodeDrag={(event, node) => console.log("Dragging:", node.position)}
  onNodeDragStop={(event, node) => console.log("Drag stop:", node.id)}
  onNodesDelete={(nodes) => console.log("Deleted:", nodes)}

  // Edge events
  onEdgeClick={(event, edge) => console.log("Edge clicked:", edge.id)}
  onEdgesDelete={(edges) => console.log("Edges deleted:", edges)}

  // Connection events
  onConnect={(connection) => console.log("Connected:", connection)}
  onConnectStart={(event, params) => console.log("Connect start")}
  onConnectEnd={(event) => console.log("Connect end")}

  // Viewport events
  onMoveStart={() => console.log("Pan/zoom start")}
  onMove={(event, viewport) => console.log("Viewport:", viewport)}
  onMoveEnd={() => console.log("Pan/zoom end")}

  // Selection events
  onSelectionChange={({ nodes, edges }) => console.log("Selected:", nodes, edges)}
/>
```

## Layout with Dagre

```tsx
import dagre from "@dagrejs/dagre"

function layoutNodes(nodes: Node[], edges: Edge[], direction = "LR") {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 180, height: 80 })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const { x, y } = g.node(node.id)
    return { ...node, position: { x: x - 90, y: y - 40 } }
  })
}
```

## Drag and Drop

```tsx
function FlowWithDragDrop() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault()

    const type = event.dataTransfer.getData("application/reactflow")
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position,
      data: { label: `New ${type}` },
    }

    setNodes((nds) => [...nds, newNode])
  }, [screenToFlowPosition, setNodes])

  return (
    <div ref={reactFlowWrapper} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow ... />
    </div>
  )
}
```

## Animation Patterns

```tsx
// Animated edge particles
<circle r={3} fill="currentColor">
  <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
</circle>

// Pulsing glow
<path
  d={path}
  className="animate-pulse"
  style={{ filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))" }}
/>

// Node entrance animation
<div className="animate-in fade-in zoom-in duration-300">
  {/* node content */}
</div>

// Edge drawing animation
<path
  d={path}
  strokeDasharray={pathLength}
  strokeDashoffset={pathLength}
  style={{ animation: "draw 1s forwards" }}
/>
```

## Common Props Reference

| Prop | Type | Description |
|------|------|-------------|
| `nodes` | `Node[]` | Array of nodes |
| `edges` | `Edge[]` | Array of edges |
| `nodeTypes` | `Record<string, Component>` | Custom node components |
| `edgeTypes` | `Record<string, Component>` | Custom edge components |
| `fitView` | `boolean` | Auto-fit on mount |
| `minZoom` / `maxZoom` | `number` | Zoom limits |
| `panOnDrag` | `boolean` | Enable panning |
| `zoomOnScroll` | `boolean` | Enable zoom |
| `nodesDraggable` | `boolean` | Enable node dragging |
| `nodesConnectable` | `boolean` | Enable new connections |
| `proOptions` | `{ hideAttribution: boolean }` | Pro options |

## Tips

1. **Always use `useCallback`** for event handlers to prevent re-renders
2. **Include `[key: string]: unknown`** in custom data interfaces for ReactFlow compatibility
3. **Use `fitViewOptions={{ padding: 0.3 }}`** for better initial view
4. **Wrap in `<ReactFlowProvider>`** when using hooks outside the main component
5. **Use `EdgeLabelRenderer`** for HTML labels on edges (not SVG)

## Import Pattern

```tsx
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodes,
  useEdges,
  useNodeId,
  addEdge,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type OnConnect,
  type Connection,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
```

---

**Version**: 12.x (@xyflow/react)
**Docs**: https://reactflow.dev
