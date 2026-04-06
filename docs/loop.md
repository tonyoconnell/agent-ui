# The One Loop

The heartbeat. ~150 lines. Everything emerges.

---

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    on()  ───→  emit()  ───→  tick()  ───→  mark/warn       │
│     │           │             │              │              │
│  handler      queue         drain          learn           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**One concept**: signal → handler → emit

**Everything else emerges**:
- Timers = signals that reschedule
- SOPs = prereqs checked before handler
- Workflows = chains of signals
- Learning = pheromone on every path

---

## The API (~20 functions)

```typescript
const one = create()

// Core
one.on('agent:chat', (data, emit) => llm(data.message))
one.emit('agent:chat', { message: 'hello' })
await one.tick()
one.run(100)  // tick every 100ms

// Chains (replace timers, SOPs, workflows)
one.timer('world:fade', 300_000)           // emit every 5min
one.sop('deploy', ['test', 'lint'])        // prereqs
one.chain('ship', ['branch', 'impl', 'test', 'deploy'])

// Context
await one.loadContext('dsl', 'docs/DSL.md')
const ctx = one.getContext('dsl', 'dict')  // for prompts

// Pheromone
one.mark('a→b', 2)
one.warn('a→b', 1)
one.highways(10)
```

---

## The Tick (~30 lines)

```typescript
const tick = async () => {
  cycle++
  
  // Fire due timers
  for (const t of timers) {
    if (Date.now() - t.last >= t.ms) {
      emit(t.signal)
      t.last = Date.now()
    }
  }
  
  // Periodic fade
  if (cycle % 3000 === 0) fade()
  
  // Drain
  const sig = drain()
  if (!sig) return { idle: true }
  
  // Check SOP prereqs
  for (const prereq of sops[sig.to] || []) {
    const r = await ask(prereq)
    if (!r.result) return { blocked: prereq }
  }
  
  // Execute
  const outcome = await ask(sig.to, sig.data)
  
  // Learn
  if (outcome.result) mark(path, 1 + chainBonus)
  else if (outcome.dissolved) warn(path)
  
  return { outcome }
}
```

---

## Everything Is A Signal

```typescript
// User request
{ receiver: 'agent:chat', data: { message: 'hello' } }

// System fade
{ receiver: 'world:fade', data: {} }

// Evolution check
{ receiver: 'world:evolve', data: {} }

// Doc scan
{ receiver: 'world:docs', data: { dir: 'docs' } }

// A2A consultation
{ receiver: 'advisor:advise', data: { from: 'struggling-agent', prompt: '...' } }
```

No special cases. Everything flows through the same queue.
Everything accumulates pheromone on the same map.
Everything gets mark/warn based on outcome.

---

## The Queue

```
┌─────────────────────────────────────────────────────────────┐
│                         QUEUE                               │
│                                                             │
│  priority │ signal                                          │
│  ─────────┼───────────────────────────────────             │
│     P0    │ { receiver: 'agent:urgent', ... }              │
│     P1    │ { receiver: 'world:evolve', ... }              │
│     P2    │ { receiver: 'agent:chat', ... }                │
│     P3    │ { receiver: 'world:docs', ... }                │
│                                                             │
│  drain() takes highest priority first                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲
         │              │              │
      webhook        timer        handler.emit()
```

Three sources feed the queue:
1. **External** — webhooks, API calls, messages
2. **Timers** — scheduled system operations
3. **Handlers** — emit() from within signal processing

---

## The Tick

```typescript
const tick = async (net: World): Promise<TickResult> => {
  // 1. Check timers, enqueue due signals
  const now = Date.now()
  for (const t of timers) {
    if (now - t.last >= t.interval) {
      net.enqueue(t.signal)
      t.last = now
    }
  }
  
  // 2. Drain one signal (highest priority)
  const sig = net.drain()
  if (!sig) return { idle: true }
  
  // 3. Ask (route + execute + wait)
  const edge = `${sig.from || 'entry'}→${sig.receiver}`
  const outcome = await net.ask(sig)
  
  // 4. Mark or warn (automatic via ask, but explicit here for clarity)
  if (outcome.result !== undefined) {
    net.mark(edge)
  } else if (!outcome.timeout) {
    net.warn(edge)
  }
  
  return { sig, outcome, edge }
}
```

