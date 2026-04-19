/**
 * TaskBoard — lifecycle-aware kanban for humans and agents.
 *
 * Reads tasks from /api/tasks, mirrors status via WebSocket, writes via
 * PATCH /api/tasks/:id (or gateway). The drag-drop surface is dnd-kit with
 * motion-animated reflow. A lifecycle stepper at the top shows where the
 * viewer sits in the 10-stage arc (wallet → buy); cards show a chain badge
 * (testnet/mainnet) once settled on Sui.
 *
 * Data shape stays compatible with the existing `useTaskWebSocket` hook and
 * /api/tasks contract. New optional fields (listed/price/chain/assignee) are
 * derived from tags when present and rendered conditionally — no regression
 * when the substrate hasn't emitted them yet.
 */

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { KanbanBoard, statusForColumn } from '@/components/tasks/KanbanBoard'
import { LifecycleStepper } from '@/components/tasks/LifecycleStepper'
import { NextUpCard } from '@/components/tasks/NextUpCard'
import { PersonaNetworkToggle } from '@/components/tasks/PersonaNetworkToggle'
import { QueueBar } from '@/components/tasks/QueueBar'
import type { ChainState, ColumnKey, Network, Persona, Task } from '@/components/tasks/types'
import { WaveSwimLaneContainer } from '@/components/tasks/WaveSwimLaneContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskWebSocket } from '@/lib/use-task-websocket'
import { cn } from '@/lib/utils'
import { normalizeStatus, priorityFromLabel } from '@/types/task'

const TASKS_ORIGIN = (import.meta.env.PUBLIC_TASKS_ORIGIN as string | undefined) ?? ''
const GATEWAY_URL = (import.meta.env.PUBLIC_GATEWAY_URL as string | undefined) ?? ''
// Mainnet is gated until deploy (no real mainnet package yet)
const MAINNET_LIVE = (import.meta.env.PUBLIC_SUI_MAINNET_LIVE as string | undefined) === '1'

// ─── Task normalization ───────────────────────────────────────────────────

/**
 * Extract commerce + assignee hints from tags. The substrate currently encodes
 * ownership + listing state in tags until we add first-class columns upstream
 * (see TODO-governance.md). Tags are the convention pipeline.
 */
function enrichTask(raw: Record<string, unknown>, network: Network): Task {
  const tags = (raw.tags as string[]) || []
  const status = normalizeStatus((raw.task_status as string) ?? (raw.status as string))

  const prioTag = tags.find((tag) => /^P[0-3]$/.test(tag)) as 'P0' | 'P1' | 'P2' | 'P3' | undefined
  const task_priority =
    typeof raw.task_priority === 'number' ? (raw.task_priority as number) : prioTag ? priorityFromLabel(prioTag) : 0.5

  const assigneeTag = tags.find((t) => t.startsWith('owner:') || t.startsWith('agent:'))
  const assignee = assigneeTag?.split(':')[1] ?? (raw.owner as string | undefined)
  const priceTag = tags.find((t) => t.startsWith('price:'))
  const price = priceTag ? Number.parseFloat(priceTag.split(':')[1] ?? '0') : undefined
  const listed = tags.includes('listed')
  const txDigest = (raw.txDigest as string | undefined) ?? tags.find((t) => t.startsWith('tx:'))?.split(':')[1]
  const chain: ChainState | undefined =
    status === 'verified' || status === 'done' || listed
      ? { network: txDigest ? network : 'offchain', txDigest }
      : undefined

  return {
    tid: (raw.tid as string) ?? (raw.id as string),
    thing_type: 'task',
    name: raw.name as string,
    task_status: status,
    task_wave: (raw.task_wave as Task['task_wave']) ?? (raw.wave as Task['task_wave']) ?? null,
    task_priority,
    task_effort: (raw.task_effort as number) ?? 0.5,
    task_value: (raw.task_value as number) ?? 0.5,
    task_variant: (raw.task_variant as Task['task_variant']) ?? null,
    exit_condition: raw.exit_condition as string | undefined,
    rubric: raw.rubric as Task['rubric'],
    tags,
    blocks: (raw.blocks as string[]) || [],
    blocked_by: (raw.blocked_by as string[]) || (raw.blockedBy as string[]) || [],
    strength: (raw.strength as number) ?? (raw.trailPheromone as number) ?? 0,
    resistance: (raw.resistance as number) ?? (raw.alarmPheromone as number) ?? 0,
    started_at: raw.started_at as string | undefined,
    closed_at: raw.closed_at as string | undefined,
    verified_at: raw.verified_at as string | undefined,
    owner: raw.owner as string | undefined,
    assignee,
    price,
    listed,
    chain,
  }
}

// ─── Lifecycle stage inference ───────────────────────────────────────────

