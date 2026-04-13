/**
 * ONE — The Substrate v2
 *
 * Radical simplification. Maximum efficiency.
 *
 * One concept: signal → handler → emit
 * One loop: drain → run → mark
 * One file: substrate.md → config
 *
 * Everything else emerges.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES — Minimal
// ═══════════════════════════════════════════════════════════════════════════

type D = Record<string, unknown> // data
type E = (to: string, d?: D) => void // emit
type H = (d: D, e: E) => unknown // handler
type O = { r?: unknown; t?: boolean; d?: boolean } // outcome: result/timeout/dissolved

// ═══════════════════════════════════════════════════════════════════════════
// STATE — Two maps, one queue
// ═══════════════════════════════════════════════════════════════════════════

const h: Record<string, H> = {} // handlers
const s: Record<string, number> = {} // strength
const r: Record<string, number> = {} // resistance
const q: { to: string; d: D }[] = [] // queue

// ═══════════════════════════════════════════════════════════════════════════
// CORE — 20 lines
// ═══════════════════════════════════════════════════════════════════════════

const emit: E = (to, d = {}) => q.push({ to, d })

const mark = (p: string, n = 1) => {
  s[p] = (s[p] || 0) + n
}
const warn = (p: string, n = 1) => {
  r[p] = (r[p] || 0) + n
}
const net = (p: string) => (s[p] || 0) - (r[p] || 0)

const on = (id: string, fn: H) => {
  h[id] = fn
}

const tick = async (from = 'entry'): Promise<O & { p?: string; ms: number }> => {
  const t0 = Date.now()
  if (!q.length) return { ms: 0 }

  // Drain highest net strength
  q.sort((a, b) => net(`${from}→${b.to}`) - net(`${from}→${a.to}`))
  const { to, d } = q.shift()!
  const p = `${from}→${to}`

  // Run handler
  const fn = h[to] || h[to.split(':')[0]]
  if (!fn) {
    warn(p, 0.5)
    return { d: true, p, ms: Date.now() - t0 }
  }

  try {
    const result = await fn(d, emit)
    if (result !== undefined) {
      mark(p, 1 + Math.min((d._chain as number) || 0, 5)) // chain bonus
      return { r: result, p, ms: Date.now() - t0 }
    }
    return { t: true, p, ms: Date.now() - t0 } // no result = timeout equivalent
  } catch {
    warn(p, 1)
    return { d: true, p, ms: Date.now() - t0 }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAINS — Replace timers, SOPs, workflows
// ═══════════════════════════════════════════════════════════════════════════

const chains: Record<string, string[]> = {}

// Define a chain: first signal triggers the rest in sequence
const chain = (name: string, steps: string[]) => {
  chains[name] = steps
  on(name, (d, e) => {
    const i = (d._i as number) || 0
    if (i >= steps.length) return { done: true, steps: steps.length }
    e(steps[i], { ...d, _i: i + 1, _chain: i + 1, _from: name })
    e(name, { ...d, _i: i + 1 }) // continue chain
    return { step: i, next: steps[i] }
  })
}

// Timer = chain that reschedules itself
const timer = (signal: string, ms: number) => {
  const tick = () => {
    emit(signal)
    setTimeout(tick, ms)
  }
  setTimeout(tick, ms)
}

// SOP = chain that must complete before target
const sop = (target: string, prereqs: string[]) => {
  const original = h[target]
  on(target, async (d, e) => {
    for (const p of prereqs) {
      emit(p, { ...d, _sop: target })
      const result = await tick(target)
      if (result.d) {
        warn(`sop:${target}`, 1)
        return { blocked: p }
      }
    }
    mark(`sop:${target}`, 1)
    return original?.(d, e)
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT — Pre-indexed, token-efficient
// ═══════════════════════════════════════════════════════════════════════════

const ctx: Record<string, string> = {}

// Load context once, compressed
const loadCtx = (key: string, content: string) => {
  // Strip comments, collapse whitespace, keep structure
  ctx[key] = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Get context for prompt — returns only what's needed
const getCtx = (...keys: string[]) =>
  keys
    .map((k) => ctx[k] || '')
    .filter(Boolean)
    .join('\n---\n')

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING — Adaptive
// ═══════════════════════════════════════════════════════════════════════════

let cycle = 0
const decay = 0.02 // 2% per fade cycle
const _learnRate = () => 1 + Math.log10(cycle + 1) // grows with experience

const fade = () => {
  for (const p in s) {
    s[p] *= 1 - decay
    if (s[p] < 0.01) delete s[p]
  }
  for (const p in r) {
    r[p] *= 1 - decay * 2
    if (r[p] < 0.01) delete r[p]
  } // forgive faster
}

const highway = (p: string, threshold = 20) => net(p) >= threshold
const toxic = (p: string) => r[p] >= 10 && r[p] > (s[p] || 0) * 2

// Top paths
const highways = (n = 10) =>
  Object.keys(s)
    .map((p) => ({ p, n: net(p) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, n)

// ═══════════════════════════════════════════════════════════════════════════
// RUN — The loop
// ═══════════════════════════════════════════════════════════════════════════

const run = async (interval = 100) => {
  const loop = async () => {
    cycle++
    if (cycle % 3000 === 0) fade() // every 5 min at 100ms tick
    const result = await tick()
    setTimeout(loop, result.ms < interval ? interval - result.ms : 0)
  }
  loop()
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT — The API
// ═══════════════════════════════════════════════════════════════════════════

export const one = {
  // Core
  on,
  emit,
  tick,
  run,
  // Chains
  chain,
  timer,
  sop,
  // Context
  loadCtx,
  getCtx,
  // Learning
  mark,
  warn,
  fade,
  highway,
  toxic,
  highways,
  // State (read-only)
  get q() {
    return q.length
  },
  get cycle() {
    return cycle
  },
  get handlers() {
    return Object.keys(h)
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE
// ═══════════════════════════════════════════════════════════════════════════

/*
import { one } from './one'

// Load context
one.loadCtx('dsl', await Bun.file('docs/DSL.md').text())
one.loadCtx('dict', await Bun.file('docs/dictionary.md').text())

// Define handlers
one.on('agent:chat', (d, e) => {
  const ctx = one.getCtx('dsl', 'dict')
  return llm.complete(`${ctx}\n\n${d.message}`)
})

one.on('world:fade', () => { one.fade(); return true })
one.on('world:evolve', (d, e) => {
  // find struggling, emit evolve-unit for each
})

// Define chains
one.chain('ship', ['branch', 'implement', 'test', 'deploy'])
one.sop('deploy', ['test', 'lint'])
one.timer('world:fade', 300_000)
one.timer('world:evolve', 600_000)

// Run
one.emit('workflow:ship', { feature: 'new-thing' })
one.run(100)
*/
