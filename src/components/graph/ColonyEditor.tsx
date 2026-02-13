/**
 * COLONY EDITOR - Shape Emergent Intelligence
 *
 * The 85 lines made interactive:
 * - Draw edges (create trails)
 * - Adjust pheromones (shape learning)
 * - Spawn nodes (add chambers)
 * - Inject signals (watch flow)
 * - See emergence happen
 *
 * Simple interactions. Complex emergence.
 */

import { useCallback, useState, useRef, useEffect, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  type Node,
  type Edge as FlowEdge,
  type EdgeProps,
  type NodeProps,
  type Connection,
  type OnConnect,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { Colony, Edge } from "@/engine"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface AgentData {
  id: string
  name: string
  status?: string
  actions: Record<string, unknown>
}

interface ColonyEditorProps {
  colony: Colony
  agents: AgentData[]
  highways: Edge[]
  onAgentSelect?: (id: string) => void
  onColonyChange?: () => void
}

interface ChamberNodeData {
  id: string
  name: string
  status: string
  actions: string[]
  incoming: number
  outgoing: number
  isSuperhighway: boolean
  [key: string]: unknown
}

interface TrailEdgeData {
  strength: number
  fromTask: string
  toTask: string
  isSuperhighway: boolean
  [key: string]: unknown
}

// ============================================================================
// PHEROMONE EDITOR POPOVER
// ============================================================================

function PheromoneEditor({
  edgeId,
  strength,
  position,
  onClose,
  onChange,
  onDelete,
}: {
  edgeId: string
  strength: number
  position: { x: number; y: number }
  onClose: () => void
  onChange: (strength: number) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(strength)

  return (
    <div
      className="absolute z-50 bg-[#0f0f14] border border-[#252538] rounded-lg p-3 shadow-xl min-w-[200px]"
      style={{ left: position.x, top: position.y, transform: "translate(-50%, -100%) translateY(-10px)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-mono">Pheromone Level</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Strength display */}
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-2xl font-bold font-mono",
            value > 50 ? "text-blue-400" : value > 20 ? "text-indigo-400" : "text-slate-400"
          )}>
            {value.toFixed(0)}
          </span>
          <span className={cn(
            "text-xs px-2 py-1 rounded",
            value > 50 ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400"
          )}>
            {value > 50 ? "SUPERHIGHWAY" : value > 20 ? "Active" : "Weak"}
          </span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onMouseUp={() => onChange(value)}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={() => { setValue(0); onChange(0); }}
            className="flex-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => { setValue(100); onChange(100); }}
            className="flex-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Max
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SIGNAL INJECTOR
// ============================================================================

function SignalInjector({
  nodeId,
  tasks,
  position,
  onClose,
  onInject,
}: {
  nodeId: string
  tasks: string[]
  position: { x: number; y: number }
  onClose: () => void
  onInject: (task: string) => void
}) {
  return (
    <div
      className="absolute z-50 bg-[#0f0f14] border border-emerald-500/30 rounded-lg p-3 shadow-xl min-w-[180px]"
      style={{ left: position.x, top: position.y, transform: "translate(-50%, 10px)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-emerald-400 font-semibold">Inject Signal</span>
      </div>

      <div className="space-y-1">
        {tasks.map((task) => (
          <button
            key={task}
            onClick={() => { onInject(task); onClose(); }}
            className="w-full px-3 py-2 text-left text-sm bg-slate-800/50 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 rounded transition-colors font-mono"
          >
            {task}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// NODE PALETTE - Drag to spawn
// ============================================================================

function NodePalette({ onDragStart }: { onDragStart: (type: string, name: string) => void }) {
  const nodeTypes = [
    { type: "worker", name: "Worker", icon: "W", color: "bg-blue-500" },
    { type: "scout", name: "Scout", icon: "S", color: "bg-emerald-500" },
    { type: "analyst", name: "Analyst", icon: "A", color: "bg-purple-500" },
    { type: "trader", name: "Trader", icon: "T", color: "bg-amber-500" },
  ]

  return (
    <div className="bg-[#0a0a0f]/90 border border-[#252538] rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-2 font-semibold">Spawn Node</div>
      <div className="flex gap-2">
        {nodeTypes.map(({ type, name, icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow", JSON.stringify({ type, name }))
              e.dataTransfer.effectAllowed = "move"
              onDragStart(type, name)
            }}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center cursor-grab",
              "border border-slate-700 hover:border-slate-500 transition-all",
              "hover:scale-110 active:cursor-grabbing",
              color + "/20"
            )}
            title={`Drag to spawn ${name}`}
          >
            <span className={cn("text-sm font-bold", color.replace("bg-", "text-"))}>{icon}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// TRAIL EDGE - Interactive edge with pheromone editing
// ============================================================================

function TrailEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  const edgeData = data as TrailEdgeData | undefined
  const strength = edgeData?.strength || 0
  const isSuperhighway = edgeData?.isSuperhighway || false
  const fromTask = edgeData?.fromTask || ""
  const toTask = edgeData?.toTask || ""

  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.3,
  })

  const strokeWidth = Math.max(1, Math.min(strength / 10, 8))
  const color = isSuperhighway ? "#3b82f6" : strength > 20 ? "#6366f1" : "#334155"
  const glowOpacity = isSuperhighway ? 0.3 : 0.1

  return (
    <g className="react-flow__edge-path">
      {/* Glow layer */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 12}
        strokeOpacity={glowOpacity}
        className={isSuperhighway ? "animate-pulse" : ""}
      />

      {/* Main trail */}
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth,
          cursor: "pointer",
          filter: isSuperhighway ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))" : undefined
        }}
      />

      {/* Signal particles */}
      {isSuperhighway && (
        <g className="signal-particles">
          {[0, 0.33, 0.66].map((delay, i) => (
            <circle key={i} r={3 - i * 0.5} fill={`rgba(147, 197, 253, ${1 - i * 0.2})`}>
              <animateMotion dur="2s" repeatCount="indefinite" path={path} begin={`${delay}s`} />
            </circle>
          ))}
        </g>
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute pointer-events-auto px-2 py-1 rounded-md text-[10px] font-mono cursor-pointer",
            "transform -translate-x-1/2 -translate-y-1/2 transition-all",
            isSuperhighway
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/20"
              : "bg-[#0c0c10]/90 text-slate-400 border border-slate-700/50",
            selected && "ring-2 ring-blue-500"
          )}
          style={{ left: labelX, top: labelY }}
        >
          <span className="text-slate-500">{fromTask}</span>
          <span className="mx-1 text-slate-600">→</span>
          <span className={isSuperhighway ? "text-blue-300" : "text-slate-400"}>{toTask}</span>
          <span className={cn(
            "ml-2 px-1.5 py-0.5 rounded text-[9px]",
            isSuperhighway ? "bg-blue-500/30 text-blue-200" : "bg-slate-800 text-slate-500"
          )}>
            {strength.toFixed(0)}
          </span>
        </div>
      </EdgeLabelRenderer>
    </g>
  )
}

// ============================================================================
// CHAMBER NODE - Interactive node with signal injection
// ============================================================================

function ChamberNode({ data, selected }: NodeProps) {
  const d = data as ChamberNodeData
  const isActive = d.isSuperhighway
  const totalStrength = d.incoming + d.outgoing

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-[#16161f] to-[#0e0e14] rounded-xl border transition-all duration-200",
        "w-[180px] cursor-pointer select-none",
        isActive && "shadow-lg shadow-blue-500/30",
        selected ? "border-blue-500 ring-2 ring-blue-500/20" :
        isActive ? "border-blue-500/40" : "border-slate-700/40 hover:border-slate-500/60"
      )}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-3 !h-3 !border-2 !-left-1.5 transition-all",
          d.incoming > 0 ? "!bg-blue-400 !border-[#16161f]" : "!bg-slate-600 !border-[#16161f]"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-3 !h-3 !border-2 !-right-1.5 transition-all",
          d.outgoing > 0 ? "!bg-emerald-400 !border-[#16161f]" : "!bg-slate-600 !border-[#16161f]"
        )}
      />

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-all",
              isActive ? "bg-blue-500 shadow-md shadow-blue-500/50" : "bg-slate-600"
            )}>
              {isActive && <div className="w-full h-full rounded-full bg-blue-400 animate-ping" />}
            </div>
            <span className="text-white font-medium text-sm">{d.name}</span>
          </div>
          {totalStrength > 0 && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded",
              isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400"
            )}>
              {totalStrength.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-b border-slate-700/30">
        <div className="flex flex-wrap gap-1">
          {d.actions.map((name) => (
            <span
              key={name}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-mono",
                isActive ? "bg-blue-500/15 text-blue-300" : "bg-slate-800/60 text-slate-400"
              )}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Traffic bars */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-500 w-5">IN</span>
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", d.incoming > 50 ? "bg-blue-500" : "bg-slate-600")}
              style={{ width: `${Math.min(d.incoming, 100)}%` }}
            />
          </div>
          <span className={cn("text-[8px] font-mono w-5 text-right", d.incoming > 50 ? "text-blue-400" : "text-slate-500")}>
            {d.incoming.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-500 w-5">OUT</span>
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", d.outgoing > 50 ? "bg-emerald-500" : "bg-slate-600")}
              style={{ width: `${Math.min(d.outgoing, 100)}%` }}
            />
          </div>
          <span className={cn("text-[8px] font-mono w-5 text-right", d.outgoing > 50 ? "text-emerald-400" : "text-slate-500")}>
            {d.outgoing.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Superhighway badge */}
      {d.isSuperhighway && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
      )}
    </div>
  )
}

