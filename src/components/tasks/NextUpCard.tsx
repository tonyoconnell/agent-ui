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
        className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-300">All ready tasks are taken</p>
            <p className="text-xs text-white/40 mt-0.5">
              You're at{' '}
              <span className="text-white/70">
                stage {stage.index} · {stage.label}
              </span>
              {nextStage.index > stage.index && (
                <>
                  {' '}
                  — next up: <span className="text-emerald-400">{nextStage.label}</span>
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
      className="rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-400/[0.06] via-amber-400/[0.02] to-transparent p-5 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-400/[0.04] blur-3xl" />

      <div className="relative flex items-center gap-4">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[9px] uppercase tracking-widest text-amber-400/60">Stage</span>
          <span className="text-2xl font-bold text-amber-300 tabular-nums leading-none">{stage.index}</span>
          <span className="text-[10px] text-amber-300/60">{stage.label}</span>
        </div>

        <div className="w-px h-10 bg-amber-400/15" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase tracking-widest text-amber-400/60">Your next step</span>
            {readyCount > 1 && <span className="text-[10px] text-white/30">· {readyCount} ready tasks</span>}
          </div>
          <p className="text-sm font-semibold text-white truncate">{nextTask.name}</p>
          <p className="text-[11px] text-white/40 mt-0.5 font-mono truncate">
            {nextTask.tid}
            {persona === 'agent' && nextTask.assignee && <> · assigned to {nextTask.assignee}</>}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onStart(nextTask.tid)}
          className="bg-amber-400 hover:bg-amber-300 text-black font-semibold gap-1.5 shrink-0"
        >
          Start
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}
