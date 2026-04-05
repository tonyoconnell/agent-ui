/**
 * THE SUBSTRATE
 *
 * Two fields. Dual scent. Concurrency safe.
 *
 * receiver: who (unit:task)
 * data: what (anything)
 * data.marks: false to observe without marking trails
 * data.weight: override default mark weight
 *
 * Signal. Mark. Warn. Follow. Fade. Highway.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Signal = { receiver: string; data?: unknown }
export type Emit = (s: Signal) => void
export type Edge = { path: string; strength: number }
type Task = (data: unknown, emit: Emit, ctx: { from: string; self: string }) => Promise<unknown>
type Template = (result: unknown) => Signal
type Route = (s: Signal, from: string) => void

type SignalData = { marks?: boolean; weight?: number; [k: string]: unknown }
const asData = (d: unknown): SignalData => (d && typeof d === 'object' ? d as SignalData : {})

export interface Unit {
  (s: Signal, from?: string): void
  on: (name: string, fn: (d: unknown, emit: Emit, ctx: { from: string; self: string }) => unknown) => Unit
  then: (name: string, template: Template) => Unit
  role: (name: string, task: string, ctx: Record<string, unknown>) => Unit
  has: (name: string) => boolean
  list: () => string[]
  id: string
}

export interface Colony {
  units: Record<string, Unit>
  scent: Record<string, number>
  alarm: Record<string, number>
  spawn: (id: string) => Unit
  despawn: (id: string) => void
  signal: (s: Signal, from?: string) => void
  mark: (path: string, strength?: number) => void
  warn: (path: string, strength?: number) => void
  sense: (path: string) => number
  danger: (path: string) => number
  follow: (type?: string) => string | null
  select: (type?: string, exploration?: number) => string | null
  fade: (rate?: number) => void
  highways: (limit?: number) => { path: string; strength: number }[]
  has: (id: string) => boolean
  list: () => string[]
  get: (id: string) => Unit | undefined
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIT
// ═══════════════════════════════════════════════════════════════════════════

export const unit = (id: string, route?: Route): Unit => {
  const tasks: Record<string, Task> = {}
  const next: Record<string, Template> = {}

  const u: Unit = ({ receiver, data }, from = 'entry') => {
    const taskName = receiver.includes(':') ? receiver.split(':')[1] : 'default'
    const task = tasks[taskName] || tasks.default

    const emit: Emit = s => route?.(s, receiver)
    const ctx = { from, self: receiver }

    task?.(data, emit, ctx).then(result =>
      next[taskName] && route?.(next[taskName](result), receiver)
    )
  }

  u.on = (n, f) => (tasks[n] = (d, e, c) => Promise.resolve(f(d, e, c)), u)
  u.then = (n, t) => (next[n] = t, u)
  u.role = (n, t, ctx) => (tasks[n] = (d, e, c) => tasks[t]?.({ ...ctx, ...(d as object) }, e, c) ?? Promise.resolve(null), u)
  u.has = n => n in tasks
  u.list = () => Object.keys(tasks)
  u.id = id
  return u
}

// ═══════════════════════════════════════════════════════════════════════════
// COLONY
// ═══════════════════════════════════════════════════════════════════════════

export const colony = (): Colony => {
  const units: Record<string, Unit> = {}
  const scent: Record<string, number> = {}
  const alarm: Record<string, number> = {}

  const mark = (path: string, strength = 1) => {
    scent[path] = (scent[path] || 0) + strength
  }

  const warn = (path: string, strength = 1) => {
    alarm[path] = (alarm[path] || 0) + strength
  }

  const sense = (path: string) => scent[path] || 0
  const danger = (path: string) => alarm[path] || 0

  const signal = ({ receiver, data }: Signal, from = 'entry') => {
    const unitId = receiver.includes(':') ? receiver.split(':')[0] : receiver
    const target = units[unitId]
    if (!target) return

    const d = asData(data)
    const edge = `${from}→${receiver}`

    // marks gate: only mark pheromone on production signals
    d.marks !== false && mark(edge, d.weight ?? 1)

    target({ receiver, data }, from)
  }

  const spawn = (id: string) => {
    const u = unit(id, (s, from) => signal(s, from))
    units[id] = u
    return u
  }

  // unit stops receiving. trails remain, fade naturally
  const despawn = (id: string) => { delete units[id] }

  // exact segment match: "analyst" matches "scout→analyst:process" but "an" doesn't
  const matchEdge = (edge: string, type: string) =>
    edge.split('→').some(s => s.split(':')[0] === type)

  // follow strongest trail, penalized by alarm
  const follow = (type?: string) => {
    const trails = Object.entries(scent)
      .filter(([e]) => !type || matchEdge(e, type))
      .map(([e, s]) => [e, s - (alarm[e] || 0)] as const)
      .filter(([, s]) => s > 0)
      .sort(([, a], [, b]) => b - a)
    return trails[0]?.[0].split('→').pop()?.split(':')[0] || null
  }

  // select: weighted random with exploration bias (ant-like stochastic routing)
  const select = (type?: string, exploration = 0.3) => {
    const viable = Object.entries(scent)
      .filter(([e]) => !type || matchEdge(e, type))
      .map(([e, s]) => [e, Math.max(0, s - (alarm[e] || 0))] as const)
      .filter(([, s]) => s > 0)
    if (!viable.length) return null
    const pick = (e: string) => e.split('→').pop()?.split(':')[0] || null
    if (Math.random() < exploration) return pick(viable[Math.floor(Math.random() * viable.length)][0])
    const total = viable.reduce((sum, [, s]) => sum + s, 0)
    let r = Math.random() * total
    for (const [e, s] of viable) { r -= s; if (r <= 0) return pick(e) }
    return pick(viable.at(-1)![0])
  }

  // asymmetric: alarm decays 2x faster (failures forgive)
  const fade = (r = 0.1) => {
    for (const e in scent) { scent[e] *= (1 - r); scent[e] < 0.01 && delete scent[e] }
    for (const e in alarm) { alarm[e] *= (1 - r * 2); alarm[e] < 0.01 && delete alarm[e] }
  }

  const highways = (limit = 10) =>
    Object.entries(scent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path, strength]) => ({ path, strength }))

  const has = (id: string) => id in units
  const list = () => Object.keys(units)
  const get = (id: string) => units[id]

  return { units, scent, alarm, spawn, despawn, signal, mark, warn, sense, danger, follow, select, fade, highways, has, list, get }
}

// ═══════════════════════════════════════════════════════════════════════════
// Signal. Mark. Warn. Follow. Fade. Highway.
// ═══════════════════════════════════════════════════════════════════════════