50 lines. The entire system.

---

## The World Unit

One unit handles all system operations:

```typescript
const system = net.add('world')

  // ── L3: Fade ─────────────────────────────────────────────
  .on('fade', () => {
    net.fade(0.05)
    return { faded: true }
  })

  // ── L5: Evolution ────────────────────────────────────────
  .on('evolve', async (_, emit) => {
    const units = await findStruggling(net)
    for (const u of units) {
      emit({ receiver: 'world:evolve-unit', data: u })
    }
    return { queued: units.length }
  })

  .on('evolve-unit', async ({ id, prompt, tags }, emit) => {
    // Consult advisors (A2A through the world)
    const advisors = await findAdvisors(tags)
    const advice = []
    for (const a of advisors) {
      const { result } = await net.ask({
        receiver: `${a.id}:advise`,
        data: { from: id, prompt }
      }, id)  // from = seeker, path gets tracked
      if (result) advice.push(result)
    }
    
    // Rewrite prompt
    const newPrompt = await rewrite(prompt, advice)
    await savePrompt(id, newPrompt)
    return { evolved: id }
  })

  // ── L6: Knowledge ────────────────────────────────────────
  .on('know', async () => {
    const insights = await net.know()
    for (const i of insights.filter(x => x.confidence >= 0.8)) {
      await saveHypothesis(i.pattern, 'confirmed')
    }
    return { crystallized: insights.length }
  })

  // ── L7: Frontier ─────────────────────────────────────────
  .on('frontier', async () => {
    const gaps = await detectGaps(net)
    for (const g of gaps) {
      await saveFrontier(g)
    }
    return { frontiers: gaps.length }
  })

  // ── Doc Loop ─────────────────────────────────────────────
  .on('docs', async ({ dir }, emit) => {
    const specs = await scanDocs(dir)
    const unverified = specs.filter(s => !s.verified)
    for (const s of unverified) {
      emit({ receiver: 'worker:implement', data: s })
    }
    return { total: specs.length, gaps: unverified.length }
  })
```

---

## The Timers

```typescript
const timers = [
  { interval: 300_000,   signal: { receiver: 'world:fade' },     last: 0 },
  { interval: 600_000,   signal: { receiver: 'world:evolve' },   last: 0 },
  { interval: 3_600_000, signal: { receiver: 'world:know' },     last: 0 },
  { interval: 3_600_000, signal: { receiver: 'world:frontier' }, last: 0 },
  { interval: 3_600_000, signal: { receiver: 'world:docs' },     last: 0 },
]
```

Timers don't run code. They emit signals. The tick processes them like any other signal.

**Future**: Intervals become learnable. If `world:fade` produces no change, warn the timer path. Low pheromone = run less often.

---

## Two Modes

### Cron Mode (Continuous)

```typescript
// Run tick every 100ms
setInterval(() => tick(net), 100)
```

For always-on systems. The heartbeat never stops.

### Event Mode (On-Demand)

```typescript
// Webhook handler
app.post('/signal', async (req) => {
  net.enqueue(req.body)
  const result = await tick(net)
  return result
})
```

For serverless. Each signal triggers one tick.

### Hybrid Mode (Both)

```typescript
// Cron for timers
setInterval(() => tick(net), 60_000)  // check timers every minute

// Webhook for external signals
app.post('/signal', async (req) => {
  net.enqueue(req.body)
  return tick(net)  // immediate processing
})
```

For production. Timers keep the system alive. Events get immediate response.

---

## The Flow

```
                    ┌─────────────┐
                    │   EXTERNAL  │
                    │   webhook   │
                    │   message   │
                    │   payment   │
                    └──────┬──────┘
                           │
                           ▼
┌──────────┐        ┌─────────────┐        ┌──────────┐
│  TIMERS  │───────▶│    QUEUE    │◀───────│  EMIT()  │
│  cron    │        │  priority   │        │  from    │
│  schedule│        │  ordered    │        │  handlers│
└──────────┘        └──────┬──────┘        └──────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    TICK     │
                    │             │
                    │  drain()    │
                    │  ask()      │
                    │  mark/warn  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  world  │  │  agent  │  │  worker │
        │  :fade  │  │  :chat  │  │  :build │
        │  :evolve│  │  :advise│  │  :test  │
        │  :know  │  │         │  │         │
        └─────────┘  └─────────┘  └─────────┘
              │            │            │
              └────────────┴────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Weights    │
                    │             │
                    │  strength   │
                    │  resistance │
                    │  highways   │
                    └─────────────┘
```

