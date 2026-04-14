/**
 * SUBSTRATE — The One Loop
 *
 * One tick. Everything else is signals.
 * Config loaded from substrate.md.
 *
 * Two triggers:
 *   1. Cron — scheduled heartbeat
 *   2. Signal — external event
 *
 * Both do the same thing: run tick.
 */

import { readParsed, writeSilent } from '@/lib/typedb'
import { loadContext } from './context'
// doc-scan imported dynamically to avoid Cloudflare bundling issues
import {
  getHandlerContext,
  getSopPrereqs,
  getWorkflowSteps,
  type SubstrateConfig as ParsedConfig,
  parseSubstrate,
} from './substrate-config'
import { world as createWorld, type Emit, type Signal, type World } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Timer = {
  signal: string
  interval: number
  priority: string
  last: number
  enabled: boolean
}

type Outcome = {
  result?: unknown
  timeout?: boolean
  dissolved?: boolean
}

export type TickResult = {
  cycle: number
  idle?: boolean
  sig?: Signal
  outcome?: Outcome
  edge?: string
  blocked?: string
  expanded?: number
  totalMs: number
  queueDepth: number
}

export type SubstrateOptions = {
  configPath?: string
  complete?: (prompt: string) => Promise<string>
  docsDir?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const _DEFAULTS = {
  fadeInterval: 300_000, // 5 minutes
  evolveInterval: 600_000, // 10 minutes
  knowInterval: 3_600_000, // 1 hour
  frontierInterval: 3_600_000, // 1 hour
  docsInterval: 3_600_000, // 1 hour
  docsDir: 'docs',
}

const FADE_RATE = 0.05
const EVOLUTION_THRESHOLD = 0.5
const EVOLUTION_MIN_SAMPLES = 20
const EVOLUTION_COOLDOWN_MS = 86_400_000
const HIGHWAY_THRESHOLD = 20

// ═══════════════════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

const fadeHandler = (net: World) => () => {
  net.fade(FADE_RATE)
  return { faded: true, rate: FADE_RATE }
}

const evolveHandler =
  (net: World, complete?: (p: string) => Promise<string>, context?: string) =>
  async (_: unknown, emit: (s: Signal) => void) => {
    const now = Date.now()
    const rows = await readParsed(`
      match $u isa unit, has uid $id, has system-prompt $sp, has success-rate $sr,
            has sample-count $sc, has generation $g;
      $sr < ${EVOLUTION_THRESHOLD}; $sc >= ${EVOLUTION_MIN_SAMPLES};
      not { $u has last-evolved $le; $le > ${new Date(now - EVOLUTION_COOLDOWN_MS).toISOString().replace('Z', '')}; };
      select $id, $sp, $sr, $sc, $g;
    `).catch(() => [])

    for (const u of rows) {
      emit({
        receiver: 'world:evolve-unit',
        data: { id: u.id, prompt: u.sp, successRate: u.sr, sampleCount: u.sc, generation: u.g },
      })
    }
    return { queued: rows.length }
  }

const evolveUnitHandler =
  (net: World, complete?: (p: string) => Promise<string>, context?: string) => async (data: unknown) => {
    const { id, prompt, successRate, generation } = data as {
      id: string
      prompt: string
      successRate: number
      generation: number
    }

    if (!complete) return { skipped: 'no-complete-fn' }

    // Find advisors with similar skills
    const advisorRows = await readParsed(`
      match $u isa unit, has uid $uid, has success-rate $sr; $sr > 0.7;
      not { $uid = "${id}"; };
      select $uid, $sr; sort $sr desc; limit 3;
    `).catch(() => [])

    // Consult advisors (A2A through the world)
    const advice: string[] = []
    for (const a of advisorRows) {
      const { result } = await net.ask(
        {
          receiver: `${a.uid}:advise`,
          data: { from: id, prompt, successRate },
        },
        id as string,
      )
      if (result) advice.push(String(result))
    }

    // Rewrite prompt with context (DSL, dictionary, best practices)
    const newPrompt = await complete(
      `
${context ? `# Context\n\n${context}\n\n---\n\n` : ''}# Task

Agent "${id}" has ${(successRate * 100).toFixed(0)}% success (gen ${generation}).
Advisor feedback: ${advice.join('\n') || 'none'}

Rewrite this prompt to improve performance. Follow the patterns in the context above.

Current prompt:
${prompt}
    `.trim(),
    ).catch(() => null)

    if (!newPrompt) return { failed: 'rewrite-failed' }

    // Save old prompt as hypothesis (rollback)
    writeSilent(`
      insert $h isa hypothesis, has hid "evolve-${id}-gen${generation}",
        has statement "gen ${generation} prompt: ${(prompt || '').slice(0, 200).replace(/"/g, "'")}",
        has hypothesis-status "testing", has observations-count 0, has p-value 1.0;
    `).catch(() => {})

    // Update unit
    writeSilent(`
      match $u isa unit, has uid "${id}", has system-prompt $sp, has generation $g;
      delete $sp of $u; delete $g of $u;
      insert $u has system-prompt "${newPrompt.replace(/"/g, '\\"')}",
             has generation ${(generation || 0) + 1},
             has last-evolved ${new Date().toISOString().replace('Z', '')};
    `).catch(() => {})

    return { evolved: id, generation: (generation || 0) + 1, advisors: advisorRows.length }
  }

const knowHandler = (net: World) => async () => {
  const highways = net.highways(100).filter((h) => h.strength >= HIGHWAY_THRESHOLD)
  let hardened = 0

  for (const h of highways) {
    const confidence = h.strength / (h.strength + 50)
    if (confidence >= 0.8) {
      writeSilent(`
        insert $h isa hypothesis, has hid "path-${h.path.replace(/[→:]/g, '-')}-${Date.now()}",
          has statement "path ${h.path} is proven (strength ${h.strength.toFixed(1)})",
          has hypothesis-status "confirmed", has observations-count 100, has p-value 0.01;
      `).catch(() => {})
      hardened++
    }
  }

  return { highways: highways.length, hardened }
}

const frontierHandler = (net: World) => async () => {
  // Find unexplored tag clusters
  const tagRows = await readParsed(`
    match $sk isa skill, has tag $tag, has skill-id $sid; select $tag, $sid;
  `).catch(() => [])

  const byTag: Record<string, string[]> = {}
  for (const r of tagRows) {
    const tag = r.tag as string
    const sid = r.sid as string
    if (!byTag[tag]) byTag[tag] = []
    byTag[tag].push(sid)
  }

  const explored = new Set(Object.keys(net.strength).flatMap((e) => e.split('→')))
  let frontiers = 0

  for (const [tag, skills] of Object.entries(byTag)) {
    const unexplored = skills.filter((s) => !explored.has(s))
    if (unexplored.length > skills.length * 0.7 && unexplored.length >= 3) {
      writeSilent(`
        insert $f isa frontier, has fid "tag-${tag}-${Date.now()}",
          has frontier-type "${tag}",
          has frontier-description "${unexplored.length} of ${skills.length} '${tag}' skills unexplored",
          has expected-value ${(unexplored.length / skills.length).toFixed(2)},
          has frontier-status "unexplored";
      `).catch(() => {})
      frontiers++
    }
  }

  return { frontiers }
}

const docsHandler = (docsDir: string) => async (_: unknown, emit: (s: Signal) => void) => {
  const { scanDocs, verifyAll } = await import('./doc-scan')
  const items = await scanDocs(docsDir)
  const verified = await verifyAll(items)
  const gaps = verified.filter((i) => !i.verified && !i.done)

  for (const gap of gaps) {
    emit({
      receiver: 'worker:implement',
      data: {
        id: gap.id,
        name: gap.name,
        source: gap.source,
        priority: gap.priority,
        tags: gap.tags,
      },
    })
  }

  return { total: items.length, verified: verified.filter((i) => i.verified).length, gaps: gaps.length }
}

// ═══════════════════════════════════════════════════════════════════════════
// THE SUBSTRATE
// ═══════════════════════════════════════════════════════════════════════════

export const createSubstrate = async (options: SubstrateOptions = {}) => {
  const { configPath = 'substrate.md', complete, docsDir = 'docs' } = options

  // ── Load config from substrate.md ─────────────────────────
  let config: ParsedConfig
  try {
    config = await parseSubstrate(configPath)
  } catch {
    // Default config if file not found
    config = {
      context: ['docs/DSL.md', 'docs/dictionary.md'],
      timers: [
        { signal: 'world:fade', interval: 300_000, priority: 'P2' },
        { signal: 'world:evolve', interval: 600_000, priority: 'P1' },
        { signal: 'world:know', interval: 3_600_000, priority: 'P2' },
        { signal: 'world:frontier', interval: 3_600_000, priority: 'P3' },
        { signal: 'world:docs', interval: 3_600_000, priority: 'P3' },
      ],
      sops: [],
      workflows: [],
      handlers: [],
      metrics: [],
      raw: '',
    }
  }

  const net = createWorld()
  let cycle = 0

  // ── Context loader ────────────────────────────────────────
  const contextCache: Record<string, string> = {}

  const getContext = async (keys?: string[]): Promise<string> => {
    const toLoad = keys || config.context
    const docs: string[] = []
    for (const key of toLoad) {
      if (!contextCache[key]) {
        try {
          contextCache[key] = loadContext([key])
        } catch {
          contextCache[key] = ''
        }
      }
      if (contextCache[key]) docs.push(contextCache[key])
    }
    return docs.join('\n\n---\n\n')
  }

  // ── SOP checker ───────────────────────────────────────────
  const checkSops = async (receiver: string): Promise<{ ok: boolean; blocked?: string }> => {
    const prereqs = getSopPrereqs(config, receiver)
    if (!prereqs.length) return { ok: true }

    for (const p of prereqs) {
      const { result } = await net.ask({ receiver: p })
      if (!result) {
        net.warn(`sop→${receiver}`)
        return { ok: false, blocked: p }
      }
    }
    net.mark(`sop→${receiver}`)
    return { ok: true }
  }

  // ── Workflow expander ─────────────────────────────────────
  const expandWorkflow = (sig: Signal): Signal[] | null => {
    if (!sig.receiver.startsWith('workflow:')) return null
    const name = sig.receiver.replace('workflow:', '')
    const steps = getWorkflowSteps(config, name)
    if (!steps.length) return null

    return steps.map((step, i) => ({
      receiver: step,
      data: { ...((sig.data as object) || {}), _workflow: name, _step: i, _total: steps.length },
    }))
  }

  // ── System unit with context-aware handlers ───────────────
  const systemHandlers = {
    fade: fadeHandler(net),
    evolve: async (_: unknown, emit: Emit) => {
      const ctx = await getContext(getHandlerContext(config, 'world:evolve'))
      return evolveHandler(net, complete, ctx)(_, emit)
    },
    'evolve-unit': async (data: unknown) => {
      const ctx = await getContext(getHandlerContext(config, 'world:evolve-unit'))
      return evolveUnitHandler(net, complete, ctx)(data)
    },
    know: knowHandler(net),
    frontier: frontierHandler(net),
    docs: docsHandler(docsDir),
  }

  net.add('world')
  for (const [task, handler] of Object.entries(systemHandlers)) {
    net.get('world')?.on(task, handler)
  }

  // ── Workflow handler ──────────────────────────────────────
  net.add('workflow').on('default', async (data, emit) => {
    const name = (data as Record<string, unknown>)?._name as string
    const steps = getWorkflowSteps(config, name)
    for (const step of steps) {
      emit({ receiver: step, data })
    }
    return { expanded: steps.length }
  })

  // ── Timers from config ────────────────────────────────────
  const timers: Timer[] = config.timers.map((t) => ({
    signal: t.signal,
    interval: t.interval,
    priority: t.priority,
    last: 0,
    enabled: true,
  }))

  // ── The tick ──────────────────────────────────────────────
  const tick = async (): Promise<TickResult> => {
    const start = Date.now()
    const now = start
    cycle++

    // Check timers, enqueue due signals with priority
    for (const t of timers) {
      if (t.enabled && now - t.last >= t.interval) {
        net.enqueue({ receiver: t.signal, data: { priority: t.priority } })
        t.last = now
      }
    }

    // Drain one signal (highest priority)
    const sig = net.drain()
    if (!sig) {
      return { cycle, idle: true, totalMs: Date.now() - start, queueDepth: 0 }
    }

    // Expand workflow if applicable
    const expanded = expandWorkflow(sig)
    if (expanded) {
      for (const s of expanded) net.enqueue(s)
      net.mark(`workflow→${sig.receiver}`)
      return { cycle, expanded: expanded.length, totalMs: Date.now() - start, queueDepth: net.pending() }
    }

    // Check SOPs
    const sopCheck = await checkSops(sig.receiver)
    if (!sopCheck.ok) {
      return { cycle, blocked: sopCheck.blocked, totalMs: Date.now() - start, queueDepth: net.pending() }
    }

    // Execute
    const from = ((sig.data as Record<string, unknown>)?.from as string) || 'entry'
    const edge = `${from}→${sig.receiver}`
    const outcome = await net.ask(sig, from)

    return {
      cycle,
      sig,
      outcome,
      edge,
      totalMs: Date.now() - start,
      queueDepth: net.pending(),
    }
  }

  // ── Run loop ──────────────────────────────────────────────
  const run = (intervalMs = 100) => {
    const handle = setInterval(() => tick(), intervalMs)
    return () => clearInterval(handle)
  }

  // ── Control ───────────────────────────────────────────────
  const enableTimer = (signal: string, enabled = true) => {
    const t = timers.find((t) => t.signal === signal)
    if (t) t.enabled = enabled
  }

  const forceTimer = (signal: string) => {
    const t = timers.find((t) => t.signal === signal)
    if (t) t.last = 0
  }

  const setTimerInterval = (signal: string, ms: number) => {
    const t = timers.find((t) => t.signal === signal)
    if (t) t.interval = ms
  }

  const reloadConfig = async () => {
    const newConfig = await parseSubstrate(configPath)
    Object.assign(config, newConfig)
    // Update timers
    for (const t of newConfig.timers) {
      const existing = timers.find((x) => x.signal === t.signal)
      if (existing) {
        existing.interval = t.interval
        existing.priority = t.priority
      } else {
        timers.push({ ...t, last: 0, enabled: true })
      }
    }
  }

  // ── Stats ─────────────────────────────────────────────────
  const stats = () => ({
    cycle,
    queueDepth: net.pending(),
    highways: net.highways(10),
    pathCount: Object.keys(net.strength).length,
    unitCount: net.list().length,
    timers: timers.map((t) => ({ signal: t.signal, interval: t.interval, enabled: t.enabled })),
    sops: config.sops.length,
    workflows: config.workflows.length,
  })

  return {
    net,
    config,
    tick,
    timers,
    run,
    enableTimer,
    forceTimer,
    setTimerInterval,
    reloadConfig,
    getContext,
    stats,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAIN. ASK. MARK. REPEAT.
// ═══════════════════════════════════════════════════════════════════════════
