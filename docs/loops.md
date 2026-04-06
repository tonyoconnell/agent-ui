# Loops

Source of truth: `src/engine/tick.ts`, `src/engine/loops.ts`, `src/engine/core.ts`

---

## The One Loop

Everything reduces to four phases:

```
┌─────────────────────────────────────────────────────────────┐
│                     THE ONE LOOP                            │
│                                                             │
│    SENSE ────→ SELECT ────→ ACT ────→ MARK                  │
│      │           │          │         │                     │
│      │           │          │         └─ record outcome     │
│      │           │          └─ do work, return outcome      │
│      │           └─ pick one item from list                 │
│      └─ observe state, return items                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

All eight loops are this pattern with different sources, selectors, actions, and feedback.

```typescript
// src/engine/core.ts
type Loop<T> = {
  sense:  () => T[]                    // observe state
  select: (items: T[]) => T | null     // pick one
  act:    (item: T) => Outcome         // do work
  mark:   (item: T, outcome) => void   // record feedback
}
```

---

## Implementation

```
src/engine/
├── core.ts       145 lines   loop(), compose(), schedule()
├── sources.ts    258 lines   signals, struggling, advisors, highways, docs
├── selectors.ts  181 lines   pheromone, priority, success, weighted, roundRobin
├── loops.ts      357 lines   All eight loops composed
├── tick.ts       208 lines   Master orchestrator with intervals
└── doc-scan.ts   395 lines   Scan, verify, gapsToSignals, docMark
─────────────────────────
             ~1544 lines     Complete loop system
```

---

## The Eight Loops

Nested feedback loops at different timescales. Faster loops feed slower loops.

```
┌─────────────────────────────────────────────────────────────────┐
│  DOC          every hour      docs → specs → verify → gaps      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ L7  FRONTIER   every hour      detect new territory         │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ L6  KNOWLEDGE  every hour      crystallize highways      │ │ │
│ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ L5  EVOLUTION  every 10 min    rewrite prompts      │ │ │ │
│ │ │ │ ┌───────────────────────────────────────────────┐   │ │ │ │
│ │ │ │ │  CONSULT   sub-loop          ask proven peers  │   │ │ │ │
│ │ │ │ └───────────────────────────────────────────────┘   │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ L4  ECONOMIC  per payment    revenue = weight   │ │ │ │ │
│ │ │ │ │ ┌───────────────────────────────────────────┐   │ │ │ │ │
│ │ │ │ │ │ L3  FADE   every 5 min    decay all       │   │ │ │ │ │
│ │ │ │ │ │ ┌───────────────────────────────────────┐ │   │ │ │ │ │
│ │ │ │ │ │ │ L2  TRAIL  per outcome  mark / warn   │ │   │ │ │ │ │
│ │ │ │ │ │ │ ┌───────────────────────────────────┐ │ │   │ │ │ │ │
│ │ │ │ │ │ │ │ L1  SIGNAL  per tick   the pulse  │ │ │   │ │ │ │ │
│ │ │ │ │ │ │ └───────────────────────────────────┘ │ │   │ │ │ │ │
│ │ │ │ │ │ └───────────────────────────────────────┘ │   │ │ │ │ │
│ │ │ │ │ └───────────────────────────────────────────┘   │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## L1+L2: Signal + Trail Loop

The heartbeat. Every tick processes one signal and marks the outcome.

```typescript
// src/engine/loops.ts
export const signalLoop = (net) => loop<Signal>(
  signals(net),                           // sense: pending signals
  first(),                                // select: first in queue
  async (sig) => {
    const edge = `${prev}→${sig.receiver}`
    
    // Highway skip: proven path, no LLM needed
    if (net.sense(edge) - net.danger(edge) >= 20) {
      net.mark(edge, chainDepth)
      return { result: 'highway' }
    }
    
    // Normal: ask and await outcome
    return net.ask(sig)
  },
  (sig, outcome) => {
    if (outcome.result)    net.mark(edge, chainDepth)  // success
    else if (outcome.timeout) /* neutral */            // slow, not bad
    else                   net.warn(edge)              // failure
  }
)
```

