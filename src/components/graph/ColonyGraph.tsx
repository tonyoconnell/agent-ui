/**
 * COLONY GRAPH - Visual Manifestation of Emergent Intelligence
 *
 * This is the 85 lines made visible:
 * - Nodes that compute (chambers)
 * - Edges that connect (trails)
 * - Weights that learn (scent)
 * - Signals that flow (envelopes)
 *
 * Watch intelligence emerge.
 */

import { useMemo, useCallback, useState } from "react"
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type Node,
  type Edge as FlowEdge,
  type EdgeProps,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { Edge } from "@/engine"
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

interface ColonyGraphProps {
  agents: AgentData[]
  highways: Edge[]
  onSelectAgent?: (id: string) => void
}

interface ChamberNodeData {
  id: string
  name: string
  status: string
  actions: Array<{ name: string; result: unknown }>
  incoming: { strength: number; edges: string[] }
  outgoing: { strength: number; edges: string[] }
  isSuperhighway: boolean
  rank: number
  [key: string]: unknown
}

interface EntryNodeData {
  signals: number
  strength: number
  targets: string[]
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
// TRAIL EDGE - The connection that learns
// ============================================================================

function TrailEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  const edgeData = data as TrailEdgeData | undefined
  const strength = edgeData?.strength || 0
  const isSuperhighway = edgeData?.isSuperhighway || false
  const fromTask = edgeData?.fromTask || ""
  const toTask = edgeData?.toTask || ""

