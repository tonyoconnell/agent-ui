/**
 * BOOT — Wire the substrate. Start breathing.
 *
 * One function. Hydrate. Spawn. Tick.
 */

import { world } from './one'
import { asi } from './asi'
import { tick, type TickResult } from './loop'
import { readParsed } from '@/lib/typedb'
import type { Signal } from './substrate'

export const boot = async (complete: (prompt: string) => Promise<string>, interval = 10_000) => {
  const w = world()
  const o = asi(w, complete)

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
      await tick(w, o, complete).catch(() => {})
      await new Promise(r => setTimeout(r, interval))
    }
  })()

  return {
    world: w,
    orchestrator: o,
    signal: (s: Signal) => w.signal(s),
    stop: () => { alive = false; return loop },
  }
}
