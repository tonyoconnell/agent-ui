/**
 * ONE — The 6-dimension runtime
 *
 * 70 lines. Groups, Actors, Things, Connections, Events, Knowledge.
 */

import { type Unit } from './substrate'
import { persisted, type PersistedColony } from './persist'

type Opts = { group?: string }

export interface World extends PersistedColony {
  // 1. Groups
  group: (id: string, type?: string, opts?: { parent?: string }) => void

  // 2. Actors
  actor: (id: string, type?: string, opts?: Opts) => Unit

  // 3. Things
  thing: (id: string, type?: string, opts?: Opts) => void

  // 4. Connections (flows)
  flow: (from: string, to: string, opts?: Opts) => {
    strengthen: (n?: number) => void
    resist: (n?: number) => void
  }

  // 5. Events (automatic)

  // 6. Knowledge
  crystallize: () => void

  // Queries
  open: (n?: number, opts?: Opts) => { from: string; to: string; strength: number }[]
  blocked: (opts?: Opts) => { from: string; to: string }[]
  best: (type: string, opts?: Opts) => string | null
  proven: (opts?: Opts) => string[]
  confidence: (type: string, opts?: Opts) => number
}

export const world = (): World => {
  const net = persisted()
  const groups: Record<string, { type: string; parent?: string }> = {}
  const actors: Record<string, { type: string; group?: string }> = {}
  const things: Record<string, { type: string; group?: string }> = {}

  const group = (id: string, type = 'group', opts?: { parent?: string }) => {
    groups[id] = { type, parent: opts?.parent }
  }

  const actor = (id: string, type = 'actor', opts?: Opts) => {
    actors[id] = { type, group: opts?.group }
    return net.spawn(id)
  }

  const thing = (id: string, type = 'thing', opts?: Opts) => {
    things[id] = { type, group: opts?.group }
  }

  const flow = (from: string, to: string, opts?: Opts) => {
    const key = opts?.group ? `${opts.group}:${from}→${to}` : `${from}→${to}`
    return {
      strengthen: (n = 1) => net.mark(key, n),
      resist: (n = 1) => net.warn(key, n),
    }
  }

  const crystallize = () => {
    // Patterns emerge from strong flows - future: persist to Knowledge dimension
  }

  const filterByGroup = (edges: { path: string; strength: number }[], group?: string) =>
    group ? edges.filter(e => e.path.startsWith(`${group}:`)) : edges

  const open = (n = 10, opts?: Opts) =>
    filterByGroup(net.highways(n * 2), opts?.group)
      .slice(0, n)
      .map(h => {
        const [from, to] = h.path.replace(/^[^:]+:/, '').split('→')
        return { from, to, strength: h.strength }
      })

  const blocked = (opts?: Opts) =>
    Object.entries(net.alarm)
      .filter(([e, a]) => a > (net.scent[e] || 0) && (!opts?.group || e.startsWith(`${opts.group}:`)))
      .map(([e]) => {
        const [from, to] = e.replace(/^[^:]+:/, '').split('→')
        return { from, to }
      })

  const best = (type: string, opts?: Opts) => {
    const candidates = open(50, opts).filter(f => actors[f.to]?.type === type)
    return candidates[0]?.to || null
  }

  const proven = (opts?: Opts) =>
    open(100, opts).filter(f => f.strength >= 20).map(f => f.to)

  const confidence = (type: string, opts?: Opts) => {
    const relevant = open(100, opts).filter(f => actors[f.to]?.type === type)
    return relevant.reduce((sum, f) => sum + f.strength, 0) / 100
  }

  return { ...net, group, actor, thing, flow, crystallize, open, blocked, best, proven, confidence }
}

// Legacy alias
export type One = World
