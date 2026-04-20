import { useMemo } from 'react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { TaskRubric } from '@/types/task'
import { rubricAvg } from '@/types/task'

// ============================================================================
// Types
// ============================================================================

interface Props {
  rubric?: TaskRubric
  /** Optional threshold marker line at this value (e.g. 0.65 for cycle gate). */
  threshold?: number
  /** Optional: render smaller for card previews. */
  compact?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function passColor(rubric: TaskRubric | undefined, threshold: number): string {
  if (!rubric) return '#94a3b8'
  const allPass =
    rubric.fit >= threshold && rubric.form >= threshold && rubric.truth >= threshold && rubric.taste >= threshold
  if (allPass) return '#6ee7b7'
  const anyFail = [rubric.fit, rubric.form, rubric.truth, rubric.taste].some((v) => v < threshold)
  const allFail = [rubric.fit, rubric.form, rubric.truth, rubric.taste].every((v) => v < threshold)
  if (allFail) return '#f87171'
  if (anyFail) return '#fbbf24'
  return '#6ee7b7'
}

// ============================================================================
// Custom dot renderer — red dot on dims below threshold
// ============================================================================

interface DotProps {
  cx?: number
  cy?: number
  payload?: { dim: string; score: number }
  threshold: number
}

function CustomDot({ cx, cy, payload, threshold }: DotProps) {
  if (!payload || payload.score >= threshold) return null
  if (cx === undefined || cy === undefined) return null
  return <circle cx={cx} cy={cy} r={4} fill="#f87171" stroke="none" />
}

// ============================================================================
// Component
// ============================================================================

export function RubricRadar({ rubric, threshold = 0.65, compact = false }: Props) {
  const height = compact ? 160 : 220
  const fontSize = compact ? 11 : 13

  const data = useMemo(() => {
    if (!rubric) {
      return [
        { dim: 'FIT', score: 0, full: 1 },
        { dim: 'FORM', score: 0, full: 1 },
        { dim: 'TRUTH', score: 0, full: 1 },
        { dim: 'TASTE', score: 0, full: 1 },
      ]
    }
    return [
      { dim: 'FIT', score: rubric.fit, full: 1 },
      { dim: 'FORM', score: rubric.form, full: 1 },
      { dim: 'TRUTH', score: rubric.truth, full: 1 },
      { dim: 'TASTE', score: rubric.taste, full: 1 },
    ]
  }, [rubric])

  const thresholdData = useMemo(
    () => [
      { dim: 'FIT', score: threshold, full: 1 },
      { dim: 'FORM', score: threshold, full: 1 },
      { dim: 'TRUTH', score: threshold, full: 1 },
      { dim: 'TASTE', score: threshold, full: 1 },
    ],
    [threshold],
  )

  const avg = rubricAvg(rubric)
  const centerColor = passColor(rubric, threshold)
  const avgLabel = avg > 0 ? avg.toFixed(2) : '—'

  const ariaLabel = rubric
    ? `Rubric scores: fit ${rubric.fit.toFixed(2)}, form ${rubric.form.toFixed(2)}, truth ${rubric.truth.toFixed(2)}, taste ${rubric.taste.toFixed(2)}`
    : 'Rubric scores: not yet set'

  return (
    <div className="rounded-lg border border-[#252538] bg-[#0f0f18] p-3" role="img" aria-label={ariaLabel}>
      {!rubric && <p className="mb-1 text-center text-xs text-slate-500">Rubric set at W4 verify</p>}

      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <PolarGrid stroke="#252538" />

            <PolarAngleAxis
              dataKey="dim"
              tick={{
                fontSize,
                fill: '#94a3b8',
                fontFamily: 'ui-monospace, monospace',
              }}
            />

            <PolarRadiusAxis domain={[0, 1]} tickCount={5} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} />

            {/* Threshold marker - using data prop which Recharts accepts at runtime */}
            <Radar
              name="gate"
              dataKey="score"
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              {...({ data: thresholdData } as any)}
              stroke="#fbbf24"
              strokeWidth={1}
              strokeDasharray="4 3"
              fill="none"
              fillOpacity={0}
              dot={false}
              isAnimationActive={false}
            />

            {/* Score radar */}
            <Radar
              name="score"
              dataKey="score"
              stroke={rubric ? '#67e8f9' : '#334155'}
              strokeWidth={rubric ? 2 : 1}
              fill={rubric ? '#67e8f9' : '#334155'}
              fillOpacity={rubric ? 0.3 : 0.1}
              dot={
                rubric
                  ? (props: unknown) => {
                      const p = props as DotProps
                      return (
                        <CustomDot
                          key={`dot-${p.payload?.dim ?? ''}`}
                          cx={p.cx}
                          cy={p.cy}
                          payload={p.payload}
                          threshold={threshold}
                        />
                      )
                    }
                  : false
              }
              isAnimationActive={!compact}
            />

            {!compact && (
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f18',
                  border: '1px solid #252538',
                  borderRadius: '6px',
                  fontSize: 12,
                  color: '#e2e8f0',
                }}
                // @ts-expect-error Recharts formatter type mismatch
                formatter={(value: number) => [value.toFixed(2), 'score']}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ paddingTop: compact ? 12 : 16 }}
        >
          <span className="font-mono text-xs font-semibold" style={{ color: centerColor }}>
            {avgLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
