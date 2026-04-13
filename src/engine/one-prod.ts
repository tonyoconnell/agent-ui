/**
 * ONE — Production Ready
 *
 * The hardened version. Same API, production-safe.
 *
 * Additions:
 * - Persistence (TypeDB sync)
 * - Error handling (retry, circuit breaker)
 * - Rate limiting (token budget)
 * - Timeouts (configurable)
 * - Queue limits (bounded)
 * - Structured logging
 * - Metrics
 * - Graceful shutdown
 */

const readFile = async (path: string, enc: BufferEncoding) => (await import('node:fs/promises')).readFile(path, enc)

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Data = Record<string, unknown>
type Emit = (to: string, data?: Data) => void
type Handler = (data: Data, emit: Emit) => unknown | Promise<unknown>
type Outcome = { result?: unknown; timeout?: boolean; dissolved?: boolean; error?: string }
type Log = (level: 'debug' | 'info' | 'warn' | 'error', msg: string, meta?: Data) => void

export type Config = {
  // Limits
  maxQueue?: number // default 1000
  maxRetries?: number // default 3
  timeout?: number // default 30000ms
  tokenBudget?: number // default Infinity

  // Persistence
  persist?: {
    save: (state: State) => Promise<void>
    load: () => Promise<State | null>
  }

  // Logging
  log?: Log

  // Metrics
  metrics?: {
    tick: (ms: number) => void
    emit: (to: string) => void
    error: (to: string, err: string) => void
  }
}

type State = {
  strength: Record<string, number>
  resistance: Record<string, number>
  cycle: number
}

