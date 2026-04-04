# Lesson 2: Homeostasis

## Quality Rules for Colony Integrity

> **Biological Parallel:** The Immune System + Response Thresholds
>
> Just as biological systems trigger apoptosis (cell death) for corrupted cells, the database rejects invalid states. And like ants with different response thresholds, rules fire at different levels to create quality bands.

| | |
|---|---|
| **Difficulty** | Beginner-Intermediate |
| **Prerequisites** | [Lesson 1: Perception](./01-perception.md) |
| **Next** | [Lesson 3: Hypothesis Lifecycle](./03-hypothesis.md) |
| **Standalone TQL** | `standalone/quality-rules.tql` |

---

## What You Will Learn

Two complementary patterns:

1. **Quality Bands** — Rules that automatically classify entities into tiers (high/medium/low) based on thresholds
2. **Constraint Rules** — Rules that reject invalid states entirely (the immune system)

The colony must both classify AND reject. Classification tells you what something is. Rejection prevents what something cannot be.

---

## The Biology

### Response Thresholds

From Chapter 2 of *Ants at Work*:

Individual ants have different **response thresholds** for switching tasks. Some ants switch at low encounter rates (sensitive), others require many encounters before switching (persistent). These thresholds create bands.

In TypeDB: inference rules fire automatically at different thresholds:
- High quality >= 0.7
- Medium quality >= 0.4
- Low quality < 0.4

The key insight: **mutually exclusive bands prevent oscillation**. An entity is classified once, not constantly reclassified.

### The Immune System

In ant colonies, homeostasis manifests through:

- **Larval Care:** Keeping brood at exact temperature and humidity
- **Disease Rejection:** Removing sick or dead individuals
- **Resource Balance:** Maintaining optimal ratios

The colony has an "immune system" that constantly monitors for violations.

---

## Use Cases

**Quality Classification:**
- Learning system quality tracking (high/medium/low)
- Content moderation tiers
- Service level classification
- Performance review bands

**Constraint Enforcement:**
- Zombie Prevention: Dead agents cannot have high reliability
- Energy Conservation: Agents cannot contribute if they have no energy
- Data Quality: Rejecting spam, dust, or invalid entries

---

## Part 1: Quality Classification Rules

### The Schema

```typeql
define

entity learning-record,
    owns record-id @key,
    owns record-type,          # "insight", "rule", "hypothesis"
    owns source-system,        # which system generated this
    owns applied,              # has this been put into practice?
    owns effectiveness,        # 0.0 - 1.0 (measured after application)
    owns quality-label,        # "high", "medium", "low" (INFERRED)
    owns cascade-potential,    # does this lead to further learnings? (INFERRED)
    owns insight-text,
    plays learning-chain:source,
    plays learning-chain:derived;

attribute record-id, value string;
attribute record-type, value string;
attribute source-system, value string;
attribute applied, value boolean;
attribute effectiveness, value double;
attribute quality-label, value string;
attribute cascade-potential, value boolean;
attribute insight-text, value string;

# Chain of derived learnings
relation learning-chain,
    relates source,
    relates derived,
    owns chain-strength;

attribute chain-strength, value double;
```

---

### Rule 1: High Quality (>= 70%)

Applied learnings with effectiveness >= 70% are high quality.

```typeql
rule high-quality-record:
    when {
        $r isa learning-record,
            has applied true,
            has effectiveness $e;
        $e >= 0.7;
    } then {
        $r has quality-label "high";
    };
```

---

### Rule 2: Medium Quality (40-70%)

Note the **UPPER BOUND** (`< 0.7`) prevents overlap with high quality.

```typeql
rule medium-quality-record:
    when {
        $r isa learning-record,
            has applied true,
            has effectiveness $e;
        $e >= 0.4;
        $e < 0.7;
    } then {
        $r has quality-label "medium";
    };
```

---

### Rule 3: Low Quality (< 40%)

```typeql
rule low-quality-record:
    when {
        $r isa learning-record,
            has applied true,
            has effectiveness $e;
        $e < 0.4;
    } then {
        $r has quality-label "low";
    };
```

---

### Rule 4: Cascade Detection (Chained Rules)

A learning has cascade potential when:
1. It is high quality (derived by rules above)
2. It led to ANOTHER high-quality learning

This demonstrates **CHAINED INFERENCE**: Rule 4 depends on Rules 1-3. TypeDB resolves the dependency automatically.

```typeql
rule cascade-detected:
    when {
        $source isa learning-record, has quality-label "high";
        $chain (source: $source, derived: $derived) isa learning-chain;
        $derived isa learning-record, has quality-label "high";
    } then {
        $source has cascade-potential true;
    };
```

