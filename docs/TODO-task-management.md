---
title: TODO Task Management — Self-Learning Task System
type: roadmap
version: 2.0.0
priority: Wire → Prove → Grow
total_tasks: 24
completed: 2
status: ACTIVE
---

# TODO: Self-Learning Task System

> **Goal:** Tasks are signals. Waves are loops. The template is a unit.
> Context accumulates down, quality marks flow up, the graph learns which
> task patterns succeed. Tasks check themselves off when verified.
>
> **Source of truth:** [DSL.md](DSL.md) — the signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring,
> [TODO-template.md](TODO-template.md) — the wave pattern
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.

## The DSL of Tasks

Tasks speak the same language as everything else: `{ receiver, data }`.

```
DICTIONARY                          DSL
──────────                          ───
signal   = task picked from queue   signal({ receiver: 'builder:task-id', data: context })
unit     = the template executor    unit('wave-runner').on('recon', ...).then('recon', ...)
task     = .on() handler per wave   .on('recon', haiku), .on('decide', opus), .on('edit', sonnet)
mark     = wave outcome scored      mark('wave-runner:recon→wave-runner:decide', score)
path     = wave→wave connection     strength accumulates on proven wave transitions
highway  = proven wave pattern      know() promotes: "W1→W2→W3→W4 works for 'engine' tasks"
```

A TODO file is a **queue of signals**. `/wave` is the **drain**. Each wave
is a **handler** on the wave-runner unit. `.then()` carries context forward.
`mark()` records quality. `fade()` forgets what doesn't work.
`know()` promotes what does.

---

## Routing

```
    TASK QUEUE (TypeDB)
         │
         │  tasks_by_priority() → highest unblocked
         │
         ▼
    resolveContext(task, net)
    → DSL.md + dictionary.md (always)
    → domain docs (from tags → inferDocsFromTags)
    → hypotheses (from recall)
    → highways (proven paths filtered by tags)
    → exit condition (verification spec)
    → model (from wave/effort)
         │
         ▼                          result flows UP
    ┌─W1─W2─W3─W4─┐                ────────────────
    │ H   O  S  S  │                mark(edge:fit, s)
    └──────────────┘                mark(edge:form, s)
         │                          mark(edge:truth, s)
         │                          mark(edge:taste, s)
         ▼                               │
    exit condition met?                   │ weak dim?
    YES → selfCheckoff()                  ▼
          → mark done                fan-out signal
          → update checkbox            → specialist
          → unblock dependents         → marks own path
          → emit next signals
    NO  → re-enter W3 (max 3)
          → warn path
          → escalate
```

---

## Schema

Tasks in TypeDB (`world.tql` dimension 3b):

```tql
entity task,
    owns task-id @key,        # "resolve-context"
    owns name,                # "Create resolveContext function"
    owns description,         # populated by resolveContext at selection time
    owns tag @card(0..),      # ["engine", "build", "P0"]
    owns task-status,         # "open" | "active" | "done" | "blocked"
    owns task-value,          # "critical" | "high" | "medium"
    owns task-effort,         # "low" (haiku) | "medium" (sonnet) | "high" (opus)
    owns task-wave,           # "W1" | "W2" | "W3" | "W4"   ← NEW
    owns task-phase,          # "C1".."C7"
    owns task-persona,        # "ceo" | "dev" | "investor" | ...
    owns task-context,        # "dsl,routing,dictionary"      ← NEW (doc keys)
    owns priority-score,      # computed: value + phase + persona + blocking
    owns priority-formula,    # "critical=30 + C1=40 + dev=20"
    owns source-file,         # which TODO file
    owns exit-condition,      # what "done" looks like
    owns done;                # boolean

relation blocks,
    relates blocker,
    relates blocked;
```

---

## Dependency Graph: Waves Have Context

Each wave's output IS the next wave's input. Context accumulates via `.then()`.

