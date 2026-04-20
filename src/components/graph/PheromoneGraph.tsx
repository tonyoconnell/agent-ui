/**
 * PHEROMONE GRAPH — Task and edge visualization for the dashboard
 *
 * Shows:
 * - Agent nodes (dark blue) with name + success rate
 * - Task nodes (dark purple) with name + priority
 * - Edges weighted by pheromone strength
 * - Toxic edges in red (resistance > 2×strength)
 * - Highway edges in gold (strength >= 50)
 * - Auto-refreshes every 30s
 *
 * Usage: <PheromoneGraph client:load />
 */

import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge as FlowEdge,
  getBezierPath,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface StateEdge {
  from: string
  to: string
  strength: number
  resistance: number
  revenue: number
  toxic: boolean
}

interface StateUnit {
  id: string
  name: string
  kind?: string
  status?: string
  sr?: number
  g?: number
}

interface StateData {
  units: StateUnit[]
  edges: StateEdge[]
  highways: StateEdge[]
  stats: {
    units: number
    proven: number
    highways: number
    edges: number
    tags: number
    revenue: number
  }
  loading?: boolean
}

interface TaskData {
  tid: string
  name: string
  status: string
  priority: number
  tags: string[]
  blockers: string[]
  blocks: string[]
  strength: number
  resistance: number
  category: 'attractive' | 'ready' | 'exploratory' | 'repelled'
}

// Node data shapes (must be indexable per ReactFlow requirements)
interface AgentNodeData {
  label: string
  successRate: number
  kind: string
  status: string
  [key: string]: unknown
}

interface TaskNodeData {
  label: string
  priority: number
  category: string
  blockers: string[]
  blocks: string[]
  [key: string]: unknown
}