---

## Part 2: Constraint Rules (The Immune System)

These rules prevent invalid states from existing at all.

### Rule: Zombie Prevention

An agent cannot be "Reliable" if it has zero energy. This prevents "zombie" agents from corrupting the hive logic.

```typeql
# Building on Lesson 1's agent entity
rule prevent_zombie_agents:
    when {
        $a isa agent,
            has reliability-score $r,
            has energy-level 0.0;
        $r > 0.5;
    }
    then {
        # In TypeDB 3.0, constraint violations reject the transaction
        reject;
    };
```

### Rule: Conservation of Energy

An agent cannot contribute value if it has no energy. Work requires fuel.

```typeql
rule physics_conservation:
    when {
        $a isa agent,
            has contribution-rate $c,
            has energy-level 0.0;
        $c > 0.0;
    }
    then {
        reject;
    };
```

### Rule: Trust Requires Action

An agent with zero contribution cannot have high reliability. Trust is earned.

```typeql
rule trust_requires_action:
    when {
        $a isa agent,
            has contribution-rate 0.0,
            has reliability-score $r;
        $r > 0.8;
    }
    then {
        reject;
    };
```

---

## How Classification Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   INSERT: learning-record with effectiveness = 0.85                         │
│                     │                                                        │
│                     ▼                                                        │
│   RULE high-quality-record FIRES (0.85 >= 0.7)                              │
│                     │                                                        │
│                     ▼                                                        │
│   INFERRED: quality-label = "high"                                          │
│                                                                              │
│   No manual labeling. Classification EMERGES from attributes.               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## How Rejection Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   1. ATTEMPT: Insert agent with energy-level=0.0, reliability-score=0.9     │
│                                                                              │
│   2. DETECTION: Rule prevent_zombie_agents fires (conditions match)         │
│                                                                              │
│   3. REJECTION: The transaction is rejected — immune system responds        │
│                                                                              │
│   4. PROTECTION: Invalid data never enters the system                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Test Queries

### Quality Classification

```typeql
# Get high-quality learnings (quality-label is inferred, not inserted)
match $r isa learning-record, has quality-label "high"; select $r;

# Find cascade learnings
match $r isa learning-record, has cascade-potential true; select $r;

# Count by quality
match $r isa learning-record, has quality-label "high";
reduce $n = count($r);
```

### Immune System Tests

```typeql
# This should SUCCEED (valid agent)
insert $a isa agent,
    has agent-id "healthy_001",
    has energy-level 90.0,
    has contribution-rate 0.85,
    has reliability-score 0.95;

# This should FAIL (zombie - dead but reliable)
insert $a isa agent,
    has agent-id "zombie_002",
    has energy-level 0.0,
    has contribution-rate 0.0,
    has reliability-score 0.99;
# Expected: Transaction rejected by rule prevent_zombie_agents
```

---

## Biological Mapping

| Concept | Ant Colony | TypeDB |
|---------|-----------|--------|
| **Response Thresholds** | Task-switching sensitivity | Rule thresholds (0.7, 0.4) |
| **Quality Bands** | Caste specialization levels | high/medium/low labels |
| **Immune Response** | Removing diseased individuals | Rule rejection |
| **Homeostasis** | Temperature regulation | Constraint enforcement |
| **Apoptosis** | Cell death for corrupted cells | Transaction rollback |

---

## The Key Insight

**Population variance in thresholds is ESSENTIAL.**

If all rules fire at the same threshold, the system can't distinguish signal from noise. Different thresholds create the bands that enable stable classification.

In Lesson 1, we said "This is what an Elite item looks like."

In Lesson 2, we say:
- "These are the quality bands for classification" (Part 1)
- "These are the laws that can NEVER be violated" (Part 2)

Together, they form a complete classification system.

---

## Why This Matters at Scale

When you have billions of agents, you cannot manually validate each one. The rules become the **distributed immune system**:

- Every write is validated against the rules
- Invalid states are automatically rejected
- Quality labels are automatically inferred
- The system maintains integrity without central oversight

---

## Load This Lesson

```bash
typedb console --cloud your-cluster.typedb.com:80
> transaction my-db schema write
> source standalone/quality-rules.tql
> commit
```

---

## Next Step

Now that we have identity (Lesson 1) and boundaries (Lesson 2), we need to model **change over time**.

In [Lesson 3: Hypothesis Lifecycle](./03-hypothesis.md), we model state machines using inference rules. Hypotheses move from "proposed" to "testing" to "validated" or "rejected" — the colony's scientific method.

---

## Complete TQL

For the complete standalone TypeQL file, see [`standalone/quality-rules.tql`](../standalone/quality-rules.tql).
