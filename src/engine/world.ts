/**
 * THE SUBSTRATE
 *
 * Two fields. Dual strength. Queue. Concurrency safe.
 *
 * receiver: who (unit:task)
 * data: what (anything)
 * data.marks: false to observe without marking trails
 * data.weight: override default mark weight
 *
 * Signal. Mark. Warn. Follow. Fade. Highway. Queue.
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

export interface World {
  units: Record<string, Unit>
  strength: Record<string, number>
  resistance: Record<string, number>
  peak: Record<string, number>
  lastUsed: Record<string, number>
  queue: Signal[]
  add: (id: string) => Unit
  remove: (id: string) => void
  signal: (s: Signal, from?: string) => void
  ask: (s: Signal, from?: string, timeout?: number) => Promise<{ result?: unknown; timeout?: boolean; dissolved?: boolean }>
  enqueue: (s: Signal) => void
  drain: () => Signal | null
  pending: () => number
  mark: (path: string, strength?: number) => void
  warn: (path: string, strength?: number) => void
  sense: (path: string) => number
  danger: (path: string) => number
  follow: (type?: string) => string | null
  select: (type?: string, sensitivity?: number) => string | null
  fade: (rate?: number) => void
  highways: (limit?: number) => Edge[]
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

    task?.(data, emit, ctx).then(result => {
      // Auto-reply: if signal had replyTo, send result back (closes ask())
      const replyTo = (data as Record<string, unknown>)?.replyTo as string
      replyTo && route?.({ receiver: replyTo, data: result }, receiver)
      // Continuation: fire .then() template
      next[taskName] && route?.(next[taskName](result), receiver)
    })
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

export const world = (): World => {
  const units: Record<string, Unit> = {}
  const strength: Record<string, number> = {}
  const resistance: Record<string, number> = {}
  const peak: Record<string, number> = {}
  const lastUsed: Record<string, number> = {}
  const queue: Signal[] = []

  const mark = (path: string, amount = 1) => {
    strength[path] = (strength[path] || 0) + amount
    peak[path] = Math.max(peak[path] || 0, strength[path])
    lastUsed[path] = Date.now()
  }

  const warn = (path: string, amount = 1) => {
    resistance[path] = (resistance[path] || 0) + amount
  }

  const sense = (path: string) => strength[path] || 0
  const danger = (path: string) => resistance[path] || 0

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

  // ask: signal and wait for reply. Returns { result, timeout, dissolved }.
  const ask = (s: Signal, from = 'entry', timeout = 30000): Promise<{ result?: unknown; timeout?: boolean; dissolved?: boolean }> =>
    new Promise(resolve => {
      const unitId = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
      if (!units[unitId]) { resolve({ dissolved: true }); return }  // Fix 4: dissolution is visible
      const rid = `r:${Date.now()}`
      const u = unit(rid, (reply) => signal(reply, rid))
      u.on('default', (result) => { delete units[rid]; resolve({ result }) })
      units[rid] = u
      signal({ ...s, data: { ...(s.data as object || {}), replyTo: rid } }, from)
      setTimeout(() => { delete units[rid]; resolve({ timeout: true }) }, timeout)  // Fix 1: timeout ≠ failure
    })

  // queue: signals waiting to be consumed, drained by priority
  const enqueue = (s: Signal) => queue.push(s)
  const drain = (): Signal | null => {
    if (!queue.length) return null
    // P0 first: find highest priority signal (lower P number = higher priority)
    let best = 0
    for (let i = 1; i < queue.length; i++) {
      const pi = ((queue[i].data as Record<string, unknown>)?.priority as string) || 'P9'
      const pb = ((queue[best].data as Record<string, unknown>)?.priority as string) || 'P9'
      if (pi < pb) best = i
    }
    const [s] = queue.splice(best, 1)
    signal(s)
    return s
  }
  const pending = () => queue.length

  const add = (id: string) => {
    const u = unit(id, (s, from) => signal(s, from))
    units[id] = u
    // drain queued signals for this unit
    let i = queue.length
    while (i--) {
      const uid = queue[i].receiver.includes(':') ? queue[i].receiver.split(':')[0] : queue[i].receiver
      if (uid === id) { signal(queue[i]); queue.splice(i, 1) }
    }
    return u
  }

  // unit stops receiving. trails remain, fade naturally
  const remove = (id: string) => { delete units[id] }

  // exact segment match: "analyst" matches "scout→analyst:process" but "an" doesn't
  const matchEdge = (edge: string, type: string) =>
    edge.split('→').some(s => s.split(':')[0] === type)

  // follow strongest trail, penalized by resistance
  const follow = (type?: string) => {
    const trails = Object.entries(strength)
      .filter(([e]) => !type || matchEdge(e, type))
      .map(([e, s]) => [e, s - (resistance[e] || 0)] as const)
      .filter(([, s]) => s > 0)
      .sort(([, a], [, b]) => b - a)
    return trails[0]?.[0].split('→').pop()?.split(':')[0] || null
  }

  // STAN: Stigmergic A* Navigation — weight = 1 + pheromone × sensitivity
  // sensitivity=0 → pure exploration (scout), sensitivity=1 → follow highways (harvester)
  const select = (type?: string, sensitivity = 0.7) => {
    const viable = Object.entries(strength)
      .filter(([e]) => !type || matchEdge(e, type))
      .map(([e, s]) => [e, 1 + Math.max(0, s - (resistance[e] || 0)) * sensitivity] as const)
    if (!viable.length) return null
    const pick = (e: string) => e.split('→').pop()?.split(':')[0] || null
    const total = viable.reduce((sum, [, w]) => sum + w, 0)
    let r = Math.random() * total
    for (const [e, w] of viable) { r -= w; if (r <= 0) return pick(e) }
    return pick(viable.at(-1)![0])
  }

  // asymmetric: resistance decays 2x faster (failures forgive)
  // seasonal: unused edges decay faster (up to 2x at 24h+)
  // floor: strength never drops below peak × 0.05 (ghost trails survive)
  const fade = (r = 0.1) => {
    for (const e in strength) {
      const age = (Date.now() - (lastUsed[e] || 0)) / 3_600_000
      const seasonal = 1 + Math.min(age, 24) / 24
      strength[e] *= (1 - r * seasonal)
      const floor = (peak[e] || 0) * 0.05
      if (strength[e] < floor) strength[e] = floor
      if (strength[e] < 0.01) { delete strength[e]; delete peak[e]; delete lastUsed[e] }
    }
    for (const e in resistance) { resistance[e] *= (1 - r * 2); resistance[e] < 0.01 && delete resistance[e] }
  }

  const highways = (limit = 10): Edge[] =>
    Object.entries(strength)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path, strength]) => ({ path, strength }))

  const has = (id: string) => id in units
  const list = () => Object.keys(units)
  const get = (id: string) => units[id]

  return { units, strength, resistance, peak, lastUsed, queue, add, remove, signal, ask, enqueue, drain, pending, mark, warn, sense, danger, follow, select, fade, highways, has, list, get }
}

// ═══════════════════════════════════════════════════════════════════════════
// Signal. Mark. Warn. Follow. Fade. Highway. Queue.
// ═══════════════════════════════════════════════════════════════════════════
