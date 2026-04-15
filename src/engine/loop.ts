/**
 * LOOP — The growth tick
 *
 * The closed loop: select → ask → mark/warn → fade → evolve → know → frontier.
 * Every tick makes the colony smarter. No external feedback needed.
 */

import { readParsed, writeSilent, writeTracked } from '@/lib/typedb'
import { warmUI } from '@/lib/ui-prefetch'
import { augmentPromptWithADL } from './adl'
import { invalidateAdlCache } from './adl-cache'
import { inferDocsFromTags, loadContext } from './context'
import type { PersistentWorld } from './persist'
import { EFFORT_MODEL, WAVE_MODEL } from './task-parse'

// doc-scan and node:path imported dynamically to avoid Cloudflare bundling issues

type Complete = (prompt: string) => Promise<string>

// ── Named constants ─────────────────────────────────────────────────────
const HIGHWAY_THRESHOLD = 20 // net strength to skip LLM (confidence-based routing)
const CHAIN_CAP = 5 // max chain depth multiplier
const FADE_INTERVAL = 300_000 // 5 minutes between decay cycles
const FADE_RATE = 0.05
const EVOLUTION_INTERVAL = 600_000 // 10 minutes between evolution sweeps
const EVOLUTION_COOLDOWN = 86_400_000 // 24 hours between rewrites per agent
const EVOLUTION_THRESHOLD = 0.5 // success rate below which agents evolve
const PRIORITY_EVOLUTION_THRESHOLD = 0.65 // relaxed threshold for priority units
const EVOLUTION_MIN_SAMPLES = 20
const REVENUE_SKIP_THRESHOLD = 1.0 // revenue above which low-success agents are spared
const REVENUE_MIN_SUCCESS = 0.3 // min success rate even for profitable agents
const HARDEN_INTERVAL = 3_600_000 // 1 hour between knowledge cycles
const SURGE_THRESHOLD = 10 // strength delta to flag as surge
const FRONTIER_MIN_ACTIVITY = 3 // min edges involving a unit to consider it active

export type TickResult = {
  cycle: number
  selected: string | null
  success: boolean | null
  skipped?: boolean
  task?: { id: string; name: string; priority: number }
  highways: { path: string; strength: number }[]
  evolved?: number
  hardened?: number
  hypotheses?: number
  frontiers?: number
  docsSynced?: number
  prefetchMs?: number
  /**
   * Per-loop attempted-vs-succeeded accounting (Rule 3). When TypeDB is
   * down, writes silently fail — these counters separate "we tried" from
   * "it persisted" so operators see truth, not optimism.
   */
  writes?: {
    evolveAttempted: number
    evolveOk: number
    hypoAttempted: number
    hypoOk: number
    frontierAttempted: number
    frontierOk: number
  }
  /**
   * Tick-level health ratio: successful writes / attempted writes this
   * cycle. 1.0 when no writes were attempted. When < 0.5 the tick warns
   * the `tick→typedb` edge; >= 0.9 marks it. This closes the tick's own
   * loop on itself (meta-loop).
   */
  writeHealth?: number
}

let cycle = 0
let lastDecay = 0
let lastEvolve = 0
let lastHarden = 0
let previousTarget: string | null = null
let chainDepth = 0
let priorityEvolve: string[] = []
let lastStrengths: Record<string, number> = {}
const taskFailures = new Map<string, number>() // failure count per task for hypothesis generation
const tagFailures = new Map<string, number>() // failure count per tag-cluster for pattern hypotheses

