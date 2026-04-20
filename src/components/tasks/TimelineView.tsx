/**
 * TimelineView — cycle-horizontal × wave-vertical structural-time grid.
 *
 * Axes:
 *   Horizontal — cycles derived from parseTaskId(t.tid).cycle (C1, C2, … ∅)
 *   Vertical   — waves W1 → W2 → W3 → W4 → unwaved
 *
 * Not a Gantt chart. No calendar time. Structural time only.
 */

import { emitClick } from '@/lib/ui-signal'
import { parseTaskId } from '@/types/task'
import type { Task } from './types'
import { WAVES, type WaveKey, waveForTask } from './types'

type Props = {
  tasks: Task[]
  onSelect?: (tid: string) => void
}

/** Background color class for a task pill by status. */
function pillBg(status: Task['task_status']): string {
  switch (status) {
    case 'open':
      return 'bg-slate-700'
    case 'picked':
      return 'bg-blue-500/50'
    case 'done':
      return 'bg-amber-500/50'
    case 'verified':
      return 'bg-emerald-500/50'
    case 'failed':
      return 'bg-red-500/50'
    case 'blocked':
      return 'bg-gray-600 opacity-50'
    case 'dissolved':
      return 'bg-red-900/30 opacity-30'
    default:
      return 'bg-slate-700'
  }
}

/** Extra class for picked (pulse animation). */
function pillExtra(status: Task['task_status']): string {
  return status === 'picked' ? ' animate-pulse' : ''
}

/** Short breadcrumb label: role + index (e.g. "r1", "e5"). Falls back to last segment of tid. */
function pillLabel(tid: string): string {
  const { role, index } = parseTaskId(tid)
  if (role !== null && index !== null) return `${role}${index}`
  // Fall back to last segment
  const parts = tid.split(':')
  return parts[parts.length - 1] ?? tid
}

interface TaskPillProps {
  task: Task
  onSelect?: (tid: string) => void
}

function TaskPill({ task, onSelect }: TaskPillProps) {
  const label = pillLabel(task.tid)
  const bg = pillBg(task.task_status)
  const extra = pillExtra(task.task_status)
  const title = `${task.tid} · ${task.name} · ${task.task_status}`

  const handleClick = () => {
    emitClick('ui:tasks:timeline-select', { tid: task.tid })
    onSelect?.(task.tid)
  }

  return (
    <button
      type="button"
      title={title}
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded px-1.5 h-5 text-[10px] font-mono text-white cursor-pointer border border-white/10 hover:border-white/30 transition-colors${extra} ${bg}`}
      style={{ minWidth: '32px', maxWidth: '60px' }}
    >
      {label}
    </button>
  )
}

export function TimelineView({ tasks, onSelect }: Props) {
  if (tasks.length === 0) {
    return <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No tasks yet</div>
  }

  // ── 1. Build matrix: cycleKey → WaveKey → Task[] ─────────────────────────
  const matrix = new Map<string, Map<WaveKey, Task[]>>()

  for (const t of tasks) {
    const parsed = parseTaskId(t.tid)
    const cycleKey = parsed.cycle === null ? '∅' : `C${parsed.cycle}`
    const wave = waveForTask(t)

    if (!matrix.has(cycleKey)) matrix.set(cycleKey, new Map())
    const row = matrix.get(cycleKey)!
    if (!row.has(wave)) row.set(wave, [])
    row.get(wave)!.push(t)
  }

  // ── 2. Sort cycles numerically, null (∅) last ────────────────────────────
  const cycles = Array.from(matrix.keys()).sort((a, b) => {
    if (a === '∅') return 1
    if (b === '∅') return -1
    return Number(a.slice(1)) - Number(b.slice(1))
  })

  const colCount = cycles.length

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid min-w-full"
        style={{
          gridTemplateColumns: `80px repeat(${colCount}, minmax(100px, 1fr))`,
          gridTemplateRows: `32px repeat(5, 72px)`,
          gap: '1px',
          backgroundColor: '#252538',
        }}
      >
        {/* ── Header row ───────────────────────────────────────────────── */}

        {/* Top-left label cell */}
        <div className="flex items-center justify-center bg-[#0a0a0f] text-[10px] font-mono text-slate-500 px-2">
          Wave ×cycle
        </div>

        {/* Cycle header cells */}
        {cycles.map((c) => (
          <div
            key={c}
            className="flex items-center justify-center bg-[#0f0f18] text-xs font-mono text-slate-300 border-b border-[#252538]"
          >
            {c}
          </div>
        ))}

        {/* ── Wave rows (5 rows: W1/W2/W3/W4/unwaved) ─────────────────── */}
        {WAVES.map((wave) => (
          <>
            {/* Left label cell */}
            <div key={`label-${wave.key}`} className="flex items-center gap-2 px-3 bg-[#0a0a0f]">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: wave.color }} />
              <span className="text-[11px] font-medium text-slate-300 leading-tight">{wave.label}</span>
            </div>

            {/* Task cells per cycle */}
            {cycles.map((c) => {
              const cellTasks = matrix.get(c)?.get(wave.key) ?? []
              return (
                <div
                  key={`cell-${wave.key}-${c}`}
                  className="bg-[#0d0d16] flex flex-wrap content-start gap-1 p-1.5 overflow-hidden"
                >
                  {cellTasks.map((t) => (
                    <TaskPill key={t.tid} task={t} onSelect={onSelect} />
                  ))}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
