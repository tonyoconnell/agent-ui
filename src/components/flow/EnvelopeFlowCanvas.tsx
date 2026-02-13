// EnvelopeFlowCanvas - Simple envelope → logic → envelope visualization

import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
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
  id?: string;
  action: string;
  inputs: Record<string, unknown>;
  results?: Record<string, unknown>;
  chainsTo?: { action: string; receiver: string };
  isActive?: boolean;
  highlightInputs?: boolean;
  highlightResults?: boolean;
}

interface LogicData {
  activeStep: number;
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
  variant = "default",
  highlight = false,
}: {
  data: unknown;
  variant?: "default" | "success";
  highlight?: boolean;
}) {
  const json = JSON.stringify(data, null, 2);

  return (
    <div className={cn(
      "font-mono text-[11px] leading-relaxed p-3 rounded-xl transition-all duration-500",
      "border",
      highlight
        ? variant === "success"
          ? "bg-emerald-500/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10 text-emerald-300"
          : "bg-blue-500/20 border-blue-500/40 shadow-lg shadow-blue-500/10 text-blue-300"
        : "bg-black/30 border-white/5",
      !highlight && (variant === "success" ? "text-emerald-300/70" : "text-slate-400")
    )}>
      <pre className="whitespace-pre-wrap">{json}</pre>
    </div>
  );
}

