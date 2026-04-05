/**
 * LOOP — The growth tick
 *
 * The closed loop: select → ask → mark/warn → fade → evolve → know → frontier.
 * Every tick makes the colony smarter. No external feedback needed.
 */

import { readParsed, writeSilent } from '@/lib/typedb'
import type { PersistentWorld } from './persist'

type Complete = (prompt: string) => Promise<string>

// ── Named constants ─────────────────────────────────────────────────────
const HIGHWAY_THRESHOLD = 20       // net strength to skip LLM (confidence-based routing)
const CHAIN_CAP = 5                // max chain depth multiplier
const FADE_INTERVAL = 300_000      // 5 minutes between decay cycles
const FADE_RATE = 0.05
const EVOLUTION_INTERVAL = 600_000      // 10 minutes between evolution sweeps
const EVOLUTION_COOLDOWN = 86_400_000   // 24 hours between rewrites per agent
const EVOLUTION_THRESHOLD = 0.50        // success rate below which agents evolve
const PRIORITY_EVOLUTION_THRESHOLD = 0.65  // relaxed threshold for priority units
const EVOLUTION_MIN_SAMPLES = 20
const REVENUE_SKIP_THRESHOLD = 1.0      // revenue above which low-success agents are spared
const REVENUE_MIN_SUCCESS = 0.30        // min success rate even for profitable agents
const CRYSTALLIZE_INTERVAL = 3_600_000  // 1 hour between knowledge cycles

