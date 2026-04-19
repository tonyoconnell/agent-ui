import { Pause, Play, Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from './types'

const TICK_ORIGIN = (import.meta.env.PUBLIC_TASKS_ORIGIN as string | undefined) ?? ''
const DEFAULT_INTERVAL = 15_000
const PEEK_INTERVAL = 5_000

interface LoopTiming {
  interval: number
  lastAtMs: number
  nextAtMs: number
}

interface TickPeek {
  loopTimings?: Record<string, LoopTiming>
  lastRun?: string
}

/**
 * QueueBar — the routing pulse. Shows how many tasks are queued, in flight,
 * and just shipped. Toggle auto-route to keep firing /api/tick, so the
 * substrate's L1b orchestration picks ready tasks and hands them to agents
 * without a human clicking Start. Every tick surfaces a brief pulse so you
 * can see routing happen instead of guessing.
 */
export function QueueBar({ tasks, onRouted }: { tasks: Task[]; onRouted?: (tid: string) => void }) {
  const [auto, setAuto] = useState(false)
  const [lastTickAt, setLastTickAt] = useState<number | null>(null)
  const [tickPulse, setTickPulse] = useState<string | null>(null)
  const [tickResult, setTickResult] = useState<string | null>(null)
  const [inflight, setInflight] = useState(false)

  const ready = tasks.filter(
    (t) =>
      t.task_status === 'open' &&
      t.blocked_by.every((bid) => {
        const b = tasks.find((bt) => bt.tid === bid)
        return b?.task_status === 'verified' || b?.task_status === 'done'
      }),
  ).length
  const picked = tasks.filter((t) => t.task_status === 'picked').length
  const blocked = tasks.filter((t) => t.task_status === 'blocked').length
  const verified = tasks.filter((t) => t.task_status === 'verified' || t.task_status === 'done').length

  const runTick = useCallback(async () => {
    if (inflight) return
    setInflight(true)
    try {
      // interval=1 lets us force a tick each call; orchestrate if enabled
      const res = await fetch(`${TICK_ORIGIN}/api/tick?interval=1`)
      const data = (await res.json()) as {
        ticked?: boolean
        result?: { selected?: string }
        taskOrchestration?: { selected?: string; agent?: string; outcome?: string } | null
      }
      setLastTickAt(Date.now())
      const selected = data.taskOrchestration?.selected ?? data.result?.selected
      const outcome = data.taskOrchestration?.outcome
      if (selected) {
        setTickPulse(String(selected))
        setTickResult(outcome ?? 'routed')
        onRouted?.(String(selected))
      } else {
        setTickPulse(null)
        setTickResult(data.ticked ? 'tick' : 'idle')
      }
    } catch {
      setTickResult('offline')
    } finally {
      setInflight(false)
    }
  }, [inflight, onRouted])

  // Peek the tick loop state for the last-fired timestamp (always on).
  const peekRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    const peek = async () => {
      try {
        const res = await fetch(`${TICK_ORIGIN}/api/tick?peek=1`)
        const data = (await res.json()) as TickPeek
        const l1 = data.loopTimings?.l1
        if (l1 && l1.lastAtMs > 0) setLastTickAt(l1.lastAtMs)
      } catch {
        // quiet — peek is best-effort
      }
    }
    peek()
    peekRef.current = setInterval(peek, PEEK_INTERVAL)
    return () => {
      if (peekRef.current) clearInterval(peekRef.current)
    }
  }, [])

  // Auto-route: drive /api/tick on an interval.
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!auto) return
    runTick() // first shot immediately
    autoRef.current = setInterval(runTick, DEFAULT_INTERVAL)
    return () => {
      if (autoRef.current) clearInterval(autoRef.current)
    }
  }, [auto, runTick])

  const msSinceTick = lastTickAt ? Date.now() - lastTickAt : null
  const freshness =
    msSinceTick === null ? 'never' : msSinceTick < 30_000 ? 'live' : msSinceTick < 120_000 ? 'recent' : 'stale'

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3 flex items-center gap-5 flex-wrap">
      <div className="flex items-center gap-2">
        <Zap className={cn('w-4 h-4', auto ? 'text-amber-300' : 'text-white/30')} />
        <span className="text-xs font-semibold text-white/70">Routing</span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <Stat label="ready" value={ready} color="text-sky-300" tone="ready" />
        <Stat label="in flight" value={picked} color="text-amber-300" tone={picked > 0 ? 'active' : 'idle'} />
        <Stat label="blocked" value={blocked} color="text-red-400/80" />
        <Stat label="verified" value={verified} color="text-emerald-400" />
      </div>

      <div className="flex-1" />

      {/* freshness pill */}
      <span
        className={cn(
          'text-[10px] font-mono px-2 py-0.5 rounded-full border',
          freshness === 'live' && 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
          freshness === 'recent' && 'border-amber-400/25 bg-amber-400/5 text-amber-300',
          freshness === 'stale' && 'border-red-500/25 bg-red-500/5 text-red-300',
          freshness === 'never' && 'border-white/10 bg-white/[0.02] text-white/30',
        )}
      >
        {freshness === 'never' ? 'no ticks yet' : `last tick ${formatAge(msSinceTick)}`}
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={runTick}
          disabled={inflight}
          className="text-[11px] h-7 text-white/70 hover:text-white hover:bg-white/[0.06]"
        >
          {inflight ? 'Routing…' : 'Route now'}
        </Button>
        <Button
          size="sm"
          onClick={() => setAuto((v) => !v)}
          className={cn(
            'text-[11px] h-7 gap-1.5',
            auto ? 'bg-amber-400 hover:bg-amber-300 text-black' : 'bg-white/[0.06] hover:bg-white/[0.1] text-white',
          )}
        >
          {auto ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {auto ? 'Auto-route on' : 'Turn on auto-route'}
        </Button>
      </div>

      <AnimatePresence>
        {tickPulse && (
          <motion.div
            key={tickPulse + (lastTickAt ?? 0)}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="w-full flex items-center gap-2 text-[10px] text-amber-300/80 font-mono"
          >
            <span className="w-1 h-1 rounded-full bg-amber-300 animate-pulse" />
            routed · {tickPulse.slice(0, 48)}
            {tickResult && tickResult !== 'routed' && <span className="text-white/40">· {tickResult}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({
  label,
  value,
  color,
  tone,
}: {
  label: string
  value: number
  color: string
  tone?: 'ready' | 'active' | 'idle'
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-white/25">{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={cn('text-sm font-mono font-bold tabular-nums', color)}
      >
        {value}
      </motion.span>
      {tone === 'active' && value > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
    </span>
  )
}

function formatAge(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return 'just now'
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`
  return `${Math.floor(ms / 3_600_000)}h ago`
}
