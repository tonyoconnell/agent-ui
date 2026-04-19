# Lesson 5: Contribution Tracking

## Parameterized Aggregates and Multi-Variable Returns

> **Biological Parallel:** Interaction Rate Measurement
>
> Ant colonies measure task demand by encounter frequency. The colony "knows" which tasks need more workers by tracking how often task-specific ants are encountered.

| | |
|---|---|
| **Difficulty** | Intermediate+ |
| **Prerequisites** | [Lesson 4: Task Allocation](04-task-allocation.md) |
| **Next** | [Lesson 6: Emergence](06-emergence.md) |
| **Standalone TQL** | `standalone/contribution-tracking.tql` |

---

## What You Will Learn

- **Parameterized Functions** — Pass arguments to functions for targeted queries
- **Aggregate Functions** — Sum, count, average over filtered results
- **Multi-Variable Returns** — Return multiple computed values from one function
- **Contribution Metrics** — Track and measure individual/team contributions

---

## The Biology

From Chapter 2 of *Ants at Work*:

Ant colonies measure task demand by **encounter frequency**. If a forager encounters many other foragers, it signals food abundance — fewer foragers needed. If it encounters few foragers, more are needed.

In TypeDB: we aggregate contributions to measure demand, track impact, and compute totals dynamically.

---

## Use Cases

- Open source contributor tracking
- Team performance measurement
- Resource allocation based on contribution
- Reputation systems
- Token distribution by participation

---

## The Schema

```typeql
define

entity contributor,
    owns contributor-id @key,
    owns contributor-name,
    owns contributor-type,         # "human", "bot", "team"
    owns total-contributions,      # COMPUTED or cached
    owns contribution-rank,        # "elite", "active", "occasional"
    plays contribution:contributor-role;

entity contribution,
    owns contribution-id @key,
    owns contribution-type,        # "code", "review", "docs", "support"
    owns impact-score,             # 0.0 - 100.0
    owns timestamp,
    owns project-id,
    plays contribution:contribution-item;

relation contribution,
    relates contributor-role,
    relates contribution-item;

attribute contributor-id, value string;
attribute contributor-name, value string;
attribute contributor-type, value string;
attribute total-contributions, value integer;
attribute contribution-rank, value string;
attribute contribution-id, value string;
attribute contribution-type, value string;
attribute impact-score, value double;
attribute timestamp, value datetime;
attribute project-id, value string;
```

---

## Parameterized Functions

### Total Contribution by Name

Pass a contributor name, get their total impact:

```typeql
fun total_contribution($name: string) -> double:
    match
        $c isa contributor, has contributor-name $name;
        $rel (contributor-role: $c, contribution-item: $contrib) isa contribution;
        $contrib has impact-score $i;
    return sum($i);
```

### Contribution Count by Type

```typeql
fun count_by_type($type: string) -> integer:
    match
        $contrib isa contribution, has contribution-type $type;
    return count($contrib);
```

### Average Impact by Project

```typeql
fun avg_impact_for_project($project: string) -> double:
    match
        $contrib isa contribution,
            has project-id $project,
            has impact-score $i;
    return mean($i);
```

---

## Multi-Result Functions

### Top Contributors

Return contributors with impact above threshold:

```typeql
fun top_contributors($threshold: double) -> { contributor }:
    match
        $c isa contributor;
        $rel (contributor-role: $c, contribution-item: $contrib) isa contribution;
        $contrib has impact-score $i;
        $i >= $threshold;
    return { $c };
```

### Elite Contributors

Contributors with both high volume AND high impact:

```typeql
fun elite_contributors() -> { contributor }:
    match
        $c isa contributor,
            has total-contributions $total,
            has contribution-rank "elite";
        $total >= 50;
    return { $c };
```

---

## Inference Rules for Ranking

### Rank by Contribution Count

```typeql
rule elite-contributor:
    when {
        $c isa contributor,
            has total-contributions $t;
        $t >= 100;
    } then {
        $c has contribution-rank "elite";
    };

rule active-contributor:
    when {
        $c isa contributor,
            has total-contributions $t;
        $t >= 20;
        $t < 100;
    } then {
        $c has contribution-rank "active";
    };

rule occasional-contributor:
    when {
        $c isa contributor,
            has total-contributions $t;
        $t < 20;
    } then {
        $c has contribution-rank "occasional";
    };
```

---

## Leaderboard Queries

```typeql
# Top 10 contributors by total impact
match
    $c isa contributor, has contributor-name $name;
    $rel (contributor-role: $c, contribution-item: $contrib) isa contribution;
    $contrib has impact-score $i;
reduce $total = sum($i) group $name;
sort $total desc;
limit 10;

# Contributions this month
match
    $contrib isa contribution,
        has timestamp $t,
        has impact-score $i;
    $t >= 2026-02-01T00:00:00;
reduce $count = count($contrib), $total_impact = sum($i);

# Most impactful contribution type
match
    $contrib isa contribution,
        has contribution-type $type,
        has impact-score $i;
reduce $avg = mean($i) group $type;
sort $avg desc;
```

---

## Biological Mapping

| Concept | Ant Colony | TypeDB |
|---------|-----------|--------|
| **Encounter Rate** | How often task type seen | Contribution count |
| **Task Demand** | Need for more workers | Impact threshold |
| **Colony Memory** | Aggregate encounters | sum(), count() |
| **Response Threshold** | When to switch tasks | Ranking thresholds |

---

## Test Queries

```typeql
# Get total impact for a specific contributor
match let $total = total_contribution("alice"); select $total;

# Count code contributions
match let $count = count_by_type("code"); select $count;

# Get elite contributors
match let $c in elite_contributors(); $c has contributor-name $n; select $n;

# Average impact for project
match let $avg = avg_impact_for_project("colony-core"); select $avg;
```

---

## The Key Insight

Parameterized aggregates let you ask **targeted questions**:
- "How much has Alice contributed?" vs "How much has ANYONE contributed?"
- "What's the average for THIS project?" vs "What's the overall average?"

The colony needs to measure demand at granular levels to allocate resources efficiently.

---

## Next Step

We've built all the components:
1. **Identity** (Lesson 1: Perception)
2. **Boundaries** (Lesson 2: Homeostasis)
3. **State Machines** (Lesson 3: Hypothesis)
4. **Dependencies** (Lesson 4: Task Allocation)
5. **Measurement** (Lesson 5: Contribution)

In [Lesson 6: Emergence](06-emergence.md), we combine everything. Systems that generate their own objectives. Autonomous goal setting. The superorganism.

---

## Complete TQL

For the complete standalone TypeQL file, see [`standalone/contribution-tracking.tql`](../standalone/contribution-tracking.tql).
