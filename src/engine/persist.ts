/**
 * PERSIST — TypeDB layer for the substrate
 *
 * Wraps colony with TypeDB persistence.
 * Every mark/warn/fade syncs to TypeDB.
 * load() hydrates colony from TypeDB on startup.
 *
 * Marks gate: signal.data.marks = false → observe without pheromone.
 * Asymmetric fade: trail decays at rate, alarm decays 2x faster.
 */

import { colony, type Colony, type Signal } from './substrate'
import { read, writeSilent, parseAnswers } from '@/lib/typedb'

export interface PersistedColony extends Colony {
  sync: () => Promise<void>
  load: () => Promise<void>
}

export const persisted = (): PersistedColony => {
  const net = colony()

  const mark = (edge: string, strength = 1) => {
    net.mark(edge, strength)
    const [from, to] = edge.split('→')
    if (!from || !to) return
    writeSilent(`
      match
        $from isa unit, has uid "${from.trim()}";
        $to isa unit, has uid "${to.trim()}";
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
      match
        $from isa unit, has uid "${from.trim()}";
        $to isa unit, has uid "${to.trim()}";
        $e (source: $from, target: $to) isa path, has alarm $a;
      delete $a of $e;
      insert $e has alarm ($a + ${strength});
    `)
  }

  // asymmetric: trail decays at rate, alarm decays 2x faster
  const fade = (rate = 0.1) => {
    net.fade(rate)
    writeSilent(`
      match $e isa path, has strength $s, has alarm $a;
      delete $s of $e; delete $a of $e;
      insert $e has strength ($s * ${1 - rate}), has alarm ($a * ${1 - rate * 2});
    `)
  }

  const sync = async () => {
    for (const [edge, strength] of Object.entries(net.scent)) {
      const [from, to] = edge.split('→')
      if (!from || !to) continue
      const a = net.alarm[edge] || 0
      await writeSilent(`
        match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
        insert (source: $from, target: $to) isa path,
          has strength ${strength}, has alarm ${a}, has traversals 0, has revenue 0.0;
      `)
    }
  }

  const load = async () => {
    const answers = await read(`
      match $e (source: $from, target: $to) isa path, has strength $s, has alarm $a;
      $from has uid $fid; $to has uid $tid;
      select $fid, $tid, $s, $a;
    `)
    for (const row of parseAnswers(answers)) {
      const edge = `${row.fid}→${row.tid}`
      net.scent[edge] = row.s as number
      if ((row.a as number) > 0) net.alarm[edge] = row.a as number
    }
  }

  return { ...net, mark, warn, fade, sync, load }
}
