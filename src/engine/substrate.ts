/**
 * THE SUBSTRATE
 *
 * 70 lines. Two fields. Concurrency safe.
 *
 * receiver: who (unit:task)
 * data: what (anything)
 *
 * Signal. Mark. Follow. Fade. Highway.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Signal = { receiver: string; data?: unknown }
export type Emit = (s: Signal) => void
type Task = (data: unknown, emit: Emit, ctx: { from: string; self: string }) => Promise<unknown>
type Template = (result: unknown) => Signal
type Route = (s: Signal, from: string) => void

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
  spawn: (id: string) => Unit
  signal: (s: Signal, from?: string) => void
  mark: (edge: string, strength?: number) => void
  sense: (edge: string) => number
  follow: (type?: string) => string | null
  fade: (rate?: number) => void
  highways: (limit?: number) => { edge: string; strength: number }[]
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

  const mark = (edge: string, strength = 1) => {
    scent[edge] = (scent[edge] || 0) + strength
  }

  const sense = (edge: string) => scent[edge] || 0

  const signal = ({ receiver, data }: Signal, from = 'entry') => {
    const unitId = receiver.includes(':') ? receiver.split(':')[0] : receiver
    const target = units[unitId]
    target && (
      mark(`${from}→${receiver}`),
      target({ receiver, data }, from)
    )
  }

  const spawn = (id: string) => {
    const u = unit(id, (s, from) => signal(s, from))
    units[id] = u
    return u
  }

  // STAN: follow strongest trail matching a type
  // effective_cost = base / (1 + pheromone * 0.7)
  const follow = (type?: string) => {
    const trails = Object.entries(scent)
      .filter(([e]) => !type || e.includes(type))
      .sort(([, a], [, b]) => b - a)
    return trails[0]?.[0].split('→').pop()?.split(':')[0] || null
  }

  const fade = (r = 0.1) => Object.keys(scent).forEach(e => {
    scent[e] *= (1 - r)
    scent[e] < 0.01 && delete scent[e]
  })

  const highways = (limit = 10) =>
    Object.entries(scent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([edge, strength]) => ({ edge, strength }))

  const has = (id: string) => id in units
  const list = () => Object.keys(units)
  const get = (id: string) => units[id]

  return { units, scent, spawn, signal, mark, sense, follow, fade, highways, has, list, get }
}

// ═══════════════════════════════════════════════════════════════════════════
// 70 lines. Signal. Mark. Follow. Fade.
// ═══════════════════════════════════════════════════════════════════════════
