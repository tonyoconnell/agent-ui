# Task Management

The heartbeat of ONE. Tasks flow through pheromone trails, driven by the growth loop, visible on the TaskBoard. No task is assigned. Every task is discovered.

---

## The Biology

> *"The task an ant performs depends not on any property of the individual, but on what it has experienced recently."*
> -- Deborah Gordon, *Ants at Work*

Ants don't get assigned tasks. They sense what's available, follow pheromone trails to what's proven, avoid alarm signals from what's failed, and scout what's unexplored. The colony allocates work without a manager.

ONE does the same thing. TypeDB is the pheromone substrate. The growth loop is the colony tick. The TaskBoard is the observation window.

---

## Architecture

```
                         TypeDB (the brain)
                    ┌──────────┴──────────┐
                    │                     │
              task entities          trail relations
              (what exists)       (what the colony knows)
                    │                     │
         ┌─────────┼─────────┐           │
         │         │         │           │
       ready   attractive  repelled    pheromone
       (no     (trail      (alarm     (trail: success
       blockers) >= 50)     > trail)   alarm: failure)
         │         │         │           │
         └─────────┼─────────┘           │
                   │                     │
              Growth Loop ───────────────┘
              (SENSE → SELECT → EXECUTE → OUTCOME → UPDATE)
                   │
              TaskBoard (what you see)
```

---

## The Data Model

### Task Entity

```
task
  tid          "W-3"              unique key
  name         "TypeDB schema"    human-readable
  description  "..."              detail
  task-type    "work"             work | review | test | deploy
  status       "todo"             todo | in_progress | complete | blocked | failed
  priority     "P1"               P0 (critical) → P3 (low)
  phase        "wire"             wire | tasks | onboard | commerce | intelligence | scale
  importance   5                  0-10, used for weighted selection
  price        0                  SUI cost to execute
  attractive   true               INFERRED: ready + trail >= 50
  repelled     false              INFERRED: alarm >= 30 AND alarm > trail
```

### Trail Relation (task → task)

Pheromone lives on EDGES, not nodes. When completing task A leads to successfully completing task B, the trail A→B gets reinforced.

```
trail (source-task: A, destination-task: B)
  trail-pheromone   65.0        0-100, success signal (higher = more proven)
  alarm-pheromone   5.0         0-100, failure signal (higher = more dangerous)
  completions       8           times this sequence succeeded
  failures          1           times this sequence failed
  revenue           0.0         economic value of this sequence
  fade-rate         0.05        decay speed (lower = more permanent)
  trail-status      "fresh"     INFERRED: proven | fresh | fading | dead
```

### Dependency Relation

```
dependency (dependent: B, blocker: A)
```

Task B can't start until task A is complete. The negation pattern: ready = todo AND NOT (has incomplete blocker).

### Trail Status Classification

```
trail_status(pheromone, completions, failures):
  pheromone >= 70 AND completions >= 10 AND failures < completions  → "proven"
  pheromone >= 10 AND completions < 10                              → "fresh"
  pheromone > 0 AND pheromone < 10                                  → "fading"
  otherwise                                                         → "dead"
```

---

## The Four Task Categories

Every task falls into exactly one category at any moment. The category changes as pheromone accumulates and decays.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ATTRACTIVE          READY            EXPLORATORY              │
│   trail >= 50         no blockers      no trail exists          │
│   colony says YES     colony says OK   colony says UNKNOWN      │
│                                                                 │
│   ┌───────────┐      ┌───────────┐    ┌───────────┐           │
│   │ Follow me │      │ Available │    │ Scout me  │           │
│   │ (exploit) │      │ (neutral) │    │ (explore) │           │
│   └───────────┘      └───────────┘    └───────────┘           │
│                                                                 │
│                       REPELLED                                  │
│                       alarm >= 30 AND alarm > trail             │
│                       colony says NO                            │
│                                                                 │
│                      ┌───────────┐                             │
│                      │ Avoid me  │                             │
│                      │ (retreat) │                             │
│                      └───────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Routes

| Route | Method | Returns | TypeDB Function |
|-------|--------|---------|-----------------|
| `/api/tasks` | GET | All tasks (filterable by `?phase=` `?status=`) | match query |
| `/api/tasks` | POST | Create task (with optional `blockedBy[]`) | insert + dependency |
| `/api/tasks/ready` | GET | Unblocked todos (negation pattern) | `ready_tasks()` |
| `/api/tasks/attractive` | GET | Ready + strong trail | `is_attractive()` |
| `/api/tasks/repelled` | GET | High alarm tasks | `is_repelled()` |
| `/api/tasks/exploratory` | GET | Ready + no trail exists | `exploratory_tasks()` |
| `/api/tasks/:id/complete` | POST | Complete or fail a task | trail pheromone update |

