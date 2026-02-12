// EnvelopeFlowCanvas - Simple envelope → logic → envelope visualization
// Shows the core relay pattern: Receive → Transform → Dispatch

import { useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeProps,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";

// ============================================
// Node Data Types
// ============================================
interface EnvelopeData {
  direction: "in" | "out";
  status: "pending" | "resolved" | "rejected";
  agent: string;
  action: string;
  inputs: Record<string, unknown>;
  results?: Record<string, unknown>;
  isActive?: boolean;
}

interface LogicData {
  activeStep: number;
  isAnimating: boolean;
}

// ============================================
// Shared Components
// ============================================
function StatusDot({ status, pulse = false }: { status: string; pulse?: boolean }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-400",
    resolved: "bg-emerald-400",
    rejected: "bg-red-400",
  };

  return (
    <span className="relative flex h-2 w-2">
      {pulse && (
        <span className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          colors[status] || "bg-slate-400"
        )} />
      )}
      <span className={cn(
        "relative inline-flex h-2 w-2 rounded-full",
        colors[status] || "bg-slate-400"
      )} />
    </span>
  );
}

function JsonBlock({
  data,
  variant = "default"
}: {
  data: unknown;
  variant?: "default" | "success"
}) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const lines = json.split("\n");
  const isLong = lines.length > 4;

  return (
    <button
      onClick={() => isLong && setExpanded(!expanded)}
      className={cn(
        "w-full text-left font-mono text-[11px] leading-relaxed p-3 rounded-lg transition-all duration-200",
        "bg-black/30 border border-white/5",
        isLong && "hover:bg-black/40 cursor-pointer",
        variant === "success" ? "text-emerald-300/90" : "text-slate-300/80"
      )}
    >
      <pre className={cn(
        "overflow-hidden transition-all duration-300",
        expanded ? "max-h-64" : "max-h-20"
      )}>
        {json}
      </pre>
      {isLong && !expanded && (
        <span className="text-slate-500 text-[10px] mt-1 block">
          Click to expand...
        </span>
      )}
    </button>
  );
}

