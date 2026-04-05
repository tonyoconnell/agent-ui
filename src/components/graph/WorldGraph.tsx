/**
 * WORLD GRAPH — The ONE ontology visualized through any metaphor
 *
 * Same data structure. Different visual language.
 *
 * Ant Colony:    Chambers with pheromone trails, foraging particles
 * Neural Network: Neurons with synaptic connections, electrical impulses
 * Organization:   Agents with workflow arrows, task delegation
 * Postal System:  Mailboxes with delivery routes, envelope particles
 * Watershed:      Pools with water channels, flowing droplets
 * Signal Network: Receivers with frequency waves, signal pulses
 *
 * The metaphor IS the understanding.
 */

import { useMemo, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
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
import type { World } from "@/engine"
import { cn } from "@/lib/utils"
import { useSkin } from "@/contexts/SkinContext"

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const splitPath = (p: string): [string, string] | null => {
  const parts = p.includes(" → ") ? p.split(" → ") : p.split("→")
  return parts[0] && parts[1] ? [parts[0], parts[1]] : null
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentData {
  id: string
  name: string
  status?: string
  actions: Record<string, unknown>
}

interface WorldGraphProps {
  world: World
  agents: AgentData[]
  highways: Edge[]
  onSelectAgent?: (id: string) => void
}

interface ActorNodeData {
  id: string
  name: string
  status: string
  actions: Array<{ name: string; result: unknown }>
  incoming: { strength: number }
  outgoing: { strength: number }
  isOpen: boolean
  [key: string]: unknown
}

interface EntryNodeData {
  signals: number
  [key: string]: unknown
}

interface FlowEdgeData {
  strength: number
  fromTask: string
  toTask: string
  isOpen: boolean
  [key: string]: unknown
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW EDGE — Connection that learns, skinned by metaphor
// ═══════════════════════════════════════════════════════════════════════════════

function FlowEdge(props: EdgeProps) {
  const { skin, t } = useSkin()
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  const edgeData = data as FlowEdgeData | undefined
  const strength = edgeData?.strength || 0
  const isOpen = edgeData?.isOpen || false
  const fromTask = edgeData?.fromTask || ""
  const toTask = edgeData?.toTask || ""

  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.25,
  })

  const strokeWidth = Math.max(1.5, Math.min(strength / 8, 10))
  const color = isOpen ? skin.colors.success : strength > 20 ? skin.colors.secondary : skin.colors.muted
  const glowOpacity = isOpen ? 0.4 : 0.15

  // Particle animation varies by metaphor
  const particleCount = isOpen ? 3 : 0
  const particleDuration = skin.id === "brain" ? "0.8s" : skin.id === "signal" ? "1.2s" : "2s"
  const particleSize = skin.id === "water" ? 4 : skin.id === "brain" ? 2 : 3

  return (
    <g className="react-flow__edge-path">
      {/* Glow layer */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 14}
        strokeOpacity={glowOpacity}
        className={isOpen ? "animate-pulse" : ""}
      />

      {/* Main flow */}
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth,
          strokeLinecap: "round",
          filter: isOpen ? `drop-shadow(0 0 8px ${color})` : undefined,
        }}
      />

      {/* Particles — metaphor-specific animation */}
      {particleCount > 0 && (
        <g className="flow-particles">
          {Array.from({ length: particleCount }).map((_, i) => (
            <circle
              key={i}
              r={particleSize - i * 0.5}
              fill={skin.colors.success}
              opacity={1 - i * 0.25}
            >
              <animateMotion
                dur={particleDuration}
                repeatCount="indefinite"
                path={path}
                begin={`${i * 0.3}s`}
              />
            </circle>
          ))}
        </g>
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute pointer-events-none px-2 py-1 rounded-lg text-[10px] font-mono",
            "transform -translate-x-1/2 -translate-y-1/2 transition-all border",
            selected && "ring-2"
          )}
          style={{
            left: labelX,
            top: labelY,
            backgroundColor: isOpen ? skin.colors.success + "25" : skin.colors.surface,
            borderColor: isOpen ? skin.colors.success + "50" : skin.colors.muted + "30",
            color: isOpen ? skin.colors.success : skin.colors.muted,
            boxShadow: isOpen ? `0 0 15px ${skin.colors.success}30` : undefined,
          }}
        >
          <span style={{ color: skin.colors.muted }}>{fromTask}</span>
          <span className="mx-1" style={{ color: skin.colors.muted + "80" }}>→</span>
          <span style={{ color: isOpen ? skin.colors.success : skin.colors.secondary }}>{toTask}</span>
          <span
            className="ml-2 px-1.5 py-0.5 rounded text-[9px]"
            style={{
              backgroundColor: isOpen ? skin.colors.success + "30" : skin.colors.muted + "20",
              color: isOpen ? skin.colors.success : skin.colors.muted,
            }}
          >
            {strength.toFixed(0)}
          </span>
        </div>
      </EdgeLabelRenderer>
    </g>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTOR NODE — The one that processes, skinned by metaphor
// ═══════════════════════════════════════════════════════════════════════════════

function ActorNode({ data, selected }: NodeProps) {
  const { skin, t } = useSkin()
  const [expanded, setExpanded] = useState(false)
  const d = data as ActorNodeData
  const isOpen = d.isOpen
  const totalStrength = d.incoming.strength + d.outgoing.strength

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "rounded-xl border transition-all duration-300 cursor-pointer select-none",
        "w-[190px]"
      )}
      style={{
        background: `linear-gradient(to bottom, ${skin.colors.surface}, ${skin.colors.background})`,
        borderColor: selected
          ? skin.colors.primary
          : isOpen
          ? skin.colors.success + "60"
          : skin.colors.muted + "40",
        boxShadow: isOpen ? `0 0 25px ${skin.colors.success}30` : undefined,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 12,
          height: 12,
          border: `2px solid ${skin.colors.surface}`,
          backgroundColor: d.incoming.strength > 0 ? skin.colors.primary : skin.colors.muted,
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 12,
          height: 12,
          border: `2px solid ${skin.colors.surface}`,
          backgroundColor: d.outgoing.strength > 0 ? skin.colors.success : skin.colors.muted,
          right: -6,
        }}
      />

      {/* Header */}
      <div
        className="px-3 py-2.5 border-b"
        style={{ borderColor: skin.colors.muted + "30" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Metaphor icon */}
            <span className="text-lg">{skin.icons.actor}</span>
            {/* Status indicator */}
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isOpen ? skin.colors.success : skin.colors.muted,
                boxShadow: isOpen ? `0 0 8px ${skin.colors.success}` : undefined,
              }}
            >
              {isOpen && (
                <div
                  className="w-full h-full rounded-full animate-ping"
                  style={{ backgroundColor: skin.colors.success }}
                />
              )}
            </div>
            <span className="text-white font-medium text-sm">{d.name}</span>
          </div>
          {totalStrength > 0 && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: isOpen ? skin.colors.success + "20" : skin.colors.muted + "20",
                color: isOpen ? skin.colors.success : skin.colors.muted,
              }}
            >
              {totalStrength.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="px-3 py-2 border-b"
        style={{ borderColor: skin.colors.muted + "20" }}
      >
        <div className="flex flex-wrap gap-1">
          {d.actions.map(({ name }) => (
            <span
              key={name}
              className="text-[9px] px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: isOpen ? skin.colors.primary + "20" : skin.colors.muted + "15",
                color: isOpen ? skin.colors.primary : skin.colors.muted,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Traffic bars with metaphor labels */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] w-6" style={{ color: skin.colors.muted }}>IN</span>
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: skin.colors.muted + "20" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(d.incoming.strength, 100)}%`,
                backgroundColor: d.incoming.strength > 50 ? skin.colors.primary : skin.colors.muted,
              }}
            />
          </div>
          <span
            className="text-[8px] font-mono w-6 text-right"
            style={{ color: d.incoming.strength > 50 ? skin.colors.primary : skin.colors.muted }}
          >
            {d.incoming.strength.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] w-6" style={{ color: skin.colors.muted }}>OUT</span>
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: skin.colors.muted + "20" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(d.outgoing.strength, 100)}%`,
                backgroundColor: d.outgoing.strength > 50 ? skin.colors.success : skin.colors.muted,
              }}
            />
          </div>
          <span
            className="text-[8px] font-mono w-6 text-right"
            style={{ color: d.outgoing.strength > 50 ? skin.colors.success : skin.colors.muted }}
          >
            {d.outgoing.strength.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Open badge */}
      {isOpen && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
          style={{
            backgroundColor: skin.colors.success,
            boxShadow: `0 0 10px ${skin.colors.success}`,
          }}
        >
          {skin.icons.open.slice(0, 2)}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY NODE — Where signals begin, skinned by metaphor
// ═══════════════════════════════════════════════════════════════════════════════

function EntryNode({ data }: NodeProps) {
  const { skin, t } = useSkin()
  const d = data as EntryNodeData

  return (
    <div
      className="rounded-xl border px-4 py-3 select-none"
      style={{
        background: `linear-gradient(135deg, ${skin.colors.success}20, ${skin.colors.success}08)`,
        borderColor: skin.colors.success + "40",
        boxShadow: `0 0 20px ${skin.colors.success}15`,
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 12,
          height: 12,
          backgroundColor: skin.colors.success,
          border: `2px solid ${skin.colors.background}`,
          right: -6,
        }}
      />

      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: skin.colors.success + "25" }}
        >
          {skin.icons.entry}
        </div>
        <div>
          <div
            className="font-semibold text-sm uppercase tracking-wide"
            style={{ color: skin.colors.success }}
          >
            {t("send")}
          </div>
          <div className="text-[10px] font-mono" style={{ color: skin.colors.success + "90" }}>
            {d.signals} {t("carrier")}s
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE & EDGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

const nodeTypes = { actor: ActorNode, entry: EntryNode }
const edgeTypes = { flow: FlowEdge }

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD GRAPH — The main component
// ═══════════════════════════════════════════════════════════════════════════════

export function WorldGraph({ world, agents, highways, onSelectAgent }: WorldGraphProps) {
  const { skin } = useSkin()

  // Calculate actor stats
  const actorStats = useMemo(() => {
    const stats: Record<string, { incoming: number; outgoing: number; isOpen: boolean }> = {}
    agents.forEach((a) => (stats[a.id] = { incoming: 0, outgoing: 0, isOpen: false }))

    for (const h of highways) {
      if (!h.path) continue
      const { path, strength } = h
      const sp = splitPath(path)
      if (!sp) continue
      const [from, to] = sp
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]

      if (stats[sourceId]) {
        stats[sourceId].outgoing += strength
        if (strength >= 50) stats[sourceId].isOpen = true
      }
      if (stats[targetId]) {
        stats[targetId].incoming += strength
        if (strength >= 50) stats[targetId].isOpen = true
      }
    }
    return stats
  }, [highways, agents])

  // Build nodes
  const initialNodes = useMemo((): Node[] => {
    const colWidth = 300
    const rowHeight = 180
    const startX = 100

    // Simple rank-based layout
    const ranks: Record<string, number> = { entry: 0 }
    const outgoing: Record<string, Set<string>> = { entry: new Set() }
    agents.forEach((a) => (outgoing[a.id] = new Set()))

    for (const h of highways) {
      if (!h.path) continue
      const sp = splitPath(h.path)
      if (!sp) continue
      const [from, to] = sp
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (outgoing[sourceId]) outgoing[sourceId].add(targetId)
    }

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
    agents.forEach((a) => {
      if (ranks[a.id] === undefined) ranks[a.id] = nextRank++
    })

    const byRank: Record<number, string[]> = {}
    Object.entries(ranks).forEach(([id, r]) => {
      if (!byRank[r]) byRank[r] = []
      byRank[r].push(id)
    })

    const positions: Record<string, { x: number; y: number }> = {}
    Object.entries(byRank).forEach(([rankStr, ids]) => {
      const rank = parseInt(rankStr)
      const totalHeight = (ids.length - 1) * rowHeight
      const baseY = 200 - totalHeight / 2
      ids.forEach((id, i) => {
        positions[id] = { x: startX + rank * colWidth, y: baseY + i * rowHeight }
      })
    })

    const entryNode: Node = {
      id: "entry",
      type: "entry",
      position: positions["entry"] || { x: 100, y: 200 },
      data: { signals: highways.filter((h) => h.path.startsWith("entry")).length },
    }

    const actorNodes: Node[] = agents.map((agent) => ({
      id: agent.id,
      type: "actor",
      position: positions[agent.id] || { x: 400, y: 200 },
      data: {
        id: agent.id,
        name: agent.name,
        status: agent.status || "active",
        actions: Object.entries(agent.actions).map(([name, result]) => ({ name, result })),
        incoming: { strength: actorStats[agent.id]?.incoming || 0 },
        outgoing: { strength: actorStats[agent.id]?.outgoing || 0 },
        isOpen: actorStats[agent.id]?.isOpen || false,
      } as ActorNodeData,
    }))

    return [entryNode, ...actorNodes]
  }, [agents, highways, actorStats])

  // Build edges
  const initialEdges = useMemo((): FlowEdge[] => {
    const edgeMap: Record<string, { strength: number; fromTask: string; toTask: string }> = {}

    for (const h of highways) {
      if (!h.path) continue
      const { path, strength } = h
      const sp = splitPath(path)
      if (!sp) continue
      const [from, to] = sp
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (sourceId === targetId) continue

      const key = `${sourceId}→${targetId}`
      if (!edgeMap[key]) {
        edgeMap[key] = {
          strength: 0,
          fromTask: from.split(":")[1] || "signal",
          toTask: to.split(":")[1] || "receive",
        }
      }
      edgeMap[key].strength += strength
    }

    return Object.entries(edgeMap)
      .filter(([key]) => {
        const [source] = key.split("→")
        return source === "entry" || agents.some((a) => a.id === source)
      })
      .map(([key, { strength, fromTask, toTask }]) => {
        const [source, target] = key.split("→")
        return {
          id: key,
          source,
          target,
          type: "flow",
          data: {
            strength,
            fromTask,
            toTask,
            isOpen: strength >= 50,
          } as FlowEdgeData,
        }
      })
  }, [highways, agents])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="h-full w-full" style={{ backgroundColor: skin.colors.background }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.3}
        maxZoom={2}
        onNodeClick={(_, node) => {
          if (node.type === "actor" && onSelectAgent) {
            onSelectAgent(node.id)
          }
        }}
      >
        <Background
          color={skin.colors.muted + "30"}
          gap={30}
          size={1}
        />
        <Controls
          style={{
            backgroundColor: skin.colors.surface,
            borderColor: skin.colors.muted + "30",
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "entry") return skin.colors.success
            const d = node.data as ActorNodeData
            return d?.isOpen ? skin.colors.success : skin.colors.primary
          }}
          maskColor={skin.colors.background + "90"}
          style={{
            backgroundColor: skin.colors.surface,
            borderColor: skin.colors.muted + "30",
          }}
        />
      </ReactFlow>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~500 lines. ONE graph. All metaphors.
// ═══════════════════════════════════════════════════════════════════════════════
