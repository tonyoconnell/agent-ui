import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import type { ColumnDef, Task } from './types'

interface Props {
  column: ColumnDef
  tasks: Task[]
  onCardClick?: (tid: string) => void
  activeId?: string | null
}

export function KanbanColumn({ column, tasks, onCardClick, activeId }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: column.color }} />
        <h3 className="text-xs font-semibold text-white/70 tracking-wide">{column.label}</h3>
        <motion.span
          key={tasks.length}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-[10px] font-mono text-white/30 tabular-nums"
        >
          {tasks.length}
        </motion.span>
      </div>

      {/* Drop zone */}
      <motion.div
        ref={setNodeRef}
        animate={{
          backgroundColor: isOver ? `${column.color}12` : 'transparent',
          borderColor: isOver ? `${column.color}40` : '#ffffff0d',
        }}
        className={cn('flex-1 min-h-[320px] rounded-lg border p-2 space-y-2')}
      >
        <SortableContext items={tasks.map((t) => t.tid)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task.tid} task={task} onClick={onCardClick} isDragging={activeId === task.tid} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && <EmptyColumn column={column} isOver={isOver} />}
      </motion.div>
    </div>
  )
}

function EmptyColumn({ column, isOver }: { column: ColumnDef; isOver: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOver ? 1 : 0.5 }}
      className="flex flex-col items-center justify-center h-40 text-center px-4"
    >
      <div
        className="w-10 h-10 rounded-full border border-dashed flex items-center justify-center mb-3"
        style={{ borderColor: `${column.color}40` }}
      >
        <motion.span
          animate={isOver ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, repeat: isOver ? Infinity : 0 }}
          className="text-lg"
          style={{ color: column.color }}
        >
          ↓
        </motion.span>
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed max-w-[180px]">{column.hint}</p>
    </motion.div>
  )
}
