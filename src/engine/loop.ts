/**
 * LOOP — The growth tick
 *
 * Select. Signal. Drain. Fade. Evolve. Crystallize. Hypothesize. Explore.
 * The substrate does the work. Each line makes it smarter.
 */

import { readParsed, writeSilent } from '@/lib/typedb'
import type { World } from './one'

type Complete = (prompt: string) => Promise<string>

export type TickResult = {
  cycle: number
  highways: { path: string; strength: number }[]
  evolved?: number
  crystallized?: number
  hypotheses?: number
  frontiers?: number
}

let cycle = 0
let lastDecay = 0
let lastEvolve = 0
let lastCrystallize = 0

export const tick = async (net: World, complete?: Complete): Promise<TickResult> => {
  const now = Date.now()
  cycle++
  const result: TickResult = { cycle, highways: [] }

  // L1: SELECT + EXECUTE — follow pheromone, send signal
  const next = net.select()
  next && net.signal({ receiver: next })

  // L1: DRAIN — process highest-priority queued signal
  net.drain()

  // L3: DECAY — every 5 minutes (asymmetric: alarm decays 2x)
  if (now - lastDecay > 300_000) {
    net.fade(0.05)
    lastDecay = now
  }

  // L5: EVOLVE — every 10 minutes, with cooldown + history
  if (complete && now - lastEvolve > 600_000) {
    const struggling = await readParsed(`
      match $u isa unit, has uid $id, has system-prompt $sp, has success-rate $sr,
            has sample-count $sc, has generation $g;
      $sr < 0.50; $sc >= 20;
      not { $u has last-evolved $le; $le > ${new Date(now - 86_400_000).toISOString().replace('Z', '')}; };
      select $id, $sp, $sr, $sc, $g;
    `).catch(() => [])

    for (const u of struggling) {
      const prompt = await complete(
        `Agent "${u.id}" has ${((u.sr as number) * 100).toFixed(0)}% success over ${u.sc} tasks (gen ${u.g}). Rewrite its prompt to improve:\n\n${u.sp}`
      ).catch(() => null)
      if (!prompt) continue
      // Save old prompt as hypothesis (L6: evolution creates knowledge)
      writeSilent(`
        insert $h isa hypothesis, has hid "evolve-${u.id}-gen${u.g}",
          has statement "gen ${u.g} prompt for ${u.id}: ${((u.sp as string) || '').slice(0, 200).replace(/"/g, "'")}",
          has hypothesis-status "testing", has observations-count 0, has p-value 1.0;
      `).catch(() => {})
      writeSilent(`
        match $u isa unit, has uid "${u.id}", has system-prompt $sp, has generation $g;
        delete $sp of $u; delete $g of $u;
        insert $u has system-prompt "${prompt.replace(/"/g, '\\"')}", has generation (${u.g} + 1),
               has last-evolved ${new Date(now).toISOString().replace('Z', '')};
      `)
    }
    lastEvolve = now
    result.evolved = struggling.length
  }

  // L6: CRYSTALLIZE + HYPOTHESIZE — every hour
  if (now - lastCrystallize > 3_600_000) {
    const insights = await net.crystallize()
    // Auto-generate hypotheses from strong paths
    for (const i of insights.filter(i => i.confidence >= 0.8)) {
      writeSilent(`
        insert $h isa hypothesis, has hid "path-${i.pattern.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${i.pattern} is proven (confidence ${i.confidence.toFixed(2)})",
          has hypothesis-status "confirmed", has observations-count ${cycle}, has p-value 0.01;
      `).catch(() => {})
    }
    // Auto-generate hypotheses from degrading paths (highways that faded)
    const fading = net.highways(50).filter(h => h.strength >= 10 && h.strength < 20)
    for (const f of fading) {
      writeSilent(`
        insert $h isa hypothesis, has hid "fade-${f.path.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${f.path} is degrading (strength ${f.strength.toFixed(1)})",
          has hypothesis-status "testing", has observations-count 0, has p-value 0.5;
      `).catch(() => {})
    }
    lastCrystallize = now
    result.crystallized = insights.length
    result.hypotheses = insights.filter(i => i.confidence >= 0.8).length + fading.length
  }

  // L7: FRONTIER — detect unexplored territory from tag clusters
  if (now - lastCrystallize === 0) { // runs alongside crystallize (same interval)
    const tagCounts = await readParsed(`
      match $sk isa skill, has tag $tag, has skill-id $sid;
      select $tag, $sid;
    `).catch(() => [])

    // Group by tag, check which tags have mostly unexplored edges
    const byTag: Record<string, string[]> = {}
    for (const r of tagCounts) {
      const tag = r.tag as string
      ;(byTag[tag] ||= []).push(r.sid as string)
    }

    const explored = new Set(Object.keys(net.scent).flatMap(e => e.split('→')))
    let frontierCount = 0
    for (const [tag, skills] of Object.entries(byTag)) {
      const unexplored = skills.filter(s => !explored.has(s))
      if (unexplored.length > skills.length * 0.7 && unexplored.length >= 3) {
        writeSilent(`
          insert $f isa frontier, has fid "tag-${tag}-${cycle}",
            has frontier-type "${tag}", has frontier-description "${unexplored.length} of ${skills.length} skills with tag '${tag}' are unexplored",
            has expected-value ${(unexplored.length / skills.length).toFixed(2)},
            has frontier-status "unexplored";
        `).catch(() => {})
        frontierCount++
      }
    }
    result.frontiers = frontierCount
  }

  result.highways = net.highways(10)
  return result
}
