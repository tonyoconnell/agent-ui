import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import '@xyflow/react/dist/style.css'
import { useNodeLayout } from '@/components/graph/nodes/useNodeLayout'
import { CHART_META, type ChartKey, type Role, rosterFor } from '@/lib/org-roster'
import { RoleNode } from './RoleNode'

const NODE_TYPES = { role: RoleNode }

const ACCENT_HSL: Record<NonNullable<Role['accent']>, string> = {
  gold: '45 90% 60%',
  blue: '216 60% 68%',
  rose: '340 75% 65%',
  amber: '35 90% 60%',
  teal: '170 60% 50%',
  violet: '270 60% 70%',
  slate: '219 18% 65%',
}

function edgeColor(role: Role): string {
  return `hsl(${ACCENT_HSL[role.accent ?? 'slate']})`
}

interface Props {
  chart: ChartKey
  /** Optional fixed pixel height; otherwise fills parent. */
  height?: number | string
  showMiniMap?: boolean
  showControls?: boolean
}

export function OrgChartView({ chart, height = '100%', showMiniMap = true, showControls = true }: Props) {
  const meta = CHART_META[chart]
  const roster = useMemo(() => rosterFor(chart), [chart])

  // Build raw nodes ----------------------------------------------------------
  const rawNodes = useMemo<Node[]>(() => {
    const byId = new Map(roster.map((r) => [r.id, r]))
    return roster.map((r) => ({
      id: r.id,
      type: 'role',
      position: { x: 0, y: 0 },
      data: {
        ...r,
        isRoot: r.reportsTo === null,
        isLeaf: !roster.some((other) => other.reportsTo === r.id),
        // pull parent for typing tooltips later
        _parent: r.reportsTo ? byId.get(r.reportsTo)?.title : undefined,
      },
      draggable: false,
      selectable: false,
    }))
  }, [roster])

  // Build edges --------------------------------------------------------------
  const rawEdges = useMemo<Edge[]>(() => {
    return roster
      .filter((r) => r.reportsTo)
      .map((r) => {
        const color = edgeColor(r)
        const isTopLink = r.tier === 'ceo' || r.tier === 'director'
        return {
          id: `${r.reportsTo}→${r.id}`,
          source: r.reportsTo as string,
          target: r.id,
          type: 'smoothstep',
          animated: isTopLink,
          style: {
            stroke: color,
            strokeWidth: r.tier === 'specialist' ? 1.5 : 2.2,
            strokeOpacity: r.tier === 'specialist' ? 0.55 : 0.85,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 14,
            height: 14,
          },
        }
      })
  }, [roster])

  // Layout (dagre, top-to-bottom) -------------------------------------------
  const isComplete = chart === 'complete'
  const laidOut = useNodeLayout(rawNodes, rawEdges, {
    rankdir: 'TB',
    nodesep: isComplete ? 36 : 48,
    ranksep: isComplete ? 110 : 130,
    nodeW: 200,
    nodeH: 130,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(laidOut)
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges)

  useEffect(() => setNodes(laidOut), [laidOut, setNodes])
  useEffect(() => setEdges(rawEdges), [rawEdges, setEdges])

  const headerAccent = ACCENT_HSL[meta.accent ?? 'gold']

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border"
      style={{
        height,
        minHeight: 540,
        borderColor: `hsl(${headerAccent} / 0.25)`,
        background: 'radial-gradient(ellipse at top, hsl(var(--color-card)) 0%, hsl(var(--color-background)) 70%)',
        boxShadow: `inset 0 0 80px hsl(${headerAccent} / 0.06)`,
      }}
    >
      {/* Header strip */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-baseline justify-between px-6 py-4 backdrop-blur-md"
        style={{
          background: `linear-gradient(180deg, hsl(var(--color-background) / 0.95) 0%, transparent 100%)`,
          borderBottom: `1px solid hsl(${headerAccent} / 0.18)`,
        }}
      >
        <div>
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{
              color: `hsl(${headerAccent})`,
              textShadow: `0 0 24px hsl(${headerAccent} / 0.4)`,
            }}
          >
            {meta.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
        </div>
        <div
          className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
          style={{
            color: `hsl(${headerAccent})`,
            background: `hsl(${headerAccent} / 0.10)`,
            border: `1px solid hsl(${headerAccent} / 0.25)`,
          }}
        >
          {roster.length} roles
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
        minZoom={0.25}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background variant={BackgroundVariant.Dots} color={`hsl(${headerAccent} / 0.18)`} gap={24} size={1.2} />
        {showControls && (
          <Controls showInteractive={false} className="!bg-card !border !border-border !shadow-lg !rounded-lg" />
        )}
        {showMiniMap && (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            maskColor="hsl(var(--color-background) / 0.65)"
            nodeColor={(n) => {
              const r = n.data as Role
              return `hsl(${ACCENT_HSL[r.accent ?? 'slate']})`
            }}
            nodeStrokeWidth={2}
            className="!bg-card !border !border-border !rounded-lg"
            style={{ width: 160, height: 110 }}
          />
        )}
      </ReactFlow>
    </div>
  )
}