export const tick = async (net: PersistentWorld, complete?: Complete): Promise<TickResult> => {
  const now = Date.now()
  cycle++
  const result: TickResult = {
    cycle,
    selected: null,
    success: null,
    highways: [],
    writes: {
      evolveAttempted: 0,
      evolveOk: 0,
      hypoAttempted: 0,
      hypoOk: 0,
      frontierAttempted: 0,
      frontierOk: 0,
    },
  }

  // L1+L2: SELECT → ASK → MARK/WARN (closed feedback loop)
  // Prefer deterministic routing (follow) when paths are proven.
  // Fall back to probabilistic (select) for exploration.
  let next = previousTarget ? net.follow() : null
  if (!next) {
    // No proven path from current unit, use probabilistic selection
    next = net.select()
  }

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

  // L1b: TASK ORCHESTRATION — pick highest-priority open task
  // If previousTarget exists, try tag-filtered selection first (subscription routing).
  // Falls back to global priority if no tag match.
  if (!result.selected || result.success === false) {
    let topTasks: Record<string, unknown>[] = []

    // Try tag-filtered first: if we have a known executor, match its tags
    if (previousTarget) {
      topTasks = await readParsed(`
        match $u isa unit, has uid "${previousTarget}", has tag $tag;
        $t isa task, has task-id $id, has name $name, has done false,
          has priority-score $p, has task-status "open", has tag $tag;
        $t has task-effort $effort, has task-phase $phase;
        select $id, $name, $p, $effort, $phase;
        sort $p desc; limit 1;
      `).catch(() => [])
    }

    // Fallback: global priority (no tag filter)
    if (!topTasks.length) {
      topTasks = await readParsed(`
        match $t isa task, has task-id $id, has name $name, has done false,
          has priority-score $p, has task-status "open";
        $t has task-effort $effort, has task-phase $phase;
        select $id, $name, $p, $effort, $phase;
        sort $p desc; limit 1;
      `).catch(() =>
        readParsed(`
          match $t isa task, has task-id $id, has name $name, has done false,
            has priority-score $p, has task-status "open";
          select $id, $name, $p;
          sort $p desc; limit 1;
        `).catch(() => []),
      )
    }

    if (topTasks.length > 0) {
      const taskId = topTasks[0].id as string
      const taskName = topTasks[0].name as string
      const taskPriority = topTasks[0].p as number
      const taskEffort = (topTasks[0].effort as string) || 'medium'
      const taskPhase = (topTasks[0].phase as string) || 'C4'
      result.task = { id: taskId, name: taskName, priority: taskPriority }
      result.selected = taskId

      // Load task metadata: exit condition, tags, explicit context keys, wave position
      const [taskMeta, tagRows, ctxRows, waveRows] = await Promise.all([
        readParsed(`
          match $t isa task, has task-id "${taskId}";
          $t has exit-condition $exit;
          select $exit;
        `).catch(() => []),
        readParsed(`
          match $t isa task, has task-id "${taskId}", has tag $tag;
          select $tag;
        `).catch(() => []),
        readParsed(`
          match $t isa task, has task-id "${taskId}", has task-context $ctx;
          select $ctx;
        `).catch(() => []),
        readParsed(`
          match $t isa task, has task-id "${taskId}", has task-wave $wave;
          select $wave;
        `).catch(() => []),
      ])
      const exitCondition = (taskMeta[0]?.exit as string) || ''
      const taskTags = tagRows.map((r) => r.tag as string)

      // Enrich: infer docs from tags + merge with explicit task-context
      // DSL + dictionary always included as base context (inferDocsFromTags guarantees this)
      const inferredKeys = inferDocsFromTags(taskTags)
      const explicitKeys = ctxRows.length ? (ctxRows[0].ctx as string).split(',').map((s) => s.trim()) : []
      const allKeys = [...new Set([...inferredKeys, ...explicitKeys])]
      const contextDocs = allKeys
      const contextText = loadContext(allKeys) // merged doc content for executor

      // Load hypotheses about this task path (what the graph has learned)
      const learned = await net.recall(taskId).catch(() => [])

      // Load blocking context: what tasks will be unblocked when this completes
      const blockers = await net.taskBlockers(taskId).catch(() => [])

      // Route as signal: enqueue for the builder unit WITH full context envelope
      // Entry point is builder:task — the dispatch handler strips replyTo before recon
      const taskWave = (waveRows[0]?.wave as string) || 'W3'
      const taskModel =
        WAVE_MODEL[taskWave as keyof typeof WAVE_MODEL] ||
        EFFORT_MODEL[taskEffort as keyof typeof EFFORT_MODEL] ||
        'sonnet'

      const taskSignal = {
        receiver: 'builder:task',
        data: {
          taskId,
          taskName,
          taskPriority,
          effort: taskEffort,
          wave: taskWave,
          model: taskModel,
          phase: taskPhase,
          exit: exitCondition,
          tags: taskTags,
          contextDocs, // doc keys for reference
          context: contextText, // full merged doc content (always includes DSL + dictionary)
          learned: learned.slice(0, 5),
          blockers, // tasks that will be unblocked when this completes
        },
      }
      const edge = `loop→builder:${taskId}`

      // Try to execute via ask (if builder has a handler)
      // Timeout: 120s to allow full W1→W4 chain (4 LLM calls)
      const outcome = await net.ask(taskSignal, 'loop', 120_000)

      if (outcome.result !== undefined) {
        chainDepth++
        net.mark(edge, Math.min(chainDepth, CHAIN_CAP))
        // Mark wave transitions
        const wave = (taskSignal.data as { wave?: string })?.wave || 'W3'
        const nextWave = ({ W1: 'W2', W2: 'W3', W3: 'W4', W4: 'W1' } as Record<string, string>)[wave]
        net.mark(`wave-runner:${wave}→wave-runner:${nextWave}`, 1)
        previousTarget = 'builder'
        result.success = true
        // Mark task done in TypeDB
        writeSilent(`
          match $t isa task, has task-id "${taskId}", has done $d, has task-status $st;
          delete $d of $t; delete $st of $t;
          insert $t has done true, has task-status "done";
        `)
        // L6: Record which context docs led to success as a testable hypothesis
        if (contextDocs?.length) {
          const contextKey = contextDocs.slice(0, 5).join(',')
          writeSilent(`
            insert $h isa hypothesis,
              has hid "ctx:${taskId.replace(/"/g, '')}:${Date.now()}",
              has statement "docs:${contextKey}→${taskId}:success",
              has hypothesis-status "testing",
              has observations-count 1,
              has p-value 0.5,
              has action-ready false;
          `)
        }
      } else if (outcome.dissolved) {
        // No handler — task is queued for external execution (CLI /work loop)
        net.enqueue(taskSignal)
        result.success = null
      } else {
        net.warn(edge, 0.5)
        result.success = false
        // Track repeated failures → auto-hypothesize at threshold
        const failCount = (taskFailures.get(taskId) || 0) + 1
        taskFailures.set(taskId, failCount)
        if (failCount >= 3) {
          writeSilent(`
            insert $h isa hypothesis,
              has hid "fail:${taskId.replace(/"/g, '')}:${Date.now()}",
              has statement "task:${taskId}:repeated-failure:count=${failCount}",
              has hypothesis-status "testing",
              has observations-count ${failCount},
              has p-value 0.5,
              has action-ready false;
          `)
          taskFailures.delete(taskId)
        }
        // wave-failure-hypotheses: track failures by tag cluster
        const taskData = taskSignal.data as { tags?: string[] }
        const tagKey = taskData.tags?.length ? taskData.tags.slice().sort().join('::') : 'untagged'
        const tagFailCount = (tagFailures.get(tagKey) || 0) + 1
        tagFailures.set(tagKey, tagFailCount)
        if (tagFailCount >= 3) {
          writeSilent(`
            insert $h isa hypothesis,
              has hid "tagfail:${tagKey.replace(/[^a-z0-9]/gi, '-').slice(0, 40)}:${Date.now()}",
              has statement "tag-cluster:${tagKey}:repeated-failure:wave=${taskWave}:count=${tagFailCount}",
              has hypothesis-status "testing",
              has observations-count ${tagFailCount},
              has p-value 0.5,
              has action-ready false;
          `)
          tagFailures.delete(tagKey)
        }
      }
    }
  }

  // L1: DRAIN — process highest-priority queued signal
  net.drain()

  // L1.5 prefetch: warm ui:* receivers found in current highways
  const _prefetchStart = Date.now()
  const _uiReceivers = net
    .highways(20)
    .filter((e: { to: string }) => e.to?.startsWith('ui:'))
    .slice(0, 5)
    .map((e: { to: string }) => e.to)
  if (_uiReceivers.length > 0) warmUI(_uiReceivers)
  const prefetchMs = Date.now() - _prefetchStart

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
      not { $u has last-evolved $le; $le > ${new Date(now - EVOLUTION_COOLDOWN).toISOString().slice(0, 19)}; };
      (provider: $u, offered: $sk) isa capability;
      $sk has skill-id $sid, has tag $tag;
      select $id, $sp, $sr, $sc, $g, $sid, $tag;
    `).catch(() => [])

    // Deduplicate by unit id (query returns one row per skill×tag)
    const unitIds = [...new Set(struggling.map((s) => s.id as string))]

    for (const uid of unitIds) {
      const u = struggling.find((s) => s.id === uid)!
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
      const skillInfo = struggling
        .filter((s) => s.id === uid)
        .map((s) => `${s.sid} [${s.tag}]`)
        .join(', ')

      // KL-2: Hypothesis → evolution link — include confirmed insights
      const knownPatterns = await net.recall(uid).catch(() => [])
      const insights = knownPatterns
        .filter((k) => k.confidence > 0.7)
        .map((k) => k.pattern)
        .join('; ')

      // rubric-evolution-feed: read per-dim pheromone → targeted guidance
      const dimHints: string[] = []
      const dimGuide = {
        fit: 'improve task relevance — adhere to exit conditions',
        form: 'improve code structure and formatting quality',
        truth: 'improve factual accuracy — verify all claims before output',
        taste: 'improve voice — cleaner, more direct prose and naming',
      } as const
      for (const dim of ['fit', 'form', 'truth', 'taste'] as const) {
        const edge = `entry→builder:verify:${dim}`
        const s = net.sense(edge)
        const r = net.danger(edge)
        if (r > s && s + r > 2) dimHints.push(dimGuide[dim])
      }
      const dimGuidance = dimHints.length ? ` Dim weaknesses from graph: ${dimHints.join('; ')}.` : ''

      // evolve-builder: per-wave pheromone → wave-specific guidance
      // Each wave transition edge tracks that wave's success rate independently.
      const waveGuideMap = {
        'recon (W1)': 'improve file reading and pattern surfacing — be more specific about what to look for',
        'decide (W2)': 'improve decision quality — produce clearer implementation plans with file paths',
        'edit (W3)': 'improve edit precision — anchor strings must match exactly, one change per file',
        'verify (W4)': 'improve verification rigour — check exit condition explicitly, score all four dims',
      } as const
      const waveRates = (
        [
          ['recon (W1)', 'wave-runner:W1→wave-runner:W2'],
          ['decide (W2)', 'wave-runner:W2→wave-runner:W3'],
          ['edit (W3)', 'wave-runner:W3→wave-runner:W4'],
          ['verify (W4)', 'wave-runner:W4→wave-runner:W1'],
        ] as const
      )
        .map(([name, edge]) => {
          const s = net.sense(edge)
          const r = net.danger(edge)
          return s + r > 3 ? { name, rate: s / (s + r) } : null
        })
        .filter((x): x is { name: keyof typeof waveGuideMap; rate: number } => x !== null)
        .sort((a, b) => a.rate - b.rate)
      const weakWave = waveRates[0]
      const waveGuidance =
        weakWave && weakWave.rate < 0.6
          ? ` Weakest wave: ${weakWave.name} (${(weakWave.rate * 100).toFixed(0)}% success) — ${waveGuideMap[weakWave.name]}.`
          : ''

      result.writes!.evolveAttempted++
      const prompt = await complete(
        `Agent "${uid}" has ${((u.sr as number) * 100).toFixed(0)}% success over ${u.sc} tasks (gen ${u.g}). Skills: ${skillInfo}. Known patterns: ${insights || 'none'}.${dimGuidance}${waveGuidance} Rewrite its prompt to improve:\n\n${u.sp}`,
      ).catch(() => null)
      if (!prompt) {
        // Closed-loop contract: LLM fail is not silence. Mark the agent's
        // self-evolve edge with a mild warn so repeat failures accumulate
        // resistance — the substrate will deprioritize evolving this agent
        // until a task cycle calibrates it differently.
        net.warn(`${uid}→${uid}:evolve`, 0.3)
        continue
      }

      // ADL Cycle 3: augment evolved prompt with operational constraints (fail-open)
      const finalPrompt = await augmentPromptWithADL(uid, prompt).catch(() => prompt)

      // Save old prompt as hypothesis (evolution history for rollback)
      const historyOk = await writeTracked(`
        insert $h isa hypothesis, has hid "evolve-${uid}-gen${u.g}",
          has statement "gen ${u.g} prompt for ${uid}: ${((u.sp as string) || '').slice(0, 200).replace(/"/g, "'")}",
          has hypothesis-status "testing", has observations-count 0, has p-value 1.0;
      `)
      const promptOk = await writeTracked(`
        match $u isa unit, has uid "${uid}", has system-prompt $sp, has generation $g;
        delete $sp of $u; delete $g of $u;
        insert $u has system-prompt "${finalPrompt.replace(/"/g, '\\"')}", has generation (${u.g} + 1),
               has last-evolved ${new Date(now).toISOString().slice(0, 19)};
      `)
      if (promptOk) {
        result.writes!.evolveOk++
        // Cycle 1.6: evolved prompt changes downstream ADL state perception —
        // flush caches so the next signal reads the new generation, not the
        // stale sensitivity/perm snapshot from before the rewrite.
        invalidateAdlCache(uid)
      } else {
        // TypeDB write failed — same closed-loop treatment as LLM fail.
        net.warn(`${uid}→${uid}:evolve`, 0.3)
      }
      // `historyOk` counted under hypoAttempted since it inserts into hypothesis
      result.writes!.hypoAttempted++
      if (historyOk) result.writes!.hypoOk++
    }
    lastEvolve = now
    priorityEvolve = []
    // Report what actually persisted, not what we iterated over.
    result.evolved = result.writes!.evolveOk
  }

  // L6+L7: HARDEN + HYPOTHESIZE + FRONTIER — every hour
  if (now - lastHarden > HARDEN_INTERVAL) {
    // L6: know strong paths
    const insights = await net.know()

    // L6: auto-hypothesize from state changes
    const nowIso = new Date().toISOString().replace('Z', '')
    let hypoCount = 0
    for (const i of insights.filter((i) => i.confidence >= 0.8)) {
      result.writes!.hypoAttempted++
      const ok = await writeTracked(`
        insert $h isa hypothesis, has hid "path-${i.pattern.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${i.pattern} is proven (confidence ${i.confidence.toFixed(2)})",
          has hypothesis-status "confirmed", has observations-count ${cycle}, has p-value 0.01,
          has source "observed", has observed-at ${nowIso};
      `)
      if (ok) {
        result.writes!.hypoOk++
        hypoCount++
      }
    }
    // E8: contradiction → warn() cascade — path was confirmed but is now degrading
    const degradingPaths = new Set(
      net
        .highways(50)
        .filter((h) => h.strength >= 10 && h.strength < 20)
        .map((h) => h.path),
    )
    for (const i of insights.filter((i) => i.confidence >= 0.9)) {
      const pathName = i.pattern.replace(/^path /, '').replace(/ is proven.*/, '')
      if (degradingPaths.has(pathName)) net.warn(pathName, 0.5)
    }
    for (const f of net.highways(50).filter((h) => h.strength >= 10 && h.strength < 20)) {
      result.writes!.hypoAttempted++
      const ok = await writeTracked(`
        insert $h isa hypothesis, has hid "fade-${f.path.replace(/[→:]/g, '-')}-${cycle}",
          has statement "path ${f.path} is degrading (strength ${f.strength.toFixed(1)})",
          has hypothesis-status "testing", has observations-count 0, has p-value 0.5,
          has source "observed", has observed-at ${nowIso};
      `)
      if (ok) {
        result.writes!.hypoOk++
        hypoCount++
      }
    }

    // KL-1: Detect rapid strength surges
    for (const h of net.highways(50)) {
      const prev = lastStrengths[h.path] || 0
      const delta = h.strength - prev
      if (delta > SURGE_THRESHOLD) {
        result.writes!.hypoAttempted++
        const ok = await writeTracked(`
          insert $h isa hypothesis, has hid "surge-${h.path.replace(/[→:]/g, '-')}-${cycle}",
            has statement "path ${h.path} surged by ${delta.toFixed(1)} (${prev.toFixed(1)} → ${h.strength.toFixed(1)})",
            has hypothesis-status "testing", has observations-count 0, has p-value 0.3,
            has source "observed", has observed-at ${nowIso};
        `)
        if (ok) {
          result.writes!.hypoOk++
          hypoCount++
        }
      }
    }
    lastStrengths = Object.fromEntries(net.highways(100).map((h) => [h.path, h.strength]))

    // LC-1: Knowledge → Evolution coupling — strong patterns trigger priority evolution
    for (const i of insights.filter((i) => i.confidence >= 0.8)) {
      const units = i.pattern.split('→').map((s) => s.split(':')[0])
      priorityEvolve.push(...units)
    }

    // L6-LAUNCH: agents that cross the agent-launch handoff become hypotheses.
    // Insights carrying "token-launched" in their pattern are promoted so pheromone
    // can route future scaffolds toward launch-ready personas.
    for (const i of insights) {
      if (/token-launched/.test(i.pattern)) {
        const agentUid = i.pattern.split(/[→:]/)[0] || 'unknown'
        result.writes!.hypoAttempted++
        const ok = await writeTracked(`
          insert $h isa hypothesis, has hid "launch-${agentUid}-${cycle}",
            has statement "agent ${agentUid} launched a token (agent-launch handoff)",
            has hypothesis-status "confirmed", has observations-count ${cycle}, has p-value 0.05,
            has source "observed", has observed-at ${nowIso};
        `)
        if (ok) {
          result.writes!.hypoOk++
          hypoCount++
        }
      }
    }

    // L7: detect frontiers from unexplored tag clusters
    const tagRows = await readParsed(`
      match $sk isa skill, has tag $tag, has skill-id $sid; select $tag, $sid;
    `).catch(() => [])
    const byTag: Record<string, string[]> = {}
    for (const r of tagRows) (byTag[r.tag as string] ||= []).push(r.sid as string)

    const explored = new Set(Object.keys(net.strength).flatMap((e) => e.split('→')))
    let frontierCount = 0
    for (const [tag, skills] of Object.entries(byTag)) {
      const unexplored = skills.filter((s) => !explored.has(s))
      if (unexplored.length > skills.length * 0.7 && unexplored.length >= 3) {
        result.writes!.frontierAttempted++
        const ok = await writeTracked(`
          insert $f isa frontier, has fid "tag-${tag}-${cycle}",
            has frontier-type "${tag}",
            has frontier-description "${unexplored.length} of ${skills.length} '${tag}' skills unexplored",
            has expected-value ${(unexplored.length / skills.length).toFixed(2)},
            has frontier-status "unexplored";
        `)
        if (ok) {
          result.writes!.frontierOk++
          frontierCount++
        }
      }
    }

    // FR-2: wave-frontiers — tag clusters where some waves have never been executed
    const taskTagWaveRows = await readParsed(`
      match $t isa task, has tag $tg, has task-wave $w; select $tg, $w;
    `).catch(() => [] as Record<string, unknown>[])
    if (taskTagWaveRows.length > 0) {
      const byTagWaves: Record<string, Set<string>> = {}
      for (const r of taskTagWaveRows) {
        const tg = r.tg as string
        const w = r.w as string
        if (!byTagWaves[tg]) byTagWaves[tg] = new Set()
        byTagWaves[tg].add(w)
      }
      const allWaves = ['W1', 'W2', 'W3', 'W4']
      for (const [tag, covered] of Object.entries(byTagWaves)) {
        const missing = allWaves.filter((w) => !covered.has(w))
        if (missing.length > 0) {
          result.writes!.frontierAttempted++
          const ok = await writeTracked(`
            insert $f isa frontier, has fid "wave-${tag.replace(/[^a-z0-9]/gi, '-')}-${cycle}",
              has frontier-type "wave-gap",
              has frontier-description "tag '${tag}': waves ${missing.join(',')} never executed (covered: ${[...covered].join(',')})",
              has expected-value ${(missing.length / 4).toFixed(2)},
              has frontier-status "unexplored";
          `)
          if (ok) {
            result.writes!.frontierOk++
            frontierCount++
          }
        }
      }
    }

    // FR-1: Detect unit-gap frontiers — active units that have never been connected
    const allUnits = net.list()
    for (let i = 0; i < allUnits.length; i++) {
      for (let j = i + 1; j < allUnits.length; j++) {
        const edgeFwd = `${allUnits[i]}→${allUnits[j]}`
        const edgeRev = `${allUnits[j]}→${allUnits[i]}`
        if (!explored.has(allUnits[i]) || !explored.has(allUnits[j])) continue
        if (net.sense(edgeFwd) === 0 && net.sense(edgeRev) === 0) {
          const actI = Object.keys(net.strength).filter((e) => e.includes(allUnits[i])).length
          const actJ = Object.keys(net.strength).filter((e) => e.includes(allUnits[j])).length
          if (actI >= FRONTIER_MIN_ACTIVITY && actJ >= FRONTIER_MIN_ACTIVITY) {
            result.writes!.frontierAttempted++
            const ok = await writeTracked(`
              insert $f isa frontier, has fid "gap-${allUnits[i]}-${allUnits[j]}-${cycle}",
                has frontier-type "unit-gap",
                has frontier-description "active units ${allUnits[i]} and ${allUnits[j]} never connected",
                has expected-value 0.5, has frontier-status "unexplored";
            `)
            if (ok) {
              result.writes!.frontierOk++
              frontierCount++
            }
          }
        }
      }
    }

    // L7: Scan docs/ → upsert skills + capabilities in TypeDB
    // Skills without capabilities are orphaned — must link to a unit
    let docsSynced = 0
    try {
      const { join } = await import('node:path')
      const { scanDocs } = await import('./doc-scan')
      const docsDir = join(process.cwd(), 'docs')
      const docItems = await scanDocs(docsDir)
      const openItems = docItems.filter((i) => !i.done)

      // Ensure builder unit exists for capability relations
      await writeSilent(`
        insert $u isa unit, has uid "builder", has name "Builder",
          has model "claude-sonnet-4-20250514", has system-prompt "Task executor",
          has generation 1, has success-rate 0.8, has sample-count 0, has activity-score 0;
      `).catch(() => {}) // Ignore if already exists

      for (const item of openItems) {
        const tags = [...new Set(item.tags)].map((t) => `has tag "${t.replace(/"/g, "'")}"`)
        const nameEsc = item.name.replace(/"/g, "'").slice(0, 200)
        const skillId = item.id.replace(/"/g, "'")

        // Insert skill
        await writeSilent(`
          insert $s isa skill, has skill-id "${skillId}", has name "${nameEsc}",
            ${tags.join(', ')}, has price 0.0, has currency "SUI";
        `).catch(() => {}) // Ignore if already exists

        // Link skill to builder unit via capability — makes it visible to /api/tasks
        await writeSilent(`
          match $u isa unit, has uid "builder"; $s isa skill, has skill-id "${skillId}";
          insert (provider: $u, offered: $s) isa capability, has price 0.0;
        `).catch(() => {}) // Ignore if already linked

        docsSynced++
      }
    } catch {
      /* docs scan is best-effort */
    }

    lastHarden = now
    result.hardened = insights.length
    result.hypotheses = hypoCount
    result.frontiers = frontierCount
    result.docsSynced = docsSynced
  }

  result.highways = net.highways(10)
  result.prefetchMs = prefetchMs

  // Meta-loop: the tick observes itself. Aggregate all this cycle's write
  // attempts into a single health ratio and close the tick's own loop —
  // when the brain (TypeDB) misbehaves, the tick→typedb edge accumulates
  // resistance, and upstream callers (boot backoff, operators) can see
  // the trend without a separate health endpoint.
  const w = result.writes!
  const attempted = w.evolveAttempted + w.hypoAttempted + w.frontierAttempted
  const succeeded = w.evolveOk + w.hypoOk + w.frontierOk
  result.writeHealth = attempted === 0 ? 1 : succeeded / attempted
  if (attempted > 0 && result.writeHealth < 0.5) {
    // Same 4-outcome algebra: missing dep (TypeDB) is a dissolved-style warn.
    net.warn('tick→typedb', Math.min(1, 1 - result.writeHealth))
  } else if (attempted > 0 && result.writeHealth >= 0.9) {
    // Healthy cycle strengthens the inverse — mark what's working.
    net.mark('tick→typedb', 0.1)
  }

  return result
}
