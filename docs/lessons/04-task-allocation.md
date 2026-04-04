# Lesson 4: Task Allocation

## Negation and Pheromone-Weighted Selection

> **Biological Parallel:** Task Allocation Without Instructions
>
> Gordon's central discovery: ants allocate themselves to tasks using only local information. No ant gives instructions. An ant encounters the colony's state and selects work based on what's AVAILABLE — tasks with no blockers.

| | |
|---|---|
| **Difficulty** | Intermediate |
| **Prerequisites** | [Lesson 3: Hypothesis Lifecycle](./03-hypothesis.md) |
| **Next** | [Lesson 5: Contribution Tracking](./05-contribution.md) |
| **Standalone TQL** | `standalone/task-management.tql` |

---

## What You Will Learn

Two critical patterns:

1. **NEGATION** — Finding entities that DON'T have a relationship ("ready" = no incomplete blockers)
2. **PHEROMONE-WEIGHTED SELECTION** — Tasks aren't just "available", they're "attractive" or "repelled" based on the colony's memory

---

## The Biology

From Chapter 2 of *Ants at Work*:

> *"The task an ant is performing depends not on any property of the individual ant, but on what the ant has experienced recently."*

Ants don't get assigned tasks. They:
1. Sense what tasks are being done
2. Sense what ISN'T being done
3. Select available work
4. Follow pheromone trails to the strongest signals

In TypeDB: `ready_tasks()` finds work with status "todo" AND **no incomplete blockers** — detecting the ABSENCE of blocking conditions.

---

## Use Cases

- Project management systems
- Issue trackers
- Sprint planning tools
- Workflow engines
- CI/CD pipeline stages
- **Ant colony task allocation** (this IS the pattern)

---

## The Schema

```typeql
define

entity task,
    owns task-id @key,
    owns title,
    owns description,
    owns status,                # "todo", "in_progress", "complete", "blocked"
    owns priority,              # "P0", "P1", "P2", "P3"
    owns attractive,            # INFERRED: ready + strong pheromone trail
    owns repelled,              # INFERRED: high alarm pheromone
    plays dependency:dependent,
    plays dependency:blocker,
    plays pheromone-trail:source-task,
    plays pheromone-trail:destination-task;

# Task A blocks Task B
relation dependency,
    relates dependent,
    relates blocker;

# Pheromone trails between tasks
relation pheromone-trail,
    relates source-task,
    relates destination-task,
    owns trail-pheromone,       # 0.0 - 100.0 (positive reinforcement)
    owns alarm-pheromone,       # 0.0 - 100.0 (negative reinforcement)
    owns completions,           # times this sequence succeeded
    owns failures,              # times this sequence failed
    owns trail-status;          # "fresh", "proven", "fading", "dead" (INFERRED)

attribute trail-pheromone, value double;
attribute alarm-pheromone, value double;
attribute completions, value integer;
attribute failures, value integer;
attribute trail-status, value string;
attribute attractive, value boolean;
attribute repelled, value boolean;
```

---

## The Negation Pattern: Ready Tasks

Find tasks with status "todo" that have **NO** incomplete blockers:

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

**How it works:**
- Outer `not { }` — "there is no..."
- Inner pattern — "...dependency where the blocker is incomplete"
- Double negation: NOT (blocker that is NOT complete) = all blockers complete

---

## Pheromone-Weighted Selection

Pheromone lives on EDGES, not nodes. When completing task A leads to successfully completing task B, the trail from A→B gets reinforced.

### Rule: Trail Status Classification

```typeql
# Proven trail: high pheromone, many completions
rule proven-trail:
    when {
        $trail isa pheromone-trail,
            has trail-pheromone $tp,
            has completions $c,
            has failures $f;
        $tp >= 70.0;
        $c >= 10;
        $f < $c;
    } then {
        $trail has trail-status "proven";
    };

# Fading trail: needs reinforcement or dies
rule fading-trail:
    when {
        $trail isa pheromone-trail,
            has trail-pheromone $tp;
        $tp > 0.0;
        $tp < 10.0;
    } then {
        $trail has trail-status "fading";
    };
```

