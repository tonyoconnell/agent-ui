# Engine

**Skills: `/react19` for hooks/state, `/typedb` for persist layer queries, `/sui` for Sui integration (bridge.ts, Phase 2+).**

~90 lines. Two fields. Signal flows. Queue waits. TypeDB remembers.

## Substrate Learning

This folder IS the nervous system. Every file here participates in the self-learning loop:

```
signal → mark/warn → fade → highway → know → evolve → self-observe
  │         │          │        │        │       │          │
world.ts  persist.ts  loop.ts  loop.ts  persist  loop.ts   loop.ts
                                                            (writeHealth
                                                             → tick→typedb)
```

**ADL denials also deposit pheromone.** `audit(rec)` in `adl-cache.ts`
invokes a boot-registered hook that calls `net.warn(sender→receiver, w)`
with weight by decision (`deny=1.0`, `fail-closed=1.0`, `allow-audit=0.3`,
`observe=0`). Security and routing share the same graph: a path that
keeps tripping gates becomes naturally repelled through `strength − resistance`.

**Speed contract:** mark/warn `<0.001ms` (in-memory). Routing `<0.005ms`. The learning is invisible vs the LLM.

**Context:** [DSL.md](../../docs/DSL.md) defines the signal grammar. [dictionary.md](../../docs/dictionary.md) defines the names. [routing.md](../../docs/routing.md) — this folder IS routing.md in code: `loop.ts` implements the tick loop (select→ask→mark/warn→fade), `persist.ts` implements the deterministic sandwich (toxic→capable→execute→outcome), `world.ts` implements the formula (`weight = 1 + max(0, strength - resistance) × sensitivity`). Four outcomes: `{result}` → mark(chainDepth), `{timeout}` → neutral, `{dissolved}` → warn(0.5), `(none)` → warn(1). [rubrics.md](../../docs/rubrics.md) defines quality scoring as tagged edges. [patterns.md](../../docs/patterns.md) defines the 10 emergent patterns. [lifecycle.md](../../docs/lifecycle.md) defines into/through/out. [speed.md](../../docs/speed.md) defines the benchmarks that make the learning rate possible. [buy-and-sell.md](../../docs/buy-and-sell.md) — `data.weight` is the payment amount; `mark(edge, weight)` settles the trade and deposits pheromone in one call (L4). [revenue.md](../../docs/revenue.md) — the five revenue layers the engine drives (routing → discovery → infra → marketplace → intelligence).

## Two Layers

```
NERVOUS SYSTEM (runtime)         BRAIN (TypeDB)
─────────────────────            ──────────────
signals move                     paths persist
units receive                    units persist
handlers run                     signals recorded
continuations chain              classification inferred
strength/resistance accumulate   evolution detected
queue holds work                 knowledge hardens

loops L1-L3 (ms-min)            loops L4-L7 (hours-weeks)
```

## Core Types

```typescript
Signal = { receiver: string, data?: unknown }  // universal primitive
Unit   = callable + tasks + continuations      // entity with handlers
World  = units + strength + resistance + queue // the substrate
PersistentWorld = world + TypeDB persistence   // the full runtime
```

## Task Signature

```typescript
(data, emit, ctx) => result
// emit: (Signal) => void
// ctx: { from: string, self: string }
```

## Tasks = Handlers, Dependencies = Continuations

```typescript
// OLD: task entity in TypeDB, dependency relation, trail relation
// NEW: handlers and continuations on units
const bob = net.add('bob')
  .on('schema', async (data, emit) => buildSchema(data))
  .then('schema', r => ({ receiver: 'bob:api', data: r }))
  .on('api', async (data, emit) => buildAPI(data))
  .then('api', r => ({ receiver: 'bob:test', data: r }))

// Pheromone accumulates automatically on every signal delivery
net.signal({ receiver: 'bob:schema', data: { spec: '...' } })
```

## Queue

```typescript
// Signals that can't be delivered immediately wait in the queue
net.enqueue({ receiver: 'future-unit:task', data: {} })

// drain() shifts from queue and signals
net.drain()

// When a unit is added, queued signals for it auto-deliver
net.add('future-unit')  // queued signals fire
```

## Zero Returns

Positive flow only. Missing handler? Signal dissolves. Swarm continues.

```typescript
// Good: silence is valid
task?.(data, emit, ctx)

// Bad: no throws, no rejects for missing
if (!task) throw new Error(...)
```

## Files

### Foundation

| File | Lines | Purpose |
|------|------:|---------|
| `world.ts` | 444 | Unit + World + strength/resistance + queue + ask (4 outcomes) |
| `persist.ts` | 906 | PersistentWorld = World + TypeDB sync + sandwich + know/recall/reveal/forget/frontier |
| `core.ts` | 138 | Shared primitives: types, signal helpers, edge utils |
| `builder.ts` | 34 | Fluent world builder shorthand |

### Tick & Loops

| File | Lines | Purpose |
|------|------:|---------|
| `loop.ts` | 651 | Growth tick: all 7 loops, chain depth, outcome handling (the main loop file) |
| `loops.ts` | 405 | Loop primitives: L1-L7 individual loop functions, timing, scheduling |
| `tick.ts` | 224 | HTTP tick endpoint handler: fires loops, reports per-loop timings |
| `work-loop.ts` | 160 | Task execution loop: dequeue → ask → mark/warn, work queue management |
| `wave-runner.ts` | 365 | Wave orchestration: W1 recon → W2 decide → W3 edit → W4 verify |
| `boot.ts` | 83 | Hydrate from TypeDB, add units, start tick |
| `bootstrap.ts` | 396 | Full substrate bootstrap: load agents, wire world, health check |

