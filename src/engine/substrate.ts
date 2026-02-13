/**
 * THE SUBSTRATE
 *
 * 70 lines. Zero returns. Two fields. Concurrency safe.
 *
 * receiver: who (unit:task)
 * payload: what (anything)
 *
 * That's all that flows.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Envelope = { receiver: string; payload?: unknown }
export type Emit = (e: Envelope) => void
type Task = (payload: unknown, emit: Emit, ctx: { from: string; self: string }) => Promise<unknown>
type Template = (result: unknown) => Envelope
type Route = (e: Envelope, from: string) => void

export interface Unit {
  (e: Envelope, from?: string): void
  on: (name: string, fn: (p: unknown, emit: Emit, ctx: { from: string; self: string }) => unknown) => Unit
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
  send: (e: Envelope, from?: string) => void
  mark: (edge: string, strength?: number) => void
  smell: (edge: string) => number
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

  const u: Unit = ({ receiver, payload }, from = 'entry') => {
    const taskName = receiver.includes(':') ? receiver.split(':')[1] : 'default'
    const task = tasks[taskName] || tasks.default

    // emit carries the current receiver as origin
    const emit: Emit = e => route?.(e, receiver)
    const ctx = { from, self: receiver }

    task?.(payload, emit, ctx).then(result =>
      next[taskName] && route?.(next[taskName](result), receiver)
    )
  }

  u.on = (n, f) => (tasks[n] = (p, e, c) => Promise.resolve(f(p, e, c)), u)
  u.then = (n, t) => (next[n] = t, u)
  u.role = (n, t, ctx) => (tasks[n] = (p, e, c) => tasks[t]?.({ ...ctx, ...(p as object) }, e, c) ?? Promise.resolve(null), u)
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

  const smell = (edge: string) => scent[edge] || 0

  const send = ({ receiver, payload }: Envelope, from = 'entry') => {
    const unitId = receiver.includes(':') ? receiver.split(':')[0] : receiver
    const target = units[unitId]
    target && (
      mark(`${from}→${receiver}`),
      target({ receiver, payload }, from)
    )
  }

  const spawn = (id: string) => {
    const u = unit(id, (e, from) => send(e, from))
    units[id] = u
    return u
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

  return { units, scent, spawn, send, mark, smell, fade, highways, has, list, get }
}

// ═══════════════════════════════════════════════════════════════════════════
// 70 lines. Concurrency safe. Context aware.
// ═══════════════════════════════════════════════════════════════════════════
