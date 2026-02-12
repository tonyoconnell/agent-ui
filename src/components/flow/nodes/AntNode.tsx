// AntNode - Caste-styled ant agent visualization for ReactFlow

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { AntNodeData } from "@/engine/colony/types";
import { CASTE_STYLES, TIER_STYLES, STATUS_COLORS } from "@/engine/colony/types";

export function AntNode({ data, selected }: NodeProps<AntNodeData>) {
  const casteStyle = CASTE_STYLES[data.caste];
  const tierStyle = TIER_STYLES[data.tier];

  return (
    <div
      className={cn(
        "relative px-4 py-3 bg-[#0f0f14] border rounded-lg min-w-[160px]",
        "transition-all duration-200",
        selected ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-[#1e293b]",
        data.status === "ready" && "animate-pulse-subtle"
      )}
      style={{ transform: `scale(${tierStyle.scale})` }}
    >
      {/* Caste gradient background */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg bg-gradient-to-br opacity-40",
          casteStyle.gradient
        )}
      />

      {/* Input handle - receives envelopes */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-[#0f0f14]"
      />

      {/* Content */}
      <div className="relative">
        {/* Header: caste icon + name + tier */}
        <div className="flex items-center gap-2 mb-2">
          {/* Caste indicator */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: `${casteStyle.color}20`, color: casteStyle.color }}
          >
            {casteStyle.icon}
          </div>

          <span className="font-medium text-white">{data.name}</span>

          {/* Tier badge */}
          <span
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-medium rounded border",
              tierStyle.badge
            )}
          >
            {data.tier}
          </span>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Status dot with pulse for ready */}
          <div className="relative flex items-center">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                data.status === "ready" && "animate-ping absolute"
              )}
              style={{ backgroundColor: STATUS_COLORS[data.status], opacity: 0.4 }}
            />
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[data.status] }}
            />
          </div>
          <span className="text-xs text-slate-400 capitalize">{data.status}</span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400 capitalize">{data.caste}</span>
        </div>

        {/* Stats bar */}
        <div className="space-y-1">
          {/* Success rate bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-10">Success</span>
            <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${data.successRate * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 w-8 text-right">
              {Math.round(data.successRate * 100)}%
            </span>
          </div>

          {/* Activity bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-10">Activity</span>
            <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${data.activityScore}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 w-8 text-right">
              {data.activityScore}
            </span>
          </div>
        </div>

        {/* Contribution badge */}
        {data.totalContribution > 0 && (
          <div className="mt-2 flex justify-end">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              +{data.totalContribution} impact
            </span>
          </div>
        )}

        {/* Swarm indicator */}
        {data.swarmId && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
        )}
      </div>

      {/* Output handle - sends envelopes */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-[#0f0f14]"
      />
    </div>
  );
}

export default AntNode;