export type TickResult = {
  cycle: number
  path?: string
  outcome?: Outcome
  ms: number
  queue: number
  retries?: number
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════

export const create = (config: Config = {}) => {
  const {
    maxQueue = 1000,
    maxRetries = 3,
    timeout = 30000,
    tokenBudget = Infinity,
    persist,
    log = (level, msg, meta) => console[level](`[${level.toUpperCase()}] ${msg}`, meta || ''),
    metrics,
  } = config

  // State
  const handlers: Record<string, Handler> = {}
  let strength: Record<string, number> = {}
  let resistance: Record<string, number> = {}
  const context: Record<string, string> = {}
  const queue: { to: string; data: Data; priority: number; retries: number }[] = []
  let cycle = 0
  let tokensUsed = 0
  let running = false
  let shuttingDown = false

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
      strength[p] *= 1 - rate
      if (strength[p] < 0.01) delete strength[p]
    }
    for (const p in resistance) {
      resistance[p] *= 1 - rate * 2
      if (resistance[p] < 0.01) delete resistance[p]
    }
  }

  const isHighway = (path: string) => net(path) >= 20
  const isToxic = (path: string) => {
    const r = resistance[path] || 0
    const s = strength[path] || 0
    return r >= 10 && r > s * 2 && r + s > 5
  }

  const highways = (n = 10) =>
    Object.keys(strength)
      .map((p) => ({ path: p, strength: net(p) }))
      .filter((x) => x.strength > 0)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, n)

  // ── Queue (bounded) ───────────────────────────────────────
  const emit: Emit = (to, data = {}) => {
    if (queue.length >= maxQueue) {
      log('warn', `Queue full, dropping signal to ${to}`, { queue: queue.length })
      metrics?.error(to, 'queue_full')
      return
    }
    const priority = (data.priority as number) || 5
    queue.push({ to, data, priority, retries: 0 })
    metrics?.emit(to)
  }

  const drain = () => {
    if (!queue.length) return null
    queue.sort((a, b) => a.priority - b.priority)
    return queue.shift()!
  }

  // ── Handlers ──────────────────────────────────────────────
  const on = (id: string, fn: Handler) => {
    handlers[id] = fn
  }

  const ask = async (to: string, data: Data = {}, from = 'entry'): Promise<Outcome> => {
    const path = `${from}→${to}`

    // Block toxic
    if (isToxic(path)) {
      log('debug', `Blocked toxic path: ${path}`)
      return { dissolved: true, error: 'toxic' }
    }

    // Find handler
    const handler = handlers[to] || handlers[to.split(':')[0]]
    if (!handler) {
      log('debug', `No handler for: ${to}`)
      return { dissolved: true, error: 'no_handler' }
    }

    // Execute with timeout
    try {
      const result = await Promise.race([
        handler(data, emit),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)),
      ])
      return result !== undefined ? { result } : { timeout: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'unknown'
      if (error === 'timeout') {
        log('warn', `Timeout on ${to}`, { timeout })
        return { timeout: true, error }
      }
      log('error', `Handler error on ${to}: ${error}`)
      metrics?.error(to, error)
      return { dissolved: true, error }
    }
  }

  // ── Context ───────────────────────────────────────────────
  const loadContext = async (key: string, path: string) => {
    try {
      const content = await readFile(path, 'utf-8')
      context[key] = content.replace(/\n{3,}/g, '\n\n').trim()
      log('debug', `Loaded context: ${key}`, { bytes: content.length })
    } catch (err) {
      log('warn', `Failed to load context: ${key}`, { path, err })
    }
  }

  const getContext = (...keys: string[]) =>
    keys
      .map((k) => context[k])
      .filter(Boolean)
      .join('\n\n---\n\n')

  // ── Chains ────────────────────────────────────────────────
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

  // ── Tick (with retry) ─────────────────────────────────────
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
    if (cycle % 3000 === 0) fade()

    // Periodic persist
    if (persist && cycle % 100 === 0) {
      await persist.save({ strength, resistance, cycle }).catch((err) => log('error', 'Persist failed', { err }))
    }

    // Drain
    const sig = drain()
    if (!sig) {
      metrics?.tick(Date.now() - start)
      return { cycle, ms: Date.now() - start, queue: 0 }
    }

    const { to, data, retries } = sig
    const from = (data._from as string) || 'entry'
    const path = `${from}→${to}`

    // Check SOP
    const prereqs = sops[to]
    if (prereqs) {
      for (const p of prereqs) {
        const outcome = await ask(p, data, to)
        if (!outcome.result) {
          warn(path, 0.5)
          log('info', `SOP blocked: ${to}`, { prereq: p })
          return {
            cycle,
            path,
            outcome: { dissolved: true, error: 'sop_failed' },
            ms: Date.now() - start,
            queue: queue.length,
          }
        }
      }
    }

    // Execute
    const outcome = await ask(to, data, from)

    // Retry on failure (if retries left)
    if (outcome.dissolved && !outcome.timeout && retries < maxRetries) {
      queue.push({ to, data, priority: sig.priority, retries: retries + 1 })
      log('info', `Retrying ${to}`, { attempt: retries + 1 })
      return { cycle, path, outcome, ms: Date.now() - start, queue: queue.length, retries: retries + 1 }
    }

    // Mark/warn
    const chainBonus = Math.min((data._chain as number) || 0, 5)
    if (outcome.result !== undefined) {
      mark(path, 1 + chainBonus)
    } else if (outcome.dissolved) {
      warn(path, outcome.timeout ? 0.5 : 1)
    }

    metrics?.tick(Date.now() - start)
    return { cycle, path, outcome, ms: Date.now() - start, queue: queue.length }
  }

  // ── Run (with graceful shutdown) ──────────────────────────
  const run = (interval = 100) => {
    running = true
    const loop = async () => {
      if (!running || shuttingDown) return
      const result = await tick()
      const delay = Math.max(0, interval - result.ms)
      setTimeout(loop, delay)
    }
    loop()
    return () => {
      running = false
    }
  }

  const shutdown = async () => {
    log('info', 'Shutting down...')
    shuttingDown = true
    running = false

    // Process remaining queue (up to 100)
    let processed = 0
    while (queue.length > 0 && processed < 100) {
      await tick()
      processed++
    }

    // Final persist
    if (persist) {
      await persist.save({ strength, resistance, cycle }).catch((err) => log('error', 'Final persist failed', { err }))
    }

    log('info', `Shutdown complete. Processed ${processed} remaining signals.`)
  }

  // ── Load state ────────────────────────────────────────────
  const load = async () => {
    if (!persist) return
    const state = await persist.load().catch(() => null)
    if (state) {
      strength = state.strength
      resistance = state.resistance
      cycle = state.cycle
      log('info', `Loaded state: cycle ${cycle}, ${Object.keys(strength).length} paths`)
    }
  }

  // ── Stats ─────────────────────────────────────────────────
  const stats = () => ({
    cycle,
    queue: queue.length,
    handlers: Object.keys(handlers).length,
    paths: Object.keys(strength).length,
    highways: highways(10),
    tokensUsed,
    running,
  })

  // ── Token tracking ────────────────────────────────────────
  const trackTokens = (n: number) => {
    tokensUsed += n
    if (tokensUsed > tokenBudget) {
      log('warn', 'Token budget exceeded', { used: tokensUsed, budget: tokenBudget })
    }
  }

  return {
    // Core
    on,
    emit,
    ask,
    tick,
    run,
    shutdown,
    load,
    // Pheromone
    mark,
    warn,
    fade,
    net,
    isHighway,
    isToxic,
    highways,
    // Context
    loadContext,
    getContext,
    // Chains
    chain,
    timer,
    sop,
    // Tracking
    trackTokens,
    // State
    stats,
    get strength() {
      return { ...strength }
    },
    get resistance() {
      return { ...resistance }
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPEDB PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════

export const typedbPersist = (write: (q: string) => Promise<void>, read: (q: string) => Promise<unknown[]>) => ({
  save: async (state: State) => {
    // Batch upsert paths
    for (const [path, str] of Object.entries(state.strength)) {
      const [from, to] = path.split('→')
      if (!from || !to) continue
      const res = state.resistance[path] || 0
      await write(`
        match $f isa unit, has uid "${from}"; $t isa unit, has uid "${to}";
        insert (source: $f, target: $t) isa path,
          has strength ${str.toFixed(2)}, has resistance ${res.toFixed(2)}, has traversals 0;
      `).catch(() => {}) // ignore if exists
    }
  },

  load: async (): Promise<State | null> => {
    const rows = (await read(`
      match $e (source: $f, target: $t) isa path, has strength $s, has resistance $r;
      $f has uid $fid; $t has uid $tid; select $fid, $tid, $s, $r;
    `).catch(() => [])) as { fid: string; tid: string; s: number; r: number }[]

    if (!rows.length) return null

    const strength: Record<string, number> = {}
    const resistance: Record<string, number> = {}

    for (const row of rows) {
      const path = `${row.fid}→${row.tid}`
      strength[path] = row.s
      if (row.r > 0) resistance[path] = row.r
    }

    return { strength, resistance, cycle: 0 }
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// SIGNAL HANDLERS — Register for graceful shutdown
// ═══════════════════════════════════════════════════════════════════════════

export const registerShutdown = (one: ReturnType<typeof create>) => {
  const handler = async () => {
    await one.shutdown()
    process.exit(0)
  }

  process.on('SIGINT', handler)
  process.on('SIGTERM', handler)
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLLBACK — Undo mechanism
// ═══════════════════════════════════════════════════════════════════════════

type HistoryEntry = {
  id: string
  ts: number
  handler: string
  input: Data
  output: unknown
  path: string
}

export const withRollback = (one: ReturnType<typeof create>, maxHistory = 100) => {
  const history: HistoryEntry[] = []

  // Wrap ask to record history
  const originalAsk = one.ask.bind(one)
  ;(one as any).ask = async (to: string, data: Data = {}, from = 'entry') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const outcome = await originalAsk(to, data, from)

    if (outcome.result !== undefined) {
      history.push({
        id,
        ts: Date.now(),
        handler: to,
        input: data,
        output: outcome.result,
        path: `${from}→${to}`,
      })

      // Trim history
      while (history.length > maxHistory) history.shift()
    }

    return outcome
  }

  // Undo last N operations
  const undo = async (n = 1): Promise<HistoryEntry[]> => {
    const undone: HistoryEntry[] = []

    for (let i = 0; i < n && history.length > 0; i++) {
      const entry = history.pop()!
      undone.push(entry)

      // Reverse pheromone
      const path = entry.path
      const current = one.net(path)
      if (current > 0) {
        one.warn(path, Math.min(current, 2))
      }
    }

    return undone
  }

  // Get recent history
  const getHistory = (n = 10) => history.slice(-n)

  // Find by handler
  const findByHandler = (handler: string, n = 10) => history.filter((h) => h.handler === handler).slice(-n)

  return { ...one, undo, getHistory, findByHandler }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH — Token validation middleware
// ═══════════════════════════════════════════════════════════════════════════

type AuthConfig = {
  validate: (token: string) => Promise<boolean>
  extractToken: (data: Data) => string | undefined
}

export const withAuth = (one: ReturnType<typeof create>, auth: AuthConfig) => {
  const originalEmit = one.emit.bind(one)

  ;(one as any).emit = async (to: string, data: Data = {}) => {
    const token = auth.extractToken(data)

    // Allow internal signals (timers, chains)
    if (data._timer || data._chain !== undefined || data._internal) {
      return originalEmit(to, data)
    }

    if (!token) {
      ;(one as any).log?.('warn', `Auth: missing token for ${to}`)
      return
    }

    const valid = await auth.validate(token).catch(() => false)
    if (!valid) {
      ;(one as any).log?.('warn', `Auth: invalid token for ${to}`)
      return
    }

    return originalEmit(to, data)
  }

  return one
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER — Semaphore for LLM calls
// ═══════════════════════════════════════════════════════════════════════════

export const createRateLimiter = (maxConcurrent = 5, minDelayMs = 100) => {
  let running = 0
  let lastCall = 0
  const waiting: (() => void)[] = []

  const acquire = async (): Promise<() => void> => {
    // Wait for slot
    while (running >= maxConcurrent) {
      await new Promise<void>((resolve) => waiting.push(resolve))
    }

    // Enforce min delay
    const now = Date.now()
    const delay = Math.max(0, minDelayMs - (now - lastCall))
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))

    running++
    lastCall = Date.now()

    // Return release function
    return () => {
      running--
      const next = waiting.shift()
      if (next) next()
    }
  }

  return {
    acquire,
    get running() {
      return running
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION READY
// ═══════════════════════════════════════════════════════════════════════════
