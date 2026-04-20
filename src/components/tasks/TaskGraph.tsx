import {
  Background,
  BaseEdge,
  Controls,
  type Edge,
  type EdgeProps,
  getBezierPath,
  type Node,
  type NodeProps,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import { useEffect, useMemo } from 'react'
import { priorityLabel } from '@/types/task'
import type { Task } from './types'

/**
 * TaskGraph — the org chart the substrate learned.
 *
 * Nodes:
 *   - Task nodes (grouped by wave, colored by status)
 *   - Agent nodes (owners/assignees) rendered once, tasks link to them
 *
 * Edges:
 *   - `blocks` edges (red dashed) — the dependency DAG
 *   - `assigned-to` edges (sky solid, thin) — task → agent
 *   - `highway` edges (purple, weighted thickness) — agent → agent from pheromone
 *
 * Layout: dagre top-down ranks waves; agents cluster on the right rail.
 * When the graph is dense (>100 nodes), auto-fit keeps the view navigable.
 */

// ─── Node renderers ─────────────────────────────────────────────────

function TaskNode({ data }: NodeProps) {
  const task = data as unknown as Task
  const status = task.task_status
  const color =
    status === 'verified' || status === 'done'
      ? '#4ade80'
      : status === 'picked'
        ? '#fbbf24'
        : status === 'blocked'
          ? '#ef4444'
          : status === 'failed'
            ? '#ef4444'
            : '#94a3b8'
  const prio = priorityLabel(task.task_priority)
  return (
    <div
      className="rounded-md border px-2 py-1.5 min-w-[140px] max-w-[220px] bg-[#0f0f1a]"
      style={{ borderColor: `${color}60` }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="w-1 h-1 rounded-full" style={{ background: color }} />
        <span className="text-[9px] font-mono text-white/40 truncate">{task.tid.split(':').slice(-2).join(':')}</span>
        <span className="ml-auto text-[8px] text-white/30">{prio}</span>
      </div>
      <p className="text-[10px] leading-tight text-white/80 line-clamp-2">{task.name}</p>
    </div>
  )
}

function AgentNode({ data }: NodeProps) {
  const info = data as { uid: string; load: number }
  return (
    <div className="rounded-full border border-sky-400/40 bg-sky-400/5 px-3 py-1.5 min-w-[80px] text-center">
      <div className="text-[11px] font-mono font-bold text-sky-200">@{info.uid}</div>
      <div className="text-[9px] text-white/40">{info.load} open</div>
    </div>
  )
}

function HighwayEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY })
  const strength = (data as { strength?: number } | undefined)?.strength ?? 0
  const thickness = Math.max(1, Math.min(5, strength / 20))
  return <BaseEdge id={id} path={path} style={{ stroke: '#c084fc', strokeWidth: thickness, opacity: 0.5 }} />
}

const NODE_TYPES = { task: TaskNode, agent: AgentNode }
const EDGE_TYPES = { highway: HighwayEdge }

// ─── Layout ─────────────────────────────────────────────────

const NODE_W = 200
const NODE_H = 48

function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 20, ranksep: 60 })
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H })
  for (const e of edges) g.setEdge(e.source, e.target)
  dagre.layout(g)
  return nodes.map((n) => {
    const l = g.node(n.id)
    return { ...n, position: { x: l.x - NODE_W / 2, y: l.y - NODE_H / 2 } }
  })
}

interface Highway {
  from: string
  to: string
  strength: number
  resistance: number
}

export function TaskGraph({ tasks, highways }: { tasks: Task[]; highways?: Highway[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const built = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Agent nodes first (deduplicated)
    const agentLoad = new Map<string, number>()
    for (const t of tasks) {
      const a = t.assignee ?? t.owner
      if (!a) continue
      agentLoad.set(a, (agentLoad.get(a) ?? 0) + 1)
    }
    for (const [uid, load] of agentLoad) {
      nodes.push({
        id: `agent:${uid}`,
        type: 'agent',
        data: { uid, load },
        position: { x: 0, y: 0 },
      })
    }

    // Task nodes + assignment edges
    for (const t of tasks) {
      nodes.push({
        id: `task:${t.tid}`,
        type: 'task',
        data: t as unknown as Record<string, unknown>,
        position: { x: 0, y: 0 },
      })
      const agent = t.assignee ?? t.owner
      if (agent) {
        edges.push({
          id: `assign:${t.tid}→${agent}`,
          source: `task:${t.tid}`,
          target: `agent:${agent}`,
          style: { stroke: '#38bdf8', strokeWidth: 0.75, opacity: 0.4 },
          type: 'default',
        })
      }
    }

    // Blocks edges (red dashed)
    for (const t of tasks) {
      for (const bid of t.blocked_by) {
        if (!tasks.find((bt) => bt.tid === bid)) continue
        edges.push({
          id: `block:${bid}→${t.tid}`,
          source: `task:${bid}`,
          target: `task:${t.tid}`,
          style: { stroke: '#ef4444', strokeDasharray: '4 3', strokeWidth: 0.75, opacity: 0.55 },
          type: 'default',
        })
      }
    }

    // Highway edges between agents
    if (highways) {
      for (const h of highways) {
        const netW = h.strength - h.resistance
        if (netW < 5) continue
        const fromAgent = h.from.split(':')[0]
        const toAgent = h.to.split(':')[0]
        if (!agentLoad.has(fromAgent) || !agentLoad.has(toAgent)) continue
        if (fromAgent === toAgent) continue
        edges.push({
          id: `hw:${h.from}→${h.to}`,
          source: `agent:${fromAgent}`,
          target: `agent:${toAgent}`,
          type: 'highway',
          data: { strength: netW },
        })
      }
    }

    return { nodes: layout(nodes, edges), edges }
  }, [tasks, highways])

  useEffect(() => {
    setNodes(built.nodes)
    setEdges(built.edges)
  }, [built, setNodes, setEdges])

  return (
    <div className="h-[700px] rounded-lg border border-white/[0.06] bg-[#060612] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#222" gap={24} size={1} />
        <Controls className="!bg-[#0a0a0f] !border-white/10" />
        <Panel
          position="top-right"
          className="rounded-md border border-white/10 bg-[#0a0a0f]/90 px-3 py-2 text-[10px] text-white/50 space-y-1"
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-red-500 opacity-55" style={{ borderTop: '1px dashed #ef4444' }} />
            <span>blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400 opacity-40" />
            <span>assigned to</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-purple-400" />
            <span>pheromone highway</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