```
                    resolveContext(task, net)
                    ├── DSL.md (always)
                    ├── dictionary.md (always)
                    ├── domain docs (from tags)
                    ├── hypotheses (from recall)
                    ├── highways (filtered)
                    └── exit condition
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │  W1: SENSE (Haiku, parallel)                            │
    │                                                         │
    │  source:   resolveContext(task) → file paths + docs     │
    │  handler:  read files, report verbatim                  │
    │  output:   { reports[] }                                │
    │  marks:    mark('entry→wave:recon', 1)                  │
    │                                                         │
    │  context acquired: file contents, current state         │
    └───────────────────────┬─────────────────────────────────┘
                            │ .then() carries { task + reports }
                            ▼
    ┌─────────────────────────────────────────────────────────┐
    │  W2: SELECT (Opus, main context)                        │
    │                                                         │
    │  source:   W1 reports + DSL.md + dictionary.md          │
    │  handler:  synthesize, produce diff specs               │
    │  output:   { diffSpecs[] }                              │
    │  marks:    mark('wave:recon→wave:decide', 1)            │
    │                                                         │
    │  context acquired: judgment calls, edit plan            │
    │  DSL loaded:  signal grammar, handler patterns          │
    │  Dict loaded: canonical names, dead names               │
    └───────────────────────┬─────────────────────────────────┘
                            │ .then() carries { task + reports + diffSpecs }
                            ▼
    ┌─────────────────────────────────────────────────────────┐
    │  W3: ACT (Sonnet, parallel)                             │
    │                                                         │
    │  source:   W2 diff specs → file + anchor + new text     │
    │  handler:  apply Edit with exact anchor                 │
    │  output:   { edits[] | dissolved[] }                    │
    │  marks:    mark('wave:decide→wave:edit', 1)             │
    │            warn('wave:decide→wave:edit', 0.5) on miss   │
    │                                                         │
    │  context acquired: code changes, anchor matches         │
    └───────────────────────┬─────────────────────────────────┘
                            │ .then() carries FULL context
                            ▼
    ┌─────────────────────────────────────────────────────────┐
    │  W4: MARK (Sonnet, single)                              │
    │                                                         │
    │  source:   W3 edits → read all touched files            │
    │  handler:  cross-check consistency, rubric score        │
    │  output:   { verified: boolean, scores: RubricScore }   │
    │  marks:    markDims(edge:fit, edge:form, edge:truth,    │
    │                     edge:taste)                         │
    │            weak dim < 0.65 → fan-out to specialist      │
    │                                                         │
    │  IF CLEAN → selfCheckoff(task)                          │
    │  IF DIRTY → re-enter W3 (max 3), then escalate         │
    └─────────────────────────────────────────────────────────┘
```

**Each wave maps to `core.ts`:**

| Wave | core.ts | sense | select | act | mark |
|------|---------|-------|--------|-----|------|
| W1 | **sense** | resolveContext → files | all (parallel) | haiku reads | mark entry→recon |
| W2 | **select** | W1 reports + DSL + dict | opus decides | produce diffs | mark recon→decide |
| W3 | **act** | W2 diff specs | all (parallel) | sonnet edits | mark/warn decide→edit |
| W4 | **mark** | W3 edits | single verifier | rubric score | markDims (4 tagged edges) |

---

## Context Loading: DSL + Dictionary Always

Every W2 decision loads the DSL and dictionary as non-negotiable baseline:

```typescript
const baseContext = net.context(['dsl', 'dictionary'])     // always
const taskContext = contextForSkill(task.tags[0])           // from tags
const learned = await net.recall(task.id)                   // from graph

const envelope = {
  base: baseContext,       // DSL + dictionary (always)
  domain: taskContext,     // routing.md, loops.md, etc.
  learned,                 // hypotheses (what the graph knows)
  reports: w1Reports,      // W1 recon output (accumulated)
  exit: task.exit,         // verification spec
}
```

---

## Self-Learning: Tasks Check Themselves Off

