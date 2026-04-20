import { KanbanBoard } from './KanbanBoard'
import type { ColumnKey, Task } from './types'
import { WAVES, type WaveKey, waveForTask } from './types'

type Props = {
  tasks: Task[]
  onMove: (tid: string, targetColumn: ColumnKey) => void
  onSelect?: (tid: string) => void
}

/**
 * Renders tasks in horizontal swim-lanes by wave (W1..W4 + unwaved),
 * each lane containing the existing 4-column Kanban. Waves with zero
 * tasks collapse to a 1-line header.
 */
export function WaveSwimLaneContainer({ tasks, onMove, onSelect }: Props) {
  // Group tasks by wave
  const byWave = new Map<WaveKey, Task[]>()
  for (const w of WAVES) byWave.set(w.key, [])
  for (const t of tasks) {
    const key = waveForTask(t)
    const list = byWave.get(key)
    if (list) list.push(t)
  }

  return (
    <div className="flex flex-col gap-6">
      {WAVES.map((wave) => {
        const laneTasks = byWave.get(wave.key) ?? []
        const collapsed = laneTasks.length === 0 && wave.key !== 'unwaved'
        return (
          <section key={wave.key} className="rounded-lg border border-[#252538] bg-[#0f0f18]">
            <header
              className="flex items-center justify-between px-4 py-2"
              style={{ borderBottom: collapsed ? 'none' : `1px solid ${wave.color}22` }}
            >
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: wave.color }} />
                <h3 className="text-sm font-medium text-slate-100">{wave.label}</h3>
                <span className="text-xs text-slate-400">{wave.hint}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{laneTasks.length}</span>
            </header>
            {!collapsed && (
              <div className="p-3">
                <KanbanBoard tasks={laneTasks} onMove={onMove} onCardClick={onSelect} />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
