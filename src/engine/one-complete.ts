/**
 * ONE — The Complete Substrate
 *
 * ~150 lines. All features. Maximum efficiency.
 *
 * Concepts:
 *   signal → handler → emit (everything)
 *   chain (timers, SOPs, workflows)
 *   context (indexed, compressed)
 *   pheromone (strength, resistance, learning)
 */

const readFile = async (path: string, enc: BufferEncoding) =>
  (await import('node:fs/promises')).readFile(path, enc)

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Data = Record<string, unknown>
type Emit = (to: string, data?: Data) => void
type Handler = (data: Data, emit: Emit) => unknown | Promise<unknown>
type Outcome = { result?: unknown; timeout?: boolean; dissolved?: boolean }

export type TickResult = {
  cycle: number
  path?: string
  outcome?: Outcome
  ms: number
  queue: number
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════

export const create = () => {
  // State
  const handlers: Record<string, Handler> = {}
  const strength: Record<string, number> = {}
  const resistance: Record<string, number> = {}
  const context: Record<string, string> = {}
  const queue: { to: string; data: Data; priority: number }[] = []
  let cycle = 0

  // ── Pheromone ─────────────────────────────────────────────
  const mark = (path: string, amount = 1) => {
    strength[path] = (strength[path] || 0) + amount
  }

  const warn = (path: string, amount = 1) => {
    resistance[path] = (resistance[path] || 0) + amount
  }

  const net = (path: string) => (strength[path] || 0) - (resistance[path] || 0)

  const fade = (rate = 0.02) => {
    for (const p in strength) {
      strength[p] *= (1 - rate)
      if (strength[p] < 0.01) delete strength[p]
    }
    for (const p in resistance) {
      resistance[p] *= (1 - rate * 2)  // forgive 2x faster
      if (resistance[p] < 0.01) delete resistance[p]
    }
  }

  const isHighway = (path: string) => net(path) >= 20
  const isToxic = (path: string) => {
    const r = resistance[path] || 0
    const s = strength[path] || 0
    return r >= 10 && r > s * 2 && (r + s) > 5
  }

  const highways = (n = 10) => Object.keys(strength)
    .map(p => ({ path: p, strength: net(p) }))
    .filter(x => x.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, n)

  // ── Queue ─────────────────────────────────────────────────
  const emit: Emit = (to, data = {}) => {
    const priority = (data.priority as number) || 5
    queue.push({ to, data, priority })
  }

  const drain = () => {
    if (!queue.length) return null
    queue.sort((a, b) => a.priority - b.priority)  // lower = higher priority
    return queue.shift()!
  }

  // ── Handlers ──────────────────────────────────────────────
  const on = (id: string, fn: Handler) => { handlers[id] = fn }

  const ask = async (to: string, data: Data = {}, from = 'entry'): Promise<Outcome> => {
    const path = `${from}→${to}`

    // Block toxic
    if (isToxic(path)) return { dissolved: true }

    // Find handler
    const handler = handlers[to] || handlers[to.split(':')[0]]
    if (!handler) return { dissolved: true }

    // Execute
    try {
      const result = await handler(data, emit)
      return result !== undefined ? { result } : { timeout: true }
    } catch {
      return { dissolved: true }
    }
  }

  // ── Context ───────────────────────────────────────────────
  const loadContext = async (key: string, path: string) => {
    const content = await readFile(path, 'utf-8').catch(() => '')
    // Compress: strip excessive whitespace, keep structure
    context[key] = content.replace(/\n{3,}/g, '\n\n').trim()
  }

  const getContext = (...keys: string[]) =>
    keys.map(k => context[k]).filter(Boolean).join('\n\n---\n\n')

  // ── Chains (timers, SOPs, workflows) ──────────────────────
  const chains: Record<string, string[]> = {}
  const timers: { signal: string; ms: number; last: number }[] = []
  const sops: Record<string, string[]> = {}

  const chain = (name: string, steps: string[]) => {
    chains[name] = steps
    on(`chain:${name}`, async (data, e) => {
      const step = (data._step as number) || 0
      if (step >= steps.length) return { complete: true }
      const outcome = await ask(steps[step], { ...data, _chain: step }, `chain:${name}`)
      if (outcome.result !== undefined) {
        e(`chain:${name}`, { ...data, _step: step + 1 })
      }
      return { step, outcome }
    })
  }

  const timer = (signal: string, ms: number) => {
    timers.push({ signal, ms, last: 0 })
  }

  const sop = (target: string, prereqs: string[]) => {
    sops[target] = prereqs
  }

  // ── Tick ──────────────────────────────────────────────────
  const tick = async (): Promise<TickResult> => {
    const start = Date.now()
    cycle++

    // Fire due timers
    const now = Date.now()
    for (const t of timers) {
      if (now - t.last >= t.ms) {
        emit(t.signal, { _timer: true })
        t.last = now
      }
    }

    // Periodic fade
    if (cycle % 3000 === 0) fade()  // ~5 min at 100ms

    // Drain
    const sig = drain()
    if (!sig) return { cycle, ms: Date.now() - start, queue: 0 }

    const { to, data } = sig
    const from = (data._from as string) || 'entry'
    const path = `${from}→${to}`

    // Check SOP
    const prereqs = sops[to]
    if (prereqs) {
      for (const p of prereqs) {
        const outcome = await ask(p, data, to)
        if (!outcome.result) {
          warn(path, 0.5)
          return { cycle, path, outcome: { dissolved: true }, ms: Date.now() - start, queue: queue.length }
        }
      }
    }

    // Execute
    const outcome = await ask(to, data, from)

    // Mark/warn
    const chainBonus = Math.min((data._chain as number) || 0, 5)
    if (outcome.result !== undefined) {
      mark(path, 1 + chainBonus)
    } else if (outcome.dissolved) {
      warn(path, outcome.timeout ? 0 : 1)
    }

    return { cycle, path, outcome, ms: Date.now() - start, queue: queue.length }
  }

  // ── Run ───────────────────────────────────────────────────
  let running = false
  const run = (interval = 100) => {
    running = true
    const loop = async () => {
      if (!running) return
      const result = await tick()
      const delay = Math.max(0, interval - result.ms)
      setTimeout(loop, delay)
    }
    loop()
    return () => { running = false }
  }

  // ── Stats ─────────────────────────────────────────────────
  const stats = () => ({
    cycle,
    queue: queue.length,
    handlers: Object.keys(handlers).length,
    paths: Object.keys(strength).length,
    highways: highways(10),
  })

  return {
    // Core
    on, emit, ask, tick, run,
    // Pheromone
    mark, warn, fade, net, isHighway, isToxic, highways,
    // Context
    loadContext, getContext,
    // Chains
    chain, timer, sop,
    // State
    stats,
    get strength() { return { ...strength } },
    get resistance() { return { ...resistance } },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP — Load from substrate.md
// ═══════════════════════════════════════════════════════════════════════════

export const bootstrap = async (configPath = 'substrate.md') => {
  const one = create()
  const md = await readFile(configPath, 'utf-8').catch(() => '')

  // Parse context section
  const ctxMatch = md.match(/## Context\n```\n([\s\S]*?)```/)
  if (ctxMatch) {
    for (const line of ctxMatch[1].trim().split('\n')) {
      const path = line.trim()
      if (path) {
        const key = path.split('/').pop()?.replace('.md', '') || path
        await one.loadContext(key, path)
      }
    }
  }

  // Parse timers section
  const timerMatch = md.match(/## Timers\n[\s\S]*?\|[-\s|]+\|([\s\S]*?)(?=\n## |\n---|\n$)/)
  if (timerMatch) {
    for (const line of timerMatch[1].trim().split('\n')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 2) {
        const signal = cells[0]
        const ms = parseMs(cells[1])
        if (signal && ms) one.timer(signal, ms)
      }
    }
  }

  // Parse SOPs section
  const sopMatch = md.match(/## SOPs\n([\s\S]*?)(?=\n## |\n---|\n$)/)
  if (sopMatch) {
    const sopBlocks = sopMatch[1].split(/### Before `([^`]+)`/)
    for (let i = 1; i < sopBlocks.length; i += 2) {
      const target = sopBlocks[i]
      const prereqs = sopBlocks[i + 1]?.match(/- (\S+)/g)?.map(m => m.slice(2)) || []
      if (prereqs.length) one.sop(target, prereqs)
    }
  }

  // Parse workflows section
  const wfMatch = md.match(/## Workflows\n([\s\S]*?)(?=\n## |\n---|\n$)/)
  if (wfMatch) {
    const wfBlocks = wfMatch[1].split(/### (\S+)/)
    for (let i = 1; i < wfBlocks.length; i += 2) {
      const name = wfBlocks[i]
      const steps = wfBlocks[i + 1]?.match(/\d+\. (\S+)/g)?.map(m => m.replace(/\d+\. /, '')) || []
      if (steps.length) one.chain(name, steps)
    }
  }

  return one
}

const parseMs = (s: string): number => {
  const m = s.match(/^(\d+)(ms|s|m|h|d)?$/)
  if (!m) return 0
  const n = parseInt(m[1], 10)
  switch (m[2]) {
    case 's': return n * 1000
    case 'm': return n * 60_000
    case 'h': return n * 3600_000
    case 'd': return n * 86400_000
    default: return n
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ONE LOOP. ONE TRUTH.
// ═══════════════════════════════════════════════════════════════════════════
