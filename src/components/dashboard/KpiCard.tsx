import { Card, CardContent } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface KpiCardProps {
  id: string
  label: string
  value: number | string
  unit?: string
  delta?: number
  sparkline?: number[]
  format?: 'number' | 'percent' | 'currency' | 'duration'
}

export function formatKpiValue(value: number | string, format?: KpiCardProps['format'], unit?: string): string {
  if (typeof value === 'string') return unit ? `${value}${unit}` : value
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'duration':
      return `${value}ms`
    default:
      return unit ? `${value.toLocaleString()}${unit}` : value.toLocaleString()
  }
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 32,
    h = 16
  const min = Math.min(...points),
    max = Math.max(...points)
  const range = max - min || 1
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map((v) => h - ((v - min) / range) * h)
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-xs text-zinc-500">—</span>
  const up = delta > 0
  const color = up ? 'text-emerald-400' : 'text-red-400'
  const arrow = up ? '↑' : '↓'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      {arrow}
      {Math.abs(delta).toFixed(1)}%
    </span>
  )
}

export function KpiCard({ id, label, value, unit, delta, sparkline, format }: KpiCardProps) {
  const formatted = formatKpiValue(value, format, unit)
  return (
    <Card
      className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer select-none"
      onClick={() => emitClick('ui:dashboard:card-click', { id })}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">{label}</span>
        <span className="text-2xl font-bold text-zinc-100 leading-none tabular-nums">{formatted}</span>
        <div className="flex items-center justify-between">
          <div>
            {delta !== undefined ? <DeltaPill delta={delta} /> : <span className="text-xs text-zinc-600">—</span>}
          </div>
          {sparkline && sparkline.length >= 2 && <Sparkline points={sparkline.slice(-32)} />}
        </div>
      </CardContent>
    </Card>
  )
}
