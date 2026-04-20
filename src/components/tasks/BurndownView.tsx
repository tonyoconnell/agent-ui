/**
 * BurndownView — rubric trend + velocity chart for the task substrate.
 *
 * Two stacked sections:
 *  1. RUBRIC TREND  — four lines (fit/form/truth/taste) per cycle, gate at 0.65
 *  2. VELOCITY      — stacked bars: verified / failed / dissolved per cycle
 *
 * Pure presentation. useMemo for derived data. Lazy recharts per
 * DynamicChartRecharts pattern to avoid SSR issues.
 */

import { lazy, Suspense, useMemo } from 'react'
import type { Task } from '@/types/task'
import { parseTaskId } from '@/types/task'

// ---------------------------------------------------------------------------
// Lazy recharts imports — mirrors DynamicChartRecharts.tsx
// ---------------------------------------------------------------------------
const LineChart = lazy(() => import('recharts').then((m) => ({ default: m.LineChart })))
const BarChart = lazy(() => import('recharts').then((m) => ({ default: m.BarChart })))
const Line = lazy(() => import('recharts').then((m) => ({ default: m.Line })))
const Bar = lazy(() => import('recharts').then((m) => ({ default: m.Bar })))
const XAxis = lazy(() => import('recharts').then((m) => ({ default: m.XAxis })))
const YAxis = lazy(() => import('recharts').then((m) => ({ default: m.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then((m) => ({ default: m.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then((m) => ({ default: m.Tooltip })))
const Legend = lazy(() => import('recharts').then((m) => ({ default: m.Legend })))
const ReferenceLine = lazy(() => import('recharts').then((m) => ({ default: m.ReferenceLine })))
const ResponsiveContainer = lazy(() => import('recharts').then((m) => ({ default: m.ResponsiveContainer })))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLORS = {
  fit: '#67e8f9',
  form: '#c084fc',
  truth: '#6ee7b7',
  taste: '#fbbf24',
  verified: '#6ee7b7',
  failed: '#f87171',
  dissolved: '#64748b',
  gate: '#fbbf24',
} as const

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0f0f18',
    border: '1px solid #252538',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    color: '#e2e8f0',
  },
} as const

const TICK_STYLE = { fill: '#94a3b8', fontSize: 11 } as const
const GRID_PROPS = { stroke: '#252538', strokeDasharray: '2 2' } as const

// ---------------------------------------------------------------------------
// Derived data shapes
// ---------------------------------------------------------------------------

interface RubricPoint {
  cycle: string
  fit: number
  form: number
  truth: number
  taste: number
}

interface VelocityPoint {
  cycle: string
  verified: number
  failed: number
  dissolved: number
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  tasks: Task[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BurndownView({ tasks }: Props) {
  // --- Rubric trend data ---
  const rubricData = useMemo<RubricPoint[]>(() => {
    const byC = new Map<number, Task[]>()
    for (const t of tasks) {
      if (t.task_status !== 'verified' || !t.rubric) continue
      const { cycle } = parseTaskId(t.tid)
      if (cycle === null) continue
      const bucket = byC.get(cycle) ?? []
      bucket.push(t)
      byC.set(cycle, bucket)
    }
    return Array.from(byC.entries())
      .sort(([a], [b]) => a - b)
      .map(([cycle, ts]) => {
        const n = ts.length
        return {
          cycle: `C${cycle}`,
          fit: +(ts.reduce((s, t) => s + (t.rubric?.fit ?? 0), 0) / n).toFixed(3),
          form: +(ts.reduce((s, t) => s + (t.rubric?.form ?? 0), 0) / n).toFixed(3),
          truth: +(ts.reduce((s, t) => s + (t.rubric?.truth ?? 0), 0) / n).toFixed(3),
          taste: +(ts.reduce((s, t) => s + (t.rubric?.taste ?? 0), 0) / n).toFixed(3),
        }
      })
  }, [tasks])

  // --- Velocity data ---
  const velocityData = useMemo<VelocityPoint[]>(() => {
    const byC = new Map<number, { verified: number; failed: number; dissolved: number }>()

    for (const t of tasks) {
      const { cycle } = parseTaskId(t.tid)
      if (cycle === null) continue
      const bucket = byC.get(cycle) ?? { verified: 0, failed: 0, dissolved: 0 }
      if (t.task_status === 'verified') bucket.verified++
      else if (t.task_status === 'failed') bucket.failed++
      else if (t.task_status === 'dissolved') bucket.dissolved++
      byC.set(cycle, bucket)
    }

    return Array.from(byC.entries())
      .sort(([a], [b]) => a - b)
      .map(([cycle, counts]) => ({ cycle: `C${cycle}`, ...counts }))
  }, [tasks])

  const hasRubricData = rubricData.length > 0
  const hasVelocityData = velocityData.length > 0

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ----------------------------------------------------------------- */}
      {/* RUBRIC TREND                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-[#252538] bg-[#0f0f18] p-3">
        <h3 className="mb-2 text-sm font-medium text-slate-100">Rubric trend</h3>
        {hasRubricData ? (
          <Suspense fallback={<div className="h-[220px] animate-pulse rounded bg-[#1a1a24]" />}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rubricData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="cycle" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1]} tick={TICK_STYLE} axisLine={false} tickLine={false} tickCount={5} width={30} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '0.7rem', color: '#94a3b8' }} iconType="circle" iconSize={8} />
                <ReferenceLine
                  y={0.65}
                  stroke={COLORS.gate}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'gate', fill: COLORS.gate, fontSize: 10, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="fit"
                  stroke={COLORS.fit}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.fit }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="form"
                  stroke={COLORS.form}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.form }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="truth"
                  stroke={COLORS.truth}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.truth }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="taste"
                  stroke={COLORS.taste}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.taste }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Suspense>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
            Rubric data populates after cycle closes
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* VELOCITY                                                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="rounded-lg border border-[#252538] bg-[#0f0f18] p-3">
        <h3 className="mb-2 text-sm font-medium text-slate-100">Velocity</h3>
        {hasVelocityData ? (
          <Suspense fallback={<div className="h-[180px] animate-pulse rounded bg-[#1a1a24]" />}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={velocityData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} vertical={false} />
                <XAxis dataKey="cycle" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={TICK_STYLE} axisLine={false} tickLine={false} width={30} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '0.7rem', color: '#94a3b8' }} iconType="circle" iconSize={8} />
                <Bar dataKey="verified" stackId="v" fill={COLORS.verified} radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="v" fill={COLORS.failed} radius={[0, 0, 0, 0]} />
                <Bar dataKey="dissolved" stackId="v" fill={COLORS.dissolved} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">No velocity yet</div>
        )}
      </section>
    </div>
  )
}
