import { useMemo, useCallback, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type Node,
  type Edge as FlowEdge,
  type EdgeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { Edge } from "@/engine"
import { cn } from "@/lib/utils"

// Types
interface AgentData {
  id: string
  name: string
  status?: string
  actions: Record<string, unknown>
}

interface ColonyGraphProps {
  agents: AgentData[]
  highways: Edge[]
  onSelectAgent?: (id: string) => void
}

interface ChamberData {
  id: string
  label: string
  status: string
  actions: string[]
  incomingStrength: number
  outgoingStrength: number
  isHighway: boolean
  [key: string]: unknown
}

interface EntryData {
  totalSignals: number
  [key: string]: unknown
}

// Custom flow edge with particles
function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data }: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.2,
  })

  const strength = (data?.strength as number) || 0
  const isHighway = strength > 50
  const isMedium = strength > 20
  const label = data?.label as string

  return (
    <>
      {isHighway && (
        <path d={edgePath} fill="none" stroke="#3b82f6" strokeWidth={12} strokeOpacity={0.1} />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: Math.max(1.5, Math.min(strength / 12, 6)),
          stroke: isHighway ? "#3b82f6" : isMedium ? "#6366f1" : "#374151",
        }}
        markerEnd={markerEnd}
      />
      {isHighway && (
        <>
          <circle r="3" fill="#60a5fa">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="2" fill="#93c5fd">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="0.5s" />
          </circle>
        </>
      )}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute px-1.5 py-0.5 rounded text-[9px] font-mono pointer-events-none",
            isHighway ? "bg-blue-500/20 text-blue-300" : "bg-[#0a0a0f]/90 text-slate-500"
          )}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

// Compact strength bar
function StrengthBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const isHigh = value > 50

  return (
    <div className="h-1 bg-[#1a1a2e] rounded-full overflow-hidden flex-1">
      <div
        className={cn("h-full rounded-full", isHigh ? "bg-blue-500" : "bg-slate-600")}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// Compact chamber node
function ChamberNode({ data }: { data: ChamberData }) {
  const [hovered, setHovered] = useState(false)
  const isActive = data.incomingStrength > 50 || data.outgoingStrength > 50
  const total = data.incomingStrength + data.outgoingStrength

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "bg-[#12121a] rounded-xl p-3 w-[160px] border transition-all cursor-pointer",
        isActive ? "border-blue-500/50 shadow-lg shadow-blue-500/20" :
        hovered ? "border-slate-600" : "border-[#252538]"
      )}
    >
      <Handle type="target" position={Position.Left}
        className={cn("!w-2.5 !h-2.5 !border-2 !-left-1", isActive ? "!bg-blue-400 !border-blue-900" : "!bg-slate-500 !border-[#12121a]")} />
      <Handle type="source" position={Position.Right}
        className={cn("!w-2.5 !h-2.5 !border-2 !-right-1", isActive ? "!bg-emerald-400 !border-emerald-900" : "!bg-slate-500 !border-[#12121a]")} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", isActive ? "bg-blue-500 animate-pulse" : "bg-slate-600")} />
          <span className="text-white font-semibold text-sm truncate">{data.label}</span>
        </div>
        {total > 0 && (
          <span className={cn("text-[10px] font-mono", isActive ? "text-blue-400" : "text-slate-500")}>
            {total.toFixed(0)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1 mb-2">
        {data.actions.slice(0, 2).map((a) => (
          <span key={a} className="text-[9px] px-1.5 py-0.5 bg-[#252538] text-slate-400 rounded font-mono">{a}</span>
        ))}
        {data.actions.length > 2 && (
          <span className="text-[9px] text-slate-600">+{data.actions.length - 2}</span>
        )}
      </div>

      {/* Traffic bars */}
      <div className="flex items-center gap-2 text-[8px] text-slate-500">
        <span>IN</span>
        <StrengthBar value={data.incomingStrength} />
        <span className="text-slate-600">{data.incomingStrength.toFixed(0)}</span>
      </div>
      <div className="flex items-center gap-2 text-[8px] text-slate-500 mt-1">
        <span>OUT</span>
        <StrengthBar value={data.outgoingStrength} />
        <span className="text-slate-600">{data.outgoingStrength.toFixed(0)}</span>
      </div>

      {data.isHighway && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#12121a]" />
      )}
    </div>
  )
}

