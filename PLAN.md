# PLAN — loop.yaml

**Goal:** one file. One workflow spec. The shortest possible distance from *intent* to *signal flow*. Built on top of ONE's substrate, not beside it.

---

## The Insight

OPSX declares artifacts with `requires`/`generates` and a state machine walks the DAG. Classic.
ONE already has a DAG-walker: `select()` over pheromone. The substrate **is** the workflow engine.

So `loop.yaml` isn't a workflow file. It's a **seeding** file. It declares:

- units that exist
- skills they carry
- tags that identify work
- filesystem artifacts that count as evidence
- known chains (for pipelines) or `world:tag` (for discovery)

Then the tick loop (`src/engine/loop.ts`) runs it. `mark()` on success. `warn()` on failure. `fade()` over time. The YAML is the seed; the substrate is the soil.

```
OPSX            ONE
────            ───
state machine   pheromone
BLOCKED→READY   requires satisfied → mark(seed)
READY→DONE      generates exists → mark(completion)
requires        chain depth (reinforces on success)
instructions    context loaded per tag
```

No new state store. No new queue. `loop.yaml` is 100% declarative over the existing primitives.

---

## Scope of the File

What `loop.yaml` declares:

| Section | What | Why |
|---------|------|-----|
| `name` | project identity | namespace for pheromone |
| `context` | always-on files | injected into every signal |
| `units` | agent list (md path + tags) | maps to `src/engine/agent-md.ts` `syncAgent()` |
| `tasks` | work items with `receiver` + `generates` + `requires` | the DAG seed |
| `hooks` | shell commands on mark/warn/edit | observability + side effects |
| `loops` | tick / fade / evolve cadence | maps to L1–L7 in `loop.ts` |

What `loop.yaml` does **not** declare:

