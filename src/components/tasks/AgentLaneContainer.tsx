import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { TaskWave } from '@/types/task'
import type { Task } from './types'

/**
 * AgentLaneContainer — the 2-D parallelism grid.
 *
 * Rows: waves (W1→W4 + no-wave). Same wave = tasks that CAN run in parallel.
 * Cols: agents (unique owner/assignee + "unassigned"). Same column = tasks that
 *       WILL serialize through that agent unless another agent is hired.
 *
 * A full column is a bottleneck (that agent is loaded). An empty column in a
 * wave row means the substrate has no routing learned for that wave yet —
 * likely candidate for CEO fan-out.
 *
 * Cells just show count + a click target; full task detail lives in the drawer.
 */

const WAVE_ORDER: Array<TaskWave | 'none'> = ['W1', 'W2', 'W3', 'W4', 'none']
const WAVE_META: Record<TaskWave | 'none', { label: string; color: string; hint: string }> = {
  W1: { label: 'W1 · Recon', color: '#67e8f9', hint: 'Haiku, parallel reads' },
  W2: { label: 'W2 · Decide', color: '#c084fc', hint: 'Opus, sharded decisions' },
  W3: { label: 'W3 · Edit', color: '#fbbf24', hint: 'Sonnet, one per file' },
  W4: { label: 'W4 · Verify', color: '#4ade80', hint: 'Sonnet, rubric shard' },
  none: { label: '—', color: '#94a3b8', hint: 'Unassigned wave' },
}

const UNASSIGNED = '—'

export function AgentLaneContainer({
  tasks,
  onCellClick,
}: {
  tasks: Task[]
  onCellClick?: (wave: TaskWave | 'none', agent: string) => void
}) {
  const { agents, grid } = useMemo(() => {
    const agentSet = new Set<string>()
    for (const t of tasks) {
      const a = t.assignee ?? t.owner ?? UNASSIGNED
      agentSet.add(a)
    }
    const agents = [...agentSet].sort((a, b) => {
      if (a === UNASSIGNED) return 1 // unassigned last
      if (b === UNASSIGNED) return -1
      return a.localeCompare(b)
    })

    const grid: Record<string, Task[]> = {}
    for (const t of tasks) {
      const wave = (t.task_wave ?? 'none') as TaskWave | 'none'
      const agent = t.assignee ?? t.owner ?? UNASSIGNED
      const key = `${wave}|${agent}`
      if (!grid[key]) grid[key] = []
      grid[key].push(t)
    }

    return { agents, grid }
  }, [tasks])

  const maxCell = Math.max(0, ...Object.values(grid).map((v) => v.length))

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="text-xs font-semibold text-white/70">Wave × Agent</span>
        <span className="text-[10px] text-white/30">rows run in parallel · columns queue per agent</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="sticky left-0 bg-[#0a0a0f] text-left px-3 py-2 font-semibold text-white/40">wave</th>
              {agents.map((a) => {
                const colLoad = WAVE_ORDER.reduce((sum, w) => sum + (grid[`${w}|${a}`]?.length ?? 0), 0)
                const isHot = colLoad > 0 && colLoad === maxCell * 2
                return (
                  <th
                    key={a}
                    className={cn(
                      'text-left px-3 py-2 font-mono font-normal text-[10px]',
                      isHot ? 'text-amber-300' : 'text-white/40',
                    )}
                    title={`${colLoad} total queued to this agent`}
                  >
                    {a === UNASSIGNED ? <span className="text-white/30">unassigned</span> : `@${a}`}
                    {isHot && <span className="ml-1 text-amber-400/70">⚡</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {WAVE_ORDER.map((wave) => {
              const meta = WAVE_META[wave]
              const rowTotal = agents.reduce((s, a) => s + (grid[`${wave}|${a}`]?.length ?? 0), 0)
              if (rowTotal === 0) return null
              return (
                <tr key={wave} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                  <th className="sticky left-0 bg-[#0a0a0f] text-left px-3 py-2 font-semibold" scope="row">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                      <span style={{ color: meta.color }}>{meta.label}</span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5 font-normal">{meta.hint}</p>
                  </th>
                  {agents.map((a) => {
                    const cell = grid[`${wave}|${a}`] ?? []
                    const count = cell.length
                    return (
                      <td
                        key={a}
                        className="px-3 py-2 align-top cursor-pointer"
                        onClick={() => count > 0 && onCellClick?.(wave, a)}
                      >
                        <Cell count={count} color={meta.color} max={maxCell} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Cell({ count, color, max }: { count: number; color: string; max: number }) {
  if (count === 0) {
    return <span className="text-white/10 text-[10px]">·</span>
  }
  const intensity = max > 0 ? count / max : 0
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 border"
        style={{
          background: `${color}${Math.min(Math.floor(intensity * 25) + 8, 33)
            .toString(16)
            .padStart(2, '0')}`,
          borderColor: `${color}40`,
        }}
      >
        <span className="font-mono tabular-nums text-[12px] font-semibold" style={{ color }}>
          {count}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
