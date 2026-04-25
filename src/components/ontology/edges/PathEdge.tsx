import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'
import { emitClick } from '@/lib/ui-signal'

export interface PathEdgeData {
  strength: number
  resistance: number
  traversals?: number
  signals?: number
  scope?: 'private' | 'group' | 'public'
}

export function PathEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  source,
  target,
}: EdgeProps<{ data: PathEdgeData }>) {
  const strength = data?.strength ?? 0
  const resistance = data?.resistance ?? 0
  const signals = data?.signals ?? 0

  const strokeWidth = Math.min(8, Math.max(1, Math.log(strength + 1) * 2))
  const isToxic = resistance > strength * 2 && resistance >= 10
  const stroke = isToxic ? '#ef4444' : resistance > strength ? '#fb923c' : '#f59e0b'

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Up to 3 animated signal dots when signals > 0
  const dotCount = Math.min(3, signals)
  // Stagger each dot's animation by 1/dotCount of the cycle
  const dots =
    dotCount > 0
      ? Array.from({ length: dotCount }, (_, i) => ({
          key: `${id}-dot-${i}`,
          begin: dotCount > 1 ? `${-(i / dotCount) * 2}s` : '0s',
        }))
      : []

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth,
          cursor: 'pointer',
        }}
        onClick={() =>
          emitClick('ui:ontology:edge-click', {
            from: source,
            to: target,
            strength,
            resistance,
          })
        }
      />

      {/* Animated signal dots moving along the path */}
      {dots.length > 0 && (
        <g pointerEvents="none">
          {dots.map(({ key, begin }) => (
            <circle key={key} r={4} fill="#fbbf24">
              <animateMotion dur="2s" repeatCount="indefinite" begin={begin}>
                <mpath href={`#${id}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
      )}

      {/* Strength/resistance label — only when edge is selected */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#94a3b8', // slate-400
              background: '#161622',
              border: '1px solid #252538',
              borderRadius: 4,
              padding: '1px 4px',
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {strength}→{resistance}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
