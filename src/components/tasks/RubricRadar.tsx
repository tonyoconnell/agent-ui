import { useMemo } from 'react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CodeRubric, TaskRubric } from '@/types/task'
import { codeRubricComposite, rubricAvg } from '@/types/task'

// ============================================================================
// Types
// ============================================================================

interface Props {
  /** Agent rubric (trade lifecycle VERIFY — fit/form/truth/taste). */
  rubric?: TaskRubric
  /** Code rubric (/do W4 — security/stability/simplicity/speed). Takes precedence when both provided. */
  code_rubric?: CodeRubric
  /** Optional threshold marker line at this value (e.g. 0.65 for cycle gate). */
  threshold?: number
  /** Optional: render smaller for card previews. */
  compact?: boolean
}

type DimEntry = { dim: string; score: number; full: 1 }

// ============================================================================
// Helpers
// ============================================================================

function passColor(scores: number[], threshold: number): string {
  if (!scores.length) return 'hsl(var(--color-muted-foreground))'
  const allPass = scores.every((v) => v >= threshold)
  const allFail = scores.every((v) => v < threshold)
  if (allPass) return 'hsl(var(--color-tertiary-bright))'
  if (allFail) return 'hsl(var(--color-destructive))'
  return 'hsl(var(--color-gold))'
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
  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--color-destructive))" stroke="none" />
}

// ============================================================================
// Component
// ============================================================================

export function RubricRadar({ rubric, code_rubric, threshold = 0.65, compact = false }: Props) {
  const height = compact ? 160 : 220
  const fontSize = compact ? 11 : 13

  // Code rubric takes precedence — it's the /do cycle quality signal
  const { data, scores, avgValue, ariaLabel } = useMemo((): {
    data: DimEntry[]
    scores: number[]
    avgValue: number
    ariaLabel: string
  } => {
    if (code_rubric) {
      const dims: DimEntry[] = [
        { dim: 'SEC', score: code_rubric.security, full: 1 },
        { dim: 'STA', score: code_rubric.stability, full: 1 },
        { dim: 'SIM', score: code_rubric.simplicity, full: 1 },
        { dim: 'SPD', score: code_rubric.speed, full: 1 },
      ]
      const composite = codeRubricComposite(code_rubric)
      return {
        data: dims,
        scores: dims.map((d) => d.score),
        avgValue: composite,
        ariaLabel: `Code rubric: security ${code_rubric.security.toFixed(2)}, stability ${code_rubric.stability.toFixed(2)}, simplicity ${code_rubric.simplicity.toFixed(2)}, speed ${code_rubric.speed.toFixed(2)}, composite ${composite.toFixed(2)}`,
      }
    }
    if (rubric) {
      const dims: DimEntry[] = [
        { dim: 'FIT', score: rubric.fit, full: 1 },
        { dim: 'FORM', score: rubric.form, full: 1 },
        { dim: 'TRUTH', score: rubric.truth, full: 1 },
        { dim: 'TASTE', score: rubric.taste, full: 1 },
      ]
      const avg = rubricAvg(rubric)
      return {
        data: dims,
        scores: dims.map((d) => d.score),
        avgValue: avg,
        ariaLabel: `Agent rubric: fit ${rubric.fit.toFixed(2)}, form ${rubric.form.toFixed(2)}, truth ${rubric.truth.toFixed(2)}, taste ${rubric.taste.toFixed(2)}`,
      }
    }
    const empty: DimEntry[] = [
      { dim: 'FIT', score: 0, full: 1 },
      { dim: 'FORM', score: 0, full: 1 },
      { dim: 'TRUTH', score: 0, full: 1 },
      { dim: 'TASTE', score: 0, full: 1 },
    ]
    return { data: empty, scores: [], avgValue: 0, ariaLabel: 'Rubric scores: not yet set' }
  }, [rubric, code_rubric])

  const thresholdData = useMemo(() => data.map((d) => ({ ...d, score: threshold })), [data, threshold])

  const centerColor = passColor(scores, threshold)
  const avgLabel = avgValue > 0 ? avgValue.toFixed(2) : '—'
  const hasData = !!(rubric || code_rubric)

  return (
    <div className="rounded-lg border border-border bg-card p-3" role="img" aria-label={ariaLabel}>
      {!hasData && <p className="mb-1 text-center text-xs text-muted-foreground">Rubric set at W4 verify</p>}

      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <PolarGrid stroke="hsl(var(--color-border))" />

            <PolarAngleAxis
              dataKey="dim"
              tick={{
                fontSize,
                fill: 'hsl(var(--color-muted-foreground))',
                fontFamily: 'ui-monospace, monospace',
              }}
            />

            <PolarRadiusAxis
              domain={[0, 1]}
              tickCount={5}
              tick={{ fontSize: 9, fill: 'hsl(var(--color-muted-foreground))' }}
              axisLine={false}
            />

            {/* Threshold marker - using data prop which Recharts accepts at runtime */}
            <Radar
              name="gate"
              dataKey="score"
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              {...({ data: thresholdData } as any)}
              stroke="hsl(var(--color-gold))"
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
              stroke={hasData ? 'hsl(var(--color-primary-bright))' : 'hsl(var(--color-muted-foreground))'}
              strokeWidth={hasData ? 2 : 1}
              fill={hasData ? 'hsl(var(--color-primary-bright))' : 'hsl(var(--color-muted-foreground))'}
              fillOpacity={hasData ? 0.3 : 0.1}
              dot={
                hasData
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
              isAnimationActive={!compact && hasData}
            />

            {!compact && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--color-card))',
                  border: '1px solid hsl(var(--color-border))',
                  borderRadius: '6px',
                  fontSize: 12,
                  color: 'hsl(var(--color-font))',
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