### Metrics to Track

| Metric | What it shows | How to test |
|--------|---------------|-------------|
| `signals/sec` | Throughput | Batch 1000 signals, measure time |
| `highway_skip_rate` | LLM bypass % | Count skipped vs total |
| `chain_depth` | Sequential success | Log depth before break |
| `avg_latency_ms` | Response time | Timestamp before/after ask |

```typescript
// Example test harness
const metrics = { signals: 0, highways: 0, failures: 0, totalMs: 0 }
const start = Date.now()

for (let i = 0; i < 1000; i++) {
  const result = await signalLoop(net)()
  metrics.signals++
  if (result.outcome?.result === 'highway') metrics.highways++
  if (!result.outcome?.result) metrics.failures++
}

metrics.totalMs = Date.now() - start
console.log(`${metrics.signals / (metrics.totalMs / 1000)} signals/sec`)
console.log(`${(metrics.highways / metrics.signals * 100).toFixed(1)}% highway skips`)
```

---

## L3: Fade Loop

Asymmetric decay. Resistance forgives faster than strength forgets.

```typescript
export const fadeLoop = (net) => loop<{ action: 'fade' }>(
  fadeAction(),             // sense: always returns one item
  first(),                  // select: take it
  () => {
    net.fade(0.05)          // act: 5% decay, resistance 2x
    return { result: true }
  },
  () => {}                  // mark: nothing
)
```

### Metrics to Track

| Metric | What it shows | How to test |
|--------|---------------|-------------|
| `paths_before` | Total tracked paths | Count before fade |
| `paths_after` | Surviving paths | Count after fade |
| `dissolved` | Paths removed | Difference |
| `ghost_ratio` | Paths at floor | Count where strength == peak * 0.05 |

```typescript
// Example: track fade impact
const before = Object.keys(net.strength).length
await fadeLoop(net)()
const after = Object.keys(net.strength).length
console.log(`Fade: ${before} → ${after} paths (${before - after} dissolved)`)
```

---

## L5: Evolution Loop (with A2A Consultation)

The agent rewrites itself. **Consults peers through the world.**

```typescript
export const evolveLoop = (net, complete) => compose<StrugglingUnit, Advisor>(
  {
    sense: struggling(net),              // units with success < 50%
    select: byNeed(),                    // worst performer first
    act: async (unit) => {
      const insights = await net.recall(unit.id)
      return { result: { unit, insights } }
    },
    mark: () => {}
  },
  
  // SPAWN: consultation loop (A2A through world)
  (unit) => consultLoop(net, unit),
  
  // MERGE: combine parent + child outcomes
  async (parentOutcome, childOutcomes) => {
    const { unit, insights } = parentOutcome.result
    const advice = childOutcomes.map(o => o.result).join('\n')
    
    // LLM rewrites prompt with failures + patterns + advice
    const newPrompt = await complete(`
      Agent "${unit.id}" at ${unit.successRate}% success.
      Known patterns: ${insights}
      Advisor feedback: ${advice}
      Rewrite: ${unit.prompt}
    `)
    
    // Save old prompt as hypothesis (rollback available)
    // Update unit with new prompt, generation++
    return { result: { evolved: unit.id } }
  }
)
```

### A2A Consultation (Through the World)

```typescript
export const consultLoop = (net, seeker) => ({
  sense: advisors(seeker.tags),          // high performers with similar skills
  select: bySuccessRate(),               // best performer first
  act: async (advisor) => {
    // Route consultation AS A SIGNAL through the world
    return net.ask({
      receiver: `${advisor.id}:advise`,
      data: { from: seeker.id, prompt: seeker.prompt }
    }, seeker.id)  // from = seeker, so path gets tracked
  },
  mark: (advisor, outcome) => {
    // Consultation paths get pheromone too!
    if (outcome.result) net.mark(`${seeker.id}→${advisor.id}:advise`)
  }
})
```

The substrate learns **who helps whom** — same mechanism, richer data.

### Metrics to Track

