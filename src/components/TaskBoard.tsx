/**
 * TaskBoard — Live task visualization with realtime DB connection
 *
 * Shows: phase timeline, active task spotlight, dependency chains,
 * pheromone trails, and task flow (planned → active → complete).
 *
 * Data: fetches from /api/tasks on mount, live updates via WebSocket.
 * No hardcoded data — everything comes from the task store / TypeDB.
 */

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskWebSocket } from '@/lib/use-task-websocket'
import { cn } from '@/lib/utils'

// Task read origin — where to fetch the task list
const TASKS_ORIGIN = (import.meta.env.PUBLIC_TASKS_ORIGIN as string | undefined) ?? ''
// Task write origin — gateway for D1 writes + instant WS broadcast.
// Dev: empty (same-origin, local store). Prod: gateway URL (D1 + WsHub DO).
const GATEWAY_URL = (import.meta.env.PUBLIC_GATEWAY_URL as string | undefined) ?? ''

// ─── Types (aligned with tasks-store.ts + WS hook contract) ────────────────

interface Task {
  tid: string
  name: string
  status: 'todo' | 'in_progress' | 'complete' | 'blocked' | 'failed'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  phase: string
  tags: string[]
  trailPheromone: number
  alarmPheromone: number
  blockedBy: string[]
  blocks: string[]
}

interface Phase {
  id: string
  name: string
  tasks: Task[]
  complete: number
  total: number
}

// ─── Phase Configuration ───────────────────────────────────────────────────
// API returns C1–C7 phases. Map to display labels + colors.

const PHASE_ORDER = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']

