---
title: "TODO: Knowledge Growth"
type: roadmap
version: 1.0.0
priority: Wire > Prove > Grow
total_tasks: 24
completed: 0
status: OPEN
---

# TODO: Knowledge Growth

> **Time units:** plan in **tasks > waves > cycles** only.
>
> **Goal:** Wire the 8 extraordinary improvements from `knowledge-growth.md`.
> Each one enables the next. The cascade: D1 WAL > statistical testing >
> hypothesis reflexes > adaptive sensitivity > auto-explore > loops as units >
> gradient highways > ghost trail priors. Wire in order 4>5>7>3>2>1>6>8.
>
> **Source of truth:** [knowledge-growth.md](knowledge-growth.md) -- the full
> architecture with implementation sketches,
> [routing.md](routing.md) -- pheromone formula and tick loop,
> [DSL.md](DSL.md) -- the signal language,
> [dictionary.md](dictionary.md) -- everything named,
> [rubrics.md](rubrics.md) -- quality scoring (fit/form/truth/taste)
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** Tasks map to `world.tql` dimension 3b -- `task` entity with
> `task-wave` (W1-W4), `task-context` (doc keys), `blocks` relation.

## The Cascade

The 8 improvements aren't independent. Each bootstraps the next.

```
CYCLE 1: FOUNDATION              CYCLE 2: REFLEXES           CYCLE 3: META
(D1 WAL + statistics)            (routing + exploration)     (loops as units + gradient)
─────────────────────            ───────────────────────     ─────────────────────────
#4 D1 WAL                       #7 hypothesis reflexes      #1 loops as units
#5 statistical testing           #3 adaptive sensitivity     #6 gradient highways
                                 #2 auto-explore frontiers   #8 ghost trail priors
     |                                |                           |
     v                                v                           v
D1 unlocks volume             reflexes use earned           loops learn their own
statistics use D1 data        confidence from stats         schedule via pheromone
     |                        sensitivity reads frontiers   gradient uses volume
     v                        explore uses sensitivity      ghosts feed exploration
+-W1-W2-W3-W4-+              +-W1-W2-W3-W4-+              +-W1-W2-W3-W4-+
| H   O  S  S  |  --->       | H   O  S  S  |  --->       | H   O  S  S  |
+--------------+              +--------------+              +--------------+
```

## Routing

```
signal DOWN                     result UP              feedback UP
──────────                      ─────────              ───────────
each improvement wired          each tested with       tagged strength
     |                          real signals           signal > substrate
     v                               |                    ^
┌─────────┐                          |                    |
│  W1     │  Haiku recon ────────────┤ mark(edge:fit)     |
│  read   │  > report verbatim       | mark(edge:truth)   |
└────┬────┘                          |                    |
     | context grows                 |                    |
     v                               |                    |
┌─────────┐                          |                    |
│  W2     │  Opus decide             |                    |
│  fold   │  > diff specs            |                    |
└────┬────┘                          |                    |
     | context grows                 |                    |
     v                               |                    |
┌─────────┐                          |                    |
│  W3     │  Sonnet edit             |                    |
│  apply  │  > code changes          |                    |
└────┬────┘                          |                    |
     |                               |                    |
     v                               |                    |
┌─────────┐                          |                    |
│  W4     │  Sonnet verify ──────────┘                    |
│  score  │  > rubric + tests                             |
│         │  > feedback signal ──────────────────────────>─┘
└─────────┘
```

---

## Cycle 1: FOUNDATION -- D1 WAL + Statistical Testing

**Files:** `migrations/0013_pheromone_wal.sql` (new), `src/engine/world.ts`,
`src/lib/typedb.ts`, `workers/sync/index.ts`, `src/engine/loop.ts`,
`src/engine/persist.ts`

**Why first:** D1 WAL decouples signal volume from TypeDB capacity. Statistical
testing needs the temporal data in D1's marks table. Everything downstream
(reflexes, adaptive sensitivity, auto-explore) depends on honest confidence
scores. Foundation first.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | D1 WAL migration + buffer | Pheromone batched to D1 in 500ms windows | 0.30/0.20/0.35/0.15 | marks table populated after 10 signals | `builder:d1-wal` |
| 2 | Sync worker D1>TypeDB | Batch coalesce marks into TypeDB updates | 0.30/0.20/0.35/0.15 | TypeDB strength matches D1 SUM after sync | `builder:d1-sync` |
| 3 | Analytics queries | SQL queries for throughput, hot paths, velocity | 0.25/0.20/0.35/0.20 | /api/analytics returns real-time data from D1 | `builder:analytics` |
| 4 | Statistical hypothesis testing | Earned p-values from before/after comparison | 0.35/0.15/0.35/0.15 | Hypothesis p-value changes with observations | `builder:stat-test` |

