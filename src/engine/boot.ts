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

  // Register loop:feedback — the return-path signal.
  // After every W4 verify pass (or /close success), agents emit:
  //   { receiver: 'loop:feedback', data: { tags: [...], strength: rubricAvg, content: {...} } }
  // This unit marks each tag path proportionally to the rubric score.
  // strength >= 0.65 → mark (trail strengthens)
  // strength < 0.65  → warn(0.5) (specialist needed, not a failure)
  // Scope is in-memory only — never surfaces in group queries or know().
  w.add('loop:feedback').on('feedback', (data: unknown) => {
    const d = data as { tags?: string[]; strength?: number; outcome?: string } | null
    const tags = d?.tags ?? []
    const strength = d?.strength ?? 0
    const outcome = d?.outcome ?? 'result'
    for (const tag of tags) {
      const edge = `tag:${tag}`
      if (outcome === 'failure') w.warn(edge, 1)
      else if (outcome === 'dissolved') w.warn(edge, 0.5)
      else if (strength >= 0.65) w.mark(edge, strength * 5)
      else w.warn(edge, 0.5)
    }
  })

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