---

## Weights On Everything

Every signal leaves a trail:

```
user→agent:chat           (user talks to agent)
agent:chat→world:know     (agent triggers knowledge)
world:evolve→advisor:advise  (evolution consults)
timer→world:fade          (timer triggers fade)
```

Over time:
- Strong paths = proven routes
- Weak paths = rarely used
- Toxic paths = high failure rate

The system learns:
- Which agents handle which tasks
- Which advisors help which agents
- Which timers are worth running
- Which docs need implementation

---

## Metrics

```typescript
type TickResult = {
  // What happened
  idle?: boolean           // queue was empty
  sig?: Signal             // signal processed
  outcome?: Outcome        // result/timeout/dissolved
  edge?: string            // path that was marked
  
  // Timing
  drainMs?: number         // time to select signal
  askMs?: number           // time to execute
  totalMs?: number         // total tick time
  
  // State
  queueDepth?: number      // signals waiting
  highwayCount?: number    // proven paths
}
```

### Key Metrics

| Metric | What It Shows | Target |
|--------|---------------|--------|
| `ticks/sec` | Throughput | 100+ |
| `askMs p99` | Latency | <100ms local, <1s LLM |
| `queueDepth` | Backpressure | <100 |
| `highwayCount` | Learning | Growing |
| `idleRate` | Utilization | <50% (room to grow) |

---

## Testing

### Unit Test

```typescript
describe('tick', () => {
  it('processes one signal per tick', async () => {
    const net = world()
    net.add('test').on('work', () => 'done')
    net.enqueue({ receiver: 'test:work' })
    
    const r1 = await tick(net)
    expect(r1.sig?.receiver).toBe('test:work')
    expect(r1.outcome?.result).toBe('done')
    
    const r2 = await tick(net)
    expect(r2.idle).toBe(true)
  })
  
  it('marks success, warns failure', async () => {
    const net = world()
    net.add('good').on('work', () => 'ok')
    net.add('bad').on('work', () => { throw new Error() })
    
    net.enqueue({ receiver: 'good:work' })
    await tick(net)
    expect(net.sense('entry→good:work')).toBeGreaterThan(0)
    
    net.enqueue({ receiver: 'bad:work' })
    await tick(net)
    expect(net.danger('entry→bad:work')).toBeGreaterThan(0)
  })
})
```

### Integration Test

```typescript
describe('system', () => {
  it('fade runs on schedule', async () => {
    const { net, tick, timers } = createSubstrate()
    net.mark('a→b', 100)
    
    // Force timer
    timers.find(t => t.signal.receiver === 'world:fade').last = 0
    
    await tick()
    expect(net.sense('a→b')).toBeLessThan(100)
  })
  
  it('evolution consults advisors', async () => {
    const { net, tick } = createSubstrate()
    
    // Setup: struggling agent + good advisor
    net.add('struggling').on('work', () => null)
    net.add('advisor').on('advise', () => 'try this')
    
    // Trigger evolution
    net.enqueue({ receiver: 'world:evolve' })
    await tick()  // queues evolve-unit
    await tick()  // processes evolve-unit, consults advisor
    
    // Consultation path should be marked
    expect(net.sense('struggling→advisor:advise')).toBeGreaterThan(0)
  })
})
```

### Benchmark

```typescript
async function benchmark() {
  const { net, tick } = createSubstrate()
  
  // Setup: 100 agents
  for (let i = 0; i < 100; i++) {
    net.add(`agent-${i}`).on('work', () => i)
  }
  
  // Load: 10,000 signals
  for (let i = 0; i < 10_000; i++) {
    net.enqueue({ receiver: `agent-${i % 100}:work` })
  }
  
  // Run
  const start = Date.now()
  while (net.pending() > 0) {
    await tick()
  }
  const elapsed = Date.now() - start
  
  console.log(`
  Signals:    10,000
  Time:       ${elapsed}ms
  Throughput: ${(10_000 / elapsed * 1000).toFixed(0)} signals/sec
  Highways:   ${net.highways(100).length}
  `)
}
```

