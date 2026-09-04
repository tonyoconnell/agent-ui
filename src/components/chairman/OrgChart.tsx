import {
  Background,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import '@xyflow/react/dist/style.css'
import { pheromoneEdgeStyle } from '@/components/graph/nodes/PheromoneEdge'
import { useNodeLayout } from '@/components/graph/nodes/useNodeLayout'
import { useOrgPaths } from '@/lib/use-org-paths'
import { PendingNode } from './nodes/PendingNode'
import { UnitNode } from './nodes/UnitNode'

// ─── palette ────────────────────────────────────────────────────────────────

const C = {
  bg: 'hsl(var(--color-background))',
  chairman: {
    bg: 'hsl(var(--color-card))',
    border: 'hsl(var(--color-secondary-bright))',
    text: 'hsl(var(--color-secondary-bright))',
    accent: 'hsl(var(--color-secondary-bright))',
  },
  ceo: {
    bg: 'hsl(var(--color-card))',
    border: 'hsl(var(--color-primary-bright))',
    text: 'hsl(var(--color-primary-bright))',
    accent: 'hsl(var(--color-primary-bright))',
  },
  director: {
    bg: 'hsl(var(--color-card))',
    border: 'hsl(var(--color-secondary-bright))',
    text: 'hsl(var(--color-secondary-bright))',
    accent: 'hsl(var(--color-secondary-bright))',
  },
  hired: 'hsl(var(--color-tertiary-bright))',
}

// ─── node data shapes ────────────────────────────────────────────────────────

interface ChairmanData {
  label: string
  [key: string]: unknown
}

// ─── custom nodes ────────────────────────────────────────────────────────────

function ChairmanNode({ data }: NodeProps) {
  const d = data as ChairmanData
  return (
    <div
      className="rounded-xl border select-none px-5 py-3 min-w-[160px]"
      style={{
        backgroundColor: C.chairman.bg,
        borderColor: C.chairman.border,
        boxShadow: `0 0 28px ${C.chairman.accent}35`,
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 8, height: 8, backgroundColor: C.chairman.accent, border: `2px solid ${C.bg}`, bottom: -4 }}
      />
      <div className="flex items-center gap-2 mb-0.5">
        <span style={{ color: C.chairman.accent }}>♛</span>
        <span className="text-sm font-semibold text-foreground">{d.label}</span>
      </div>
      <div className="text-[10px]" style={{ color: C.chairman.text }}>
        Chairman
      </div>
    </div>
  )
}

// ─── component ───────────────────────────────────────────────────────────────

const NODE_TYPES = { chairman: ChairmanNode, actor: UnitNode, pending: PendingNode }

interface HiredUnit {
  uid: string
  wallet: string | null
  skills: string[]
}

interface OrgUnit {
  uid: string
  name: string
}

interface Props {
  actor: HiredUnit | null
  orgUnits: OrgUnit[]
  building: boolean
  pending: string[]
}

export function OrgChart({ actor, orgUnits, building, pending }: Props) {
  const paths = useOrgPaths()
  const rawNodes = useMemo<Node[]>(() => {
    const ns: Node[] = [
      {
        id: 'chairman',
        type: 'chairman',
        position: { x: 0, y: 0 },
        data: { label: 'You' },
      },
    ]
    if (actor) {
      ns.push({
        id: 'ceo',
        type: 'actor',
        position: { x: 0, y: 0 },
        data: {
          uid: actor.uid,
          role: 'ceo',
          wallet: actor.wallet,
          skills: actor.skills,
          status: building ? 'hiring' : 'hired',
        },
      })
    }
    for (const u of orgUnits) {
      ns.push({
        id: u.uid,
        type: 'actor',
        position: { x: 0, y: 0 },
        data: { uid: u.uid, role: u.uid.replace('roles:', ''), wallet: null, skills: [], status: 'hired' },
      })
    }
    for (const role of pending) {
      ns.push({
        id: `pending:${role}`,
        type: 'pending',
        position: { x: 0, y: 0 },
        data: { role },
      })
    }
    return ns
  }, [actor, orgUnits, building, pending])

  const rawEdges = useMemo<Edge[]>(() => {
    const es: Edge[] = []
    if (actor) {
      const p = paths.get('chairman→ceo')
      es.push({
        id: 'chairman→ceo',
        source: 'chairman',
        target: 'ceo',
        type: 'smoothstep',
        animated: building,
        style: p
          ? pheromoneEdgeStyle(p.strength, p.resistance, { stroke: C.ceo.border })
          : { stroke: C.ceo.border, strokeWidth: 2, strokeOpacity: 0.8 },
      })
    }
    for (const u of orgUnits) {
      const p = paths.get(`ceo→${u.uid}`)
      es.push({
        id: `ceo→${u.uid}`,
        source: 'ceo',
        target: u.uid,
        type: 'smoothstep',
        animated: false,
        style: p
          ? pheromoneEdgeStyle(p.strength, p.resistance, { stroke: C.director.border })
          : { stroke: C.director.border, strokeWidth: 1.5, strokeOpacity: 0.7 },
      })
    }
    for (const role of pending) {
      es.push({
        id: `ceo→pending:${role}`,
        source: 'ceo',
        target: `pending:${role}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: C.director.border, strokeWidth: 1, strokeOpacity: 0.4, strokeDasharray: '4 4' },
      })
    }
    return es
  }, [actor, orgUnits, building, pending, paths])

  const laidOut = useNodeLayout(rawNodes, rawEdges, { rankdir: 'TB', nodesep: 52, ranksep: 80, nodeW: 184, nodeH: 80 })

  const [nodes, setNodes, onNodesChange] = useNodesState(laidOut)
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges)

  useEffect(() => {
    setNodes(laidOut)
  }, [laidOut, setNodes])

  useEffect(() => {
    setEdges(rawEdges)
  }, [rawEdges, setEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.35, maxZoom: 1.2 }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
    >
      <Background color="hsl(var(--color-card))" gap={28} size={1} />
    </ReactFlow>
  )
}