---

## The Growth Loop

The growth loop (`src/engine/loop.ts`) is the colony's heartbeat. One tick per minute, driven by the Dashboard poll to `/api/tick`.

### The Eight Phases

```
SENSE → SELECT → EXECUTE → OUTCOME → UPDATE → DECAY → EVOLVE → CRYSTALLIZE
```

**Every tick:**

| Phase | What happens | Task system interaction |
|-------|-------------|----------------------|
| SENSE | Query TypeDB for ready, attractive, exploratory tasks | Reads task categories via same TQL as API routes |
| SELECT | Weighted random pick (attractive by trail-pheromone, exploratory random, ready uniform) | Uses `trail-pheromone` as selection weight |
| EXECUTE | Set task `in_progress`, route through orchestrator | Writes `status = "in_progress"` to TypeDB |
| OUTCOME | Check success/failure from agent execution | -- |
| UPDATE | Complete task via `/api/tasks/:id/complete` + mark substrate path | Writes `status = "complete"` or `"failed"`, updates trail pheromone |

**Periodic phases:**

| Phase | Interval | What happens |
|-------|----------|-------------|
| DECAY | 5 min | Asymmetric fade: trail 5%, alarm 20% (failures forgive faster) |
| EVOLVE | 10 min | Query struggling agents (`success-rate < 0.50`), LLM rewrites their prompt, `generation++` |
| CRYSTALLIZE | 1 hour | Proven trails (`pheromone >= 70, completions >= 10`) get permanent fade-rate (0.01) |

### Selection Priority

```
1. ATTRACTIVE tasks (trail >= 50) → weighted by trail-pheromone
   Task with pheromone 60 is 6x more likely to be picked than pheromone 10

2. EXPLORATORY tasks (no trail) → uniform random
   Someone needs to try these first. Scouts venture here.

3. READY tasks (just unblocked) → uniform random
   Fallback. All available work is equal if no pheromone data exists.

REPELLED tasks are NEVER selected by the loop.
They remain visible on the TaskBoard but the colony avoids them
until alarm decays below trail (failures are forgiven over time).
```

### Sequence Learning

The loop tracks `previousTask`. When task B completes after task A:

```
Success: trail(A→B).trail-pheromone += 5.0, completions += 1
         path(A→B).strength += 5 (substrate routing)

Failure: trail(A→B).alarm-pheromone += 8.0, failures += 1
         path(A→B).alarm += 8 (substrate routing)
         previousTask resets to null (chain breaks)
```

The colony learns SEQUENCES: "After completing schema design, implementing the API works well." Not just "the API is a good task" — but "the API is good AFTER the schema."

---

## Task Lifecycle

```
                    ┌──────── dependency ────────┐
                    │                            │
                    ▼                            │
┌──────┐     ┌──────────┐     ┌─────────────┐  │  ┌──────────┐
│ todo │────→│in_progress│────→│  complete    │──┘  │  failed  │
└──────┘     └──────────┘     └─────────────┘      └──────────┘
   │              │                  │                    │
   │              │                  │                    │
   │         loop picks it      trail reinforced     trail alarmed
   │         status changes     +5 pheromone         +8 alarm
   │                            +1 completions       +1 failures
   │                            unblocks dependents  chain breaks
   │
   ├── attractive (trail >= 50) → loop favors it
   ├── exploratory (no trail) → loop scouts it
   ├── ready (unblocked) → loop may pick it
   └── repelled (alarm > trail) → loop avoids it
```

### What Unblocks a Task

A task becomes ready when ALL its blockers are complete:

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
```

Double negation: NOT (blocker that is NOT complete) = all blockers are complete.

### What Makes a Task Attractive

Ready + strong inbound trail pheromone:

```typeql
fun is_attractive($t: task) -> boolean:
    match
        $t has status "todo";
        not { (dependent: $t, blocker: $b) isa dependency;
              $b has status $bs; not { $bs == "complete"; }; };
        $trail (destination-task: $t) isa trail,
            has trail-pheromone $tp;
        $tp >= 50.0;
    return true;
```

### What Makes a Task Repelled

High alarm that dominates the trail signal:

```typeql
fun is_repelled($t: task) -> boolean:
    match
        $t has status "todo";
        $trail (destination-task: $t) isa trail,
            has alarm-pheromone $ap,
            has trail-pheromone $tp;
        $ap >= 30.0;
        $ap > $tp;
    return true;