| Metric | What it shows | How to test |
|--------|---------------|-------------|
| `evolved_count` | Agents rewritten | Count per tick |
| `consult_success` | Advice received | % of consultations with result |
| `advisor_paths` | Who helps whom | Query paths containing `:advise` |
| `rollback_count` | Reverted evolutions | Hypotheses with status="rejected" |
| `gen_improvement` | Did evolution help? | Compare gen N vs gen N+1 success |

```typescript
// Example: track evolution impact
const before = await readParsed(`match $u has success-rate $sr; select avg($sr);`)
await evolveLoop(net, complete)()
// Wait for samples...
const after = await readParsed(`match $u has success-rate $sr; select avg($sr);`)
console.log(`Evolution: ${before}% → ${after}% avg success`)
```

---

## L6: Knowledge Loop

Crystallize highways. Detect surges. Generate hypotheses.

```typescript
export const knowLoop = (net, cycle) => loop<{ action: 'know' }>(
  knowAction(),
  first(),
  async () => {
    const insights = await net.know()    // promote strong paths
    
    // Auto-hypothesize from state changes
    for (const i of insights.filter(i => i.confidence >= 0.8)) {
      writeSilent(`insert $h isa hypothesis, 
        has statement "path ${i.pattern} is proven"...`)
    }
    
    // Detect surges (rapid strength increase)
    for (const surge of surges(net, lastStrengths, 10)()) {
      writeSilent(`insert $h isa hypothesis,
        has statement "path ${surge.path} surged by ${surge.delta}"...`)
    }
    
    // Knowledge → Evolution coupling
    for (const i of insights.filter(i => i.confidence >= 0.8)) {
      priorityEvolve.push(...i.pattern.split('→'))
    }
    
    return { result: { crystallized: insights.length } }
  },
  () => {}
)
```

### Metrics to Track

| Metric | What it shows | How to test |
|--------|---------------|-------------|
| `crystallized` | Paths promoted | Count insights returned |
| `surges` | Rapid changes | Count paths with delta > threshold |
| `hypotheses` | Beliefs generated | Count new hypothesis entities |
| `priority_evolve` | Triggered evolutions | Length of priority queue |

---

## L7: Frontier Loop

Detect what the system doesn't know.

```typescript
export const frontierLoop = (net, cycle) => loop<{ action: 'know' }>(
  knowAction(),
  first(),
  async () => {
    // Unexplored tag clusters
    const tagFrontiers = await unexploredTags(net)()
    for (const { tag, unexplored, total } of tagFrontiers) {
      writeSilent(`insert $f isa frontier,
        has frontier-type "${tag}",
        has frontier-description "${unexplored.length} of ${total} unexplored"...`)
    }
    
    // Unit gaps: active units never connected
    const gaps = unitGaps(net, 3)()
    for (const { unitA, unitB } of gaps) {
      writeSilent(`insert $f isa frontier,
        has frontier-type "unit-gap",
        has frontier-description "${unitA} and ${unitB} never connected"...`)
    }
    
    return { result: { frontiers: tagFrontiers.length + gaps.length } }
  },
  () => {}
)
```

### Metrics to Track

| Metric | What it shows | How to test |
|--------|---------------|-------------|
| `tag_frontiers` | Unexplored skill clusters | Count by tag |
| `unit_gaps` | Missing connections | Count unit pairs |
| `exploration_rate` | New paths discovered | Compare explored set over time |

---

## Doc Loop (New)

Docs as source of truth. Verification as pheromone.

```typescript
export const docLoop = (net, docsDir) => loop<VerifiedItem>(
  docSpecs(docsDir),                     // sense: unverified specs from docs/
  byPriority(),                          // select: P0 first
  async (item) => {
    net.enqueue({                        // act: emit gap signal
      receiver: 'worker:implement',
      data: { id: item.id, name: item.name, priority: item.priority }
    })
    return { result: null }              // gap recorded
  },
  docMark(net.mark, net.warn)            // mark: doc→code path
)
```

### Metrics to Track