/**
 * Infer the user's current stage from task state:
 *   - anything complete + listed → stage 9 (sold once)
 *   - anything complete → stage 8 (converse, ready to list)
 *   - anything in_progress → stage 7 (message)
 *   - all todo → stage 6 (discover / pick work)
 *   - no tasks → stage 3 (joined board, waiting for team)
 */
function inferStage(tasks: Task[]): number {
  if (!tasks.length) return 3
  if (tasks.some((t) => t.listed && t.chain?.txDigest)) return 10
  if (tasks.some((t) => t.listed)) return 9
  if (tasks.some((t) => t.task_status === 'verified' || t.task_status === 'done')) return 8
  if (tasks.some((t) => t.task_status === 'picked')) return 7
  return 6
}

// ─── Stats bar ─────────────────────────────────────────────────────────

function StatsBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length
  const done = tasks.filter((t) => t.task_status === 'verified' || t.task_status === 'done').length
  const doing = tasks.filter((t) => t.task_status === 'picked').length
  const listed = tasks.filter((t) => t.listed).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex items-center gap-5 text-xs">
      <Chip label="total" value={total} color="text-white/60" />
      <Chip label="doing" value={doing} color="text-amber-300" />
      <Chip label="done" value={done} color="text-emerald-400" />
      <Chip label="listed" value={listed} color="text-purple-400" />
      <div className="flex items-center gap-2 ml-2">
        <div className="w-20 h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-emerald-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-[10px] font-mono text-emerald-400/70 tabular-nums w-8">{pct}%</span>
      </div>
    </div>
  )
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-white/25">{label}</span>
      <span className={cn('text-sm font-mono font-bold tabular-nums', color)}>{value}</span>
    </span>
  )
}

function LiveIndicator({
  ws,
  network,
}: {
  ws: { connected: boolean; polling: boolean; reconnectAttempt: number }
  network: Network
}) {
  const label = ws.connected ? 'live' : ws.polling ? 'polling' : ws.reconnectAttempt > 0 ? 'reconnecting' : 'offline'
  const color = ws.connected ? 'text-emerald-400' : ws.polling ? 'text-amber-400' : 'text-white/30'
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-mono', color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', ws.connected ? 'bg-emerald-400 animate-pulse' : 'bg-white/25')} />
      {label} · {network}
    </span>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="min-h-screen p-6 max-w-[1400px] mx-auto space-y-6">
      <Skeleton className="h-8 w-40 bg-white/[0.04]" />
      <Skeleton className="h-20 w-full bg-white/[0.04] rounded-xl" />
      <Skeleton className="h-24 w-full bg-white/[0.04] rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20 bg-white/[0.04]" />
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-20 w-full bg-white/[0.04] rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────

