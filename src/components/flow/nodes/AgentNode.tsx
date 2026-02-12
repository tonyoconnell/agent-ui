// AgentNode - Deterministic Agent visualization for ReactFlow
// Used for envelope system agents: Data Processor, Router, Validator

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface AgentNodeData {
  id: string;
  name: string;
  status: "ready" | "waiting" | "idle" | "error";
  actions: string[];
  envelopeCount: number;
  role?: "processor" | "router" | "validator" | "generic";
}

const ROLE_STYLES: Record<string, { icon: string; gradient: string; color: string }> = {
  processor: { icon: "⚙", gradient: "from-blue-500/20 to-cyan-500/20", color: "#3b82f6" },
  router: { icon: "⇄", gradient: "from-purple-500/20 to-pink-500/20", color: "#a855f7" },
  validator: { icon: "✓", gradient: "from-green-500/20 to-emerald-500/20", color: "#22c55e" },
  generic: { icon: "◉", gradient: "from-slate-500/20 to-slate-600/20", color: "#64748b" },
};

const STATUS_COLORS: Record<string, string> = {
  ready: "#22c55e",
  waiting: "#eab308",
  idle: "#64748b",
  error: "#ef4444",
};

export function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  const role = data.role || "generic";
  const roleStyle = ROLE_STYLES[role];
  const statusColor = STATUS_COLORS[data.status];

  return (
    <div
      className={cn(
        "relative px-5 py-4 bg-[#0f0f14] border rounded-xl min-w-[180px]",
        "transition-all duration-200",
        selected ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-[#1e293b]",
        data.status === "ready" && "ring-1 ring-green-500/20"
      )}
    >
      {/* Role gradient background */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl bg-gradient-to-br opacity-40",
          roleStyle.gradient
        )}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-[#0f0f14]"
      />

      {/* Content */}
      <div className="relative">
        {/* Header: icon + name */}
        <div className="flex items-center gap-3 mb-3">
          {/* Role icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${roleStyle.color}20`, color: roleStyle.color }}
          >
            {roleStyle.icon}
          </div>

          <div>
            <div className="font-medium text-white text-base">{data.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* Status dot with pulse */}
              <div className="relative flex items-center">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    data.status === "ready" && "animate-ping absolute"
                  )}
                  style={{ backgroundColor: statusColor, opacity: 0.4 }}
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
              </div>
              <span className="text-xs text-slate-400 capitalize">{data.status}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Actions</div>
          <div className="flex flex-wrap gap-1">
            {data.actions.map((action) => (
              <span
                key={action}
                className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#1e293b] text-slate-300"
              >
                {action}
              </span>
            ))}
          </div>
        </div>

        {/* Envelope count */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Envelopes</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded font-mono",
              data.envelopeCount > 0
                ? "bg-blue-500/20 text-blue-400"
                : "bg-slate-500/10 text-slate-500"
            )}
          >
            {data.envelopeCount}
          </span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-[#0f0f14]"
      />
    </div>
  );
}

export default AgentNode;
