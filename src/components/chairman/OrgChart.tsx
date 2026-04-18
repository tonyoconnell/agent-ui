import dagre from '@dagrejs/dagre'
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

// ─── palette ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0a0a0f',
  chairman: { bg: '#1a0533', border: '#7c3aed', text: '#c4b5fd', accent: '#8b5cf6' },
  ceo: { bg: '#0f1140', border: '#4f46e5', text: '#a5b4fc', accent: '#6366f1' },
  director: { bg: '#150d2e', border: '#6d28d9', text: '#c084fc', accent: '#7c3aed' },
  hired: '#10b981',
}

// ─── node data shapes ────────────────────────────────────────────────────────

interface ChairmanData {
  label: string
  [key: string]: unknown
}

interface UnitData {
  uid: string
  role: string
  wallet: string | null
  skills: string[]
  status: 'hired' | 'hiring'
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
        <span className="text-sm font-semibold text-slate-100">{d.label}</span>
      </div>
      <div className="text-[10px]" style={{ color: C.chairman.text }}>
        Chairman
      </div>
    </div>
  )
}

function UnitNode({ data }: NodeProps) {
  const d = data as UnitData
  const isCeo = d.role === 'ceo'
  const isHiring = d.status === 'hiring'
  const colors = isCeo ? C.ceo : C.director

  return (
    <div
      className={`rounded-xl border select-none px-4 py-3 min-w-[168px] transition-all duration-300 ${isHiring ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: isHiring ? `${colors.border}60` : colors.border,
        boxShadow: isHiring ? 'none' : `0 0 20px ${colors.accent}25`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 8, height: 8, backgroundColor: colors.border, border: `2px solid ${C.bg}`, top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 8, height: 8, backgroundColor: colors.accent, border: `2px solid ${C.bg}`, bottom: -4 }}
      />

      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-slate-100">{d.role.toUpperCase()}</span>
        {!isHiring && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${C.hired}18`, color: C.hired }}
          >
            hired
          </span>
        )}
      </div>

      <div className="text-[10px] font-mono truncate max-w-[148px]" style={{ color: colors.text }}>
        {d.uid}
      </div>

      {d.wallet && (
        <div className="text-[9px] font-mono truncate max-w-[148px] mt-0.5 text-slate-600">
          {d.wallet.slice(0, 18)}…
        </div>
      )}

      {!isHiring && d.skills.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {d.skills.slice(0, 3).map((s) => (
            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a2e] text-slate-500">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── layout ──────────────────────────────────────────────────────────────────

const NODE_W = 184
const NODE_H = 80

function applyLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 52 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H })
  for (const e of edges) g.setEdge(e.source, e.target)
  dagre.layout(g)
  return nodes.map((n) => {
    const { x, y } = g.node(n.id)
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } }
  })
}

// ─── component ───────────────────────────────────────────────────────────────

const NODE_TYPES = { chairman: ChairmanNode, unit: UnitNode }

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
  unit: HiredUnit | null
  orgUnits: OrgUnit[]
  building: boolean
}

export function OrgChart({ unit, orgUnits, building }: Props) {
  const rawNodes = useMemo<Node[]>(() => {
    const ns: Node[] = [
      {
        id: 'chairman',
        type: 'chairman',
        position: { x: 0, y: 0 },
        data: { label: 'You' },
      },
    ]
    if (unit) {
      ns.push({
        id: 'ceo',
        type: 'unit',
        position: { x: 0, y: 0 },
        data: {
          uid: unit.uid,
          role: 'ceo',
          wallet: unit.wallet,
          skills: unit.skills,
          status: building ? 'hiring' : 'hired',
        },
      })
    }
    for (const u of orgUnits) {
      ns.push({
        id: u.uid,
        type: 'unit',
        position: { x: 0, y: 0 },
        data: { uid: u.uid, role: u.uid.replace('roles:', ''), wallet: null, skills: [], status: 'hired' },
      })
    }
    return ns
  }, [unit, orgUnits, building])

  const rawEdges = useMemo<Edge[]>(() => {
    const es: Edge[] = []
    if (unit) {
      es.push({
        id: 'chairman→ceo',
        source: 'chairman',
        target: 'ceo',
        type: 'smoothstep',
        animated: building,
        style: { stroke: C.ceo.border, strokeWidth: 2, strokeOpacity: 0.8 },
      })
    }
    for (const u of orgUnits) {
      es.push({
        id: `ceo→${u.uid}`,
        source: 'ceo',
        target: u.uid,
        type: 'smoothstep',
        animated: false,
        style: { stroke: C.director.border, strokeWidth: 1.5, strokeOpacity: 0.7 },
      })
    }
    return es
  }, [unit, orgUnits, building])

  const laidOut = useMemo(() => applyLayout(rawNodes, rawEdges), [rawNodes, rawEdges])

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
      <Background color="#1c1c2e" gap={28} size={1} />
    </ReactFlow>
  )
}
