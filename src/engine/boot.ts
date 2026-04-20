/**
 * BOOT — Wire the substrate. Start breathing.
 *
 * One function. Hydrate. Spawn. Tick.
 */

import { readParsed } from '@/lib/typedb'
import { registerPaySkills } from './adl'
import { pheromoneWeight, setAuditPheromone } from './adl-cache'
import { connectAgentverse } from './agentverse-connect'
import { registerBridges } from './bridges'
import { registerBuilder } from './builder'
import { wireChairmanChain } from './chairman-chain'
import { tick } from './loop'
import { registerPayUnit } from './pay'
import { world } from './persist' // formerly one.ts
import type { Signal } from './world' // formerly substrate.ts

export const boot = async (complete?: (prompt: string) => Promise<string>, interval = 10_000) => {
  const w = world()

  // Hydrate pheromone + queue from TypeDB
  await w.load()

  // Cycle 4: close the last loop. Every ADL gate denial becomes a warn()
  // on the sender→receiver edge, so the substrate routes away from paths
  // that keep tripping gates. Security and learning share the same
  // mechanism — warn() is simultaneously a firewall response and a lesson.
  setAuditPheromone((rec) => {
    const weight = pheromoneWeight(rec.decision)
    if (weight <= 0) return
    w.warn(`${rec.sender}→${rec.receiver}`, weight)
  })

  // Spawn units from TypeDB
  const units = await readParsed(`match $u isa unit, has uid $id, has unit-kind $kind; select $id, $kind;`).catch(
    () => [],
  )
  for (const u of units) w.actor(u.id as string, u.kind as string)

  // Wire Chairman → CEO → Director → Specialist zero-LLM routing chain.
  // Seeds pheromone on tag edges so follow/select has data before any signals fly.
  wireChairmanChain(w)

  // Register chain bridge units (evm, sol, btc — no bridge:sui, Sui is home)
  registerBridges(w)

  // Register pay unit (Sui-native USDC commerce, L4 Marketplace)
  registerPayUnit(w)

  // Register pay skill schemas in TypeDB so PEP-4 has input/output
  // schemas to validate against. Idempotent — safe to call on every boot.
  await registerPaySkills().catch((e: unknown) =>
    console.warn('[boot] registerPaySkills failed:', e instanceof Error ? e.message : e),
  )

  // Bridge Agentverse — 2M agents routable as 'av:*' receivers
  // Pheromone in THIS world tracks which AV agents are reliable.
  // No-op when AGENTVERSE_API_KEY is unset; failures are silent (warn via dissolved).
  const av = await connectAgentverse(w).catch((err) => {
    console.warn('[boot] Agentverse connect failed:', err instanceof Error ? err.message : err)
    return null
  })

  // Register loop:feedback — the return-path signal.
  // After every W4 verify pass (or /close success), agents emit:
  //   { receiver: 'loop:feedback', data: { tags: [...], strength: rubricAvg, content: {...} } }
  // This unit marks each tag path proportionally to the rubric score.
  // strength >= 0.65 → mark (trail strengthens)
  // strength < 0.65  → warn(0.5) (specialist needed, not a failure)
  // Scope is in-memory only — never surfaces in group queries or know().
  w.add('loop').on('feedback', (data: unknown) => {
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

  // Breathe.
  //
  // Consecutive-failure backoff: if tick() rejects (usually TypeDB outage),
  // exponentially extend the sleep up to 8× interval so we don't hammer a
  // down dependency. One success resets the counter. Silent .catch() was
  // the old behavior — it hid outages behind advancing timers.
  let alive = true
  let failures = 0
  const MAX_FAILURES_FOR_BACKOFF = 3
  const loop = (async () => {
    while (alive) {
      try {
        await tick(w, complete)
        failures = 0
      } catch (err) {
        failures++
        console.warn(`[boot] tick failed (consecutive=${failures}):`, err instanceof Error ? err.message : err)
      }
      const backoff = Math.min(2 ** Math.max(0, failures - MAX_FAILURES_FOR_BACKOFF), 8)
      await new Promise((r) => setTimeout(r, interval * backoff))
    }
  })()

  return {
    world: w,
    agentverse: av, // null if AGENTVERSE_API_KEY not set
    signal: (s: Signal) => w.signal(s),
    ask: (s: Signal) => w.ask(s),
    enqueue: (s: Signal) => w.enqueue(s),
    stop: () => {
      alive = false
      return loop
    },
  }
}
