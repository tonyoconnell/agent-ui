# LIFECYCLE.md - State Machines via Inference

All lifecycles in the colony are state machines where **transitions
happen via inference rules**. No manual state updates. The database
infers the next state when conditions are met.

---

## 1. Agent Lifecycle

Agents are born, work, reproduce (if elite), and die.

```
          ┌──────────────────────────────────────────┐
          │                                          │
          ▼                                          │
       SPAWNED                                       │
          │                                          │
          │  [initialize]                            │
          │  energy := max, genome set               │
          ▼                                          │
        IDLE ◄────────────────────────┐              │
          │                           │              │
          │  ready_tasks() not empty  │              │
          │  AND energy > 0           │              │
          ▼                           │              │
      WORKING ────────────────────────┘              │
          │         task complete                    │
          │         OR energy depleted               │
          │                                          │
          │  [elite_agents]                          │
          │  success-rate >= 0.75                    │
          │  activity-score >= 70                    │
          │  energy > reproduction_cost              │
          ▼                                          │
     REPRODUCE ──────────────────────────────────────┘
          │         spawn offspring
          │         energy -= cost
          │
          │  [energy_depleted]
          │  energy = 0
          │  AND reliable != high
          ▼
        DIE
```

### Inference Rules

```typeql
# Promote to working when tasks available
rule agent-start-working:
    when {
        $a isa agent, has status "idle", has energy $e;
        $e > 0;
        let $t in ready_tasks();
    } then {
        $a has status "working";
    };

# Elite agents can reproduce
rule agent-can-reproduce:
    when {
        $a isa agent,
            has success-rate $sr,
            has activity-score $as,
            has energy $e;
        $sr >= 0.75;
        $as >= 70.0;
        $e > 50;  # reproduction_cost
    } then {
        $a has reproduction-ready true;
    };

# Agent dies when energy depleted (unless reliable)
rule agent-death:
    when {
        $a isa agent, has energy 0;
        not { $a has reliable "high"; };
    } then {
        $a has status "dead";
    };
```

---

## 2. Task Lifecycle

Tasks flow from creation to completion, gated by dependencies.

```
       CREATED
          │
          │  [insert task]
          │  initial status
          ▼
        TODO ◄────────────────────────┐
          │                           │
          │  [ready_tasks]            │
          │  NOT exists incomplete    │
          │  blocker                  │
          ▼                           │
    IN_PROGRESS ──────────────────────┤
          │                           │
          │  [task_complete]          │  [task_blocked]
          │  progress >= 1.0          │  new blocker added
          │                           │
          ├───────────────────────────┘
          │
          │  [task_complete]
          │  progress >= 1.0
          │
          ├─────────────► COMPLETE
          │
          │  [task_failed]
          │  retries = 0
          │  AND error detected
          │
          └─────────────► FAILED
```

### Inference Rules

```typeql
# Task is ready when no incomplete blockers
fun ready_tasks() -> { task }:
    match
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $b) isa dependency;
            $b isa task, has status $bs;
            not { $bs == "complete"; };
        };
    return { $t };

# Complete task when progress reaches 100%
rule task-complete:
    when {
        $t isa task,
            has status "in_progress",
            has progress $p;
        $p >= 1.0;
    } then {
        $t has status "complete";
    };

# Attractive tasks: ready + strong pheromone
rule attractive-task:
    when {
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $b) isa dependency;
            $b has status $bs;
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

## 3. Hypothesis Lifecycle

Hypotheses accumulate evidence until statistically significant.

```
       PENDING
          │
          │  [promote-to-testing]
          │  observations >= 10
          ▼
       TESTING
          │
          ├─────────────────────────────────────────┐
          │                                         │
          │  [confirm-hypothesis]                   │
          │  p-value <= 0.05                        │
          │  observations >= 100                    │
          ▼                                         │
     CONFIRMED                                      │
          │                                         │
          │  [action-ready]                         │
          │  confidence >= 0.95                     │
          ▼                                         │
    ACTION_READY                                    │
                                                    │
          ┌─────────────────────────────────────────┤
          │  [reject-hypothesis]                    │
          │  p-value > 0.20                         │
          │  observations >= 100                    │
          ▼
      REJECTED