### Tasks

#### T1.1 -- D1 pheromone WAL migration

```
id:       d1-pheromone-wal-migration
value:    critical
effort:   small
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [d1, pheromone, wal, migration, P0]
blocks:   [d1-buffer, d1-sync, analytics-queries]
exit:     0013_pheromone_wal.sql exists with marks table, edge+window indexes
```

- [ ] Create `migrations/0013_pheromone_wal.sql`
- [ ] Table: `marks(id, edge, delta_s, delta_r, count, window, synced, ts)`
- [ ] Indexes: `idx_marks_synced(synced, window)`, `idx_marks_edge(edge, window)`
- [ ] Window = `floor(ts / 500)` -- 500ms resolution

#### T1.2 -- Buffer mark/warn to D1

```
id:       d1-buffer-marks
value:    critical
effort:   medium
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [d1, pheromone, buffer, performance, P0]
blocks:   [d1-sync]
exit:     mark() still sub-microsecond; D1 receives batched inserts every 500ms
```

- [ ] Add `bufferMark(edge, delta_s, delta_r)` in `src/engine/world.ts` or new `src/engine/wal.ts`
- [ ] Collect marks in `Map<string, { delta_s, delta_r, count }>` per 500ms window
- [ ] `flushToD1()` fires on timer: single `d1.batch()` insert for all pending edges
- [ ] In-memory `mark()` unchanged -- D1 buffer is additive, not replacement
- [ ] D1 binding passed via environment (same as existing signals table)

#### T1.3 -- Sync worker: D1 > TypeDB batch

```
id:       d1-typedb-sync
value:    critical
effort:   medium
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [d1, typedb, sync, batch, P0]
blocks:   [analytics-queries]
exit:     sync worker reads unsynced marks, batches into TypeDB, marks synced=1
```

- [ ] Update `workers/sync/index.ts` with Job 3: D1 > TypeDB
- [ ] Query: `SELECT edge, SUM(delta_s), SUM(delta_r), SUM(count) FROM marks WHERE synced=0 GROUP BY edge`
- [ ] For each edge: single TypeDB update (match path, update strength/resistance)
- [ ] Mark all flushed rows `synced=1`
- [ ] Run after existing Job 1 (TypeDB > KV) so KV snapshot includes D1 deltas

#### T1.4 -- Analytics API endpoint

```
id:       analytics-api-endpoint
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [d1, analytics, api, P1]
blocks:   []
exit:     GET /api/analytics returns throughput, hot paths, velocity, toxic formation from D1
```

- [ ] Create `src/pages/api/analytics.ts`
- [ ] Four queries from `knowledge-growth.md`: throughput, hot paths, emergence velocity, toxic formation
- [ ] Query params: `?window=3600` (seconds of history, default 1 hour)
- [ ] Response: `{ throughput: [...], hotPaths: [...], velocity: [...], toxic: [...] }`
- [ ] All from D1 -- no TypeDB round-trip. < 5ms response time.

#### T1.5 -- Statistical hypothesis testing

```
id:       statistical-hypothesis-testing
value:    critical
effort:   large
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [hypotheses, statistics, p-value, P0]
blocks:   [hypothesis-reflexes]
exit:     upsertHypothesis computes p-value from D1 marks before/after pattern detection
```

- [ ] Add `computePValue(edge, patternDetectedTs)` in `src/engine/loop.ts` or new `src/engine/stats.ts`
- [ ] Uses D1 marks table: compare success rate before vs after pattern detection
- [ ] Binomial proportion z-test: `z = (postRate - preRate) / sqrt(pooled * (1-pooled) * (1/n1 + 1/n2))`
- [ ] Replace fixed p-values in all 8 hypothesis generators with computed values
- [ ] Minimum sample size: 10 before, 10 after. Below threshold: keep p=0.5 (uncertain)

#### T1.6 -- D1 marks retention policy

