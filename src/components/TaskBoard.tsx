/**
 * TaskBoard — Live task visualization following one.tql schema
 *
 * Shows: phase timeline, active task spotlight, dependency chains,
 * pheromone trails, and task flow (planned → active → complete).
 *
 * Falls back to TODO.md roadmap data when TypeDB isn't connected.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

// ─── Types (from one.tql) ───────────────────────────────────────────────────

interface Task {
  tid: string
  name: string
  status: 'todo' | 'in_progress' | 'complete' | 'blocked' | 'failed'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  phase: string
  taskType: string
  trailPheromone: number
  alarmPheromone: number
  trailStatus: 'proven' | 'fresh' | 'fading' | 'dead' | null
  attractive: boolean
  repelled: boolean
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

// ─── Roadmap Data (self-hosted from TODO.md) ────────────────────────────────

const ROADMAP: Task[] = [
  // Phase 0: Tighten (COMPLETE)
  { tid: 'X-1', name: 'One schema', status: 'complete', priority: 'P0', phase: 'tighten', taskType: 'build', trailPheromone: 95, alarmPheromone: 0, trailStatus: 'proven', attractive: false, repelled: false, blockedBy: [], blocks: ['X-2', 'X-3', 'X-4', 'X-5', 'X-6'] },
  { tid: 'X-2', name: 'Kill entity service', status: 'complete', priority: 'P0', phase: 'tighten', taskType: 'build', trailPheromone: 90, alarmPheromone: 0, trailStatus: 'proven', attractive: false, repelled: false, blockedBy: ['X-1'], blocks: ['X-5'] },
  { tid: 'X-3', name: 'Converge vocabulary', status: 'complete', priority: 'P0', phase: 'tighten', taskType: 'build', trailPheromone: 88, alarmPheromone: 0, trailStatus: 'proven', attractive: false, repelled: false, blockedBy: ['X-1'], blocks: [] },
  { tid: 'X-4', name: 'Mark lessons as reference', status: 'complete', priority: 'P1', phase: 'tighten', taskType: 'build', trailPheromone: 85, alarmPheromone: 0, trailStatus: 'proven', attractive: false, repelled: false, blockedBy: ['X-1'], blocks: [] },
  { tid: 'X-5', name: 'Revenue on trails', status: 'complete', priority: 'P0', phase: 'tighten', taskType: 'build', trailPheromone: 92, alarmPheromone: 0, trailStatus: 'proven', attractive: false, repelled: false, blockedBy: ['X-2'], blocks: [] },
  { tid: 'X-6', name: 'Rename to world', status: 'complete', priority: 'P1', phase: 'tighten', taskType: 'build', trailPheromone: 80, alarmPheromone: 0, trailStatus: 'proven', attractive: false, repelled: false, blockedBy: ['X-1'], blocks: [] },

  // Phase 1: Wire
  { tid: 'W-1', name: 'TypeDB Cloud instance', status: 'todo', priority: 'P0', phase: 'wire', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: [], blocks: ['W-2'] },
  { tid: 'W-2', name: 'Cloudflare Worker proxy', status: 'complete', priority: 'P0', phase: 'wire', taskType: 'build', trailPheromone: 60, alarmPheromone: 0, trailStatus: 'fresh', attractive: false, repelled: false, blockedBy: ['W-1'], blocks: ['W-3'] },
  { tid: 'W-3', name: 'TypeDB client lib', status: 'complete', priority: 'P0', phase: 'wire', taskType: 'build', trailPheromone: 55, alarmPheromone: 0, trailStatus: 'fresh', attractive: false, repelled: false, blockedBy: ['W-2'], blocks: ['W-4'] },
  { tid: 'W-4', name: 'Persist layer', status: 'complete', priority: 'P0', phase: 'wire', taskType: 'build', trailPheromone: 50, alarmPheromone: 0, trailStatus: 'fresh', attractive: false, repelled: false, blockedBy: ['W-3'], blocks: ['T-1'] },

  // Phase 2: Tasks
  { tid: 'T-1', name: 'Task API routes', status: 'complete', priority: 'P0', phase: 'tasks', taskType: 'build', trailPheromone: 45, alarmPheromone: 0, trailStatus: 'fresh', attractive: false, repelled: false, blockedBy: ['W-4'], blocks: ['T-2', 'T-3', 'T-4'] },
  { tid: 'T-2', name: 'Task board UI', status: 'in_progress', priority: 'P0', phase: 'tasks', taskType: 'build', trailPheromone: 20, alarmPheromone: 0, trailStatus: 'fresh', attractive: true, repelled: false, blockedBy: ['T-1'], blocks: ['T-5'] },
  { tid: 'T-3', name: 'Dependencies + negation', status: 'complete', priority: 'P1', phase: 'tasks', taskType: 'build', trailPheromone: 40, alarmPheromone: 0, trailStatus: 'fresh', attractive: false, repelled: false, blockedBy: ['T-1'], blocks: ['T-6'] },
  { tid: 'T-4', name: 'Pheromone reinforcement', status: 'complete', priority: 'P1', phase: 'tasks', taskType: 'build', trailPheromone: 35, alarmPheromone: 0, trailStatus: 'fresh', attractive: false, repelled: false, blockedBy: ['T-1'], blocks: ['T-6'] },
  { tid: 'T-5', name: 'Exploratory tasks panel', status: 'todo', priority: 'P2', phase: 'tasks', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['T-2'], blocks: [] },
  { tid: 'T-6', name: 'Self-host roadmap', status: 'todo', priority: 'P0', phase: 'tasks', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['T-3', 'T-4'], blocks: ['T-7'] },
  { tid: 'T-7', name: '/grow skill', status: 'todo', priority: 'P0', phase: 'tasks', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['T-6'], blocks: ['O-1'] },

  // Phase 3: Onboard
  { tid: 'O-1', name: 'Seed world', status: 'todo', priority: 'P0', phase: 'onboard', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['T-6'], blocks: ['O-2', 'O-4'] },
  { tid: 'O-2', name: 'Signup flow', status: 'todo', priority: 'P0', phase: 'onboard', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['O-1'], blocks: ['O-3', 'O-5', 'O-6'] },
  { tid: 'O-3', name: 'Agent builder', status: 'todo', priority: 'P0', phase: 'onboard', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['O-2'], blocks: ['O-7'] },
  { tid: 'O-4', name: 'Discovery', status: 'todo', priority: 'P1', phase: 'onboard', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['O-1'], blocks: ['O-7'] },
  { tid: 'O-5', name: 'Profiles', status: 'todo', priority: 'P1', phase: 'onboard', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['O-2'], blocks: [] },
  { tid: 'O-6', name: 'Eight personas', status: 'todo', priority: 'P1', phase: 'onboard', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['O-2'], blocks: [] },
  { tid: 'O-7', name: 'Connect flow', status: 'todo', priority: 'P0', phase: 'onboard', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['O-3', 'O-4'], blocks: [] },

  // Phase 4: Commerce
  { tid: 'C-1', name: 'x402 payment layer', status: 'todo', priority: 'P0', phase: 'commerce', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['O-3'], blocks: ['C-2', 'C-3', 'C-4'] },
  { tid: 'C-2', name: 'Service marketplace', status: 'todo', priority: 'P1', phase: 'commerce', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['C-1'], blocks: ['C-5'] },
  { tid: 'C-3', name: 'Revenue tracking', status: 'todo', priority: 'P1', phase: 'commerce', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['C-1'], blocks: ['C-6'] },
  { tid: 'C-4', name: 'Agent-to-agent payments', status: 'todo', priority: 'P1', phase: 'commerce', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['C-1'], blocks: [] },
  { tid: 'C-5', name: 'Highway pricing', status: 'todo', priority: 'P2', phase: 'commerce', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['C-2'], blocks: [] },
  { tid: 'C-6', name: 'Agentverse bridge', status: 'todo', priority: 'P2', phase: 'commerce', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['C-3'], blocks: [] },

  // Phase 5: Intelligence
  { tid: 'I-1', name: 'LLM as unit', status: 'todo', priority: 'P0', phase: 'intelligence', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['C-4'], blocks: ['I-2'] },
  { tid: 'I-2', name: 'Agent castes', status: 'todo', priority: 'P1', phase: 'intelligence', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['I-1'], blocks: ['I-5'] },
  { tid: 'I-3', name: 'Hypothesis engine', status: 'todo', priority: 'P1', phase: 'intelligence', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['C-3'], blocks: ['I-4'] },
  { tid: 'I-4', name: 'Frontier detection', status: 'todo', priority: 'P2', phase: 'intelligence', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['I-3'], blocks: ['I-5'] },
  { tid: 'I-5', name: 'Dream state', status: 'todo', priority: 'P2', phase: 'intelligence', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['I-2', 'I-4'], blocks: [] },

  // Phase 6: Scale
  { tid: 'S-1', name: 'Cloudflare Pages deploy', status: 'todo', priority: 'P0', phase: 'scale', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['I-1'], blocks: ['S-2', 'S-4'] },
  { tid: 'S-2', name: 'Sui integration', status: 'todo', priority: 'P0', phase: 'scale', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['S-1'], blocks: ['S-3'] },
  { tid: 'S-3', name: 'Security hardening', status: 'todo', priority: 'P0', phase: 'scale', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['S-2'], blocks: ['S-5'] },
  { tid: 'S-4', name: 'Monitoring + alerts', status: 'todo', priority: 'P1', phase: 'scale', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['S-1'], blocks: [] },
  { tid: 'S-5', name: 'ASI ecosystem', status: 'todo', priority: 'P1', phase: 'scale', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['S-3'], blocks: ['S-6'] },
  { tid: 'S-6', name: 'Self-sustaining economy', status: 'todo', priority: 'P0', phase: 'scale', taskType: 'build', trailPheromone: 0, alarmPheromone: 0, trailStatus: null, attractive: false, repelled: false, blockedBy: ['S-5'], blocks: [] },
]

const PHASE_ORDER = ['tighten', 'wire', 'tasks', 'onboard', 'commerce', 'intelligence', 'scale']

const PHASE_META: Record<string, { label: string; color: string; glow: string }> = {
  tighten:      { label: 'Tighten',      color: '#6ee7b7', glow: 'rgba(110,231,183,0.3)' },
  wire:         { label: 'Wire',         color: '#67e8f9', glow: 'rgba(103,232,249,0.3)' },
  tasks:        { label: 'Tasks',        color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  onboard:      { label: 'Onboard',      color: '#4ade80', glow: 'rgba(74,222,128,0.3)' },
  commerce:     { label: 'Commerce',     color: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
  intelligence: { label: 'Intelligence', color: '#f472b6', glow: 'rgba(244,114,182,0.3)' },
  scale:        { label: 'Scale',        color: '#f87171', glow: 'rgba(248,113,113,0.3)' },
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  complete:    { bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20', text: 'text-emerald-400' },
  in_progress: { bg: 'bg-amber-500/10',   border: 'border-amber-400/40',   text: 'text-amber-300' },
  todo:        { bg: 'bg-white/[0.03]',   border: 'border-white/8',        text: 'text-white/50' },
  blocked:     { bg: 'bg-white/[0.02]',   border: 'border-white/5',        text: 'text-white/25' },
  failed:      { bg: 'bg-red-500/8',      border: 'border-red-500/20',     text: 'text-red-400' },
}

// ─── Phase Timeline ─────────────────────────────────────────────────────────

function PhaseTimeline({ phases, activePhase }: { phases: Phase[]; activePhase: string }) {
  return (
    <div className="flex items-center gap-1 px-2">
      {phases.map((phase, i) => {
        const meta = PHASE_META[phase.id]
        const pct = phase.total > 0 ? (phase.complete / phase.total) * 100 : 0
        const isActive = phase.id === activePhase
        const isDone = pct === 100

        return (
          <div key={phase.id} className="flex items-center gap-1 flex-1">
            <div className="flex-1 group relative">
              {/* Phase label */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[11px] font-semibold tracking-wide"
                  style={{ color: isActive ? meta.color : isDone ? meta.color + '99' : '#ffffff30' }}
                >
                  {meta.label}
                </span>
                <span className="text-[10px] font-mono" style={{ color: isActive ? meta.color : '#ffffff20' }}>
                  {phase.complete}/{phase.total}
                </span>
              </div>

              {/* Progress bar */}
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

            {/* Connector */}
            {i < phases.length - 1 && (
              <div className="w-4 h-px mt-4" style={{
                background: isDone ? `${meta.color}40` : '#ffffff08',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Active Task Spotlight ──────────────────────────────────────────────────

function ActiveSpotlight({ task, allTasks }: { task: Task; allTasks: Task[] }) {
  const meta = PHASE_META[task.phase]
  const blockers = allTasks.filter(t => task.blockedBy.includes(t.tid))
  const unblocks = allTasks.filter(t => task.blocks.includes(t.tid))

  return (
    <div className="relative my-6">
      {/* Glow backdrop */}
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
          {blockers.map(b => (
            <MiniCard key={b.tid} task={b} align="right" />
          ))}
        </div>

        {/* Connector left */}
        {blockers.length > 0 && (
          <div className="flex items-center">
            <div className="w-8 flex items-center">
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${meta.color}40)` }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color + '60' }} />
            </div>
          </div>
        )}

        {/* Current task (center spotlight) */}
        <div
          className="shrink-0 w-72 rounded-xl border-2 p-5 relative overflow-hidden"
          style={{
            borderColor: meta.color + '50',
            background: `linear-gradient(135deg, ${meta.color}08 0%, transparent 50%, ${meta.color}05 100%)`,
            boxShadow: `0 0 40px ${meta.glow}, inset 0 1px 0 ${meta.color}15`,
          }}
        >
          {/* Animated border glow */}
          <div
            className="absolute inset-0 rounded-xl animate-[spin_8s_linear_infinite] opacity-20"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${meta.color}, transparent, transparent)`,
              maskImage: 'radial-gradient(ellipse, transparent 65%, black 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse, transparent 65%, black 70%)',
            }}
          />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: meta.color + '20', color: meta.color }}>
                {task.tid}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: meta.color + 'aa' }}>
                {meta.label}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-2">{task.name}</h3>

            <div className="flex items-center gap-3 mt-3">
              <StatusPill status={task.status} />
              <PriorityDot priority={task.priority} />
              {task.attractive && (
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  attractive
                </span>
              )}
            </div>

            {/* Pheromone visualization */}
            {(task.trailPheromone > 0 || task.alarmPheromone > 0) && (
              <div className="mt-4 space-y-1.5">
                <PheromoneTrail value={task.trailPheromone} type="trail" color={meta.color} />
                {task.alarmPheromone > 0 && (
                  <PheromoneTrail value={task.alarmPheromone} type="alarm" color="#ef4444" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Connector right */}
        {unblocks.length > 0 && (
          <div className="flex items-center">
            <div className="w-8 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color + '60' }} />
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${meta.color}40, transparent)` }} />
            </div>
          </div>
        )}

        {/* Unblocks (right) */}
        <div className="flex-1 flex flex-col items-start justify-center gap-2 min-w-0">
          {unblocks.length > 0 && (
            <span className="text-[10px] text-white/20 uppercase tracking-widest mb-1">unblocks</span>
          )}
          {unblocks.map(u => (
            <MiniCard key={u.tid} task={u} align="left" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MiniCard({ task, align }: { task: Task; align: 'left' | 'right' }) {
  const style = STATUS_STYLES[task.status] || STATUS_STYLES.todo
  const meta = PHASE_META[task.phase]

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${style.bg} ${style.border} max-w-[200px]`}>
      {align === 'right' && task.status === 'complete' && (
        <span className="text-emerald-400 text-xs">&#10003;</span>
      )}
      <div className={align === 'right' ? 'text-right' : ''}>
        <span className="text-[10px] font-mono block" style={{ color: meta.color + '80' }}>{task.tid}</span>
        <span className={`text-xs ${style.text} line-clamp-1`}>{task.name}</span>
      </div>
      {align === 'left' && task.status === 'todo' && (
        <span className="text-white/15 text-[10px]">&#9679;</span>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const labels: Record<string, { text: string; className: string }> = {
    complete:     { text: 'COMPLETE',    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    in_progress:  { text: 'ACTIVE',      className: 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse' },
    todo:         { text: 'PLANNED',     className: 'bg-white/5 text-white/40 border-white/10' },
    blocked:      { text: 'BLOCKED',     className: 'bg-white/[0.03] text-white/20 border-white/5' },
    failed:       { text: 'FAILED',      className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  }
  const l = labels[status] || labels.todo
  return (
    <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${l.className}`}>
      {l.text}
    </span>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#6b7280' }
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[priority] || '#6b7280' }} />
      <span className="text-[10px] text-white/30">{priority}</span>
    </div>
  )
}

function PheromoneTrail({ value, type, color }: { value: number; type: 'trail' | 'alarm'; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-wider w-8" style={{ color: color + '60' }}>
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
      <span className="text-[10px] font-mono w-8 text-right" style={{ color: color + '80' }}>
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// ─── Task Flow Grid ─────────────────────────────────────────────────────────

function TaskFlowGrid({ tasks, activeId, onSelect }: {
  tasks: Task[]
  activeId: string
  onSelect: (tid: string) => void
}) {
  const planned = tasks.filter(t => t.status === 'todo' || t.status === 'blocked')
  const active = tasks.filter(t => t.status === 'in_progress')
  const done = tasks.filter(t => t.status === 'complete')
  const failed = tasks.filter(t => t.status === 'failed')

  return (
    <div className="grid grid-cols-3 gap-6 mt-4">
      <FlowColumn label="Planned" count={planned.length} color="#ffffff20" tasks={planned} activeId={activeId} onSelect={onSelect} />
      <FlowColumn label="Active" count={active.length} color="#fbbf24" tasks={active} activeId={activeId} onSelect={onSelect} />
      <FlowColumn label="Complete" count={done.length} color="#4ade80" tasks={[...failed, ...done]} activeId={activeId} onSelect={onSelect} />
    </div>
  )
}

function FlowColumn({ label, count, color, tasks, activeId, onSelect }: {
  label: string; count: number; color: string
  tasks: Task[]; activeId: string; onSelect: (tid: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold text-white/50">{label}</span>
        <span className="text-[10px] text-white/20">({count})</span>
      </div>
      <div className="space-y-1.5">
        {tasks.map(task => (
          <TaskRow key={task.tid} task={task} isActive={task.tid === activeId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task, isActive, onSelect }: { task: Task; isActive: boolean; onSelect: (tid: string) => void }) {
  const meta = PHASE_META[task.phase]
  const style = STATUS_STYLES[task.status] || STATUS_STYLES.todo

  return (
    <button
      onClick={() => onSelect(task.tid)}
      className={`w-full text-left rounded-lg border px-3 py-2 transition-all duration-200
        ${style.bg} ${style.border}
        ${isActive ? 'ring-1 ring-amber-400/30 scale-[1.02]' : 'hover:border-white/15 hover:bg-white/[0.04]'}
      `}
      style={isActive ? { boxShadow: `0 0 20px ${meta.glow}` } : undefined}
    >
      <div className="flex items-center gap-2">
        {/* Phase color dot */}
        <div
          className="w-1 h-6 rounded-full shrink-0"
          style={{ background: meta.color + (task.status === 'complete' ? '40' : task.status === 'blocked' ? '15' : '80') }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono" style={{ color: meta.color + '70' }}>{task.tid}</span>
            <span className={`text-xs truncate ${style.text}`}>{task.name}</span>
          </div>

          {/* Trail indicator */}
          {task.trailPheromone > 0 && (
            <div className="mt-1 h-0.5 rounded-full bg-white/[0.03] overflow-hidden" style={{ maxWidth: '100%' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(task.trailPheromone, 100)}%`,
                  background: task.trailStatus === 'proven' ? meta.color : meta.color + '60',
                }}
              />
            </div>
          )}
        </div>

        {/* Status indicator */}
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

// ─── Stats Bar ──────────────────────────────────────────────────────────────

function StatsBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length
  const complete = tasks.filter(t => t.status === 'complete').length
  const active = tasks.filter(t => t.status === 'in_progress').length
  const ready = tasks.filter(t => t.status === 'todo' && t.blockedBy.every(b => tasks.find(bt => bt.tid === b)?.status === 'complete')).length
  const totalTrail = tasks.reduce((s, t) => s + t.trailPheromone, 0)
  const highways = tasks.filter(t => t.trailPheromone >= 50).length
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0

  return (
    <div className="flex items-center gap-5 px-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <Stat label="total" value={total} color="#ffffff60" />
      <Stat label="complete" value={complete} color="#4ade80" />
      <Stat label="active" value={active} color="#fbbf24" />
      <Stat label="ready" value={ready} color="#67e8f9" />
      <Stat label="highways" value={highways} color="#c084fc" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-mono text-emerald-400/70">{pct}%</span>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/25 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── Main Board ─────────────────────────────────────────────────────────────

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(ROADMAP)
  const [selectedId, setSelectedId] = useState<string>('')
  const [tick, setTick] = useState(0)

  // Find active task or first ready task for spotlight
  const activeTask = useMemo(() => {
    if (selectedId) {
      const found = tasks.find(t => t.tid === selectedId)
      if (found) return found
    }
    // Auto-select: first in_progress, then first ready todo
    const inProgress = tasks.find(t => t.status === 'in_progress')
    if (inProgress) return inProgress
    const ready = tasks.find(t =>
      t.status === 'todo' &&
      t.blockedBy.every(b => tasks.find(bt => bt.tid === b)?.status === 'complete')
    )
    return ready || tasks[0]
  }, [tasks, selectedId])

  // Build phases
  const phases = useMemo<Phase[]>(() =>
    PHASE_ORDER.map(id => {
      const phaseTasks = tasks.filter(t => t.phase === id)
      return {
        id,
        name: PHASE_META[id].label,
        tasks: phaseTasks,
        complete: phaseTasks.filter(t => t.status === 'complete').length,
        total: phaseTasks.length,
      }
    }), [tasks])

  const activePhase = activeTask?.phase || 'wire'

  // Subtle tick for animations
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(i)
  }, [])

  // Fetch live data from TypeDB, overlay on roadmap
  useEffect(() => {
    (async () => {
      try {
        const [tasksRes, readyRes, attractiveRes, repelledRes] = await Promise.all([
          fetch('/api/tasks').then(r => r.json() as Promise<any>).catch(() => ({ tasks: [] })),
          fetch('/api/tasks/ready').then(r => r.json() as Promise<any>).catch(() => ({ tasks: [] })),
          fetch('/api/tasks/attractive').then(r => r.json() as Promise<any>).catch(() => ({ tasks: [] })),
          fetch('/api/tasks/repelled').then(r => r.json() as Promise<any>).catch(() => ({ tasks: [] })),
        ])

        const liveTasks = tasksRes.tasks as Array<Record<string, unknown>>
        if (!liveTasks?.length) return

        const readyIds = new Set((readyRes.tasks || []).map((t: Record<string, unknown>) => t.tid))
        const attractiveIds = new Set((attractiveRes.tasks || []).map((t: Record<string, unknown>) => t.tid))
        const repelledIds = new Set((repelledRes.tasks || []).map((t: Record<string, unknown>) => t.tid))

        const merged = liveTasks.map((t) => ({
          tid: t.tid as string,
          name: t.name as string,
          status: (t.status as Task['status']) || 'todo',
          priority: (t.priority as Task['priority']) || 'P1',
          phase: (t.phase as string) || 'onboard',
          taskType: (t.taskType as string) || (t['task-type'] as string) || 'build',
          trailPheromone: (t.trailPheromone as number) || 0,
          alarmPheromone: (t.alarmPheromone as number) || 0,
          trailStatus: null as Task['trailStatus'],
          attractive: attractiveIds.has(t.tid),
          repelled: repelledIds.has(t.tid),
          blockedBy: [] as string[],
          blocks: [] as string[],
        }))

        // Merge: live tasks override roadmap by tid, keep roadmap extras
        const liveMap = new Map(merged.map(t => [t.tid, t]))
        const final = ROADMAP.map(r => liveMap.get(r.tid) || r)
        // Add any live tasks not in roadmap
        for (const t of merged) {
          if (!ROADMAP.find(r => r.tid === t.tid)) final.push(t)
        }
        setTasks(final)
      } catch {
        // Keep roadmap fallback
      }
    })()
  }, [])

  return (
    <div className="min-h-screen p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white/80 tracking-tight">ONE World</h1>
        <p className="text-xs text-white/20 mt-0.5">Signal. Drop. Follow. Fade. Highway.</p>
      </div>

      {/* Stats */}
      <StatsBar tasks={tasks} />

      {/* Phase Timeline */}
      <div className="mt-6 mb-2">
        <PhaseTimeline phases={phases} activePhase={activePhase} />
      </div>

      {/* Active Task Spotlight */}
      {activeTask && <ActiveSpotlight task={activeTask} allTasks={tasks} />}

      {/* Task Flow Grid */}
      <TaskFlowGrid tasks={tasks} activeId={activeTask?.tid || ''} onSelect={setSelectedId} />
    </div>
  )
}