// ============================================
// Envelope Node
// ============================================
function EnvelopeNode({ data }: NodeProps<Node<EnvelopeData>>) {
  const isInput = data.direction === "in";

  const accentColor = isInput ? "blue" : "emerald";
  const accentClasses = {
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
      glow: "shadow-blue-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      glow: "shadow-emerald-500/20",
    },
  }[accentColor];

  return (
    <div
      className={cn(
        "relative bg-[#12121a] rounded-2xl p-5 w-[260px] transition-all duration-500",
        "border border-white/[0.06]",
        "shadow-xl shadow-black/20",
        data.isActive && [
          accentClasses.border,
          "shadow-2xl",
          accentClasses.glow,
        ]
      )}
    >
      {/* Subtle gradient overlay */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-50 pointer-events-none",
        "bg-gradient-to-br from-white/[0.02] to-transparent"
      )} />

      {/* Handles */}
      {!isInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#12121a] !-left-1.5"
        />
      )}
      {isInput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-emerald-400 !w-3 !h-3 !border-[3px] !border-[#12121a] !-right-1.5"
        />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium",
            accentClasses.bg,
            accentClasses.text
          )}>
            {isInput ? "↓" : "↑"}
          </div>
          <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {isInput ? "Received" : "Dispatched"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={data.status} pulse={data.isActive} />
          <span className="text-[10px] text-slate-500 capitalize">{data.status}</span>
        </div>
      </div>

      <div className="relative space-y-4">
        {/* From/To */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-8">{isInput ? "from" : "to"}</span>
          <span className={cn(
            "font-mono text-xs px-2.5 py-1 rounded-md",
            accentClasses.bg,
            accentClasses.text
          )}>
            {data.agent}
          </span>
        </div>

        {/* Action */}
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            Action
          </div>
          <div className="text-white text-lg font-semibold tracking-tight">
            {data.action}
          </div>
        </div>

        {/* Inputs */}
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            {isInput ? "Inputs" : "Transformed Inputs"}
          </div>
          <JsonBlock data={data.inputs} />
        </div>

        {/* Results (only for input envelope) */}
        {isInput && data.results && (
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Results
            </div>
            <JsonBlock data={data.results} variant="success" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Logic Node
// ============================================
function LogicNode({ data }: NodeProps<Node<LogicData>>) {
  const steps = [
    { code: "// 1. RECEIVE", isHeader: true },
    { code: "const { action, inputs } = envelope.env;" },
    { code: "" },
    { code: "// 2. TRANSFORM", isHeader: true },
    { code: "let result = this.actions[action](inputs);" },
    { code: "envelope.payload.results = result;" },
    { code: "" },
    { code: "// 3. DISPATCH", isHeader: true },
    { code: "let next = envelope.callback;" },
    { code: "next.env.inputs = substitute(next, result);" },
    { code: "this.route(next);", comment: "// → next agent" },
  ];

  return (
    <div className={cn(
      "relative bg-[#12121a] rounded-2xl p-5 w-[320px] transition-all duration-500",
      "border border-white/[0.06]",
      "shadow-xl shadow-black/20"
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none bg-gradient-to-br from-white/[0.02] to-transparent" />

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#12121a] !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-3 !h-3 !border-[3px] !border-[#12121a] !-right-1.5"
      />

      {/* Header */}
      <div className="relative flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center text-sm">
          ⚡
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
          Transform
        </span>
      </div>

      {/* Code */}
      <div className="relative space-y-0.5 font-mono text-[11px] leading-relaxed">
        {steps.map((step, i) => {
          if (step.code === "") return <div key={i} className="h-3" />;

          const isActive = data.activeStep === i && !step.isHeader;

          return (
            <div
              key={i}
              className={cn(
                "py-1 px-2.5 rounded-md transition-all duration-300",
                step.isHeader && "mt-1",
                isActive && "bg-blue-500/15 border-l-2 border-blue-400 -ml-0.5 pl-2"
              )}
            >
              <span className={cn(
                "transition-colors duration-300",
                step.isHeader
                  ? "text-slate-500 text-[10px] font-semibold uppercase tracking-wider"
                  : isActive
                    ? "text-white"
                    : "text-slate-400"
              )}>
                {step.code}
              </span>
              {step.comment && (
                <span className="text-emerald-500/70 ml-2">{step.comment}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Node Types
// ============================================
const nodeTypes = {
  envelope: EnvelopeNode,
  logic: LogicNode,
};

// ============================================
// Initial Data
// ============================================
const initialNodes: Node[] = [
  {
    id: "received",
    type: "envelope",
    position: { x: 0, y: 40 },
    data: {
      direction: "in",
      status: "resolved",
      agent: "system",
      action: "processData",
      inputs: { source: "api/feed", limit: 100 },
      results: { processed: true, count: 42 },
      isActive: false,
    },
  },
  {
    id: "transform",
    type: "logic",
    position: { x: 340, y: 0 },
    data: {
      activeStep: -1,
      isAnimating: false,
    },
  },
  {
    id: "dispatched",
    type: "envelope",
    position: { x: 740, y: 40 },
    data: {
      direction: "out",
      status: "resolved",
      agent: "agent-b",
      action: "routeEnvelope",
      inputs: {
        target: "agent-c",
        data: { processed: true, count: 42 },
      },
      isActive: false,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1",
    source: "received",
    target: "transform",
    animated: false,
    style: { stroke: "#60a5fa", strokeWidth: 2 },
  },
  {
    id: "e2",
    source: "transform",
    target: "dispatched",
    animated: false,
    style: { stroke: "#34d399", strokeWidth: 2 },
  },
];

// ============================================
// Main Component
// ============================================
export function EnvelopeFlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isAnimating, setIsAnimating] = useState(false);

  const runFlow = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Activate received envelope
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "received" ? { ...n, data: { ...n.data, isActive: true } } : n
      )
    );
    setEdges((eds) =>
      eds.map((e) => (e.id === "e1" ? { ...e, animated: true } : e))
    );

    let step = 0;
    const interval = setInterval(() => {
      step++;

      if (step <= 10) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === "transform"
              ? { ...n, data: { ...n.data, activeStep: step } }
              : n
          )
        );
      }

      if (step === 6) {
        setEdges((eds) =>
          eds.map((e) => (e.id === "e2" ? { ...e, animated: true } : e))
        );
      }

      if (step === 8) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === "dispatched"
              ? { ...n, data: { ...n.data, isActive: true } }
              : n
          )
        );
      }

      if (step >= 12) {
        clearInterval(interval);
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((n) => ({
              ...n,
              data: { ...n.data, isActive: false, activeStep: -1 },
            }))
          );
          setEdges((eds) => eds.map((e) => ({ ...e, animated: false })));
          setIsAnimating(false);
        }, 1000);
      }
    }, 350);
  }, [isAnimating, setNodes, setEdges]);

  return (
    <div className="h-full w-full bg-[#08080c]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        proOptions={{ hideAttribution: true }}
        className="bg-[#08080c]"
      >
        <Background color="#1a1a24" gap={32} size={1} />
        <Controls className="!bg-[#12121a] !border-white/[0.06] !rounded-xl !shadow-xl [&>button]:!bg-[#12121a] [&>button]:!border-white/[0.06] [&>button]:!fill-slate-400 [&>button:hover]:!bg-[#1a1a24] [&>button]:!rounded-lg" />

        {/* Header Panel */}
        <Panel position="top-left">
          <div className="p-5 bg-[#12121a] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/30 min-w-[200px]">
            {/* Title */}
            <div className="flex items-center gap-3 mb-1">
              <StatusDot status="resolved" pulse />
              <span className="text-white text-lg font-semibold tracking-tight">
                Data Processor
              </span>
            </div>

            {/* Actions */}
            <div className="text-slate-500 text-xs font-mono mb-5 pl-5">
              processData, validate
            </div>

            {/* Run Button */}
            <button
              onClick={runFlow}
              disabled={isAnimating}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
                "flex items-center justify-center gap-2",
                isAnimating
                  ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              )}
            >
              {isAnimating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <span>▶</span>
                  Run Flow
                </>
              )}
            </button>
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left">
          <div className="px-4 py-3 bg-[#12121a]/80 backdrop-blur-sm border border-white/[0.06] rounded-xl">
            <div className="flex items-center gap-6 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-400 rounded-full" />
                <span className="text-slate-500">Receive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-emerald-400 rounded-full" />
                <span className="text-slate-500">Dispatch</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default EnvelopeFlowCanvas;