```
id:       d1-marks-retention
value:    medium
effort:   small
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [d1, retention, cleanup, P2]
blocks:   []
exit:     Cron deletes synced marks older than 7 days; unsynced marks never deleted
```

- [ ] Add cleanup step to sync worker: `DELETE FROM marks WHERE synced=1 AND ts < ?`
- [ ] Retention: 7 days of synced marks (enough for analytics queries)
- [ ] Unsynced marks never deleted (safety: TypeDB must receive them first)
- [ ] Log: `{ deleted: N, retained: M }` in sync output

---

## Cycle 2: REFLEXES -- Hypothesis Routing + Adaptive Exploration

**Files:** `src/engine/loop.ts`, `src/engine/loops.ts`, `src/engine/world.ts`,
`src/engine/sources.ts`, `src/engine/persist.ts`

**Why second:** Cycle 1 provides honest p-values and D1 analytics. Now wire
those into routing decisions: hypotheses adjust weights, sensitivity adapts
to frontier size, frontiers get explored automatically.

**Depends on:** Cycle 1 complete. Hypothesis reflexes need earned p-values
(T1.5). Adaptive sensitivity needs real frontier data. Auto-explore needs
adaptive sensitivity to decide exploration intensity.

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | Hypothesis reflexes | Confirmed hypotheses auto-adjust routing weights | 0.40/0.10/0.35/0.15 | tag-cluster-fail hypothesis triggers warn on failing wave path | `builder:hypo-reflex` |
| 2 | Adaptive sensitivity | select() sensitivity = f(frontier_size, unit_kind) | 0.35/0.15/0.35/0.15 | sensitivity varies between 0.3-0.9 based on frontier ratio | `builder:adaptive-sens` |
| 3 | Auto-explore frontiers | L7 emits exploratory signals for detected gaps | 0.35/0.15/0.35/0.15 | unit-gap frontier emits explore signal; frontier shrinks on result | `builder:auto-explore` |

### Tasks

#### T2.1 -- Hypothesis-to-routing reflex

```
id:       hypothesis-routing-reflex
value:    critical
effort:   medium
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [hypotheses, routing, reflex, P0]
blocks:   [adaptive-sensitivity]
exit:     Confirmed tag-cluster-fail hypothesis auto-warns the failing edge with weight 2
```

- [ ] In `knowLoop` (loops.ts), after promoting hypothesis to confirmed:
- [ ] Parse hypothesis type (tag-cluster-fail, path-proven, surge, etc.)
- [ ] tag-cluster-fail: `warn(wave>builder:tags, 2)` + `mark(altWave>builder:tags, 1)`
- [ ] path-proven: `mark(edge, 3)` -- bonus strength for confirmed knowledge
- [ ] surge: `mark(edge, 1)` -- acknowledge the surge
- [ ] degrading: `warn(edge, 0.5)` -- preemptive resistance before toxic threshold

#### T2.2 -- Adaptive sensitivity

```
id:       adaptive-sensitivity
value:    critical
effort:   medium
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [routing, sensitivity, explore-exploit, P0]
blocks:   [auto-explore-frontiers]
exit:     select() uses computed sensitivity; fresh substrate ~0.35, mature ~0.89
```

