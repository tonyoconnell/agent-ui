// PheromoneEdge - Animated pheromone trail with strength-based styling

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { PheromoneEdgeData } from "@/engine/colony/types";
import { TRAIL_STYLES } from "@/engine/colony/types";

export function PheromoneEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<PheromoneEdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Default values if data is missing
  const trail = data?.trail ?? 50;
  const alarm = data?.alarm ?? 0;
  const status = data?.status ?? "fresh";
  const completions = data?.completions ?? 0;

  // Calculate visual properties
  const strokeWidth = Math.max(1, Math.min(10, trail / 10));
  const opacity = Math.max(0.2, Math.min(1, trail / 100));
  const isAlarmed = alarm > trail;

  // Get style based on status
  const style = TRAIL_STYLES[status];

  // Glow intensity based on completions
  const glowIntensity = Math.min(12, 4 + completions / 3);

  return (
    <>
      {/* Glow layer for proven trails */}
      {style.glow && !isAlarmed && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: style.color,
            strokeWidth: strokeWidth + 6,
            opacity: 0.15,
            filter: `blur(${glowIntensity}px)`,
          }}
        />
      )}

      {/* Alarm glow layer */}
      {isAlarmed && (
        <BaseEdge
          id={`${id}-alarm-glow`}
          path={edgePath}
          style={{
            stroke: "#ef4444",
            strokeWidth: strokeWidth + 4,
            opacity: 0.3,
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
          strokeDasharray: style.dashArray,
          transition: "stroke-width 0.3s ease, opacity 0.3s ease",
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

      {/* Trail strength label */}
      <EdgeLabel
        edgePath={edgePath}
        trail={trail}
        alarm={alarm}
        status={status}
        completions={completions}
      />
    </>
  );
}

// Edge label component showing trail stats
function EdgeLabel({
  edgePath,
  trail,
  alarm,
  status,
  completions,
}: {
  edgePath: string;
  trail: number;
  alarm: number;
  status: string;
  completions: number;
}) {
  // Parse the path to find the midpoint
  // This is a simplified approach - for production you might want path.getTotalLength()
  const isAlarmed = alarm > trail;

  return (
    <g>
      {/* Background pill */}
      <foreignObject
        width={80}
        height={24}
        x={0}
        y={0}
        className="overflow-visible"
        style={{
          transform: `translate(calc(50% - 40px), -12px)`,
        }}
      >
        <div
          className="flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
          style={{
            backgroundColor: isAlarmed ? "rgba(239, 68, 68, 0.2)" : "rgba(15, 15, 20, 0.9)",
            border: `1px solid ${isAlarmed ? "rgba(239, 68, 68, 0.4)" : "rgba(30, 41, 59, 1)"}`,
          }}
        >
          {/* Trail indicator */}
          <span style={{ color: isAlarmed ? "#ef4444" : TRAIL_STYLES[status as keyof typeof TRAIL_STYLES]?.color || "#64748b" }}>
            {Math.round(trail)}
          </span>
          {/* Alarm indicator if present */}
          {alarm > 0 && (
            <>
              <span className="text-slate-500">/</span>
              <span className="text-red-400">{Math.round(alarm)}</span>
            </>
          )}
          {/* Completions badge */}
          {completions > 0 && (
            <span className="text-green-400 ml-1">+{completions}</span>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

export default PheromoneEdge;
