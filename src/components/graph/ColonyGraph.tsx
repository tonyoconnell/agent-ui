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
          "!w-2.5 !h-2.5 !border-2 !-left-1 transition-all",
          d.incoming.strength > 0 ? "!bg-blue-400 !border-[#16161f]" : "!bg-slate-600 !border-[#16161f]"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-2.5 !h-2.5 !border-2 !-right-1 transition-all",
          d.outgoing.strength > 0 ? "!bg-emerald-400 !border-[#16161f]" : "!bg-slate-600 !border-[#16161f]"
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

      {/* Actions - compact */}
      <div className="px-3 py-2 border-b border-slate-700/30">
        <div className="flex flex-wrap gap-1">
          {d.actions.map(({ name }) => (
            <span
              key={name}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-mono",
                isActive
                  ? "bg-blue-500/15 text-blue-300"
                  : "bg-slate-800/60 text-slate-400"
              )}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Traffic - compact */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-500 w-5">IN</span>
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                d.incoming.strength > 50 ? "bg-blue-500" : "bg-slate-600"
              )}
              style={{ width: `${Math.min(d.incoming.strength, 100)}%` }}
            />
          </div>
          <span className={cn(
            "text-[8px] font-mono w-5 text-right",
            d.incoming.strength > 50 ? "text-blue-400" : "text-slate-500"
          )}>
            {d.incoming.strength.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-500 w-5">OUT</span>
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                d.outgoing.strength > 50 ? "bg-emerald-500" : "bg-slate-600"
              )}
              style={{ width: `${Math.min(d.outgoing.strength, 100)}%` }}
            />
          </div>
          <span className={cn(
            "text-[8px] font-mono w-5 text-right",
            d.outgoing.strength > 50 ? "text-emerald-400" : "text-slate-500"
          )}>
            {d.outgoing.strength.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && d.actions.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-700/30 bg-slate-900/20">
          {d.actions.slice(0, 2).map(({ name, result }) => (
            <div key={name} className="text-[9px] font-mono truncate">
              <span className="text-slate-500">{name}:</span>
              <span className="text-emerald-400 ml-1">{JSON.stringify(result)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Superhighway badge */}
      {d.isSuperhighway && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
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
      "bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 rounded-xl border border-emerald-500/30",
      "px-4 py-3 shadow-lg shadow-emerald-500/10 select-none"
    )}>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-2.5 !h-2.5 !border-2 !border-emerald-900 !-right-1"
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
    // Build adjacency from highways: who sends to whom
    const outgoing: Record<string, Set<string>> = { entry: new Set() }
    agents.forEach(a => { outgoing[a.id] = new Set() })

    for (const { edge } of highways) {
      const [from, to] = edge.split(" → ")
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (outgoing[sourceId]) {
        outgoing[sourceId].add(targetId)
      }
    }

    // BFS to compute ranks (depth from entry)
    const ranks: Record<string, number> = { entry: 0 }
    const queue = ["entry"]
    const visited = new Set(["entry"])

    while (queue.length) {
      const current = queue.shift()!
      const targets = outgoing[current] || new Set()
      for (const targetId of targets) {
        if (!visited.has(targetId)) {
          ranks[targetId] = (ranks[current] || 0) + 1
          visited.add(targetId)
          queue.push(targetId)
        }
      }
    }

    // Fallback: assign sequential ranks to unvisited agents based on array order
    let nextRank = 1
    agents.forEach(a => {
      if (ranks[a.id] === undefined) {
        ranks[a.id] = nextRank++
      }
    })

    // Group by rank
    const byRank: Record<number, string[]> = {}
    Object.entries(ranks).forEach(([id, r]) => {
      if (!byRank[r]) byRank[r] = []
      byRank[r].push(id)
    })

    // Sort within ranks by total traffic
    Object.values(byRank).forEach(group => {
      group.sort((a, b) => {
        const aStrength = (agentStats[a]?.incoming.strength || 0) + (agentStats[a]?.outgoing.strength || 0)
        const bStrength = (agentStats[b]?.incoming.strength || 0) + (agentStats[b]?.outgoing.strength || 0)
        return bStrength - aStrength
      })
    })

    // Layout: horizontal flow left to right
    const colWidth = 280       // Space between columns
    const rowHeight = 200      // Space between rows in same column
    const startX = 80
    const centerY = 250
    const positions: Record<string, { x: number; y: number }> = {}

    Object.entries(byRank).forEach(([rankStr, ids]) => {
      const rank = parseInt(rankStr)
      const count = ids.length
      const totalHeight = (count - 1) * rowHeight
      const baseY = centerY - totalHeight / 2

      ids.forEach((id, i) => {
        positions[id] = {
          x: startX + rank * colWidth,
          y: baseY + i * rowHeight
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
        fitViewOptions={{ padding: 0.3, minZoom: 0.4, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        selectNodesOnDrag={false}
        snapToGrid
        snapGrid={[20, 20]}
        nodeOrigin={[0.5, 0.5]}
        className="colony-graph"
      >
        <Background color="#12121a" gap={40} size={1} />

        {/* Controls - zoom, fit, lock */}
        <Controls
          showZoom
          showFitView
          showInteractive
          className="!bg-[#0f0f14] !border-[#252538] !shadow-lg !rounded-lg"
        />

        {/* MiniMap - overview navigation */}
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

        {/* Keyboard shortcuts panel */}
        <Panel position="bottom-left" className="!m-4">
          <div className="bg-[#0a0a0f]/90 border border-[#252538] rounded-lg px-3 py-2 text-[10px] text-slate-500 space-y-1">
            <div><kbd className="px-1 bg-slate-800 rounded">scroll</kbd> zoom</div>
            <div><kbd className="px-1 bg-slate-800 rounded">drag</kbd> pan</div>
            <div><kbd className="px-1 bg-slate-800 rounded">click</kbd> select agent</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default ColonyGraph
