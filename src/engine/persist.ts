/**
 * PERSIST — TypeDB layer for the substrate
 *
 * 40 lines. Same colony. Now it remembers.
 */

import { colony, type Colony } from './substrate'

type Query = (tql: string) => Promise<unknown>

export const persisted = (query: Query) => {
  const net = colony()
  const q = (tql: string) => query(tql).catch(() => {})

  const mark = (edge: string, strength = 1) => {
    net.mark(edge, strength)
    q(`match $e isa edge, has eid "${edge}", has weight $w;
       update $e has weight ($w + ${strength});`)
  }

  const alarm = (edge: string, strength = 1) => {
    q(`match $e isa edge, has eid "${edge}", has alarm $a;
       update $e has alarm ($a + ${strength});`)
  }

  const fade = (rate = 0.1) => {
    net.fade(rate)
    q(`match $e isa edge, has weight $w, has alarm $a;
       update $e has weight ($w * ${1 - rate}), has alarm ($a * ${1 - rate});`)
  }

  const sync = () => q(`
    ${Object.entries(net.scent).map(([e, w]) =>
      `insert $e isa edge, has eid "${e}", has weight ${w}, has alarm 0.0;`
    ).join('\n')}
  `)

  const load = async () => {
    const rows = await query(`match $e isa edge, has eid $id, has weight $w; return { $id, $w };`)
    ;(rows as Array<{ id: string; w: number }>).forEach(r => net.scent[r.id] = r.w)
  }

  return { ...net, mark, alarm, fade, sync, load }
}