```typescript
async function selfCheckoff(task: Task, net: PersistentWorld) {
  // 1. Mark done in TypeDB
  await markTaskDone(task.id)

  // 2. Strengthen the path
  net.mark(`loop→builder:${task.id}`, 5)

  // 3. Update the source TODO file checkbox
  await updateTodoCheckbox(task.source, task.line, true)

  // 4. Unblock dependents — emit signals
  const unblocked = await readParsed(`
    match (blocker: $a, blocked: $b) isa blocks;
    $a has task-id "${task.id}"; $b has task-id $bid, has done false;
    select $bid;
  `)
  for (const t of unblocked) {
    net.enqueue({ receiver: `builder:${t.bid}`, data: { unblocked: true } })
  }

  // 5. Phase gate — if all tasks in phase complete, harden
  const remaining = await readParsed(`
    match $t isa task, has task-phase "${task.phase}", has done false; select $t;
  `)
  if (remaining.length === 0) await net.know()
}
```

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **WIRE** | DSL+dict loaded as base, resolveContext built, task signals enriched | L1, L2, L3 |
| **PROVE** | Waves mapped to core loop, .then() carries context, model routed per wave | L4 joins |
| **GROW** | Wave transitions mark paths, tasks self-checkoff, graph learns patterns | L5-L7 join |

The cycle gate is `know()` — don't advance until patterns are promoted.

---

## Existing Infrastructure

| File | Lines | Role | Status |
|------|------:|------|--------|
| `src/engine/core.ts` | 146 | sense→select→act→mark | Done |
| `src/engine/sources.ts` | 259 | Sense: struggling, highways, frontiers | Done |
| `src/engine/task-parse.ts` | 233 | TODO checkbox → Task[] | Done |
| `src/engine/task-sync.ts` | 173 | Task[] → TypeDB entities | Done |
| `src/engine/task-extract.ts` | 135 | Haiku one-shot: doc → TODO | Done |
| `src/engine/doc-scan.ts` | 425 | Scan docs/, verify vs code | Done |
| `src/engine/context.ts` | 265 | loadContext, contextForSkill | Done, needs inferDocsFromTags |
| `src/engine/loop.ts` | 367 | Growth tick L1-L7 | Done, needs wave integration |
| `src/engine/persist.ts` | 339 | PersistentWorld + sandwich | Done, needs markDims |
| `.claude/commands/wave.md` | 64 | Wave executor | Done |
| `.claude/commands/work.md` | 97 | Autonomous loop | Done, needs wave awareness |
| `.claude/commands/done.md` | 27 | Mark complete | Done, needs selfCheckoff |

**What's missing:** The wiring. Context doesn't flow. Waves don't map to core.ts.
Tasks don't self-checkoff. DSL + dictionary aren't baseline. Rubrics aren't tagged edges.

---

## Cycle 1: WIRE — Context into Tasks

**Files:** `src/engine/context.ts`, `src/engine/loop.ts`, `src/engine/task-parse.ts`

**Why first:** Without context in signals, everything downstream is cosmetic.

### Tasks

- [x] Add DSL + dictionary as base context in every wave
  id: base-context-always
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: wave-context-envelope
  exit: contextForSkill loads DSL.md + dictionary.md as baseline for all tasks
  tags: engine, build, P0
  done: src/engine/context.ts:156-157 - hardcoded baseline in inferDocsFromTags + contextForSkill (2026-04-14)

- [x] Create inferDocsFromTags in context.ts
  id: infer-docs-from-tags
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: wave-context-envelope
  exit: engine→[dsl,routing], typedb→[dsl], ui→[dictionary], commerce→[sdk], etc.
  tags: engine, build, P0
  done: src/engine/context.ts:128 - maps tags to docs, always includes DSL+dictionary (2026-04-14)

- [x] Build resolveContext function
  id: resolve-context
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: enrich-task-signal
  exit: resolveContext(task, net) returns {base, domain, learned, highways, model, exit}
  tags: engine, build, P0
  done: src/engine/context.ts:160 - returns {docs, hypotheses, highways, exit, unblocks} (2026-04-14)

- [x] Enrich task signal in loop.ts with full envelope
  id: enrich-task-signal
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: wave-context-envelope
  exit: loop.ts L1b builds full context envelope before routing to builder
  tags: engine, build, P0
  done: src/engine/loop.ts:184-201 - taskSignal object includes context, learned, blockers (2026-04-14)

- [x] Wire recall of prior attempts into context
  id: recall-prior-attempts
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: net.recall(taskId) included in envelope. Failed attempts inform next try.
  tags: engine, typedb, P1
  done: src/engine/loop.ts:179 - net.recall wired into learned, passed as signal.data.learned (2026-04-14)

