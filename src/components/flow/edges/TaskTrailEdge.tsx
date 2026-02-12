// TaskTrailEdge - Pheromone trail visualization between tasks
// Based on task-management.tql pheromone-trail relation

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { TaskTrailEdgeData } from "@/engine/colony/taskTypes";
import { TRAIL_STATUS_STYLES } from "@/engine/colony/taskTypes";

export function TaskTrailEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<TaskTrailEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Default values
  const trail = data?.trail ?? 50;
  const alarm = data?.alarm ?? 0;
  const status = data?.status ?? "fresh";
  const completions = data?.completions ?? 0;
  const failures = data?.failures ?? 0;

  // Calculate visual properties
  const strokeWidth = Math.max(2, Math.min(8, trail / 12));
  const opacity = Math.max(0.3, Math.min(1, trail / 80));
  const isAlarmed = alarm > trail;

  // Get style based on status
  const style = TRAIL_STATUS_STYLES[status];

  return (
    <>
      {/* Glow for proven trails */}
      {style.glow && !isAlarmed && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: style.color,
            strokeWidth: strokeWidth + 8,
            opacity: 0.15,
            filter: "blur(8px)",
          }}
        />
      )}

      {/* Alarm glow */}
      {isAlarmed && (
        <BaseEdge
          id={`${id}-alarm`}
          path={edgePath}
          style={{
            stroke: "#ef4444",
            strokeWidth: strokeWidth + 6,
            opacity: 0.25,
            filter: "blur(6px)",
          }}
          className="animate-pulse"
        />
      )}

      {/* Main trail */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isAlarmed ? "#ef4444" : style.color,
          strokeWidth,
          opacity,
          strokeDasharray: style.dash,
        }}
        className={isAlarmed ? "animate-pulse" : ""}
      />

      {/* Selection highlight */}
      {selected && (
        <BaseEdge
          id={`${id}-selected`}
          path={edgePath}
          style={{
            stroke: "#3b82f6",
            strokeWidth: strokeWidth + 4,
            opacity: 0.3,
          }}
        />
      )}

      {/* Label with trail stats */}
      <foreignObject
        x={labelX - 45}
        y={labelY - 14}
        width={90}
        height={28}
        className="pointer-events-none"
      >
        <div
          className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono"
          style={{
            backgroundColor: isAlarmed ? "rgba(239, 68, 68, 0.15)" : "rgba(15, 15, 20, 0.9)",
            border: `1px solid ${isAlarmed ? "rgba(239, 68, 68, 0.3)" : "rgba(30, 41, 59, 0.8)"}`,
          }}
        >
          {/* Trail strength */}
          <span style={{ color: isAlarmed ? "#ef4444" : style.color }}>
            {Math.round(trail)}
          </span>

          {/* Alarm indicator */}
          {alarm > 5 && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-red-400">{Math.round(alarm)}</span>
            </>
          )}

          {/* Success/fail ratio */}
          <span className="text-slate-500">|</span>
          <span className="text-green-400">+{completions}</span>
          {failures > 0 && (
            <span className="text-red-400">-{failures}</span>
          )}
        </div>
      </foreignObject>
    </>
  );
}

export default TaskTrailEdge;