```

### Inference Rules

```typeql
# Promote to testing after initial observations
rule promote-to-testing:
    when {
        $h isa hypothesis,
            has hypothesis-status "pending",
            has observations-count $obs;
        $obs >= 10;
    } then {
        $h has hypothesis-status "testing";
    };

# Confirm when statistically significant
rule confirm-hypothesis:
    when {
        $h isa hypothesis,
            has hypothesis-status "testing",
            has p-value $p,
            has observations-count $obs;
        $p <= 0.05;
        $obs >= 100;
    } then {
        $h has hypothesis-status "confirmed";
    };

# Reject when clearly insignificant
rule reject-hypothesis:
    when {
        $h isa hypothesis,
            has hypothesis-status "testing",
            has p-value $p,
            has observations-count $obs;
        $p > 0.20;
        $obs >= 100;
    } then {
        $h has hypothesis-status "rejected";
    };

# Ready for action when high confidence
rule action-ready:
    when {
        $h isa hypothesis,
            has hypothesis-status "confirmed",
            has confidence-level $c;
        $c >= 0.95;
    } then {
        $h has action-ready true;
    };
```

---

## 4. Pheromone Lifecycle

Trails strengthen with use, weaken without reinforcement.

```
        FRESH
          │
          │  [proven-trail]
          │  trail-pheromone >= 70
          │  completions >= 10
          │  failures < completions
          ▼
       PROVEN ◄───────────────────────┐
          │                           │
          │  [decay-cycle]            │  [reinforce-trail]
          │  pheromone *= 0.95        │  success → +5.0
          │  per tick                 │
          ▼                           │
       FADING ────────────────────────┘
          │
          │  [trail-death]
          │  pheromone < 1.0
          ▼
        DEAD
          │
          │  [garbage-collect]
          │  relation deleted
          ▼
       (removed)
```

### Inference Rules

```typeql
# Trail proven by repeated success
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

# Trail fading when pheromone low
rule fading-trail:
    when {
        $trail isa pheromone-trail,
            has trail-pheromone $tp;
        $tp > 0.0;
        $tp < 10.0;
    } then {
        $trail has trail-status "fading";
    };

# Trail dead when pheromone exhausted
rule dead-trail:
    when {
        $trail isa pheromone-trail,
            has trail-pheromone $tp;
        $tp < 1.0;
    } then {
        $trail has trail-status "dead";
    };
```

### External Operations (Not Inference)

```typeql
# Reinforce after success
match
    $trail isa pheromone-trail,
        has trail-pheromone $old_tp,
        has completions $old_c;
    let $new_tp = $old_tp + 5.0;
    let $new_c = $old_c + 1;
delete $old_tp of $trail; delete $old_c of $trail;
insert $trail has trail-pheromone $new_tp,
              has completions $new_c;

# Decay cycle (forgetting is intelligence)
match
    $trail isa pheromone-trail,
        has trail-pheromone $old_tp,
        has alarm-pheromone $old_ap;
    $old_tp > 0.0;
    let $new_tp = $old_tp * 0.95;   # 5% decay
    let $new_ap = $old_ap * 0.80;   # 20% decay
delete $old_tp of $trail; delete $old_ap of $trail;
insert $trail has trail-pheromone $new_tp,
              has alarm-pheromone $new_ap;
```

---

## 5. Frontier Lifecycle

Exploration frontiers are detected, explored, and exhausted.

```
      DETECTED
          │
          │  [frontier-insert]
          │  curiosity signal
          │  triggers detection
          ▼
    UNEXPLORED
          │
          │  [spawn-exploration-objective]
          │  expected-value >= 0.5
          │  NOT exists objective
          ▼
     EXPLORING
          │
          ├─────────────────────────────────────────┐
          │                                         │
          │  [frontier-exhausted]                   │
          │  discovery-probability < 0.1            │
          │  OR all objectives complete             │
          ▼                                         │
     EXHAUSTED                                      │
                                                    │
          ┌─────────────────────────────────────────┤
          │  [frontier-reopen]                      │
          │  new curiosity signal                   │
          │  expected-value recalculated            │
          ▼
    UNEXPLORED (cycle back)