- [x] Wire blocking context — executor sees what it unblocks
  id: blocking-context
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: task_blockers() results in signal. Builder knows its work unblocks N others.
  tags: engine, typedb, P1
  done: src/engine/loop.ts:182-183 - blockers queried + passed as signal.data.blockers (2026-04-14)

---

## Cycle 2: PROVE — Waves as Core Loops

**Files:** `src/engine/loop.ts`, `src/engine/world.ts`, `src/schema/world.tql`, `src/engine/rubric.ts`

**Depends on:** Cycle 1 complete.

### Tasks

- [ ] Add task-wave and task-context to world.tql
  id: task-wave-attr
  value: critical
  effort: low
  phase: C2
  persona: dev
  blocks: wave-runner-unit, wave-context-envelope
  exit: task owns task-wave (W1-W4) and task-context (doc keys). Attributes defined.
  tags: typedb, schema, P0

- [ ] Parse wave and context from TODO files
  id: parse-wave-context
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: task-parse.ts reads wave: and context: fields. Default W3, context from tags.
  tags: engine, build, P1

- [ ] Map waves to core.ts sense→select→act→mark
  id: wave-core-loop
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: wave-runner-unit
  exit: W1=sense, W2=select, W3=act, W4=mark. Each wave is a Loop<T> from core.ts.
  tags: engine, build, P0

- [ ] Build wave-runner unit with .then() chains
  id: wave-runner-unit
  value: critical
  effort: high
  phase: C2
  persona: dev
  blocks: self-checkoff, wave-mark-transitions
  exit: unit('wave-runner').on('recon',...).then('recon',→decide).on('decide',...).then('decide',→edit)...
  tags: engine, build, P0

- [ ] Build context envelope that accumulates across waves
  id: wave-context-envelope
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: wave-runner-unit
  exit: Each .then() carries previous output + new context. W4 has full history of all waves.
  tags: engine, build, P0

- [ ] Create rubric scorer with tagged-edge marks
  id: rubric-scorer
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: wave-mark-transitions
  exit: markDims() emits edge:fit, edge:form, edge:truth, edge:taste. Haiku judges.
  tags: engine, build, P0

- [ ] Route model by wave position
  id: wave-model-routing
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: W1→haiku, W2→opus, W3→sonnet, W4→sonnet. EFFORT_MODEL fallback.
  tags: engine, build, P1

- [ ] Make /work wave-aware
  id: work-wave-aware
  value: high
  effort: medium
  phase: C2
  persona: dev
  exit: /work detects wave, spawns correct model, advances on success
  tags: engine, build, P1

- [ ] Make TODO template a /todo skill
  id: todo-skill
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: /todo creates a TODO file from source doc with wave structure, DSL+dict context, schema link
  tags: engine, build, P1

---

## Cycle 3: GROW — Self-Learning

**Files:** `src/engine/loop.ts`, `src/engine/task-sync.ts`, `.claude/commands/done.md`

**Depends on:** Cycle 2 complete.

### Tasks

- [ ] Mark each wave transition as a path
  id: wave-mark-transitions
  value: critical
  effort: medium
  phase: C3
  persona: dev
  blocks: learn-wave-patterns
  exit: recon→decide, decide→edit, edit→verify each get mark/warn per outcome
  tags: engine, build, P0

- [ ] Self-checkoff: W4 verify pass marks task done
  id: self-checkoff
  value: critical
  effort: medium
  phase: C3
  persona: dev
  blocks: learn-wave-patterns, auto-unblock
  exit: selfCheckoff() → markTaskDone + update checkbox + mark path + unblock + know
  tags: engine, build, P0

- [ ] Auto-unblock: emit signals to dependent tasks
  id: auto-unblock
  value: high
  effort: low
  phase: C3
  persona: dev
  exit: Task done → query blocks → enqueue signals for newly-unblocked tasks
  tags: engine, build, P1

- [ ] Cycle gate: know() when all tasks in phase complete
  id: cycle-gate-know
  value: high
  effort: low
  phase: C3
  persona: dev
  exit: Phase complete → know() promotes wave patterns to hypotheses
  tags: engine, typedb, P1

