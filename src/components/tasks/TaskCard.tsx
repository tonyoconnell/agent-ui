import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { priorityLabel } from '@/types/task'
import { ChainBadge } from './ChainBadge'
import type { Task } from './types'
import { WAVES } from './types'

function waveColorFor(w: string) {
  return WAVES.find((x) => x.key === w)?.color ?? 'hsl(var(--color-foreground) / 0.4)'
}

const PRIORITY_COLOR: Record<'P0' | 'P1' | 'P2' | 'P3', string> = {
  P0: 'bg-destructive',
  P1: 'bg-gold',
  P2: 'bg-primary-bright',
  P3: 'bg-foreground/40',
}

export function TaskCard({
  task,
  onClick,
  isDragging,
}: {
  task: Task
  onClick?: (tid: string) => void
  isDragging?: boolean
}) {
  const sortable = useSortable({ id: task.tid })

  const style = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  }

  const dragging = isDragging || sortable.isDragging

  return (
    <motion.div
      layout
      layoutId={`card-${task.tid}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: dragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      ref={sortable.setNodeRef}
      style={style}
      {...sortable.attributes}
      {...sortable.listeners}
      onClick={() => onClick?.(task.tid)}
      className={cn(
        'group relative rounded-lg border bg-muted/10 border-foreground/[0.08] p-3 cursor-grab active:cursor-grabbing select-none',
        'hover:border-foreground/15 hover:bg-muted/[0.15] transition-colors',
        dragging && 'ring-1 ring-[hsl(var(--color-gold))]/40 shadow-xl shadow-[hsl(var(--color-gold))]/10',
      )}
    >
      {/* priority stripe */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-0.5 rounded-r',
          PRIORITY_COLOR[priorityLabel(task.task_priority)],
        )}
      />

      <div className="pl-2">
        <div className="flex items-center gap-2 mb-1">
          {task.task_wave && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono"
              style={{ backgroundColor: `${waveColorFor(task.task_wave)}22`, color: waveColorFor(task.task_wave) }}
              title="Wave"
            >
              {task.task_wave}
            </span>
          )}
          <span className="text-[10px] font-mono text-foreground/35 truncate">{task.tid}</span>
          {task.blocked_by.length > 0 && (
            <span className="text-[9px] text-[hsl(var(--color-destructive))]/70">⚠ {task.blocked_by.length}</span>
          )}
        </div>

        <p className="text-[13px] leading-snug text-foreground/85 font-medium line-clamp-2">{task.name}</p>

        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-2.5 text-[10px]">
          {task.assignee && (
            <span className="inline-flex items-center gap-1 text-foreground/45">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-primary-bright))]/70" />
              {task.assignee}
            </span>
          )}
          {task.price && task.price > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[hsl(var(--color-tertiary-bright))]/70 font-mono">
              ${task.price.toFixed(4)}
            </span>
          )}
          {task.strength > 0 && (
            <span className="inline-flex items-center gap-1 text-[hsl(var(--color-secondary-bright))]/50">
              <span>↗</span>
              {task.strength.toFixed(0)}
            </span>
          )}
          <div className="flex-1" />
          {(task.task_status === 'verified' || task.task_status === 'done' || task.listed) && (
            <ChainBadge chain={task.chain} compact />
          )}
        </div>
      </div>
    </motion.div>
  )
}
