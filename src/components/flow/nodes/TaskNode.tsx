// TaskNode - Task entity visualization with blocking status

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { TaskNodeData } from "@/engine/colony/types";

const PRIORITY_STYLES: Record<string, { color: string; label: string }> = {
  P0: { color: "#ef4444", label: "P0" },
  P1: { color: "#f59e0b", label: "P1" },
  P2: { color: "#3b82f6", label: "P2" },
  P3: { color: "#64748b", label: "P3" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  todo: { bg: "bg-slate-500/10", text: "text-slate-400", icon: "○" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-400", icon: "◐" },
  complete: { bg: "bg-green-500/10", text: "text-green-400", icon: "●" },
  blocked: { bg: "bg-red-500/10", text: "text-red-400", icon: "⊗" },
};

export function TaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  const priority = PRIORITY_STYLES[data.priority];
  const status = STATUS_STYLES[data.status];
  const isBlocked = data.status === "blocked" || (data.blockedBy && data.blockedBy.length > 0);

  return (
    <div
      className={cn(
        "relative px-4 py-3 bg-[#0f0f14] border rounded-lg min-w-[180px]",
        "transition-all duration-200",
        selected ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-[#1e293b]",
        isBlocked && "border-red-500/50",
        data.attractive && "ring-1 ring-green-500/30",
        data.repelled && "ring-1 ring-red-500/30"
      )}
    >
      {/* Blocked overlay */}
      {isBlocked && (
        <div className="absolute inset-0 bg-red-500/5 rounded-lg flex items-center justify-center">
          <div className="absolute top-1 right-1 text-red-400 text-lg animate-pulse">
            ⊗
          </div>
        </div>
      )}

      {/* Attractive glow */}
      {data.attractive && !isBlocked && (
        <div className="absolute inset-0 bg-green-500/5 rounded-lg" />
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-3 !h-3 !border-2 !border-[#0f0f14]",
          isBlocked ? "!bg-red-500" : "!bg-blue-500"
        )}
      />

      {/* Content */}
      <div className="relative">
        {/* Header: priority + status */}
        <div className="flex items-center gap-2 mb-2">
          {/* Priority badge */}
          <span
            className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
          >
            {priority.label}
          </span>

          {/* Status badge */}
          <span
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-medium rounded flex items-center gap-1",
              status.bg,
              status.text
            )}
          >
            <span>{status.icon}</span>
            {data.status.replace("_", " ")}
          </span>
        </div>

        {/* Title */}
        <div className="text-sm text-white font-medium mb-1 line-clamp-2">
          {data.title}
        </div>

        {/* Task ID */}
        <div className="text-[10px] text-slate-500 font-mono">
          {data.id}
        </div>

        {/* Blockers info */}
        {data.blockedBy && data.blockedBy.length > 0 && (
          <div className="mt-2 pt-2 border-t border-red-500/20">
            <span className="text-[10px] text-red-400">
              Blocked by: {data.blockedBy.join(", ")}
            </span>
          </div>
        )}

        {/* Trail indicators */}
        <div className="mt-2 flex gap-2">
          {data.attractive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
              Attractive
            </span>
          )}
          {data.repelled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
              Repelled
            </span>
          )}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-3 !h-3 !border-2 !border-[#0f0f14]",
          isBlocked ? "!bg-red-500" : "!bg-green-500"
        )}
      />
    </div>
  );
}

export default TaskNode;
