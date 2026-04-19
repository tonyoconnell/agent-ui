import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { LIFECYCLE_STAGES, type Persona } from './types'

const LANE_COLOR: Record<'onboard' | 'engage' | 'commerce', string> = {
  onboard: '#67e8f9',
  engage: '#fbbf24',
  commerce: '#c084fc',
}

export function LifecycleStepper({ currentStage, persona }: { currentStage: number; persona: Persona }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold text-white/60 tracking-wide">
            Your journey to first sale + first purchase
          </h3>
          <p className="text-[10px] text-white/25 mt-0.5">
            {persona === 'human' ? 'Human lane — agent-guided' : 'Agent lane — autonomous'} · Stage {currentStage} of 10
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <LegendDot color={LANE_COLOR.onboard} label="onboard" />
          <LegendDot color={LANE_COLOR.engage} label="engage" />
          <LegendDot color={LANE_COLOR.commerce} label="commerce" />
        </div>
      </div>

      <div className="relative grid grid-cols-11 gap-1">
        {/* progress rail */}
        <div className="absolute top-3 left-3 right-3 h-px bg-white/[0.06]" />
        <motion.div
          className="absolute top-3 left-3 h-px bg-gradient-to-r from-sky-400 via-amber-400 to-purple-400"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStage / 10) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ maxWidth: 'calc(100% - 1.5rem)' }}
        />

        {LIFECYCLE_STAGES.map((stage) => {
          const done = stage.index < currentStage
          const active = stage.index === currentStage
          const color = LANE_COLOR[stage.lane]

          return (
            <div key={stage.key} className="relative flex flex-col items-center">
              <motion.div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center relative z-10 font-mono text-[10px] font-bold border',
                  active && 'shadow-lg',
                  done ? 'text-white' : active ? 'text-white' : 'text-white/30',
                )}
                style={{
                  background: done ? color : active ? `${color}30` : '#0a0a0f',
                  borderColor: done ? color : active ? color : '#ffffff15',
                  boxShadow: active ? `0 0 16px ${color}60` : undefined,
                }}
                animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={active ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
              >
                {done ? '✓' : stage.index}
              </motion.div>
              <span
                className={cn(
                  'text-[9px] mt-1.5 font-medium tracking-wide truncate max-w-full',
                  active ? 'text-white/80' : done ? 'text-white/40' : 'text-white/20',
                )}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-white/30">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
