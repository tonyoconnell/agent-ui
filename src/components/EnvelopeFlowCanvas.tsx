import { useState, useCallback, useEffect } from "react"
import { ReactFlow, Background, useNodesState, useEdgesState, Handle, Position, type Node, type Edge, type NodeProps } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { cn } from "@/lib/utils"

// Types
interface EnvelopeData {
  direction: "in" | "out"
  status: string
  id?: string
  action: string
  inputs: Record<string, unknown>
  results?: Record<string, unknown>
  chainsTo?: { action: string; receiver: string }
  isActive?: boolean
  highlight?: "inputs" | "results" | null
}

interface LogicData {
  step: number
}

interface EnvelopeInput {
  id: string
  action: string
  inputs: Record<string, unknown>
  results?: Record<string, unknown>
  status: "pending" | "resolved" | "rejected"
  callback?: { id: string; action: string; inputs: Record<string, unknown>; receiver?: string } | null
}

// Status dot
const Dot = ({ status, pulse }: { status: string; pulse?: boolean }) => {
  const color = { pending: "bg-amber-400", resolved: "bg-emerald-400", rejected: "bg-red-400" }[status] || "bg-slate-400"
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className={cn("animate-ping absolute inset-0 rounded-full opacity-75", color)} />}
      <span className={cn("relative rounded-full h-2 w-2", color)} />
    </span>
  )
}

// JSON display
const Json = ({ data, variant, highlight }: { data: unknown; variant?: "success"; highlight?: boolean }) => (
  <div className={cn(
    "font-mono text-[11px] p-3 rounded-xl border transition-all",
    highlight
      ? variant === "success"
        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
        : "bg-blue-500/20 border-blue-500/40 text-blue-300"
      : "bg-black/30 border-white/5 text-slate-400"
  )}>
    <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
  </div>
)

// Envelope node
const EnvelopeNode = ({ data }: NodeProps<Node<EnvelopeData>>) => {
  const isIn = data.direction === "in"
  return (
    <div className={cn(
      "bg-[#161622] rounded-2xl p-6 w-[280px] min-h-[400px] border transition-all",
      data.isActive ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-[#252538]"
    )}>
      {!isIn && <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-left-1.5" />}
      {isIn && <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-right-1.5" />}

      <div className="flex justify-between mb-6">
        <span className="text-xs text-slate-500 uppercase">{isIn ? "Envelope" : "Callback"}</span>
        <div className="flex items-center gap-2">
          <Dot status={data.status} pulse={data.isActive} />
          <span className="text-xs text-slate-500">{data.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-slate-500 text-xs mb-1">ID</div>
          <code className="text-slate-300 font-mono text-sm">{data.id || "—"}</code>
        </div>
        <div>
          <div className="text-slate-500 text-xs mb-1">Action</div>
          <div className={cn("text-xl font-semibold", data.isActive ? "text-white" : "text-slate-300")}>{data.action}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs mb-1">Inputs</div>
          <Json data={data.inputs} highlight={data.highlight === "inputs"} />
        </div>
        {data.results && (
          <div>
            <div className="text-slate-500 text-xs mb-1">Results</div>
            <Json data={data.results} variant="success" highlight={data.highlight === "results"} />
          </div>
        )}
        {isIn && data.chainsTo && (
          <div className="pt-4 border-t border-[#252538]">
            <div className="text-slate-500 text-xs mb-1">Chains to</div>
            <div className="font-mono text-sm">
              <span className="text-blue-400">{data.chainsTo.action}</span>
              <span className="text-slate-600"> → </span>
              <span className="text-slate-500">{data.chainsTo.receiver}</span>
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
    "const { action, inputs } = envelope.env",
    "let result = await actions[action](inputs)",
    "envelope.payload.results = result",
    "if (callback) {",
    "  substitute(callback, result)",
    "  route(callback)",
    "}",
  ]

  return (
    <div className="bg-[#161622] rounded-2xl p-6 w-[320px] min-h-[400px] border border-[#252538]">
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-left-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-right-1.5" />

      <div className="mb-6">
        <span className="text-xs text-slate-500 uppercase">Logic</span>
      </div>

      <div className="space-y-1 font-mono text-sm">
        {steps.map((code, i) => (
          <div key={i} className={cn("py-1 px-2 rounded", data.step === i && "bg-blue-500/10 border-l-2 border-blue-500")}>
            <span className={data.step === i ? "text-white" : "text-slate-400"}>{code}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = { envelope: EnvelopeNode, logic: LogicNode }

const edges: Edge[] = [
  { id: "e1", source: "envelope", target: "logic", style: { stroke: "#60a5fa", strokeWidth: 2 } },
  { id: "e2", source: "logic", target: "callback", style: { stroke: "#60a5fa", strokeWidth: 2 } },
]

function buildNodes(env: EnvelopeInput | null): Node[] {
  const empty = { id: "—", action: "—", inputs: {}, status: "pending" as const }
  const e = env || empty
  return [
    { id: "envelope", type: "envelope", position: { x: 0, y: 0 }, data: {
      direction: "in", status: e.status, id: e.id, action: e.action, inputs: e.inputs, results: e.results,
      chainsTo: env?.callback ? { action: env.callback.action, receiver: env.callback.receiver || "next" } : undefined,
    }},
    { id: "logic", type: "logic", position: { x: 330, y: 0 }, data: { step: -1 } },
    { id: "callback", type: "envelope", position: { x: 700, y: 0 }, data: {
      direction: "out", status: "pending", id: env?.callback?.id || "—", action: env?.callback?.action || "—",
      inputs: env?.callback?.inputs || {},
    }},
  ]
}

export function EnvelopeFlowCanvas({ envelope = null }: { envelope?: EnvelopeInput | null }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(envelope))
  const [edgeState, setEdges, onEdgesChange] = useEdgesState(edges)
  const [animating, setAnimating] = useState(false)

  useEffect(() => { setNodes(buildNodes(envelope)) }, [envelope, setNodes])

  const animate = useCallback(() => {
    if (animating || !envelope) return
    setAnimating(true)

    setNodes((n) => n.map((x) => x.id === "envelope" ? { ...x, data: { ...x.data, isActive: true, highlight: "inputs" } } : x))
    setEdges((e) => e.map((x) => x.id === "e1" ? { ...x, animated: true } : x))

    let step = 0
    const iv = setInterval(() => {
      step++
      if (step <= 6) {
        setNodes((n) => n.map((x) => {
          if (x.id === "logic") return { ...x, data: { ...x.data, step: step - 1 } }
          if (x.id === "envelope" && step === 3) return { ...x, data: { ...x.data, highlight: "results" } }
          return x
        }))
      }
      if (step === 5) setEdges((e) => e.map((x) => x.id === "e2" ? { ...x, animated: true } : x))
      if (step === 6) {
        setNodes((n) => n.map((x) => x.id === "callback"
          ? { ...x, data: { ...x.data, isActive: true, highlight: "inputs", status: "resolved", inputs: envelope.results || {} } }
          : x))
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
  }, [envelope]) // eslint-disable-line

  return (
    <div className="h-full w-full bg-[#0f0f17]">
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
        <Background color="#1e293b" gap={40} size={1} />
      </ReactFlow>
    </div>
  )
}

export default EnvelopeFlowCanvas
