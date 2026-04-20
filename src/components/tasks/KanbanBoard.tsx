import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { COLUMNS, type ColumnKey, columnFor, statusForColumn, type Task } from './types'

interface Props {
  tasks: Task[]
  onMove: (tid: string, target: ColumnKey) => void
  onCardClick?: (tid: string) => void
}

export function KanbanBoard({ tasks, onMove, onCardClick }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columns = useMemo(() => {
    const map = new Map<ColumnKey, Task[]>(COLUMNS.map((c) => [c.id, []]))
    for (const t of tasks) {
      const key = columnFor(t.task_status, t.listed)
      map.get(key)?.push(t)
    }
    return map
  }, [tasks])

  const activeTask = activeId ? tasks.find((t) => t.tid === activeId) : null

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    if (!e.over) return

    const tid = String(e.active.id)
    const overId = String(e.over.id)

    // Drop can be a column id or another card's tid — resolve to a column.
    const directColumn = COLUMNS.find((c) => c.id === overId)
    let targetKey: ColumnKey | null = directColumn?.id ?? null
    if (!targetKey) {
      const overTask = tasks.find((t) => t.tid === overId)
      if (overTask) targetKey = columnFor(overTask.task_status, overTask.listed)
    }
    if (!targetKey) return

    // Guard: can't "complete" if blockers aren't complete.
    if (targetKey === 'done' || targetKey === 'listed') {
      const task = tasks.find((t) => t.tid === tid)
      if (task) {
        const blocked = task.blocked_by.some((bid) => {
          const b = tasks.find((t) => t.tid === bid)
          return b && b.task_status !== 'verified' && b.task_status !== 'done'
        })
        if (blocked) return
      }
    }

    const task = tasks.find((t) => t.tid === tid)
    if (!task) return
    const currentKey = columnFor(task.task_status, task.listed)
    if (currentKey === targetKey) return

    onMove(tid, targetKey)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={columns.get(col.id) ?? []}
            onCardClick={onCardClick}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeTask && (
          <div className="rotate-2 opacity-95">
            <TaskCard task={activeTask} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Re-export helpers that TaskBoard needs
export { statusForColumn }
