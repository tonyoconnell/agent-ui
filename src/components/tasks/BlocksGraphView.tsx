/**
 * BLOCKS GRAPH VIEW — dependency graph for tasks
 *
 * Shows tasks as nodes connected by `blocks` edges (blocker → blocked).
 * Node color = task_status. Edge opacity = blocker status (verified=solid, else dashed).
 * Layout: dagre LR; fallback to 4-column grid if dagre throws.
 *
 * Container must have explicit height — this component fills 100% h/w.
 *
 * Usage: <BlocksGraphView tasks={tasks} onSelect={(tid) => …} />
 */

import {
  Background,
  BaseEdge,
  Controls,
  type EdgeProps,
  type Edge as FlowEdge,
  getBezierPath,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react'
import { useMemo } from 'react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import { emitClick } from '@/lib/ui-signal'
import type { Task, TaskStatus, TaskWave } from '@/types/task'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaskNodeData {
  tid: string
  name: string
  task_status: TaskStatus
  task_wave: TaskWave | null
  strength: number
  resistance: number
  onSelect?: (tid: string) => void
  [key: string]: unknown
}

interface BlocksEdgeData {
  blockerVerified: boolean
  [key: string]: unknown
}

export interface BlocksGraphViewProps {
  tasks: Task[]
  onSelect?: (tid: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  bg: '#0a0a0f',
  surface: '#161622',
  border: '#252538',
  muted: '#6b7280',
  white: '#f1f5f9',

  // Status backgrounds (bg/border pairs)
  open: { bg: '#1e293b', border: '#334155' },
  picked: { bg: '#1e3a5f', border: '#3b82f6' },
  done: { bg: '#451a03', border: '#f59e0b' },
  verified: { bg: '#052e16', border: '#22c55e' },
  failed: { bg: '#450a0a', border: '#ef4444' },
  blocked: { bg: '#1c1c1c', border: '#4b5563' },
  dissolved: { bg: '#0f0f0f', border: '#374151' },
}

function statusStyle(s: TaskStatus) {
  switch (s) {
    case 'open':
      return C.open
    case 'picked':
      return C.picked
    case 'done':
      return C.done
    case 'verified':
      return C.verified
    case 'failed':
      return C.failed
    case 'blocked':
      return C.blocked
    case 'dissolved':
      return C.dissolved
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM EDGE — bezier with dashed style for non-verified blockers
// ═══════════════════════════════════════════════════════════════════════════════

function BlocksEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const d = data as BlocksEdgeData | undefined
  const verified = d?.blockerVerified ?? false

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  })

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: '#64748b',
        strokeWidth: 1.5,
        strokeOpacity: verified ? 0.8 : 0.4,
        strokeDasharray: verified ? undefined : '5 3',
      }}
      markerEnd="url(#arrow)"
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM NODE — 180×60 task card
// ═══════════════════════════════════════════════════════════════════════════════

