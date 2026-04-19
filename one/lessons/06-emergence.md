# Lesson 6: Emergence

## Autonomous Goal Generation

> **Biological Parallel:** Collective Intelligence Without Central Control
>
> No ant decides what the colony should do. Yet the colony adapts its task distribution to changing conditions — allocating more foragers when food is abundant, more defenders when threats increase. Goals EMERGE from interaction.

| | |
|---|---|
| **Difficulty** | Advanced |
| **Prerequisites** | [Lessons 1-5](one/lessons/README.md) |
| **Next** | [Domain Examples](../examples/) |
| **Standalone TQL** | `standalone/autonomous-goals.tql` |

---

## What You Will Learn

The capstone pattern. Systems that **generate their own objectives** by combining everything from Lessons 1-5:

- Classification (frontiers)
- Rules (auto-promotion)
- State machines (goal lifecycle)
- Negation (unexplored detection)
- Aggregation (expected value)

---

## The Biology

From Chapter 2 of *Ants at Work*:

No ant decides what the colony should do. Yet the colony as a whole adapts:
- More foragers when food is abundant
- More nest maintenance after disturbance
- More patrollers when threats increase

**Goals EMERGE from the interaction of simple agents following local rules.**

In TypeDB: exploration frontiers are detected (classification), evaluated (quality rules), tested (hypothesis lifecycle), scheduled (task management), measured (contribution tracking) — and objectives spawn AUTONOMOUSLY from the combination.

---

## Use Cases

- Autonomous AI agents (self-directed exploration)
- Research portfolio management (frontier detection)
- Product discovery (opportunity scoring)
- Exploration vs exploitation balancing
- Self-improving systems

---

## The Schema

```typeql
define

# --- Exploration Frontiers ---
entity exploration-frontier,
    owns frontier-id @key,
    owns frontier-type,            # "market", "technology", "user_segment"
    owns frontier-description,
    owns exploration-potential,    # 0.0 - 1.0
    owns uncertainty-level,        # 0.0 - 1.0
    owns discovery-probability,    # P(valuable | explore)
    owns resource-cost,            # estimated cost to explore
    owns expected-value,           # potential * probability / cost
    owns frontier-status,          # "unexplored", "exploring", "exhausted"
    plays spawns:frontier;

# --- Autonomous Objectives ---
entity autonomous-objective,
    owns objective-id @key,
    owns objective-type,           # "explore", "optimize", "validate"
    owns objective-description,
    owns priority-score,           # 0.0 - 1.0 (from expected value)
    owns generated-at,
    owns source-frontier-id,
    owns progress,                 # 0.0 - 1.0
    owns objective-outcome,        # "success", "failure", "partial"
    owns objective-status,         # "pending", "active", "complete"
    plays spawns:objective;

# --- Curiosity Signals ---
entity curiosity-signal,
    owns signal-id @key,
    owns signal-type,              # "gap_detected", "plateau", "anomaly"
    owns trigger-condition,
    owns triggered-at,
    owns intensity,                # 0.0 - 1.0
    owns resolved;

# Frontiers spawn objectives
relation spawns,
    relates frontier,
    relates objective;
```

---

## Frontier Classification

### High-Value Unexplored Frontiers

```typeql
fun promising_frontiers() -> { exploration-frontier }:
    match
        $f isa exploration-frontier,
            has frontier-status "unexplored",
            has expected-value $ev;
        $ev >= 0.5;
    return { $f };
```

### Expected Value Calculation

```
expected_value = (exploration_potential * discovery_probability) / resource_cost
```

High potential + high probability + low cost = high expected value.

---

## Curiosity Signals

Curiosity signals trigger exploration. They're the colony's way of saying "something interesting here."

```typeql
# Unresolved signals needing attention
fun unresolved_signals() -> { curiosity-signal }:
    match
        $s isa curiosity-signal, has resolved false;
    return { $s };

# High-intensity signals (urgent curiosity)
fun urgent_signals($threshold: double) -> { curiosity-signal }:
    match
        $s isa curiosity-signal,
            has resolved false,
            has intensity $i;
        $i >= $threshold;
    return { $s };
```

---

## Autonomous Objective Spawning

### Rule: Spawn Objective from Frontier

When a frontier is unexplored AND has high expected value, spawn an objective:

```typeql
rule spawn-exploration-objective:
    when {
        $f isa exploration-frontier,
            has frontier-status "unexplored",
            has expected-value $ev,
            has frontier-id $fid;
        $ev >= 0.5;
        not {
            $spawn (frontier: $f, objective: $o) isa spawns;
        };
    } then {
        # This would be an insert in practice, but shows the pattern
        $f has frontier-status "exploring";
    };
```