### Substrate Config & Composition

| File | Lines | Purpose |
|------|------:|---------|
| `substrate.ts` | 489 | Composed substrate: world + persist + ADL + agents wired together |
| `substrate-config.ts` | 240 | Substrate configuration: env, feature flags, TypeDB connection |
| `one.ts` | 255 | ONE entry point: creates substrate for dev/local environments |
| `one-prod.ts` | 607 | ONE production entry: full substrate with all integrations wired |
| `one-complete.ts` | 346 | Complete substrate with all optional features (Sui, federation, etc.) |

### Context & Routing

| File | Lines | Purpose |
|------|------:|---------|
| `context.ts` | 339 | Signal context: from/self/depth tracking, chain context propagation |
| `intent.ts` | 205 | Intent cache: typed text → canonical intent → shared D1 cache entry |
| `selectors.ts` | 197 | Path selectors: select/follow/highways/toxic query helpers |
| `sources.ts` | 276 | Signal sources: typed emitters per channel (telegram, discord, web) |

### Agents

| File | Lines | Purpose |
|------|------:|---------|
| `agent.ts` | 107 | Base agent type: model + prompt + generation + capability wiring |
| `agent-md.ts` | 531 | Parse markdown agents, sync to TypeDB, wire to runtime |
| `human.ts` | 86 | Human as substrate unit: Telegram/Discord input unit |

### ADL & Security

| File | Lines | Purpose |
|------|------:|---------|
| `adl.ts` | 442 | ADL v0.2: lifecycle/network/sensitivity gates, adlFromAgentSpec() |
| `adl-cache.ts` | 285 | ADL in-process cache: 5-min TTL, ~300ms savings on cache hit |

### Docs & Tasks

| File | Lines | Purpose |
|------|------:|---------|
| `md.ts` | 260 | Markdown parsing utilities: frontmatter, sections, agent spec extraction |
| `doc-scan.ts` | 429 | Scan docs/*.md → memory → TypeDB (L6 knowledge loop) |
| `task-parse.ts` | 288 | Parse TODO markdown: extract tasks, waves, metadata |
| `task-extract.ts` | 137 | Extract task items from markdown blocks, normalize task format |
| `task-sync.ts` | 334 | Sync tasks to TypeDB: upsert, status update, dependency wiring |

### Quality & Rubric

| File | Lines | Purpose |
|------|------:|---------|
| `rubric.ts` | 102 | Rubric types: fit/form/truth/taste dimensions, scoring interface |
| `rubric-score.ts` | 169 | Rubric scoring: compute dimension scores, aggregate, emit as pheromone |

### LLM

| File | Lines | Purpose |
|------|------:|---------|
| `llm.ts` | 234 | LLM as unit: openrouter adapter (+ legacy anthropic/openai) |
| `llm-router.ts` | 267 | LLM router: model selection, fallback, cost tracking per call |

### Brand & Chat

| File | Lines | Purpose |
|------|------:|---------|
| `brand.ts` | 107 | Brand identity: ONE persona, voice, response framing |
| `brand-signals.ts` | 100 | Brand signal emitters: structured brand events to substrate |
| `chat.ts` | 75 | Chat session: message history, turn management |
| `chat-helpers.ts` | 93 | Chat utilities: format messages, extract content, normalize roles |

### Integrations

| File | Lines | Purpose |
|------|------:|---------|
| `agentverse.ts` | 101 | Fetch.ai AgentVerse: register/discover/call 2M agents |
| `agentverse-bridge.ts` | 48 | Bridge: 2M AV agents as proxy units in main world |
| `bridge.ts` | 363 | Sui ↔ TypeDB: mirror/absorb/resolve paths on-chain (testnet ✅) |
| `durable-ask.ts` | 123 | Durable asks: pending asks in D1, survive worker restarts |
| `federation.ts` | 58 | Federate: another ONE world as a unit in this one |
| `api.ts` | 152 | `apiUnit()`: any HTTP endpoint as a substrate unit |
| `apis/index.ts` | 62 | Pre-built API units: github, slack, notion, mailchimp, pagerduty, discord, stripe |

### Exports

| File | Lines | Purpose |
|------|------:|---------|
| `index.ts` | 118 | Public exports: world, persist, llm, agent-md, adl, bridge, federation, apis |

## Usage

```typescript
// Recommended entry point
import { world } from "@/engine"
const w = world()
const scout = w.actor('scout')
  .on('observe', ({ tick }) => ({ data: tick }))
  .then('observe', r => ({ receiver: 'analyst', data: r }))

// Direct substrate access
import { createWorld } from "@/engine"
const net = createWorld()
const u = net.add('agent')
  .on('task', (data, emit) => emit({ receiver: 'next', data }))
net.signal({ receiver: 'agent:task', data: {} })

// Queue
net.enqueue({ receiver: 'agent:task', data: {} })
net.drain()

// Ask (signal + wait for reply)
const result = await net.ask({ receiver: 'agent:task', data: {} })

// Knowledge from experience
const learned = await net.recall('task-id')  // hypotheses + failed attempts
const blockers = await net.taskBlockers('task-id')  // what gets unblocked

// Pheromone
net.mark('a→b', 1)        // strengthen
net.fade(0.1)              // decay
net.highways(10)           // top paths
net.follow('task')         // best next
net.select('task')         // probabilistic pick
```

## Signal Flow

```
signal(sig, from)
  → unit(sig, from)
    → task(data, emit, ctx)
      → emit(sig)           // fan out
        → mark(path)        // path strengthens
          → signal(...)     // recursion
      → .then(task, tmpl)   // continuation fires
        → signal(next)      // chain continues
```
