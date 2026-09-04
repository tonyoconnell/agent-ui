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
      ? 'hsl(var(--color-tertiary-bright))'
      : status === 'picked'
        ? 'hsl(var(--color-gold))'
        : status === 'blocked'
          ? 'hsl(var(--color-destructive))'
          : status === 'failed'
            ? 'hsl(var(--color-destructive))'
            : 'hsl(var(--color-muted-foreground))'
  const prio = priorityLabel(task.task_priority)
  return (
    <div
      className="rounded-md border px-2 py-1.5 min-w-[140px] max-w-[220px] bg-card"
      style={{ borderColor: `${color}60` }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="w-1 h-1 rounded-full" style={{ background: color }} />
        <span className="text-[9px] font-mono text-font/40 truncate">{task.tid.split(':').slice(-2).join(':')}</span>
        <span className="ml-auto text-[8px] text-font/30">{prio}</span>
      </div>
      <p className="text-[10px] leading-tight text-font/80 line-clamp-2">{task.name}</p>
    </div>
  )
}

function AgentNode({ data }: NodeProps) {
  const info = data as { uid: string; load: number }
  return (
    <div className="rounded-full border border-primary-bright/40 bg-primary-bright/5 px-3 py-1.5 min-w-[80px] text-center">
      <div className="text-[11px] font-mono font-bold text-primary-bright">@{info.uid}</div>
      <div className="text-[9px] text-font/40">{info.load} open</div>
    </div>
  )
}

function HighwayEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY })
  const strength = (data as { strength?: number } | undefined)?.strength ?? 0
  const thickness = Math.max(1, Math.min(5, strength / 20))
  return (
    <BaseEdge
      id={id}
      path={path}
      style={{ stroke: 'hsl(var(--color-secondary-bright))', strokeWidth: thickness, opacity: 0.5 }}
    />
  )
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
          style: { stroke: 'hsl(var(--color-primary-bright))', strokeWidth: 0.75, opacity: 0.4 },
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
          style: { stroke: 'hsl(var(--color-destructive))', strokeDasharray: '4 3', strokeWidth: 0.75, opacity: 0.55 },
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
    <div className="h-[700px] rounded-lg border border-border bg-background overflow-hidden">
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
        <Background color="hsl(var(--color-border))" gap={24} size={1} />
        <Controls className="!bg-card !border-border" />
        <Panel
          position="top-right"
          className="rounded-md border border-border bg-card/90 px-3 py-2 text-[10px] text-muted-foreground space-y-1"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-0.5 bg-destructive opacity-55"
              style={{ borderTop: '1px dashed hsl(var(--color-destructive))' }}
            />
            <span>blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-primary-bright opacity-40" />
            <span>assigned to</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-secondary-bright" />
            <span>pheromone highway</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
