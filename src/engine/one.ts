/**
 * ONE — The 6-dimension runtime
 *
 * 70 lines. Groups, Actors, Things, Connections, Events, Knowledge.
 */

import { type Unit } from './substrate'
import { persisted, type PersistedColony } from './persist'
import { readParsed, writeSilent } from '@/lib/typedb'

type Opts = { group?: string }
export type Insight = { pattern: string; confidence: number }

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

  // 5. Events (automatic from signals)

  // 6. Knowledge — durable patterns that survive fade
  crystallize: () => Insight[]
  recall: (match?: string) => Insight[]
  hypothesize: (insights: Insight[]) => void
  explore: () => void

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
  const knowledge: Record<string, number> = {}  // pattern → confidence (survives fade)

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

  // crystallize: promote strong flows to durable knowledge. returns new insights
  const crystallize = (): Insight[] => {
    const strong = open(100).filter(f => f.strength >= 20)
    const fresh: Insight[] = []
    for (const f of strong) {
      const pattern = `${f.from}→${f.to}`
      const confidence = Math.min(1, f.strength / 50)
      if (!knowledge[pattern] || knowledge[pattern] < confidence) {
        knowledge[pattern] = confidence
        fresh.push({ pattern, confidence })
      }
    }
    // TypeDB: slow fade-rate on proven trails so they persist longer
    readParsed(`
      match $tr isa trail, has trail-pheromone $tp, has completions $c, has fade-rate $fr;
      $tp >= 70.0; $c >= 10; $fr > 0.01;
      select $tr, $tp, $c;
    `).then(proven => {
      proven.length && writeSilent(`
        match $tr isa trail, has trail-pheromone $tp, has completions $c, has fade-rate $fr;
        $tp >= 70.0; $c >= 10; $fr > 0.01;
        delete $fr of $tr;
        insert $tr has fade-rate 0.01;
      `)
    }).catch(() => {})
    return fresh
  }

  // recall: query crystallized knowledge. match filters by exact segment
  const recall = (match?: string): Insight[] =>
    Object.entries(knowledge)
      .filter(([p]) => !match || p.split('→').some(s => s === match))
      .map(([pattern, confidence]) => ({ pattern, confidence }))
      .sort((a, b) => b.confidence - a.confidence)

  // L6: detect pattern changes, create hypotheses in TypeDB
  const hypothesize = (insights: Insight[]) => {
    const now = Date.now()
    const current = new Set(open(100).filter(f => f.strength >= 20).map(f => `${f.from}→${f.to}`))

    // New patterns → emerged
    for (const i of insights) {
      writeSilent(`insert $h isa hypothesis, has hid "auto:emerge:${i.pattern}:${now}",
        has statement "Pattern ${i.pattern} emerged (confidence ${i.confidence.toFixed(2)})",
        has hypothesis-status "pending", has observations-count 1, has p-value 1.0, has action-ready false;`)
    }

    // Known patterns that weakened → degraded
    for (const k of recall()) {
      !current.has(k.pattern) && writeSilent(`insert $h isa hypothesis, has hid "auto:degrade:${k.pattern}:${now}",
        has statement "Pattern ${k.pattern} degraded from knowledge",
        has hypothesis-status "pending", has observations-count 1, has p-value 1.0, has action-ready false;`)
    }
  }

  // L7: detect frontier clusters from exploratory tasks
  const explore = () => {
    readParsed(`
      match $t isa task, has status "todo", has task-type $tt;
            not { $tr (destination-task: $t) isa trail; };
      select $tt;
    `).then(exp => {
      const counts: Record<string, number> = {}
      for (const e of exp) counts[e.tt as string] = (counts[e.tt as string] || 0) + 1
      const now = Date.now()
      for (const [type, count] of Object.entries(counts)) {
        count >= 3 && writeSilent(`insert $f isa frontier, has fid "auto:${type}:${now}",
          has frontier-type "${type}", has frontier-description "${count} unexplored ${type} tasks",
          has expected-value ${Math.min(1, count / 10)}, has frontier-status "unexplored";`)
      }
    }).catch(() => {})
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

  return { ...net, group, actor, thing, flow, crystallize, recall, hypothesize, explore, open, blocked, best, proven, confidence }
}

// Legacy alias
export type One = World