function EmptyBoard() {
  return (
    <div className="min-h-screen p-6 max-w-[1400px] mx-auto flex items-center justify-center">
      <Card className="bg-white/[0.02] border-white/[0.06] max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] mx-auto mb-4 flex items-center justify-center text-2xl">
            ✨
          </div>
          <p className="text-white/70 text-sm font-medium">No tasks yet</p>
          <p className="text-white/40 text-xs mt-2 leading-relaxed">
            Sync tasks from a plan with{' '}
            <code className="text-white/60 bg-white/[0.06] px-1.5 py-0.5 rounded">/sync todos</code> or{' '}
            <code className="text-white/60 bg-white/[0.06] px-1.5 py-0.5 rounded">bun run scripts/sync-todos.ts</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main board ─────────────────────────────────────────────────────

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [persona, setPersona] = useState<Persona>('human')
  const [network, setNetwork] = useState<Network>('testnet')
  const [groupBy, setGroupBy] = useState<'none' | 'wave'>('wave')

  // Fetch + normalize
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${TASKS_ORIGIN}/api/tasks`)
      const data = (await res.json()) as { tasks?: Array<Record<string, unknown>> }
      const rows = data.tasks ?? []
      setTasks(rows.map((r) => enrichTask(r, network)))
    } catch {
      // empty is fine — EmptyBoard handles
    } finally {
      setLoading(false)
    }
  }, [network])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const ws = useTaskWebSocket(setTasks)
  const deferredTasks = useDeferredValue(tasks)

  const currentStage = useMemo(() => inferStage(deferredTasks), [deferredTasks])

  // Find the top ready task to feature in NextUpCard
  const readyTasks = useMemo(
    () =>
      deferredTasks.filter(
        (t) =>
          t.task_status === 'open' &&
          t.blocked_by.every((bid) => {
            const b = deferredTasks.find((dt) => dt.tid === bid)
            return b?.task_status === 'verified' || b?.task_status === 'done'
          }),
      ),
    [deferredTasks],
  )

  const nextTask = readyTasks[0] ?? null

  // ─── Mutations ─────────────────────────────────────────────────

  const persistStatus = useCallback((tid: string, newStatus: Task['task_status']) => {
    const writeBase = GATEWAY_URL || `${TASKS_ORIGIN}/api`
    const path = GATEWAY_URL ? `/tasks/${tid}` : `/tasks/update/${tid}`
    fetch(`${writeBase}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {})
  }, [])

  const persistListed = useCallback((tid: string, listed: boolean) => {
    const writeBase = GATEWAY_URL || `${TASKS_ORIGIN}/api`
    fetch(`${writeBase}/tasks/${tid}/listed`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listed }),
    }).catch(() => {})
  }, [])

  const handleMove = useCallback(
    (tid: string, target: ColumnKey) => {
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.tid !== tid) return t
          if (target === 'listed') {
            return {
              ...t,
              task_status: 'verified' as const,
              listed: true,
              chain: { network, txDigest: undefined },
            }
          }
          return {
            ...t,
            task_status: statusForColumn(target),
            listed: false,
            chain: target === 'done' ? (t.chain ?? { network: 'offchain' as const }) : undefined,
          }
        })

        // Cascade unblock when moving into done
        if (target === 'done' || target === 'listed') {
          return updated.map((t) => {
            if (t.task_status !== 'blocked' || !t.blocked_by.includes(tid)) return t
            const allDone = t.blocked_by.every((bid) => {
              const b = updated.find((ut) => ut.tid === bid)
              return b?.task_status === 'verified' || b?.task_status === 'done'
            })
            return allDone ? { ...t, task_status: 'open' as const } : t
          })
        }

        return updated
      })

      const task = tasks.find((t) => t.tid === tid)
      if (target === 'listed') {
        persistListed(tid, true)
        if (task?.task_status !== 'verified') persistStatus(tid, 'verified')
      } else {
        if (task?.listed) persistListed(tid, false)
        persistStatus(tid, statusForColumn(target))
      }
    },
    [tasks, network, persistListed, persistStatus],
  )

  const handleStart = useCallback(
    (tid: string) => {
      handleMove(tid, 'doing')
    },
    [handleMove],
  )

  // ─── Render ─────────────────────────────────────────────────────

  if (loading) return <BoardSkeleton />
  if (tasks.length === 0) return <EmptyBoard />

  return (
    <div className="min-h-screen p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Tasks</h1>
          <p className="text-xs text-white/35 mt-0.5">
            Work flows left to right. Done tasks become sellable skills. Sales settle on-chain.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatsBar tasks={deferredTasks} />
          <PersonaNetworkToggle
            persona={persona}
            onPersonaChange={setPersona}
            network={network}
            onNetworkChange={setNetwork}
            mainnetDisabled={!MAINNET_LIVE}
          />
          <LiveIndicator ws={ws} network={network} />
          <div className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] p-0.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setGroupBy('none')}
              className={cn(
                'rounded px-2 py-0.5 transition-colors',
                groupBy === 'none' ? 'bg-white/[0.10] text-white/80' : 'text-white/35 hover:text-white/55',
              )}
            >
              flat
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('wave')}
              className={cn(
                'rounded px-2 py-0.5 transition-colors',
                groupBy === 'wave' ? 'bg-white/[0.10] text-white/80' : 'text-white/35 hover:text-white/55',
              )}
            >
              wave
            </button>
          </div>
        </div>
      </header>

      {/* Lifecycle stepper */}
      <motion.div layout className="mb-5">
        <LifecycleStepper currentStage={currentStage} persona={persona} />
      </motion.div>

      {/* Queue status + routing controls */}
      <motion.div layout className="mb-5">
        <QueueBar tasks={deferredTasks} />
      </motion.div>

      {/* Next-up guidance */}
      <AnimatePresence mode="wait">
        <motion.div key={nextTask?.tid ?? 'empty'} layout className="mb-6">
          <NextUpCard
            nextTask={nextTask}
            currentStage={currentStage}
            persona={persona}
            readyCount={readyTasks.length}
            onStart={handleStart}
          />
        </motion.div>
      </AnimatePresence>

      {/* Kanban board */}
      {groupBy === 'wave' ? (
        <WaveSwimLaneContainer tasks={deferredTasks} onMove={handleMove} />
      ) : (
        <KanbanBoard tasks={deferredTasks} onMove={handleMove} />
      )}

      {/* Footer hint */}
      <p className="mt-6 text-center text-[10px] text-white/25">
        Tip: drag tasks between columns · press{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[10px] text-white/60">Space</kbd> to pick
        up a focused card with the keyboard · listed tasks show on the marketplace.
      </p>
    </div>
  )
}
