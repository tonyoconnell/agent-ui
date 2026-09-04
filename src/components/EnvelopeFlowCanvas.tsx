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
import { useCallback, useEffect, useState } from 'react'
import '@xyflow/react/dist/style.css'
import { cn } from '@/lib/utils'

// Types - index signatures required for ReactFlow compatibility
interface EnvelopeData {
  [key: string]: unknown
  direction: 'in' | 'out'
  status: string
  id?: string
  action: string
  inputs: Record<string, unknown>
  results?: Record<string, unknown>
  chainsTo?: { action: string; receiver: string }
  isActive?: boolean
  highlight?: 'inputs' | 'results' | null
}

interface LogicData {
  [key: string]: unknown
  step: number
}

interface EnvelopeInput {
  id: string
  action: string
  inputs: Record<string, unknown>
  results?: Record<string, unknown>
  status: 'pending' | 'resolved' | 'rejected'
  callback?: { id: string; action: string; inputs: Record<string, unknown>; receiver?: string } | null
}

// Status dot
const Dot = ({ status, pulse }: { status: string; pulse?: boolean }) => {
  const color =
    {
      pending: 'bg-[hsl(var(--color-gold))]',
      resolved: 'bg-[hsl(var(--color-tertiary-bright))]',
      rejected: 'bg-[hsl(var(--color-destructive))]',
    }[status] || 'bg-muted-foreground'
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className={cn('animate-ping absolute inset-0 rounded-full opacity-75', color)} />}
      <span className={cn('relative rounded-full h-2 w-2', color)} />
    </span>
  )
}

// JSON display
const Json = ({ data, variant, highlight }: { data: unknown; variant?: 'success'; highlight?: boolean }) => (
  <div
    className={cn(
      'font-mono text-[11px] p-3 rounded-xl border transition-all',
      highlight
        ? variant === 'success'
          ? 'bg-tertiary-bright/20 border-tertiary-bright/40 text-tertiary-bright'
          : 'bg-primary-bright/20 border-primary-bright/40 text-primary-bright'
        : 'bg-black/30 border-white/5 text-muted-foreground',
    )}
  >
    <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
  </div>
)

