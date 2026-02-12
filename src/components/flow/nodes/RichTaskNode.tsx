// RichTaskNode - Rich task visualization based on task-management.tql
// Shows priority, status, effort, tags, assignee, dependencies

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { RichTaskNodeData } from "@/engine/colony/taskTypes";
import { PRIORITY_STYLES, STATUS_STYLES, EFFORT_STYLES } from "@/engine/colony/taskTypes";

export function RichTaskNode({ data, selected }: NodeProps<RichTaskNodeData>) {
  const priority = PRIORITY_STYLES[data.priority];
  const status = STATUS_STYLES[data.status];
  const effort = EFFORT_STYLES[data.effortSize];
  const isBlocked = data.status === "blocked" || (data.blockedBy && data.blockedBy.length > 0 && data.status === "todo");
  const hasBlockers = data.blockedBy && data.blockedBy.length > 0;

  return (
    <div
      className={cn(
        "relative bg-[#0f0f14] border rounded-xl min-w-[220px] max-w-[280px]",
        "transition-all duration-200 overflow-hidden",
        selected ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-[#1e293b]",
        data.attractive && "ring-1 ring-green-500/30",
        data.repelled && "ring-1 ring-red-500/30",
        isBlocked && "border-red-500/40"
      )}
    >
      {/* Attractive/Repelled indicator strip */}
      {data.attractive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
      )}
      {data.repelled && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
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
      <div className="p-4">
        {/* Header: Priority + Status + Effort */}
        <div className="flex items-center gap-2 mb-3">
          {/* Priority badge */}
          <span
            className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
          >
            {data.priority}
          </span>

          {/* Status badge */}
          <span
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-medium rounded flex items-center gap-1",
              status.bg
            )}
            style={{ color: status.color }}
          >
            <span>{status.icon}</span>
            {data.status.replace("_", " ")}
          </span>

          {/* Effort badge */}
          <span
            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-500/10"
            style={{ color: effort.color }}
          >
            {effort.label}
          </span>

          {/* Importance indicator */}
          <div className="ml-auto flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 h-3 rounded-full",
                  i < Math.ceil(data.importance / 2)
                    ? "bg-amber-500"
                    : "bg-slate-700"
                )}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="text-white font-medium text-sm mb-2 line-clamp-2">
          {data.title}
        </div>

        {/* Description (if present) */}
        {data.description && (
          <div className="text-slate-500 text-xs mb-3 line-clamp-2">
            {data.description}
          </div>
        )}

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {data.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 text-[9px] rounded-full"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Category + Assignee */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
          {/* Category */}
          {data.category && (
            <span
              className="text-[10px] font-medium"
              style={{ color: data.category.color }}
            >
              {data.category.name}
            </span>
          )}

          {/* Assignee */}
          {data.assignee && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-700 text-white"
              >
                {data.assignee.avatar || data.assignee.name[0]}
              </div>
              <span className="text-[10px] text-slate-400">
                {data.assignee.name}
              </span>
            </div>
          )}
        </div>

        {/* Blocked indicator */}
        {hasBlockers && data.status !== "complete" && (
          <div className="mt-2 pt-2 border-t border-red-500/20">
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <span>⊗</span>
              <span>Blocked by {data.blockedBy?.length} task{data.blockedBy?.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {/* Blocks indicator */}
        {data.blocks && data.blocks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-amber-500/20">
            <div className="flex items-center gap-1 text-[10px] text-amber-400">
              <span>→</span>
              <span>Blocks {data.blocks.length} task{data.blocks.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-3 !h-3 !border-2 !border-[#0f0f14]",
          data.blocks && data.blocks.length > 0 ? "!bg-amber-500" : "!bg-green-500"
        )}
      />
    </div>
  );
}

export default RichTaskNode;
