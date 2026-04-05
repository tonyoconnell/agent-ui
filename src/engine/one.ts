/**
 * ONE — The world
 *
 * Colony + TypeDB persistence + knowledge.
 * One layer. No wrapping.
 */

import { colony, type Colony, type Signal, type Edge } from './substrate'
import { read, readParsed, writeSilent, parseAnswers } from '@/lib/typedb'

export type Insight = { pattern: string; confidence: number }

export interface World extends Colony {
  actor: (id: string, kind?: string, opts?: { group?: string }) => ReturnType<Colony['spawn']>
  flow: (from: string, to: string) => { strengthen: (n?: number) => void; resist: (n?: number) => void }
  open: (n?: number) => { from: string; to: string; strength: number }[]
  blocked: () => { from: string; to: string }[]
  crystallize: () => Promise<Insight[]>
  recall: (match?: string) => Promise<Insight[]>
  sync: () => Promise<void>
  load: () => Promise<void>
}

export const world = (): World => {
  const net = colony()

  // ── TypeDB-synced pheromone ────────────────────────────────────────────

  const mark = (edge: string, strength = 1) => {
    net.mark(edge, strength)
    const [from, to] = edge.split('→')
    if (!from || !to) return
    writeSilent(`
      match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
      $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + ${strength}), has traversals ($t + 1);
    `)
  }

  const warn = (edge: string, strength = 1) => {
    net.warn(edge, strength)
    const [from, to] = edge.split('→')
    if (!from || !to) return
    writeSilent(`
      match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
      $e (source: $from, target: $to) isa path, has alarm $a;
      delete $a of $e; insert $e has alarm ($a + ${strength});
    `)
  }

  const fade = (rate = 0.1) => {
    net.fade(rate)
    writeSilent(`
      match $e isa path, has strength $s, has alarm $a;
      delete $s of $e; delete $a of $e;
      insert $e has strength ($s * ${1 - rate}), has alarm ($a * ${1 - rate * 2});
    `)
  }

  const enqueue = (s: Signal) => {
    net.enqueue(s)
    const uid = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
    const data = s.data ? JSON.stringify(s.data).replace(/"/g, '\\"') : ''
    writeSilent(`
      match $from isa unit, has uid "loop"; $to isa unit, has uid "${uid}";
      insert (sender: $from, receiver: $to) isa signal,
        has data "${data}", has amount 0.0, has success false,
        has ts ${new Date().toISOString().replace('Z', '')};
    `)
  }

  // ── Hydration ─────────────────────────────────────────────────────────

  const load = async () => {
    const answers = await read(`
      match $e (source: $from, target: $to) isa path, has strength $s, has alarm $a;
      $from has uid $fid; $to has uid $tid; select $fid, $tid, $s, $a;
    `)
    for (const row of parseAnswers(answers)) {
      net.scent[`${row.fid}→${row.tid}`] = row.s as number
      if ((row.a as number) > 0) net.alarm[`${row.fid}→${row.tid}`] = row.a as number
    }
    const pending = await read(`
      match (sender: $f, receiver: $to) isa signal, has success false, has data $d;
      $to has uid $tid; select $tid, $d;
    `).catch(() => '[]')
    for (const row of parseAnswers(pending as unknown[])) {
      net.enqueue({ receiver: row.tid as string, data: row.d })
    }
  }

  const sync = async () => {
    for (const [edge, strength] of Object.entries(net.scent)) {
      const [from, to] = edge.split('→')
      if (!from || !to) continue
      writeSilent(`
        match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
        insert (source: $from, target: $to) isa path,
          has strength ${strength}, has alarm ${net.alarm[edge] || 0}, has traversals 0, has revenue 0.0;
      `)
    }
  }

  // ── World layer ───────────────────────────────────────────────────────

  const actor = (id: string, kind = 'agent', opts?: { group?: string }) => {
    const uid = opts?.group ? `${opts.group}/${id}` : id
    writeSilent(`
      insert $u isa unit, has uid "${uid}", has unit-kind "${kind}", has status "active",
        has success-rate 0.5, has activity-score 0.0, has sample-count 0,
        has reputation 0.0, has balance 0.0, has generation 0;
    `).catch(() => {})
    return net.spawn(uid)
  }

  const flow = (from: string, to: string) => ({
    strengthen: (n = 1) => mark(`${from}→${to}`, n),
    resist: (n = 1) => warn(`${from}→${to}`, n),
  })

  const open = (n = 10) =>
    net.highways(n).map(h => {
      const [from, to] = h.path.split('→')
      return { from, to, strength: h.strength }
    })

  const blocked = () =>
    Object.entries(net.alarm)
      .filter(([e, a]) => a > (net.scent[e] || 0))
      .map(([e]) => { const [from, to] = e.split('→'); return { from, to } })

  const crystallize = async (): Promise<Insight[]> => {
    const strong = net.highways(100).filter(h => h.strength >= 20)
    writeSilent(`
      match $p isa path, has strength $s, has fade-rate $fr; $s >= 50.0; $fr > 0.01;
      delete $fr of $p; insert $p has fade-rate 0.01;
    `).catch(() => {})
    return strong.map(h => ({ pattern: h.path, confidence: Math.min(1, h.strength / 50) }))
  }

  const recall = async (match?: string): Promise<Insight[]> => {
    const q = match
      ? `match $h isa hypothesis, has statement $s, has p-value $p; $s contains "${match}"; select $s, $p;`
      : `match $h isa hypothesis, has statement $s, has p-value $p; select $s, $p;`
    const rows = await readParsed(q).catch(() => [])
    return rows.map(r => ({ pattern: r.s as string, confidence: 1 - (r.p as number) }))
  }

  return {
    ...net, mark, warn, fade, enqueue,
    actor, flow, open, blocked, crystallize, recall, sync, load,
  }
}