  // Bezier path for smooth curves
  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.3,
  })

  // Visual properties based on strength (the learning)
  const strokeWidth = Math.max(1, Math.min(strength / 10, 8))
  const color = isSuperhighway ? "#3b82f6" : strength > 20 ? "#6366f1" : "#334155"
  const glowOpacity = isSuperhighway ? 0.3 : 0.1

  return (
    <g className="react-flow__edge-path">
      {/* Glow layer - the pheromone trail */}
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
          filter: isSuperhighway ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))" : undefined
        }}
      />

      {/* Signal particles - ants walking the trail */}
      {isSuperhighway && (
        <g className="signal-particles">
          {[0, 0.33, 0.66].map((delay, i) => (
            <circle key={i} r={3 - i * 0.5} fill={`rgba(147, 197, 253, ${1 - i * 0.2})`}>
              <animateMotion dur="2s" repeatCount="indefinite" path={path} begin={`${delay}s`} />
            </circle>
          ))}
        </g>
      )}

      {/* Edge label - the task flow */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute pointer-events-none px-2 py-1 rounded-md text-[10px] font-mono",
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
// CHAMBER NODE - The unit that computes
// ============================================================================

function ChamberNode({ data, selected }: NodeProps) {
  const [expanded, setExpanded] = useState(false)
  const d = data as ChamberNodeData
  const isActive = d.isSuperhighway
  const totalStrength = d.incoming.strength + d.outgoing.strength

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "bg-gradient-to-b from-[#14141c] to-[#0c0c12] rounded-xl border-2 transition-all duration-300",
        "w-[200px] cursor-pointer",
        isActive && "shadow-xl shadow-blue-500/20",
        selected ? "border-blue-500 ring-2 ring-blue-500/30" :
        isActive ? "border-blue-500/50" : "border-slate-700/50 hover:border-slate-600"
      )}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-3 !h-3 !border-2 !-left-1.5 transition-all",
          d.incoming.strength > 0 ? "!bg-blue-400 !border-blue-900" : "!bg-slate-600 !border-slate-800"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-3 !h-3 !border-2 !-right-1.5 transition-all",
          d.outgoing.strength > 0 ? "!bg-emerald-400 !border-emerald-900" : "!bg-slate-600 !border-slate-800"
        )}
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              isActive ? "bg-blue-500 shadow-lg shadow-blue-500/50" : "bg-slate-600"
            )}>
              {isActive && <div className="w-full h-full rounded-full bg-blue-400 animate-ping" />}
            </div>
            <span className="text-white font-semibold">{d.name}</span>
          </div>
          {totalStrength > 0 && (
            <span className={cn(
              "text-xs font-mono px-2 py-0.5 rounded-full",
              isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400"
            )}>
              {totalStrength.toFixed(0)}
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-1">{d.id}</div>
      </div>

      {/* Actions - what this unit can compute */}
      <div className="px-4 py-2 border-b border-slate-700/50">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Actions</div>
        <div className="flex flex-wrap gap-1">
          {d.actions.map(({ name }) => (
            <span
              key={name}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-md font-mono transition-all",
                isActive
                  ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
              )}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Traffic visualization */}
      <div className="px-4 py-2 space-y-1.5">
        {/* Incoming */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 w-6">IN</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                d.incoming.strength > 50
                  ? "bg-gradient-to-r from-blue-600 to-blue-400"
                  : "bg-slate-600"
              )}
              style={{ width: `${Math.min(d.incoming.strength, 100)}%` }}
            />
          </div>
          <span className={cn(
            "text-[9px] font-mono w-6 text-right",
            d.incoming.strength > 50 ? "text-blue-400" : "text-slate-500"
          )}>
            {d.incoming.strength.toFixed(0)}
          </span>
        </div>

        {/* Outgoing */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 w-6">OUT</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                d.outgoing.strength > 50
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                  : "bg-slate-600"
              )}
              style={{ width: `${Math.min(d.outgoing.strength, 100)}%` }}
            />
          </div>
          <span className={cn(
            "text-[9px] font-mono w-6 text-right",
            d.outgoing.strength > 50 ? "text-emerald-400" : "text-slate-500"
          )}>
            {d.outgoing.strength.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && d.actions.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/30">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Results</div>
          {d.actions.slice(0, 2).map(({ name, result }) => (
            <div key={name} className="text-[10px] font-mono">
              <span className="text-slate-500">{name}: </span>
              <span className="text-emerald-400">{JSON.stringify(result)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Superhighway indicator */}
      {d.isSuperhighway && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-full uppercase tracking-wider">
          Superhighway
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ENTRY NODE - Where signals begin
// ============================================================================

function EntryNode({ data }: NodeProps) {
  const d = data as EntryNodeData
  return (
    <div className={cn(
      "bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 rounded-2xl border-2 border-emerald-500/30",
      "px-5 py-4 shadow-xl shadow-emerald-500/10"
    )}>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-emerald-900 !-right-1.5"
      />

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div>
          <div className="text-emerald-300 font-bold uppercase tracking-wide">Entry</div>
          <div className="text-emerald-500/80 text-xs font-mono">{d.signals} signals</div>
          {d.strength > 0 && (
            <div className="text-emerald-600 text-[10px]">→ {d.targets.join(", ")}</div>
          )}
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
// COLONY GRAPH - The visualization
// ============================================================================

export function ColonyGraph({ agents, highways, onSelectAgent }: ColonyGraphProps) {

  // Calculate comprehensive stats for each agent
  const agentStats = useMemo(() => {
    const stats: Record<string, {
      incoming: { strength: number; edges: string[] }
      outgoing: { strength: number; edges: string[] }
      isSuperhighway: boolean
    }> = {}

    // Initialize
    agents.forEach(a => {
      stats[a.id] = {
        incoming: { strength: 0, edges: [] },
        outgoing: { strength: 0, edges: [] },
        isSuperhighway: false
      }
    })

    // Compute from highways
    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue

      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      const fromTask = from.split(":")[1] || "signal"
      const toTask = to.split(":")[1] || "receive"

      if (stats[sourceId]) {
        stats[sourceId].outgoing.strength += strength
        stats[sourceId].outgoing.edges.push(`${toTask}@${targetId}`)
        if (strength > 50) stats[sourceId].isSuperhighway = true
      }
      if (stats[targetId]) {
        stats[targetId].incoming.strength += strength
        stats[targetId].incoming.edges.push(`${fromTask}@${sourceId}`)
        if (strength > 50) stats[targetId].isSuperhighway = true
      }
    }

    return stats
  }, [highways, agents])

  // Smart layout based on signal flow topology
  const nodes = useMemo((): Node[] => {
    // Compute ranks (depth from entry)
    const ranks: Record<string, number> = { entry: 0 }
    const queue = ["entry"]
    const visited = new Set(["entry"])

    while (queue.length) {
      const current = queue.shift()!
      for (const { edge } of highways) {
        const [from, to] = edge.split(" → ")
        const sourceId = from === "entry" ? "entry" : from.split(":")[0]
        const targetId = to.split(":")[0]

        if (sourceId === current && !visited.has(targetId)) {
          ranks[targetId] = (ranks[current] || 0) + 1
          visited.add(targetId)
          queue.push(targetId)
        }
      }
    }

    // Assign unvisited agents
    agents.forEach(a => { if (ranks[a.id] === undefined) ranks[a.id] = 1 })

    // Group by rank
    const byRank: Record<number, string[]> = {}
    Object.entries(ranks).forEach(([id, r]) => {
      if (!byRank[r]) byRank[r] = []
      byRank[r].push(id)
    })

    // Sort within ranks by total traffic (most active at top)
    Object.values(byRank).forEach(group => {
      group.sort((a, b) => {
        const aStrength = (agentStats[a]?.incoming.strength || 0) + (agentStats[a]?.outgoing.strength || 0)
        const bStrength = (agentStats[b]?.incoming.strength || 0) + (agentStats[b]?.outgoing.strength || 0)
        return bStrength - aStrength
      })
    })

    // Layout configuration - generous spacing
    const startX = 100
    const startY = 250
    const colWidth = 350  // Horizontal spacing between ranks
    const rowHeight = 280 // Vertical spacing between nodes in same rank
    const positions: Record<string, { x: number; y: number }> = {}

    // Find max rank for centering
    const maxRank = Math.max(...Object.keys(byRank).map(Number))

    Object.entries(byRank).forEach(([rankStr, ids]) => {
      const rank = parseInt(rankStr)
      const count = ids.length

      // Center nodes vertically within their column
      const totalHeight = (count - 1) * rowHeight
      const offsetY = -totalHeight / 2

      ids.forEach((id, i) => {
        positions[id] = {
          x: startX + rank * colWidth,
          y: startY + offsetY + i * rowHeight
        }
      })
    })

    // Build entry node
    const entryTargets = highways
      .filter(h => h.edge.startsWith("entry"))
      .map(h => h.edge.split(" → ")[1]?.split(":")[0])
      .filter(Boolean)

    const entryStrength = highways
      .filter(h => h.edge.startsWith("entry"))
      .reduce((s, h) => s + h.strength, 0)

    const entryNode: Node<EntryNodeData> = {
      id: "entry",
      type: "entry",
      position: positions["entry"] || { x: 80, y: 200 },
      data: {
        signals: entryTargets.length,
        strength: entryStrength,
        targets: [...new Set(entryTargets)]
      }
    }

    // Build chamber nodes
    const chamberNodes: Node<ChamberNodeData>[] = agents.map(agent => ({
      id: agent.id,
      type: "chamber",
      position: positions[agent.id] || { x: 300, y: 200 },
      data: {
        id: agent.id,
        name: agent.name,
        status: agent.status || "ready",
        actions: Object.entries(agent.actions).map(([name, result]) => ({ name, result })),
        incoming: agentStats[agent.id]?.incoming || { strength: 0, edges: [] },
        outgoing: agentStats[agent.id]?.outgoing || { strength: 0, edges: [] },
        isSuperhighway: agentStats[agent.id]?.isSuperhighway || false,
        rank: ranks[agent.id] || 1
      }
    }))

    return [entryNode, ...chamberNodes]
  }, [agents, highways, agentStats])

  // Build edges from highways
  const edges = useMemo((): FlowEdge<TrailEdgeData>[] => {
    // Group by source-target pair, aggregate strength
    const edgeMap: Record<string, { strength: number; fromTask: string; toTask: string }> = {}

    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue

      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (sourceId === targetId) continue

      const key = `${sourceId}→${targetId}`
      if (!edgeMap[key]) {
        edgeMap[key] = {
          strength: 0,
          fromTask: from.split(":")[1] || "signal",
          toTask: to.split(":")[1] || "receive"
        }
      }
      edgeMap[key].strength += strength
    }

    return Object.entries(edgeMap)
      .filter(([key]) => {
        const [src, tgt] = key.split("→")
        return (src === "entry" || agents.some(a => a.id === src)) &&
               agents.some(a => a.id === tgt)
      })
      .map(([key, { strength, fromTask, toTask }]) => {
        const [source, target] = key.split("→")
        const isSuperhighway = strength > 50

        return {
          id: key,
          source,
          target,
          type: "trail",
          data: { strength, fromTask, toTask, isSuperhighway },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isSuperhighway ? "#3b82f6" : strength > 20 ? "#6366f1" : "#334155",
            width: 20,
            height: 20,
          }
        }
      })
  }, [highways, agents])

  // Click handler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id !== "entry" && onSelectAgent) {
      onSelectAgent(node.id)
    }
  }, [onSelectAgent])

  // Stats for header
  const stats = useMemo(() => ({
    agents: agents.length,
    edges: Object.keys(edges).length,
    superhighways: highways.filter(h => h.strength > 50).length,
    totalFlow: highways.reduce((s, h) => s + h.strength, 0)
  }), [agents, edges, highways])

  return (
    <div className="h-full w-full bg-[#060608] relative">
      {/* Header stats */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            <span className="text-lg font-semibold text-white">Colony Network</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Agents</span>
              <span className="text-white font-mono font-bold">{stats.agents}</span>
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

      {/* Legend - compact, top right under header */}
      <div className="absolute top-16 right-4 z-10 flex items-center gap-3 text-[10px] text-slate-500 bg-[#0a0a0f]/80 px-2 py-1 rounded-md">
        <div className="flex items-center gap-1">
          <div className="w-4 h-1 bg-blue-500 rounded-full" />
          <span>Highway</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-indigo-500 rounded-full" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-slate-600 rounded-full" />
          <span>Weak</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        defaultEdgeOptions={{ type: "trail" }}
        fitView
        fitViewOptions={{ padding: 0.4, minZoom: 0.5, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        className="colony-graph"
      >
        <Background color="#161625" gap={50} size={1.5} />
      </ReactFlow>
    </div>
  )
}

export default ColonyGraph
