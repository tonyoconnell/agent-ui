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

export type Signal = { receiver: string; data?: unknown; after?: number }
export type Emit = (s: Signal) => void
export type Edge = { path: string; strength: number }
type Task = (data: unknown, emit: Emit, ctx: { from: string; self: string }) => Promise<unknown>
type Template = (result: unknown) => Signal
type Route = (s: Signal, from: string) => void

type SignalData = { marks?: boolean; weight?: number; [k: string]: unknown }
const asData = (d: unknown): SignalData => (d && typeof d === 'object' ? (d as SignalData) : {})

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
  latency: Record<string, number>
  revenue: Record<string, number>
  queue: Signal[]
  add: (id: string) => Unit
  remove: (id: string) => void
  signal: (s: Signal, from?: string) => void
  ask: (
    s: Signal,
    from?: string,
    timeout?: number,
  ) => Promise<{ result?: unknown; timeout?: boolean; dissolved?: boolean; failure?: boolean }>
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
  recordLatency: (path: string, ms: number) => void
  recordRevenue: (path: string, amount: number) => void
  isHighway: (path: string, threshold?: number) => boolean
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

    const emit: Emit = (s) => route?.(s, receiver)
    const ctx = { from, self: receiver }

    const taskResult = task?.(data, emit, ctx)
    if (taskResult) {
      taskResult
        .then((result) => {
          // Auto-reply: if signal had replyTo, send result back (closes ask())
          const replyTo = (data as Record<string, unknown>)?.replyTo as string
          const isFailure = result === null || result === undefined

          if (isFailure && replyTo) {
            // Task produced no result → failure
            route?.({ receiver: replyTo, data: { failure: true } }, receiver)
          } else if (replyTo) {
            route?.({ receiver: replyTo, data: result }, receiver)
          }

          // Continuation: fire .then() template (only if task succeeded)
          if (!isFailure) {
            next[taskName] && route?.(next[taskName](result), receiver)
          }
        })
        .catch((err) => {
          // Task threw an error → failure
          const replyTo = (data as Record<string, unknown>)?.replyTo as string
          if (replyTo) {
            route?.({ receiver: replyTo, data: { failure: true } }, receiver)
          }
        })
    }
  }

  u.on = (n, f) => (
    (tasks[n] = (d, e, c) => {
      try {
        const r = f(d, e, c)
        return r instanceof Promise ? r : Promise.resolve(r)
      } catch {
        return Promise.resolve(undefined)
      }
    }),
    u
  )
  u.then = (n, t) => ((next[n] = t), u)
  u.role = (n, t, ctx) => (
    (tasks[n] = (d, e, c) => tasks[t]?.({ ...ctx, ...(d as object) }, e, c) ?? Promise.resolve(null)), u
  )
  u.has = (n) => n in tasks
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
  const latency: Record<string, number> = {}
  const revenue: Record<string, number> = {}
  const queue: Signal[] = []

  // ── Routing index ─────────────────────────────────────────────────────────
  // typeIndex: maps each unit-id segment → set of edges that contain it.
  // Lets follow/select scan only the relevant edges instead of all of strength.
  // Edges are never removed from typeIndex (stale entries skipped via strength lookup).
  const typeIndex: Record<string, Set<string>> = {}
  const indexEdge = (edge: string) => {
    for (const seg of edge.split('→')) {
      const type = seg.split(':')[0]
      if (!typeIndex[type]) typeIndex[type] = new Set()
      typeIndex[type].add(edge)
    }
  }

  // sortedCache: lazily rebuilt sorted array for highways().
  // Invalidated on every mark/warn/fade; rebuilt once per read cycle.
  let sortedCache: Edge[] | null = null
  const invalidate = () => {
    sortedCache = null
  }
  const sorted = (): Edge[] => {
    if (sortedCache) return sortedCache
    sortedCache = Object.entries(strength)
      .map(([path, s]) => ({ path, strength: s - (resistance[path] || 0) }))
      .filter((e) => e.strength > 0)
      .sort((a, b) => b.strength - a.strength)
    return sortedCache
  }

  const mark = (path: string, amount = 1) => {
    if (!(path in strength)) indexEdge(path)
    strength[path] = (strength[path] || 0) + amount
    peak[path] = Math.max(peak[path] || 0, strength[path])
    lastUsed[path] = Date.now()
    invalidate()
  }

  const warn = (path: string, amount = 1) => {
    resistance[path] = (resistance[path] || 0) + amount
    invalidate()
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
  const ask = (
    s: Signal,
    from = 'entry',
    timeout = 30000,
  ): Promise<{ result?: unknown; timeout?: boolean; dissolved?: boolean; failure?: boolean }> =>
    new Promise((resolve) => {
      const unitId = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
      if (!units[unitId]) {
        resolve({ dissolved: true })
        return
      } // Fix 4: dissolution is visible
      // rid must NOT contain ':' — signal routing splits on ':' to get unit ID
      const rid = `ask${Date.now()}${Math.random().toString(36).slice(2, 6)}`
      const u = unit(rid, (reply) => signal(reply, rid))
      u.on('default', (data) => {
        delete units[rid]
        if ((data as Record<string, unknown>)?.failure === true) {
          resolve({ failure: true })
        } else {
          resolve({ result: data })
        }
        // Return null to prevent this from routing further
        return null
      })
      units[rid] = u
      signal({ ...s, data: { ...((s.data as object) || {}), replyTo: rid } }, from)
      setTimeout(() => {
        delete units[rid]
        resolve({ timeout: true })
      }, timeout) // Fix 1: timeout ≠ failure
    })

  // queue: signals waiting to be consumed, drained by priority
  const enqueue = (s: Signal) => queue.push(s)
  const drain = (): Signal | null => {
    if (!queue.length) return null
    // Skip signals scheduled for the future
    const now = Date.now()
    const ready = queue.filter((s) => !s.after || s.after <= now)
    if (!ready.length) return null
    // P0 first: find highest priority signal (lower P number = higher priority)
    let best = 0
    for (let i = 1; i < ready.length; i++) {
      const pi = ((ready[i].data as Record<string, unknown>)?.priority as string) || 'P9'
      const pb = ((ready[best].data as Record<string, unknown>)?.priority as string) || 'P9'
      if (pi < pb) best = i
    }
    const s = ready[best]
    queue.splice(queue.indexOf(s), 1)
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
      if (uid === id) {
        signal(queue[i])
        queue.splice(i, 1)
      }
    }
    return u
  }

  // unit stops receiving. trails remain, fade naturally
  const remove = (id: string) => {
    delete units[id]
  }

  // exact segment match: "analyst" matches "scout→analyst:process" but "an" doesn't
  const matchEdge = (edge: string, type: string) => edge.split('→').some((s) => s.split(':')[0] === type)

  // weight factors shared by follow/select
  const edgeWeight = (e: string, net: number, sensitivity: number) => {
    const latPenalty = 1 / (1 + (latency[e] || 0) / 1000)
    const revBoost = 1 + Math.log1p(revenue[e] || 0)
    return (1 + Math.max(0, net) * sensitivity) * latPenalty * revBoost
  }

  // follow strongest trail, penalized by resistance, boosted by revenue, penalized by latency
  // Uses typeIndex when type given: O(k) where k = edges for that type, not O(n) total.
  const follow = (type?: string) => {
    const edges = type
      ? typeIndex[type]
        ? [...typeIndex[type]].filter((e) => e in strength)
        : []
      : Object.keys(strength)
    let bestEdge: string | null = null
    let bestW = -Infinity
    for (const e of edges) {
      if (type && !matchEdge(e, type)) continue
      const net = (strength[e] || 0) - (resistance[e] || 0)
      const w = edgeWeight(e, net, 1)
      if (w > 1 && w > bestW) {
        bestW = w
        bestEdge = e
      }
    }
    return bestEdge?.split('→').pop()?.split(':')[0] || null
  }

  // STAN: Stigmergic A* Navigation — weight = (1 + pheromone × sensitivity) × latPenalty × revBoost
  // sensitivity=0 → pure exploration (scout), sensitivity=1 → follow highways (harvester)
  // Uses typeIndex when type given: O(k) instead of O(n).
  const select = (type?: string, sensitivity = 0.7) => {
    const edges = type
      ? typeIndex[type]
        ? [...typeIndex[type]].filter((e) => e in strength)
        : []
      : Object.keys(strength)
    const viable: [string, number][] = []
    for (const e of edges) {
      if (type && !matchEdge(e, type)) continue
      viable.push([e, edgeWeight(e, (strength[e] || 0) - (resistance[e] || 0), sensitivity)])
    }
    if (!viable.length) return null
    const pick = (e: string) => e.split('→').pop()?.split(':')[0] || null
    const total = viable.reduce((sum, [, w]) => sum + w, 0)
    let r = Math.random() * total
    for (const [e, w] of viable) {
      r -= w
      if (r <= 0) return pick(e)
    }
    return pick(viable.at(-1)![0])
  }

  // asymmetric: resistance decays 2x faster (failures forgive)
  // seasonal: unused edges decay faster (up to 2x at 24h+)
  // floor: strength never drops below peak × 0.05 (ghost trails survive)
  const fade = (r = 0.1) => {
    for (const e in strength) {
      const age = (Date.now() - (lastUsed[e] || 0)) / 3_600_000
      const seasonal = 1 + Math.min(age, 24) / 24
      strength[e] *= 1 - r * seasonal
      const floor = (peak[e] || 0) * 0.05
      if (strength[e] < floor) strength[e] = floor
      if (strength[e] < 0.01) {
        delete strength[e]
        delete peak[e]
        delete lastUsed[e]
      }
    }
    for (const e in resistance) {
      resistance[e] *= 1 - r * 2
      resistance[e] < 0.01 && delete resistance[e]
    }
    invalidate()
  }

  // highways: O(1) on cache hit (common case — same sorted order between marks)
  const highways = (limit = 10): Edge[] => sorted().slice(0, limit)

  const recordLatency = (path: string, ms: number) => {
    latency[path] = latency[path] ? latency[path] * 0.7 + ms * 0.3 : ms
  }

  const recordRevenue = (path: string, amount: number) => {
    revenue[path] = (revenue[path] || 0) + amount
  }

  const isHighway = (path: string, threshold = 20) => (strength[path] || 0) - (resistance[path] || 0) >= threshold

  const has = (id: string) => id in units
  const list = () => Object.keys(units)
  const get = (id: string) => units[id]

  return {
    units,
    strength,
    resistance,
    peak,
    lastUsed,
    latency,
    revenue,
    queue,
    add,
    remove,
    signal,
    ask,
    enqueue,
    drain,
    pending,
    mark,
    warn,
    sense,
    danger,
    follow,
    select,
    fade,
    highways,
    recordLatency,
    recordRevenue,
    isHighway,
    has,
    list,
    get,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Signal. Mark. Warn. Follow. Fade. Highway. Queue.
// ═══════════════════════════════════════════════════════════════════════════