// Compact entry node
function EntryNode({ data }: { data: EntryData }) {
  return (
    <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 rounded-xl px-4 py-2.5 border border-emerald-500/30">
      <Handle type="source" position={Position.Right}
        className="!bg-emerald-400 !w-2.5 !h-2.5 !border-2 !border-emerald-900 !-right-1" />
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 text-lg">→</span>
        <div>
          <div className="text-emerald-300 text-xs font-bold uppercase">Entry</div>
          <div className="text-emerald-600 text-[10px]">{data.totalSignals} signals</div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = { chamber: ChamberNode, entry: EntryNode }
const edgeTypes = { flow: FlowEdge }

export function ColonyGraph({ agents, highways, onSelectAgent }: ColonyGraphProps) {
  // Calculate traffic stats
  const trafficStats = useMemo(() => {
    const stats: Record<string, { incoming: number; outgoing: number; isHighway: boolean }> = {}
    agents.forEach((a) => { stats[a.id] = { incoming: 0, outgoing: 0, isHighway: false } })
    stats["entry"] = { incoming: 0, outgoing: 0, isHighway: false }

    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]

      if (stats[sourceId]) {
        stats[sourceId].outgoing += strength
        if (strength > 50) stats[sourceId].isHighway = true
      }
      if (stats[targetId]) {
        stats[targetId].incoming += strength
        if (strength > 50) stats[targetId].isHighway = true
      }
    }
    return stats
  }, [highways, agents])

  // Smart layout - entry left, then flow left-to-right based on connections
  const nodes = useMemo((): Node[] => {
    // Calculate node depths based on connections
    const depths: Record<string, number> = { entry: 0 }
    const processed = new Set<string>(["entry"])

    // BFS to assign depths
    let queue = ["entry"]
    while (queue.length > 0) {
      const nextQueue: string[] = []
      for (const nodeId of queue) {
        for (const { edge } of highways) {
          const [from, to] = edge.split(" → ")
          const sourceId = from === "entry" ? "entry" : from.split(":")[0]
          const targetId = to.split(":")[0]

          if (sourceId === nodeId && !processed.has(targetId)) {
            depths[targetId] = (depths[nodeId] || 0) + 1
            processed.add(targetId)
            nextQueue.push(targetId)
          }
        }
      }
      queue = nextQueue
    }

    // Assign default depth to unconnected nodes
    agents.forEach((a) => {
      if (depths[a.id] === undefined) depths[a.id] = 1
    })

    // Group by depth
    const byDepth: Record<number, string[]> = {}
    Object.entries(depths).forEach(([id, d]) => {
      if (!byDepth[d]) byDepth[d] = []
      byDepth[d].push(id)
    })

    // Position nodes
    const positions: Record<string, { x: number; y: number }> = {}
    const colWidth = 220
    const rowHeight = 140
    const startX = 50
    const startY = 80

    Object.entries(byDepth).forEach(([depthStr, nodeIds]) => {
      const depth = parseInt(depthStr)
      const x = startX + depth * colWidth
      const totalHeight = (nodeIds.length - 1) * rowHeight
      const offsetY = -totalHeight / 2

      nodeIds.forEach((id, i) => {
        positions[id] = { x, y: startY + offsetY + i * rowHeight + 150 }
      })
    })

    // Build nodes
    const chamberNodes: Node<ChamberData>[] = agents.map((agent) => ({
      id: agent.id,
      type: "chamber",
      position: positions[agent.id] || { x: startX + colWidth, y: startY },
      data: {
        id: agent.id,
        label: agent.name,
        status: agent.status || "ready",
        actions: Object.keys(agent.actions),
        incomingStrength: trafficStats[agent.id]?.incoming || 0,
        outgoingStrength: trafficStats[agent.id]?.outgoing || 0,
        isHighway: trafficStats[agent.id]?.isHighway || false,
      },
    }))

    const entryNode: Node<EntryData> = {
      id: "entry",
      type: "entry",
      position: positions["entry"],
      data: { totalSignals: trafficStats["entry"]?.outgoing > 0 ? highways.filter(h => h.edge.startsWith("entry")).length : 0 },
    }

    return [entryNode, ...chamberNodes]
  }, [agents, trafficStats, highways])

  // Create edges
  const edges = useMemo((): FlowEdge[] => {
    const groups: Record<string, { strength: number; task: string }> = {}

    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (sourceId === targetId) continue

      const key = `${sourceId}->${targetId}`
      if (!groups[key]) {
        const task = from.includes(":") && to.includes(":")
          ? `${from.split(":")[1]}→${to.split(":")[1]}`
          : ""
        groups[key] = { strength: 0, task }
      }
      groups[key].strength += strength
    }

    return Object.entries(groups)
      .filter(([key]) => {
        const [src, tgt] = key.split("->")
        return (src === "entry" || agents.some(a => a.id === src)) && agents.some(a => a.id === tgt)
      })
      .map(([key, { strength, task }]) => {
        const [source, target] = key.split("->")
        return {
          id: key,
          source,
          target,
          type: "flow",
          data: { strength, label: task ? `${task} (${strength.toFixed(0)})` : strength.toFixed(0) },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strength > 50 ? "#3b82f6" : strength > 20 ? "#6366f1" : "#374151",
            width: 16,
            height: 16,
          },
        }
      })
  }, [highways, agents])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id !== "entry" && onSelectAgent) onSelectAgent(node.id)
  }, [onSelectAgent])

  const stats = useMemo(() => ({
    total: highways.reduce((s, h) => s + h.strength, 0),
    highways: highways.filter(h => h.strength > 50).length,
    edges: highways.length,
  }), [highways])

  return (
    <div className="h-full w-full relative">
      {/* Compact stats */}
      <div className="absolute top-3 left-3 z-10 flex gap-3 text-[10px]">
        <div className="bg-[#12121a]/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[#252538] flex items-center gap-2">
          <span className="text-slate-500">Agents</span>
          <span className="text-white font-mono font-bold">{agents.length}</span>
        </div>
        <div className="bg-[#12121a]/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[#252538] flex items-center gap-2">
          <span className="text-slate-500">Flow</span>
          <span className="text-emerald-400 font-mono font-bold">{stats.total.toFixed(0)}</span>
        </div>
        <div className="bg-[#12121a]/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[#252538] flex items-center gap-2">
          <span className="text-slate-500">Highways</span>
          <span className="text-blue-400 font-mono font-bold">{stats.highways}</span>
        </div>
      </div>

      {/* Compact legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#12121a]/90 backdrop-blur px-3 py-2 rounded-lg border border-[#252538] flex items-center gap-4 text-[9px]">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 rounded-full" />
          <span className="text-slate-400">Highway</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-indigo-500 rounded-full" />
          <span className="text-slate-400">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-slate-600 rounded-full" />
          <span className="text-slate-400">Weak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Entry</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.5, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.3}
        maxZoom={1.5}
        style={{ background: "#08080c" }}
        defaultEdgeOptions={{ type: "flow" }}
      >
        <Background color="#1a1a2e" gap={30} size={1} />
        <Controls
          position="bottom-right"
          className="[&>button]:!bg-[#12121a] [&>button]:!border-[#252538] [&>button]:!text-slate-400 [&>button]:!w-7 [&>button]:!h-7"
        />
        <MiniMap
          position="top-right"
          nodeColor={(n) => n.id === "entry" ? "#10b981" : (n.data as ChamberData)?.isHighway ? "#3b82f6" : "#374151"}
          maskColor="rgba(0,0,0,0.85)"
          style={{ background: "#0a0a0f", border: "1px solid #252538", width: 120, height: 80 }}
          className="!rounded-lg"
        />
      </ReactFlow>
    </div>
  )
}

export default ColonyGraph
