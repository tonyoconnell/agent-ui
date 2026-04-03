# Substrate ↔ TypeDB Mapping

> TypeDB declares WHAT. Substrate executes HOW.

---

## The Core Insight

| TypeDB (1400+ lines) | Substrate (70 lines) |
|---------------------|---------------------|
| `entity agent` | `unit(id)` |
| `attribute success-rate` | `unit.state.successRate` |
| `relation pheromone-trail` | `mark(edge)` / `smell(edge)` |
| `rule attractive-task` | `.on('classify')` handler |
| `fun ready_tasks()` | `.on('query-ready')` handler |
| Inference fires automatically | Signal flows through units |
| Declarative (WHAT is true) | Imperative (HOW to compute) |

---

## Lesson-by-Lesson Mapping

### L1: Perception (Classification)

**TypeDB (218 lines)**
```typeql
fun elite_agents() -> { agent }:
    match
        $a isa agent,
            has success-rate $sr,
            has activity-score $as,
            has sample-count $sc;
        $sr >= 0.75;
        $as >= 70.0;
        $sc >= 50;
    return { $a };
```

**Substrate (10 lines)**
```typescript
c.spawn('classifier')
  .on('classify', ({ successRate, activityScore, sampleCount }) => {
    if (successRate >= 0.75 && activityScore >= 70 && sampleCount >= 50) {
      return { tier: 'elite' }
    }
    if (successRate < 0.40 && activityScore >= 25 && sampleCount >= 30) {
      return { tier: 'at-risk' }
    }
    return { tier: 'standard' }
  })
```

**Can implement?** ✅ Yes. Functions map directly to handlers.

---

### L2: Homeostasis (Quality Rules)

**TypeDB (258 lines)**
```typeql
rule high-quality-record:
    when {
        $r isa learning-record,
            has applied true,
            has effectiveness $e;
        $e >= 0.7;
    } then {
        $r has quality-label "high";
    };

rule prevent_zombie_agents:
    when {
        $a isa agent, has energy-level 0.0, has reliability-score $r;
        $r > 0.5;
    } then { reject; };
```

**Substrate (15 lines)**
```typescript
c.spawn('validator')
  .on('check-quality', ({ applied, effectiveness }) => {
    if (!applied) return null  // Silence
    if (effectiveness >= 0.7) return { quality: 'high' }
    if (effectiveness >= 0.4) return { quality: 'medium' }
    return { quality: 'low' }
  })
  .on('check-zombie', ({ energyLevel, reliabilityScore }) => {
    // Rejection = silence (signal dissolves)
    if (energyLevel === 0 && reliabilityScore > 0.5) return null
    return { valid: true }
  })
```

**Can implement?** ✅ Yes. Rejection via silence (zero returns).

---

### L3: Hypothesis (State Machines)

**TypeDB (215 lines)**
```typeql
rule hypothesis-action-ready:
    when {
        $h isa hypothesis,
            has hypothesis-status "confirmed",
            has p-value $p,
            has observations-count $n;
        $p <= 0.05;
        $n >= 50;
    } then {
        $h has action-ready true;
    };
```

**Substrate (20 lines)**
```typescript
c.spawn('hypothesis')
  .on('evaluate', ({ pValue, observationCount, status }) => {
    if (status === 'pending' && observationCount >= 10) {
      return { status: 'testing' }
    }
    if (status === 'testing' && pValue <= 0.05 && observationCount >= 100) {
      return { status: 'confirmed', actionReady: true }
    }
    if (status === 'testing' && pValue > 0.20 && observationCount >= 100) {
      return { status: 'rejected' }
    }
    return { status }
  })
```

**Can implement?** ✅ Yes. State machine via handler + state object.

---

### L4: Task Allocation (Negation + Pheromone)

**TypeDB (602 lines)** - The most complex pattern
```typeql
fun ready_tasks() -> { task }:
    match
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $blocker) isa dependency;
            $blocker isa task, has status $bs;
            not { $bs == "complete"; };
        };
    return { $t };

rule attractive-task:
    when {
        $t isa task, has status "todo";
        not { /* blockers incomplete */ };
        $trail (destination-task: $t) isa pheromone-trail, has trail-pheromone $tp;
        $tp >= 50.0;
    } then { $t has attractive true; };
```