| Metric | What it shows | How to test |
|--------|---------------|-------------|
| `specs_total` | Items in docs | Count all parsed items |
| `verified` | Implemented | Count where verified=true |
| `gaps` | Not implemented | Count where verified=false |
| `doc_coverage` | Implementation % | verified / total |
| `priority_dist` | Work distribution | Count by P0/P1/P2/P3 |

```typescript
// Example: doc coverage report
const items = await scanDocs('docs')
const verified = await verifyAll(items)
const coverage = verified.filter(i => i.verified).length / items.length
console.log(`Doc coverage: ${(coverage * 100).toFixed(1)}%`)
console.log(`Gaps: ${verified.filter(i => !i.verified).map(i => i.name).join(', ')}`)
```

---

## The Tick Orchestrator

One function runs all loops at appropriate intervals.

```typescript
// src/engine/tick.ts
const INTERVALS = {
  fade:     300_000,    // 5 minutes
  evolve:   600_000,    // 10 minutes
  know:     3_600_000,  // 1 hour
  frontier: 3_600_000,  // 1 hour
  docs:     3_600_000,  // 1 hour
}

export const tick = async (net, complete?, docsDir?) => {
  const now = Date.now()
  const result = { cycle: ++cycle, signal: {}, highways: [] }
  
  // Always: signal loop
  result.signal = await signalLoop(net)()
  
  // Periodic loops
  if (shouldRun('fade', now))     result.fade = await fadeLoop(net)()
  if (shouldRun('evolve', now))   result.evolved = await evolveLoop(net, complete)()
  if (shouldRun('know', now))     result.know = await knowLoop(net, cycle)()
  if (shouldRun('frontier', now)) result.frontier = await frontierLoop(net, cycle)()
  if (shouldRun('docs', now))     result.docs = await docLoop(net, docsDir)()
  
  result.highways = net.highways(10)
  return result
}
```

### Tick Result Type

```typescript
type TickResult = {
  cycle: number
  signal: { selected: string | null; success: boolean | null; skipped?: boolean }
  fade?: boolean
  evolved?: number
  crystallized?: number
  hypotheses?: number
  frontiers?: number
  docs?: { verified: number; gaps: number }
  highways: { path: string; strength: number }[]
}
```

---

## Testing the Loops

### Unit Test Pattern

```typescript
import { loop } from '@/engine/core'
import { first } from '@/engine/selectors'

describe('loop', () => {
  it('runs sense → select → act → mark', async () => {
    const sensed: number[] = []
    const selected: number[] = []
    const acted: number[] = []
    const marked: number[] = []
    
    const testLoop = loop<number>(
      () => { sensed.push(1); return [1, 2, 3] },
      (items) => { selected.push(items[0]); return items[0] },
      (item) => { acted.push(item); return { result: item * 2 } },
      (item, outcome) => { marked.push(outcome.result as number) }
    )
    
    const result = await testLoop()
    
    expect(sensed).toEqual([1])
    expect(selected).toEqual([1])
    expect(acted).toEqual([1])
    expect(marked).toEqual([2])
    expect(result).toEqual({ item: 1, outcome: { result: 2 } })
  })
})
```

### Integration Test Pattern

```typescript
import { world } from '@/engine'
import { tick, resetTick } from '@/engine/tick'

describe('tick', () => {
  beforeEach(() => resetTick())
  
  it('processes signal loop every tick', async () => {
    const net = world()
    net.add('test').on('work', () => 'done')
    net.enqueue({ receiver: 'test:work' })
    
    const result = await tick(net)
    
    expect(result.signal.selected).toBe('test:work')
    expect(result.signal.success).toBe(true)
  })
  
  it('runs fade loop after interval', async () => {
    const net = world()
    net.mark('a→b', 100)
    
    // Force fade to run
    forceLoop('fade')
    const result = await tick(net)
    
    expect(result.fade).toBe(true)
    expect(net.sense('a→b')).toBeLessThan(100)
  })
})
```

### Performance Benchmark

