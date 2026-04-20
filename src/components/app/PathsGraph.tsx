import {
  Background,
  Controls,
  type Edge as FlowEdge,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useEffect, useState } from 'react'
import { sdk } from '@/lib/sdk'
import '@xyflow/react/dist/style.css'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Highway {
  from: string
  to: string
  strength: number
}

interface Props {
  groupId: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildGraph(highways: Highway[]): { nodes: Node[]; edges: FlowEdge[] } {
  const nodeIds = new Set<string>()
  for (const h of highways) {
    nodeIds.add(h.from)
    nodeIds.add(h.to)
  }

  const ids = Array.from(nodeIds)
  const cols = Math.ceil(Math.sqrt(ids.length)) || 1
  const nodes: Node[] = ids.map((id, i) => ({
    id,
    position: { x: (i % cols) * 200, y: Math.floor(i / cols) * 120 },
    data: { label: id },
    style: {
      background: '#161622',
      border: '1px solid #252538',
      color: '#94a3b8',
      borderRadius: 8,
      padding: '6px 12px',
      fontSize: 12,
    },
  }))

  const maxStrength = Math.max(...highways.map((h) => h.strength), 1)
  const edges: FlowEdge[] = highways.map((h, i) => {
    const norm = h.strength / maxStrength
    const isHighway = h.strength >= 50
    return {
      id: `e-${i}`,
      source: h.from,
      target: h.to,
      label: h.strength.toFixed(1),
      animated: isHighway,
      style: {
        stroke: isHighway ? '#eab308' : `rgba(99,102,241,${0.3 + norm * 0.7})`,
        strokeWidth: 1 + norm * 3,
      },
      labelStyle: { fill: '#64748b', fontSize: 10 },
      labelBgStyle: { fill: '#0a0a0f', fillOpacity: 0.7 },
    }
  })

  return { nodes, edges }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function PathsGraph({ groupId: _groupId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([])
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = (await sdk.exportData('highways')) as Highway[]
        if (cancelled) return
        if (!data.length) {
          setEmpty(true)
          return
        }
        setEmpty(false)
        const { nodes: n, edges: e } = buildGraph(data)
        setNodes(n)
        setEdges(e)
      } catch {
        // dissolve silently — no data yet
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [setNodes, setEdges])

  if (empty) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">No paths yet</div>
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
      >
        <Background color="#252538" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
