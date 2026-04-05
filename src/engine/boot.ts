/**
 * BOOT — Wire the substrate. Start breathing.
 *
 * One function. Hydrate. Spawn. Tick.
 */

import { world } from './one'
import { tick } from './loop'
import { readParsed } from '@/lib/typedb'
import type { Signal } from './substrate'

export const boot = async (complete: (prompt: string) => Promise<string>, interval = 10_000) => {
  const w = world()

  // Hydrate pheromone from TypeDB
  await w.load()

  // Spawn units from TypeDB
  const units = await readParsed(
    `match $u isa unit, has uid $id, has unit-kind $kind; select $id, $kind;`
  ).catch(() => [])
  for (const u of units) w.actor(u.id as string, u.kind as string)

  // Breathe
  let alive = true
  const loop = (async () => {
    while (alive) {
      await tick(w, complete).catch(() => {})
      await new Promise(r => setTimeout(r, interval))
    }
  })()

  return {
    world: w,
    signal: (s: Signal) => w.signal(s),
    enqueue: (s: Signal) => w.enqueue(s),
    stop: () => { alive = false; return loop },
  }
}