```

### Inference Rules

```typeql
# Find promising unexplored frontiers
fun promising_frontiers() -> { exploration-frontier }:
    match
        $f isa exploration-frontier,
            has frontier-status "unexplored",
            has expected-value $ev;
        $ev >= 0.5;
    return { $f };

# Spawn exploration when frontier promising
rule spawn-exploration-objective:
    when {
        $f isa exploration-frontier,
            has frontier-status "unexplored",
            has expected-value $ev;
        $ev >= 0.5;
        not {
            $spawn (frontier: $f, objective: $o) isa spawns;
        };
    } then {
        $f has frontier-status "exploring";
    };

# Frontier exhausted when depleted
rule frontier-exhausted:
    when {
        $f isa exploration-frontier,
            has frontier-status "exploring",
            has discovery-probability $dp;
        $dp < 0.1;
    } then {
        $f has frontier-status "exhausted";
    };
```

---

## 6. Objective Lifecycle

Objectives are spawned from frontiers and drive agent work.

```
       SPAWNED
          │
          │  [spawn-exploration-objective]
          │  frontier EV >= 0.5
          │  priority set from EV
          ▼
       PENDING
          │
          │  [objective-activated]
          │  agent assigned
          │  progress = 0.0
          ▼
       ACTIVE ◄───────────────────────┐
          │                           │
          │  [objective-progress]     │
          │  work performed           │
          │  progress += delta        │
          │                           │
          ├───────────────────────────┘
          │
          │  [complete-objective]
          │  progress >= 1.0
          ▼
      COMPLETE
          │
          │  [record-outcome]
          │  success/failure/partial
          ▼
     (feeds back to frontier)
```

### Inference Rules

```typeql
# Objective activated when agent assigned
rule objective-activated:
    when {
        $o isa autonomous-objective,
            has objective-status "pending";
        $assign (objective: $o, agent: $a) isa assignment;
    } then {
        $o has objective-status "active";
    };

# Objective complete when progress full
rule complete-objective:
    when {
        $o isa autonomous-objective,
            has objective-status "active",
            has progress $p;
        $p >= 1.0;
    } then {
        $o has objective-status "complete";
    };

# High-priority objectives (from frontier EV)
fun urgent_objectives() -> { autonomous-objective }:
    match
        $o isa autonomous-objective,
            has objective-status "pending",
            has priority-score $ps;
        $ps >= 0.7;
    return { $o };
```

---

## Summary Table

| Lifecycle | States | Key Transitions |
|-----------|--------|-----------------|
| **Agent** | SPAWNED -> IDLE -> WORKING -> REPRODUCE -> DIE | energy, elite threshold |
| **Task** | CREATED -> TODO -> IN_PROGRESS -> COMPLETE/FAILED | blockers, progress |
| **Hypothesis** | PENDING -> TESTING -> CONFIRMED/REJECTED -> ACTION_READY | observations, p-value |
| **Pheromone** | FRESH -> PROVEN -> FADING -> DEAD | reinforcement, decay |
| **Frontier** | DETECTED -> UNEXPLORED -> EXPLORING -> EXHAUSTED | expected value, probability |
| **Objective** | SPAWNED -> PENDING -> ACTIVE -> COMPLETE | assignment, progress |

---

## The Pattern

All lifecycles follow the same pattern:

1. **States are attribute values** (status, trail-status, etc.)
2. **Transitions are inference rules** (when conditions match)
3. **No manual updates** - the database infers the next state
4. **Conditions are numeric thresholds** - tunable per domain

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   STATE MACHINE = ATTRIBUTES + INFERENCE RULES    │
│                                                    │
│   When data changes, rules fire, states change.   │
│   No code. No updates. Pure inference.            │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## See Also

- [Lesson 3: Hypothesis Lifecycle](03-hypothesis.md)
- [Lesson 4: Task Allocation](04-task-allocation.md)
- [Lesson 6: Emergence](06-emergence.md)
- [LOOPS.md](packages/typedb-inference-patterns/LOOPS.md) - Deterministic vs Probabilistic loops
