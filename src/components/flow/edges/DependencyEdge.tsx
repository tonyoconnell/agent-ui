// DependencyEdge - Task dependency/blocker visualization

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { DependencyEdgeData } from "@/engine/colony/types";

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<DependencyEdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isBlocking = data?.isBlocking ?? true;
  const blockerStatus = data?.blockerStatus ?? "todo";

  // Color based on blocker status
  const getColor = () => {
    if (blockerStatus === "complete") return "#22c55e"; // Green - resolved
    if (blockerStatus === "in_progress") return "#f59e0b"; // Amber - in progress
    return "#ef4444"; // Red - blocking
  };

  const color = getColor();

  return (
    <>
      {/* Blocking glow */}
      {isBlocking && blockerStatus !== "complete" && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: color,
            strokeWidth: 6,
            opacity: 0.2,
            filter: "blur(4px)",
          }}
          className="animate-pulse"
        />
      )}

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 2,
          strokeDasharray: isBlocking && blockerStatus !== "complete" ? "8,4" : undefined,
          opacity: blockerStatus === "complete" ? 0.4 : 0.8,
        }}
        className={isBlocking && blockerStatus !== "complete" ? "animate-pulse" : ""}
      />

      {/* Lock/check icon at midpoint */}
      <foreignObject
        width={24}
        height={24}
        x={(sourceX + targetX) / 2 - 12}
        y={(sourceY + targetY) / 2 - 12}
        className="overflow-visible pointer-events-none"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{
            backgroundColor: `${color}20`,
            border: `1px solid ${color}60`,
          }}
        >
          {blockerStatus === "complete" ? (
            <span className="text-green-400">✓</span>
          ) : blockerStatus === "in_progress" ? (
            <span className="text-amber-400">◐</span>
          ) : (
            <span className="text-red-400">⊗</span>
          )}
        </div>
      </foreignObject>

      {/* Selection highlight */}
      {selected && (
        <BaseEdge
          id={`${id}-selected`}
          path={edgePath}
          style={{
            stroke: "#3b82f6",
            strokeWidth: 6,
            opacity: 0.3,
          }}
        />
      )}
    </>
  );
}

export default DependencyEdge;
