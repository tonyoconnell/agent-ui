/**
 * PERSIST — TypeDB layer for the substrate
 *
 * Wraps colony with TypeDB persistence.
 * Every mark/alarm/fade syncs to TypeDB via src/lib/typedb.ts.
 * load() hydrates colony from TypeDB on startup.
 *
 * Browser → Worker → TypeDB Cloud.
 * Server → TypeDB Cloud directly.
 */

import { colony, type Colony } from './substrate'
import { read, write, writeSilent, parseAnswers } from '@/lib/typedb'

export interface PersistedColony extends Colony {
  alarm: (edge: string, strength?: number) => void
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
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${to}";
        $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + ${strength}), has traversals ($t + 1);
    `)
  }

  const alarm = (edge: string, strength = 1) => {
    const [from, to] = edge.split('→')
    if (!from || !to) return
    writeSilent(`
      match
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${to}";
        $e (source: $from, target: $to) isa path, has alarm $a;
      delete $a of $e;
      insert $e has alarm ($a + ${strength});
    `)
  }

  const fade = (rate = 0.1) => {
    net.fade(rate)
    // Asymmetric: trail decays at rate, alarm decays 2x faster
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
      await write(`
        match $from isa unit, has uid "${from}"; $to isa unit, has uid "${to}";
        insert (source: $from, target: $to) isa path,
          has strength ${strength}, has alarm 0.0, has traversals 0, has revenue 0.0;
      `).catch(() => {})
    }
  }

  const load = async () => {
    const answers = await read(`
      match $e (source: $from, target: $to) isa path, has strength $s;
      $from has uid $fid; $to has uid $tid;
      select $fid, $tid, $s;
    `)
    for (const row of parseAnswers(answers)) {
      net.scent[`${row.fid}→${row.tid}`] = row.s as number
    }
  }

  return { ...net, mark, alarm, fade, sync, load }
}
