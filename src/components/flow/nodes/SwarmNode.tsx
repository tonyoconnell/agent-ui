// SwarmNode - Swarm group container visualization

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { SwarmNodeData } from "@/engine/colony/types";

const SWARM_STATUS_STYLES: Record<string, { bg: string; border: string; animate: boolean }> = {
  forming: { bg: "bg-purple-500/5", border: "border-purple-500/30", animate: true },
  active: { bg: "bg-purple-500/10", border: "border-purple-500/60", animate: false },
  dissolving: { bg: "bg-purple-500/5", border: "border-purple-500/20", animate: true },
  dissolved: { bg: "bg-slate-500/5", border: "border-slate-500/20", animate: false },
};

export function SwarmNode({ data, selected }: NodeProps<SwarmNodeData>) {
  const status = SWARM_STATUS_STYLES[data.status];

  return (
    <div
      className={cn(
        "relative px-6 py-4 border-2 rounded-2xl min-w-[250px] min-h-[120px]",
        "transition-all duration-300",
        status.bg,
        status.border,
        status.animate && "animate-pulse",
        selected && "shadow-lg shadow-purple-500/20"
      )}
    >
      {/* Swarm glow effect */}
      {data.status === "active" && (
        <div className="absolute inset-0 rounded-2xl bg-purple-500/5 animate-pulse" />
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500 !w-4 !h-4 !border-2 !border-[#0f0f14]"
      />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {/* Swarm icon */}
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <span className="text-purple-400 text-lg">
              {data.status === "forming" ? "◌" : data.status === "active" ? "◉" : "○"}
            </span>
          </div>

          <div>
            <div className="text-white font-medium">{data.purpose}</div>
            <div className="text-[10px] text-slate-500 capitalize">{data.status}</div>
          </div>
        </div>

        {/* Member count */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex -space-x-1">
            {Array.from({ length: Math.min(data.memberCount, 5) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-500/50 flex items-center justify-center"
              >
                <span className="text-[8px] text-purple-300">A</span>
              </div>
            ))}
            {data.memberCount > 5 && (
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <span className="text-[8px] text-purple-400">+{data.memberCount - 5}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-purple-400">
            {data.memberCount}/{data.maxSize} members
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Collective Progress</span>
            <span className="text-purple-400">{Math.round(data.collectiveProgress * 100)}%</span>
          </div>
          <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                data.status === "active" ? "bg-purple-500" : "bg-purple-500/50"
              )}
              style={{ width: `${data.collectiveProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-500 !w-4 !h-4 !border-2 !border-[#0f0f14]"
      />
    </div>
  );
}

export default SwarmNode;