// ============================================================================
// ENTRY NODE
// ============================================================================

function EntryNode({ data }: NodeProps) {
  const d = data as { signals: number }
  return (
    <div className={cn(
      "bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 rounded-xl border border-emerald-500/30",
      "px-4 py-3 shadow-lg shadow-emerald-500/10 select-none"
    )}>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-emerald-900 !-right-1.5"
      />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div>
          <div className="text-emerald-300 font-semibold text-sm uppercase tracking-wide">Entry</div>
          <div className="text-emerald-500/70 text-[10px] font-mono">{d.signals} signals</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// NODE & EDGE TYPES
// ============================================================================

const nodeTypes = { chamber: ChamberNode, entry: EntryNode }
const edgeTypes = { trail: TrailEdge }

// ============================================================================
// COLONY EDITOR - The main component
// ============================================================================

export function ColonyEditor({ colony, agents, highways, onAgentSelect, onColonyChange }: ColonyEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Popover state
  const [edgeEditor, setEdgeEditor] = useState<{ id: string; strength: number; position: { x: number; y: number } } | null>(null)
  const [signalInjector, setSignalInjector] = useState<{ nodeId: string; tasks: string[]; position: { x: number; y: number } } | null>(null)

  // Calculate agent stats
  const agentStats = useMemo(() => {
    const stats: Record<string, { incoming: number; outgoing: number; isSuperhighway: boolean }> = {}
    agents.forEach(a => { stats[a.id] = { incoming: 0, outgoing: 0, isSuperhighway: false } })

    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]

      if (stats[sourceId]) {
        stats[sourceId].outgoing += strength
        if (strength > 50) stats[sourceId].isSuperhighway = true
      }
      if (stats[targetId]) {
        stats[targetId].incoming += strength
        if (strength > 50) stats[targetId].isSuperhighway = true
      }
    }
    return stats
  }, [highways, agents])

  // Build initial nodes
  const initialNodes = useMemo((): Node[] => {
    const colWidth = 280
    const rowHeight = 200
    const startX = 80
    const centerY = 250

    // BFS for ranks
    const outgoing: Record<string, Set<string>> = { entry: new Set() }
    agents.forEach(a => { outgoing[a.id] = new Set() })

    for (const { edge } of highways) {
      const [from, to] = edge.split(" → ")
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (outgoing[sourceId]) outgoing[sourceId].add(targetId)
    }

    const ranks: Record<string, number> = { entry: 0 }
    const queue = ["entry"]
    const visited = new Set(["entry"])

    while (queue.length) {
      const current = queue.shift()!
      for (const targetId of outgoing[current] || new Set()) {
        if (!visited.has(targetId)) {
          ranks[targetId] = (ranks[current] || 0) + 1
          visited.add(targetId)
          queue.push(targetId)
        }
      }
    }

    let nextRank = 1
    agents.forEach(a => { if (ranks[a.id] === undefined) ranks[a.id] = nextRank++ })

    const byRank: Record<number, string[]> = {}
    Object.entries(ranks).forEach(([id, r]) => {
      if (!byRank[r]) byRank[r] = []
      byRank[r].push(id)
    })

    const positions: Record<string, { x: number; y: number }> = {}
    Object.entries(byRank).forEach(([rankStr, ids]) => {
      const rank = parseInt(rankStr)
      const count = ids.length
      const totalHeight = (count - 1) * rowHeight
      const baseY = centerY - totalHeight / 2
      ids.forEach((id, i) => {
        positions[id] = { x: startX + rank * colWidth, y: baseY + i * rowHeight }
      })
    })

    const entryNode: Node = {
      id: "entry",
      type: "entry",
      position: positions["entry"] || { x: 80, y: 200 },
      data: { signals: highways.filter(h => h.edge.startsWith("entry")).length }
    }

    const chamberNodes: Node[] = agents.map(agent => ({
      id: agent.id,
      type: "chamber",
      position: positions[agent.id] || { x: 300, y: 200 },
      data: {
        id: agent.id,
        name: agent.name,
        status: agent.status || "ready",
        actions: Object.keys(agent.actions),
        incoming: agentStats[agent.id]?.incoming || 0,
        outgoing: agentStats[agent.id]?.outgoing || 0,
        isSuperhighway: agentStats[agent.id]?.isSuperhighway || false,
      } as ChamberNodeData
    }))

    return [entryNode, ...chamberNodes]
  }, [agents, highways, agentStats])

  // Build initial edges
  const initialEdges = useMemo((): FlowEdge[] => {
    const edgeMap: Record<string, { strength: number; fromTask: string; toTask: string }> = {}

    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (sourceId === targetId) continue

      const key = `${sourceId}→${targetId}`
      if (!edgeMap[key]) {
        edgeMap[key] = { strength: 0, fromTask: from.split(":")[1] || "signal", toTask: to.split(":")[1] || "receive" }
      }
      edgeMap[key].strength += strength
    }

    return Object.entries(edgeMap)
      .filter(([key]) => {
        const [src, tgt] = key.split("→")
        return (src === "entry" || agents.some(a => a.id === src)) && agents.some(a => a.id === tgt)
      })
      .map(([key, { strength, fromTask, toTask }]) => {
        const [source, target] = key.split("→")
        const isSuperhighway = strength > 50
        return {
          id: key,
          source,
          target,
          type: "trail",
          data: { strength, fromTask, toTask, isSuperhighway } as TrailEdgeData,
          markerEnd: { type: MarkerType.ArrowClosed, color: isSuperhighway ? "#3b82f6" : "#334155", width: 20, height: 20 }
        }
      })
  }, [highways, agents])

  // State hooks for interactivity
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update when highways change
  useEffect(() => {
    // Update node data
    setNodes(nds => nds.map(node => {
      if (node.id === "entry") return node
      const stats = agentStats[node.id]
      if (!stats) return node
      return {
        ...node,
        data: { ...node.data, incoming: stats.incoming, outgoing: stats.outgoing, isSuperhighway: stats.isSuperhighway }
      }
    }))

    // Update edge data
    setEdges(eds => eds.map(edge => {
      const highway = highways.find(h => {
        const [from, to] = h.edge.split(" → ")
        const sourceId = from === "entry" ? "entry" : from.split(":")[0]
        const targetId = to.split(":")[0]
        return edge.source === sourceId && edge.target === targetId
      })
      if (!highway) return edge
      const isSuperhighway = highway.strength > 50
      return {
        ...edge,
        data: { ...edge.data, strength: highway.strength, isSuperhighway },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSuperhighway ? "#3b82f6" : "#334155", width: 20, height: 20 }
      }
    }))
  }, [highways, agentStats, setNodes, setEdges])

  // Connect handler - create new edge
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return

    // Add edge to colony
    const edgeKey = `${connection.source}:signal → ${connection.target}:receive`
    colony.mark(edgeKey, 1)

    // Add to visualization
    setEdges(eds => addEdge({
      ...connection,
      type: "trail",
      data: { strength: 1, fromTask: "signal", toTask: "receive", isSuperhighway: false },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#334155", width: 20, height: 20 }
    }, eds))

    onColonyChange?.()
  }, [colony, setEdges, onColonyChange])

  // Edge click - open pheromone editor
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: FlowEdge) => {
    const data = edge.data as TrailEdgeData
    setEdgeEditor({
      id: edge.id,
      strength: data?.strength || 0,
      position: { x: event.clientX, y: event.clientY }
    })
  }, [])

  // Node click - open signal injector or select
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id === "entry") return

    // Double click to inject signal
    if (event.detail === 2) {
      const agent = agents.find(a => a.id === node.id)
      if (agent) {
        setSignalInjector({
          nodeId: node.id,
          tasks: Object.keys(agent.actions),
          position: { x: event.clientX, y: event.clientY }
        })
      }
    } else {
      onAgentSelect?.(node.id)
    }
  }, [agents, onAgentSelect])

  // Update pheromone level
  const updatePheromone = useCallback((edgeId: string, strength: number) => {
    const [source, target] = edgeId.split("→")
    const edgeKey = `${source}:signal → ${target}:receive`

    // Update colony scent
    if (strength === 0) {
      delete colony.scent[edgeKey]
    } else {
      colony.scent[edgeKey] = strength
    }

    // Update visualization
    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e
      const isSuperhighway = strength > 50
      return {
        ...e,
        data: { ...e.data, strength, isSuperhighway },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSuperhighway ? "#3b82f6" : "#334155", width: 20, height: 20 }
      }
    }))

    onColonyChange?.()
  }, [colony, setEdges, onColonyChange])

  // Delete edge
  const deleteEdge = useCallback((edgeId: string) => {
    const [source, target] = edgeId.split("→")

    // Remove from colony
    Object.keys(colony.scent).forEach(key => {
      if (key.startsWith(source) && key.includes(target)) {
        delete colony.scent[key]
      }
    })

    // Remove from visualization
    setEdges(eds => eds.filter(e => e.id !== edgeId))
    setEdgeEditor(null)
    onColonyChange?.()
  }, [colony, setEdges, onColonyChange])

  // Inject signal
  const injectSignal = useCallback(async (nodeId: string, task: string) => {
    await colony.send({
      receiver: nodeId,
      receive: task,
      payload: { source: "manual-injection" }
    })
    onColonyChange?.()
  }, [colony, onColonyChange])

  // Drop handler - spawn new node
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    const data = event.dataTransfer.getData("application/reactflow")
    if (!data) return

    const { type, name } = JSON.parse(data)
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!reactFlowBounds) return

    const position = {
      x: event.clientX - reactFlowBounds.left - 90,
      y: event.clientY - reactFlowBounds.top - 50
    }

    const newId = `${type}-${Date.now()}`

    // Add to colony (spawn takes an envelope with receiver)
    const unit = colony.spawn({ receiver: newId })
    unit.assign("process", (p: unknown) => ({ processed: true, ...(p as object) }))

    // Add to visualization
    const newNode: Node = {
      id: newId,
      type: "chamber",
      position,
      data: {
        id: newId,
        name: `${name} ${Math.floor(Math.random() * 100)}`,
        status: "ready",
        actions: ["process"],
        incoming: 0,
        outgoing: 0,
        isSuperhighway: false,
      }
    }

    setNodes(nds => [...nds, newNode])
    onColonyChange?.()
  }, [colony, setNodes, onColonyChange])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Stats
  const stats = useMemo(() => ({
    nodes: nodes.length - 1,
    edges: edges.length,
    superhighways: edges.filter(e => (e.data as TrailEdgeData)?.isSuperhighway).length,
    totalFlow: highways.reduce((s, h) => s + h.strength, 0)
  }), [nodes, edges, highways])

  return (
    <div className="h-full w-full bg-[#060608] relative" ref={reactFlowWrapper}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
            <span className="text-lg font-semibold text-white">Colony Editor</span>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Interactive</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Nodes</span>
              <span className="text-white font-mono font-bold">{stats.nodes}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Trails</span>
              <span className="text-white font-mono font-bold">{stats.edges}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Superhighways</span>
              <span className="text-blue-400 font-mono font-bold">{stats.superhighways}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Flow</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">{stats.totalFlow.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "trail" }}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.4, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        nodeOrigin={[0.5, 0.5]}
        className="colony-graph"
        connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.Bezier}
      >
        <Background color="#12121a" gap={40} size={1} />
        <Controls showZoom showFitView showInteractive className="!bg-[#0f0f14] !border-[#252538] !shadow-lg !rounded-lg" />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === "entry") return "#22c55e"
            if ((node.data as ChamberNodeData)?.isSuperhighway) return "#3b82f6"
            return "#334155"
          }}
          nodeStrokeColor="#0f0f14"
          nodeBorderRadius={8}
          maskColor="rgba(6, 6, 8, 0.85)"
          className="!bg-[#0a0a0f] !border-[#252538] !rounded-lg"
          pannable
          zoomable
        />

        {/* Node palette */}
        <Panel position="top-left" className="!mt-20 !ml-4">
          <NodePalette onDragStart={() => {}} />
        </Panel>

        {/* Instructions */}
        <Panel position="bottom-left" className="!m-4">
          <div className="bg-[#0a0a0f]/90 border border-[#252538] rounded-lg px-3 py-2 text-[10px] text-slate-500 space-y-1">
            <div><kbd className="px-1 bg-slate-800 rounded">drag handle</kbd> create trail</div>
            <div><kbd className="px-1 bg-slate-800 rounded">click edge</kbd> edit pheromone</div>
            <div><kbd className="px-1 bg-slate-800 rounded">double-click node</kbd> inject signal</div>
            <div><kbd className="px-1 bg-slate-800 rounded">drag from palette</kbd> spawn node</div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Pheromone Editor Popover */}
      {edgeEditor && (
        <PheromoneEditor
          edgeId={edgeEditor.id}
          strength={edgeEditor.strength}
          position={edgeEditor.position}
          onClose={() => setEdgeEditor(null)}
          onChange={(strength) => updatePheromone(edgeEditor.id, strength)}
          onDelete={() => deleteEdge(edgeEditor.id)}
        />
      )}

      {/* Signal Injector Popover */}
      {signalInjector && (
        <SignalInjector
          nodeId={signalInjector.nodeId}
          tasks={signalInjector.tasks}
          position={signalInjector.position}
          onClose={() => setSignalInjector(null)}
          onInject={(task) => injectSignal(signalInjector.nodeId, task)}
        />
      )}
    </div>
  )
}

export default ColonyEditor
