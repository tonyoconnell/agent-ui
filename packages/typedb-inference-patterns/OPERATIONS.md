# TypeDB Operations Reference

All WRITE operations for the typedb-inference-patterns system. TypeDB 3.0 syntax only.

**Quick Navigation:**
- [1. Agent Operations](#1-agent-operations)
- [2. Task Operations](#2-task-operations)
- [3. Pheromone Operations](#3-pheromone-operations)
- [4. Hypothesis Operations](#4-hypothesis-operations)
- [5. Frontier Operations](#5-frontier-operations)
- [6. Contribution Operations](#6-contribution-operations)

---

## 1. Agent Operations

### 1.1 INSERT Agent

**When to use:** Spawning a new agent in the colony.

```typeql
insert $a isa agent,
    has agent-id "agent-001",
    has agent-name "Scout Alpha",
    has caste "scout",
    has energy 100.0,
    has contribution-score 0.0,
    has reliability 0.5,
    has created-at 2026-02-11T00:00:00;
```

**Inference triggers:**
- `identify_elites()` function will classify if elite (contribution >= 100, reliability >= 0.8)
- `prevent_zombie_agents` rule will reject if energy <= 0 AND reliability < 0.5

---

### 1.2 UPDATE Agent Energy

**When to use:** After task execution (energy cost) or rest (energy recovery).

```typeql
match
    $a isa agent, has agent-id "agent-001",
        has energy $old_energy;
    let $new_energy = $old_energy - 10.0;
delete $old_energy of $a;
insert $a has energy $new_energy;
```

**Inference triggers:**
- `prevent_zombie_agents` rule checks if agent becomes invalid (energy <= 0)
- `at_risk_items()` function may now include this agent if energy drops below threshold

---

### 1.3 UPDATE Agent Contribution

**When to use:** After successful task completion.

```typeql
match
    $a isa agent, has agent-id "agent-001",
        has contribution-score $old_contrib;
    let $new_contrib = $old_contrib + 1.0;
delete $old_contrib of $a;
insert $a has contribution-score $new_contrib;
```

**Inference triggers:**
- `identify_elites()` may now classify agent as elite if contribution >= 100
- `total_contribution()` aggregate updates

---

### 1.4 DELETE Agent

**When to use:** Agent death (energy depleted, removed from colony).

```typeql
match
    $a isa agent, has agent-id "agent-001";
delete $a;
```

**Inference triggers:**
- All relations involving this agent are cascade-deleted
- Contribution records remain (historical)

---

## 2. Task Operations

### 2.1 INSERT Task

**When to use:** Creating a new task in the system.

```typeql
insert $t isa task,
    has task-id "TASK-001",
    has title "Implement pheromone decay",
    has description "Add periodic decay to all trail pheromones",
    has status "todo",
    has priority "P1",
    has importance 8,
    has estimated-effort 5,
    has effort-size "medium",
    has created-at 2026-02-11T00:00:00;
```

**Inference triggers:**
- `ready_tasks()` function will include this if no incomplete blockers exist
- `tasks_by_priority("P1")` will include this task
- `exploratory_tasks()` will include this if no pheromone trail leads to it

---

### 2.2 UPDATE Task Status

**When to use:** Task state transitions (todo -> in_progress -> complete).

```typeql
match
    $t isa task, has task-id "TASK-001",
        has status $old_status;
delete $old_status of $t;
insert $t has status "in_progress";
```

**Status values:** `"todo"`, `"in_progress"`, `"complete"`, `"blocked"`

**Inference triggers:**
- `ready_tasks()` excludes tasks not in "todo" status
- `attractive_tasks()` excludes non-todo tasks
- When set to "complete", dependents may become unblocked
- `count_by_status()` aggregates update

---

### 2.3 UPDATE Task Status to Complete (with timestamp)

**When to use:** Task completion.

```typeql
match
    $t isa task, has task-id "TASK-001",
        has status $old_status;
delete $old_status of $t;
insert $t has status "complete",
    has completed-at 2026-02-11T14:30:00;
```

**Inference triggers:**
- All tasks blocked by this task may now appear in `ready_tasks()`
- `category_completion()` percentage updates
- Pheromone trail reinforcement should follow (see Section 3)

---

### 2.4 INSERT Dependency

**When to use:** Creating a blocker relationship between tasks.

```typeql
match
    $blocker isa task, has task-id "TASK-001";
    $dependent isa task, has task-id "TASK-002";
insert (dependent: $dependent, blocker: $blocker) isa dependency;
```

**Inference triggers:**
- `ready_tasks()` will exclude $dependent until $blocker is complete
- `blockers_of("TASK-002")` will return TASK-001
- `dependents_of("TASK-001")` will return TASK-002

---

### 2.5 DELETE Dependency

**When to use:** Removing a blocker relationship (task no longer depends on another).

```typeql
match
    $blocker isa task, has task-id "TASK-001";
    $dependent isa task, has task-id "TASK-002";
    $dep (dependent: $dependent, blocker: $blocker) isa dependency;
delete $dep;
```

**Inference triggers:**
- `ready_tasks()` may now include $dependent if no other blockers exist

---

## 3. Pheromone Operations

Pheromone trails live on EDGES between tasks, not on tasks themselves. This is the core mechanism for colony memory.

### 3.1 INSERT Pheromone Trail

**When to use:** First time establishing a path between two tasks.

```typeql
match
    $from isa task, has task-id "TASK-A";
    $to isa task, has task-id "TASK-B";
insert (source-task: $from, destination-task: $to) isa pheromone-trail,
    has trail-pheromone 10.0,
    has alarm-pheromone 0.0,
    has completions 1,
    has failures 0;
```

**Inference triggers:**
- `trail_status($trail)` returns "fresh" (trail-pheromone >= 10.0 AND < 70.0 AND completions < 10)
- `attractive_tasks()` includes $to if trail-pheromone >= 50.0
- `exploratory_tasks()` no longer includes $to

---

### 3.2 REINFORCE Trail (+5.0)

**When to use:** After SUCCESSFUL completion of task sequence (A -> B worked).

```typeql
match
    $from isa task, has task-id "TASK-A";
    $to isa task, has task-id "TASK-B";
    $trail (source-task: $from, destination-task: $to) isa pheromone-trail,
        has trail-pheromone $old_tp,
        has completions $old_c;
    let $new_tp = $old_tp + 5.0;
    let $new_c = $old_c + 1;
delete $old_tp of $trail;
delete $old_c of $trail;
insert $trail has trail-pheromone $new_tp,
    has completions $new_c;
```

**Inference triggers:**
- `trail_status($trail)` returns "proven" when trail-pheromone >= 70.0 AND completions >= 10
- `attractive_tasks()` returns destination when trail-pheromone >= 50.0
- `superhighway_trails()` includes trail when proven

---

### 3.3 DEPOSIT Alarm (+8.0)

**When to use:** After FAILED task sequence (A -> B failed). Higher increment than reinforcement because failures are costly.

```typeql
match
    $from isa task, has task-id "TASK-A";
    $to isa task, has task-id "TASK-B";
    $trail (source-task: $from, destination-task: $to) isa pheromone-trail,
        has alarm-pheromone $old_ap,
        has failures $old_f;
    let $new_ap = $old_ap + 8.0;
    let $new_f = $old_f + 1;
delete $old_ap of $trail;
delete $old_f of $trail;
insert $trail has alarm-pheromone $new_ap,
    has failures $new_f;
```

**Inference triggers:**
- `repelled_tasks()` includes destination task when alarm-pheromone >= 30.0 AND alarm > trail

---

### 3.4 DECAY Trail Pheromone (0.95 multiplier)

**When to use:** Periodic decay cycle (e.g., every tick, every hour). Run on ALL trails.

```typeql
match
    $trail isa pheromone-trail,
        has trail-pheromone $old_tp;
    $old_tp > 0.0;
    let $new_tp = $old_tp * 0.95;
delete $old_tp of $trail;
insert $trail has trail-pheromone $new_tp;
```

**Why 0.95?** Trail pheromone decays slowly (5% per cycle). Successful paths persist longer, requiring sustained reinforcement to remain "proven".

**Inference triggers:**
- `proven-trail` may become `fresh-trail` if pheromone drops below 70.0
- `fresh-trail` may become `fading-trail` if pheromone drops below 10.0
- `fading-trail` may become `dead-trail` if pheromone drops to 0.0
- `attractive-task` status may be lost if pheromone drops below 50.0

---

### 3.5 DECAY Alarm Pheromone (0.80 multiplier)

**When to use:** Same periodic cycle as trail decay. Alarm decays FASTER.

```typeql
match
    $trail isa pheromone-trail,
        has alarm-pheromone $old_ap;
    $old_ap > 0.0;
    let $new_ap = $old_ap * 0.80;
delete $old_ap of $trail;
insert $trail has alarm-pheromone $new_ap;
```

**Why 0.80?** Alarm pheromone decays faster (20% per cycle). The colony "forgets" failures sooner than successes, allowing retry of previously-failed paths after conditions may have changed. This matches real ant biology: alarm pheromones are volatile compounds that evaporate quickly.

**Inference triggers:**
- `repelled-task` status may be lost if alarm drops below 30.0 or below trail level

---

### 3.6 COMBINED DECAY (Single Query)

**When to use:** Running both decays together for efficiency.

```typeql
match
    $trail isa pheromone-trail,
        has trail-pheromone $old_tp,
        has alarm-pheromone $old_ap;
    $old_tp > 0.0;
    let $new_tp = $old_tp * 0.95;
    let $new_ap = $old_ap * 0.80;
delete $old_tp of $trail;
delete $old_ap of $trail;
insert $trail has trail-pheromone $new_tp,
    has alarm-pheromone $new_ap;
```

---

## 4. Hypothesis Operations

### 4.1 INSERT Hypothesis

**When to use:** Creating a new hypothesis to test.

```typeql
insert $h isa hypothesis,
    has hypothesis-id "hyp-001",
    has hypothesis-statement "Dark mode increases session duration by 15%",
    has test-condition "Compare session_duration for dark vs light mode users",
    has hypothesis-status "pending",
    has observations-count 0,
    has success-count 0,
    has failure-count 0,
    has p-value 1.0,
    has generated-by "human",
    has action-if-confirmed "Enable dark mode as default",
    has created-at 2026-02-11T00:00:00;
```

**Inference triggers:**
- `pending_hypotheses()` includes this hypothesis
- `hypotheses_by_source("human")` includes this

---

### 4.2 INSERT Observation

**When to use:** Recording a test observation for a hypothesis.

```typeql
match
    $h isa hypothesis, has hypothesis-id "hyp-001";
insert $o isa observation,
    has observation-id "obs-001",
    has observed-at 2026-02-11T12:00:00,
    has outcome "success",
    has context-data "session_duration: 45min (dark), 38min (light)";
insert (hypothesis: $h, observation: $o) isa tests;
```

**Inference triggers:**
- Observation count should be updated separately (see 4.3)

---

### 4.3 UPDATE Hypothesis Observation Count

**When to use:** After adding observations, update the count.

```typeql
match
    $h isa hypothesis, has hypothesis-id "hyp-001",
        has observations-count $old_count;
    let $new_count = $old_count + 1;
delete $old_count of $h;
insert $h has observations-count $new_count;
```

**Inference triggers:**
- Status transitions may occur based on observation thresholds

---

### 4.4 UPDATE Hypothesis Status

**When to use:** Manual status transition or after statistical analysis.

```typeql
match
    $h isa hypothesis, has hypothesis-id "hyp-001",
        has hypothesis-status $old_status;
delete $old_status of $h;
insert $h has hypothesis-status "testing";
```

**Status values:** `"pending"`, `"testing"`, `"confirmed"`, `"rejected"`

**Inference triggers:**
- `active_tests()` includes hypotheses with status "testing"
- `is_action_ready($h)` returns true when status = "confirmed" AND p-value <= 0.05 AND observations >= 50

---

### 4.5 UPDATE Hypothesis p-value (Statistical Significance)

**When to use:** After running statistical analysis on observations.

```typeql
match
    $h isa hypothesis, has hypothesis-id "hyp-001",
        has p-value $old_p;
delete $old_p of $h;
insert $h has p-value 0.03;
```

**Inference triggers:**
- `hypothesis-action-ready` rule requires p-value <= 0.05
- `actionable_hypotheses()` includes hypothesis when action-ready = true

---

### 4.6 CONFIRM Hypothesis (Full Update)

**When to use:** Statistical test passed, hypothesis confirmed.

```typeql
match
    $h isa hypothesis, has hypothesis-id "hyp-001",
        has hypothesis-status $old_status,
        has p-value $old_p;
delete $old_status of $h;
delete $old_p of $h;
insert $h has hypothesis-status "confirmed",
    has p-value 0.02,
    has concluded-at 2026-02-11T18:00:00;
```

**Inference triggers:**
- `is_action_ready($h)` returns true if observations >= 50
- `action_ready_hypotheses()` includes this hypothesis

---

## 5. Frontier Operations

### 5.1 INSERT Frontier

**When to use:** Discovering a new exploration frontier (market, technology, user segment).

```typeql
insert $f isa exploration-frontier,
    has frontier-id "front-001",
    has frontier-type "technology",
    has frontier-description "WebGPU for client-side ML inference",
    has exploration-potential 0.8,
    has uncertainty-level 0.6,
    has discovery-probability 0.4,
    has resource-cost 100.0,
    has expected-value 0.32,
    has discovered-at 2026-02-11T00:00:00,
    has exploration-count 0,
    has frontier-status "unexplored";
```

**Expected Value Formula:** `expected_value = exploration_potential * discovery_probability / resource_cost`

**Inference triggers:**
- `promising_frontiers()` includes frontier if expected-value >= 0.5

---

### 5.2 UPDATE Frontier Expected Value

**When to use:** After new information changes the frontier's attractiveness.

```typeql
match
    $f isa exploration-frontier, has frontier-id "front-001",
        has expected-value $old_ev,
        has exploration-potential $potential,
        has discovery-probability $prob,
        has resource-cost $cost;
    let $new_ev = $potential * $prob / $cost;
delete $old_ev of $f;
insert $f has expected-value $new_ev;
```

**Inference triggers:**
- `promising_frontiers()` may now include or exclude this frontier

---

### 5.3 UPDATE Frontier Status

**When to use:** Status transitions as frontier is explored.

```typeql
match
    $f isa exploration-frontier, has frontier-id "front-001",
        has frontier-status $old_status,
        has exploration-count $old_count;
    let $new_count = $old_count + 1;
delete $old_status of $f;
delete $old_count of $f;
insert $f has frontier-status "exploring",
    has exploration-count $new_count,
    has last-explored 2026-02-11T10:00:00;
```

**Status values:** `"unexplored"`, `"exploring"`, `"exhausted"`

---

### 5.4 INSERT Autonomous Objective

**When to use:** Spawning an objective from a frontier (autonomous goal generation).

```typeql
match
    $f isa exploration-frontier, has frontier-id "front-001",
        has expected-value $ev;
insert $o isa autonomous-objective,
    has objective-id "obj-001",
    has objective-type "explore",
    has objective-description "Investigate WebGPU inference performance",
    has priority-score $ev,
    has generated-at 2026-02-11T00:00:00,
    has source-frontier-id "front-001",
    has allocated-resources 0.0,
    has progress 0.0,
    has objective-status "pending";
insert (frontier: $f, objective: $o) isa spawns;
```

**Inference triggers:**
- `active_objectives()` includes this objective
- This completes the colony loop: new objective becomes a task to classify

---

### 5.5 UPDATE Objective Progress

**When to use:** Tracking progress on an autonomous objective.

```typeql
match
    $o isa autonomous-objective, has objective-id "obj-001",
        has progress $old_progress,
        has objective-status $old_status;
    let $new_progress = $old_progress + 0.2;
delete $old_progress of $o;
delete $old_status of $o;
insert $o has progress $new_progress,
    has objective-status "active";
```

---

### 5.6 COMPLETE Objective

**When to use:** Objective finished.

```typeql
match
    $o isa autonomous-objective, has objective-id "obj-001",
        has progress $old_progress,
        has objective-status $old_status;
delete $old_progress of $o;
delete $old_status of $o;
insert $o has progress 1.0,
    has objective-status "complete",
    has objective-outcome "success",
    has completed-at 2026-02-11T20:00:00;
```

**Inference triggers:**
- `active_objectives()` no longer includes this objective
- Frontier may be marked "exhausted" if all objectives complete

---

## 6. Contribution Operations

### 6.1 INSERT Contribution Record

**When to use:** Recording a contribution by an agent or system.

```typeql
insert $c isa contribution,
    has contribution-id "contrib-001",
    has contributor-name "agent-001",
    has contribution-type "code",
    has contribution-timestamp 2026-02-11T14:00:00,
    has impact-score 3.5,
    has contribution-detail "Implemented pheromone decay function";
```

**Inference triggers:**
- `total_contribution("agent-001")` aggregates this
- `high_impact_contributions(3.0)` includes this
- `contributions_by_type("code")` includes this

---

### 6.2 INSERT Contribution Chain

**When to use:** Recording how one contribution enabled another (synergy tracking).

```typeql
match
    $contributor isa contribution, has contribution-id "contrib-001";
    $beneficiary isa contribution, has contribution-id "contrib-002";
insert (contributor: $contributor, beneficiary: $beneficiary) isa contribution-chain,
    has chain-value 2.5,
    has chain-type "direct";
```

**Chain types:** `"direct"`, `"indirect"`, `"synergistic"`

**Inference triggers:**
- `best_synergy()` function calculates total chain value between pairs

---

### 6.3 UPDATE Contribution Impact Score

**When to use:** Adjusting impact after retrospective analysis.

```typeql
match
    $c isa contribution, has contribution-id "contrib-001",
        has impact-score $old_score;
    let $new_score = $old_score + 1.5;
delete $old_score of $c;
insert $c has impact-score $new_score;
```

**Inference triggers:**
- `total_contribution()` aggregates update
- `high_impact_contributions()` threshold comparisons update

---

## Summary: The Colony Loop Operations

```
PERCEPTION (L1)
  INSERT agent → classify via identify_elites()

HOMEOSTASIS (L2)
  UPDATE agent energy → prevent_zombie_agents rule validates

HYPOTHESIS (L3)
  INSERT hypothesis → INSERT observation → UPDATE p-value
  → is_action_ready($h) returns true → pipeline materializes action-ready

TASK ALLOCATION (L4)
  INSERT task → INSERT dependency → ready_tasks() evaluates
  INSERT pheromone-trail → attractive_tasks() includes destination

CONTRIBUTION (L5)
  INSERT contribution → total_contribution() aggregates
  INSERT contribution-chain → best_synergy() calculates

EMERGENCE (L6)
  INSERT frontier → UPDATE expected-value → promising_frontiers()
  INSERT autonomous-objective → LOOP CLOSES → new entity needs PERCEPTION
```

---

## Pheromone Decay Schedule

Recommended decay cycle (run periodically):

| Cycle | Trail Decay | Alarm Decay | Biology Parallel |
|-------|-------------|-------------|------------------|
| Every tick | 0.95 (5%) | 0.80 (20%) | Continuous evaporation |
| Hourly | 0.95^60 | 0.80^60 | Trail maintenance required |
| Daily | Near-zero without reinforcement | Long forgotten | Colony forgets unused paths |

**Key insight:** The asymmetric decay (alarm faster than trail) means the colony forgets failures sooner than successes, encouraging retry of previously-failed paths after conditions change.

---

## TypeDB 3.0 Syntax Notes

| Operation | 3.0 Syntax | NOT 2.x |
|-----------|-----------|---------|
| Delete attribute | `delete $attr of $entity;` | ~~`delete $entity has attr $attr;`~~ |
| Let binding | `let $x = $a + $b;` | Supported in 3.0 |
| Integer type | `value integer` | ~~`value long`~~ |
| Functions | `fun name() -> type:` | ~~`rule name: when {} then {}`~~ for queries |

---

## Related Files

- `standalone/task-management.tql` - Full schema with pheromone trails
- `standalone/hypothesis-lifecycle.tql` - Hypothesis state machine
- `standalone/contribution-tracking.tql` - Contribution aggregates
- `standalone/autonomous-goals.tql` - Frontier and objective schema
- `README.md` - The Colony Loop overview