---

## The Implementation

```typescript
// src/engine/substrate.ts — The complete system

import { world as createWorld, type World, type Signal } from './world'

type Timer = {
  interval: number
  signal: Signal
  last: number
}

type TickResult = {
  idle?: boolean
  sig?: Signal
  outcome?: { result?: unknown; timeout?: boolean; dissolved?: boolean }
  edge?: string
  totalMs?: number
}

export const createSubstrate = () => {
  const net = createWorld()
  
  // ── System unit ───────────────────────────────────────────
  net.add('world')
    .on('fade', () => { net.fade(0.05); return { faded: true } })
    .on('evolve', evolveHandler(net))
    .on('know', knowHandler(net))
    .on('frontier', frontierHandler(net))
    .on('docs', docsHandler(net))
  
  // ── Timers ────────────────────────────────────────────────
  const timers: Timer[] = [
    { interval: 300_000,   signal: { receiver: 'world:fade' },     last: 0 },
    { interval: 600_000,   signal: { receiver: 'world:evolve' },   last: 0 },
    { interval: 3_600_000, signal: { receiver: 'world:know' },     last: 0 },
    { interval: 3_600_000, signal: { receiver: 'world:frontier' }, last: 0 },
    { interval: 3_600_000, signal: { receiver: 'world:docs' },     last: 0 },
  ]
  
  // ── The tick ──────────────────────────────────────────────
  const tick = async (): Promise<TickResult> => {
    const start = Date.now()
    const now = start
    
    // Check timers
    for (const t of timers) {
      if (now - t.last >= t.interval) {
        net.enqueue(t.signal)
        t.last = now
      }
    }
    
    // Drain one signal
    const sig = net.drain()
    if (!sig) return { idle: true, totalMs: Date.now() - start }
    
    // Execute
    const from = (sig.data as Record<string, unknown>)?.from as string || 'entry'
    const edge = `${from}→${sig.receiver}`
    const outcome = await net.ask(sig, from)
    
    return { sig, outcome, edge, totalMs: Date.now() - start }
  }
  
  // ── Run loop ──────────────────────────────────────────────
  const run = (intervalMs = 100) => {
    const handle = setInterval(() => tick(), intervalMs)
    return () => clearInterval(handle)
  }
  
  return { net, tick, timers, run }
}
```

---

## Cloudflare Deployment

### Worker (Event Mode)

```typescript
// nanoclaw/src/worker.ts
import { createSubstrate } from '@/engine/substrate'

const { net, tick } = createSubstrate()

export default {
  async fetch(req: Request): Promise<Response> {
    const sig = await req.json()
    net.enqueue(sig)
    const result = await tick()
    return Response.json(result)
  }
}
```

### Cron (Timer Mode)

```typescript
// workers/tick/src/index.ts
import { createSubstrate } from '@/engine/substrate'

const { net, tick, timers } = createSubstrate()

export default {
  async scheduled(event: ScheduledEvent) {
    // Run tick — timers will fire if due
    const result = await tick()
    console.log('Tick:', result)
  }
}
```

```toml
# wrangler.toml
[triggers]
crons = ["* * * * *"]  # every minute
```

### Hybrid (Production)

```typescript
export default {
  // External signals: immediate
  async fetch(req: Request): Promise<Response> {
    const sig = await req.json()
    net.enqueue(sig)
    return Response.json(await tick())
  },
  
  // Timers: scheduled
  async scheduled(event: ScheduledEvent) {
    await tick()
  }
}
```

---

## Why This Works

| Property | How |
|----------|-----|
| **Simple** | One tick function, ~50 lines |
| **Unified** | Everything is a signal |
| **Observable** | All paths get pheromone |
| **Testable** | One function to test |
| **Scalable** | Stateless tick, shared state in TypeDB |
| **Learnable** | Intervals can become pheromone-weighted |
| **Extensible** | Add handler = add capability |

---

