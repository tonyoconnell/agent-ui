import { useMemo, useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge as FlowEdge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { Edge } from "@/engine"
import { cn } from "@/lib/utils"

// Agent data structure
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

// Node data types
interface ChamberData {
  id: string
  label: string
  status: string
  actions: string[]
  incomingStrength: number
  outgoingStrength: number
  incomingEdges: number
  outgoingEdges: number
  [key: string]: unknown
}

interface EntryData {
  totalSignals: number
  [key: string]: unknown
}

// Status dot component
function Dot({ status, pulse, size = "sm" }: { status: string; pulse?: boolean; size?: "sm" | "md" }) {
  const colors: Record<string, string> = {
    ready: "bg-emerald-500",
    active: "bg-blue-500",
    idle: "bg-slate-500",
    error: "bg-red-500",
  }
  const color = colors[status] || colors.idle
  const sizeClass = size === "md" ? "h-3 w-3" : "h-2 w-2"

  return (
    <span className={cn("relative flex", sizeClass)}>
      {pulse && <span className={cn("animate-ping absolute inset-0 rounded-full opacity-75", color)} />}
      <span className={cn("relative rounded-full", sizeClass, color)} />
    </span>
  )
}

// Strength bar component
function StrengthBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.min((value / max) * 100, 100)
  const isHigh = value > 50

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] text-slate-500 w-8">{label}</span>}
      <div className="flex-1 h-1.5 bg-[#252538] rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isHigh ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-slate-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-[10px] w-6 text-right", isHigh ? "text-blue-400" : "text-slate-500")}>
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// Rich chamber node - represents an agent
function ChamberNode({ data }: { data: ChamberData }) {
  const isActive = data.incomingStrength > 50 || data.outgoingStrength > 50
  const totalTraffic = data.incomingStrength + data.outgoingStrength

  return (
    <div
      className={cn(
        "bg-[#161622] rounded-2xl p-4 min-w-[180px] border transition-all duration-300",
        isActive
          ? "border-blue-500/50 shadow-xl shadow-blue-500/20"
          : "border-[#252538] hover:border-[#3b3b5c]"
      )}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-right-1.5"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dot status={data.status} pulse={isActive} size="md" />
          <span className="text-white font-semibold">{data.label}</span>
        </div>
        {totalTraffic > 0 && (
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
          )}>
            {totalTraffic.toFixed(0)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mb-3">
        <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Actions</div>
        <div className="flex flex-wrap gap-1">
          {data.actions.map((action) => (
            <span
              key={action}
              className="text-[10px] px-2 py-0.5 bg-[#252538] text-slate-400 rounded font-mono"
            >
              {action}
            </span>
          ))}
        </div>
      </div>

      {/* Traffic stats */}
      {(data.incomingStrength > 0 || data.outgoingStrength > 0) && (
        <div className="pt-3 border-t border-[#252538] space-y-1.5">
          <StrengthBar value={data.incomingStrength} label="IN" />
          <StrengthBar value={data.outgoingStrength} label="OUT" />
        </div>
      )}

      {/* Edge counts */}
      <div className="mt-2 flex justify-between text-[10px] text-slate-600">
        <span>{data.incomingEdges} incoming</span>
        <span>{data.outgoingEdges} outgoing</span>
      </div>
    </div>
  )
}

// Entry point node - where signals originate
function EntryNode({ data }: { data: EntryData }) {
  return (
    <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 rounded-xl px-5 py-3 border border-emerald-500/30">
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-3 !h-3 !border-[3px] !border-emerald-900 !-right-1.5"
      />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="text-emerald-400 text-lg">→</span>
        </div>
        <div>
          <div className="text-emerald-400 text-sm font-medium uppercase tracking-wide">Entry</div>
          <div className="text-emerald-600 text-[10px]">{data.totalSignals} signals</div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = {
  chamber: ChamberNode,
  entry: EntryNode,
}

/**
 * ColonyGraph - Rich network visualization of the colony
 *
 * Features:
 * - Agents displayed as rich nodes with traffic stats
 * - Edge thickness indicates signal strength (learning)
 * - Animated edges for "superhighways" (strength > 50)
 * - Entry node shows signal origin
 * - Real-time strength bars
 */
export function ColonyGraph({ agents, highways, onSelectAgent }: ColonyGraphProps) {
  // Calculate traffic stats per agent
  const trafficStats = useMemo(() => {
    const stats: Record<string, {
      incoming: number
      outgoing: number
      inEdges: number
      outEdges: number
    }> = {}

    // Initialize all agents
    agents.forEach((a) => {
      stats[a.id] = { incoming: 0, outgoing: 0, inEdges: 0, outEdges: 0 }
    })
    stats["entry"] = { incoming: 0, outgoing: 0, inEdges: 0, outEdges: 0 }

    // Calculate from highways
    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue

      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]

      if (stats[sourceId]) {
        stats[sourceId].outgoing += strength
        stats[sourceId].outEdges++
      }
      if (stats[targetId]) {
        stats[targetId].incoming += strength
        stats[targetId].inEdges++
      }
    }

    return stats
  }, [highways, agents])

  // Create nodes with smart layout
  const nodes = useMemo((): Node[] => {
    // Calculate positions based on signal flow (left to right)
    const positions: Record<string, { x: number; y: number }> = {}

    // Entry on the left
    positions["entry"] = { x: 0, y: 150 }

    // Position agents based on their traffic patterns
    const agentsByTraffic = [...agents].sort((a, b) => {
      const aTotal = (trafficStats[a.id]?.incoming || 0) + (trafficStats[a.id]?.outgoing || 0)
      const bTotal = (trafficStats[b.id]?.incoming || 0) + (trafficStats[b.id]?.outgoing || 0)
      return bTotal - aTotal
    })

    // Create a flow-based layout
    const cols = Math.ceil(Math.sqrt(agents.length))
    const spacingX = 280
    const spacingY = 200

    agentsByTraffic.forEach((agent, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      positions[agent.id] = {
        x: 200 + col * spacingX,
        y: 50 + row * spacingY,
      }
    })

    // Build nodes
    const chamberNodes: Node<ChamberData>[] = agents.map((agent) => ({
      id: agent.id,
      type: "chamber",
      position: positions[agent.id],
      data: {
        id: agent.id,
        label: agent.name,
        status: agent.status || "ready",
        actions: Object.keys(agent.actions),
        incomingStrength: trafficStats[agent.id]?.incoming || 0,
        outgoingStrength: trafficStats[agent.id]?.outgoing || 0,
        incomingEdges: trafficStats[agent.id]?.inEdges || 0,
        outgoingEdges: trafficStats[agent.id]?.outEdges || 0,
      },
    }))

    const entryNode: Node<EntryData> = {
      id: "entry",
      type: "entry",
      position: positions["entry"],
      data: {
        totalSignals: trafficStats["entry"]?.outEdges || 0,
      },
    }

    return [entryNode, ...chamberNodes]
  }, [agents, trafficStats])

  // Create rich edges
  const edges = useMemo((): FlowEdge[] => {
    const result: FlowEdge[] = []
    const edgeGroups: Record<string, { strength: number; tasks: string[] }> = {}

    // Group edges by source-target pair
    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue

      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      const sourceTask = from.split(":")[1] || ""
      const targetTask = to.split(":")[1] || ""

      if (sourceId === targetId) continue

      const key = `${sourceId}->${targetId}`
      if (!edgeGroups[key]) {
        edgeGroups[key] = { strength: 0, tasks: [] }
      }
      edgeGroups[key].strength += strength
      if (sourceTask && targetTask) {
        edgeGroups[key].tasks.push(`${sourceTask}→${targetTask}`)
      }
    }

    // Create edges from groups
    for (const [key, { strength, tasks }] of Object.entries(edgeGroups)) {
      const [sourceId, targetId] = key.split("->")

      // Verify nodes exist
      const sourceExists = sourceId === "entry" || agents.some((a) => a.id === sourceId)
      const targetExists = agents.some((a) => a.id === targetId)
      if (!sourceExists || !targetExists) continue

      const isHighway = strength > 50
      const isMedium = strength > 20

      result.push({
        id: key,
        source: sourceId,
        target: targetId,
        label: tasks.length > 0 ? `${tasks[0]} (${strength.toFixed(0)})` : strength.toFixed(0),
        type: "default",
        style: {
          strokeWidth: Math.max(2, Math.min(strength / 8, 10)),
          stroke: isHighway ? "#3b82f6" : isMedium ? "#6366f1" : "#475569",
        },
        animated: isHighway,
        labelStyle: {
          fill: isHighway ? "#60a5fa" : "#94a3b8",
          fontSize: 11,
          fontWeight: isHighway ? 600 : 400,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#0f0f17",
          fillOpacity: 0.9,
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighway ? "#3b82f6" : isMedium ? "#6366f1" : "#475569",
          width: 20,
          height: 20,
        },
      })
    }

    return result
  }, [highways, agents])

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id !== "entry" && onSelectAgent) {
      onSelectAgent(node.id)
    }
  }, [onSelectAgent])

  // Network stats
  const stats = useMemo(() => {
    const totalStrength = highways.reduce((sum, h) => sum + h.strength, 0)
    const highwayCount = highways.filter((h) => h.strength > 50).length
    return { totalStrength, highwayCount, edgeCount: highways.length }
  }, [highways])

  return (
    <div className="h-full w-full relative">
      {/* Stats overlay */}
      <div className="absolute top-4 left-4 z-10 bg-[#161622]/90 backdrop-blur rounded-xl p-4 border border-[#252538]">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Network Stats</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Agents</span>
            <span className="text-white font-mono">{agents.length}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Edges</span>
            <span className="text-white font-mono">{stats.edgeCount}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Highways</span>
            <span className="text-blue-400 font-mono">{stats.highwayCount}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Total Flow</span>
            <span className="text-emerald-400 font-mono">{stats.totalStrength.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.3}
        maxZoom={1.5}
        style={{ background: "#0a0a0f" }}
      >
        <Background color="#1e293b" gap={30} size={1} />
        <Controls className="[&>button]:!bg-[#161622] [&>button]:!border-[#252538] [&>button]:!text-slate-400" />
      </ReactFlow>
    </div>
  )
}

export default ColonyGraph
