// EnvelopeNode - Envelope packet visualization for ReactFlow

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { EnvelopeNodeData } from "@/engine/colony/types";

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  pending: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "◐" },
  resolved: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: "●" },
  rejected: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "✕" },
};

export function EnvelopeNode({ data, selected }: NodeProps<EnvelopeNodeData>) {
  const status = STATUS_STYLES[data.status] || STATUS_STYLES.pending;

  return (
    <div
      className={cn(
        "relative px-4 py-3 bg-[#0f0f14] border rounded-lg min-w-[140px]",
        "transition-all duration-200",
        selected ? "border-blue-500 shadow-lg shadow-blue-500/20" : status.border,
        status.bg
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-[#0f0f14]"
      />

      {/* Content */}
      <div className="relative">
        {/* Envelope icon + ID */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-6 h-6 rounded flex items-center justify-center text-sm",
            status.bg, status.text
          )}>
            {status.icon}
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            {data.id.slice(0, 12)}
          </span>
        </div>

        {/* Action */}
        <div className="text-white font-medium text-sm mb-1">
          {data.action.replace("L", "").replace(":", " ")}
        </div>

        {/* Flow info */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <span className="text-blue-400">{data.sourceAgentId}</span>
          <span>→</span>
          <span className="text-green-400">{data.targetAgentId}</span>
        </div>

        {/* Status badge */}
        <div className={cn(
          "mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]",
          status.bg, status.text
        )}>
          <span>{status.icon}</span>
          <span className="capitalize">{data.status}</span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-2.5 !h-2.5 !border-2 !border-[#0f0f14]"
      />
    </div>
  );
}

export default EnvelopeNode;