**Substrate (40 lines)**
```typescript
const tasks = {}
const trailPheromone = {}

c.spawn('taskManager')
  .on('query-ready', () => {
    // NEGATION: ready = todo AND all blockers complete
    const ready = Object.entries(tasks)
      .filter(([_, t]) => t.status === 'todo')
      .filter(([_, t]) => t.blockers.every(b => tasks[b]?.status === 'complete'))
    return { ready }
  })
  .on('query-attractive', () => {
    // Ready + pheromone >= 50
    const attractive = Object.entries(tasks)
      .filter(([_, t]) => t.status === 'todo')
      .filter(([_, t]) => t.blockers.every(b => tasks[b]?.status === 'complete'))
      .filter(([id]) => trailPheromone[id] >= 50)
    return { attractive }
  })
  .on('reinforce', ({ from, to }) => {
    trailPheromone[to] = Math.min(100, (trailPheromone[to] || 0) + 5)
    c.mark(`${from}→${to}`, 5)  // Colony-level scent
  })
  .on('decay', () => {
    // Asymmetric: trail 5%, alarm 20%
    Object.keys(trailPheromone).forEach(k => trailPheromone[k] *= 0.95)
    c.fade(0.05)
  })
```

**Can implement?** ✅ Yes. Negation via JS filter. Pheromone via mark/smell.

---

### L5: Contribution (Aggregation)

**TypeDB (161 lines)**
```typeql
fun total_contribution($name: string) -> double:
    match
        $a isa agent, has agent-name $name;
        $ev(contributor-agent: $a, contribution: $c) isa contribution-event;
        $c isa contribution, has impact-score $i;
    return sum($i);
```

**Substrate (15 lines)**
```typescript
const contributions = {}

c.spawn('ledger')
  .on('record', ({ agent, impact }) => {
    contributions[agent] = contributions[agent] || []
    contributions[agent].push(impact)
  })
  .on('total', ({ agent }) => ({
    agent,
    total: contributions[agent].reduce((a, b) => a + b, 0)
  }))
```

**Can implement?** ✅ Yes. Aggregation via JS reduce.

---

### L6: Emergence (Autonomous Goals)

**TypeDB (246 lines)**
```typeql
fun promising_frontiers() -> { exploration-frontier }:
    match
        $f isa exploration-frontier,
            has frontier-status "unexplored",
            has expected-value $ev;
        $ev >= 0.5;
    return { $f };
```

**Substrate (20 lines)**
```typescript
const frontiers = {}
const objectives = {}

c.spawn('emergence')
  .on('detect-frontier', ({ id, potential, probability, cost }) => {
    const ev = (potential * probability) / cost
    frontiers[id] = { expectedValue: ev, status: 'unexplored' }

    // Autonomous spawning when EV >= 0.5
    if (ev >= 0.5) {
      objectives[`obj-${Date.now()}`] = { progress: 0, status: 'pending' }
      return { spawned: true }
    }
    return { promising: false }
  })
```

**Can implement?** ✅ Yes. Goal spawning via handler + emit.

---

## What TypeDB Provides That Substrate Doesn't

| Feature | TypeDB | Substrate |
|---------|--------|-----------|
| **Persistence** | Built-in | Need external store |
| **Inference on read** | Automatic | Manual signal flow |
| **Query language** | TypeQL | JS filters |
| **Transactions** | ACID | None |
| **Schema validation** | Type system | Runtime checks |
| **Distributed** | Cloud-native | Single process |

---

## What Substrate Provides That TypeDB Doesn't

| Feature | Substrate | TypeDB |
|---------|-----------|--------|
| **Zero dependencies** | 70 lines | Server + client |
| **Concurrency** | Built-in (async) | Transactions |
| **Flexibility** | Any logic | TypeQL only |
| **Embedded** | In-process | Client-server |
| **Real-time** | Immediate | Query-based |

---

## The Hybrid Architecture

**Use both:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   SUBSTRATE (Runtime)              TYPEDB (Persistence + Inference)         │
│   ────────────────────             ─────────────────────────────────        │
│                                                                              │
│   unit('agent')                    entity agent                             │
│     .on('tick')        ─────────▶    INSERT/UPDATE                         │
│     .on('sense')       ◀─────────    QUERY ready_tasks()                   │
│                                                                              │
│   colony.mark()        ─────────▶  relation pheromone-trail                │
│   colony.highways()    ◀─────────    fun superhighway_trails()             │
│                                                                              │
│   Signal flow (fast)               Inference (declarative)                  │
│   Memory (ephemeral)               Storage (persistent)                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

| TQL File | Lines | Substrate Lines | Implementable? |
|----------|-------|-----------------|----------------|
| classification.tql | 218 | ~15 | ✅ |
| quality-rules.tql | 258 | ~20 | ✅ |
| hypothesis-lifecycle.tql | 215 | ~25 | ✅ |
| task-management.tql | 602 | ~50 | ✅ |
| contribution-tracking.tql | 161 | ~15 | ✅ |
| autonomous-goals.tql | 246 | ~25 | ✅ |
| **genesis.tql** | **1437** | **~150** | ✅ |

**Total: 1437 lines of TypeQL → ~150 lines of Substrate**

The substrate doesn't replace TypeDB. It complements it:
- Substrate = **runtime** (signal flow, real-time)
- TypeDB = **persistence** (storage, inference, queries)

Together: a breathing digital ecosystem.