interface PheromoneEdgeData {
  strength: number
  resistance: number
  toxic: boolean
  highway: boolean
  [key: string]: unknown
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  bg: '#0a0a0f',
  surface: '#161622',
  border: '#252538',
  muted: '#6b7280',
  agentBg: '#0f1729',
  agentBorder: '#1e3a6b',
  agentText: '#60a5fa',
  agentAccent: '#3b82f6',
  taskBg: '#140f1e',
  taskBorder: '#3b1f6b',
  taskText: '#c084fc',
  taskAccent: '#a855f7',
  highway: '#f59e0b',
  toxic: '#ef4444',
  normal: '#334155',
  success: '#22c55e',
  white: '#f1f5f9',
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE — Pheromone-weighted connection
// ═══════════════════════════════════════════════════════════════════════════════

function PheromoneEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const d = data as PheromoneEdgeData | undefined
  const strength = d?.strength ?? 0
  const toxic = d?.toxic ?? false
  const highway = d?.highway ?? false

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.2,
  })

  // Stroke width: log scale 1–10px
  const strokeWidth = strength > 0 ? Math.max(1, Math.min(10, Math.log(strength + 1) * 2)) : 1

  const color = toxic ? C.toxic : highway ? C.highway : C.normal
  const opacity = toxic ? 0.9 : highway ? 0.95 : 0.6

  return (
    <g>
      {/* Glow for highways */}
      {highway && <path d={path} fill="none" stroke={C.highway} strokeWidth={strokeWidth + 8} strokeOpacity={0.15} />}
      {/* Glow for toxic */}
      {toxic && <path d={path} fill="none" stroke={C.toxic} strokeWidth={strokeWidth + 6} strokeOpacity={0.2} />}

      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth,
          strokeOpacity: opacity,
          strokeDasharray: toxic ? '6 3' : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-none text-[9px] font-mono px-1 py-0.5 rounded"
          style={{
            left: labelX,
            top: labelY,
            transform: 'translate(-50%, -50%)',
            backgroundColor: toxic ? '#ef444420' : highway ? '#f59e0b20' : '#ffffff10',
            color: toxic ? C.toxic : highway ? C.highway : C.muted,
            border: `1px solid ${toxic ? '#ef444440' : highway ? '#f59e0b40' : '#ffffff15'}`,
          }}
        >
          {strength.toFixed(0)}
        </div>
      </EdgeLabelRenderer>
    </g>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT NODE
// ═══════════════════════════════════════════════════════════════════════════════

function AgentNode({ data, selected }: NodeProps) {
  const d = data as AgentNodeData
  const srPct = ((d.successRate ?? 0) * 100).toFixed(0)
  const isProven = d.status === 'proven'

  return (
    <div
      className="rounded-xl border select-none min-w-[150px]"
      style={{
        backgroundColor: C.agentBg,
        borderColor: selected ? C.agentAccent : isProven ? `${C.agentBorder}cc` : C.agentBorder,
        boxShadow: selected ? `0 0 20px ${C.agentAccent}40` : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 10, height: 10, backgroundColor: C.agentBorder, border: `2px solid ${C.surface}`, left: -5 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 10, height: 10, backgroundColor: C.agentAccent, border: `2px solid ${C.surface}`, right: -5 }}
      />

      {/* Header */}
      <div className="px-3 py-2 border-b" style={{ borderColor: `${C.agentBorder}60` }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: C.agentText }}>
            ◈
          </span>
          <span className="text-sm font-medium" style={{ color: C.white }}>
            {d.label}
          </span>
        </div>
        <div className="text-[9px] mt-0.5" style={{ color: C.muted }}>
          {d.kind || 'unit'}
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px]" style={{ color: C.muted }}>
            success
          </span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: isProven ? `${C.success}20` : `${C.agentAccent}20`,
              color: isProven ? C.success : C.agentText,
            }}
          >
            {srPct}%
          </span>
        </div>

        {/* Success rate bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(parseFloat(srPct), 100)}%`,
              backgroundColor: isProven ? C.success : C.agentAccent,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK NODE
// ═══════════════════════════════════════════════════════════════════════════════

function TaskNode({ data, selected }: NodeProps) {
  const d = data as TaskNodeData
  const isBlocked = d.blockers.length > 0
  const isRepelled = d.category === 'repelled'
  const isAttractive = d.category === 'attractive'

  const accentColor = isBlocked ? C.muted : isRepelled ? C.toxic : isAttractive ? C.highway : C.taskAccent

  return (
    <div
      className="rounded-xl border select-none min-w-[150px]"
      style={{
        backgroundColor: C.taskBg,
        borderColor: selected ? C.taskAccent : `${accentColor}60`,
        boxShadow: isAttractive ? `0 0 16px ${C.highway}20` : undefined,
        opacity: isBlocked ? 0.55 : 1,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 10, height: 10, backgroundColor: C.taskBorder, border: `2px solid ${C.surface}`, left: -5 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 10, height: 10, backgroundColor: accentColor, border: `2px solid ${C.surface}`, right: -5 }}
      />

      {/* Header */}
      <div className="px-3 py-2 border-b" style={{ borderColor: `${C.taskBorder}60` }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: accentColor }}>
            ▣
          </span>
          <span className="text-sm font-medium leading-tight" style={{ color: C.white }}>
            {d.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px]" style={{ color: C.muted }}>
            p:{d.priority.toFixed(1)}
          </span>
          {isBlocked && (
            <span
              className="text-[9px] px-1 py-0.5 rounded"
              style={{ backgroundColor: `${C.muted}20`, color: C.muted }}
            >
              blocked
            </span>
          )}
          {isAttractive && (
            <span
              className="text-[9px] px-1 py-0.5 rounded"
              style={{ backgroundColor: `${C.highway}20`, color: C.highway }}
            >
              ★
            </span>
          )}
        </div>
      </div>

      {/* Category + blockers */}
      <div className="px-3 py-1.5">
        <div
          className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-block"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {d.category}
        </div>
        {d.blocks.length > 0 && (
          <span className="ml-1 text-[9px]" style={{ color: C.muted }}>
            blocks {d.blocks.length}
          </span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE & EDGE TYPES (stable references — defined outside component)
// ═══════════════════════════════════════════════════════════════════════════════

const nodeTypes = { agent: AgentNode, task: TaskNode }
const edgeTypes = { pheromone: PheromoneEdge }

// ═══════════════════════════════════════════════════════════════════════════════
// DAGRE LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

function layoutWithDagre(nodes: Node[], edges: FlowEdge[]): Node[] {
  try {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 })

    nodes.forEach((n) => {
      g.setNode(n.id, { width: 170, height: 80 })
    })
    edges.forEach((e) => {
      g.setEdge(e.source, e.target)
    })

    dagre.layout(g)

    return nodes.map((n) => {
      const pos = g.node(n.id)
      return { ...n, position: { x: pos.x - 85, y: pos.y - 40 } }
    })
  } catch {
    // Fallback: simple grid layout
    return nodes.map((n, i) => {
      const cols = Math.ceil(Math.sqrt(nodes.length))
      const col = i % cols
      const row = Math.floor(i / cols)
      return { ...n, position: { x: col * 220, y: row * 140 } }
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface PheromoneGraphProps {
  refreshInterval?: number // ms, default 30000
}

export function PheromoneGraph({ refreshInterval = 30_000 }: PheromoneGraphProps) {
  const [state, setState] = useState<StateData | null>(null)
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [stateRes, tasksRes] = await Promise.all([fetch('/api/state'), fetch('/api/tasks')])

      if (!stateRes.ok || !tasksRes.ok) throw new Error('Fetch failed')

      const stateJson = (await stateRes.json()) as StateData
      const tasksJson = (await tasksRes.json()) as { tasks: TaskData[] }

      setState(stateJson)
      setTasks(tasksJson.tasks || [])
      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, refreshInterval)
    return () => clearInterval(id)
  }, [fetchData, refreshInterval])

  // ── Build ReactFlow nodes + edges ─────────────────────────────────────────

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!state) return { initialNodes: [], initialEdges: [] }

    // Agent nodes
    const agentNodes: Node[] = (state.units || []).map((u) => ({
      id: `agent:${u.id}`,
      type: 'agent',
      position: { x: 0, y: 0 }, // placed by dagre
      data: {
        label: u.name || u.id,
        successRate: u.sr ?? 0,
        kind: u.kind || 'unit',
        status: u.status || 'active',
      } satisfies AgentNodeData,
    }))

    // Task nodes
    const taskNodes: Node[] = tasks.map((t) => ({
      id: `task:${t.tid}`,
      type: 'task',
      position: { x: 0, y: 0 }, // placed by dagre
      data: {
        label: t.name,
        priority: t.priority,
        category: t.category,
        blockers: t.blockers,
        blocks: t.blocks,
      } satisfies TaskNodeData,
    }))

    // Pheromone edges (between agents)
    const agentIds = new Set(state.units.map((u) => `agent:${u.id}`))
    const pheromoneEdges: FlowEdge[] = (state.edges || [])
      .filter((e) => {
        const src = `agent:${e.from}`
        const tgt = `agent:${e.to}`
        return agentIds.has(src) && agentIds.has(tgt) && src !== tgt
      })
      .map((e) => {
        const isHighway = !e.toxic && e.strength >= 50
        return {
          id: `edge:${e.from}→${e.to}`,
          source: `agent:${e.from}`,
          target: `agent:${e.to}`,
          type: 'pheromone',
          data: {
            strength: e.strength,
            resistance: e.resistance,
            toxic: e.toxic,
            highway: isHighway,
          } satisfies PheromoneEdgeData,
        }
      })

    // Task → agent edges (tasks route to agents that handle them — infer from name overlap)
    // For now: connect task to agent if task.tid starts with agent.id or shares prefix
    const taskAgentEdges: FlowEdge[] = []
    for (const t of tasks) {
      const parts = t.tid.split(':')
      const agentId = parts.length > 1 ? parts[0] : null
      if (agentId && agentIds.has(`agent:${agentId}`)) {
        taskAgentEdges.push({
          id: `ta:${t.tid}`,
          source: `agent:${agentId}`,
          target: `task:${t.tid}`,
          type: 'pheromone',
          data: {
            strength: t.strength,
            resistance: t.resistance,
            toxic: t.category === 'repelled',
            highway: t.category === 'attractive',
          } satisfies PheromoneEdgeData,
        })
      }
    }

    const allNodes = [...agentNodes, ...taskNodes]
    const allEdges = [...pheromoneEdges, ...taskAgentEdges]

    const laid = layoutWithDagre(allNodes, allEdges)

    return { initialNodes: laid, initialEdges: allEdges }
  }, [state, tasks])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // ── Legend ────────────────────────────────────────────────────────────────

  const stats = state?.stats

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: C.border, backgroundColor: C.surface }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: C.white }}>
            Pheromone Graph
          </span>
          {stats && (
            <div className="flex items-center gap-3 text-[10px]" style={{ color: C.muted }}>
              <span>{stats.units} agents</span>
              <span>{stats.edges} paths</span>
              <span style={{ color: C.highway }}>{stats.highways} highways</span>
              <span>{tasks.length} tasks</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-2 text-[9px]">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 rounded inline-block" style={{ backgroundColor: C.highway }} />
              <span style={{ color: C.muted }}>highway</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 rounded inline-block" style={{ backgroundColor: C.toxic }} />
              <span style={{ color: C.muted }}>toxic</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 rounded inline-block" style={{ backgroundColor: C.normal }} />
              <span style={{ color: C.muted }}>normal</span>
            </span>
          </div>

          {/* Last refresh */}
          {lastRefresh && (
            <span className="text-[9px]" style={{ color: C.muted }}>
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}

          {/* Manual refresh */}
          <button
            onClick={fetchData}
            className="text-[10px] px-2 py-1 rounded border transition-opacity hover:opacity-80"
            style={{
              backgroundColor: C.border,
              borderColor: C.border,
              color: C.muted,
            }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10 text-sm"
            style={{ color: C.muted, backgroundColor: `${C.bg}cc` }}
          >
            Loading pheromone data...
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-sm" style={{ color: C.toxic }}>
            {error}
          </div>
        )}

        {!loading && !error && initialNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-sm" style={{ color: C.muted }}>
            No agents or tasks found. Run a tick to populate.
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
          panOnDrag
          zoomOnScroll
          minZoom={0.2}
          maxZoom={3}
          style={{ backgroundColor: C.bg }}
        >
          <Background color={C.border} gap={24} size={1} />
          <Controls
            style={{
              backgroundColor: C.surface,
              borderColor: C.border,
            }}
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'agent') return C.agentAccent
              if (n.type === 'task') {
                const d = n.data as TaskNodeData
                return d.category === 'attractive' ? C.highway : d.category === 'repelled' ? C.toxic : C.taskAccent
              }
              return C.muted
            }}
            maskColor={`${C.bg}b0`}
            style={{ backgroundColor: C.surface, borderColor: C.border }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