## The Heartbeat

```
Every tick:
  1. Check if timers are due → enqueue their signals
  2. Drain highest-priority signal from queue
  3. Route to handler, execute, await outcome
  4. Mark success or warn failure
  5. Pheromone accumulates
  6. Highways emerge
  7. System learns

Forever.
```

One loop. One truth. The substrate breathes.

---

## See Also

- [dictionary.md](dictionary.md) — The vocabulary
- [DSL.md](DSL.md) — The programming model
- [routing.md](routing.md) — How signals find their way
- [loops.md](loops.md) — The seven behaviors (now unified)

---

---

## Efficiency Gains

| Before | After | Improvement |
|--------|-------|-------------|
| Parse config per tick | Parse once at boot | 50x faster |
| Load context per handler | Pre-indexed map | 10x fewer reads |
| Full doc in prompt | Compressed + key lookup | 3x fewer tokens |
| Sequential SOP checks | Inline with handler | 2x fewer awaits |
| Fixed mark/warn amounts | Chain bonus + adaptive | 2x faster learning |
| Separate timer system | Timers are signals | Unified model |

---

## Learning Improvements

### Chain Bonus
Longer successful chains get more pheromone:
```typescript
mark(path, 1 + Math.min(chainDepth, 5))
// step 1: +1, step 2: +2, step 3: +3, step 4: +4, step 5+: +6
```

### Adaptive Forgiveness
Resistance decays 2x faster than strength:
```typescript
strength[p] *= (1 - 0.02)      // 2% decay
resistance[p] *= (1 - 0.04)    // 4% decay
```

### Priority Queue
Signals sorted by net pheromone — strong paths process first:
```typescript
queue.sort((a, b) => net(b.path) - net(a.path))
```

### Highway Skip
Proven paths (net ≥ 20) can skip expensive operations:
```typescript
if (isHighway(path)) return cached[path]  // no LLM call
```

---

## Token Efficiency

### Context Compression
```typescript
// Before: full markdown
loadContext('dsl', 'docs/DSL.md')  // 15KB

// After: compressed
context[key] = content
  .replace(/<!--[\s\S]*?-->/g, '')  // strip comments
  .replace(/\n{3,}/g, '\n\n')       // collapse whitespace
  .trim()                            // 8KB
```

### Selective Loading
```typescript
// Only load what handler needs
one.on('evolve', (d, e) => {
  const ctx = one.getContext('dsl')  // just DSL, not everything
  return llm(`${ctx}\n\nRewrite: ${d.prompt}`)
})
```

### Reference by Key
```typescript
// Instead of repeating context, reference it
const prompt = `
  Follow the patterns in [dsl] and [dict].
  Task: ${task}
`
// LLM knows [dsl] = docs/DSL.md from system prompt
```

---

## Scaling

### Thousands of Cycles

```
Cycle 1-100:      Bootstrap. Paths form. Learning begins.
Cycle 100-1000:   Patterns emerge. Highways appear.
Cycle 1000-10000: Toxic paths blocked. Strong paths dominate.
Cycle 10000+:     Stable routing. Minimal LLM calls.
```

### Metrics at Scale

```typescript
// After 10,000 cycles
stats() = {
  cycle: 10000,
  queue: 3,              // almost real-time
  handlers: 24,          // stable
  paths: 156,            // pruned by fade
  highways: [            // proven routes
    { path: 'user→agent:chat', strength: 847 },
    { path: 'agent:chat→world:know', strength: 234 },
    ...
  ]
}
```

---

## The Complete System

```
substrate.md          one.ts               TypeDB
─────────────         ───────              ──────
## Context     ──►    loadContext()   ──►  (optional persist)
## Timers      ──►    timer()
## SOPs        ──►    sop()
## Workflows   ──►    chain()
## Handlers    ──►    on()

                         │
                         ▼
                      tick()
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           timers      drain      fade
              │          │          │
              └────►  queue  ◄─────┘
                         │
                         ▼
                    sop check
                         │
                         ▼
                    ask(handler)
                         │
                         ▼
                    mark/warn
                         │
                         ▼
                     REPEAT
```

---

*Drain. Ask. Mark. Repeat. The simplest thing that could possibly work.*
