import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { LIFECYCLE_STAGES, type Persona, type Task } from './types'

interface Props {
  nextTask: Task | null
  currentStage: number
  persona: Persona
  readyCount: number
  onStart: (tid: string) => void
}

export function NextUpCard({ nextTask, currentStage, persona, readyCount, onStart }: Props) {
  const stage = LIFECYCLE_STAGES[Math.min(currentStage, LIFECYCLE_STAGES.length - 1)]
  const nextStage = LIFECYCLE_STAGES[Math.min(currentStage + 1, LIFECYCLE_STAGES.length - 1)]

  // If no tasks are ready, nudge the user toward the next lifecycle step.
  if (!nextTask) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[hsl(var(--color-tertiary-bright)/0.2)] bg-gradient-to-r from-[hsl(var(--color-tertiary-bright)/0.05)] via-transparent to-[hsl(var(--color-tertiary-bright)/0.05)] p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--color-tertiary-bright)/0.1)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[hsl(var(--color-tertiary-bright))]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[hsl(var(--color-tertiary-bright))]">All ready tasks are taken</p>
            <p className="text-xs text-foreground/40 mt-0.5">
              You're at{' '}
              <span className="text-foreground/70">
                stage {stage.index} · {stage.label}
              </span>
              {nextStage.index > stage.index && (
                <>
                  {' '}
                  — next up: <span className="text-[hsl(var(--color-tertiary-bright))]">{nextStage.label}</span>
                </>
              )}
              .
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layoutId="next-up"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[hsl(var(--color-gold)/0.25)] bg-gradient-to-r from-[hsl(var(--color-gold)/0.06)] via-[hsl(var(--color-gold)/0.02)] to-transparent p-5 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[hsl(var(--color-gold)/0.04)] blur-3xl" />

      <div className="relative flex items-center gap-4">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[9px] uppercase tracking-widest text-[hsl(var(--color-gold)/0.6)]">Stage</span>
          <span className="text-2xl font-bold text-[hsl(var(--color-gold))] tabular-nums leading-none">
            {stage.index}
          </span>
          <span className="text-[10px] text-[hsl(var(--color-gold)/0.6)]">{stage.label}</span>
        </div>

        <div className="w-px h-10 bg-[hsl(var(--color-gold)/0.15)]" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--color-gold)/0.6)]">
              Your next step
            </span>
            {readyCount > 1 && <span className="text-[10px] text-foreground/30">· {readyCount} ready tasks</span>}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{nextTask.name}</p>
          <p className="text-[11px] text-foreground/40 mt-0.5 font-mono truncate">
            {nextTask.tid}
            {persona === 'agent' && nextTask.assignee && <> · assigned to {nextTask.assignee}</>}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onStart(nextTask.tid)}
          className="bg-[hsl(var(--color-gold))] hover:opacity-90 text-background font-semibold gap-1.5 shrink-0"
        >
          Start
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}
