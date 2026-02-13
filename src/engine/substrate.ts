/**
 * THE SUBSTRATE
 *
 * 50 lines. Zero returns. Two fields.
 *
 * receiver: who
 * payload: what
 *
 * That's all that flows.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Envelope = { receiver: string; payload?: unknown }
type Task = (p: unknown) => Promise<unknown>
type Template = (result: unknown) => Envelope
type Route = (e: Envelope) => void

export interface Unit {
  (e: Envelope): void
  on: (name: string, fn: (p: unknown) => unknown) => Unit
  then: (name: string, template: Template) => Unit
  id: string
}

export interface Colony {
  units: Record<string, Unit>
  scent: Record<string, number>
  spawn: (id: string) => Unit
  send: (e: Envelope, from?: string) => void
  fade: (rate?: number) => void
  highways: (limit?: number) => { edge: string; strength: number }[]
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIT — 15 lines
// ═══════════════════════════════════════════════════════════════════════════

export const unit = (id: string, route?: Route): Unit => {
  const tasks: Record<string, Task> = {}
  const next: Record<string, Template> = {}

  const u: Unit = ({ receiver, payload }) => {
    const task = tasks[receiver] || tasks.default
    task?.(payload).then(result =>
      next[receiver] && route?.(next[receiver](result))
    )
  }

  u.on = (n, f) => (tasks[n] = p => Promise.resolve(f(p)), u)
  u.then = (n, t) => (next[n] = t, u)
  u.id = id
  return u
}

// ═══════════════════════════════════════════════════════════════════════════
// COLONY — 25 lines
// ═══════════════════════════════════════════════════════════════════════════

export const colony = (): Colony => {
  const units: Record<string, Unit> = {}
  const scent: Record<string, number> = {}

  const send = ({ receiver, payload }: Envelope, from = 'entry') => {
    const target = units[receiver]
    target && (
      scent[`${from}→${receiver}`] = (scent[`${from}→${receiver}`] || 0) + 1,
      target({ receiver, payload })
    )
  }

  const spawn = (id: string) => {
    const u = unit(id, e => send(e, id))
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

  return { units, scent, spawn, send, fade, highways }
}

// ═══════════════════════════════════════════════════════════════════════════
// 50 lines. Two fields. The substrate.
// ═══════════════════════════════════════════════════════════════════════════