function TaskNode({ data }: NodeProps) {
  const d = data as TaskNodeData
  const style = statusStyle(d.task_status)
  const shortName = d.name.length > 24 ? `${d.name.slice(0, 22)}…` : d.name

  function handleClick() {
    emitClick('ui:tasks:graph-select', { tid: d.tid })
    d.onSelect?.(d.tid)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className="rounded-md border select-none cursor-pointer hover:brightness-110 transition-all"
      style={{
        width: 180,
        height: 60,
        backgroundColor: style.bg,
        borderColor: style.border,
        padding: '4px 8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 8, height: 8, backgroundColor: style.border, border: `2px solid ${C.surface}`, left: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 8, height: 8, backgroundColor: style.border, border: `2px solid ${C.surface}`, right: -4 }}
      />

      {/* Top row: tid + wave badge */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-mono truncate" style={{ color: C.muted, maxWidth: d.task_wave ? 120 : 164 }}>
          {d.tid}
        </span>
        {d.task_wave && (
          <span
            className="text-[8px] font-mono px-1 rounded shrink-0"
            style={{ backgroundColor: `${style.border}30`, color: style.border, border: `1px solid ${style.border}50` }}
          >
            {d.task_wave}
          </span>
        )}
      </div>

      {/* Middle row: name */}
      <div className="text-[11px] font-medium leading-tight" style={{ color: C.white }}>
        {shortName}
      </div>

      {/* Bottom row: pheromone */}
      {(d.strength > 0 || d.resistance > 0) && (
        <div className="flex items-center gap-2 text-[9px] font-mono" style={{ color: C.muted }}>
          {d.strength > 0 && <span style={{ color: '#22c55e' }}>↗{d.strength.toFixed(0)}</span>}
          {d.resistance > 0 && <span style={{ color: '#ef4444' }}>↘{d.resistance.toFixed(0)}</span>}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE & EDGE TYPES (stable references — outside component)
// ═══════════════════════════════════════════════════════════════════════════════

const NODE_TYPES = { task: TaskNode }
const EDGE_TYPES = { blocks: BlocksEdge }

// ═══════════════════════════════════════════════════════════════════════════════
// DAGRE LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

function layoutWithDagre(nodes: Node[], edges: FlowEdge[]): Node[] {
  try {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 100 })

    nodes.forEach((n) => g.setNode(n.id, { width: 180, height: 60 }))
    edges.forEach((e) => g.setEdge(e.source, e.target))

    dagre.layout(g)

    return nodes.map((n) => {
      const pos = g.node(n.id)
      return { ...n, position: { x: pos.x - 90, y: pos.y - 30 } }
    })
  } catch {
    // Fallback: 4-column grid
    const COLS = 4
    return nodes.map((n, i) => ({
      ...n,
      position: {
        x: (i % COLS) * 220,
        y: Math.floor(i / COLS) * 100,
      },
    }))
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRAPH BUILD
// ═══════════════════════════════════════════════════════════════════════════════

function buildGraph(tasks: Task[], onSelect?: (tid: string) => void): { nodes: Node[]; edges: FlowEdge[] } {
  const taskMap = new Map(tasks.map((t) => [t.tid, t]))
  const edgeSet = new Set<string>()
  const edges: FlowEdge[] = []

  for (const task of tasks) {
    for (const blockedTid of task.blocks) {
      const edgeId = `${task.tid}→${blockedTid}`
      if (edgeSet.has(edgeId)) continue
      edgeSet.add(edgeId)

      // Only include edges where both ends exist in the task list
      if (!taskMap.has(blockedTid)) continue

      edges.push({
        id: edgeId,
        source: task.tid,
        target: blockedTid,
        type: 'blocks',
        data: {
          blockerVerified: task.task_status === 'verified',
        } satisfies BlocksEdgeData,
      })
    }
  }

  const rawNodes: Node[] = tasks.map((t) => ({
    id: t.tid,
    type: 'task',
    position: { x: 0, y: 0 },
    data: {
      tid: t.tid,
      name: t.name,
      task_status: t.task_status,
      task_wave: t.task_wave,
      strength: t.strength,
      resistance: t.resistance,
      onSelect,
    } satisfies TaskNodeData,
  }))

  const laid = layoutWithDagre(rawNodes, edges)
  return { nodes: laid, edges }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

function EmptyState() {
  return (
    <div
      className="h-full w-full flex items-center justify-center text-sm"
      style={{ color: C.muted, backgroundColor: C.bg }}
    >
      No dependencies yet
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function BlocksGraphView({ tasks, onSelect }: BlocksGraphViewProps) {
  const { nodes, edges } = useMemo(() => buildGraph(tasks, onSelect), [tasks, onSelect])

  const hasEdges = edges.length > 0

  if (tasks.length === 0 || !hasEdges) {
    return <EmptyState />
  }

  return (
    <div className="h-full w-full" style={{ backgroundColor: C.bg }}>
      {/* Arrow marker definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#64748b" fillOpacity={0.6} />
          </marker>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.2}
        maxZoom={4}
        style={{ backgroundColor: C.bg }}
      >
        <Background color={C.border} gap={20} size={1} />
        <Controls style={{ backgroundColor: C.surface, borderColor: C.border }} />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as TaskNodeData | undefined
            return d ? statusStyle(d.task_status).border : C.muted
          }}
          nodeStrokeWidth={2}
          zoomable
          pannable
          maskColor={`${C.bg}b0`}
          style={{ backgroundColor: C.surface, borderColor: C.border }}
        />
      </ReactFlow>
    </div>
  )
}