```typescript
import { world } from '@/engine'
import { tick } from '@/engine/tick'

async function benchmark(iterations: number) {
  const net = world()
  
  // Setup: 100 units, 1000 paths
  for (let i = 0; i < 100; i++) {
    net.add(`unit-${i}`).on('work', () => i)
  }
  for (let i = 0; i < 1000; i++) {
    net.mark(`unit-${i % 100}→unit-${(i + 1) % 100}`, Math.random() * 10)
  }
  
  const start = Date.now()
  for (let i = 0; i < iterations; i++) {
    await tick(net)
  }
  const elapsed = Date.now() - start
  
  console.log(`
Benchmark Results:
  Iterations: ${iterations}
  Total time: ${elapsed}ms
  Per tick:   ${(elapsed / iterations).toFixed(2)}ms
  Ticks/sec:  ${(iterations / elapsed * 1000).toFixed(0)}
  `)
}

benchmark(1000)
```

---

## Loop Coupling

The loops don't run in isolation. Here's how they feed each other:

```
L1 Signal ──outcome──→ L2 Trail ──pattern──→ L6 Knowledge
    │                      │                      │
    │                      │                      ├──→ L5 Evolution (priorityEvolve)
    │                      │                      │
    │                      │                      ▼
    │                      │                 L7 Frontier
    │                      │                      │
    │                      ▼                      ▼
    │                 L3 Fade ←──────── new tasks enter
    │                      │
    ▼                      ▼
L4 Economic ──revenue──→ L5 Evolution ←── L5.consult (sub-loop)
    │                      │
    └──────────────────────┘
         better agents = better signals = L1

Doc Loop ──gaps──→ worker:implement ──→ L1 Signal
    ▲                                       │
    └───── pheromone + verify ──────────────┘
```

### New Coupling: L5 ↔ A2A

Evolution now spawns consultation. Consultation paths get pheromone.
The substrate learns which agents help which agents evolve.

```
struggling agent
       │
       ├── query advisors (high success, similar skills)
       │
       ├── for each advisor:
       │      signal({ receiver: 'advisor:advise', data: context })
       │      → mark/warn on consultation path
       │
       ├── collect advice
       │
       └── LLM synthesizes: failures + patterns + advice → new prompt
```

### New Coupling: Docs → Signals

Doc verification emits gaps as signals:

```
docs/*.md → parse → specs → verify(code)
                              │
                    ┌─────────┴─────────┐
                    │                   │
               verified            not verified
                    │                   │
            mark(doc→code)      enqueue({ receiver: 'worker:implement' })
```

---

## Loop Speeds

| Loop | Interval | Governed by | Source |
|------|----------|-------------|--------|
| L1+L2 Signal+Trail | every tick | queue depth, ask() latency | `signals(net)` |
| L3 Fade | 5 minutes | `INTERVALS.fade` | `fadeAction()` |
| L4 Economic | per payment | `signal.amount > 0` | implicit in L1 |
| L5 Evolution | 10 minutes | `INTERVALS.evolve` + 24h cooldown | `struggling(net)` |
| L5.Consult | per evolution | spawned by L5 via `compose()` | `advisors(tags)` |
| L6 Knowledge | 1 hour | `INTERVALS.know` | `knowAction()` |
| L7 Frontier | 1 hour | `INTERVALS.frontier` | `knowAction()` |
| Doc | 1 hour | `INTERVALS.docs` | `docSpecs(docsDir)` |

Faster loops produce data. Slower loops produce wisdom.
The signal loop is the muscle. The frontier loop is the mind.
The doc loop is the memory.

---

## See Also

- [dictionary.md](dictionary.md) — Complete naming guide
- [DSL.md](DSL.md) — The programming model
- [routing.md](routing.md) — How signals find their way
- [src/engine/core.ts](../src/engine/core.ts) — The one loop implementation
- [src/engine/loops.ts](../src/engine/loops.ts) — All seven loops composed
- [src/engine/tick.ts](../src/engine/tick.ts) — Master orchestrator

---

*One pattern. Eight loops. Nested. Coupled. Composable. The substrate doesn't run a loop — it IS the loop.*
