# Lesson 3: Hypothesis Lifecycle

## State Machines via Inference

> **Biological Parallel:** Probabilistic Task Switching
>
> Ant task switching is probabilistic, not deterministic. An ant accumulates evidence (encounter frequency) until a threshold is crossed. The transition is a state machine driven by accumulated observations.

| | |
|---|---|
| **Difficulty** | Intermediate |
| **Prerequisites** | [Lesson 2: Homeostasis](02-homeostasis.md) |
| **Next** | [Lesson 4: Task Allocation](04-task-allocation.md) |
| **Standalone TQL** | `standalone/hypothesis-lifecycle.tql` |

---

## What You Will Learn

How to model a **state machine** in TypeDB where transitions happen via inference.

A hypothesis moves from "proposed" to "confirmed" automatically when it has enough observations and statistical significance. No manual state updates — the database infers the transition.

---

## The Biology

From Chapter 2 of *Ants at Work*:

An ant doesn't switch tasks after exactly N encounters — it **accumulates evidence** (encounter frequency) until a probabilistic threshold is crossed. The transition from "performing task A" to "performing task B" is a state machine driven by accumulated observations.

In TypeDB: a hypothesis accumulates observations and transitions through states:
- `pending` → `testing` → `confirmed` (or `rejected`)

The "action-ready" rule fires only when:
- p-value <= 0.05 AND
- observations >= 50

This prevents premature transitions, just as ants require sustained encounter rates before committing.

---

## Use Cases

- A/B testing frameworks
- Scientific experiment tracking
- Feature flag evaluation
- ML experiment management
- Product hypothesis validation

---

## The Schema

```typeql
define

entity hypothesis,
    owns hypothesis-id @key,
    owns hypothesis-statement,     # "Users who see banner X convert 20% more"
    owns test-condition,           # How to test it
    owns hypothesis-status,        # "pending", "testing", "confirmed", "rejected"
    owns observations-count,       # Total observations
    owns success-count,
    owns failure-count,
    owns p-value,                  # Statistical significance
    owns confidence-level,         # 0.0 - 1.0
    owns action-if-confirmed,      # What to do if true
    owns action-ready,             # INFERRED: ready for action?
    owns created-at,
    owns concluded-at,
    plays tests:hypothesis;

attribute hypothesis-id, value string;
attribute hypothesis-statement, value string;
attribute test-condition, value string;
attribute hypothesis-status, value string;
attribute observations-count, value integer;
attribute success-count, value integer;
attribute failure-count, value integer;
attribute p-value, value double;
attribute confidence-level, value double;
attribute action-if-confirmed, value string;
attribute action-ready, value boolean;
attribute created-at, value datetime;
attribute concluded-at, value datetime;

# Observation records linked to hypotheses
entity observation,
    owns observation-id @key,
    owns observed-at,
    owns outcome,                  # "success", "failure"
    owns context-data,
    plays tests:observation;

relation tests,
    relates hypothesis,
    relates observation;
```

---

## Rule 1: Promote to Testing

When a hypothesis has enough initial observations (>= 10), it moves from "pending" to "testing".

```typeql
rule promote-to-testing:
    when {
        $h isa hypothesis,
            has hypothesis-status "pending",
            has observations-count $obs;
        $obs >= 10;
    } then {
        $h has hypothesis-status "testing";
    };
```

---

## Rule 2: Confirm Hypothesis

When p-value is significant AND we have enough observations:

```typeql
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
```

---

## Rule 3: Reject Hypothesis

When p-value shows no significance after sufficient observations:

```typeql
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
```

---

## Rule 4: Action Ready

A confirmed hypothesis with high confidence is ready for action:

```typeql
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

## The State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   PENDING ──────────────────→ TESTING ──────────────────→ CONFIRMED         │
│      │        obs >= 10          │        p <= 0.05          │              │
│      │                           │        obs >= 100         │              │
│      │                           │                           ▼              │
│      │                           │                      ACTION-READY        │
│      │                           │                      (conf >= 0.95)      │
│      │                           │                                          │
│      │                           └──────────────────────→ REJECTED          │
│      │                                    p > 0.20                          │
│      │                                    obs >= 100                        │
│      │                                                                      │
│   No manual state updates. The database infers transitions.                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Test Queries

```typeql
# Get hypotheses ready for action
match $h isa hypothesis, has action-ready true; select $h;

# Get confirmed hypotheses
match $h isa hypothesis, has hypothesis-status "confirmed"; select $h;

# Get rejected hypotheses
match $h isa hypothesis, has hypothesis-status "rejected"; select $h;

# Count observations for a hypothesis
match
    $h isa hypothesis, has hypothesis-id "hyp-001";
    $test (hypothesis: $h, observation: $obs) isa tests;
reduce $count = count($obs);
```

---

## Biological Mapping

| Concept | Ant Colony | TypeDB |
|---------|-----------|--------|
| **Evidence Accumulation** | Encounter frequency | observations-count |
| **Threshold Crossing** | Task switch trigger | Rule conditions |
| **Probabilistic Decision** | Not exact N encounters | p-value + count combo |
| **State Transition** | Task A → Task B | status: pending → confirmed |

---

## The Key Insight

State machines in TypeDB don't require explicit transition code. You define:
1. The states (attribute values)
2. The conditions for transition (rule `when` clauses)
3. The new state (rule `then` clauses)

The database handles the rest. When data changes, rules fire, states transition.

---

## Next Step

Now that we can model state machines, we need to handle **dependencies**.

In [Lesson 4: Task Allocation](04-task-allocation.md), we learn the NEGATION pattern — finding tasks that are ready because they have NO incomplete blockers. This is exactly how ants allocate work: sensing what's NOT being done.

---

## Complete TQL

For the complete standalone TypeQL file, see [`standalone/hypothesis-lifecycle.tql`](../standalone/hypothesis-lifecycle.tql).