---

### Rule: Attractive Tasks

A task is ATTRACTIVE when ready + strong pheromone trail leading to it:

```typeql
rule attractive-task:
    when {
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $blocker) isa dependency;
            $blocker isa task, has status $bs;
            not { $bs == "complete"; };
        };
        $trail (destination-task: $t) isa pheromone-trail,
            has trail-pheromone $tp;
        $tp >= 50.0;
    } then {
        $t has attractive true;
    };
```

---

### Rule: Repelled Tasks

A task is REPELLED when alarm pheromone dominates (previous failures):

```typeql
rule repelled-task:
    when {
        $t isa task, has status "todo";
        $trail (destination-task: $t) isa pheromone-trail,
            has alarm-pheromone $ap,
            has trail-pheromone $tp;
        $ap >= 30.0;
        $ap > $tp;
    } then {
        $t has repelled true;
    };
```

---

## Three Selection Modes

```typeql
# Follow the strong trail (exploit)
fun attractive_tasks() -> { task }:
    match $t isa task, has attractive true;
    return { $t };

# Avoid the alarm (learn from failure)
fun repelled_tasks() -> { task }:
    match $t isa task, has repelled true;
    return { $t };

# No trail exists — needs a scout (explore)
fun exploratory_tasks() -> { task }:
    match
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $blocker) isa dependency;
            $blocker isa task, has status $bs;
            not { $bs == "complete"; };
        };
        not {
            $trail (destination-task: $t) isa pheromone-trail;
        };
    return { $t };
```

---

## Pheromone Operations

Run externally (not inference):

```typeql
# Reinforce trail after success
match
    $from isa task, has task-id "TASK-A";
    $to isa task, has task-id "TASK-B";
    $trail (source-task: $from, destination-task: $to) isa pheromone-trail,
        has trail-pheromone $old_tp,
        has completions $old_c;
    let $new_tp = $old_tp + 5.0;
    let $new_c = $old_c + 1;
delete $old_tp of $trail; delete $old_c of $trail;
insert $trail has trail-pheromone $new_tp, has completions $new_c;

# Decay (forgetting is intelligence)
match
    $trail isa pheromone-trail,
        has trail-pheromone $old_tp,
        has alarm-pheromone $old_ap;
    $old_tp > 0.0;
    let $new_tp = $old_tp * 0.95;      # trail decays 5% per cycle
    let $new_ap = $old_ap * 0.80;      # alarm decays 20% (faster)
delete $old_tp of $trail; delete $old_ap of $trail;
insert $trail has trail-pheromone $new_tp, has alarm-pheromone $new_ap;
```

**Why asymmetric decay?** Alarm pheromone decays FASTER. The colony forgets failures sooner than successes — encouraging retry after conditions change.

---

## Biological Mapping

| Concept | Ant Colony | TypeDB |
|---------|-----------|--------|
| **Task Available** | No ant doing it | status = "todo", no blockers |
| **Pheromone Trail** | Chemical deposit | trail-pheromone on relation |
| **Following Trail** | Sensing and moving | Query with threshold filter |
| **Trail Evaporation** | Decay over time | Decay operation |
| **Superhighway** | Heavily reinforced trail | trail-status = "proven" |
| **Alarm Signal** | Danger pheromone | alarm-pheromone |

---

## The Key Insight

The colony doesn't just ask "what's available?" — it asks "what's available AND what does our memory say about it?"

- **attractive_tasks()** = "follow the strong trail" (exploit)
- **repelled_tasks()** = "avoid the alarm" (learn from failure)
- **exploratory_tasks()** = "no trail exists — scout" (explore)

---

## Next Step

In [Lesson 5: Contribution Tracking](./05-contribution.md), we learn parameterized aggregate functions — measuring how much each contributor has given and computing totals dynamically.

---

## Complete TQL

For the complete standalone TypeQL file, see [`standalone/task-management.tql`](../standalone/task-management.tql).
