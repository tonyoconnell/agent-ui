/**
 * BOOT — Wire the substrate. Start breathing.
 *
 * One function. Hydrate. Spawn. Tick.
 */

import { readParsed } from '@/lib/typedb'
import { registerBuilder } from './builder'
import { tick } from './loop'
import { world } from './persist' // formerly one.ts
import type { Signal } from './world' // formerly substrate.ts

export const boot = async (complete?: (prompt: string) => Promise<string>, interval = 10_000) => {
  const w = world()

  // Hydrate pheromone + queue from TypeDB
  await w.load()

  // Spawn units from TypeDB
  const units = await readParsed(`match $u isa unit, has uid $id, has unit-kind $kind; select $id, $kind;`).catch(
    () => [],
  )
  for (const u of units) w.actor(u.id as string, u.kind as string)

  // Register builder unit with wave chain (W1→W4)
  // The simple complete adapter ignores model — callers needing model-aware routing
  // should call registerBuilder() directly with a model-aware complete function.
  if (complete) {
    registerBuilder(w, (prompt, _model) => complete(prompt).catch(() => null))
  }

  // Breathe
  let alive = true
  const loop = (async () => {
    while (alive) {
      await tick(w, complete).catch(() => {})
      await new Promise((r) => setTimeout(r, interval))
    }
  })()

  return {
    world: w,
    signal: (s: Signal) => w.signal(s),
    ask: (s: Signal) => w.ask(s),
    enqueue: (s: Signal) => w.enqueue(s),
    stop: () => {
      alive = false
      return loop
    },
  }
}