const PHASE_META: Record<string, { label: string; color: string; glow: string }> = {
  C1: { label: 'Tighten', color: '#6ee7b7', glow: 'rgba(110,231,183,0.3)' },
  C2: { label: 'Wire', color: '#67e8f9', glow: 'rgba(103,232,249,0.3)' },
  C3: { label: 'Tasks', color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  C4: { label: 'Onboard', color: '#4ade80', glow: 'rgba(74,222,128,0.3)' },
  C5: { label: 'Commerce', color: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
  C6: { label: 'Intelligence', color: '#f472b6', glow: 'rgba(244,114,182,0.3)' },
  C7: { label: 'Scale', color: '#f87171', glow: 'rgba(248,113,113,0.3)' },
}
const PHASE_META_DEFAULT = { label: 'Unknown', color: '#94a3b8', glow: 'rgba(148,163,184,0.3)' }
const getPhaseMeta = (phase: string) => PHASE_META[phase] ?? PHASE_META_DEFAULT

const PRIORITY_COLORS: Record<string, string> = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#6b7280' }

// ─── Phase Timeline ────────────────────────────────────────────────────────

function PhaseTimeline({ phases, activePhase }: { phases: Phase[]; activePhase: string }) {
  return (
    <div className="flex items-center gap-1 px-2">
      {phases.map((phase, i) => {
        const meta = getPhaseMeta(phase.id)
        const pct = phase.total > 0 ? (phase.complete / phase.total) * 100 : 0
        const isActive = phase.id === activePhase
        const isDone = pct === 100

        return (
          <div key={phase.id} className="flex items-center gap-1 flex-1">
            <div className="flex-1 group relative">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[11px] font-semibold tracking-wide"
                  style={{ color: isActive ? meta.color : isDone ? `${meta.color}99` : '#ffffff30' }}
                >
                  {meta.label}
                </span>
                <span className="text-[10px] font-mono" style={{ color: isActive ? meta.color : '#ffffff20' }}>
                  {phase.complete}/{phase.total}
                </span>
              </div>

              <div className="relative h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${meta.color}40, ${meta.color})`,
                    boxShadow: isActive ? `0 0 12px ${meta.glow}` : 'none',
                  }}
                />
                {isActive && pct < 100 && (
                  <div
                    className="absolute top-0 h-full w-8 rounded-full animate-pulse"
                    style={{
                      left: `${pct}%`,
                      background: `radial-gradient(circle, ${meta.color}60 0%, transparent 70%)`,
                    }}
                  />
                )}
              </div>
            </div>

            {i < phases.length - 1 && (
              <div className="w-4 h-px mt-4" style={{ background: isDone ? `${meta.color}40` : '#ffffff08' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Active Task Spotlight ─────────────────────────────────────────────────

function ActiveSpotlight({ task, allTasks }: { task: Task; allTasks: Task[] }) {
  const meta = getPhaseMeta(task.phase)
  const blockers = allTasks.filter((t) => task.blockedBy.includes(t.tid))
  const unblocks = allTasks.filter((t) => task.blocks.includes(t.tid))

  return (
    <div className="relative my-6">
      <div
        className="absolute inset-0 rounded-2xl blur-3xl opacity-20 animate-pulse"
        style={{ background: meta.glow }}
      />

      <div className="relative flex items-stretch gap-4">
        {/* Blockers (left) */}
        <div className="flex-1 flex flex-col items-end justify-center gap-2 min-w-0">
          {blockers.length > 0 && (
            <span className="text-[10px] text-white/20 uppercase tracking-widest mb-1">blocked by</span>
          )}
          {blockers.map((b) => (
            <MiniCard key={b.tid} task={b} align="right" />
          ))}
        </div>

        {/* Connector left */}
        {blockers.length > 0 && (
          <div className="flex items-center">
            <div className="w-8 flex items-center">
              <div
                className="h-px flex-1"
                style={{ background: `linear-gradient(90deg, transparent, ${meta.color}40)` }}
              />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${meta.color}60` }} />
            </div>
          </div>
        )}

        {/* Center spotlight card */}
        <Card
          className="shrink-0 w-72 border-2 relative overflow-hidden bg-transparent"
          style={{
            borderColor: `${meta.color}50`,
            background: `linear-gradient(135deg, ${meta.color}08 0%, transparent 50%, ${meta.color}05 100%)`,
            boxShadow: `0 0 40px ${meta.glow}, inset 0 1px 0 ${meta.color}15`,
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0"
                style={{ borderColor: `${meta.color}40`, color: meta.color }}
              >
                {task.tid}
              </Badge>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: `${meta.color}aa` }}
              >
                {meta.label}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-2">{task.name}</h3>

            <div className="flex items-center gap-3 mt-3">
              <StatusBadge status={task.status} />
              <PriorityDot priority={task.priority} />
            </div>

            {(task.trailPheromone > 0 || task.alarmPheromone > 0) && (
              <div className="mt-4 space-y-1.5">
                <PheromoneBar value={task.trailPheromone} type="trail" color={meta.color} />
                {task.alarmPheromone > 0 && <PheromoneBar value={task.alarmPheromone} type="alarm" color="#ef4444" />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connector right */}
        {unblocks.length > 0 && (
          <div className="flex items-center">
            <div className="w-8 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${meta.color}60` }} />
              <div
                className="h-px flex-1"
                style={{ background: `linear-gradient(90deg, ${meta.color}40, transparent)` }}
              />
            </div>
          </div>
        )}

        {/* Unblocks (right) */}
        <div className="flex-1 flex flex-col items-start justify-center gap-2 min-w-0">
          {unblocks.length > 0 && (
            <span className="text-[10px] text-white/20 uppercase tracking-widest mb-1">unblocks</span>
          )}
          {unblocks.map((u) => (
            <MiniCard key={u.tid} task={u} align="left" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MiniCard({ task, align }: { task: Task; align: 'left' | 'right' }) {
  const meta = getPhaseMeta(task.phase)
  const isDone = task.status === 'complete'

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border max-w-[200px]',
        isDone ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-white/[0.03] border-white/8',
      )}
    >
      {align === 'right' && isDone && <span className="text-emerald-400 text-xs">&#10003;</span>}
      <div className={align === 'right' ? 'text-right' : ''}>
        <span className="text-[10px] font-mono block" style={{ color: `${meta.color}80` }}>
          {task.tid}
        </span>
        <span className={cn('text-xs line-clamp-1', isDone ? 'text-emerald-400' : 'text-white/50')}>{task.name}</span>
      </div>
      {align === 'left' && task.status === 'todo' && <span className="text-white/15 text-[10px]">&#9679;</span>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; className: string }> = {
    complete: { text: 'COMPLETE', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    in_progress: { text: 'ACTIVE', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse' },
    todo: { text: 'PLANNED', className: 'bg-white/5 text-white/40 border-white/10' },
    blocked: { text: 'BLOCKED', className: 'bg-white/[0.03] text-white/20 border-white/5' },
    failed: { text: 'FAILED', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  }
  const c = config[status] || config.todo
  return (
    <Badge variant="outline" className={cn('text-[10px] font-bold tracking-wider', c.className)}>
      {c.text}
    </Badge>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[priority] || '#6b7280' }} />
      <span className="text-[10px] text-white/30">{priority}</span>
    </div>
  )
}

function PheromoneBar({ value, type, color }: { value: number; type: 'trail' | 'alarm'; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-wider w-8" style={{ color: `${color}60` }}>
        {type === 'trail' ? 'trail' : 'alarm'}
      </span>
      <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(value, 100)}%`,
            background: `linear-gradient(90deg, ${color}30, ${color})`,
            boxShadow: value > 50 ? `0 0 8px ${color}40` : 'none',
          }}
        />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color: `${color}80` }}>
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// ─── Task Flow Grid (3-column kanban with drag-drop) ───────────────────────

type ColumnKey = 'planned' | 'active' | 'complete'

function TaskFlowGrid({
  tasks,
  activeId,
  onSelect,
  onStatusChange,
}: {
  tasks: Task[]
  activeId: string
  onSelect: (tid: string) => void
  onStatusChange: (tid: string, newStatus: Task['status']) => void
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null)
  const [rejectedId, setRejectedId] = useState<string | null>(null)

  const planned = tasks.filter((t) => t.status === 'todo' || t.status === 'blocked')
  const active = tasks.filter((t) => t.status === 'in_progress')
  const done = tasks.filter((t) => t.status === 'complete' || t.status === 'failed')

  const canComplete = (tid: string): boolean => {
    const task = tasks.find((t) => t.tid === tid)
    if (!task) return false
    return task.blockedBy.every((blockerId) => {
      const blocker = tasks.find((t) => t.tid === blockerId)
      return blocker?.status === 'complete'
    })
  }

  const handleDrop = (column: ColumnKey) => {
    if (!draggedId) return
    if (column === 'complete' && !canComplete(draggedId)) {
      setRejectedId(draggedId)
      setTimeout(() => setRejectedId(null), 600)
      setDraggedId(null)
      setDragOverColumn(null)
      return
    }
    const statusMap: Record<ColumnKey, Task['status']> = {
      planned: 'todo',
      active: 'in_progress',
      complete: 'complete',
    }
    onStatusChange(draggedId, statusMap[column])
    setDraggedId(null)
    setDragOverColumn(null)
  }

  const columnProps = (key: ColumnKey) => ({
    activeId,
    onSelect,
    column: key,
    draggedId,
    rejectedId,
    isDragOver: dragOverColumn === key,
    onDragStart: setDraggedId,
    onDragEnd: () => {
      setDraggedId(null)
      setDragOverColumn(null)
    },
    onDragOver: () => setDragOverColumn(key),
    onDragLeave: () => setDragOverColumn(null),
    onDrop: () => handleDrop(key),
  })

  return (
    <div className="grid grid-cols-3 gap-6 mt-4">
      <FlowColumn
        label="Planned"
        count={planned.length}
        color="#ffffff20"
        tasks={planned}
        {...columnProps('planned')}
      />
      <FlowColumn label="Active" count={active.length} color="#fbbf24" tasks={active} {...columnProps('active')} />
      <FlowColumn label="Complete" count={done.length} color="#4ade80" tasks={done} {...columnProps('complete')} />
    </div>
  )
}

function FlowColumn({
  label,
  count,
  color,
  tasks,
  activeId,
  onSelect,
  column,
  draggedId,
  rejectedId,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label: string
  count: number
  color: string
  tasks: Task[]
  activeId: string
  onSelect: (tid: string) => void
  column: ColumnKey
  draggedId: string | null
  rejectedId: string | null
  isDragOver: boolean
  onDragStart: (tid: string) => void
  onDragEnd: () => void
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: () => void
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
      className={cn(
        'min-h-[200px] rounded-lg p-2 transition-all duration-200',
        isDragOver && 'bg-white/[0.04] ring-1 ring-white/10',
      )}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold text-white/50">{label}</span>
        <span className="text-[10px] text-white/20">({count})</span>
      </div>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.tid}
            task={task}
            isActive={task.tid === activeId}
            onSelect={onSelect}
            isDragging={task.tid === draggedId}
            isRejected={task.tid === rejectedId}
            onDragStart={() => onDragStart(task.tid)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  isActive,
  onSelect,
  isDragging,
  isRejected,
  onDragStart,
  onDragEnd,
}: {
  task: Task
  isActive: boolean
  onSelect: (tid: string) => void
  isDragging?: boolean
  isRejected?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const meta = getPhaseMeta(task.phase)
  const statusClasses: Record<string, string> = {
    complete: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400',
    in_progress: 'bg-amber-500/10 border-amber-400/40 text-amber-300',
    todo: 'bg-white/[0.03] border-white/8 text-white/50',
    blocked: 'bg-white/[0.02] border-white/5 text-white/25',
    failed: 'bg-red-500/8 border-red-500/20 text-red-400',
  }
  const cls = statusClasses[task.status] || statusClasses.todo

  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.()
      }}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(task.tid)}
      className={cn(
        'w-full text-left rounded-lg border px-3 py-2 transition-all duration-200 cursor-grab active:cursor-grabbing',
        cls,
        isActive && 'ring-1 ring-amber-400/30 scale-[1.02]',
        isDragging && 'opacity-50 scale-95',
        isRejected && 'animate-shake ring-2 ring-red-500/50',
      )}
      style={isActive ? { boxShadow: `0 0 20px ${meta.glow}` } : undefined}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-1 h-6 rounded-full shrink-0"
          style={{
            background: meta.color + (task.status === 'complete' ? '40' : task.status === 'blocked' ? '15' : '80'),
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono" style={{ color: `${meta.color}70` }}>
              {task.tid}
            </span>
            <span className="text-xs truncate">{task.name}</span>
          </div>
          {task.trailPheromone > 0 && (
            <div className="mt-1 h-0.5 rounded-full bg-white/[0.03] overflow-hidden" style={{ maxWidth: '100%' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(task.trailPheromone, 100)}%`,
                  background: task.trailPheromone >= 50 ? meta.color : `${meta.color}60`,
                }}
              />
            </div>
          )}
        </div>
        {task.status === 'complete' && <span className="text-emerald-500/60 text-xs shrink-0">&#10003;</span>}
        {task.status === 'in_progress' && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
        )}
        {task.status === 'blocked' && <span className="text-white/10 text-[10px] shrink-0">blocked</span>}
        {task.status === 'failed' && <span className="text-red-400/60 text-xs shrink-0">&#10007;</span>}
      </div>
    </button>
  )
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────

function StatsBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length
  const complete = tasks.filter((t) => t.status === 'complete').length
  const active = tasks.filter((t) => t.status === 'in_progress').length
  const ready = tasks.filter(
    (t) => t.status === 'todo' && t.blockedBy.every((b) => tasks.find((bt) => bt.tid === b)?.status === 'complete'),
  ).length
  const highways = tasks.filter((t) => t.trailPheromone >= 50).length
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardContent className="flex items-center gap-5 px-4 py-2.5">
        <StatChip label="total" value={total} color="#ffffff60" />
        <StatChip label="complete" value={complete} color="#4ade80" />
        <StatChip label="active" value={active} color="#fbbf24" />
        <StatChip label="ready" value={ready} color="#67e8f9" />
        <StatChip label="highways" value={highways} color="#c084fc" />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Progress value={pct} className="w-24 h-1.5 bg-white/[0.04]" />
          <span className="text-xs font-mono text-emerald-400/70">{pct}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/25 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-mono font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

// ─── Highways Panel ────────────────────────────────────────────────────────

function HighwaysPanel({
  highways,
}: {
  highways: Array<{ from: string; to: string; strength: number; resistance: number }>
}) {
  const sorted = useMemo(
    () => [...highways].sort((a, b) => b.strength - b.resistance - (a.strength - a.resistance)).slice(0, 12),
    [highways],
  )

  const maxStrength = sorted.length > 0 ? Math.max(...sorted.map((h) => h.strength)) : 0

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              sorted.length > 0 ? 'bg-purple-400 animate-pulse' : 'bg-purple-400/50',
            )}
          />
          <CardTitle className="text-xs font-semibold text-white/50">Live Highways</CardTitle>
          {sorted.length > 0 && <span className="text-[10px] text-white/20 ml-auto">{highways.length} total</span>}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {sorted.length === 0 ? (
          <p className="text-[10px] text-white/20 text-center py-8">No highways yet — strength builds from signals</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((h, i) => {
              const weight = h.strength - h.resistance
              const pct = maxStrength > 0 ? (h.strength / maxStrength) * 100 : 0
              const isProven = h.strength >= 50 && h.resistance < 10
              const isToxic = h.resistance >= 10 && h.resistance > h.strength * 2

              return (
                <div
                  key={`${h.from}-${h.to}-${i}`}
                  className={cn(
                    'rounded-lg border px-3 py-2 transition-all duration-500',
                    isToxic
                      ? 'border-red-500/20 bg-red-500/5'
                      : isProven
                        ? 'border-purple-500/30 bg-purple-500/5'
                        : 'border-white/[0.06] bg-white/[0.02]',
                  )}
                >
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className={cn('font-mono truncate', isProven ? 'text-purple-300' : 'text-white/40')}>
                      {h.from.split(':').pop()}
                    </span>
                    <span className="text-white/15">&rarr;</span>
                    <span className={cn('font-mono truncate', isProven ? 'text-purple-300' : 'text-white/40')}>
                      {h.to.split(':').pop()}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isToxic
                            ? 'linear-gradient(90deg, #ef444440, #ef4444)'
                            : isProven
                              ? 'linear-gradient(90deg, #c084fc40, #c084fc)'
                              : 'linear-gradient(90deg, #ffffff10, #ffffff40)',
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-mono w-6 text-right',
                        isToxic ? 'text-red-400/70' : isProven ? 'text-purple-400/70' : 'text-white/25',
                      )}
                    >
                      {weight.toFixed(0)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Live Indicator ────────────────────────────────────────────────────────

function LiveIndicator({
  ws,
  taskCount,
}: {
  ws: { connected: boolean; polling: boolean; reconnectAttempt: number }
  taskCount: number
}) {
  const wsStatus = ws.connected
    ? 'live'
    : ws.polling
      ? 'polling'
      : ws.reconnectAttempt > 0
        ? `retry ${ws.reconnectAttempt}`
        : 'offline'
  const wsColor = ws.connected ? 'text-emerald-400/70' : ws.polling ? 'text-amber-400/70' : 'text-white/30'

  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] text-white/30">{taskCount} tasks</span>
      <span className={cn('text-[10px] font-mono', wsColor)}>ws:{wsStatus}</span>
      <div className="flex items-center gap-2">
        <div className={cn('relative w-2 h-2 rounded-full', ws.connected ? 'bg-emerald-400' : 'bg-white/20')}>
          {ws.connected && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />}
        </div>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function TaskBoardSkeleton() {
  return (
    <div className="min-h-screen p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-32 bg-white/[0.06]" />
          <Skeleton className="h-3 w-56 mt-2 bg-white/[0.04]" />
        </div>
        <Skeleton className="h-4 w-24 bg-white/[0.04]" />
      </div>
      <Skeleton className="h-10 w-full bg-white/[0.04] rounded-lg" />
      <div className="flex gap-1">
        {PHASE_ORDER.map((p) => (
          <Skeleton key={p} className="h-8 flex-1 bg-white/[0.04] rounded" />
        ))}
      </div>
      <Skeleton className="h-40 w-72 mx-auto bg-white/[0.04] rounded-xl" />
      <div className="grid grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20 bg-white/[0.04]" />
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-10 w-full bg-white/[0.04] rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Board ────────────────────────────────────────────────────────────

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null)
  const [highways, setHighways] = useState<Array<{ from: string; to: string; strength: number; resistance: number }>>(
    [],
  )

  // Fetch tasks from the live store
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${TASKS_ORIGIN}/api/tasks`)
      const data = (await res.json()) as { tasks: Array<Record<string, unknown>> }
      if (!data.tasks?.length) {
        setLoading(false)
        return
      }

      // Normalize API shape → Task interface
      // API returns: id (not tid), status "done"/"open", priority in tags
      const mapped: Task[] = data.tasks.map((t) => {
        const tags = (t.tags as string[]) || []
        const rawStatus = (t.status as string) || 'open'
        const status: Task['status'] =
          rawStatus === 'done'
            ? 'complete'
            : rawStatus === 'open'
              ? 'todo'
              : rawStatus === 'blocked'
                ? 'blocked'
                : rawStatus === 'in_progress'
                  ? 'in_progress'
                  : rawStatus === 'failed'
                    ? 'failed'
                    : 'todo'
        const priority = (tags.find((tag) => /^P[0-3]$/.test(tag)) as Task['priority']) || 'P1'

        return {
          tid: (t.tid || t.id) as string,
          name: t.name as string,
          status,
          priority,
          phase: (t.phase as string) || 'C1',
          tags,
          trailPheromone: (t.trailPheromone as number) || (t.strength as number) || 0,
          alarmPheromone: (t.alarmPheromone as number) || (t.resistance as number) || 0,
          blockedBy: (t.blockedBy as string[]) || [],
          blocks: (t.blocks as string[]) || [],
        }
      })

      setTasks(mapped)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  // Fetch highways from live state
  const fetchHighways = useCallback(async () => {
    try {
      const res = await fetch('/api/export/highways')
      const data = (await res.json()) as {
        highways?: Array<{ from: string; to: string; strength: number; resistance: number }>
      }
      if (data.highways) setHighways(data.highways)
    } catch {
      // Non-critical — highways panel stays empty
    }
  }, [])

  // Initial data load
  useEffect(() => {
    fetchTasks()
    fetchHighways()
  }, [fetchTasks, fetchHighways])

  // WebSocket for live push updates
  const ws = useTaskWebSocket(setTasks)

  // Debounce rapid WS bursts
  const deferredTasks = useDeferredValue(tasks)

  // Build phases from deferred tasks
  const phases = useMemo<Phase[]>(
    () =>
      PHASE_ORDER.map((id) => {
        const phaseTasks = deferredTasks.filter((t) => t.phase === id)
        return {
          id,
          name: PHASE_META[id]?.label || id,
          tasks: phaseTasks,
          complete: phaseTasks.filter((t) => t.status === 'complete').length,
          total: phaseTasks.length,
        }
      }),
    [deferredTasks],
  )

  // Auto-select active task
  const activeTask = useMemo(() => {
    if (selectedId) {
      const found = tasks.find((t) => t.tid === selectedId)
      if (found) return found
    }
    const inProgress = tasks.find((t) => t.status === 'in_progress')
    if (inProgress) return inProgress
    const ready = tasks.find(
      (t) => t.status === 'todo' && t.blockedBy.every((b) => tasks.find((bt) => bt.tid === b)?.status === 'complete'),
    )
    return ready || tasks[0]
  }, [tasks, selectedId])

  const activePhase = activeTask?.phase || 'wire'

  // Handle drag-drop status changes with optimistic UI + API persist
  const handleStatusChange = useCallback(
    (tid: string, newStatus: Task['status']) => {
      const prevTask = tasks.find((t) => t.tid === tid)
      const wasComplete = prevTask?.status === 'complete'

      setTasks((prev) => {
        const updated = prev.map((t) => (t.tid === tid ? { ...t, status: newStatus } : t))

        if (newStatus === 'complete') {
          return updated.map((t) => {
            if (t.status !== 'blocked' || !t.blockedBy.includes(tid)) return t
            const allBlockersComplete = t.blockedBy.every((blockerId) => {
              const blocker = updated.find((bt) => bt.tid === blockerId)
              return blocker?.status === 'complete'
            })
            return allBlockersComplete ? { ...t, status: 'todo' as const } : t
          })
        }

        if (newStatus === 'todo' || newStatus === 'in_progress') {
          return updated.map((t) => {
            if (t.blockedBy.includes(tid) && t.status === 'todo') return { ...t, status: 'blocked' as const }
            return t
          })
        }

        return updated
      })

      // Persist: gateway (D1 + WS broadcast) in prod, local API in dev
      const writeBase = GATEWAY_URL || `${TASKS_ORIGIN}/api`
      const updatePath = GATEWAY_URL ? `/tasks/${tid}` : `/tasks/update/${tid}`
      fetch(`${writeBase}${updatePath}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {})

      // Pheromone feedback
      if (newStatus === 'complete' && !wasComplete) {
        const edgeFrom = lastCompletedId || 'entry'
        setLastCompletedId(tid)
        fetch(`${writeBase}/tasks/${tid}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: edgeFrom, failed: false }),
        }).catch(() => {})
      } else if (wasComplete && newStatus !== 'complete') {
        fetch(`${writeBase}/tasks/${tid}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: lastCompletedId || 'entry', failed: true }),
        }).catch(() => {})
      }
    },
    [tasks, lastCompletedId],
  )

  if (loading) return <TaskBoardSkeleton />

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen p-6 max-w-[1400px] mx-auto flex items-center justify-center">
        <Card className="bg-white/[0.02] border-white/[0.06] max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-white/40 text-sm">No tasks in the store yet.</p>
            <p className="text-white/20 text-xs mt-2">
              Sync tasks from TODO files with{' '}
              <code className="text-white/40 bg-white/[0.06] px-1 rounded">/sync todos</code> or create via the API.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white/80 tracking-tight">Tasks</h1>
          <p className="text-xs text-white/20 mt-0.5">Live from substrate. Signal. Mark. Follow. Fade.</p>
        </div>
        <LiveIndicator ws={ws} taskCount={tasks.length} />
      </div>

      {/* Stats */}
      <StatsBar tasks={tasks} />

      {/* Phase Timeline */}
      <div className="mt-6 mb-2">
        <PhaseTimeline phases={phases} activePhase={activePhase} />
      </div>

      {/* Active Task Spotlight */}
      {activeTask && <ActiveSpotlight task={activeTask} allTasks={tasks} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
        {/* Task Flow Grid (3 cols) */}
        <div className="lg:col-span-3">
          <TaskFlowGrid
            tasks={tasks}
            activeId={activeTask?.tid || ''}
            onSelect={setSelectedId}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Live Highways Panel (1 col) */}
        <div className="lg:col-span-1">
          <HighwaysPanel highways={highways} />
        </div>
      </div>
    </div>
  )
}