```

---

## Pheromone Dynamics

### Reinforcement (+5 trail on success)

Every successful task completion strengthens the inbound trail. After 10 successes with no failures, the trail reaches 50 (attractive threshold). After 14 successes, it hits 70 (proven threshold).

```
Completion 1:   trail = 5.0    (fresh)
Completion 5:   trail = 25.0   (fresh, decayed by ~5%)
Completion 10:  trail = 45.0   (approaching attractive)
Completion 14:  trail = 63.0   (attractive, approaching proven)
Completion 20:  trail = 78.0   (proven, crystallization candidate)
```

*(Values approximate -- decay reduces between completions)*

### Alarm (+8 alarm on failure)

Failures deposit alarm pheromone, which is stronger per-event than trail reinforcement. Two consecutive failures can repel a task:

```
Failure 1: alarm = 8.0     (below repelled threshold)
Failure 2: alarm = 16.0    (still below, but alarm decays slower than it looks)
Failure 4: alarm = 32.0    (repelled if trail < 32)
```

### Asymmetric Decay

```
Every 5 minutes:
  trail-pheromone *= 0.95    (lose 5% — remember successes)
  alarm-pheromone *= 0.80    (lose 20% — forgive failures)
```

Why asymmetric? The colony forgets failures faster than successes. A task that failed last week might succeed now — conditions change. But a task that succeeded consistently should stay attractive.

### Crystallization

Every hour, the loop checks for superhighways:

```
trail-pheromone >= 70  AND  completions >= 10  →  fade-rate = 0.01
```

Crystallized trails are near-permanent. They decay at 1% instead of 5% — the colony's long-term memory. These are proven sequences: "After A, do B. This always works."

---

## The TaskBoard

`src/components/TaskBoard.tsx` renders the live task state.

### What It Shows

| Section | Data | Source |
|---------|------|--------|
| Phase Timeline | 7 phases with completion bars | `/api/tasks` grouped by phase |
| Active Spotlight | Current task with blocker/unblock chains | Selected task + dependencies |
| Pheromone Bars | Trail (green) and alarm (red) per task | `trail-pheromone`, `alarm-pheromone` |
| Trail Status | Proven / fresh / fading / dead | `trail_status()` inference |
| Flow Grid | 3-column Kanban: Planned / Active / Complete | `status` grouping |
| Stats Bar | Total, complete, active, ready, highways | Aggregated counts |

### Pheromone Visualization

```
Trail (success signal):     [████████████░░░░░░░░]  62.0
Alarm (failure signal):     [████░░░░░░░░░░░░░░░░]  12.0
                            ↑ glow effect when > 50
```

Proven trails get a bright highlight. Fading trails dim. Dead trails disappear. Repelled tasks show dominant red alarm bars.

---

## Creating Tasks

### Via API

```bash
curl -X POST /api/tasks -H 'Content-Type: application/json' -d '{
  "tid": "W-3",
  "name": "TypeDB schema design",
  "taskType": "work",
  "priority": "P1",
  "phase": "wire",
  "blockedBy": ["W-1", "W-2"]
}'
```

### Via Seed

`POST /api/seed` bootstraps the world with 10 sample tasks, 3 agent capabilities, and initial paths.

### Via Import Roadmap

`POST /api/tasks/import-roadmap` creates 48 tasks across 7 phases with dependency chains and initial trails. Completed tasks get trail-pheromone 70 (proven). Incomplete tasks start at 0.

---

## How the Loop Drives Tasks

### Minute-by-minute

```
00:00  Dashboard polls /api/tick
       SENSE: 12 ready, 3 attractive, 5 exploratory
       SELECT: picks "W-7: API endpoints" (attractive, trail=62)
       EXECUTE: sets status="in_progress", routes to agent
       OUTCOME: agent succeeds
       UPDATE: trail(W-6→W-7) += 5, status="complete", unblocks W-8

00:01  Dashboard polls /api/tick (interval gate: skip, < 60s)

01:00  Dashboard polls /api/tick
       SENSE: 13 ready (W-8 unblocked), 3 attractive, 4 exploratory
       SELECT: picks "W-8: Integration tests" (exploratory, no trail)
       EXECUTE: sets status="in_progress", routes to agent
       OUTCOME: agent fails
       UPDATE: trail(W-7→W-8).alarm += 8, status="failed", chain breaks