### Rule: Complete Objective

When an objective reaches 100% progress:

```typeql
rule complete-objective:
    when {
        $o isa autonomous-objective,
            has objective-status "active",
            has progress $p;
        $p >= 1.0;
    } then {
        $o has objective-status "complete";
    };
```

---

## The Emergence Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   CURIOSITY SIGNAL ──────→ FRONTIER DETECTED ──────→ OBJECTIVE SPAWNED     │
│         │                        │                         │                │
│         │                        │                         │                │
│   "gap_detected"            "unexplored"               "explore"            │
│   "plateau"                 EV >= 0.5                  priority set         │
│   "anomaly"                                                                 │
│         │                        │                         │                │
│         │                        │                         ▼                │
│         │                        │                    EXECUTION             │
│         │                        │                         │                │
│         │                        │                         ▼                │
│         │                        │                    OUTCOME               │
│         │                        │                   /       \              │
│         │                        │              success    failure          │
│         │                        │                 │          │             │
│         │                        │                 ▼          ▼             │
│         │                        │            FRONTIER    FRONTIER          │
│         │                        │            EXHAUSTED   RE-EVALUATE       │
│         │                        │                                          │
│   No central planner. Objectives emerge from the interaction of patterns.  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Self-Model Snapshots

Track the colony's health over time:

```typeql
entity self-model-snapshot,
    owns snapshot-id @key,
    owns captured-at,
    owns overall-health,           # composite score
    owns active-objectives,
    owns learning-velocity,        # rate of improvement
    owns improvement-acceleration; # rate of rate of improvement

# Query improvement trend
fun improving_trend() -> boolean:
    match
        $s1 isa self-model-snapshot, has learning-velocity $v1;
        $s2 isa self-model-snapshot, has learning-velocity $v2;
        $s2 has captured-at $t2;
        $s1 has captured-at $t1;
        $t2 > $t1;
        $v2 > $v1;
    return true;
```

---

## Test Queries

```typeql
# Get promising unexplored frontiers
match let $f in promising_frontiers();
    $f has frontier-description $d, has expected-value $ev;
select $d, $ev;

# Get active objectives
match
    $o isa autonomous-objective,
        has objective-status "active",
        has objective-description $d,
        has progress $p;
select $d, $p;

# Get unresolved curiosity signals
match let $s in unresolved_signals();
    $s has signal-type $type, has intensity $i;
select $type, $i;
```

---

## Biological Mapping

| Concept | Ant Colony | TypeDB |
|---------|-----------|--------|
| **Curiosity** | Novel stimulus detection | curiosity-signal |
| **Frontier** | Unexplored territory | exploration-frontier |
| **Objective** | Task to perform | autonomous-objective |
| **Selection** | Response threshold | expected-value threshold |
| **Adaptation** | Colony task shift | objective spawning |
| **Self-Model** | Colony state awareness | self-model-snapshot |

---

## The Significance

When you scale to billions of agents, the **Inference Functions** become the "laws of physics" for social and economic interactions.

Instead of a central server telling everyone what to do:
- Each agent senses curiosity signals
- Each agent evaluates frontiers
- Each agent takes on objectives
- Global adaptation results from local decisions

**We are not building intelligence. We are building the CONDITIONS where intelligence evolves.**

---

## Complete Integration

This lesson combines ALL previous patterns:

| Lesson | Pattern | Used For |
|--------|---------|----------|
| 1 | Classification | Frontier tiering |
| 2 | Quality Rules | Validity constraints |
| 3 | State Machines | Objective lifecycle |
| 4 | Negation | Unexplored detection |
| 5 | Aggregation | Expected value |
| 6 | **Emergence** | Autonomous goals |

---

## Next Steps

You've completed the curriculum. Now apply these patterns:

1. **[Domain Examples](../examples/)** — See patterns in e-commerce, IoT, social, supply chain
2. **Build Your Own** — Create a schema for your domain
3. **Deploy** — Load into TypeDB Cloud, connect your agents
4. **Watch** — Let intelligence emerge

---

## The Thesis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   Everyone has agents. No one has emergence.                                │
│                                                                              │
│   We're not building intelligence.                                          │
│   We're building the CONDITIONS where intelligence evolves.                  │
│                                                                              │
│   The substrate is our habitat.                                             │
│   Intelligence is our harvest.                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete TQL

For the complete standalone TypeQL file, see [`standalone/autonomous-goals.tql`](../standalone/autonomous-goals.tql).