// ============================================
// Envelope Node
// ============================================
function EnvelopeNode({ data }: NodeProps<Node<EnvelopeData>>) {
  const isInput = data.direction === "in";
  const label = isInput ? "Envelope" : "Callback";

  return (
    <div
      className={cn(
        "relative bg-[#161622] rounded-2xl p-6 w-[280px] min-h-[400px] transition-all duration-500",
        "border",
        data.isActive
          ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
          : "border-[#252538]"
      )}
    >
      {/* Handles */}
      {!isInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-left-1.5"
        />
      )}
      {isInput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-right-1.5"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <StatusDot status={data.status} pulse={data.isActive} />
          <span className="text-xs text-slate-500">{data.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* ID */}
        <div>
          <div className="text-slate-500 text-xs mb-1">ID</div>
          <code className="text-slate-300 font-mono text-sm">{data.id || "env-abc123"}</code>
        </div>

        {/* Action */}
        <div>
          <div className="text-slate-500 text-xs mb-1">Action</div>
          <div className={cn(
            "text-xl font-semibold transition-colors duration-500",
            data.isActive ? "text-white" : "text-slate-300"
          )}>
            {data.action}
          </div>
        </div>

        {/* Inputs */}
        <div>
          <div className="text-slate-500 text-xs mb-1">Inputs</div>
          <JsonBlock data={data.inputs} highlight={data.highlightInputs} />
        </div>

        {/* Results */}
        {data.results && (
          <div>
            <div className="text-slate-500 text-xs mb-1">Results</div>
            <JsonBlock data={data.results} variant="success" highlight={data.highlightResults} />
          </div>
        )}

        {/* Chains to (for input envelope) */}
        {isInput && data.chainsTo && (
          <div className="pt-4 border-t border-[#252538]">
            <div className="text-slate-500 text-xs mb-1">Chains to</div>
            <div className="text-slate-400 font-mono text-sm flex items-center gap-2">
              <span className="text-blue-400">{data.chainsTo.action}</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-500">{data.chainsTo.receiver}</span>
            </div>
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
    { code: "const { action, inputs } = envelope.env;", comment: "// Extract" },
    { code: "let result = await this.actions[action](inputs);", comment: "// Execute" },
    { code: "envelope.payload.results = result;", comment: "// Store" },
    { code: "if (callback) {", comment: "" },
    { code: "  this.substitute(callback, result);", comment: "// Substitute" },
    { code: "  await this.route(callback);", comment: "// Route" },
    { code: "}", comment: "" },
  ];

  return (
    <div className={cn(
      "relative bg-[#161622] rounded-2xl p-6 w-[340px] min-h-[400px] transition-all duration-500",
      "border border-[#252538]"
    )}>
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-400 !w-3 !h-3 !border-[3px] !border-[#161622] !-right-1.5"
      />

      {/* Header */}
      <div className="mb-6">
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          Logic
        </span>
      </div>

      {/* Code */}
      <div className="space-y-2 font-mono text-sm">
        {steps.map((step, i) => {
          const isActive = data.activeStep === i;

          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 py-1 px-2 rounded transition-all duration-300",
                isActive && "bg-blue-500/10 border-l-2 border-blue-500"
              )}
            >
              <span className={cn(
                "transition-colors duration-300",
                isActive ? "text-white" : "text-slate-400"
              )}>
                {step.code}
              </span>
              {step.comment && (
                <span className="text-slate-600 text-xs">{step.comment}</span>
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
// Build nodes from envelope data
// ============================================
interface EnvelopeInput {
  id: string;
  action: string;
  inputs: Record<string, unknown>;
  results?: Record<string, unknown>;
  status: "pending" | "resolved" | "rejected";
  callback?: {
    id: string;
    action: string;
    inputs: Record<string, unknown>;
    receiver?: string;
  } | null;
}

function buildNodes(envelope: EnvelopeInput | null): Node[] {
  if (!envelope) {
    return [
      {
        id: "envelope",
        type: "envelope",
        position: { x: 0, y: 0 },
        data: {
          direction: "in",
          status: "pending",
          id: "—",
          action: "awaiting...",
          inputs: {},
          isActive: false,
          highlightInputs: false,
          highlightResults: false,
        },
      },
      {
        id: "logic",
        type: "logic",
        position: { x: 340, y: 0 },
        data: { activeStep: -1 },
      },
      {
        id: "callback",
        type: "envelope",
        position: { x: 740, y: 0 },
        data: {
          direction: "out",
          status: "pending",
          id: "—",
          action: "—",
          inputs: {},
          isActive: false,
          highlightInputs: false,
        },
      },
    ];
  }

  return [
    {
      id: "envelope",
      type: "envelope",
      position: { x: 0, y: 0 },
      data: {
        direction: "in",
        status: envelope.status,
        id: envelope.id,
        action: envelope.action,
        inputs: envelope.inputs,
        results: envelope.results,
        chainsTo: envelope.callback
          ? { action: envelope.callback.action, receiver: envelope.callback.receiver || "next" }
          : undefined,
        isActive: false,
        highlightInputs: false,
        highlightResults: false,
      },
    },
    {
      id: "logic",
      type: "logic",
      position: { x: 340, y: 0 },
      data: { activeStep: -1 },
    },
    {
      id: "callback",
      type: "envelope",
      position: { x: 740, y: 0 },
      data: {
        direction: "out",
        status: "pending",
        id: envelope.callback?.id || "—",
        action: envelope.callback?.action || "—",
        inputs: envelope.callback?.inputs || {},
        isActive: false,
        highlightInputs: false,
      },
    },
  ];
}

const defaultEdges: Edge[] = [
  {
    id: "e1",
    source: "envelope",
    target: "logic",
    animated: false,
    style: { stroke: "#60a5fa", strokeWidth: 2 },
  },
  {
    id: "e2",
    source: "logic",
    target: "callback",
    animated: false,
    style: { stroke: "#60a5fa", strokeWidth: 2 },
  },
];

// ============================================
// Main Component
// ============================================
interface EnvelopeFlowCanvasProps {
  envelope?: EnvelopeInput | null;
}

export function EnvelopeFlowCanvas({ envelope = null }: EnvelopeFlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(envelope));
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rebuild nodes when envelope changes
  useEffect(() => {
    setNodes(buildNodes(envelope));
  }, [envelope, setNodes]);

  const runFlow = useCallback(() => {
    if (isAnimating || !envelope) return;
    setIsAnimating(true);

    const callbackInputs = envelope.callback?.inputs || {};
    const results = envelope.results || {};

    // Activate envelope, start first edge animation
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "envelope" ? { ...n, data: { ...n.data, isActive: true, highlightInputs: true } } : n
      )
    );
    setEdges((eds) =>
      eds.map((e) => (e.id === "e1" ? { ...e, animated: true } : e))
    );

    let step = 0;
    const interval = setInterval(() => {
      step++;

      // Steps 0-6 animate through the logic code
      if (step <= 6) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === "logic") {
              return { ...n, data: { ...n.data, activeStep: step - 1 } };
            }
            if (n.id === "envelope" && step === 3) {
              // Show results after "Store" step
              return { ...n, data: { ...n.data, highlightInputs: false, highlightResults: true } };
            }
            return n;
          })
        );
      }

      // Step 5: Start second edge animation (after substitute)
      if (step === 5) {
        setEdges((eds) =>
          eds.map((e) => (e.id === "e2" ? { ...e, animated: true } : e))
        );
      }

      // Step 6: Activate callback envelope with substituted results
      if (step === 6) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === "callback"
              ? { ...n, data: { ...n.data, isActive: true, highlightInputs: true, status: "resolved", inputs: results } }
              : n
          )
        );
      }

      // Reset after animation completes
      if (step >= 9) {
        clearInterval(interval);
        setTimeout(() => {
          setNodes(buildNodes(envelope));
          setEdges((eds) => eds.map((e) => ({ ...e, animated: false })));
          setIsAnimating(false);
        }, 1000);
      }
    }, 500);
  }, [isAnimating, envelope, setNodes, setEdges]);

  // Auto-start animation when envelope is present
  useEffect(() => {
    if (envelope) {
      const timer = setTimeout(runFlow, 600);
      return () => clearTimeout(timer);
    }
  }, [envelope]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full w-full bg-[#0f0f17]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        className="bg-[#0f0f17]"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
      >
        <Background color="#1e293b" gap={40} size={1} />
      </ReactFlow>
    </div>
  );
}

export default EnvelopeFlowCanvas;