- [ ] Compute `explored = 1 - (frontierSize / (totalPaths + frontierSize + 1))`
- [ ] Base sensitivity: `0.3 + explored * 0.6` (range 0.3 to 0.9)
- [ ] Per-unit kind modifier: scout -0.3, forager -0.1, harvester +0.2, queen 0
- [ ] Cache frontier size per L7 cycle (don't recompute on every select)
- [ ] Expose in tick result: `{ sensitivity, explored, frontierSize }`

#### T2.3 -- Auto-explore frontiers

```
id:       auto-explore-frontiers
value:    critical
effort:   large
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [frontier, exploration, auto-explore, P0]
blocks:   []
exit:     L7 emits up to 5 exploratory signals per cycle; frontier items decrease over time
```

- [ ] In `frontierLoop` (loops.ts), after detecting gaps:
- [ ] **Unit-gap:** emit `signal({ receiver: unitA, data: { explore: true, target: unitB, marks: false } })`
- [ ] **Tag-cluster:** pick unexplored skill with highest tag overlap to explored skills
- [ ] **Wave-gap:** route a tagged task to the untested wave
- [ ] Tag-overlap scoring: Jaccard similarity of tag sets between units
- [ ] Exploration budget: cap at 5 signals per L7 cycle
- [ ] `data.marks = false` on outbound (no trail pollution); mark/warn only on outcome
- [ ] Track: `{ explored: N, succeeded: M, frontier_delta: -K }`

#### T2.4 -- Tag-overlap scoring for frontier priority

```
id:       tag-overlap-frontier-scoring
value:    high
effort:   small
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [frontier, scoring, tags, P1]
blocks:   []
exit:     Unit-gap frontiers sorted by Jaccard similarity; high-overlap gaps explored first
```

- [ ] Add `tagOverlap(tagsA, tagsB)` utility -- Jaccard: `|intersection| / |union|`
- [ ] Replace fixed `expected-value: 0.5` for unit-gaps with computed overlap score
- [ ] Sort exploration queue by expected-value descending
- [ ] Log: `{ gap: 'amara>assessment', overlap: 0.20, explored: true/false }`

#### T2.5 -- Exploration outcome tracking

```
id:       exploration-outcome-tracking
value:    high
effort:   small
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [frontier, exploration, outcomes, P1]
blocks:   []
exit:     Explored frontiers update status to 'explored' with outcome in TypeDB
```

- [ ] On exploration result: update frontier `frontier-status` from 'unexplored' to 'explored'
- [ ] Record outcome: `{ result: true, latency_ms, strength_deposited }` or `{ dissolved: true }`
- [ ] Successful explorations: create the path in TypeDB (it now exists)
- [ ] Failed explorations: mark frontier as 'confirmed-gap' (don't re-explore for 24h)
- [ ] Track cumulative: `{ total_explored, succeeded, failed, frontier_delta }`

---

## Cycle 3: META -- Loops as Units + Gradient + Ghosts

**Files:** `src/engine/loop-units.ts` (new), `src/engine/loop.ts`,
`src/engine/loops.ts`, `src/engine/world.ts`

**Why third:** The foundation (D1, statistics) and reflexes (routing, exploration)
are live. Now make the learning infrastructure itself learnable. Loops become
units. Highway transition becomes gradual. Ghost trails become exploration priors.

**Depends on:** Cycle 2 complete. Loops-as-units needs auto-explore (signals
between loops). Gradient highways needs volume (enough paths at every confidence
level). Ghost trails need adaptive sensitivity (to weight ghosts in explore mode).

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | Loops as units | L3/L5/L6/L7 are world units; signal-driven, not timer-driven | 0.40/0.15/0.30/0.15 | L6>L5 path has pheromone; loops fire on signal, not interval | `builder:loop-units` |
| 2 | Gradient highways | LLM cost tapers with confidence (full>haiku>skip) | 0.30/0.20/0.35/0.15 | Path at strength 12 uses haiku; path at strength 20 skips LLM | `builder:gradient-hw` |
| 3 | Ghost trail priors | Ghost trails weighted above zero-history in explore mode | 0.30/0.20/0.30/0.20 | Path with peak 100, current 5 beats zero-history path in select() | `builder:ghost-prior` |

### Tasks

#### T3.1 -- Register loops as units

```
id:       register-loops-as-units
value:    critical
effort:   large
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [meta, loops, units, P0]
blocks:   [loop-signal-wiring, loop-pheromone]
exit:     net.has('L3:fade') && net.has('L5:evolve') && net.has('L6:know') && net.has('L7:frontier')
```

- [ ] Create `src/engine/loop-units.ts`
- [ ] Register L3, L5, L6, L7 as units with `.on()` handlers per `knowledge-growth.md` sketch
- [ ] L3:fade `.on('tick')` -- runs fade, returns `{ faded: true }`
- [ ] L5:evolve `.on('priority')` -- evolves specified units
- [ ] L6:know `.on('harden')` -- hardens highways, emits to L5 + L7
- [ ] L7:frontier `.on('scan')` -- detects gaps, emits explore signals
- [ ] Wire `.then()` continuations: L6>L5, L6>L7, L7>L1

#### T3.2 -- Signal-driven loop scheduling

```
id:       signal-driven-loop-scheduling
value:    critical
effort:   large
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [meta, loops, scheduling, P0]
blocks:   [loop-pheromone]
exit:     Loops fire on signal (mark count threshold, highway event) not fixed timers
```

- [ ] L3: fires when cumulative mark delta since last fade exceeds threshold
- [ ] L5: fires when L6 signals `L5:evolve` with priority units
- [ ] L6: fires when mark count since last harden exceeds 50 (from D1 query)
- [ ] L7: fires when L6 hardens a new highway (via `.then()`)
- [ ] Keep timer as fallback: if no signal received within 2x old interval, fire anyway
- [ ] This preserves liveness while allowing signal-driven acceleration

#### T3.3 -- Loop pheromone tracking

```
id:       loop-pheromone-tracking
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [meta, loops, pheromone, P1]
blocks:   []
exit:     L6>L5 path has measurable strength; tick result shows loop-to-loop pheromone
```

- [ ] Loop signals go through normal `net.signal()` -- pheromone auto-deposits
- [ ] L6>L5 mark when evolution succeeds; L6>L5 warn when evolution fails
- [ ] L7>L1 mark when exploration discovers a path; warn when exploration dissolves
- [ ] Expose in tick result: `{ loopPaths: { 'L6>L5': { strength, resistance }, ... } }`
- [ ] The substrate learns: "L6 signaling L5 leads to good evolutions 73% of the time"

#### T3.4 -- Gradient highway model selection

```
id:       gradient-highway-model-selection
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [highways, gradient, cost, P1]
blocks:   []
exit:     Path at strength 12 routes to haiku; strength 16 to haiku-reduced; strength 20+ skips
```

- [ ] Add `modelForConfidence(netStrength)` in `loop.ts` or `loops.ts`
- [ ] Strength 0-9: default model (sonnet-class)
- [ ] Strength 10-14: haiku (cheap, full context)
- [ ] Strength 15-19: haiku with reduced context (cheap + fast)
- [ ] Strength 20+: skip LLM entirely (existing highway bypass)
- [ ] Pass selected model to `net.ask()` via `data.model` field
- [ ] Track: `{ modelUsed, netStrength, cost }` per signal in tick result

#### T3.5 -- Ghost trail exploration prior

```
id:       ghost-trail-exploration-prior
value:    high
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [ghosts, exploration, routing, P1]
blocks:   []
exit:     Path with peak 100, current 5 beats zero-history path in select() explore mode
```

- [ ] In `select()` (world.ts), add ghost bonus when sensitivity < 0.5 (explore mode):
- [ ] `ghostBonus = (peak > 10 && strength <= peak * 0.06) ? log1p(peak) * 0.1 : 0`
- [ ] Add to `edgeWeight()` return value
- [ ] Path that once reached strength 100: ghost bonus 0.46
- [ ] Path that never exceeded strength 2: ghost bonus 0.11
- [ ] Zero-history path: ghost bonus 0

#### T3.6 -- Ghost trail TTL

```
id:       ghost-trail-ttl
value:    medium
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [ghosts, cleanup, retention, P2]
blocks:   []
exit:     Ghost trails older than 30 days deleted from strength/peak/lastUsed maps
```

- [ ] In `fade()`: if path is at ghost floor AND `lastUsed` > 30 days, delete entirely
- [ ] Prevents unbounded ghost trail accumulation at scale
- [ ] Log: `{ ghostsExpired: N }` in fade output
- [ ] 30 days = enough time for seasonal patterns to resurface

#### T3.7 -- Adaptive fade rate

```
id:       adaptive-fade-rate
value:    medium
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [fade, adaptive, throughput, P2]
blocks:   []
exit:     Fade rate scales with signal throughput; high volume = faster fade
```

- [ ] Query D1 marks table for signals-per-minute in last window
- [ ] `adaptiveRate = baseRate * (1 + log1p(signalsPerMinute) / 10)`
- [ ] At 1 signal/min: rate ~0.05 (current). At 580/s (34,800/min): rate ~0.10 (2x faster)
- [ ] Maintains signal-to-noise ratio as volume increases
- [ ] Pass computed rate to `net.fade(adaptiveRate)`

#### T3.8 -- Latency penalty curve fix

```
id:       latency-penalty-curve-fix
value:    medium
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [routing, latency, formula, P2]
blocks:   []
exit:     50ms path and 500ms path have meaningfully different weights in select()
```

- [ ] Current: `1 / (1 + latency / 1000)` -- too flat (50ms=0.95, 500ms=0.67)
- [ ] New: `1 / (1 + (latency / 200) ** 1.5)` -- steeper at real latency distribution
- [ ] 10ms: 0.99, 50ms: 0.95, 200ms: 0.50, 500ms: 0.13, 2000ms: 0.02
- [ ] This reflects reality: most paths are <10ms or >2000ms, rarely between

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **FOUNDATION** | D1 WAL captures every mark/warn; p-values computed from data | L1 (signal), L2 (trail), L3 (fade) |
| **REFLEXES** | Hypotheses adjust routing; sensitivity adapts; frontiers auto-explored | L4 (economic), L5 (evolution gets targeted), L6 (knowledge reflexes), L7 (active frontier) |
| **META** | Loops are units with pheromone; highways gradient; ghosts inform exploration | All 7 loops fully coupled through signals, self-scheduling, meta-emergence |

---

## Status

- [ ] **Cycle 1: FOUNDATION** -- D1 WAL + Statistical Testing
  - [ ] T1.1 D1 pheromone WAL migration
  - [ ] T1.2 Buffer mark/warn to D1
  - [ ] T1.3 Sync worker: D1 > TypeDB batch
  - [ ] T1.4 Analytics API endpoint
  - [ ] T1.5 Statistical hypothesis testing
  - [ ] T1.6 D1 marks retention policy
- [ ] **Cycle 2: REFLEXES** -- Hypothesis Routing + Adaptive Exploration
  - [ ] T2.1 Hypothesis-to-routing reflex
  - [ ] T2.2 Adaptive sensitivity
  - [ ] T2.3 Auto-explore frontiers
  - [ ] T2.4 Tag-overlap scoring for frontier priority
  - [ ] T2.5 Exploration outcome tracking
- [ ] **Cycle 3: META** -- Loops as Units + Gradient + Ghosts
  - [ ] T3.1 Register loops as units
  - [ ] T3.2 Signal-driven loop scheduling
  - [ ] T3.3 Loop pheromone tracking
  - [ ] T3.4 Gradient highway model selection
  - [ ] T3.5 Ghost trail exploration prior
  - [ ] T3.6 Ghost trail TTL
  - [ ] T3.7 Adaptive fade rate
  - [ ] T3.8 Latency penalty curve fix

---

## Shared Work (Don't Duplicate)

| Work item | This TODO | Also in | Rule |
|-----------|-----------|---------|------|
| D1 WAL (migration + buffer + sync) | T1.1-T1.3 | emergence-tasks T3.6 | Whichever cycle runs first wires it. The other inherits. |
| Statistical p-values | T1.5 | deterministic-inference.md Gap 4 | This TODO wires it. det-inference doc describes the gap. |
| Gradient highway model selection | T3.4 | TODO-llm-routing C1 (STAN) | **Overlap.** T3.4 is the confidence→model curve. TODO-llm-routing C1 is tag→model via STAN. Both needed — T3.4 adjusts cost per confidence, C1 adjusts model per tag. Wire T3.4 *inside* chooseModel() as an additional gate. |
| Adaptive sensitivity | T2.2 | llm-routing.md (sensitivity param) | T2.2 makes sensitivity dynamic. llm-routing.md documents the static version. |
| Ghost trail priors | T3.5 | deterministic-inference.md (asymmetric decay) | T3.5 extends the existing ghost floor into exploration priors. |

## See Also

- [TODO-emergence-tasks.md](TODO-emergence-tasks.md) -- horizontal axis: signal volume, federation, metabolism
- [TODO-llm-routing.md](TODO-llm-routing.md) -- LLM model selection, cache, intent, patterns (shares gradient highway work)
- [deterministic-inference.md](deterministic-inference.md) -- CTO-level: what we have, gaps, 9 improvements
- [knowledge-growth.md](knowledge-growth.md) -- the full architecture with implementation sketches
- [llm-routing.md](llm-routing.md) -- STAN mechanism, sensitivity, tags x pheromone x rubrics
- [routing.md](routing.md) -- pheromone formula, tick loop, four outcomes
- [DSL.md](DSL.md) -- signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) -- canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) -- quality scoring: fit/form/truth/taste
- [TODO-template.md](TODO-template.md) -- the template this follows

---

*3 cycles. 24 tasks. Wire in cascade order: 4>5>7>3>2>1>6>8.*
*Each improvement bootstraps the next. The substrate learns to learn.*