02:00  Dashboard polls /api/tick
       SENSE: 12 ready, 3 attractive, 5 exploratory (W-8 now repelled)
       SELECT: picks different task (W-8 avoided due to alarm)
       ...

05:00  DECAY runs: all trail *= 0.95, all alarm *= 0.80
       W-8 alarm: 8.0 → 6.4 (approaching forgiveness)
```

### Over hours

```
Hour 1:   trails forming. Fresh paths everywhere.
Hour 3:   some trails hit 50 (attractive). Colony follows them.
Hour 6:   first trails hit 70 (proven). Crystallization begins.
Hour 12:  superhighways emerge. The colony knows the best sequences.
Hour 24:  unused trails fade to dead. Only proven paths survive.
          Knowledge has crystallized. The system remembers what works.
```

### Over days

```
Day 1:    Bootstrap. All tasks exploratory. Random selection.
Day 3:    Patterns emerge. Attractive tasks dominate selection.
Day 7:    Proven trails crystallized. Struggling agents evolved.
Day 14:   The colony runs itself. Highways carry most traffic.
          New tasks enter as exploratory → get scouted → trails form.
          Failed sequences get alarmed → avoided → alarm decays → retried.
```

---

## The Seven Loops

Tasks sit at the center of the seven nested feedback loops:

```
L1  SIGNAL     per message     task receives signal, agent executes
L2  TRAIL      per completion  trail pheromone updated (success/failure)
L3  FADE       every 5 min     trails decay (asymmetric)
L4  ECONOMIC   per payment     revenue reinforces paths
L5  EVOLUTION  every 10 min    struggling agents rewrite their prompts
L6  KNOWLEDGE  per crystallize proven trails become permanent
L7  FRONTIER   emergent        exploratory task clusters spawn objectives
```

Tasks are the interface between the fast loops (signals, trails) and the slow loops (evolution, knowledge). Every signal produces a task outcome. Every task outcome updates a trail. Every trail feeds the next signal's routing decision.

**Tasks are the training data. Trails are the learned model. The growth loop is the training step.**

---

## Putting It All Together

The task management system is not a project tracker. It's the nervous system of a learning organism:

1. **Tasks enter** as `todo` with dependencies
2. **TypeDB classifies** them as ready/attractive/repelled/exploratory
3. **The growth loop** picks the best task (weighted by trail pheromone)
4. **An agent executes** the task (routed by substrate pheromone)
5. **The outcome updates** trail pheromone (success: +5 trail, failure: +8 alarm)
6. **Decay runs** every 5 minutes (trails fade, alarms fade faster)
7. **Crystallization** promotes proven sequences to permanent knowledge
8. **Evolution** rewrites struggling agents every 10 minutes
9. **The next tick** sees a different landscape: new tasks unblocked, trails shifted, knowledge accumulated

The loop runs forever. The colony learns. Tasks that work get reinforced. Tasks that fail get avoided then forgiven. Sequences emerge. Highways form. The system gets smarter without anyone telling it what to do.

```
signal IN → task → agent → outcome → trail → decay → crystallize → signal IN
                                                                       ↑
                                                                   the loop
```

---

## Files

| File | Purpose |
|------|---------|
| `src/schema/one.tql` | TypeDB schema: task, trail, dependency, classification functions |
| `src/engine/loop.ts` | Growth loop: 8-phase tick (SENSE through CRYSTALLIZE) |
| `src/engine/substrate.ts` | Colony primitives: mark, warn, fade, follow, select |
| `src/engine/one.ts` | World: crystallize(), recall(), proven() |
| `src/engine/asi.ts` | Orchestrator: routes tasks to agents |
| `src/pages/api/tick.ts` | Growth loop API endpoint (polled by Dashboard) |
| `src/pages/api/tasks/` | Task CRUD + category queries + completion |
| `src/pages/api/decay-auto.ts` | Interval-gated asymmetric decay |
| `src/components/TaskBoard.tsx` | Task visualization with pheromone bars |
| `src/components/Dashboard.tsx` | System monitor, polls /api/tick |
| `docs/lessons/04-task-allocation.md` | TypeDB lesson: negation + pheromone selection |
| `docs/loops.md` | The seven nested feedback loops |

---

## See Also

- [loops.md](one/loops.md) -- The seven nested feedback loops
- [substrate-learning.md](substrate-learning.md) -- How routing IS learning
- [lessons/04-task-allocation.md](04-task-allocation.md) -- TypeDB patterns for task allocation
- [emergence.md](emergence.md) -- How intelligence emerges from simple rules
- [signal.md](signal.md) -- The universal primitive that drives everything