// Envelope node
const EnvelopeNode = ({ data }: NodeProps<Node<EnvelopeData>>) => {
  const isIn = data.direction === 'in'
  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-6 w-[280px] min-h-[400px] border transition-all',
        data.isActive ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border',
      )}
    >
      {!isIn && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-primary !w-3 !h-3 !border-[3px] !border-card !-left-1.5"
        />
      )}
      {isIn && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-primary !w-3 !h-3 !border-[3px] !border-card !-right-1.5"
        />
      )}

      <div className="flex justify-between mb-6">
        <span className="text-xs text-muted-foreground uppercase">{isIn ? 'Envelope' : 'Callback'}</span>
        <div className="flex items-center gap-2">
          <Dot status={data.status} pulse={data.isActive} />
          <span className="text-xs text-muted-foreground">{data.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-muted-foreground text-xs mb-1">ID</div>
          <code className="text-foreground font-mono text-sm">{data.id || '—'}</code>
        </div>
        <div>
          <div className="text-muted-foreground text-xs mb-1">Action</div>
          <div className={cn('text-xl font-semibold', data.isActive ? 'text-white' : 'text-foreground')}>
            {data.action}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs mb-1">Inputs</div>
          <Json data={data.inputs} highlight={data.highlight === 'inputs'} />
        </div>
        {data.results && (
          <div>
            <div className="text-muted-foreground text-xs mb-1">Results</div>
            <Json data={data.results} variant="success" highlight={data.highlight === 'results'} />
          </div>
        )}
        {isIn && data.chainsTo && (
          <div className="pt-4 border-t border-border">
            <div className="text-muted-foreground text-xs mb-1">Chains to</div>
            <div className="font-mono text-sm">
              <span className="text-primary-bright">{data.chainsTo.action}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="text-muted-foreground">{data.chainsTo.receiver}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Logic node
const LogicNode = ({ data }: NodeProps<Node<LogicData>>) => {
  const steps = [
    'const { action, inputs } = envelope.env',
    'let result = await actions[action](inputs)',
    'envelope.payload.results = result',
    'if (callback) {',
    '  substitute(callback, result)',
    '  route(callback)',
    '}',
  ]

  return (
    <div className="bg-card rounded-2xl p-6 w-[320px] min-h-[400px] border border-border">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !w-3 !h-3 !border-[3px] !border-card !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !w-3 !h-3 !border-[3px] !border-card !-right-1.5"
      />

      <div className="mb-6">
        <span className="text-xs text-muted-foreground uppercase">Logic</span>
      </div>

      <div className="space-y-1 font-mono text-sm">
        {steps.map((code, i) => (
          <div
            key={i}
            className={cn('py-1 px-2 rounded', data.step === i && 'bg-primary/10 border-l-2 border-primary')}
          >
            <span className={data.step === i ? 'text-white' : 'text-muted-foreground'}>{code}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = { envelope: EnvelopeNode, logic: LogicNode }

const edges: Edge[] = [
  { id: 'e1', source: 'envelope', target: 'logic', style: { stroke: 'hsl(var(--color-primary))', strokeWidth: 2 } },
  { id: 'e2', source: 'logic', target: 'callback', style: { stroke: 'hsl(var(--color-primary))', strokeWidth: 2 } },
]

function buildNodes(env: EnvelopeInput | null): Node[] {
  const empty = { id: '—', action: '—', inputs: {}, status: 'pending' as const, results: undefined }
  const e = env || empty
  return [
    {
      id: 'envelope',
      type: 'envelope',
      position: { x: 0, y: 0 },
      data: {
        direction: 'in',
        status: e.status,
        id: e.id,
        action: e.action,
        inputs: e.inputs,
        results: e.results,
        chainsTo: env?.callback
          ? { action: env.callback.action, receiver: env.callback.receiver || 'next' }
          : undefined,
      },
    },
    { id: 'logic', type: 'logic', position: { x: 330, y: 0 }, data: { step: -1 } },
    {
      id: 'callback',
      type: 'envelope',
      position: { x: 700, y: 0 },
      data: {
        direction: 'out',
        status: 'pending',
        id: env?.callback?.id || '—',
        action: env?.callback?.action || '—',
        inputs: env?.callback?.inputs || {},
      },
    },
  ]
}

export function EnvelopeFlowCanvas({ envelope = null }: { envelope?: EnvelopeInput | null }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(envelope))
  const [edgeState, setEdges, onEdgesChange] = useEdgesState(edges)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setNodes(buildNodes(envelope))
  }, [envelope, setNodes])

  const animate = useCallback(() => {
    if (animating || !envelope) return
    setAnimating(true)

    setNodes((n) =>
      n.map((x) => (x.id === 'envelope' ? { ...x, data: { ...x.data, isActive: true, highlight: 'inputs' } } : x)),
    )
    setEdges((e) => e.map((x) => (x.id === 'e1' ? { ...x, animated: true } : x)))

    let step = 0
    const iv = setInterval(() => {
      step++
      if (step <= 6) {
        setNodes((n) =>
          n.map((x) => {
            if (x.id === 'logic') return { ...x, data: { ...x.data, step: step - 1 } }
            if (x.id === 'envelope' && step === 3) return { ...x, data: { ...x.data, highlight: 'results' } }
            return x
          }),
        )
      }
      if (step === 5) setEdges((e) => e.map((x) => (x.id === 'e2' ? { ...x, animated: true } : x)))
      if (step === 6) {
        setNodes((n) =>
          n.map((x) =>
            x.id === 'callback'
              ? {
                  ...x,
                  data: {
                    ...x.data,
                    isActive: true,
                    highlight: 'inputs',
                    status: 'resolved',
                    inputs: envelope.results || {},
                  },
                }
              : x,
          ),
        )
      }
      if (step >= 9) {
        clearInterval(iv)
        setTimeout(() => {
          setNodes(buildNodes(envelope))
          setEdges((e) => e.map((x) => ({ ...x, animated: false })))
          setAnimating(false)
        }, 1000)
      }
    }, 500)
  }, [animating, envelope, setNodes, setEdges])

  useEffect(() => {
    if (envelope) {
      const t = setTimeout(animate, 600)
      return () => clearTimeout(t)
    }
  }, [envelope, animate]) // eslint-disable-line

  return (
    <div className="h-full w-full bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edgeState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
      >
        <Background color="hsl(var(--color-border))" gap={40} size={1} />
      </ReactFlow>
    </div>
  )
}

export default EnvelopeFlowCanvas