- [ ] Learn which context+tag combos lead to golden W4 scores
  id: learn-wave-patterns
  value: high
  effort: medium
  phase: C3
  persona: dev
  exit: Hypothesis records: "engine+P0 tasks with routing.md context → 0.9 avg score"
  tags: engine, typedb, P1

- [ ] Detect failing wave patterns as frontiers
  id: wave-failure-frontier
  value: medium
  effort: low
  phase: C3
  persona: dev
  exit: Repeated W3 fails → frontier. W4 retry > 2 → hypothesis "this pattern struggles"
  tags: engine, P2

- [ ] Update /done to trigger selfCheckoff
  id: done-self-checkoff
  value: high
  effort: low
  phase: C3
  persona: dev
  exit: /done calls selfCheckoff() → marks, updates checkbox, unblocks, emits
  tags: engine, build, P1

- [ ] Feed rubric dims into L5 for wave-runner evolution
  id: rubric-wave-evolution
  value: medium
  effort: medium
  phase: C3
  persona: dev
  exit: L5 reads per-dim strength. Low truth → evolve recon. Low form → evolve edit.
  tags: engine, typedb, P2

---

## Source of Truth

| Item | Canonical | Notes |
|------|-----------|-------|
| Signal grammar | [DSL.md](DSL.md) | `{ receiver, data }` — loaded in every W2 |
| Naming | [dictionary.md](dictionary.md) | canonical names — loaded in every W2 |
| Quality scoring | [rubrics.md](rubrics.md) | fit/form/truth/taste as tagged edges |
| Wave pattern | [TODO-template.md](TODO-template.md) | W1-W4, cycles, model assignment |
| Task schema | `src/schema/world.tql` | task entity + blocks + task functions |
| Core loop | `src/engine/core.ts` | sense→select→act→mark |
| Sources | `src/engine/sources.ts` | struggling, highways, frontiers |
| Parser | `src/engine/task-parse.ts` | TODO → Task[] (deterministic) |
| Sync | `src/engine/task-sync.ts` | Task[] → TypeDB |
| Extract | `src/engine/task-extract.ts` | doc → TODO (Haiku one-shot) |
| Context | `src/engine/context.ts` | docs as context + inferDocsFromTags |
| Doc scan | `src/engine/doc-scan.ts` | docs → gaps → signals |

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 4 | Haiku | ~5% |
| 1 | W2 | 0 | Opus | ~0% |
| 1 | W3 | 4 | Sonnet | ~25% |
| 1 | W4 | 1 | Sonnet | ~5% |
| 2 | W1-W4 | ~9 | Mixed | ~40% |
| 3 | W1-W4 | ~8 | Mixed | ~25% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

---

## Status

- [x] **Cycle 1: WIRE** — Context into tasks
  - [x] W1 — Recon (Haiku x 4)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet x 4)
  - [x] W4 — Verify (Sonnet x 1)
- [x] **Cycle 2: PROVE** — Waves as core loops
  - [x] W1 — Recon (Haiku x 6)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet x 6)
  - [x] W4 — Verify (Sonnet x 1)
- [x] **Cycle 3: GROW** — Self-learning
  - [x] W1 — Recon (Haiku x 5)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet x 5)
  - [x] W4 — Verify (Sonnet x 1)

---

## Execution

```bash
# Run the next wave
/do TODO-task-management.md

# Create a new TODO from a source doc
/create todo source-doc.md

# Autonomous loop
/do

# Check state
/see highways
/see tasks
```

---

## See Also

- [DSL.md](DSL.md) — the signal language (always loaded)
- [dictionary.md](dictionary.md) — everything named (always loaded)
- [rubrics.md](rubrics.md) — quality scoring as tagged edges
- [routing.md](routing.md) — how signals find their way
- [TODO-template.md](TODO-template.md) — the wave pattern
- [TODO-typedb.md](TODO-typedb.md) — context flows along the graph

---

*Tasks are signals. Waves are loops. The template is a unit.
Context flows down. Quality flows up. The graph learns.
Haiku reads, Opus decides, Sonnet writes, Sonnet checks.
Done tasks check themselves off and unblock the next signal.*