- state (derived from filesystem `generates` glob + TypeDB pheromone)
- dependencies as a rigid gate (they're pheromone seeds, not locks — per signals.md "dependencies are enablers, not gates")
- schedules, crons, or phases

---

## Proposed Schema

```yaml
name: envelopes

# Always-on context — loaded into every agent call.
# Keep small. < 50KB total (OPSX rule-of-thumb).
context:
  - CLAUDE.md
  - docs/DSL.md
  - docs/signals.md
  - docs/dictionary.md

# Agents as markdown — parse() + syncAgent() in src/engine/agent-md.ts
units:
  - spec: agents/spec.md           # {id: spec, prompt: agents/spec.md}
  - build: agents/build.md
  - verify: agents/verify.md
  - reviewer: agents/reviewer.md

# Tasks = signal receivers + artifact evidence.
# The substrate walks them via select() weighted by pheromone.
tasks:
  - id: proposal
    receiver: world:design         # discovery — substrate picks a unit with "design" tag
    generates: specs/**/*.md        # presence = done
    context:                        # loaded in addition to global context
      - docs/primitives.md
      - docs/DSL.md

  - id: implementation
    receiver: world:code+P0
    requires: [proposal]            # seeds pheromone from proposal → implementation
    generates: src/**/*.ts
    context: [docs/routing.md]

  - id: verification
    receiver: verify:run            # known — direct address, committed contract
    requires: [implementation]
    generates: tests/**/*.test.ts
    hook: npm run test              # shell, runs after signal

  - id: review
    receiver: world:review+security
    requires: [verification]
    generates: reviews/*.md

# Hooks — fire on substrate events.
# Map to settings.json hook system.
hooks:
  on_mark: ./scripts/substrate/on-mark.sh    # edge strengthened
  on_warn: ./scripts/substrate/on-warn.sh    # edge resisted
  on_signal: ./scripts/substrate/on-signal.sh # signal delivered
  post_edit: npx tsc --noEmit                 # type-check after edits

# Loop cadences — map to L1-L7.
loops:
  tick: 60          # L1/L2 — seconds
  fade: 300         # L3 — every 5 min
  evolve: 600       # L5 — prompt rewrite check
  know: 3600        # L6 — promote highways to knowledge
  frontier: 3600    # L7 — detect unexplored tags
```

---

## Context Loading Strategy

Three layers, in order. Later overrides rarely; mostly they stack.

```
┌────────────────┬──────────────────────┬──────────────────────────┐
│ Layer          │ When                 │ Source                   │
├────────────────┼──────────────────────┼──────────────────────────┤
│ global         │ every signal         │ loop.yaml `context:`     │
│ task-local     │ task receiver fires  │ task `context:` array    │
│ upstream data  │ via signal.data      │ `requires[].output`      │
└────────────────┴──────────────────────┴──────────────────────────┘
```

What to load globally: `CLAUDE.md`, `docs/DSL.md`, `docs/signals.md`, `docs/dictionary.md`. These are vocabulary. Every agent needs them.

What to load per-task: the schemas relevant to the *skill*. `world:design` loads `docs/primitives.md`. `world:code` loads `docs/routing.md` + `src/engine/world.ts`. `world:review` loads `.claude/rules/*.md`.

What **not** to load: `src/engine/*.ts` source (too big, derive from docs). Old PRs. Test output. Let agents grep on demand.

---

## The Workflow Cycle

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. boot()                                                       │
│     load loop.yaml → syncWorld() → hydrate TypeDB → start tick   │
│                                                                  │
│  2. tick (every 60s)                                             │
│     for each task in loop.yaml:                                  │
│       requires satisfied? (generates glob exists)                │
│         yes → signal({ receiver: task.receiver, data })          │
│                 → select() picks unit by pheromone               │
│                 → unit executes (LLM call with context)          │
│                 → result?  mark(edge)                            │
│                 → timeout? neutral                               │
│                 → failed?  warn(edge)                            │
│       no  → enqueue, re-check next tick                          │
│                                                                  │
│  3. fade (every 5 min)                                           │
│     all edges *= (1 - 0.05); resistance fades 2x faster          │
│                                                                  │
│  4. evolve (every 10 min)                                        │
│     any unit with success-rate < 0.5 → rewrite prompt            │
│                                                                  │
│  5. know (hourly)                                                │
│     promote highways to TypeDB knowledge (permanent)             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

No new machinery. Every bullet already exists in `src/engine/loop.ts`. `loop.yaml` just parameterizes it.

---

## Agents, Hooks, Slash Commands

Three layers of the dev process. Each has a job:

| Layer | Role | Where it lives |
|-------|------|----------------|
| **Agents** (md files) | Do the work. Probabilistic. LLM-backed. | `agents/*.md` → parsed by `agent-md.ts` |
| **Hooks** (shell) | Observe + side-effect. Deterministic. No LLM. | `scripts/substrate/*.sh`, wired via `settings.json` |
| **Slash commands** | Human entry points. Invoke the loop, inspect state. | `.claude/commands/*.md` |

The pattern: `/work` invokes the loop. The loop fires signals. Agents answer. Hooks fire on mark/warn and run `tsc`, `test`, `deploy`. Slash commands like `/highways`, `/tasks`, `/done` give the human windows into substrate state.

Hooks replace cron. Hooks replace orchestration. Hooks are the deterministic sandwich around every LLM call.

---

## Development Process (Per Session)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  HUMAN                SUBSTRATE                  AGENTS          │
│  ─────                ─────────                  ──────          │
│                                                                  │
│  /work       ──────►  pick task with         ──► LLM call        │
│                       highest (strength -                        │
│                       resistance) × priority                     │
│                                                ▼                  │
│                       mark(edge)            result                │
│                       fade(others)              │                 │
│                       ◄──────────────────────────                │
│                                                                  │
│  /highways   ──────►  w.open(10)                                 │
│  /tasks      ──────►  w.recall('pending')                        │
│  /done SEC-1 ──────►  mark(edge, 5)                              │
│  /grow       ──────►  full tick loop, parallel                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

The human is a **gardener**, not a driver. They plant intent in `loop.yaml`, watch highways emerge, prune toxic paths with `warn()`, promote stable ones with `know()`.

---

## Open Questions

1. **Claim semantics** — do parallel agents claim via TypeDB insert (atomic), filesystem lockfile, or let the substrate's `fade()` handle duplicate-work by naturally weakening redundant paths? **Recommendation:** no claims. Let the substrate route. Duplicate work is rare because `select()` is weighted; truly duplicated work just warns the losing path.

2. **Glob-as-state** — is `generates: src/**/*.ts` enough to mark "done", or do we need a content hash? **Recommendation:** start with glob presence, add hash in v2 if flapping becomes a problem.

3. **Known vs emergent default** — should new tasks default to `world:tag` (discovery) or direct `unit:skill`? **Recommendation:** `world:tag` for the first three signals of a new task, then auto-promote to direct if pheromone concentrates on one unit.

4. **Context budget** — OPSX caps at 50KB. Our vocabulary docs alone exceed that. **Recommendation:** ship only `dictionary.md` + `DSL.md` as global; everything else task-local.

5. **Failure → warn weight** — should hook-reported failures (`tsc`, `test`) warn at the same weight as silent dissolution? **Recommendation:** explicit hook failures are *verdicts* (warn 1.0). Dissolved signals are *mild* (0.5). This matches signals.md: "resistance is earned by real failure."

---

## Implementation Steps

1. **Draft `loop.yaml`** at repo root. Ship the schema above as the starter. Single source of truth.
2. **Write `src/engine/loop-yaml.ts`** — parser + validator. Reuses `parse()` from `agent-md.ts` for unit specs. ~100 lines.
3. **Wire into `boot.ts`** — `boot()` reads `loop.yaml`, calls `syncWorld()`, starts tick. Replaces current ad-hoc world construction.
4. **Move existing slash commands** to read their task list from `loop.yaml` instead of `TODO-*.md`. `/tasks`, `/next`, `/done` all read one file.
5. **Hooks** — wire `scripts/substrate/on-mark.sh` etc. into `settings.json`. They log, run `tsc`, optionally deploy.
6. **Dogfood** — use `/work` on the envelope system itself. Watch highways form in `/world` page. Prune toxic paths. Iterate.

---

## What Makes This ONE-Shaped

- **Two fields.** Every task still becomes `{ receiver, data }` at runtime.
- **Zero returns.** Missing unit? Task dissolves. Missing file? Task waits. No throws.
- **Pheromone over state.** Success/failure is weight on edges, not rows in a state table.
- **Lazy.** No eager classification. First cold-miss triggers one LLM call. After that, pheromone is the cache.
- **Additive.** Existing agents, hooks, slash commands all keep working. `loop.yaml` is opt-in.

One file seeds the world. The world grows the workflow.

---

## See Also

- `docs/DSL.md` — the six verbs, `{ receiver, data }`, seven loops
- `docs/signals.md` — address modes, resolution flow, cold-miss path
- `src/engine/agent-md.ts` — how markdown agents become TypeDB units
- `src/engine/loop.ts` — the tick loop (where `loop.yaml` gets walked)
- `CLAUDE.md` — project vocabulary and architectural invariants
- OPSX: https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md — the workflow spec we're compressing

---

*Seed the intent. Let the substrate walk it. Keep `loop.yaml` shorter than the docs that explain it.*