export type TickResult = {
  cycle: number
  selected: string | null
  success: boolean | null
  skipped?: boolean
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
let previousTarget: string | null = null
let chainDepth = 0
let priorityEvolve: string[] = []

export const tick = async (net: PersistentWorld, complete?: Complete): Promise<TickResult> => {
  const now = Date.now()
  cycle++
  const result: TickResult = { cycle, selected: null, success: null, highways: [] }

  // L1+L2: SELECT → ASK → MARK/WARN (closed feedback loop)
  const next = net.select()
  if (next) {
    result.selected = next
    const edge = previousTarget ? `${previousTarget}→${next}` : `entry→${next}`
    const netStrength = net.sense(edge) - net.danger(edge)

    if (netStrength >= HIGHWAY_THRESHOLD) {
      // Highway: skip LLM, direct route — path is proven
      chainDepth++
      net.mark(edge, Math.min(chainDepth, CHAIN_CAP))
      previousTarget = next
      result.success = true
      result.skipped = true
    } else {
      // Normal ask path
      const outcome = await net.ask({ receiver: next })

      if (outcome.result !== undefined) {
        chainDepth++
        net.mark(edge, Math.min(chainDepth, CHAIN_CAP))
        previousTarget = next
        result.success = true
      } else if (outcome.timeout) {
        result.success = null
      } else if (outcome.dissolved) {
        net.warn(edge, 0.5)
        previousTarget = null
        chainDepth = 0
        result.success = false
      } else {
        net.warn(edge, 1)
        previousTarget = null
        chainDepth = 0
        result.success = false
      }
    }
  }

  // L1: DRAIN — process highest-priority queued signal
  net.drain()

  // L3: FADE — every 5 minutes (asymmetric: resistance decays 2x)
  if (now - lastDecay > FADE_INTERVAL) {
    net.fade(FADE_RATE)
    lastDecay = now
  }

  // L5: EVOLVE — every 10 minutes, with 24h cooldown + prompt history
  if (complete && now - lastEvolve > EVOLUTION_INTERVAL) {
    // EV-1: Check for failed evolutions that need rollback
    const failedEvos = await readParsed(`
      match $h isa hypothesis, has hid $hid, has statement $s, has hypothesis-status "testing";
      $hid contains "evolve-"; $h has observations-count $oc; $oc >= ${EVOLUTION_MIN_SAMPLES};
      select $hid, $s;
    `).catch(() => [])

    for (const fe of failedEvos) {
      writeSilent(`
        match $h isa hypothesis, has hid "${fe.hid}", has hypothesis-status $st;
        delete $st of $h; insert $h has hypothesis-status "rejected";
      `).catch(() => {})
    }

    // EV-2: Targeted evolution — query per-skill data, not just blanket
    const struggling = await readParsed(`
      match $u isa unit, has uid $id, has system-prompt $sp, has success-rate $sr,
            has sample-count $sc, has generation $g;
      $sr < ${EVOLUTION_THRESHOLD}; $sc >= ${EVOLUTION_MIN_SAMPLES};
      not { $u has last-evolved $le; $le > ${new Date(now - EVOLUTION_COOLDOWN).toISOString().replace('Z', '')}; };
      (provider: $u, offered: $sk) isa capability;
      $sk has skill-id $sid, has tag $tag;
      select $id, $sp, $sr, $sc, $g, $sid, $tag;
    `).catch(() => [])

    // Deduplicate by unit id (query returns one row per skill×tag)
    const unitIds = [...new Set(struggling.map(s => s.id as string))]

    for (const uid of unitIds) {
      const u = struggling.find(s => s.id === uid)!
      const isPriority = priorityEvolve.includes(uid)

      // Priority units evolve with a relaxed threshold
      if (!isPriority && (u.sr as number) >= EVOLUTION_THRESHOLD) continue
      if (isPriority && (u.sr as number) >= PRIORITY_EVOLUTION_THRESHOLD) continue

      // EL-3: Cost-aware — skip evolution for profitable agents
      const revenueRows = await readParsed(`
        match $e (source: $f, target: $t) isa path; $t isa unit, has uid "${uid}";
        $e has revenue $rev; $rev > 0.0; select $rev;
      `).catch(() => [])
      const totalRevenue = revenueRows.reduce((sum, r) => sum + (r.rev as number), 0)
      if (totalRevenue > REVENUE_SKIP_THRESHOLD && (u.sr as number) > REVENUE_MIN_SUCCESS) continue

      // EV-2: Gather skill info for targeted feedback
      const skillInfo = struggling.filter(s => s.id === uid).map(s => `${s.sid} [${s.tag}]`).join(', ')

      // KL-2: Hypothesis → evolution link — include confirmed insights
      const knownPatterns = await net.recall(uid).catch(() => [])
      const insights = knownPatterns.filter(k => k.confidence > 0.7).map(k => k.pattern).join('; ')

      const prompt = await complete(
        `Agent "${uid}" has ${((u.sr as number) * 100).toFixed(0)}% success over ${u.sc} tasks (gen ${u.g}). Skills: ${skillInfo}. Known patterns: ${insights || 'none'}. Rewrite its prompt to improve:\n\n${u.sp}`
      ).catch(() => null)
      if (!prompt) continue

      // Save old prompt as hypothesis (evolution history for rollback)
      writeSilent(`
        insert $h isa hypothesis, has hid "evolve-${uid}-gen${u.g}",
          has statement "gen ${u.g} prompt for ${uid}: ${((u.sp as string) || '').slice(0, 200).replace(/"/g, "'")}",
          has hypothesis-status "testing", has observations-count 0, has p-value 1.0;
      `).catch(() => {})
      writeSilent(`
        match $u isa unit, has uid "${uid}", has system-prompt $sp, has generation $g;
        delete $sp of $u; delete $g of $u;
        insert $u has system-prompt "${prompt.replace(/"/g, '\\"')}", has generation (${u.g} + 1),
               has last-evolved ${new Date(now).toISOString().replace('Z', '')};
      `)
    }
    lastEvolve = now
    priorityEvolve = []
    result.evolved = unitIds.length
  }

  // L6+L7: CRYSTALLIZE + HYPOTHESIZE + FRONTIER — every hour
  if (now - lastCrystallize > CRYSTALLIZE_INTERVAL) {
    // L6: know strong paths
    const insights = await net.know()

    // L6: auto-hypothesize from state changes
    let hypoCount = 0
    for (const i of insights.filter(i => i.confidence >= 0.8)) {
      writeSilent(`
        insert $h isa hypothesis, has hid "path-${i.pattern.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${i.pattern} is proven (confidence ${i.confidence.toFixed(2)})",
          has hypothesis-status "confirmed", has observations-count ${cycle}, has p-value 0.01;
      `).catch(() => {})
      hypoCount++
    }
    for (const f of net.highways(50).filter(h => h.strength >= 10 && h.strength < 20)) {
      writeSilent(`
        insert $h isa hypothesis, has hid "fade-${f.path.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${f.path} is degrading (strength ${f.strength.toFixed(1)})",
          has hypothesis-status "testing", has observations-count 0, has p-value 0.5;
      `).catch(() => {})
      hypoCount++
    }

    // L7: detect frontiers from unexplored tag clusters
    const tagRows = await readParsed(`
      match $sk isa skill, has tag $tag, has skill-id $sid; select $tag, $sid;
    `).catch(() => [])
    const byTag: Record<string, string[]> = {}
    for (const r of tagRows) (byTag[r.tag as string] ||= []).push(r.sid as string)

    const explored = new Set(Object.keys(net.strength).flatMap(e => e.split('→')))
    let frontierCount = 0
    for (const [tag, skills] of Object.entries(byTag)) {
      const unexplored = skills.filter(s => !explored.has(s))
      if (unexplored.length > skills.length * 0.7 && unexplored.length >= 3) {
        writeSilent(`
          insert $f isa frontier, has fid "tag-${tag}-${cycle}",
            has frontier-type "${tag}",
            has frontier-description "${unexplored.length} of ${skills.length} '${tag}' skills unexplored",
            has expected-value ${(unexplored.length / skills.length).toFixed(2)},
            has frontier-status "unexplored";
        `).catch(() => {})
        frontierCount++
      }
    }

    lastCrystallize = now
    result.crystallized = insights.length
    result.hypotheses = hypoCount
    result.frontiers = frontierCount
  }

  result.highways = net.highways(10)
  return result
}
